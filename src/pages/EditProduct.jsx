import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { getCountries } from '../services/countries';
import { getCategories } from '../services/categories';
import { getProductById, updateProduct } from '../services/products';
import ProductForm from '../components/ProductForm';
import LoadingState from '../components/LoadingState';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getProductById(id),
      getCountries(),
      getCategories(),
    ])
      .then(([prod, cList, catList]) => {
        setProduct(prod);
        setCountries(cList || []);
        setCategories(catList || []);
      })
      .catch((err) => {
        console.error('Failed to load product details:', err);
        setError(err.message || 'Product not found.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (formData) => {
    return updateProduct(id, formData);
  };

  if (loading) {
    return <LoadingState message="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: '#DC2626', margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Error Loading Product</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>{error || 'Product not found.'}</p>
        <button onClick={() => navigate('/products')} className="btn btn-secondary btn-sm">
          Return to Product List
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Edit Product Details</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Update product information, packaging size, or replace photograph.
        </p>
      </div>

      <ProductForm
        initialData={product}
        countries={countries}
        categories={categories}
        onSubmit={handleUpdate}
        isEditing={true}
      />
    </div>
  );
}
