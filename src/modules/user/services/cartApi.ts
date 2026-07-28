import { get, post, put, del } from '../../../shared/api/apiClient';
import { Cart, CartItem, AddToCartPayload, UpdateCartPayload } from '../../../shared/types/cart.types';

export async function fetchCart(): Promise<Cart> {
  return get<Cart>('/cart');
}

export async function addToCart(payload: AddToCartPayload): Promise<CartItem> {
  const cleanProductId = String(payload.productId || '').replace(/^cart_item_/, '').trim();
  const cleanQuantity = Math.max(1, Math.round(Number(payload.quantity) || 1));
  if (!cleanProductId || cleanProductId === 'undefined' || cleanProductId === 'null') {
    console.warn('cartApi.addToCart skipped invalid productId:', payload);
    return {} as CartItem;
  }
  return post<CartItem>('/cart/items', { productId: cleanProductId, quantity: cleanQuantity });
}

export async function updateCartItem(itemId: string, payload: UpdateCartPayload): Promise<CartItem> {
  const cleanQuantity = Math.max(1, Math.round(Number(payload.quantity) || 1));
  return put<CartItem>(`/cart/items/${itemId}`, { quantity: cleanQuantity });
}

export async function removeCartItem(itemId: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/cart/items/${itemId}`);
}

export async function clearCart(): Promise<{ message: string }> {
  return del<{ message: string }>('/cart');
}
