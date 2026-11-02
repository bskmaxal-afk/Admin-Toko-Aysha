import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { slugify } from '../utils/slugify';
import { FALLBACK_COUNTRIES } from './countries';
import { FALLBACK_CATEGORIES } from './categories';

const LOCAL_STORAGE_KEY = 'toko_aysha_mock_products_v1';

// Seed sample products for local demo / offline preview mode
const INITIAL_DEMO_PRODUCTS = [
  {
    id: 'prod-indomie-mi-goreng',
    name: 'Indomie Mi Goreng Original',
    slug: 'indomie-mi-goreng-original',
    brand: 'Indomie',
    package_size: '85g',
    variant: 'Original',
    country_id: 'c-indonesia',
    category_id: 'cat-noodles',
    availability: 'available',
    status: 'published',
    image_path: '/images/products/indomie-mi-goreng-original.jpg',
    description: 'The world-famous Indonesian fried instant noodles with sweet soy sauce and crispy fried shallots.',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    archived_at: null,
  },
  {
    id: 'prod-teh-botol-sosro',
    name: 'Teh Botol Sosro Kotak',
    slug: 'teh-botol-sosro-kotak',
    brand: 'Sosro',
    package_size: '250ml',
    variant: 'Original Jasmine',
    country_id: 'c-indonesia',
    category_id: 'cat-drinks',
    availability: 'available',
    status: 'published',
    image_path: '/images/products/teh-botol.jpg',
    description: 'Iconic Indonesian sweet jasmine tea in a convenient tetra-pack box.',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    archived_at: null,
  },
  {
    id: 'prod-kusuka-singkong',
    name: 'Kusuka Keripik Singkong Balado',
    slug: 'kusuka-keripik-singkong-balado',
    brand: 'Kusuka',
    package_size: '180g',
    variant: 'Pedas Manis (Balado)',
    country_id: 'c-indonesia',
    category_id: 'cat-snacks',
    availability: 'available',
    status: 'draft',
    image_path: '/images/products/kusuka-balado.jpg',
    description: 'Authentic Indonesian spicy sweet cassava crisps made with real chili relish.',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    published_at: null,
    archived_at: null,
  },
  {
    id: 'prod-samyang-buldak',
    name: 'Samyang Buldak Carbonara',
    slug: 'samyang-buldak-carbonara',
    brand: 'Samyang',
    package_size: '130g',
    variant: 'Creamy Carbonara',
    country_id: 'c-korea',
    category_id: 'cat-noodles',
    availability: 'unavailable',
    status: 'published',
    image_path: '/images/products/samyang-carbonara.jpg',
    description: 'Spicy Korean hot chicken ramyun with creamy cheese carbonara powder.',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    archived_at: null,
  },
  {
    id: 'prod-discontinued-sample',
    name: 'Sample Archived Product',
    slug: 'sample-archived-product',
    brand: 'Discontinued Brand',
    package_size: '100g',
    variant: 'Discontinued',
    country_id: 'c-indonesia',
    category_id: 'cat-snacks',
    availability: 'unavailable',
    status: 'archived',
    image_path: '',
    description: 'Archived item for demonstrating the soft-delete and restore workflow.',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    published_at: null,
    archived_at: new Date().toISOString(),
  }
];

// Helper to get local products from storage
function getLocalProducts() {
  if (typeof window === 'undefined') return INITIAL_DEMO_PRODUCTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PRODUCTS));
      return INITIAL_DEMO_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_PRODUCTS;
  }
}

// Helper to save local products to storage
function saveLocalProducts(products) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

// Hydrate product with country & category relations
function hydrateProduct(p) {
  const country = FALLBACK_COUNTRIES.find(c => c.id === p.country_id) || { name: 'Indonesia', code: 'ID', flag_emoji: '🇮🇩' };
  const category = FALLBACK_CATEGORIES.find(c => c.id === p.category_id) || { name: 'General', slug: 'other-products' };
  return {
    ...p,
    country,
    category,
  };
}

/**
 * Fetch paginated, filtered, and searched products
 */
