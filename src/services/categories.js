import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Fallback seed categories for offline / preview
export const FALLBACK_CATEGORIES = [
  { id: 'cat-noodles', name: 'Instant Noodles', slug: 'instant-noodles', icon: 'Soup', is_active: true, display_order: 1 },
  { id: 'cat-rice', name: 'Rice & Pantry Staples', slug: 'rice-pantry-staples', icon: 'Wheat', is_active: true, display_order: 2 },
  { id: 'cat-snacks', name: 'Snacks & Biscuits', slug: 'snacks-biscuits', icon: 'Cookie', is_active: true, display_order: 3 },
  { id: 'cat-sauces', name: 'Sauces & Seasonings', slug: 'sauces-seasonings', icon: 'Flame', is_active: true, display_order: 4 },
  { id: 'cat-drinks', name: 'Drinks & Beverages', slug: 'drinks-beverages', icon: 'Coffee', is_active: true, display_order: 5 },
  { id: 'cat-cooking', name: 'Cooking Ingredients', slug: 'cooking-ingredients', icon: 'Utensils', is_active: true, display_order: 6 },
  { id: 'cat-canned', name: 'Canned & Packaged Food', slug: 'canned-packaged-food', icon: 'Package', is_active: true, display_order: 7 },
  { id: 'cat-frozen', name: 'Frozen Food', slug: 'frozen-food', icon: 'ShoppingBag', is_active: true, display_order: 8 },
  { id: 'cat-sweets', name: 'Sweets & Confectionery', slug: 'sweets-confectionery', icon: 'Cookie', is_active: true, display_order: 9 },
  { id: 'cat-household', name: 'Household Essentials', slug: 'household-essentials', icon: 'HeartPulse', is_active: true, display_order: 10 },
  { id: 'cat-other', name: 'Other Products', slug: 'other-products', icon: 'ShoppingBag', is_active: true, display_order: 11 },
];

/**
 * Fetch all categories
 * @param {boolean} [includeInactive=false]
 */
export async function getCategories(includeInactive = false) {
  if (!isSupabaseConfigured || !supabase) {
    return includeInactive ? FALLBACK_CATEGORIES : FALLBACK_CATEGORIES.filter(c => c.is_active);
  }

  let query = supabase
    .from('categories')
    .select('*, products:products(count)')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new category
 */
export async function createCategory(category) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing category
 */
export async function updateCategory(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Safe category deactivation or deletion with dependency check
 */
export async function removeOrDeactivateCategory(id, action = 'deactivate') {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  // Check if any products reference this category
  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countError) throw countError;

  if (count > 0 && action === 'delete') {
    throw new Error(
      `Cannot delete category: ${count} product(s) are currently assigned to it. Please deactivate the category or reassign the products first.`
    );
  }

  if (action === 'deactivate') {
    return updateCategory(id, { is_active: false });
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
