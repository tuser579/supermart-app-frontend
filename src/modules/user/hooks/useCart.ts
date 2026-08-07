import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks/useRedux';
import { setCart, addItem, removeItem, updateQty, applyCoupon, removeCoupon, clearCart } from '../../../shared/store/slices/cartSlice';
import * as cartApi from '../services/cartApi';
import * as productApi from '../services/productApi';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { CartItem } from '../../../shared/types/cart.types';
import { Product } from '../../../shared/types/product.types';
import { getStoredCart, saveStoredCart, clearStoredCart } from '../../../shared/utils/storage';
import { isCuid, resolveValidProductId } from '../../../shared/utils/cuidHelper';

function normalizeItems(rawItems: any[]): CartItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((item) => {
    const prod = item.product || {};
    const effectivePrice = prod.discountPrice ?? prod.price ?? item.price ?? 0;
    const qty = item.quantity || 1;
    const pid = item.productId || prod.id || item.id;
    return {
      id: item.id || `cart_item_${pid}`,
      productId: pid,
      product: {
        id: prod.id || pid,
        name: prod.name || item.productName || 'Product',
        price: prod.price ?? item.price ?? 0,
        discountPrice: prod.discountPrice ?? null,
        images: Array.isArray(prod.images) ? prod.images : item.productImage ? [item.productImage] : [],
        stock: prod.stock ?? 999,
      },
      quantity: qty,
      subtotal: item.subtotal ?? (effectivePrice * qty),
    };
  });
}

