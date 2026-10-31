/**
 * Generate a clean URL-friendly slug from string(s)
 * @param {string} text 
 * @param {string} [secondary] 
 * @returns {string}
 */
export function slugify(text, secondary = '') {
  const combined = secondary ? `${text} ${secondary}` : text;
  return combined
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-')     // Replace spaces, underscores and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
}
