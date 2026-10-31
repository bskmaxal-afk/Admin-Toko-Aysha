import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { getCountries } from '../services/countries';
import { getCategories } from '../services/categories';
import { archiveProduct } from '../services/products';
import ProductTable from '../components/ProductTable';
import FilterBar from '../components/FilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';

export default function Products() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'active';
  const initialAvailability = searchParams.get('availability') || 'all';

  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productToArchive, setProductToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);

  // Products Hook
  const {
    products,
    total,
    totalPages,
    page,
    setPage,
    loading,
    error,
    status,
    setStatus,
    availability,
    setAvailability,
    countryId,
    setCountryId,
    categoryId,
    setCategoryId,
    search,
    setSearch,
    sortBy,
    setSortBy,
    refetch,
    resetFilters,
  } = useProducts({
    initialStatus,
    initialAvailability,
  });

  // Load countries and categories for filter dropdowns
  useEffect(() => {
    Promise.all([getCountries(), getCategories()])
      .then(([cList, catList]) => {
        setCountries(cList || []);
        setCategories(catList || []);
      })
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  const handleArchiveConfirm = async () => {
    if (!productToArchive) return;
    setIsArchiving(true);
    try {
      await archiveProduct(productToArchive.id);
      setBannerNotice({
        type: 'success',
        message: `Product "${productToArchive.name}" has been archived and removed from the public catalog.`,
      });
      setProductToArchive(null);
      refetch();
    } catch (err) {
      console.error('Failed to archive product:', err);
      setBannerNotice({
        type: 'error',
        message: err.message || 'Failed to archive product.',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Store Products</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Showing {products.length} of {total} items in active catalog
          </p>
        </div>

        <Link to="/products/new" className="btn btn-primary btn-sm">
          <PlusCircle size={16} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Banner Notice */}
      {bannerNotice && (
        <div className={`alert-banner alert-${bannerNotice.type}`}>
          {bannerNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{bannerNotice.message}</span>
        </div>
      )}

      {/* Filters & Search */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        countries={countries}
        countryId={countryId}
        onCountryChange={setCountryId}
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        status={status}
        onStatusChange={setStatus}
        availability={availability}
        onAvailabilityChange={setAvailability}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={resetFilters}
      />

      {/* Content Area */}
      {loading ? (
        <LoadingState message="Loading catalog inventory..." />
      ) : error ? (
        <div className="alert-banner alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products matched your criteria"
          description="Try broadening your search term or clearing the active filters."
          actionLabel="Clear Filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          <ProductTable
            products={products}
            onArchive={(prod) => setProductToArchive(prod)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card pagination-bar">
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Page {page} of {totalPages} ({total} total products)
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Archiving Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToArchive)}
        title="Archive this product?"
        message={`Are you sure you want to archive "${productToArchive?.name}"? It will immediately disappear from the public toko-aysha.vercel.app storefront. You can restore it later from the Archived Products page.`}
        confirmLabel="Archive Product"
        cancelLabel="Keep Product"
        confirmVariant="danger"
        isProcessing={isArchiving}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setProductToArchive(null)}
      />
    </div>
  );
}
