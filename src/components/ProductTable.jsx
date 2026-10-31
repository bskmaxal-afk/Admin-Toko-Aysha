import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Archive, RotateCcw, ExternalLink } from 'lucide-react';
import { StatusBadge, AvailabilityBadge } from './StatusBadge';
import { getProductImageUrl } from '../services/storage';

export default function ProductTable({
  products = [],
  onArchive,
  onRestore,
  isArchiveView = false,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="card table-container">
      {/* Desktop Table View */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Origin</th>
            <th>Category</th>
            <th>Availability</th>
            <th>Status</th>
            <th>Updated</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const thumbUrl = getProductImageUrl(p.image_path);
            const flag = p.country?.flag_emoji || '🌏';
            const countryName = p.country?.name || 'Asian Market';
            const categoryName = p.category?.name || 'Category';

            return (
              <tr key={p.id}>
                {/* Product Name & Brand & Thumbnail */}
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">
                      {thumbUrl ? (
                        <img 
                          src={thumbUrl} 
                          alt={p.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '18px' }}>🛍️</span>
                      )}
                    </div>
                    <div>
                      <div className="product-cell-name">{p.name}</div>
                      <div className="product-cell-brand">
                        {p.brand ? p.brand : 'Toko Aysha'}
                        {p.package_size ? ` • ${p.package_size}` : ''}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Country */}
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
                    <span>{flag}</span>
                    <span>{countryName}</span>
                  </span>
                </td>

                {/* Category */}
                <td>
                  <span 
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-bg-alt)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {categoryName}
                  </span>
                </td>

                {/* Stock Availability */}
                <td>
                  <AvailabilityBadge availability={p.availability} />
                </td>

                {/* Status */}
                <td>
                  <StatusBadge status={p.status} />
                </td>

                {/* Updated Date */}
                <td style={{ fontSize: '13px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(p.updated_at)}
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    {!isArchiveView ? (
                      <>
                        <Link 
                          to={`/products/edit/${p.id}`} 
                          className="btn btn-secondary btn-sm"
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </Link>
                        {onArchive && (
                          <button
                            type="button"
                            onClick={() => onArchive(p)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#DC2626' }}
                            title="Archive Product"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onRestore && (
                          <button
                            type="button"
                            onClick={() => onRestore(p)}
                            className="btn btn-primary btn-sm"
                            title="Restore Product"
                          >
                            <RotateCcw size={14} />
                            <span>Restore</span>
                          </button>
                        )}
                        <Link 
                          to={`/products/edit/${p.id}`} 
                          className="btn btn-secondary btn-sm"
                          title="Inspect Details"
                        >
                          <Edit2 size={14} />
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
