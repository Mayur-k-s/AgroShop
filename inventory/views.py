from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Category, Product, ProductVariant, Batch, ShopStock, GodownStock, Sale, SaleItem, Expense
from .models import Customer, Loan, LoanPayment
from django.db.models import Sum
from django.db.models.functions import TruncYear, TruncMonth, TruncWeek
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
import datetime

# --- READ DATA ---

@api_view(['GET'])
def api_dashboard_data(request):
    return Response({
        "system_status": "Online",
        "total_products": Product.objects.count(),
        "total_batches": Batch.objects.count()
    })

@api_view(['GET'])
def get_customers(request):
    # Fetch all customers for POS Autocomplete
    customers = Customer.objects.all().order_by('name')
    data = [{"id": c.id, "name": c.name, "phone": c.phone, "address": c.address} for c in customers]
    return Response(data)

@api_view(['GET'])
def get_shop_inventory(request):
    stock_items = ShopStock.objects.all().order_by('-id')
    data = []
    for item in stock_items:
        data.append({
            "id": item.id,
            "batch_id": item.batch.id,
            "category": item.batch.variant.product.category.name,
            "product_name": item.batch.variant.product.name,
            "variant": item.batch.variant.size_label,
            "packet_weight": item.batch.variant.volume_value,
            "batch_no": item.batch.batch_number,
            "quantity_sealed": item.quantity_sealed,
            "quantity_loose": item.quantity_loose,
            "mrp": item.batch.mrp,
            "purchase_price": item.batch.purchase_price,
            "expiry_date": item.batch.expiry_date,
        })
    return Response(data)

@api_view(['GET'])
def get_godown_inventory(request):
    stock_items = GodownStock.objects.all().order_by('-id')
    data = []
    today = timezone.now().date()
    for item in stock_items:
        days_left = (item.batch.expiry_date - today).days
        is_expiring = days_left < 30
        data.append({
            "id": item.id,
            "batch_id": item.batch.id,
            "category": item.batch.variant.product.category.name,
            "product_name": item.batch.variant.product.name,
            "variant": item.batch.variant.size_label,
            "batch_no": item.batch.batch_number,
            "quantity": item.quantity,
            "expiry_date": item.batch.expiry_date,
            "is_alert": is_expiring
        })
    return Response(data)

@api_view(['GET'])
def list_loans(request):
    loans = Loan.objects.order_by('-created_at')
    data = []
    for loan in loans:
        related_sales = Sale.objects.filter(loan=loan).order_by('-date_time')
        sales_history = []
        for s in related_sales:
            item_names = []
            for i in SaleItem.objects.filter(sale=s):
                p_name = i.product_name_snapshot or "Unknown Product"
                qty = i.quantity_sold
                unit = "Kg" if i.is_loose_sale else "Pkt"
                item_names.append(f"{p_name} ({qty} {unit})")
            
            sales_history.append({
                'id': s.id,
                'date': s.date_time,
                'amount': s.total_amount,
                'items': ", ".join(item_names)
            })

        data.append({
            'id': loan.id,
            'customer': {
                'id': loan.customer.id, 
                'name': loan.customer.name, 
                'phone': loan.customer.phone, 
                'address': loan.customer.address
            },
            'total_amount': loan.total_amount,
            'outstanding': loan.outstanding,
            'status': loan.status,
            'created_at': loan.created_at,
            'payments': [
                {'id': p.id, 'amount': p.amount, 'note': p.note, 'date': p.payment_date} 
                for p in loan.payments.order_by('-payment_date')
            ],
            'purchase_history': sales_history
        })
    return Response(data)

