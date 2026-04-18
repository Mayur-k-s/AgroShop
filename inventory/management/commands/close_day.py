"""
inventory/management/commands/close_day.py
──────────────────────────────────────────
Management command that snapshots a day's sales + expenses into the
DailyReport table and marks it as finalized.

Usage
─────
  # Snapshot yesterday automatically (run from cron at 23:59)
  python manage.py close_day

  # Snapshot a specific date
  python manage.py close_day --date 2026-04-17

  # Re-snapshot even if already finalized (force overwrite)
  python manage.py close_day --date 2026-04-17 --force

Cron (runs every night at 23:59 IST)
─────────────────────────────────────
  59 23 * * * cd /Users/mayur/Desktop/AgroShop && source venv/bin/activate && python manage.py close_day >> /tmp/agroshop_close_day.log 2>&1
"""

import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum

from inventory.models import Sale, SaleItem, Expense, DailyReport


def build_daily_snapshot(report_date):
    """
    Calculates the complete daily report for `report_date`.
    Returns (summary_dict, sales_list, expenses_list).
    Mirrors the profit logic from get_todays_report / get_daily_report.
    """
    # ── Sales ────────────────────────────────────────────────────────────
    sales_qs = (
        Sale.objects
        .filter(date_time__date=report_date)
        .prefetch_related('saleitem_set__batch__variant__product__category')
        .order_by('date_time')
    )

    total_revenue = Decimal(0)
    total_profit  = Decimal(0)
    sales_data    = []

    for sale in sales_qs:
        local_dt    = timezone.localtime(sale.date_time)
        bill_items  = []
        bill_profit = Decimal(0)

        for item in sale.saleitem_set.all():
            sp  = Decimal(str(item.selling_price))
            qty = Decimal(str(item.quantity_sold))

            batch_price = item.batch.purchase_price if item.batch else Decimal(0)
            batch_vol   = (
                Decimal(str(item.batch.variant.volume_value))
                if (item.batch and item.batch.variant and item.batch.variant.volume_value > 0)
                else Decimal(1)
            )

            if item.is_loose_sale:
                snapshot_cp = Decimal(str(item.cost_price_snapshot or 0))
                cp_per_unit = (
                    snapshot_cp if snapshot_cp > 0
                    else (batch_price / batch_vol if batch_vol > 0 else Decimal(0))
                )
                item_profit = (sp - cp_per_unit) * qty
            else:
                cp = Decimal(str(item.cost_price_snapshot or batch_price))
                item_profit = (sp - cp) * qty

            bill_profit += item_profit

            unit = 'Kg' if item.is_loose_sale else 'Pkt'
            bill_items.append({
                'product':  item.product_name_snapshot or (
                    item.batch.variant.product.name if item.batch else 'Unknown'
                ),
                'variant':  item.batch.variant.size_label if item.batch else '',
                'qty':      float(qty),
                'unit':     unit,
                'rate':     float(sp),
                'total':    float(sp * qty),
                'is_loose': item.is_loose_sale,
            })

        total_revenue += sale.total_amount
        total_profit  += bill_profit

        sales_data.append({
            'sale_id':    sale.id,
            'time':       local_dt.strftime('%I:%M %p'),
            'datetime':   local_dt.isoformat(),
            'items':      bill_items,
            'bill_total': float(sale.total_amount),
            'bill_profit': float(bill_profit),
            'is_loan':    sale.loan_id is not None,
        })

    # ── Expenses ─────────────────────────────────────────────────────────
    expenses_qs    = Expense.objects.filter(date__date=report_date).order_by('id')
    total_expenses = Decimal(0)
    expenses_data  = []

    for exp in expenses_qs:
        total_expenses += Decimal(str(exp.amount))
        expenses_data.append({
            'id':       exp.id,
            'category': exp.category,
            'note':     exp.note or '',
            'amount':   float(exp.amount),
            'date':     report_date.strftime('%d-%m-%Y'),
        })

    summary = {
        'revenue':        float(total_revenue),
        'profit':         float(total_profit),
        'bill_count':     len(sales_data),
        'total_expenses': float(total_expenses),
        'net':            float(total_revenue - total_expenses),
    }

    return summary, sales_data, expenses_data


class Command(BaseCommand):
    help = 'Snapshot a day\'s sales + expenses into DailyReport and mark it finalized.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Date to snapshot in YYYY-MM-DD format. Defaults to yesterday.',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            default=False,
            help='Re-snapshot even if DailyReport already exists and is finalized.',
        )

    def handle(self, *args, **options):
        # Determine target date
        date_str = options['date']
        if date_str:
            try:
                report_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                self.stderr.write(self.style.ERROR(f'Invalid date: {date_str}. Use YYYY-MM-DD.'))
                return
        else:
            # Default to yesterday (so the full day is complete by the time cron runs at 23:59)
            local_now   = timezone.localtime(timezone.now())
            report_date = local_now.date() - datetime.timedelta(days=1)

        force = options['force']

        # Check if already finalized
        existing = DailyReport.objects.filter(date=report_date).first()
        if existing and existing.is_finalized and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'Report for {report_date} is already finalized. Use --force to overwrite.'
                )
            )
            return

        self.stdout.write(f'📊 Building snapshot for {report_date}…')

        summary, sales_data, expenses_data = build_daily_snapshot(report_date)

        # Upsert
        report, created = DailyReport.objects.update_or_create(
            date=report_date,
            defaults={
                'revenue':          summary['revenue'],
                'profit':           summary['profit'],
                'total_expenses':   summary['total_expenses'],
                'net':              summary['net'],
                'bill_count':       summary['bill_count'],
                'sales_snapshot':   sales_data,
                'expenses_snapshot': expenses_data,
                'is_finalized':     True,
            }
        )

        action = 'Created' if created else 'Updated'
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ {action} DailyReport for {report_date} | '
                f'Revenue: ₹{summary["revenue"]:.2f} | '
                f'Profit: ₹{summary["profit"]:.2f} | '
                f'Bills: {summary["bill_count"]} | '
                f'Expenses: ₹{summary["total_expenses"]:.2f}'
            )
        )
