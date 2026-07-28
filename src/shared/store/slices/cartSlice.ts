import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../../types/cart.types';

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  itemCount: 0,
};

function recalc(state: CartState) {
  state.itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  state.totalAmount = state.items.reduce((sum, i) => sum + i.subtotal, 0);
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
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.itemCount = 0;
    },
  },
});

export const { setCart, addItem, updateQty, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
