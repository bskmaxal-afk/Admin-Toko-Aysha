import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { validateImageFile } from '../utils/validation';

const BUCKET_NAME = 'product-images';

/**
 * Upload a product image to Supabase Storage
 * @param {File} file 
 * @param {string} productSlug 
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadProductImage(file, productSlug) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Please check your .env credentials.');
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate unique clean object path
  const ext = file.name.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const safeSlug = (productSlug || 'prod').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const filePath = `${safeSlug}-${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Delete a product image from Supabase Storage
 * @param {string} filePath 
 */
export async function deleteProductImage(filePath) {
  if (!isSupabaseConfigured || !supabase || !filePath) return;
  // If filePath is a full URL, extract the relative path
  let path = filePath;
  if (filePath.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
    path = filePath.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
  }

  try {
    await supabase.storage.from(BUCKET_NAME).remove([path]);
  } catch (err) {
    console.warn('Storage cleanup warning:', err);
  }
}

/**
 * Get public URL for an image path or return existing external URL
 * @param {string} imagePath 
 * @returns {string}
 */
export function getProductImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath;
  }
  if (!isSupabaseConfigured || !supabase) return imagePath;

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(imagePath);

  return data?.publicUrl || imagePath;
}
