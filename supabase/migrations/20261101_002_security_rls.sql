-- ==============================================================================
-- Migration: 20261101_002_security_rls.sql
-- Description: Row Level Security (RLS) Policies for Toko Aysha
-- Enforces least-privilege access and server-side verification via is_admin()
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Policies for countries
-- ------------------------------------------------------------------------------
-- Public (anonymous + authenticated) can view all country options for filtering
DROP POLICY IF EXISTS "Public can view countries" ON public.countries;
CREATE POLICY "Public can view countries" 
    ON public.countries
    FOR SELECT 
    USING (true);

-- Only verified administrators can insert, update, or delete countries
DROP POLICY IF EXISTS "Admins have full access to countries" ON public.countries;
CREATE POLICY "Admins have full access to countries" 
    ON public.countries
    FOR ALL 
    TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Policies for categories
-- ------------------------------------------------------------------------------
-- Public can only view active categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" 
    ON public.categories
    FOR SELECT 
    USING (is_active = true);

-- Only verified administrators can insert, update, or delete categories
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories" 
    ON public.categories
    FOR ALL 
    TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Policies for admin_users
-- ------------------------------------------------------------------------------
-- Authenticated users can read their own profile to verify admin status
DROP POLICY IF EXISTS "Users can read own admin profile" ON public.admin_users;
CREATE POLICY "Users can read own admin profile" 
    ON public.admin_users
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = id);

-- Existing administrators can view and manage admin profiles
DROP POLICY IF EXISTS "Admins can manage admin profiles" ON public.admin_users;
CREATE POLICY "Admins can manage admin profiles" 
    ON public.admin_users
    FOR ALL 
    TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Policies for products
-- ------------------------------------------------------------------------------
-- Public can ONLY view published, non-archived products
DROP POLICY IF EXISTS "Public can view eligible published products" ON public.products;
CREATE POLICY "Public can view eligible published products" 
    ON public.products
    FOR SELECT 
    USING (
        status = 'published' 
        AND archived_at IS NULL
    );

-- Verified administrators have full CRUD access (drafts, published, archived)
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" 
    ON public.products
    FOR ALL 
    TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());
