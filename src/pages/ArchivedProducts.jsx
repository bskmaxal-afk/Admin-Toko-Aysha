import React, { useState, useEffect } from 'react';
import { Archive, RotateCcw, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { getCountries } from '../services/countries';
import { getCategories } from '../services/categories';
import { restoreProduct } from '../services/products';
import ProductTable from '../components/ProductTable';
import FilterBar from '../components/FilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';

export default function ArchivedProducts() {
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productToRestore, setProductToRestore] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);

  const {
    products,
    total,
    totalPages,
    page,
    setPage,
    loading,
    error,
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
    initialStatus: 'archived',
  });

  useEffect(() => {
    Promise.all([getCountries(), getCategories()])
      .then(([cList, catList]) => {
        setCountries(cList || []);
        setCategories(catList || []);
      })
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  const handleRestoreConfirm = async () => {
    if (!productToRestore) return;
    setIsRestoring(true);
    try {
      // Restore to DRAFT by default as per Section 11 rules
      await restoreProduct(productToRestore.id, 'draft');
      setBannerNotice({
        type: 'success',
        message: `Product "${productToRestore.name}" restored as Draft. You can now review it and publish when verified.`,
      });
      setProductToRestore(null);
      refetch();
    } catch (err) {
      console.error('Failed to restore product:', err);
      setBannerNotice({
        type: 'error',
        message: err.message || 'Failed to restore product.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Archived Products</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Discontinued or archived items hidden from the public storefront. Restoring moves items back to Draft for verification.
        </p>
      </div>

      {bannerNotice && (
        <div className={`alert-banner alert-${bannerNotice.type}`}>
          {bannerNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{bannerNotice.message}</span>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        countries={countries}
        countryId={countryId}
        onCountryChange={setCountryId}
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        showStatusFilter={false}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={resetFilters}
      />

      {loading ? (
        <LoadingState message="Loading archived catalog records..." />
      ) : error ? (
        <div className="alert-banner alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No archived products found"
          description="There are currently no products in the archive."
          icon={Archive}
        />
      ) : (
        <>
          <ProductTable
            products={products}
            isArchiveView={true}
            onRestore={(prod) => setProductToRestore(prod)}
          />

          {totalPages > 1 && (
            <div className="card pagination-bar">
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Page {page} of {totalPages} ({total} archived items)
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

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToRestore)}
        title="Restore Product to Draft?"
        message={`Restore "${productToRestore?.name}" back to active inventory? By default, the product will be placed into 'Draft' status so you can review details before publishing it to the live public store.`}
        confirmLabel="Restore as Draft"
        cancelLabel="Cancel"
        confirmVariant="primary"
        isProcessing={isRestoring}
        onConfirm={handleRestoreConfirm}
        onCancel={() => setProductToRestore(null)}
      />
    </div>
  );
}
