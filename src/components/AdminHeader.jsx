import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus, ExternalLink } from 'lucide-react';

export default function AdminHeader({ onToggleSidebar }) {
  const location = useLocation();

  // Page title mapping
  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Store Overview';
    if (pathname === '/products') return 'Product Catalog';
    if (pathname === '/products/new') return 'Add New Product';
    if (pathname.startsWith('/products/edit/')) return 'Edit Product';
    if (pathname === '/categories') return 'Category Management';
    if (pathname === '/countries') return 'Country Origins';
    if (pathname === '/archived') return 'Archived Inventory';
    if (pathname === '/settings') return 'System & Database Settings';
    return 'Admin Dashboard';
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mobile-menu-btn"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-title-box">
          <h2>{title}</h2>
        </div>
      </div>

      <div className="header-right">
        {/* Quick Add Product button if not already on add page */}
        {location.pathname !== '/products/new' && (
          <Link to="/products/new" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        )}

        {/* Live Public Website Link */}
        <a
          href={import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'https://toko-aysha.vercel.app'}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)', fontWeight: 700 }}
          title="Visit Public Toko Aysha Website"
        >
          <ExternalLink size={14} style={{ color: 'var(--color-accent)' }} />
          <span>Live Storefront</span>
        </a>
      </div>
    </header>
  );
}
