import { get, post, del } from '../../../shared/api/apiClient';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
    images: string[];
    brand?: string;
  };
  createdAt: string;
}

export const wishlistApi = {
  getWishlist: () => {
    return get<WishlistItem[]>('/wishlists');
  },
  
  addToWishlist: (productId: string) => {
    return post<WishlistItem>('/wishlists', { productId });
  },
  
  removeFromWishlist: (productId: string) => {
    return del<{ success: boolean }>(`/wishlists/${productId}`);
  },

  clearWishlist: async (items: WishlistItem[]) => {
    if (items && items.length > 0) {
      await Promise.allSettled(items.map((i) => del(`/wishlists/${i.productId}`)));
    }
    try {
      await del('/wishlists');
    } catch (e) {}
    return { success: true };
  }
};
