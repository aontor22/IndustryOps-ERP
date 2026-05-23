# IndustryOps ERP Lite

IndustryOps ERP Lite is a full-stack, offline-ready business operations system for small and growing companies. It can be used by retail stores, wholesalers, pharmacies, restaurants, distributors, repair shops, and small manufacturing teams to manage inventory, sales, purchases, expenses, customers, suppliers, and basic reports.

## Tech stack

- Frontend: React + Vite
- Backend: Vercel Serverless Functions in `/api`
- Online database: Supabase Postgres
- Authentication: Supabase Email OTP and Phone OTP
- Offline database: IndexedDB through Dexie
- Deployment: GitHub + Vercel

## Features

- Email or phone OTP login
- Auto-created company workspace after first login
- Multi-tenant Supabase database design with organization-level Row Level Security
- Product and inventory management
- Customer and supplier management
- Sales order creation with stock reduction
- Purchase receiving with stock increase
- Expense tracking
- Local dashboard and server report endpoint
- Offline records saved in IndexedDB
- Manual sync queue for pending offline records
- Responsive desktop and mobile layout
- Basic PWA service worker for cached app shell

## Folder structure

```txt
industryops-erp-lite/
├── api/
│   ├── health.js
│   └── org-summary.js
├── public/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── supabase/
│   └── schema.sql
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

Create a new Supabase project, then open SQL Editor and run:

```txt
supabase/schema.sql
```

### 3. Configure authentication

In Supabase Dashboard:

1. Go to Authentication.
2. Enable Email provider.
3. For email OTP instead of magic link, edit the email template and include `{{ .Token }}`.
4. For phone OTP, configure an SMS provider in Supabase Auth settings.

Email OTP is easiest for testing. Phone OTP requires SMS provider setup.

### 4. Create environment file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill these values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

The first two variables are used by the React frontend. The last two are used by the Vercel backend functions.

### 5. Run locally

```bash
npm run dev
```

Open the local URL shown by Vite.

## Deploy to GitHub and Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial IndustryOps ERP Lite project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/industryops-erp-lite.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Import the GitHub repository in Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add the same environment variables in Vercel Project Settings.
6. Deploy.

## How offline mode works

- Product, customer, supplier, sale, purchase, and expense records are stored in IndexedDB.
- If the browser is offline, new records are saved locally with `pending_sync = true`.
- When internet is available, use Settings or Dashboard to sync pending data.
- The app also caches the app shell with a service worker after production deployment.

## Important production notes

This project is production-structured, but before using it in a real business, you should add:

- Full role management screen for adding staff members
- Audit logs for stock changes
- Conflict resolution for multi-device offline edits
- Invoice PDF generation
- Barcode scanner support
- Currency settings
- Backup and restore workflow
- Automated tests

## Troubleshooting

### OTP email sends magic link instead of code

Update the Supabase email template to show `{{ .Token }}` instead of only the confirmation URL.

### Phone OTP does not send

Phone OTP requires Supabase SMS provider configuration. Test with email OTP first.

### Data does not show in Supabase tables

Check these points:

1. You ran `supabase/schema.sql`.
2. You are logged in.
3. Your `.env` file has the correct Supabase URL and anon key.
4. You clicked sync after adding records offline.

### Vercel backend report fails

Make sure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are added in Vercel environment variables. The frontend variables need `VITE_` prefix, but backend variables do not.
