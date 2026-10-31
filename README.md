# Toko Aysha Asian Market — Store Administrator Dashboard

Production-ready inventory management and product catalog administration dashboard for **Toko Aysha Asian Market**, an Indonesian and Asian grocery supermarket.

- **Public Storefront:** [https://toko-aysha.vercel.app](https://toko-aysha.vercel.app)
- **Admin Dashboard:** Independent React + Vite SPA connecting to the shared Supabase backend.

---

## Features

1. **Product Administration:**
   - Add new products with photograph upload, brand, country of origin, category, package size, variant, ingredients, and allergen declarations.
   - Real-time **Storefront Card Preview** matching the live Toko Aysha customer view.
   - Immediate publishing to live storefront without source code edits or rebuilds.
   - Edit existing products, replace photographs, and update details.
2. **Availability & Stock Control:**
   - Simple stock toggle: `In Stock` / `Out of Stock` (no complex numerical quantities as per business specification).
3. **Safe Soft-Deletion & Restoring:**
   - Archive products safely with confirmation: immediately hides item from the public storefront while retaining record in the admin database.
   - Restoring products places them into `Draft` status by default, ensuring administrator review before republishing.
4. **Dynamic Categories & Origins:**
   - Data-driven categories and country origins managed directly in the database.
   - Safe deactivation preventing deletion of categories referenced by active inventory.
5. **Backend Security:**
   - Supabase Auth email/password authentication.
   - Server-side role enforcement via `public.admin_users` and PostgreSQL Row Level Security (RLS).
   - Restricted Supabase Storage bucket (`product-images`) allowing public read and admin-only upload/delete.
6. **Audited Legacy Migration:**
   - Idempotent catalog migration script (`scripts/migrate_legacy_catalog.js`) importing existing items into `draft` status so unverified items never publish automatically.

---

## Project Structure

```
Admin Toko Aysha/
├── public/                 # Static assets & favicon
├── src/
│   ├── components/         # Modular admin UI components
│   │   ├── AdminLayout.jsx
│   │   ├── AdminSidebar.jsx
│   │   ├── AdminHeader.jsx
│   │   ├── ProductForm.jsx
│   │   ├── ProductTable.jsx
│   │   ├── ProductCardPreview.jsx
│   │   ├── ImageUploader.jsx
│   │   ├── SearchInput.jsx
│   │   ├── FilterBar.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── EmptyState.jsx
│   │   └── LoadingState.jsx
│   ├── pages/              # Application views
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── AddProduct.jsx
│   │   ├── EditProduct.jsx
│   │   ├── ArchivedProducts.jsx
│   │   ├── Categories.jsx
│   │   ├── Countries.jsx
│   │   └── Settings.jsx
│   ├── lib/
│   │   └── supabase.js     # Supabase client with graceful fallback
│   ├── services/           # Backend database & storage operations
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── countries.js
│   │   └── storage.js
│   ├── hooks/              # Custom React hooks (useAuth, useProducts)
│   ├── utils/              # Validation, slugify helpers
│   └── styles/             # Design tokens & responsive styles
├── supabase/
│   └── migrations/         # PostgreSQL schema, RLS, and storage migrations
├── scripts/
│   └── migrate_legacy_catalog.js # Legacy catalog migration tool
├── tests/                  # Automated unit and security tests
├── vercel.json             # SPA routing rewrite configuration
└── .env.example
```

---

## Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_PUBLIC_WEBSITE_URL=https://toko-aysha.vercel.app
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```

---

## Supabase Database Setup

1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the migration scripts in `supabase/migrations/` sequentially:
   - `20261101_001_initial_schema.sql`
   - `20261101_002_security_rls.sql`
   - `20261101_003_storage_setup.sql`
   - `20261101_004_seed_data.sql`
3. Provision the store administrator user in **Authentication** -> **Users** and register in `public.admin_users`:
   ```sql
   INSERT INTO public.admin_users (id, email, role)
   VALUES ('<USER_UUID>', '<USER_EMAIL>', 'admin');
   ```

---

## Vercel Deployment Instructions

1. Push this repository to GitHub or connect the directory in Vercel.
2. In Vercel, select **Add New Project**.
3. Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_PUBLIC_WEBSITE_URL`
5. Deploy! The included `vercel.json` automatically handles SPA routing for paths like `/products`, `/categories`, and `/login`.
