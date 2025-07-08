import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const useCarSearch = (initialQuery = '') => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    transmission: '',
    fuelType: '',
    seats: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const searchCars = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: query,
        ...filters,
        ...searchParams,
        page: searchParams.page || pagination.page,
        limit: pagination.limit
      };

      // Remove empty params
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      const response = await axios.get('/cars', { params: cleanParams });

      if (response.data.success) {
        setResults(response.data.cars);
        setPagination(prev => ({
          ...prev,
          page: response.data.currentPage,
          total: response.data.total,
          totalPages: response.data.totalPages
        }));
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Search failed');
      toast.error('Failed to search cars');
    } finally {
      setLoading(false);
    }
  }, [query, filters, pagination.page, pagination.limit]);

  // Search when query or filters change
  useEffect(() => {
    if (query || Object.values(filters).some(filter => filter !== '')) {
      searchCars();
    } else {
      // Load all cars if no search query or filters
      searchCars();
    }
  }, [query, filters]);

  const updateQuery = (newQuery) => {
    setQuery(newQuery);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      transmission: '',
      fuelType: '',
      seats: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const refresh = () => {
    searchCars();
  };

  return {
    results,
    loading,
    error,
    query,
    filters,
    pagination,
    updateQuery,
    updateFilters,
    clearFilters,
    searchCars,
    loadMore,
    goToPage,
    refresh
  };
};

export default useCarSearch;