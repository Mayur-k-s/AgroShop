import os
import django
import sys
from django.conf import settings

# Setup Django
sys.path.append('/Applications/AgroShop')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Category, Product, ProductVariant, Batch, ShopStock, Sale

def print_table(title, headers, rows):
    print(f"\n### {title}")
    # Calculate widths
    widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            widths[i] = max(widths[i], len(str(val)))
    
    # Header
    header_str = " | ".join(f"{h:<{w}}" for h, w in zip(headers, widths))
    print("-" * len(header_str))
    print(header_str)
    print("-" * len(header_str))
    
    # Rows
    for row in rows:
        print(" | ".join(f"{str(val):<{w}}" for v, w, val in zip(headers, widths, row)))

try:
    # 1. Categories
    cats = Category.objects.all()
    print_table("Categories", ["ID", "Name"], [[c.id, c.name] for c in cats])

    # 2. Products
    prods = Product.objects.all()
    print_table("Products", ["ID", "Name", "Category", "Manufacturer"], 
                [[p.id, p.name, p.category.name, p.manufacturer] for p in prods])

    # 3. Stock (Shop)
    stocks = ShopStock.objects.all().select_related('batch', 'batch__variant__product')
    stock_rows = []
    for s in stocks:
        stock_rows.append([
            s.id, 
            s.batch.variant.product.name, 
            s.batch.variant.size_label,
            s.quantity_sealed, 
            s.quantity_loose, 
            s.batch.mrp
        ])
    print_table("Shop Stock", ["ID", "Product", "Size", "Sealed", "Loose", "MRP"], stock_rows)

    # 4. Recent Sales
    sales = Sale.objects.order_by('-date_time')[:10]
    sale_rows = [[s.id, s.date_time.strftime("%Y-%m-%d %H:%M"), s.total_amount] for s in sales]
    print_table("Recent Sales (Last 10)", ["ID", "Date", "Total Amount"], sale_rows)

except Exception as e:
    print(f"Error accessing database: {e}")
    print("\nNote: Ensure your database server is running.")
