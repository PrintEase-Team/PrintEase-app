import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDER_STORAGE_KEY = 'printease_order_state';

interface OrderState {
  currentOrderId: string | null;
  currentFileId: string | null;
  selectedShopId: string | null;
  filePageCount: number;
  totalAmount: number | null;
  fileCosts: Record<string, number>;
  setCurrentOrder: (orderId: string, fileId: string, pageCount: number) => void;
  setCurrentFileId: (fileId: string, pageCount: number) => void;
  setSelectedShopId: (shopId: string) => void;
  setTotalAmount: (amount: number) => void;
  setFileCost: (fileId: string, amount: number) => void;
  removeFileCost: (fileId: string) => void;
  clearCurrentOrder: () => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const persistOrderState = async (state: Partial<OrderState>) => {
  try {
    const data = {
      currentOrderId: state.currentOrderId ?? null,
      selectedShopId: state.selectedShopId ?? null,
      fileCosts: state.fileCosts ?? {},
      totalAmount: state.totalAmount ?? null,
    };
    await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.log('Failed to persist order state', e);
  }
};

export const useOrderStore = create<OrderState>((set, get) => ({
  currentOrderId: null,
  currentFileId: null,
  selectedShopId: null,
  filePageCount: 1,
  totalAmount: null,
  fileCosts: {},
  
  setCurrentOrder: (orderId: string, fileId: string, pageCount: number) => {
    set({ currentOrderId: orderId, currentFileId: fileId, filePageCount: pageCount });
    const state = get();
    persistOrderState(state);
  },

  setCurrentFileId: (fileId: string, pageCount: number) => {
    set({ currentFileId: fileId, filePageCount: pageCount });
  },

  setSelectedShopId: (shopId: string) => {
    set({ selectedShopId: shopId });
    const state = get();
    persistOrderState(state);
  },

  setTotalAmount: (amount: number) => {
    set({ totalAmount: amount });
    const state = get();
    persistOrderState(state);
  },
  
  setFileCost: (fileId: string, amount: number) => {
    set((state) => {
      const newCosts = { ...state.fileCosts, [fileId]: amount };
      const newTotal = Object.values(newCosts).reduce((sum, cost) => sum + cost, 0);
      return { fileCosts: newCosts, totalAmount: newTotal };
    });
    const state = get();
    persistOrderState(state);
  },

  removeFileCost: (fileId: string) => {
    set((state) => {
      const newCosts = { ...state.fileCosts };
      delete newCosts[fileId];
      const newTotal = Object.values(newCosts).reduce((sum, cost) => sum + cost, 0);
      return { fileCosts: newCosts, totalAmount: newTotal };
    });
    const state = get();
    persistOrderState(state);
  },
  
  clearCurrentOrder: () => {
    set({ currentOrderId: null, currentFileId: null, filePageCount: 1, totalAmount: null, fileCosts: {} });
    AsyncStorage.removeItem(ORDER_STORAGE_KEY).catch(() => {});
  },

  reset: () => {
    set({ currentOrderId: null, currentFileId: null, selectedShopId: null, filePageCount: 1, totalAmount: null, fileCosts: {} });
    AsyncStorage.removeItem(ORDER_STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(ORDER_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          currentOrderId: data.currentOrderId || null,
          selectedShopId: data.selectedShopId || null,
          fileCosts: data.fileCosts || {},
          totalAmount: data.totalAmount || null,
        });
      }
    } catch (e) {
      console.log('Failed to hydrate order state', e);
    }
  },
}));
