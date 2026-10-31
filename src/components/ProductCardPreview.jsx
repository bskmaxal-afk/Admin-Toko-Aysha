import React from 'react';
import { getProductImageUrl } from '../services/storage';

export default function ProductCardPreview({
  product,
  selectedCountry,
  selectedCategory,
}) {
  const imageUrl = getProductImageUrl(product.image_path);
  const flag = selectedCountry?.flag_emoji || '🌏';
  const countryName = selectedCountry?.name || 'Asian Market';
  const categoryName = selectedCategory?.name || 'Category';

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Live Storefront Preview
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
          As shown on toko-aysha.vercel.app
        </span>
      </div>

      <div 
        className="card"
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '320px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Product Image Area */}
        <div 
          style={{
            aspectRatio: '1/1',
            backgroundColor: '#FAF7F2',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name || 'Product'} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '20px' }}>
              <span style={{ fontSize: '32px' }}>🛍️</span>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>No photo uploaded</p>
            </div>
          )}

          {/* Country Badge */}
          <div 
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span>{flag}</span>
            <span style={{ fontSize: '11px' }}>{countryName}</span>
          </div>

          {/* Availability Pill */}
          <div 
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
            }}
          >
            <span 
              className={`badge badge-${product.availability === 'available' ? 'available' : 'unavailable'}`}
              style={{ fontSize: '11px' }}
            >
              {product.availability === 'available' ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {product.brand || 'Toko Aysha'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-brand)', fontWeight: 700 }}>
              {categoryName}
            </span>
          </div>

          <h4 
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              lineHeight: 1.3,
              marginBottom: '6px',
            }}
          >
            {product.name || 'Product Name Example'}
          </h4>

          {product.package_size && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              Net: {product.package_size}
            </p>
          )}

          <div 
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              Contact Store for Pricing
            </span>
            <span 
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
              }}
            >
              Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
