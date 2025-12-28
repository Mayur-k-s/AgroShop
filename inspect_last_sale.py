import os
import django
import sys
from decimal import Decimal

sys.path.append('/Applications/AgroShop')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Sale, SaleItem

def inspect():
    print("--- INSPECTING LAST SALES ---")
    # Get last 5 sale items
    items = SaleItem.objects.all().order_by('-id')[:5]
    
    for item in items:
        print(f"\nSaleItem ID: {item.id}")
        print(f"  Product: {item.batch.variant.product.name if item.batch else 'None'}")
        print(f"  Category: {item.batch.variant.product.category.name if item.batch else 'None'}")
        print(f"  Batch Vol: {item.batch.variant.volume_value if item.batch else 'None'}")
        print(f"  Batch Price: {item.batch.purchase_price if item.batch else 'None'}")
        print(f"  Snapshot CP: {item.cost_price_snapshot}")
        print(f"  Selling Price: {item.selling_price}")
        print(f"  Qty: {item.quantity_sold}")
        print(f"  Is Loose: {item.is_loose_sale}")

        # Simulate Logic Check
        batch_price = item.batch.purchase_price
        batch_vol = Decimal(str(item.batch.variant.volume_value))
        snapshot_cp = Decimal(str(item.cost_price_snapshot or 0))
        cat_name = item.batch.variant.product.category.name.lower()
        
        print(f"  -> Logic Check:")
        print(f"     Snapshot == Batch Price? {snapshot_cp == batch_price}")
        print(f"     Vol > 1? {batch_vol > 1}")
        print(f"     Category Match? {any(x in cat_name for x in ['pesticide', 'insecticide', 'seed'])}")

        if snapshot_cp > 0 and snapshot_cp == batch_price and batch_vol > 1:
            print("     -> Hits Branch 1 (Snapshot=Batch)")
        elif snapshot_cp > 0:
            print("     -> Hits Branch 2 (Trust Snapshot)")
        else:
            print("     -> Hits Branch 3 (Fallback)")

inspect()
