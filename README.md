# 🌱 Farm2Home — Direct Farmer-to-Home Agricultural Marketplace

**Farm2Home** is a complete, working, full-stack e-commerce web application engineered to bridge the gap between Indian agricultural farmers/merchants and household consumers. It enables customers to discover fresh farm produce at fair prices, inspect harvest dates and origins, select quantities, place orders, and simulate secure digital payments — while giving farmers an intuitive, zero-middleman seller portal to list crops, update live stocks, and process buyer orders.

---

## 🌾 Key Highlights & Farmer-Friendly Design

- **Simplified Vernacular & English Layout**: Large buttons, clear iconography, uncluttered interface, and minimal steps for adding products or checkout.
- **Agricultural Color Palette**: Forest green, emerald, warm earth tones, and clean white backgrounds.
- **Leaf Logo & Brand Identity**: Simple leaf logo with the prominent brand name **Farm2Home**.
- **Role-Based Authentication**:
  - **🌱 User Login**: For households ordering vegetables, fruits, grains, and spices.
  - **🚜 Merchant Login**: For farmers and agrarian sellers managing produce listings and incoming dispatches.
  - **🛡️ Management Login**: Restricted administrative portal for farmer verification, account oversight, and platform settings.
- **Location & OpenStreetMap System**:
  - "Use My Current Location" button using HTML5 browser geolocation.
  - Interactive Leaflet / OpenStreetMap pin picker.
  - Zero-API-key fallback reverse geocoder for Indian agricultural zones.
  - Fallback manual address entry when location access is denied.
- **Persistent Shopping Cart & Checkout**:
  - Decimal-safe line-item subtotal, delivery fees, and free-delivery progress bar.
  - 6-step checkout: Cart Confirmation → Address Selection → Delivery Slot → Price Review → Demo Payment Simulator → Order Receipt.
- **"DEMO PAYMENT" Simulator**:
  - Prominently marked: `DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED`.
  - Simulates UPI (VPA input), Credit/Debit Card (masked test details), and Cash on Delivery.
  - Interactive **Simulate Success** and **Simulate Failure** buttons to test retry flows and duplicate payment prevention.
- **Live Order Tracking**:
  - Status progression: `Pending` → `Confirmed` → `Accepted by Seller` → `Packed` → `Out for Delivery` → `Delivered` (or `Cancelled`).
  - Order cancellation with automatic inventory stock replenishment.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Leaflet (OpenStreetMap), Vite |
| **Backend** | Python 3.12, FastAPI, Starlette, Pydantic v2, Uvicorn, Python-Jose (JWT) |
| **Database** | SQLite with SQLAlchemy ORM (PRAGMA foreign_keys enabled, transactional operations) |
| **Security** | Direct `bcrypt` password hashing (salt rounds), Bearer JWT tokens, role-based route guards |
| **Testing** | Pytest, In-memory SQLite test harness |

---

## 📁 Project Structure

```
farm2home/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py         # SQLAlchemy engine, SQLite foreign keys & session
│   │   ├── models.py           # User, Address, Category, Product, CartItem, Order, Payment
│   │   ├── schemas.py          # Pydantic v2 validation models
│   │   ├── auth.py             # Bcrypt hashing, JWT tokens, role security dependencies
│   │   ├── seed_data.py        # Seed categories, ₹ produce prices, and demo accounts
│   │   ├── routers/
│   │   │   ├── auth.py         # Customer/Merchant registration, login, demo OTP
│   │   │   ├── customers.py    # Customer profile, addresses, reverse geocoding
│   │   │   ├── merchants.py    # Farmer profile, inventory, seller orders
│   │   │   ├── products.py     # Product search, category filters, CRUD
│   │   │   ├── cart.py         # Persistent database shopping cart
│   │   │   ├── orders.py       # Multi-item checkout, order cancellation, stock sync
│   │   │   ├── payments.py     # Demo payment simulator (UPI, Card, COD)
│   │   │   └── management.py   # Admin overview, approvals, moderation, delivery fees
│   │   └── main.py             # FastAPI bootstrap, CORS, router mounting
│   ├── tests/                  # Pytest test suite (100% pass)
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_products.py
│   │   ├── test_cart_orders.py
│   │   ├── test_payments.py
│   │   └── test_management.py
│   ├── farm2home.db            # SQLite database file
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, ProductCard, CartDrawer, LocationModal, InteractiveMap, LeafLogo, Footer
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── pages/              # HomePage, AuthPage, CheckoutPage, OrdersPage, MerchantDashboard, ManagementDashboard
│   │   ├── services/api.ts     # REST API client with JWT interception
│   │   ├── types/index.ts      # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── run_backend.bat             # 1-click startup script for Backend
├── run_frontend.bat            # 1-click startup script for Frontend
└── README.md
```

---

## 🔑 Pre-Configured Demo Accounts

The database is pre-seeded with sample accounts and INR (₹) priced produce:

