import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Globe, 
  FileEdit, 
  Archive, 
  AlertOctagon, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Tags,
  CheckCircle2
} from 'lucide-react';
import { getDashboardStats } from '../services/products';
import { StatusBadge, AvailabilityBadge } from '../components/StatusBadge';
import { getProductImageUrl } from '../services/storage';
import LoadingState from '../components/LoadingState';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('Dashboard stats fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard statistics..." />;
  }

  const statCards = [
    {
      title: 'Total Active Products',
      count: stats?.totalActive || 0,
      icon: Package,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-light)',
      link: '/products',
    },
    {
      title: 'Live Published',
      count: stats?.published || 0,
      icon: Globe,
      color: '#1B6839',
      bg: '#EDF7F1',
      link: '/products?status=published',
    },
    {
      title: 'Drafts in Review',
      count: stats?.draft || 0,
      icon: FileEdit,
      color: 'var(--color-accent)',
      bg: 'var(--color-accent-light)',
      link: '/products?status=draft',
    },
    {
      title: 'Out of Stock',
      count: stats?.unavailable || 0,
      icon: AlertOctagon,
      color: 'var(--color-status-draft)',
      bg: 'var(--color-status-draft-bg)',
      link: '/products?availability=unavailable',
    },
    {
      title: 'Archived Products',
      count: stats?.archived || 0,
      icon: Archive,
      color: 'var(--color-text-secondary)',
      bg: 'var(--color-bg-alt)',
      link: '/archived',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Welcome */}
      <div 
        className="card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #FAF7F2 0%, #FFFFFF 100%)',
          borderLeft: '4px solid var(--color-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '4px' }}>
            Store Catalog Overview
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Real-time inventory metrics connected to Toko Aysha Asian Market database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/products/new" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Add New Product</span>
          </Link>
          <Link to="/products" className="btn btn-secondary btn-sm">
            <span>Browse Inventory</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.link} className="card stat-card" style={{ textDecoration: 'none' }}>
              <div className="stat-info">
                <p>{card.title}</p>
                <div className="stat-number">{card.count}</div>
              </div>
              <div className="stat-icon" style={{ backgroundColor: card.bg, color: card.color }}>
                <Icon size={22} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Recent Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Recently Updated Products */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recently Updated Products</h3>
            <Link to="/products" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
              View all
            </Link>
          </div>

          {stats?.recentProducts?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentProducts.map((p) => {
                const thumb = getProductImageUrl(p.image_path);
                return (
                  <div 
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-surface-soft)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="product-thumb" style={{ width: '40px', height: '40px' }}>
                        {thumb ? (
                          <img src={thumb} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '16px' }}>🛍️</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {p.brand || 'Toko Aysha'} • {p.country?.flag_emoji || '🌏'} {p.category?.name || ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={p.status} />
                      <Link to={`/products/edit/${p.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '12px' }}>
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              No products found in database yet. Add your first product to get started.
            </p>
          )}
        </div>

        {/* Quick Operations Guide */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Store Inventory Workflows</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: '#EDF7F1', color: '#1B6839', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '13px' }}>
                1
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>Add Verified Products</strong>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Upload actual photographs and specify country of origin and category before publishing.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '13px' }}>
                2
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>Review & Publish</strong>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Save products as drafts while gathering details. When ready, publishing makes them immediately live.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '13px' }}>
                3
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>Safe Archiving & Restoring</strong>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Archiving safely soft-deletes a product from the storefront. Restoring safely puts it back to draft for re-verification.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px' }}>
            <Link to="/categories" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Tags size={14} />
              <span>Categories</span>
            </Link>
            <Link to="/countries" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Globe size={14} />
              <span>Countries</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
