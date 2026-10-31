import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No products found',
  description = 'Try adjusting your search query or filters to find what you are looking for.',
  actionLabel,
  onAction,
  icon: Icon = PackageOpen,
}) {
  return (
    <div 
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div 
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-bg-alt)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '420px', marginBottom: actionLabel ? '20px' : '0' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
