import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/products';

export function useProducts({
  initialStatus = 'active',
  initialAvailability = 'all',
  initialCountry = 'all',
  initialCategory = 'all',
  initialSort = 'updated_at_desc',
  pageSize = 15,
} = {}) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [status, setStatus] = useState(initialStatus);
  const [availability, setAvailability] = useState(initialAvailability);
  const [countryId, setCountryId] = useState(initialCountry);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(initialSort);

  const fetchProductsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts({
        status,
        availability,
        countryId,
        categoryId,
        search,
        sortBy,
        page,
        limit: pageSize,
      });

      setProducts(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [status, availability, countryId, categoryId, search, sortBy, page, pageSize]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  const resetFilters = () => {
    setStatus(initialStatus);
    setAvailability('all');
    setCountryId('all');
    setCategoryId('all');
    setSearch('');
    setSortBy('updated_at_desc');
    setPage(1);
  };

  return {
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
    refetch: fetchProductsList,
    resetFilters,
  };
}