export function useCart() {
  const dispatch = useAppDispatch();
  const { items, totalAmount, itemCount } = useAppSelector((s) => s.cart);

  const loadCart = useCallback(async () => {
    // 1. Restore from local storage immediately so cart never clears on reload
    const localItems = await getStoredCart();
    if (localItems && localItems.length > 0) {
      dispatch(setCart(normalizeItems(localItems)));
    }

    // 2. Sync with backend API if user is authenticated
    try {
      const cart = await cartApi.fetchCart();
      if (cart && Array.isArray((cart as any).items)) {
        const serverItems = normalizeItems((cart as any).items);
        if (serverItems.length === 0 && localItems && localItems.length > 0) {
          // Server cart is empty but user has local items -> sync local items to server!
          let backendProducts: any[] = [];
          try {
            const prodRes = await productApi.fetchProducts({ limit: 100 });
            backendProducts = prodRes.data || [];
          } catch (e) {}

          for (const item of localItems) {
            const validPId = await resolveValidProductId(item, backendProducts);
            if (validPId) {
              try {
                await cartApi.addToCart({ productId: validPId, quantity: item.quantity });
              } catch (e) {
                // ignore item sync error
              }
            }
          }
          const updatedCart = await cartApi.fetchCart();
          if (updatedCart && Array.isArray((updatedCart as any).items) && updatedCart.items.length > 0) {
            const synced = normalizeItems((updatedCart as any).items);
            dispatch(setCart(synced));
            await saveStoredCart(synced);
          }
        } else if (serverItems.length > 0) {
          dispatch(setCart(serverItems));
          await saveStoredCart(serverItems);
        }
      }
      return { success: true };
    } catch (error) {
      // Backend fetch failed (e.g. guest mode or network error) -> keep local restored items intact!
      return { success: true };
    }
  }, [dispatch]);

  const addToCart = useCallback(
    async (target: Product | string, quantity: number = 1) => {
      let productId = typeof target === 'string' ? target : target.id;
      let productObj: Product | undefined = typeof target !== 'string' ? target : undefined;

      // If target was passed as ID string, try fetching product object for reliable local fallback
      if (!productObj) {
        try {
          const fetched = await productApi.fetchProductById(productId);
          if (fetched) productObj = fetched;
        } catch (e) {
          // ignore
        }
      }

      try {
        if (!isCuid(productId)) {
          let backendProducts: any[] = [];
          try {
            const prodRes = await productApi.fetchProducts({ limit: 100 });
            backendProducts = prodRes.data || [];
          } catch (e) {}
          const resolved = await resolveValidProductId(
            { productId, product: productObj },
            backendProducts
          );
          if (resolved) {
            productId = resolved;
          }
        }

        const cart = await cartApi.addToCart({ productId, quantity });
        if (cart && Array.isArray((cart as any).items)) {
          const serverItems = normalizeItems((cart as any).items);
          dispatch(setCart(serverItems));
          await saveStoredCart(serverItems);
          return { success: true };
        }
        await loadCart();
        return { success: true };
      } catch (error) {
        // Fallback to local Redux cart state & storage
        const currentStored = (await getStoredCart()) || [];

        const effectiveProduct: Product = productObj || {
          id: productId,
          name: `Product #${productId.slice(-6)}`,
          description: '',
          price: 0,
          discountPrice: null,
          category: 'General',
          brand: '',
          stock: 99,
          images: [],
          rating: 0,
          ratingCount: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const effectivePrice = effectiveProduct.discountPrice ?? effectiveProduct.price;
        const localItem: CartItem = {
          id: `cart_item_${effectiveProduct.id}`,
          productId: effectiveProduct.id,
          product: {
            id: effectiveProduct.id,
            name: effectiveProduct.name,
            price: effectiveProduct.price,
            discountPrice: effectiveProduct.discountPrice ?? null,
            images: effectiveProduct.images || [],
            stock: effectiveProduct.stock ?? 99,
          },
          quantity: quantity,
          subtotal: effectivePrice * quantity,
        };

        const existingIdx = currentStored.findIndex(
          (i) => i.productId === effectiveProduct.id || i.id === localItem.id
        );
        let updated: CartItem[] = [];
        if (existingIdx >= 0) {
          updated = [...currentStored];
          updated[existingIdx].quantity += quantity;
          updated[existingIdx].subtotal = updated[existingIdx].quantity * effectivePrice;
        } else {
          updated = [...currentStored, localItem];
        }

        const normalizedUpdated = normalizeItems(updated);
        dispatch(setCart(normalizedUpdated));
        await saveStoredCart(normalizedUpdated);
        return { success: true };
      }
    },
    [dispatch, loadCart]
  );

  const removeItemFromCart = useCallback(
    async (itemId: string) => {
      try {
        const cart = await cartApi.removeCartItem(itemId);
        if (cart && Array.isArray((cart as any).items)) {
          const serverItems = normalizeItems((cart as any).items);
          dispatch(setCart(serverItems));
          await saveStoredCart(serverItems);
        } else {
          dispatch(removeItem(itemId));
          const currentStored = (await getStoredCart()) || [];
          const updated = currentStored.filter((i) => i.id !== itemId && i.productId !== itemId);
          await saveStoredCart(updated);
        }
        return { success: true };
      } catch (error) {
        dispatch(removeItem(itemId));
        const currentStored = (await getStoredCart()) || [];
        const updated = currentStored.filter((i) => i.id !== itemId && i.productId !== itemId);
        await saveStoredCart(updated);
        return { success: true };
      }
    },
    [dispatch]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) {
        return removeItemFromCart(itemId);
      }
      try {
        const cart = await cartApi.updateCartItem(itemId, { quantity });
        if (cart && Array.isArray((cart as any).items)) {
          const serverItems = normalizeItems((cart as any).items);
          dispatch(setCart(serverItems));
          await saveStoredCart(serverItems);
        } else {
          dispatch(updateQty({ id: itemId, quantity }));
          const currentStored = (await getStoredCart()) || [];
          const updated = currentStored.map((i) => {
            if (i.id === itemId || i.productId === itemId) {
              const price = i.product.discountPrice ?? i.product.price;
              return { ...i, quantity, subtotal: price * quantity };
            }
            return i;
          });
          await saveStoredCart(updated);
        }
        return { success: true };
      } catch (error) {
        dispatch(updateQty({ id: itemId, quantity }));
        const currentStored = (await getStoredCart()) || [];
        const updated = currentStored.map((i) => {
          if (i.id === itemId || i.productId === itemId) {
            const price = i.product.discountPrice ?? i.product.price;
            return { ...i, quantity, subtotal: price * quantity };
          }
          return i;
        });
        await saveStoredCart(updated);
        return { success: true };
      }
    },
    [dispatch, removeItemFromCart]
  );

  const clearAllCart = useCallback(async () => {
    try {
      await cartApi.clearCart();
      dispatch(clearCart());
      await clearStoredCart();
      return { success: true };
    } catch (error) {
      dispatch(clearCart());
      await clearStoredCart();
      return { success: true };
    }
  }, [dispatch]);

  const applyCouponCode = useCallback(
    (code: string) => {
      const clean = (code || '').toUpperCase().trim();
      if (!clean) return { success: false, message: 'Please enter a coupon code' };

      let discount = 0;
      if (clean === 'SUPER10' || clean === 'SAVE10') {
        discount = Math.round(totalAmount * 0.10);
      } else if (clean === 'SUPER20' || clean === 'SAVE20') {
        discount = Math.round(totalAmount * 0.20);
      } else if (clean === 'SAVE50' || clean === 'WELCOME50') {
        discount = 50;
      } else if (clean === 'SAVE100' || clean === 'WELCOME100') {
        discount = 100;
      } else {
        return { success: false, message: 'Invalid coupon code' };
      }

      dispatch(applyCoupon({ code: clean, discount }));
      return { success: true, message: `Coupon ${clean} applied successfully!` };
    },
    [dispatch, totalAmount]
  );

  const removeCouponCode = useCallback(() => {
    dispatch(removeCoupon());
  }, [dispatch]);

  const { originalAmount, discountSavings, couponCode, couponDiscount } = useAppSelector((s) => s.cart);

  // Free delivery threshold: Free for orders over ৳2,000!
  const deliveryCharge = itemCount > 0 ? (totalAmount >= 2000 ? 0 : 60) : 0;
  const grandTotal = Math.max(0, totalAmount - couponDiscount + deliveryCharge);

  return {
    items,
    totalAmount,
    originalAmount,
    discountSavings,
    couponCode,
    couponDiscount,
    deliveryCharge,
    grandTotal,
    itemCount,
    loadCart,
    addToCart,
    updateQuantity,
    removeItemFromCart,
    clearAllCart,
    applyCouponCode,
    removeCouponCode,
  };
}
