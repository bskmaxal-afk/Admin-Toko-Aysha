-- ==============================================================================
-- Migration: 20261101_004_seed_data.sql
-- Description: Initial seed data for countries and categories
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Seed Countries
-- ------------------------------------------------------------------------------
INSERT INTO public.countries (name, code, slug, flag_emoji) VALUES
    ('Indonesia', 'ID', 'indonesia', '🇮🇩'),
    ('South Korea', 'KR', 'south-korea', '🇰🇷'),
    ('Japan', 'JP', 'japan', '🇯🇵'),
    ('Thailand', 'TH', 'thailand', '🇹🇭'),
    ('China', 'CN', 'china', '🇨🇳'),
    ('Sri Lanka', 'LK', 'sri-lanka', '🇱🇰'),
    ('Vietnam', 'VN', 'vietnam', '🇻🇳'),
    ('Philippines', 'PH', 'philippines', '🇵🇭'),
    ('Singapore', 'SG', 'singapore', '🇸🇬'),
    ('Malaysia', 'MY', 'malaysia', '🇲🇾'),
    ('Taiwan', 'TW', 'taiwan', '🇹🇼'),
    ('India', 'IN', 'india', '🇮🇳')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    flag_emoji = EXCLUDED.flag_emoji;

-- ------------------------------------------------------------------------------
-- 2. Seed Categories
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, tagline, description, icon, color, bg_tint, display_order, is_active) VALUES
    ('Instant Noodles', 'instant-noodles', 'Indomie, Samyang Buldak, Nongshim & Asian favorites', 'Beloved Asian instant noodles including Indonesian Mi Goreng, spicy Korean Buldak & Shin Ramyun, thick seafood udon, and comforting broth bowls.', 'Soup', '#7B111A', '#FAF2F3', 1, true),
    ('Rice & Pantry Staples', 'rice-pantry-staples', 'Jasmine rice, Thai coconut milk & glass vermicelli', 'Daily Asian cooking foundations: premium jasmine rice, Longkou bean vermicelli, Wai Wai rice noodles, and rich UHT coconut milk.', 'Wheat', '#C77D2B', '#FDF5ED', 2, true),
    ('Snacks & Biscuits', 'snacks-biscuits', 'Kerupuk, cassava crisps, roasted nuts & sweet treats', 'Crispy prawn crackers, Kusuka cassava crisps, savory garlic roasted peanuts, seaweed snacks, and legendary Asian sweet wafers.', 'Cookie', '#D97706', '#FEF7EE', 3, true),
    ('Sauces & Seasonings', 'sauces-seasonings', 'Kecap manis, Sriracha, sambal & soy sauces', 'Essential Asian flavor profiles: thick sweet soy sauce (kecap manis), authentic Thai Sriracha, fiery sambal chili relish, and savory seasonings.', 'Flame', '#7B111A', '#FAF2F3', 4, true),
    ('Drinks & Beverages', 'drinks-beverages', 'Jasmine tea, Asian coffee & tropical fruit syrups', 'Refreshing Asian beverages: Teh Botol Sosro, instant white coffee, herbal grass jelly drinks, canned lychee drink, and aromatic syrups.', 'Coffee', '#1B6839', '#EDF7F1', 5, true),
    ('Cooking Ingredients', 'cooking-ingredients', 'Spice pastes, shrimp paste, coconut cream & herbs', 'Authentic cooking essentials: traditional bumbu paste for rendang, raw terasi shrimp paste, fried shallot crisps, and tamarind concentrate.', 'Utensils', '#7C3AED', '#F5F3FF', 6, true),
    ('Canned & Packaged Food', 'canned-packaged-food', 'Sardines in tomato, corned beef & pickled vegetables', 'Convenient and savory meal starters: ABC sardines in spicy tomato chili, seasoned luncheon beef, bamboo shoots, and coconut jelly.', 'Package', '#0284C7', '#F0F9FF', 7, true),
    ('Frozen Food', 'frozen-food', 'Dumplings, dim sum, frozen tempeh & exotic ingredients', 'Authentic frozen Asian specialties: frozen Indonesian tempeh, gyoza dumplings, dim sum buns, and specialty ingredients.', 'ShoppingBag', '#0D9488', '#F0FDFA', 8, true),
    ('Sweets & Confectionery', 'sweets-confectionery', 'Chocolates, Asian jellies, mochi & candies', 'Delicious Asian sweet confections: Beng Beng wafers, SilverQueen chocolates, assorted fruit jelly cups, and chewy treats.', 'Cookie', '#E11D48', '#FFF1F2', 9, true),
    ('Household Essentials', 'household-essentials', 'Asian kitchenware, cookware & lifestyle essentials', 'Authentic Indonesian and Asian household items: Tolak Angin herbal remedies, Minyak Kayu Putih cajuput oil, and specialty kitchen tools.', 'HeartPulse', '#059669', '#ECFDF5', 10, true),
    ('Other Products', 'other-products', 'Specialty and seasonal Asian grocery finds', 'Unique, seasonal, and hard-to-find Asian grocery products curated for the community.', 'ShoppingBag', '#475569', '#F8FAFC', 11, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    bg_tint = EXCLUDED.bg_tint,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;
