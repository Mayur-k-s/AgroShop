from django.contrib import admin
from .models import Category, Product, ProductVariant, Batch, GodownStock, ShopStock, Sale, SaleItem

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductVariant)
admin.site.register(Batch)
admin.site.register(GodownStock)
admin.site.register(ShopStock)
admin.site.register(Sale)
admin.site.register(SaleItem)