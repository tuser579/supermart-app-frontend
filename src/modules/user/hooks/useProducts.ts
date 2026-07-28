import { useCallback, useState } from 'react';
import * as productApi from '../services/productApi';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { Product, ProductListResponse } from '../../../shared/types/product.types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<ProductListResponse['meta'] | null>(null);

  const fetchProducts = useCallback(async (params?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError('');
    try {
      const response = await productApi.fetchProducts(params);
      setProducts(response.data);
      setPagination(response.meta);
      return { success: true, data: response };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (params?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await productApi.fetchProducts(params);
      setProducts((prev) => [...prev, ...response.data]);
      setPagination(response.meta);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    loadMore,
  };
}
