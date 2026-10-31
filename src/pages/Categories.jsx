import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getCategories, createCategory, updateCategory, removeOrDeactivateCategory } from '../services/categories';
import { slugify } from '../utils/slugify';
import LoadingState from '../components/LoadingState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', tagline: '', description: '', is_active: true });
  const [notice, setNotice] = useState(null);
  const [categoryToDeactivate, setCategoryToDeactivate] = useState(null);

  const fetchCats = () => {
    setLoading(true);
    getCategories(true)
      .then((data) => setCategories(data || []))
      .catch((err) => console.error('Error fetching categories:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', tagline: '', description: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      tagline: cat.tagline || '',
      description: cat.description || '',
      is_active: cat.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const slug = formData.slug || slugify(formData.name);
      if (editingCategory) {
        await updateCategory(editingCategory.id, { ...formData, slug });
        setNotice({ type: 'success', message: `Category "${formData.name}" updated successfully.` });
      } else {
        await createCategory({ ...formData, slug });
        setNotice({ type: 'success', message: `Category "${formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      fetchCats();
    } catch (err) {
      console.error('Category save error:', err);
      setNotice({ type: 'error', message: err.message || 'Failed to save category.' });
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!categoryToDeactivate) return;
    try {
      await removeOrDeactivateCategory(categoryToDeactivate.id, 'deactivate');
      setNotice({ type: 'success', message: `Category "${categoryToDeactivate.name}" deactivated.` });
      setCategoryToDeactivate(null);
      fetchCats();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to deactivate category.' });
    }
  };

  if (loading) {
    return <LoadingState message="Loading categories..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Store Categories</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Manage product categories dynamically without modifying source code.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {notice && (
        <div className={`alert-banner alert-${notice.type}`}>
          {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="card table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>
                  <strong style={{ color: 'var(--color-text-main)' }}>{cat.name}</strong>
                  {cat.tagline && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{cat.tagline}</div>
                  )}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {cat.slug}
                </td>
                <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '300px' }}>
                  {cat.description || '-'}
                </td>
                <td>
                  <span className={`badge badge-${cat.is_active ? 'published' : 'archived'}`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button onClick={() => handleOpenEdit(cat)} className="btn btn-secondary btn-sm">
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    {cat.is_active && (
                      <button
                        onClick={() => setCategoryToDeactivate(cat)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#D97706' }}
                        title="Deactivate category safely"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name,
                      slug: editingCategory ? prev.slug : slugify(name),
                    }));
                  }}
                  placeholder="e.g. Frozen Food"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. frozen-food"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tagline (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Dumplings, tempeh & frozen delicacies"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description for storefront category cards..."
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="cat-active" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Active (Visible in Store Catalog Filter)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDeactivate)}
        title="Deactivate Category?"
        message={`Are you sure you want to deactivate "${categoryToDeactivate?.name}"? Deactivating keeps all existing product relationships safe but hides this category from the public filter bar.`}
        confirmLabel="Deactivate"
        cancelLabel="Keep Active"
        confirmVariant="danger"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setCategoryToDeactivate(null)}
      />
    </div>
  );
}
