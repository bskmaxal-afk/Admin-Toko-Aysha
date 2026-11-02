import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { validateImageFile } from '../utils/validation';

const BUCKET_NAME = 'product-images';

/**
 * Upload a product image to Supabase Storage, or fallback to Base64 Data URL for local preview
 * @param {File} file 
 * @param {string} productSlug 
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadProductImage(file, productSlug) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // If Supabase Storage is configured, upload to cloud bucket
  if (isSupabaseConfigured && supabase) {
    try {
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
        console.warn('Storage upload error, falling back to local preview:', error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path);

        return {
          path: data.path,
          url: urlData.publicUrl,
        };
      }
    } catch (err) {
      console.warn('Storage upload failed, using local preview mode:', err);
    }
  }

  // Fallback / Offline / Local Preview Mode:
  // Convert to base64 Data URL so user can preview and test immediately without database
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        path: reader.result,
        url: reader.result,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Delete a product image from Supabase Storage
 * @param {string} filePath 
 */
export async function deleteProductImage(filePath) {
  if (!isSupabaseConfigured || !supabase || !filePath) return;
  if (filePath.startsWith('data:')) return; // Local base64 string

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
 * Get public URL for an image path or return existing external URL / data URL
 * @param {string} imagePath 
 * @returns {string}
 */
export function getProductImageUrl(imagePath) {
  if (!imagePath) return '';
  if (
    imagePath.startsWith('http://') || 
    imagePath.startsWith('https://') || 
    imagePath.startsWith('/') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }
  if (!isSupabaseConfigured || !supabase) return imagePath;

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(imagePath);

  return data?.publicUrl || imagePath;
}
