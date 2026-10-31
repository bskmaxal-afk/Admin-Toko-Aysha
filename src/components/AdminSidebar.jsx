import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  Tags, 
  Globe2, 
  Archive, 
  Settings, 
  LogOut, 
  ExternalLink,
  Store
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/products/new', label: 'Add Product', icon: PlusCircle },
    { to: '/categories', label: 'Categories', icon: Tags },
    { to: '/countries', label: 'Countries', icon: Globe2 },
    { to: '/archived', label: 'Archived Products', icon: Archive },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="modal-overlay" 
          onClick={onClose}
          style={{ zIndex: 35 }}
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-badge">
            <Store size={20} />
          </div>
          <div className="sidebar-brand-text">
            <h1>Toko Aysha</h1>
            <p>Admin Inventory</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Actions Footer */}
        <div className="sidebar-footer">
          {/* Link to live public storefront */}
          <a
            href={import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'https://toko-aysha.vercel.app'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'space-between', fontSize: '12px' }}
          >
            <span>Live Catalog</span>
            <ExternalLink size={14} />
          </a>

          {/* User bar */}
          <div className="user-profile-bar">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-details">
              <div className="email" title={user?.email}>
                {user?.email || 'Administrator'}
              </div>
              <div className="role">Store Admin</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', color: '#DC2626' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