| Role | Email / Identifier | Mobile | Password | Notes |
|---|---|---|---|---|
| **🌱 Customer** | `customer@farm2home.org` | `9876543210` | `customer123` | Ananya Sharma (Hyderabad / Rangareddy) |
| **🚜 Farmer / Merchant** | `farmer@farm2home.org` | `9876543211` | `farmer123` | Ramesh Patel (Green Acres Organic Farm) |
| **🚜 Merchant 2** | `merchant@farm2home.org` | `9876543212` | `farmer123` | Lakshmi Devi (Orchards & Basmati Grains) |
| **🛡️ Management / Admin** | `admin@farm2home.org` | `9876543219` | `admin123` | Farm2Home Platform Office |

*Tip: The Login Page also features a **"Quick Pre-fill Sample Credentials"** button that automatically fills in test credentials with a single tap.*

---

## 🚀 Installation & Running Instructions

### 1. Prerequisites
- **Python**: Version 3.10+ (Python 3.12 installed on system)
- **Node.js**: Version 18+ (Node.js v20/v24 available at `C:\Users\JASWANTH\AppData\Local\Programs\nodejs`)

---

### 2. Start the Backend API (FastAPI)

Open a terminal or PowerShell prompt:

```powershell
cd C:\Users\JASWANTH\.gemini\antigravity\scratch\farm2home\backend

# Run the FastAPI server via Uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend starts at: **`http://127.0.0.1:8000`**  
Interactive Swagger API documentation: **`http://127.0.0.1:8000/docs`**

---

### 3. Start the Frontend (React + Vite)

Open a second terminal or PowerShell prompt:

```powershell
$env:PATH = "C:\Users\JASWANTH\AppData\Local\Programs\nodejs;$env:PATH"
cd C:\Users\JASWANTH\.gemini\antigravity\scratch\farm2home\frontend

# Start Vite development server
npm run dev
```

The frontend will be available at: **`http://localhost:5173`** (or network address displayed in terminal).

---

### 4. Running Automated Tests

To run the automated backend test suite:

```powershell
cd C:\Users\JASWANTH\.gemini\antigravity\scratch\farm2home\backend
python -m pytest
```

---

## 🧪 Testing User Roles & Workflows

### Role 1: Customer (Buyer) Workflow
1. Open `http://localhost:5173` in your browser.
2. Click **Login** → Select **User Login** card.
3. Tap **"Quick Pre-fill Sample Credentials"** (or enter `customer@farm2home.org` / `customer123`).
4. Click **Sign In Now**.
5. Browse vegetables (Tomatoes at ₹30/kg, Onions at ₹35/kg, Spinach at ₹15/bunch).
6. Select a quantity (e.g. 2 kg) and click **Add**.
7. Click the **Cart** button in the header. Review subtotal and free delivery progress.
8. Click **Proceed to Checkout**:
   - **Step 1**: Confirm harvest items.
   - **Step 2**: Select or update delivery address (test "Use My Current Location" or Leaflet map).
   - **Step 3**: Choose a delivery time slot (e.g. Morning 7:00 AM - 10:00 AM).
   - **Step 4**: Review final payable amount.
   - **Step 5**: Test Demo Payment:
     - Try checking "Test Mode: Simulate Bank Decline" and click Simulate Payment to test failure handling.
     - Uncheck failure and click **Simulate Successful Payment**.
   - **Step 6**: Order Confirmed! Note the generated order number (e.g. `F2H-20261023-XXXX`).
9. Go to **My Orders** to track status or cancel order.

### Role 2: Farmer / Merchant Workflow
1. Click **Logout** or open in incognito window.
2. Select **Merchant Login** card.
3. Tap **"Quick Pre-fill Sample Credentials"** (or enter `farmer@farm2home.org` / `farmer123`).
4. You are taken to the **Farmer Merchant Dashboard**:
   - View total products, incoming orders, and sales revenue.
   - Click **Add New Crop Produce** to list a new vegetable or fruit with price, unit type, and harvest date.
   - Switch to **Customer Orders** tab: See pending buyer orders and update status from **Accepted** → **Packed** → **Out for Delivery** → **Delivered**.
   - Switch to **Farm & Shop Profile** to update farm address or APMC license info.

### Role 3: Management / Administrator Workflow
1. Click **Logout** → Select **Management Login** card.
2. Tap **"Quick Pre-fill Sample Credentials"** (or enter `admin@farm2home.org` / `admin123`).
3. You are taken to the **Admin Management Dashboard**:
   - Inspect overall platform statistics (GMV, Customer count, Merchant count, Order count).
   - Switch to **Farmers & Approvals** to review new farmer registrations and approve/reject applications with reason.
   - Switch to **Customers** to view user orders or suspend/reactivate accounts.
   - Switch to **Product Catalog** to moderate or remove inappropriate produce listings.
   - Switch to **Demo Payments** to view the audit log of simulated UPI, Card, and COD transactions.
   - Switch to **Platform Delivery Fee** to adjust the base delivery fee and free-delivery threshold.
