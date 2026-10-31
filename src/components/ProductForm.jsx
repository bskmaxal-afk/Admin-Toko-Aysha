import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Globe, Eye, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import ProductCardPreview from './ProductCardPreview';
import { validateProductForm } from '../utils/validation';
import { slugify } from '../utils/slugify';

export default function ProductForm({
  initialData = null,
  countries = [],
  categories = [],
  onSubmit,
  isEditing = false,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    variant: '',
    package_size: '',
    description: '',
    ingredients: '',
    allergens: '',
    preparation: '',
    country_id: '',
    category_id: '',
    image_path: '',
    availability: 'available',
    status: 'draft',
    price: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notification, setNotification] = useState(null);

  // Initialize or populate form
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        brand: initialData.brand || '',
        variant: initialData.variant || '',
        package_size: initialData.package_size || '',
        description: initialData.description || '',
        ingredients: initialData.ingredients || '',
        allergens: initialData.allergens || '',
        preparation: initialData.preparation || '',
        country_id: initialData.country_id || '',
        category_id: initialData.category_id || '',
        image_path: initialData.image_path || '',
        availability: initialData.availability || 'available',
        status: initialData.status || 'draft',
        price: initialData.price || null,
      });
    } else if (countries.length > 0 && categories.length > 0) {
      // Default Indonesia if present
      const defaultCountry = countries.find(c => c.name.toLowerCase() === 'indonesia') || countries[0];
      setFormData(prev => ({
        ...prev,
        country_id: prev.country_id || defaultCountry?.id || '',
        category_id: prev.category_id || categories[0]?.id || '',
      }));
    }
  }, [initialData, countries, categories]);

  // Prompt before leaving if changes were made
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (field, value) => {
    setIsDirty(true);
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Auto-update slug if user hasn't explicitly customized slug
      if (field === 'name' && (!isEditing || !prev.slug)) {
        next.slug = slugify(value, prev.brand);
      } else if (field === 'brand' && !isEditing) {
        next.slug = slugify(prev.name, value);
      }
      return next;
    });

    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleImageChange = (path) => {
    setIsDirty(true);
    handleChange('image_path', path);
  };

  const handleSubmit = async (targetStatus) => {
    const statusToApply = targetStatus || formData.status;
    const isPublishing = statusToApply === 'published';

    // Validate
    const validation = validateProductForm(formData, isPublishing);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setNotification({
        type: 'error',
        message: 'Please resolve the highlighted validation errors before saving.',
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const payload = {
        ...formData,
        status: statusToApply,
      };

      await onSubmit(payload);
      setIsDirty(false);

      setNotification({
        type: 'success',
        message: isPublishing
          ? 'Product published successfully! It is now live in the store catalog.'
          : 'Product draft saved successfully.',
      });

      // Navigate back to product list after short delay
      setTimeout(() => {
        navigate('/products');
      }, 1200);
    } catch (err) {
      console.error('Submission failed:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save product. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = countries.find(c => c.id === formData.country_id);
  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          type="button" 
          onClick={() => navigate('/products')} 
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            className="btn btn-secondary btn-sm"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('published')}
            className="btn btn-primary btn-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Globe size={14} />
            )}
            <span>{isEditing && formData.status === 'published' ? 'Save & Update Live' : 'Publish Product'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`alert-banner alert-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="form-grid-layout">
        {/* Left Form Fields */}
        <div className="card form-section">
          <h3 style={{ fontSize: '16px', fontWeight: 700, paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            Product Information
          </h3>

          {/* Product Name */}
          <div className="form-group">
            <label className="form-label">
              Product Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Indomie Mi Goreng Original"
              required
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          {/* URL Slug */}
          <div className="form-group">
            <label className="form-label">
              URL Slug <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="e.g. indomie-mi-goreng-original"
            />
            <span className="form-help">Unique web address identifier used for product page URL.</span>
          </div>

          {/* Country of Origin & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Country of Origin <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={formData.country_id}
                onChange={(e) => handleChange('country_id', e.target.value)}
                required
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag_emoji || '🌏'} {c.name}
                  </option>
                ))}
              </select>
              {errors.country_id && <span className="form-error">{errors.country_id}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Product Category <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <span className="form-error">{errors.category_id}</span>}
            </div>
          </div>

          {/* Brand & Package Size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-input"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="e.g. Indomie, ABC, Sedaap"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Packaging Size / Net Weight</label>
              <input
                type="text"
                className="form-input"
                value={formData.package_size}
                onChange={(e) => handleChange('package_size', e.target.value)}
                placeholder="e.g. 85g, 600ml, 5kg"
              />
            </div>
          </div>

          {/* Variant or Flavor */}
          <div className="form-group">
            <label className="form-label">Variant / Flavor</label>
            <input
              type="text"
              className="form-input"
              value={formData.variant}
              onChange={(e) => handleChange('variant', e.target.value)}
              placeholder="e.g. Rendang, Hot & Spicy, Original"
            />
          </div>

          {/* Stock Availability */}
          <div className="form-group">
            <label className="form-label">Store Stock Status</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="availability"
                  value="available"
                  checked={formData.availability === 'available'}
                  onChange={() => handleChange('availability', 'available')}
                />
                <span className="badge badge-available">In Stock (Available in Store)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="availability"
                  value="unavailable"
                  checked={formData.availability === 'unavailable'}
                  onChange={() => handleChange('availability', 'unavailable')}
                />
                <span className="badge badge-unavailable">Out of Stock (Temporarily Unavailable)</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Product Description</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the product, flavor profile, and grocery notes..."
            />
          </div>

          {/* Ingredients & Allergens */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Ingredients</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.ingredients}
                onChange={(e) => handleChange('ingredients', e.target.value)}
                placeholder="e.g. Wheat flour, palm oil, salt, garlic powder..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Allergen Declarations</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.allergens}
                onChange={(e) => handleChange('allergens', e.target.value)}
                placeholder="e.g. Contains Wheat (Gluten), Soy. May contain egg."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Image Upload & Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Photograph Upload Card */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
              Product Photograph
            </h4>
            <ImageUploader
              imagePath={formData.image_path}
              onChange={handleImageChange}
              productSlug={formData.slug}
              disabled={isSubmitting}
            />
            {errors.image_path && (
              <span className="form-error" style={{ display: 'block', marginTop: '8px' }}>
                {errors.image_path}
              </span>
            )}
          </div>

          {/* Live Storefront Preview */}
          <ProductCardPreview
            product={formData}
            selectedCountry={selectedCountry}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>
    </div>
  );
}
