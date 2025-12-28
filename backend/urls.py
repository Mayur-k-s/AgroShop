from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
# --- ADD THIS IMPORT BELOW ---
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from inventory.views import *

urlpatterns = [
    path('admin/', admin.site.urls),

    # --- AUTHENTICATION ENDPOINTS ---
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- READ DATA (GET) ---
    path('api/dashboard/', api_dashboard_data),
    path('api/inventory/', get_shop_inventory),
    path('api/godown/', get_godown_inventory),
    path('api/report/', get_todays_report),
    path('api/setup-data/', get_setup_data),
    path('api/customers/', get_customers),
    path('api/loans/', list_loans),
    path('api/expenses/', get_expenses),
    path('api/analysis/', get_analysis_data),

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
    path('api/add-expense/', add_expense),
    path('api/loan-payment/', add_loan_payment),
    path('api/delete-customer-loans/', delete_customer_loans),
]

# --- FORCE STATIC FILES SERVING ---
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)