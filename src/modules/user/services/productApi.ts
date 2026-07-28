import { get, getFull, post, put, del, ApiResponse } from '../../../shared/api/apiClient';
import { Product, ProductListResponse, Review, ReviewPayload } from '../../../shared/types/product.types';

export async function fetchProducts(params?: {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<ProductListResponse> {
  const response = await getFull<Product[]>(`/products`, params as Record<string, unknown>);
  return {
    data: response.data,
    meta: response.meta as unknown as ProductListResponse['meta'],
  };
}

export async function fetchProductById(id: string): Promise<Product> {
  return get<Product>(`/products/${id}`);
}

export async function fetchCategories(): Promise<string[]> {
  return get<string[]>('/products/categories');
}

export async function createReview(payload: ReviewPayload): Promise<Review> {
  return post<Review>('/reviews', payload as unknown as Record<string, unknown>);
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  return get<Review[]>('/reviews', { productId });
}
