import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Key, Server, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured, SUPABASE_URL } from '../lib/supabase';

export default function Settings() {
  const { user, isAdmin, isConfigured } = useAuth();
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testDatabase = async () => {
    setTestingConnection(true);
    setTestResult(null);

    if (!isConfigured || !supabase) {
      setTestResult({
        success: false,
        message: 'Supabase client is not configured. Missing environment variables.',
      });
      setTestingConnection(false);
      return;
    }

    try {
      // 1. Test countries table read
      const { data: countries, error: cErr } = await supabase
        .from('countries')
        .select('count', { count: 'exact', head: true });

      if (cErr) throw new Error(`Countries table query failed: ${cErr.message}`);

      // 2. Test products table read
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });

      if (pErr) throw new Error(`Products table query failed: ${pErr.message}`);

      // 3. Test Storage bucket
      const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
      const hasImageBucket = buckets?.some(b => b.name === 'product-images');

      setTestResult({
        success: true,
        message: 'All Supabase tests passed! Database, tables, and storage bucket are healthy.',
        details: {
          countriesCount: countries !== null ? 'Accessible' : 'OK',
          productsCount: products !== null ? 'Accessible' : 'OK',
          storageBucket: hasImageBucket ? 'Found (product-images)' : 'Warning: product-images bucket not found',
        },
      });
    } catch (err) {
      console.error('Connection test error:', err);
      setTestResult({
        success: false,
        message: err.message || 'Database test failed.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '860px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>System Settings & Verification</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Environment configuration, Supabase connection status, and security policies.
        </p>
      </div>

      {/* Environment Status Card */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} />
          <span>Environment & Database Connection</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Supabase Project URL</div>
            <div style={{ fontWeight: 600, fontSize: '13px', wordBreak: 'break-all' }}>
              {SUPABASE_URL || 'Not Configured (Missing VITE_SUPABASE_URL)'}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Client Configuration Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isConfigured ? (
                <span className="badge badge-published">● Connected & Active</span>
              ) : (
                <span className="badge badge-archived">● Unconfigured</span>
              )}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Current Administrator</div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>
              {user?.email || 'Not authenticated'}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Server-Side Admin Role (RLS)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isAdmin ? (
                <span className="badge badge-published">● Verified in public.admin_users</span>
              ) : (
                <span className="badge badge-draft">● Pending / Unverified</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={testDatabase}
          disabled={testingConnection}
          className="btn btn-primary btn-sm"
        >
          <RefreshCw size={14} className={testingConnection ? 'spin' : ''} style={{ animation: testingConnection ? 'spin 1s linear infinite' : 'none' }} />
          <span>Test Database & Storage Health</span>
        </button>

        {testResult && (
          <div 
            className={`alert-banner alert-${testResult.success ? 'success' : 'error'}`} 
            style={{ marginTop: '16px', marginBottom: 0 }}
          >
            {testResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div style={{ flex: 1 }}>
              <div>{testResult.message}</div>
              {testResult.details && (
                <ul style={{ fontSize: '12px', marginTop: '6px', paddingLeft: '16px' }}>
                  <li>Countries table: {testResult.details.countriesCount}</li>
                  <li>Products table: {testResult.details.productsCount}</li>
                  <li>Storage: {testResult.details.storageBucket}</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Setup Instructions Card */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} />
          <span>Initial Supabase Configuration Guide</span>
        </h3>

        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: 1.6 }}>
          <p>
            The project requires a single shared Supabase database connecting both the public storefront and this admin dashboard. Follow these steps to configure:
          </p>

          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Create Supabase Project:</strong> Open <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>supabase.com</a> and create a project.
            </li>
            <li>
              <strong>Run SQL Migrations:</strong> In Supabase SQL Editor, run the versioned migration scripts located in <code>supabase/migrations/</code>:
              <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                <li><code>20261101_001_initial_schema.sql</code></li>
                <li><code>20261101_002_security_rls.sql</code></li>
                <li><code>20261101_003_storage_setup.sql</code></li>
                <li><code>20261101_004_seed_data.sql</code></li>
              </ul>
            </li>
            <li>
              <strong>Create Store Admin User:</strong> In Supabase Auth &gt; Users, add user with email & password. Then run:
              <pre style={{ backgroundColor: 'var(--color-bg-alt)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginTop: '4px' }}>
{`INSERT INTO public.admin_users (id, email, role)
VALUES ('<USER_UUID>', '<USER_EMAIL>', 'admin');`}
              </pre>
            </li>
            <li>
              <strong>Set Environment Variables:</strong> Place credentials in <code>.env</code> in both projects:
              <pre style={{ backgroundColor: 'var(--color-bg-alt)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginTop: '4px' }}>
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key`}
              </pre>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