@api_view(['POST'])
def add_loan_payment(request):
    data = request.data
    loan_id = data.get('loan_id')
    amount = Decimal(str(data.get('amount', 0)))
    note = data.get('note', '')
    try:
        loan = Loan.objects.get(id=loan_id)
    except Loan.DoesNotExist:
        return Response({'error': 'Loan not found'}, status=404)

    loan.outstanding -= amount
    if loan.outstanding <= 0:
        loan.outstanding = Decimal('0')
        loan.status = 'CLOSED'
    loan.save()
    
    payment = LoanPayment.objects.create(loan=loan, amount=amount, note=note)
    return Response({'success': True, 'payment_id': payment.id, 'outstanding': loan.outstanding})

@api_view(['POST'])
@transaction.atomic
def delete_customer_loans(request):
    data = request.data
    cust_id = data.get('customer_id')
    if not cust_id:
        return Response({'error': 'Missing customer_id'}, status=400)
    try:
        customer = Customer.objects.get(id=cust_id)
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=404)

    loans = Loan.objects.filter(customer=customer)
    for loan in loans:
        Sale.objects.filter(loan=loan).update(loan=None)
        LoanPayment.objects.filter(loan=loan).delete()
        loan.delete()

    return Response({'success': True, 'deleted_loans': loans.count()})

@api_view(['GET'])
def get_todays_report(request):
    def _calc_range(start_date, end_date):
        sales_qs = Sale.objects.filter(date_time__date__gte=start_date, date_time__date__lte=end_date)
        revenue = sales_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal(0)
        profit = Decimal(0)
        for sale in sales_qs:
            for item in SaleItem.objects.filter(sale=sale):
                sp = Decimal(str(item.selling_price))
                qty = Decimal(str(item.quantity_sold))
                cp = Decimal(0)
                if item.cost_price_snapshot:
                    cp = Decimal(str(item.cost_price_snapshot))
                elif item.batch:
                    cp = item.batch.purchase_price
                
                if item.is_loose_sale:
                    packet_weight = Decimal('1')
                    if item.batch and item.batch.variant:
                        packet_weight = Decimal(str(item.batch.variant.volume_value))
                    cat_name = (item.category_snapshot or "").lower()
                    if 'seed' in cat_name or 'pesticide' in cat_name:
                         packet_weight = packet_weight / Decimal('1000')

                    if packet_weight > 0:
                        cp_per_unit = cp / packet_weight
                    else:
                        cp_per_unit = cp
                    profit += (sp - cp_per_unit) * qty
                else:
                    profit += (sp - cp) * qty
        return revenue, profit, sales_qs.count(), sales_qs

    def _format_history(sales_qs):
        history = []
        for sale in sales_qs.order_by('-date_time'):
            local_dt = timezone.localtime(sale.date_time)
            formatted_time = local_dt.strftime("%I:%M %p")
            items_qs = SaleItem.objects.filter(sale=sale)
            item_names = []
            for i in items_qs:
                p_name = i.product_name_snapshot or "Unknown"
                unit = "Kg" if i.is_loose_sale else "Pkt"
                item_names.append(f"{p_name} ({i.quantity_sold} {unit})")

            history.append({
                "id": sale.id,
                "time": formatted_time,
                "items": ", ".join(item_names),
                "total": sale.total_amount
            })
        return history

    today = timezone.now().date()
    yesterday = today - datetime.timedelta(days=1)
    week_start = today - datetime.timedelta(days=6)

    today_rev, today_profit, today_count, today_sales_qs = _calc_range(today, today)
    today_history = _format_history(today_sales_qs)

    y_rev, y_profit, y_count, y_sales_qs = _calc_range(yesterday, yesterday)
    yesterday_history = _format_history(y_sales_qs)

    weekly_summary = []
    total_week_revenue = Decimal(0)
    total_week_profit = Decimal(0)
    total_week_count = 0
    for n in range(7):
        d = week_start + datetime.timedelta(days=n)
        r, p, c, _q = _calc_range(d, d)
        weekly_summary.append({ "date": d.isoformat(), "revenue": r, "profit": p, "count": c })
        total_week_revenue += r
        total_week_profit += p
        total_week_count += c

    avg_revenue = (total_week_revenue / Decimal(7)) if total_week_revenue else Decimal(0)

    return Response({
        "today": {"revenue": today_rev, "profit": today_profit, "count": today_count, "history": today_history},
        "yesterday": {"revenue": y_rev, "profit": y_profit, "count": y_count, "history": yesterday_history},
        "week": {"summary": weekly_summary, "totals": {"revenue": total_week_revenue, "profit": total_week_profit, "count": total_week_count, "avg_revenue": avg_revenue}}
    })

