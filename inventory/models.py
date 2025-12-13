from django.db import models
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self): return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    manufacturer = models.CharField(max_length=200, blank=True)
    def __str__(self): return self.name

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    size_label = models.CharField(max_length=50) 
    volume_value = models.FloatField(default=1.0) 
    def __str__(self): return f"{self.product.name} - {self.size_label}"

class Batch(models.Model):
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=100)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    def __str__(self): return f"{self.batch_number}"

class ShopStock(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    quantity_sealed = models.IntegerField(default=0)
    quantity_loose = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class GodownStock(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)

class Sale(models.Model):
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    date_time = models.DateTimeField(default=timezone.now)
    loan = models.ForeignKey('Loan', on_delete=models.SET_NULL, null=True, blank=True)

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE)
    # CHANGE 1: If Batch is deleted, keep this row (set to NULL)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True) 
    
    quantity_sold = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_loose_sale = models.BooleanField(default=False)
    
    # CHANGE 2: Remember the name forever
    product_name_snapshot = models.CharField(max_length=200, blank=True, null=True)
    category_snapshot = models.CharField(max_length=100, blank=True, null=True)

    def save(self, *args, **kwargs):
        # When saving, take a "photo" of the name and category
        if self.batch:
            if not self.cost_price_snapshot:
                self.cost_price_snapshot = self.batch.purchase_price
            if not self.product_name_snapshot:
                self.product_name_snapshot = self.batch.variant.product.name
            if not self.category_snapshot:
                self.category_snapshot = self.batch.variant.product.category.name
        
        super().save(*args, **kwargs)


class Customer(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f"{self.name} ({self.phone})"


class Loan(models.Model):
    STATUS_CHOICES = [('OPEN', 'Open'), ('CLOSED', 'Closed')]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f"Loan #{self.id} - {self.customer.name} - {self.outstanding}"


class LoanPayment(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=200, blank=True, null=True)
    payment_date = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f"Payment #{self.id} - Loan {self.loan.id} - {self.amount}"