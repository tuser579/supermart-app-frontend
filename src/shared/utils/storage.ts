import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { CartItem } from '../types/cart.types';

const ACCESS_TOKEN_KEY = 'supermart_access_token';
const REFRESH_TOKEN_KEY = 'supermart_refresh_token';
const USER_KEY = 'supermart_user';
const THEME_KEY = 'supermart_theme';
const CART_KEY = 'supermart_cart';
const DELETED_PRODUCTS_KEY = 'supermart_deleted_products';

const isWeb = Platform.OS === 'web';

export async function getAccessToken(): Promise<string | null> {
  try {
    if (isWeb) return localStorage.getItem(ACCESS_TOKEN_KEY);
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveAccessToken(token: string): Promise<void> {
  try {
    if (isWeb) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    }
  } catch (e) {
    // Fallback
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (isWeb) return localStorage.getItem(REFRESH_TOKEN_KEY);
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveRefreshToken(token: string): Promise<void> {
  try {
    if (isWeb) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  } catch (e) {
    // Fallback
  }
}

export async function getStoredUser(): Promise<string | null> {
  try {
    if (isWeb) return localStorage.getItem(USER_KEY);
    return await SecureStore.getItemAsync(USER_KEY);
  } catch {
    return null;
  }
}

export async function saveStoredUser(user: string): Promise<void> {
  try {
    if (isWeb) {
      localStorage.setItem(USER_KEY, user);
    } else {
      await SecureStore.setItemAsync(USER_KEY, user);
    }
  } catch (e) {
    // Fallback
  }
}

export async function getStoredTheme(): Promise<string | null> {
  try {
    if (isWeb) return localStorage.getItem(THEME_KEY);
    return await SecureStore.getItemAsync(THEME_KEY);
  } catch {
    return null;
  }
}

export async function saveStoredTheme(theme: string): Promise<void> {
  try {
    if (isWeb) {
      localStorage.setItem(THEME_KEY, theme);
    } else {
      await SecureStore.setItemAsync(THEME_KEY, theme);
    }
  } catch (e) {
    // Fallback
  }
}

export async function getStoredCart(): Promise<CartItem[] | null> {
  try {
    const data = isWeb ? localStorage.getItem(CART_KEY) : await SecureStore.getItemAsync(CART_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveStoredCart(items: CartItem[]): Promise<void> {
  try {
    const data = JSON.stringify(items);
    if (isWeb) {
      localStorage.setItem(CART_KEY, data);
    } else {
      await SecureStore.setItemAsync(CART_KEY, data);
    }
  } catch (e) {
    // Fallback
  }
}

export async function clearStoredCart(): Promise<void> {
  try {
    if (isWeb) {
      localStorage.removeItem(CART_KEY);
    } else {
      await SecureStore.deleteItemAsync(CART_KEY);
    }
  } catch (e) {
    // Fallback
  }
}

export async function clearTokens(): Promise<void> {
  try {
    if (isWeb) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (e) {
    // Fallback
  }
}

export async function getDeletedProducts(): Promise<string[]> {
  try {
    const data = isWeb ? localStorage.getItem(DELETED_PRODUCTS_KEY) : await SecureStore.getItemAsync(DELETED_PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveDeletedProduct(id: string): Promise<void> {
  try {
    const existing = await getDeletedProducts();
    if (!existing.includes(id)) {
      existing.push(id);
      const data = JSON.stringify(existing);
      if (isWeb) {
        localStorage.setItem(DELETED_PRODUCTS_KEY, data);
      } else {
        await SecureStore.setItemAsync(DELETED_PRODUCTS_KEY, data);
      }
    }
  } catch (e) {
    // Fallback
  }
}
