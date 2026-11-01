import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Store, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { user, isAdmin, login, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // If already authenticated and verified as admin, redirect to dashboard
  if (user && isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(
        err.message || 'Failed to authenticate. Please verify your email and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        padding: '24px',
      }}
    >
      <div 
        className="card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)',
          borderTop: '4px solid var(--color-primary)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary)',
              color: '#FDE68A',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(123, 17, 26, 0.25)',
            }}
          >
            <Store size={28} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>
            Toko Aysha Admin
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Asian Market Inventory Management
          </p>
        </div>

        {/* Configuration Notice if Supabase is not ready */}
        {!isConfigured && (
          <div 
            className="alert-banner"
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FCD34D',
              color: '#92400E',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Setup Required:</strong>
              <p style={{ marginTop: '2px' }}>
                Supabase credentials not configured in <code>.env</code>. Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label className="form-label">Administrator Email</label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} 
              />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px', width: '100%' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@toko-aysha.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} 
              />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px', width: '100%' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', marginTop: '6px' }}
            disabled={isSubmitting || !isConfigured}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Authorized Store Administrator Access Only • Protected by Supabase Auth & RLS
          </p>
        </div>
      </div>
    </div>
  );
}
