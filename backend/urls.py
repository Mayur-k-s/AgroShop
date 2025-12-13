from django.contrib import admin
from django.urls import path
from inventory.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dashboard/', api_dashboard_data),
    path('api/inventory/', get_shop_inventory),
    path('api/godown/', get_godown_inventory),
    path('api/loans/', list_loans),
    path('api/loan-payment/', add_loan_payment),
    path('api/delete-customer-loans/', delete_customer_loans),
    path('api/report/', get_todays_report),
    path('api/setup-data/', get_setup_data),
    
    path('api/add-category/', add_category),
    path('api/add-product/', add_product),
    path('api/edit-product/', edit_product),
    path('api/delete-product/', delete_product),
    path('api/delete-batch/', delete_batch),
    path('api/add-stock/', add_stock),
    path('api/transfer/', transfer_stock),
    path('api/transfer-back/', transfer_shop_to_godown),
    path('api/open-bag/', open_bag), # <--- NEW LINK
    path('api/sale/', create_sale),
]