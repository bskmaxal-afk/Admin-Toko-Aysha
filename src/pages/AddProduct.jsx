import React, { useState, useEffect } from 'react';
import { getCountries } from '../services/countries';
import { getCategories } from '../services/categories';
import { createProduct } from '../services/products';
import ProductForm from '../components/ProductForm';
import LoadingState from '../components/LoadingState';

export default function AddProduct() {
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCountries(), getCategories()])
      .then(([cList, catList]) => {
        setCountries(cList || []);
        setCategories(catList || []);
      })
      .catch((err) => console.error('Failed to load form dependencies:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (formData) => {
    return createProduct(formData);
  };

  if (loading) {
    return <LoadingState message="Loading form configuration..." />;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Add New Grocery Product</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Enter authentic product details and upload a photo to add to Toko Aysha catalog.
        </p>
      </div>

      <ProductForm
        countries={countries}
        categories={categories}
        onSubmit={handleCreate}
      />
    </div>
  );
}
