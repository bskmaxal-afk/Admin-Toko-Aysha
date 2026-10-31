-- ==============================================================================
-- Migration: 20261101_001_initial_schema.sql
-- Description: Core schema for Toko Aysha Asian Market
-- Tables: countries, categories, admin_users, products
-- Functions: triggers for updated_at, publishing timestamps, and is_admin()
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. Helper Function: Automatic updated_at timestamp
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Table: countries
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code VARCHAR(3), -- ISO 3166-1 alpha-2 or alpha-3 (e.g. ID, KR, JP, TH)
    slug TEXT NOT NULL UNIQUE,
    flag_emoji VARCHAR(8) DEFAULT '🌏',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for countries.updated_at
DROP TRIGGER IF EXISTS trg_countries_updated_at ON public.countries;
CREATE TRIGGER trg_countries_updated_at
    BEFORE UPDATE ON public.countries
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_column();

-- Indexes for countries
CREATE INDEX IF NOT EXISTS idx_countries_slug ON public.countries(slug);
CREATE INDEX IF NOT EXISTS idx_countries_name ON public.countries(name);

-- ------------------------------------------------------------------------------
-- 3. Table: categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'ShoppingBag',
    color VARCHAR(32) DEFAULT '#7B111A',
    bg_tint VARCHAR(32) DEFAULT '#FAF2F3',
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for categories.updated_at
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_column();

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- ------------------------------------------------------------------------------
-- 4. Table: admin_users (Authorized Admin Profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for admin_users.updated_at
DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_column();

-- Function: is_admin() - checks if the calling authenticated user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE id = auth.uid() 
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 5. Table: products
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    slug TEXT NOT NULL UNIQUE,
    brand TEXT,
    variant TEXT,
    package_size TEXT,
    description TEXT,
    ingredients TEXT,
    allergens TEXT,
    preparation TEXT,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    image_path TEXT,
    availability VARCHAR(16) NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'unavailable')),
    status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC(12, 2) DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ DEFAULT NULL,
    archived_at TIMESTAMPTZ DEFAULT NULL
);

-- Trigger for product timestamps (updated_at, published_at, archived_at)
CREATE OR REPLACE FUNCTION handle_product_status_and_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Automatically handle published_at
    IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
        IF NEW.published_at IS NULL THEN
            NEW.published_at = NOW();
        END IF;
        NEW.archived_at = NULL;
    END IF;

    -- Automatically handle archived_at
    IF NEW.status = 'archived' AND OLD.status IS DISTINCT FROM 'archived' THEN
        IF NEW.archived_at IS NULL THEN
            NEW.archived_at = NOW();
        END IF;
    END IF;

    -- Clearing archive status
    IF NEW.status != 'archived' AND OLD.status = 'archived' THEN
        NEW.archived_at = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_timestamps ON public.products;
CREATE TRIGGER trg_products_timestamps
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION handle_product_status_and_timestamps();

-- Handle insert timestamp defaults
CREATE OR REPLACE FUNCTION handle_product_insert_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    ELSIF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
        NEW.archived_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_insert_timestamps ON public.products;
CREATE TRIGGER trg_products_insert_timestamps
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION handle_product_insert_timestamps();

-- Indexes for fast filtering and searching
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products(availability);
CREATE INDEX IF NOT EXISTS idx_products_country_id ON public.products(country_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_archived_at ON public.products(archived_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON public.products USING gin (brand gin_trgm_ops);
