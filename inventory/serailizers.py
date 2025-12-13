from rest_framework import serializers
from .models import Product, Batch, Sale

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class BatchSerializer(serializers.ModelSerializer):
    # This will show the Product Name instead of just an ID number
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    variant_size = serializers.CharField(source='variant.size_label', read_only=True)
    
    class Meta:
        model = Batch
        fields = '__all__'