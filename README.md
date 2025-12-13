# AgroShop

AgroShop is a lightweight inventory and POS (Point-of-Sale) web application for retailing agricultural products such as fertilizers, seeds, pesticides, and other agro-chemicals.

This repository contains a Django backend (REST API) and a React + Vite frontend that consumes the API.

---

## Contents

- `backend/` — Django project files
  - `settings.py` — environment & DB config
  - `urls.py` — API endpoints mapping
  - `asgi.py`, `wsgi.py` — application entrypoints

- `inventory/` — Django app
  - `models.py` — DB tables: Category, Product, ProductVariant, Batch, ShopStock, GodownStock, Sale, SaleItem
  - `views.py` — API endpoints (DRF-style) for CRUD, stock operations & billing
  - `serailizers.py` — DRF serializers (typo retained)
  - `admin.py`, `tests.py`, `migrations/`

- `frontend/` — React + Vite SPA
  - `src/` — Main React code (`App.jsx`, `main.jsx`) and styles (Tailwind)

---

## Features

- Create / list / delete categories & products
- Product variants with packet weight/volume
- Add stock by batch (Shop or Godown)
- Transfer stock from Godown to Shop and back
- Open sealed bags to add loose stock
- Billing (POS): add to cart, support loose & sealed sales, calculate price
- Daily revenue & profit report with bill history
- Admin site: standard Django admin for models

---

## Architecture & Tech Stack

- Backend: Django 6, Django REST Framework, Django-CORS-Headers
- Database: PostgreSQL (configured in `backend/settings.py`)
- Frontend: React (v19) with Vite + Tailwind CSS
- Dev and build tooling: NPM (frontend), Python venv (backend)

---

## Models (Summary)

- Category: product categories
- Product: product name + manufacturer + category
- ProductVariant: product variant, size label, packet weight (volume_value)
- Batch: Batch of a product variant, batch number, purchase price, MRP, expiry
- ShopStock: batch-level stock in the shop (sealed & loose)
- GodownStock: batch-level stock in the godown (integer count)
- Sale + SaleItem: records of sales; SaleItem stores snapshots of cost, product name & category to keep audit-proof history

---

## Important API Routes

- GET `/api/dashboard/` — system info, total product & batches
- GET `/api/inventory/` — list of `ShopStock` items
- GET `/api/godown/` — list of `GodownStock` items
-- GET `/api/report/` — returns structured report object for `today`, `yesterday` and last 7 days summary. Example schema:
  ```json
  {
    "today": {"revenue": 0.0, "profit": 0.0, "count": 0, "history": [...]},
    "yesterday": {"revenue": 0.0, "profit": 0.0, "count": 0, "history": [...]},
    "week": {"summary": [{"date": "YYYY-MM-DD", "revenue": 0.0, "profit": 0.0, "count": 0}], "totals": {"revenue":...,"profit":...,"count":...}}
  }
  ```
- GET `/api/setup-data/` — categories, products, variants for forms

- POST `/api/add-category/` — {name}
- POST `/api/add-product/` — create product & variant (data includes category_id, name, manufacturer, size, volume)
- POST `/api/add-stock/` — add a batch and create ShopStock/GodownStock
- POST `/api/transfer/` — transfer from Godown to Shop
- POST `/api/transfer-back/` — transfer from Shop to Godown
- POST `/api/open-bag/` — open a sealed bag at the Shop (decrement sealed, increment loose)
- POST `/api/sale/` — create a sale (atomic), deduct stock & create SaleItem


---

## Running Locally (Development)

### Backend setup (macOS / zsh)

1. Ensure PostgreSQL is running and create a DB and user (example):

```bash
psql postgres
CREATE DATABASE fertilizer_db;
CREATE USER mayur WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fertilizer_db TO mayur;
```

2. Setup Python virtual env & install dependencies:

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

3. Update `backend/settings.py` if needed (DB username/password or host).

4. Apply migrations & run server:

```bash
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver 127.0.0.1:8000
```

### Frontend setup

1. In the `frontend/` folder:

```bash
cd frontend
npm install
npm run dev
```

2. Open the given Vite URL (http://localhost:5173) and ensure the backend server runs.
   The frontend calls `http://127.0.0.1:8000` by default.

### Restarting servers (development)

If you make backend code changes or need to refresh the environment, restart both servers:

Backend (Django) — stop and run again:
```bash
# Stop the running server: Ctrl+C in the terminal where runserver is running
python manage.py runserver 127.0.0.1:8000
```

Frontend (Vite) — stop and run again:
```bash
# Stop the running server: Ctrl+C in the terminal where `npm run dev` is running
cd frontend
npm run dev
```

Tip: When you modify Python code, ensure the server restarts or is run in a mode that automatically detects file changes (Django's runserver usually does). For JS frontend changes, Vite's HMR will apply changes automatically; however, for structural changes, a restart may be necessary.

---

## Example Usage

- Add category (curl):
```bash
curl -X POST http://127.0.0.1:8000/api/add-category/ -H "Content-Type: application/json" -d '{"name":"Fertilizer"}'
```

- Add product (curl):
```bash
curl -X POST http://127.0.0.1:8000/api/add-product/ -H "Content-Type: application/json" -d '{"category_id":1, "name":"SuperGrow", "manufacturer":"Acme","size":"50kg","volume":"50"}'
```

- Add stock in godown (curl):
```bash
curl -X POST http://127.0.0.1:8000/api/add-stock/ -H "Content-Type: application/json" -d '{"variant_id":1, "quantity":10, "purchase_price":700, "mrp":1000, "expiry_date":"2026-12-03","location":"godown"}'
```

- Create sale (curl):
```bash
curl -X POST http://127.0.0.1:8000/api/sale/ -H "Content-Type: application/json" -d '{"items":[{"stock_id":1, "quantity":2, "selling_price":800, "is_loose": false}]}'
```

---

## Notes & Recommendations

1. Environment variables: move secrets to `.env` and read them with `django-environ` or `python-dotenv`.
2. Use DRF `serializers` for request validation instead of relying only on `request.data` keys.
3. Add authentication/permissions to endpoints to protect operations (JWT or session).
4. Add unit tests for critical flows (sale, stock transfer, delete batch validations).
5. For money math, consistently use `Decimal`.
6. Consider row locking or using `F()` expressions to avoid race conditions while selling the same stock concurrently.

---

## What I can generate next (optional):
- `requirements.txt` from your venv to pin exact versions.
- `.env.example` or a `docker-compose.yml` containing service containers (Postgres, Django server & Frontend) to make it reproducible.
- Improved view function patches to replace `raise Exception` with DRF `Response` errors and add serializer-based validation.

If you want any of the above, tell me which one(s) to generate next and I'll implement them.