@api_view(['GET'])
def get_setup_data(request):
    categories = [{"id": c.id, "name": c.name} for c in Category.objects.all()]
    products = [{"id": p.id, "name": p.name, "manufacturer": p.manufacturer} for p in Product.objects.all()]
    variants = [{"id": v.id, "name": f"{v.product.name} ({v.size_label})", "volume": v.volume_value, "size": v.size_label} for v in ProductVariant.objects.all()]
    return Response({"categories": categories, "products": products, "variants": variants})

# --- EXPENSE VIEWS ---

@api_view(['GET'])
def get_expenses(request):
    expenses = Expense.objects.order_by('-date')[:50]
    data = [{
        "id": e.id, "category": e.category, "amount": e.amount, 
        "note": e.note, "date": e.date.strftime("%d-%m-%Y")
    } for e in expenses]
    return Response(data)

@api_view(['POST'])
def add_expense(request):
    data = request.data
    Expense.objects.create(
        category=data['category'],
        amount=data['amount'],
        note=data.get('note', '')
    )
    return Response({'success': True})

# --- ANALYSIS ENGINE ---

@api_view(['GET'])
def get_analysis_data(request):
    year = request.GET.get('year')
    month = request.GET.get('month')
    
    sales_qs = Sale.objects.all()
    expense_qs = Expense.objects.all()

    if year and month:
        sales_qs = sales_qs.filter(date_time__year=year, date_time__month=month)
        expense_qs = expense_qs.filter(date__year=year, date__month=month)
        sales_data = sales_qs.annotate(period=TruncWeek('date_time')).values('period').annotate(total=Sum('total_amount')).order_by('period')
        expense_data = expense_qs.annotate(period=TruncWeek('date')).values('period').annotate(total=Sum('amount')).order_by('period')
        mode = 'Weekly'
    elif year:
        sales_qs = sales_qs.filter(date_time__year=year)
        expense_qs = expense_qs.filter(date__year=year)
        sales_data = sales_qs.annotate(period=TruncMonth('date_time')).values('period').annotate(total=Sum('total_amount')).order_by('period')
        expense_data = expense_qs.annotate(period=TruncMonth('date')).values('period').annotate(total=Sum('amount')).order_by('period')
        mode = 'Monthly'
    else:
        sales_data = sales_qs.annotate(period=TruncYear('date_time')).values('period').annotate(total=Sum('total_amount')).order_by('period')
        expense_data = expense_qs.annotate(period=TruncYear('date')).values('period').annotate(total=Sum('amount')).order_by('period')
        mode = 'Yearly'

    timeline = {}
    for s in sales_data:
        d_str = s['period'].strftime("%Y-%m-%d")
        if d_str not in timeline: timeline[d_str] = {"revenue": 0, "expenses": 0}
        timeline[d_str]["revenue"] = float(s['total'])

    for e in expense_data:
        d_str = e['period'].strftime("%Y-%m-%d")
        if d_str not in timeline: timeline[d_str] = {"revenue": 0, "expenses": 0}
        timeline[d_str]["expenses"] = float(e['total'])

    chart_data = []
    sorted_keys = sorted(timeline.keys())
    
    for k in sorted_keys:
        dt = datetime.datetime.strptime(k, "%Y-%m-%d")
        if mode == 'Yearly': label = dt.strftime("%Y")
        elif mode == 'Monthly': label = dt.strftime("%B")
        else: label = f"Week {dt.day}"

        chart_data.append({
            "date": k,
            "label": label,
            "revenue": timeline[k]["revenue"],
            "expenses": timeline[k]["expenses"],
            "net": timeline[k]["revenue"] - timeline[k]["expenses"]
        })

    return Response({
        "mode": mode,
        "year": year,
        "month": month,
        "data": chart_data,
        "totals": {
            "revenue": sum(d['revenue'] for d in chart_data),
            "expenses": sum(d['expenses'] for d in chart_data),
            "net": sum(d['net'] for d in chart_data),
        }
    })

