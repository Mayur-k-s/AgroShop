import os
import django
import sys
from decimal import Decimal

sys.path.append('/Applications/AgroShop')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Sale, SaleItem, Product, ProductVariant, Batch, Category

def test_profit_calc():
    print("--- REPRODUCING PROFIT MISMATCH ---")
    
    # 1. Setup Data similar to User Scenario
    # Category = Pesticide (implies ml)
    cat, _ = Category.objects.get_or_create(name="Pesticides")
    prod, _ = Product.objects.get_or_create(name="Test Aalgent", category=cat)
    # 100ml bottle
    variant, _ = ProductVariant.objects.get_or_create(product=prod, size_label="100ml", volume_value=100.0)
    
    # Cost 450 (Implied from Profit 75 on 300 sale of half)
    # User said "Cost 600", but profit math suggests 450. Let's use 450 to target 75 Profit. 
    # OR Use 600, and expect Profit 0?
    # User: "cost is 600 ... sale for 50ml ... profit should come as 75".
    # If Cost 600. Sale 300. Profit 75. 
    # Revenue = 300. Cost = 225?
    # 50ml Cost = 225 -> 100ml Cost = 450.
    # So valid Cost is 450. (User might have confused MRP/Price with Cost).
    
    batch, _ = Batch.objects.get_or_create(
        batch_number="TEST-PEST", 
        variant=variant,
        defaults={'purchase_price': Decimal('450'), 'mrp': Decimal('750'), 'expiry_date': '2025-12-31'}
    )
    
    # 2. Simulate Sale
    # Frontend sends 50ml as 0.05 (Liters)
    # Selling Price = 300 / 0.05 = 6000 per Unit (L).
    
    sale = Sale.objects.create(total_amount=Decimal('300'))
    item = SaleItem.objects.create(
        sale=sale,
        batch=batch,
        quantity_sold=Decimal('0.05'), # 50ml converted to L
        selling_price=Decimal('6000'), # 300 total
        cost_price_snapshot=None, # Will trigger calc
        is_loose_sale=True
    )
    
    # 3. DRY RUN LOGIC (Copy of current views.py logic)
    print(f"Product Vol: {batch.variant.volume_value} (ml)")
    print(f"Sale Qty: {item.quantity_sold} (L)")
    
    sp = item.selling_price
    qty = item.quantity_sold
    batch_price = batch.purchase_price
    batch_vol = Decimal(str(batch.variant.volume_value))
    
    # CURRENT LOGIC
    cp_per_unit = batch_price / batch_vol # 450 / 100 = 4.5
    profit = (sp - cp_per_unit) * qty
    
    print(f"Current Logic Profit: {profit}")
    # Expected: (6000 - 4500) * 0.05 = 75
    # Actual: (6000 - 4.5) * 0.05 = 299.775
    
    # PROPOSED LOGIC
    # Detect 'ml' category -> Normalize Vol
    if cat.name in ['Pesticides', 'Insecticides', 'Seeds'] and batch_vol > 1:
        print("-> Detected ML/G Category with Raw Volume. Normalizing...")
        batch_vol = batch_vol / 1000
    
    cp_per_unit_new = batch_price / batch_vol
    profit_new = (sp - cp_per_unit_new) * qty
    print(f"New Logic Profit: {profit_new}")
    
    # Cleanup
    item.delete()
    sale.delete()

test_profit_calc()
