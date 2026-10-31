import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AlertTriangle, Database } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '../hooks/useAuth';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConfigured } = useAuth();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Container */}
      <div className="admin-main-wrapper">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="admin-content">
          {/* Supabase Missing Configuration Alert */}
          {!isConfigured && (
            <div 
              className="alert-banner" 
              style={{ 
                backgroundColor: '#FFFBEB', 
                border: '1px solid #FCD34D', 
                color: '#92400E',
                marginBottom: '24px' 
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong>Supabase Environment Variables Not Configured:</strong>
                <p style={{ fontSize: '13px', marginTop: '2px' }}>
                  Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in your <code>.env</code> file. Check the <Link to="/settings" style={{ textDecoration: 'underline', fontWeight: 700 }}>Settings page</Link> for detailed instructions.
                </p>
              </div>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
