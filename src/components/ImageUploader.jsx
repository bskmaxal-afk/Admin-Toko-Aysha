import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import { validateImageFile } from '../utils/validation';
import { uploadProductImage, getProductImageUrl } from '../services/storage';

export default function ImageUploader({
  imagePath,
  onChange,
  productSlug,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const displayUrl = getProductImageUrl(imagePath);

  const handleFileProcess = async (file) => {
    setError(null);
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    try {
      const { path, url } = await uploadProductImage(file, productSlug);
      onChange(path, url);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(err.message || 'Upload failed. Check Supabase Storage permissions.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {displayUrl ? (
        <div 
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            backgroundColor: '#FFFFFF',
            aspectRatio: '1/1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={displayUrl}
            alt="Product preview"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              setError('Failed to display preview from given URL/path.');
            }}
          />
          <div 
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: 'var(--shadow-sm)' }}
              title="Replace image"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="btn btn-danger btn-sm"
              style={{ padding: '6px' }}
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-uploader-box ${dragActive ? 'drag-active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '13px', fontWeight: 600 }}>Uploading to Supabase Storage...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={24} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  Click to upload or drag & drop photo
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  JPEG, PNG, or WebP up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '12px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
