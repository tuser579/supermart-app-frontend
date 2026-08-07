import { useCallback, useState } from 'react';
import * as productApi from '../services/productApi';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { Product, ProductListResponse } from '../../../shared/types/product.types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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
      const filteredData = (response.data || []).filter((p) => (p as any).isActive !== false);
      setProducts(filteredData);
      setPagination(response.meta);
      return { success: true, data: { ...response, data: filteredData } };
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
    if (loadingMore) return { success: false };
    setLoadingMore(true);
    try {
      const response = await productApi.fetchProducts(params);
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = (response.data || []).filter(
          (p) => !existingIds.has(p.id) && (p as any).isActive !== false
        );
        return [...prev, ...newItems];
      });
      setPagination(response.meta);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  return {
    products,
    loading,
    loadingMore,
    error,
    pagination,
    fetchProducts,
    loadMore,
  };
}