# --- WRITE DATA ---

@api_view(['POST'])
def add_category(request):
    Category.objects.create(name=request.data['name'])
    return Response({"message": "Category Added!"})

@api_view(['POST'])
def add_product(request):
    data = request.data
    cat = Category.objects.get(id=data['category_id'])
    prod, created = Product.objects.get_or_create(
        name=data['name'], category=cat, manufacturer=data['manufacturer']
    )
    ProductVariant.objects.create(product=prod, size_label=data['size'], volume_value=float(data.get('volume', 1.0)))
    return Response({"message": "Product Created!"})

@api_view(['POST'])
def edit_product(request):
    data = request.data
    try:
        prod = Product.objects.get(id=data['id'])
        prod.name = data['name']
        prod.manufacturer = data['manufacturer']
        prod.save()
        
        variant = ProductVariant.objects.filter(product=prod).first()
        if variant:
            variant.volume_value = float(data.get('volume', 1.0))
            variant.size_label = data.get('size', variant.size_label)
            variant.save()

        return Response({"message": "Product & Weight Updated!"})
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

@api_view(['POST'])
def delete_product(request):
    try:
        Product.objects.get(id=request.data.get('id')).delete()
        return Response({"message": "Product Deleted Successfully!"})
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

@api_view(['POST'])
def delete_batch(request):
    try:
        batch = Batch.objects.get(id=request.data.get('batch_id'))
        if SaleItem.objects.filter(batch=batch).exists():
            return Response({"error": "Cannot delete: Sales already made!"}, status=400)
        batch.delete()
        return Response({"message": "Stock Entry Deleted!"})
    except Batch.DoesNotExist:
        return Response({"error": "Batch not found"}, status=404)

@api_view(['POST'])
def add_stock(request):
    data = request.data
    variant = ProductVariant.objects.get(id=data['variant_id'])
    location = data.get('location', 'godown')
    
    today_str = datetime.date.today().strftime("%Y%m%d")
    count = Batch.objects.count() + 1
    generated_batch_no = f"BATCH-{today_str}-{count}"

    new_batch = Batch.objects.create(
        variant=variant,
        batch_number=generated_batch_no,
        purchase_price=data['purchase_price'],
        mrp=data['mrp'],
        expiry_date=data['expiry_date']
    )
    
    if location == 'shop':
        ShopStock.objects.create(batch=new_batch, quantity_sealed=data['quantity'])
        msg = f"Added to Shop! (ID: {generated_batch_no})"
    else:
        GodownStock.objects.create(batch=new_batch, quantity=data['quantity'])
        msg = f"Added to Godown! (ID: {generated_batch_no})"
    
    return Response({"message": msg})

@api_view(['POST'])
def transfer_stock(request):
    data = request.data
    godown_item = GodownStock.objects.get(id=data['godown_id'])
    qty = int(data['quantity'])
    if godown_item.quantity < qty: return Response({"error": "Low Stock"}, status=400)

    shop_item, _ = ShopStock.objects.get_or_create(batch=godown_item.batch)
    godown_item.quantity -= qty
    shop_item.quantity_sealed += qty
    godown_item.save()
    shop_item.save()
    return Response({"success": True})

