import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Fallback seed countries for offline / pre-setup preview
export const FALLBACK_COUNTRIES = [
  { id: 'c-indonesia', name: 'Indonesia', code: 'ID', slug: 'indonesia', flag_emoji: '🇮🇩' },
  { id: 'c-korea', name: 'South Korea', code: 'KR', slug: 'south-korea', flag_emoji: '🇰🇷' },
  { id: 'c-japan', name: 'Japan', code: 'JP', slug: 'japan', flag_emoji: '🇯🇵' },
  { id: 'c-thailand', name: 'Thailand', code: 'TH', slug: 'thailand', flag_emoji: '🇹🇭' },
  { id: 'c-china', name: 'China', code: 'CN', slug: 'china', flag_emoji: '🇨🇳' },
  { id: 'c-srilanka', name: 'Sri Lanka', code: 'LK', slug: 'sri-lanka', flag_emoji: '🇱🇰' },
  { id: 'c-vietnam', name: 'Vietnam', code: 'VN', slug: 'vietnam', flag_emoji: '🇻🇳' },
  { id: 'c-philippines', name: 'Philippines', code: 'PH', slug: 'philippines', flag_emoji: '🇵🇭' },
  { id: 'c-singapore', name: 'Singapore', code: 'SG', slug: 'singapore', flag_emoji: '🇸🇬' },
  { id: 'c-malaysia', name: 'Malaysia', code: 'MY', slug: 'malaysia', flag_emoji: '🇲🇾' },
  { id: 'c-taiwan', name: 'Taiwan', code: 'TW', slug: 'taiwan', flag_emoji: '🇹🇼' },
  { id: 'c-india', name: 'India', code: 'IN', slug: 'india', flag_emoji: '🇮🇳' },
];

/**
 * Fetch all countries sorted alphabetically
 */
export async function getCountries() {
  if (!isSupabaseConfigured || !supabase) {
    return FALLBACK_COUNTRIES;
  }

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new country record
 */
export async function createCountry(country) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('countries')
    .insert([country])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing country record
 */
export async function updateCountry(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('countries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
