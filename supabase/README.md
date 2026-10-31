# Toko Aysha — Supabase Database Architecture & Setup

This directory contains the production-grade database schema, Row Level Security (RLS) policies, storage configuration, and seed data for **Toko Aysha Asian Market** and the **Toko Aysha Admin Dashboard**.

---

## Migration Files Overview

| File | Purpose |
|------|---------|
| `20261101_001_initial_schema.sql` | Creates `countries`, `categories`, `admin_users`, and `products` tables, indexes, updated_at triggers, and `is_admin()` function |
| `20261101_002_security_rls.sql` | Configures strict Row Level Security. Public gets read-only access to published non-archived products; admins get full CRUD |
| `20261101_003_storage_setup.sql` | Creates `product-images` storage bucket with public read and admin-only upload/delete policies |
| `20261101_004_seed_data.sql` | Seeds authentic Asian country origins and Toko Aysha product categories |

---

## Step-by-Step Supabase Setup

### 1. Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com).
2. Create a new project (e.g. `toko-aysha-db`).
3. Note your **Project URL** and **API anon key** (Project Settings -> API).

### 2. Run the SQL Migrations
In your Supabase Dashboard, open the **SQL Editor** and run the migration scripts in order:
1. Copy and run `20261101_001_initial_schema.sql`
2. Copy and run `20261101_002_security_rls.sql`
3. Copy and run `20261101_003_storage_setup.sql`
4. Copy and run `20261101_004_seed_data.sql`

---

## 3. Provisioning the Initial Admin Account (Secure Setup)

1. In Supabase Dashboard, go to **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter the store administrator's email and a secure password. Check **Auto Confirm User?** = Yes.
4. Note the generated User `UUID` (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
5. Open the **SQL Editor** and run the following command to register the user as an authorized administrator:

```sql
INSERT INTO public.admin_users (id, email, role)
VALUES (
    '<PASTE_USER_UUID_HERE>', 
    '<PASTE_USER_EMAIL_HERE>', 
    'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

> [!IMPORTANT]
> The application uses server-side verification (`is_admin()` function). Only users registered in `public.admin_users` will be granted admin privileges in the backend, regardless of client-side requests.
