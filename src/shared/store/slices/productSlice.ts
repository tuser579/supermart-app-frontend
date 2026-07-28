import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types/product.types';

export interface ProductState {
  list: Product[];
  categories: string[];
  selectedProduct: Product | null;
  isLoading: boolean;
}

const initialState: ProductState = {
  list: [],
  categories: [],
  selectedProduct: null,
  isLoading: false,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.list = action.payload;
    },
    appendProducts: (state, action: PayloadAction<Product[]>) => {
      state.list = [...state.list, ...action.payload];
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setProducts, appendProducts, setCategories, setSelectedProduct, setLoading } = productSlice.actions;
export default productSlice.reducer;
