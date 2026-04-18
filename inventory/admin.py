from django.contrib import admin
from .models import (
    Category, Product, ProductVariant, Batch,
    GodownStock, ShopStock, Sale, SaleItem,
    Expense, Customer, Loan, LoanPayment, DailyReport
)

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductVariant)
admin.site.register(Batch)
admin.site.register(GodownStock)
admin.site.register(ShopStock)

# ─── Sales (Bill) ─────────────────────────────────────────────────────────────
class SaleItemInline(admin.TabularInline):
    model          = SaleItem
    extra          = 0
    readonly_fields = ('product_name_snapshot', 'quantity_sold', 'selling_price',
                       'cost_price_snapshot', 'is_loose_sale', 'category_snapshot')
    fields         = ('product_name_snapshot', 'category_snapshot', 'quantity_sold',
                      'selling_price', 'cost_price_snapshot', 'is_loose_sale')
    can_delete     = False
    verbose_name        = 'Item'
    verbose_name_plural = 'Items in this Bill'

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display   = ('id', 'bill_no', 'total_amount', 'date_time', 'is_loan_sale')
    search_fields  = ('id',)
    ordering       = ('-date_time',)
    date_hierarchy = 'date_time'
    readonly_fields = ('date_time',)
    inlines        = [SaleItemInline]

    def bill_no(self, obj):
        return f'Bill #{obj.id}'
    bill_no.short_description = 'Bill No'

    def is_loan_sale(self, obj):
        return '🔴 LOAN' if obj.loan_id else '✅ Paid'
    is_loan_sale.short_description = 'Type'

@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display   = ('bill_no', 'product_name_snapshot', 'category_snapshot',
                      'quantity_sold', 'selling_price', 'is_loose_sale')
    search_fields  = ('product_name_snapshot', 'sale__id')
    list_filter    = ('is_loose_sale', 'category_snapshot')
    ordering       = ('-sale__date_time',)

    def bill_no(self, obj):
        return f'Bill #{obj.sale_id}'
    bill_no.short_description = 'Bill No'


# ─── Expenses ────────────────────────────────────────────────────────────────
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display   = ('date', 'category', 'amount', 'note')
    list_filter    = ('category',)
    search_fields  = ('category', 'note')
    ordering       = ('-date',)
    date_hierarchy = 'date'

# ─── Khata Book ──────────────────────────────────────────────────────────────
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display  = ('name', 'phone', 'address', 'created_at')
    search_fields = ('name', 'phone')
    ordering      = ('name',)

class LoanPaymentInline(admin.TabularInline):
    model   = LoanPayment
    extra   = 0
    fields  = ('payment_date', 'amount', 'note')
    readonly_fields = ('payment_date',)
    ordering = ('-payment_date',)

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display   = ('customer', 'total_amount', 'outstanding', 'status', 'created_at', 'description')
    list_filter    = ('status',)
    search_fields  = ('customer__name', 'customer__phone')
    ordering       = ('-created_at',)
    inlines        = [LoanPaymentInline]
    readonly_fields = ('created_at',)

@admin.register(LoanPayment)
class LoanPaymentAdmin(admin.ModelAdmin):
    list_display   = ('loan', 'customer_name', 'amount', 'note', 'payment_date')
    search_fields  = ('loan__customer__name', 'note')
    ordering       = ('-payment_date',)
    date_hierarchy = 'payment_date'

    def customer_name(self, obj):
        return obj.loan.customer.name
    customer_name.short_description = 'Customer'

# ─── Daily Reports ───────────────────────────────────────────────────────────
@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    list_display   = ('date', 'revenue', 'profit', 'total_expenses', 'net', 'bill_count', 'is_finalized', 'generated_at')
    list_filter    = ('is_finalized',)
    search_fields  = ('date',)
    readonly_fields = ('generated_at', 'sales_snapshot', 'expenses_snapshot')
    ordering       = ('-date',)