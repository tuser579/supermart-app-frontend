import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../../types/cart.types';

export interface CartState {
  items: CartItem[];
  totalAmount: number;     // Subtotal after item discount prices
  originalAmount: number;  // Subtotal before item discount prices
  discountSavings: number; // Item-level discount savings (originalAmount - totalAmount)
  itemCount: number;
  couponCode: string | null;
  couponDiscount: number;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  originalAmount: 0,
  discountSavings: 0,
  itemCount: 0,
  couponCode: null,
  couponDiscount: 0,
};

function recalc(state: CartState) {
  state.itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  
  // Calculate original price total vs effective discount price total
  state.originalAmount = state.items.reduce((sum, i) => {
    const basePrice = i.product?.price || i.subtotal / (i.quantity || 1);
    return sum + (basePrice * i.quantity);
  }, 0);

  state.totalAmount = state.items.reduce((sum, i) => sum + i.subtotal, 0);
  
  state.discountSavings = Math.max(0, state.originalAmount - state.totalAmount);

  // Recalculate percentage coupons if active
  if (state.couponCode) {
    const code = state.couponCode.toUpperCase().trim();
    if (code === 'SUPER10' || code === 'SAVE10') {
      state.couponDiscount = Math.round(state.totalAmount * 0.10);
    } else if (code === 'SUPER20' || code === 'SAVE20') {
      state.couponDiscount = Math.round(state.totalAmount * 0.20);
    }
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      recalc(state);
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId || i.id === action.payload.id
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
        existing.subtotal = existing.quantity * (existing.product.discountPrice ?? existing.product.price);
      } else {
        state.items.push(action.payload);
      }
      recalc(state);
    },
    updateQty: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        item.subtotal = item.quantity * (item.product.discountPrice ?? item.product.price);
      }
      recalc(state);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      recalc(state);
    },
    applyCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      state.couponCode = action.payload.code;
      state.couponDiscount = action.payload.discount;
      recalc(state);
    },
    removeCoupon: (state) => {
      state.couponCode = null;
      state.couponDiscount = 0;
      recalc(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.originalAmount = 0;
      state.discountSavings = 0;
      state.itemCount = 0;
      state.couponCode = null;
      state.couponDiscount = 0;
    },
  },
});

export const { setCart, addItem, updateQty, removeItem, applyCoupon, removeCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
