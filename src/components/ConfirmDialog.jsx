import React from 'react';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger', // 'danger', 'primary', 'brand'
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: confirmVariant === 'danger' ? '#FEE2E2' : '#EDF7F1',
              color: confirmVariant === 'danger' ? '#DC2626' : '#1B6839',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {confirmVariant === 'danger' ? <AlertTriangle size={20} /> : <Info size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '6px' }}>
              {title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn btn-secondary btn-sm"
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className={`btn btn-${confirmVariant === 'danger' ? 'danger' : 'primary'} btn-sm`}
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
