/**
 * Validation helpers for Toko Aysha Admin
 */

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

/**
 * Validate product form inputs
 * @param {Object} product
 * @param {boolean} isPublishing
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateProductForm(product, isPublishing = false) {
  const errors = {};

  if (!product.name || !product.name.trim()) {
    errors.name = 'Product name is required';
  } else if (product.name.trim().length < 2) {
    errors.name = 'Product name must be at least 2 characters';
  }

  if (!product.country_id) {
    errors.country_id = 'Country of Origin is required';
  }

  if (!product.category_id) {
    errors.category_id = 'Product category is required';
  }

  if (isPublishing && !product.image_path) {
    errors.image_path = 'A verified product photograph is strongly required before publishing to the public catalog.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate uploaded image file
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file format. Please upload a JPEG, PNG, or WebP image.' 
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.` 
    };
  }

  return { valid: true };
}