export async function getProducts({
  status = 'active', // 'all', 'active' (draft + published), 'published', 'draft', 'archived'
  availability = 'all', // 'all', 'available', 'unavailable'
  countryId = 'all',
  categoryId = 'all',
  search = '',
  sortBy = 'updated_at_desc',
  page = 1,
  limit = 15,
} = {}) {
  // If Supabase is connected, query PostgreSQL database
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('products')
      .select(`
        *,
        country:countries(id, name, code, flag_emoji),
        category:categories(id, name, slug, color)
      `, { count: 'exact' });

    if (status === 'active') {
      query = query.in('status', ['draft', 'published']).is('archived_at', null);
    } else if (status === 'published') {
      query = query.eq('status', 'published').is('archived_at', null);
    } else if (status === 'draft') {
      query = query.eq('status', 'draft').is('archived_at', null);
    } else if (status === 'archived') {
      query = query.eq('status', 'archived');
    }

    if (availability && availability !== 'all') {
      query = query.eq('availability', availability);
    }

    if (countryId && countryId !== 'all') {
      query = query.eq('country_id', countryId);
    }

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
    }

    if (sortBy === 'name_asc') {
      query = query.order('name', { ascending: true });
    } else if (sortBy === 'name_desc') {
      query = query.order('name', { ascending: false });
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error && data) {
      return {
        data,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }
  }

  // Fallback: Local Preview / Demo Mode
  let list = getLocalProducts().map(hydrateProduct);

  if (status === 'active') {
    list = list.filter(p => (p.status === 'published' || p.status === 'draft') && !p.archived_at);
  } else if (status === 'published') {
    list = list.filter(p => p.status === 'published' && !p.archived_at);
  } else if (status === 'draft') {
    list = list.filter(p => p.status === 'draft' && !p.archived_at);
  } else if (status === 'archived') {
    list = list.filter(p => p.status === 'archived' || Boolean(p.archived_at));
  }

  if (availability && availability !== 'all') {
    list = list.filter(p => p.availability === availability);
  }

  if (countryId && countryId !== 'all') {
    list = list.filter(p => p.country_id === countryId);
  }

  if (categoryId && categoryId !== 'all') {
    list = list.filter(p => p.category_id === categoryId);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  if (sortBy === 'name_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'name_desc') {
    list.sort((a, b) => b.name.localeCompare(a.name));
  } else {
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  const total = list.length;
  const from = (page - 1) * limit;
  const paginated = list.slice(from, from + limit);

  return {
    data: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Fetch single product by ID
 */
export async function getProductById(id) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          country:countries(*),
          category:categories(*)
        `)
        .eq('id', id)
        .single();

      if (!error && data) return data;
    } catch {
      // fallback
    }
  }

  const item = getLocalProducts().find(p => p.id === id || p.slug === id);
  if (!item) throw new Error('Product not found.');
  return hydrateProduct(item);
}

/**
 * Create a new product
 */
export async function createProduct(productData) {
  let slug = productData.slug || slugify(productData.name, productData.brand || '');
  if (!slug) slug = `product-${Date.now()}`;

  if (isSupabaseConfigured && supabase) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const user = (await supabase.auth.getUser())?.data?.user;
    const payload = {
      ...productData,
      slug,
      created_by: user?.id || null,
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local Preview / Demo Mode
  const newProduct = {
    ...productData,
    id: `prod-local-${Date.now()}`,
    slug,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: productData.status === 'published' ? new Date().toISOString() : null,
    archived_at: null,
  };

  const current = getLocalProducts();
  const updated = [newProduct, ...current];
  saveLocalProducts(updated);

  return hydrateProduct(newProduct);
}

/**
 * Update an existing product
 */
export async function updateProduct(id, updates) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local Preview / Demo Mode
  const current = getLocalProducts();
  const index = current.findIndex(p => p.id === id || p.slug === id);
  if (index === -1) throw new Error('Product not found in local inventory.');

  const updatedItem = {
    ...current[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'published' && !updatedItem.published_at) {
    updatedItem.published_at = new Date().toISOString();
    updatedItem.archived_at = null;
  } else if (updates.status === 'archived') {
    updatedItem.archived_at = new Date().toISOString();
  } else if (updates.status !== 'archived') {
    updatedItem.archived_at = null;
  }

  current[index] = updatedItem;
  saveLocalProducts(current);

  return hydrateProduct(updatedItem);
}

/**
 * Archive product
 */
export async function archiveProduct(id) {
  return updateProduct(id, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  });
}

/**
 * Restore product
 */
export async function restoreProduct(id, targetStatus = 'draft') {
  return updateProduct(id, {
    status: targetStatus,
    archived_at: null,
  });
}

/**
 * Dashboard stats derived from real data
 */
export async function getDashboardStats() {
  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { count: totalActive },
        { count: published },
        { count: draft },
        { count: archived },
        { count: unavailable },
        { data: recentProducts },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).in('status', ['published', 'draft']).is('archived_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'published').is('archived_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft').is('archived_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('availability', 'unavailable').is('archived_at', null),
        supabase.from('products').select('id, name, brand, image_path, status, availability, updated_at, country:countries(name, flag_emoji), category:categories(name)').order('updated_at', { ascending: false }).limit(5),
      ]);

      return {
        totalActive: totalActive || 0,
        published: published || 0,
        draft: draft || 0,
        archived: archived || 0,
        unavailable: unavailable || 0,
        recentProducts: recentProducts || [],
      };
    } catch {
      // fallback
    }
  }

  // Local Demo / Offline Stats
  const list = getLocalProducts().map(hydrateProduct);
  const totalActive = list.filter(p => (p.status === 'published' || p.status === 'draft') && !p.archived_at).length;
  const published = list.filter(p => p.status === 'published' && !p.archived_at).length;
  const draft = list.filter(p => p.status === 'draft' && !p.archived_at).length;
  const archived = list.filter(p => p.status === 'archived' || Boolean(p.archived_at)).length;
  const unavailable = list.filter(p => p.availability === 'unavailable' && !p.archived_at).length;
  const recentProducts = list
    .filter(p => !p.archived_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  return {
    totalActive,
    published,
    draft,
    archived,
    unavailable,
    recentProducts,
  };
}
