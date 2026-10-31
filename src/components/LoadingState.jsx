import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading inventory data...' }) {
  return (
    <div 
      style={{
        padding: '60px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--color-text-muted)',
      }}
    >
      <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      <p style={{ fontSize: '14px', fontWeight: 600 }}>{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
