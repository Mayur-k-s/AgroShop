import os
import sys

# 1. Setup Environment
sys.path.append('/Applications/AgroShop')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ['ALLOWED_HOSTS'] = 'testserver,localhost,127.0.0.1,*'

# 2. Setup Django
import django
django.setup()

# 3. Import DRF/Models AFTER Setup
from rest_framework.test import APIClient
from django.contrib.auth.models import User

def test_inventory_view():
    print("--- TESTING GET /api/inventory/ ---")
    user, _ = User.objects.get_or_create(username='audit_user')
    client = APIClient()
    client.force_authenticate(user=user)

    try:
        response = client.get('/api/inventory/')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("SUCCESS: View works.")
            print(f"Items found: {len(response.data)}")
        else:
            print("FAILURE: View returned non-200")
            print(response.data)
    except Exception as e:
        print(f"CRASHED: {e}")
        import traceback
        traceback.print_exc()

test_inventory_view()
