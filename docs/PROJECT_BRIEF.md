# Project brief

## Chosen industry problem

Many businesses need a simple but reliable system to manage daily operations without installing complex enterprise ERP software. IndustryOps ERP Lite solves this by combining inventory, sales, purchases, expenses, and customer or supplier data in one app.

## Target industries

- Retail shops
- Super shops and grocery stores
- Pharmacy and medical stores
- Restaurants and cafes
- Distributors and wholesalers
- Small manufacturers
- Repair and service businesses
- Local branches with unstable internet

## Core modules

1. Authentication with OTP
2. Company workspace
3. Products and inventory
4. Customers
5. Suppliers
6. Sales orders
7. Purchase receiving
8. Expenses
9. Dashboard
10. Reports
11. Offline cache and sync queue

## Data flow

User logs in with OTP, the app creates a company workspace, records are saved to Supabase when online, and IndexedDB is used when offline. Unsynced local records are queued and sent to Supabase when the user syncs again.
