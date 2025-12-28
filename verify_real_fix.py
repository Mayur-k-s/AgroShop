import os
import django
import sys
from decimal import Decimal

sys.path.append('/Applications/AgroShop')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Sale, SaleItem, Product, ProductVariant, Batch, Category

def verify_fix_logic():
    print("--- VERIFYING SNAPSHOT CORRECTION ---")
    
    # 1. Setup Data
    cat, _ = Category.objects.get_or_create(name="Pesticides")
    prod, _ = Product.objects.get_or_create(name="Real Aalgent", category=cat)
    # 100ml bottle
    variant, _ = ProductVariant.objects.get_or_create(product=prod, size_label="100ml", volume_value=100.0)
    
    batch, _ = Batch.objects.get_or_create(
        batch_number="FIX-TEST-002", 
        variant=variant,
        defaults={'purchase_price': Decimal('450'), 'mrp': Decimal('750'), 'expiry_date': '2025-12-31'}
    )
    
    # Simulate Snapshot = 4.5 (Cost per ml) which is WRONG for 0.05L sale
    # This mimics the issue seen in real DB
    snapshot_cp_val = Decimal('4.5') 
    
    sale = Sale.objects.create(total_amount=Decimal('300'))
    item = SaleItem.objects.create(
        sale=sale,
        batch=batch,
        quantity_sold=Decimal('0.05'),
        selling_price=Decimal('6000'), 
        cost_price_snapshot=snapshot_cp_val, # BAD SNAPSHOT
        is_loose_sale=True
    )
    
    # 2. RUN LOGIC
    sp = item.selling_price
    qty = item.quantity_sold
    batch_price = item.batch.purchase_price
    batch_vol = Decimal(str(item.batch.variant.volume_value))
    snapshot_cp = Decimal(str(item.cost_price_snapshot or 0))
    
    print(f"Batch Vol: {batch_vol}")
    print(f"Snapshot CP: {snapshot_cp}")
    
    # --- COPIED LOGIC ---
    if snapshot_cp > 0 and snapshot_cp == batch_price and batch_vol > 1:
        print("Branch 1")
        # Logic...
        cat_name = (item.batch.variant.product.category.name if (item.batch and item.batch.variant) else "").lower()
        if any(x in cat_name for x in ['pesticide', 'insecticide', 'seed']):
             effective_vol = batch_vol / Decimal('1000')
             cp_per_unit = batch_price / effective_vol
        else:
             cp_per_unit = batch_price / batch_vol
             
    elif snapshot_cp > 0:
        print("Branch 2 (Snapshot)")
        cat_name = (item.batch.variant.product.category.name if (item.batch and item.batch.variant) else "").lower()
        is_ml_category = any(x in cat_name for x in ['pesticide', 'insecticide', 'seed'])
        
        if is_ml_category and batch_vol > 1 and snapshot_cp < (batch_price / Decimal('10')):
            print("-> Suspicious Snapshot Detected. Reformulating.")
            effective_vol = batch_vol / Decimal('1000')
            cp_per_unit = batch_price / effective_vol
        else:
            cp_per_unit = snapshot_cp
    else:
        print("Branch 3")
        cp_per_unit = snapshot_cp # Simplified for test
        
    profit = (sp - cp_per_unit) * qty
    print(f"CALCULATED PROFIT: {profit}")

verify_fix_logic()