@api_view(['POST'])
def transfer_shop_to_godown(request):
    data = request.data
    shop_item_id = data.get('shop_id')
    qty = int(data.get('quantity'))
    try:
        shop_item = ShopStock.objects.get(id=shop_item_id)
        if shop_item.quantity_sealed < qty:
            return Response({"error": "Not enough stock in Shop"}, status=400)
        godown_item, _ = GodownStock.objects.get_or_create(batch=shop_item.batch)
        shop_item.quantity_sealed -= qty
        godown_item.quantity += qty
        shop_item.save()
        godown_item.save()
        return Response({"success": True})
    except ShopStock.DoesNotExist:
        return Response({"error": "Shop Item not found"}, status=404)

@api_view(['POST'])
def open_bag(request):
    data = request.data
    try:
        stock = ShopStock.objects.get(id=data['shop_id'])
        kg_to_add = float(data['kg_in_bag']) 
        if stock.quantity_sealed < 1: return Response({"error": "No sealed bags available!"}, status=400)
        stock.quantity_sealed -= 1
        stock.quantity_loose += Decimal(kg_to_add)
        stock.save()
        return Response({"message": "Opened Successfully!"})
    except ShopStock.DoesNotExist:
        return Response({"error": "Stock not found"}, status=404)

@api_view(['POST'])
@transaction.atomic
def create_sale(request):
    cart_items = request.data.get('items', [])
    if not cart_items: return Response({"error": "Cart is empty"}, status=400)

    total_bill = 0
    for item in cart_items: 
        total_bill += Decimal(str(item['quantity'])) * Decimal(str(item['selling_price']))

    new_sale = Sale.objects.create(total_amount=total_bill)

    for item in cart_items:
        stock = ShopStock.objects.get(id=item['stock_id'])
        qty_sold = Decimal(str(item['quantity']))
        is_loose = item.get('is_loose', False)

        if is_loose:
            if stock.quantity_loose < qty_sold: raise Exception(f"Not enough loose stock for {stock.batch.variant.product.name}")
            stock.quantity_loose -= qty_sold
        else:
            if stock.quantity_sealed < qty_sold: raise Exception(f"Not enough sealed bags for {stock.batch.variant.product.name}")
            stock.quantity_sealed -= int(qty_sold)

        SaleItem.objects.create(
            sale=new_sale, batch=stock.batch, quantity_sold=qty_sold, 
            selling_price=item['selling_price'], is_loose_sale=is_loose
        )
        stock.save()

    # --- LOAN HANDLING ---
    loan_data = request.data.get('loan', None)
    if loan_data and loan_data.get('is_loan'):
        cdata = loan_data.get('customer', {})
        phone = cdata.get('phone')
        name = cdata.get('name') or 'Unknown'
        address = cdata.get('address') or ''
        
        if not phone:
             raise Exception("Customer phone required for loan")

        customer = Customer.objects.filter(phone=phone).first()
        if not customer:
            customer = Customer.objects.create(name=name, phone=phone, address=address)
        else:
            updated = False
            if name and customer.name != name:
                customer.name = name
                updated = True
            if address and customer.address != address:
                customer.address = address
                updated = True
            if updated:
                customer.save()
        
        existing_loan = Loan.objects.filter(customer=customer, status='OPEN').first()
        if existing_loan:
            loan = existing_loan
            loan.total_amount += total_bill
            loan.outstanding += total_bill
            loan.save()
        else:
            loan = Loan.objects.create(customer=customer, total_amount=total_bill, outstanding=total_bill, description=loan_data.get('description', ''))
        
        initial_payment = loan_data.get('initial_payment', 0)
        try:
            initial_payment = Decimal(str(initial_payment))
        except:
            initial_payment = Decimal('0')

        if initial_payment > 0:
            loan.outstanding -= initial_payment
            if loan.outstanding <= 0:
                loan.outstanding = Decimal(0)
                loan.status = 'CLOSED'
            loan.save()
            LoanPayment.objects.create(loan=loan, amount=initial_payment, note='Initial payment during sale')

        new_sale.loan = loan
        new_sale.save()

    return Response({"success": True, "sale_id": new_sale.id})