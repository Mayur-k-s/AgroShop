"""
inventory/throttles.py
─────────────────────
Custom rate-limit throttle classes for AgroShop.
Uses Django REST Framework's built-in cache-based throttling — no extra
packages required.  Rates are defined in settings.py → REST_FRAMEWORK →
DEFAULT_THROTTLE_RATES.

Tiers
─────
LoginThrottle   →  'login'  scope  →  5  / min  per IP   (brute-force guard)
WriteThrottle   →  'write'  scope  →  60 / min  per user (mutations)
ReadThrottle    →  'read'   scope  →  300/ min  per user (queries)
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


# ---------------------------------------------------------------------------
# Login / Token endpoint  –  IP-based, very strict
# ---------------------------------------------------------------------------
class LoginThrottle(AnonRateThrottle):
    """
    Applied to /api/token/ (JWT login).
    Keyed by client IP so it protects against brute-force even before
    the user is authenticated.
    Rate: DEFAULT_THROTTLE_RATES['login']  →  5/minute
    """
    scope = 'login'


# ---------------------------------------------------------------------------
# Write endpoints  –  user-based, moderate
# ---------------------------------------------------------------------------
class WriteThrottle(UserRateThrottle):
    """
    Applied to POST endpoints that mutate data
    (create_sale, add_stock, add_expense, transfer, etc.).
    Rate: DEFAULT_THROTTLE_RATES['write']  →  60/minute
    """
    scope = 'write'


# ---------------------------------------------------------------------------
# Read endpoints  –  user-based, relaxed
# ---------------------------------------------------------------------------
class ReadThrottle(UserRateThrottle):
    """
    Applied to GET endpoints (dashboard, inventory, reports, analysis …).
    Rate: DEFAULT_THROTTLE_RATES['read']   →  300/minute
    """
    scope = 'read'
