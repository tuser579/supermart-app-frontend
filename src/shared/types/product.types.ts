export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice: number | null;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  rating: number;
  ratingCount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductListResponse {
  data: Product[];
  meta: ProductPagination;
}

export interface ReviewPayload {
  productId: string;
  rating: number;
  comment: string;
}
