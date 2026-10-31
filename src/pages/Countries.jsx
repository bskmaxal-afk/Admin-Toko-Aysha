import React, { useState, useEffect } from 'react';
import { Globe2, Plus, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getCountries, createCountry, updateCountry } from '../services/countries';
import { slugify } from '../utils/slugify';
import LoadingState from '../components/LoadingState';

export default function Countries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCountry, setEditingCountry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', slug: '', flag_emoji: '🌏' });
  const [notice, setNotice] = useState(null);

  const fetchCountriesList = () => {
    setLoading(true);
    getCountries()
      .then((data) => setCountries(data || []))
      .catch((err) => console.error('Error fetching countries:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCountriesList();
  }, []);

  const handleOpenAdd = () => {
    setEditingCountry(null);
    setFormData({ name: '', code: '', slug: '', flag_emoji: '🌏' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCountry(c);
    setFormData({
      name: c.name,
      code: c.code || '',
      slug: c.slug,
      flag_emoji: c.flag_emoji || '🌏',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const slug = formData.slug || slugify(formData.name);
      if (editingCountry) {
        await updateCountry(editingCountry.id, { ...formData, slug });
        setNotice({ type: 'success', message: `Country "${formData.name}" updated successfully.` });
      } else {
        await createCountry({ ...formData, slug });
        setNotice({ type: 'success', message: `Country "${formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      fetchCountriesList();
    } catch (err) {
      console.error('Country save error:', err);
      setNotice({ type: 'error', message: err.message || 'Failed to save country.' });
    }
  };

  if (loading) {
    return <LoadingState message="Loading country origins..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Country Origins</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Manage authentic Asian grocery origins used for catalog categorization and filtering.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Add Country</span>
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
              <th>Country</th>
              <th>Flag</th>
              <th>ISO Code</th>
              <th>Slug</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong style={{ color: 'var(--color-text-main)' }}>{c.name}</strong>
                </td>
                <td style={{ fontSize: '20px' }}>
                  {c.flag_emoji || '🌏'}
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {c.code || '-'}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {c.slug}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleOpenEdit(c)} className="btn btn-secondary btn-sm">
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Country Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              {editingCountry ? 'Edit Country' : 'Add New Country'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Country Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name,
                      slug: editingCountry ? prev.slug : slugify(name),
                    }));
                  }}
                  placeholder="e.g. Indonesia"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Flag Emoji</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.flag_emoji}
                    onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })}
                    placeholder="e.g. 🇮🇩"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ISO Code (2-letter)</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={3}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ID"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. indonesia"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Country
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
