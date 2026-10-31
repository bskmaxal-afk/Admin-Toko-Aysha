import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { slugify } from '../utils/slugify';

/**
 * Fetch paginated, filtered, and searched products
 */
export async function getProducts({
  status = 'active', // 'all', 'active' (draft + published), 'published', 'draft', 'archived'
  availability = 'all', // 'all', 'available', 'unavailable'
  countryId = 'all',
  categoryId = 'all',
  search = '',
  sortBy = 'updated_at_desc', // 'updated_at_desc', 'name_asc', 'name_desc'
  page = 1,
  limit = 15,
} = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], total: 0, page, totalPages: 0 };
  }

  let query = supabase
    .from('products')
    .select(`
      *,
      country:countries(id, name, code, flag_emoji),
      category:categories(id, name, slug, color)
    `, { count: 'exact' });

  // Handle Status Filtering
  if (status === 'active') {
    query = query.in('status', ['draft', 'published']).is('archived_at', null);
  } else if (status === 'published') {
    query = query.eq('status', 'published').is('archived_at', null);
  } else if (status === 'draft') {
    query = query.eq('status', 'draft').is('archived_at', null);
  } else if (status === 'archived') {
    query = query.eq('status', 'archived');
  }

  // Handle Availability
  if (availability && availability !== 'all') {
    query = query.eq('availability', availability);
  }

  // Handle Country
  if (countryId && countryId !== 'all') {
    query = query.eq('country_id', countryId);
  }

  // Handle Category
  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId);
  }

  // Handle Search (name or brand)
  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
  }

  // Handle Sorting
  if (sortBy === 'name_asc') {
    query = query.order('name', { ascending: true });
  } else if (sortBy === 'name_desc') {
    query = query.order('name', { ascending: false });
  } else {
    query = query.order('updated_at', { ascending: false });
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Fetch a single product by UUID
 */
export async function getProductById(id) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      country:countries(*),
      category:categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new product
 */
export async function createProduct(productData) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  // Ensure unique slug
  let slug = productData.slug || slugify(productData.name, productData.brand || '');
  if (!slug) slug = `product-${Date.now()}`;

  // Check slug uniqueness
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

  if (error) {
    console.error('Create product error:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing product
 */
export async function updateProduct(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  // If slug is updated, verify uniqueness
  if (updates.slug) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', updates.slug)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      throw new Error(`The URL slug "${updates.slug}" is already in use by another product.`);
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Update product error:', error);
    throw error;
  }

  return data;
}

/**
 * Archive a product (Soft Delete)
 * Removes the product from public catalog immediately.
 */
export async function archiveProduct(id) {
  return updateProduct(id, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  });
}

/**
 * Restore an archived product
 * Restores to DRAFT status by default requiring review before publishing.
 */
export async function restoreProduct(id, targetStatus = 'draft') {
  return updateProduct(id, {
    status: targetStatus,
    archived_at: null,
  });
}

/**
 * Get accurate, database-derived dashboard statistics
 */
export async function getDashboardStats() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      totalActive: 0,
      published: 0,
      draft: 0,
      archived: 0,
      unavailable: 0,
      recentProducts: [],
    };
  }

  // Run queries in parallel for efficiency
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
}
