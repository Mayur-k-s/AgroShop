# Raju Agro - Comprehensive Agro-Retail Management System

Raju Agro is a state-of-the-art full-stack management system designed specifically for agro-retailers. It streamlines inventory, POS billing, customer credit (Khata), and financial analytics into a single, cohesive platform.

---

## 🚀 Features A-Z

| Feature | Description |
| :--- | :--- |
| **Analysis** | Yearly, Monthly, and Weekly performance tracking with interactive charts. |
| **Billing (POS)** | Real-time POS system with support for sealed and loose quantity sales. |
| **Customer Mgmt** | Centralized database for customer profiles, contact info, and addresses. |
| **Dashboard** | Live system status and summary of today's business performance. |
| **Expenses** | Detailed tracking of business costs (Transport, Wages, Utility, Personal). |
| **Financials** | Automated revenue and profit calculation with complex margin heuristics. |
| **Godown Stock** | Manage bulk inventory with expiry tracking and low-stock alerts. |
| **History** | Deep audit logs for every sale, payment, and stock movement. |
| **Inventory** | Hierarchical management of Categories -> Products -> Variants -> Batches. |
| **JWT Auth** | Secure, token-based authentication for all system operations. |
| **Khata Book** | Digital ledger for managing customer credit and outstanding balances. |
| **Loan Mgmt** | Integrated loan creation during checkout with initial payment support. |
| **Mgmt Tools** | Dedicated interfaces for creating categories and managing product lists. |
| **Net Profit** | Intelligent profit engine accounting for loose sale unit conversions. |
| **Opening Bags** | One-click conversion of sealed inventory into loose stock for retail. |
| **Product Variants**| Granular control over different sizes (e.g., 50kg bag vs 1L bottle). |
| **Quick Search** | Global search across inventory, customers, and transaction records. |
| **Reporting** | Comparative daily and weekly success reports sent directly to the dashboard. |
| **Shop Stock** | Real-time visibility into shelf stock available for immediate sale. |
| **Transfers** | Seamless stock movement between Godown and Shop with full traceability. |
| **UI/UX** | Modern, responsive "Glassmorphism" design optimized for tablet and desktop. |
| **Variant Volume**| Support for different units (Kg, L, ml, g) for accurate loose sales. |
| **Weekly Summary**| Automated 7-day performance aggregation for trend analysis. |
| **X-Platform** | Web-based architecture accessible from any modern browser. |
| **Yearly Data** | Long-term data aggregation to visualize year-over-year growth. |
| **Zero-Error** | Atomic database transactions ensure data integrity during sales. |

---

## 🛠 Tech Stack

- **Backend**: Django 6.0, Django REST Framework (DRF)
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL (Relational SQL)
- **Security**: JWT (JSON Web Tokens) for Auth
- **Deployment**: WhiteNoise for static files, CORS headers for cross-origin SPA support.

---

## 📑 Function Reference

### Backend (Django Views)

| Function Name | Location | Description |
| :--- | :--- | :--- |
| `create_sale` | `inventory/views.py` | Atomic transaction that creates Sales/SaleItems, updates stock, and handles Loans. |
| `get_todays_report`| `inventory/views.py` | Calculates revenue/profit for today/yesterday using complex unit normalization. |
| `get_analysis_data`| `inventory/views.py` | Aggregates sales vs expenses into time-series data for frontend charts. |
| `add_stock` | `inventory/views.py` | Generates batch numbers and injects new inventory into Godown or Shop. |
| `transfer_stock` | `inventory/views.py` | Handles the internal logistics of moving sealed units from bulk to retail. |
| `open_bag` | `inventory/views.py` | Converts a sealed unit into a decimal-based loose quantity (e.g., 50kg bag -> 50.0kg loose). |
| `add_loan_payment` | `inventory/views.py` | Records a payment against a specific customer loan and updates outstanding balance. |
| `list_loans` | `inventory/views.py` | Fetches a customer's entire credit profile, including purchase history and payments. |

### Frontend (React Core)

| Function/Component | Location | Role |
| :--- | :--- | :--- |
| `apiFetch` | `App.jsx` | Centralized wrapper for backend calls with automatic JWT token management. |
| `refreshData` | `App.jsx` | Orchestrates parallel API calls to sync all dashboard and inventory states. |
| `SimpleBarChart` | `App.jsx` | Custom CSS-powered visualization engine for financial performance data. |
| `addToCart` | `App.jsx` | Validates stock availability (sealed vs loose) before adding to local POS state. |
| `checkout` | `App.jsx` | Prepares complex cart payload including loan details for backend submission. |
| `processData` | `KhataBook.jsx` | Groups raw loan records into unique customer profiles for the digital ledger. |
| `calculateTotals` | `Expenses.jsx` | Aggregates various expense categories while handling refund logic. |

---

## 📡 API Documentation

### Read Operations (GET)
- `GET /api/dashboard/`: System status and basic counts.
- `GET /api/inventory/`: Detailed shop retail stock.
- `GET /api/godown/`: Bulk godown stock with expiry alerts.
- `GET /api/report/`: Daily/Weekly revenue and profit stats.
- `GET /api/loans/`: All customer credit records and history.
- `GET /api/analysis/`: Trend data for charts (Accepts `?year=` and `?month=`).

### Write Operations (POST)
- `POST /api/token/`: JWT Login (Username/Password).
- `POST /api/sale/`: Process POS transaction.
- `POST /api/add-stock/`: Inject new batch into inventory.
- `POST /api/transfer/`: Move stock between Godown and Shop.
- `POST /api/open-bag/`: Convert sealed bag to loose stock.
- `POST /api/loan-payment/`: Record a credit payment.
- `POST /api/add-expense/`: Log business expenditure.

---

## 🗄 System Design

### Architecture
The project follows a **Decoupled SPA Architecture**:
1. **Presentation Layer**: React frontend using a component-based UI for high interactivity (e.g., POS cart).
2. **Logic Layer**: Django REST Framework providing stateless API endpoints.
3. **Data Layer**: Relational SQL database ensuring strictly enforced schema for financial integrity.

### Data Flow
1. **Supply**: Stock is added as `Batches` into `GodownStock`.
2. **Distribution**: Staff use `transfer_stock` to move items to `ShopStock`.
3. **Retail**: Staff use `open_bag` to break bulk items (e.g., Bags) into loose inventory (e.g., Kg).
4. **Transaction**: `create_sale` handles the exchange, updating stock levels and financial records atomically.
5. **Insights**: `analysis` views aggregate the resulting data into visual business intelligence.

### Key SQL Queries (Conceptual)
The system uses Django ORM, which generates efficient SQL like:
- **Outstanding Balance**: `SELECT SUM(outstanding) FROM inventory_loan WHERE customer_id = %s;`
- **Product Profitability**: `SELECT product_name_snapshot, SUM(selling_price * quantity_sold - cost_price_snapshot * quantity_sold) FROM inventory_saleitem GROUP BY product_name_snapshot;`
- **Expiry Alerts**: `SELECT * FROM inventory_batch WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days';`

---

## 🛠 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure `.env` with your DB credentials.
5. Migrate & Run: `python manage.py migrate && python manage.py runserver`

### Frontend Setup
1. Navigate to directory: `cd frontend`
2. Install: `npm install`
3. Launch: `npm run dev`

---

Developed with ❤️ for Raju Agro.
