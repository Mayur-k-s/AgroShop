from django.contrib import admin
from django.urls import path
from inventory.views import *

urlpatterns = [
    path('admin/', admin.site.urls),

    # --- READ DATA (GET) ---
    path('api/dashboard/', api_dashboard_data),
    path('api/inventory/', get_shop_inventory),
    path('api/godown/', get_godown_inventory),
    path('api/report/', get_todays_report),
    path('api/setup-data/', get_setup_data),
    path('api/customers/', get_customers),       # Was missing
    path('api/loans/', list_loans),              # Was missing
    path('api/expenses/', get_expenses),         # Was missing
    path('api/analysis/', get_analysis_data),    # Was missing

    # --- WRITE DATA (POST) ---
    path('api/add-category/', add_category),
    path('api/add-product/', add_product),
    path('api/edit-product/', edit_product),
    path('api/delete-product/', delete_product),
    path('api/delete-batch/', delete_batch),
    path('api/add-stock/', add_stock),
    path('api/transfer/', transfer_stock),
    path('api/transfer-back/', transfer_shop_to_godown),
    path('api/open-bag/', open_bag),
    
    # --- TRANSACTIONS & FINANCE ---
    path('api/sale/', create_sale),
    path('api/add-expense/', add_expense),             # <--- THIS FIXES YOUR ERROR
    path('api/loan-payment/', add_loan_payment),       # Was missing
    path('api/delete-customer-loans/', delete_customer_loans), # Was missing
]