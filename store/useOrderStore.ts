import { create } from 'zustand';

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
}

export const useOrderStore = create<OrderState>((set) => ({
  currentOrderId: null,
  currentFileId: null,
  selectedShopId: null,
  filePageCount: 1,
  totalAmount: null,
  fileCosts: {},
  
  setCurrentOrder: (orderId: string, fileId: string, pageCount: number) => {
    set({ currentOrderId: orderId, currentFileId: fileId, filePageCount: pageCount });
  },

  setCurrentFileId: (fileId: string, pageCount: number) => {
    set({ currentFileId: fileId, filePageCount: pageCount });
  },

  setSelectedShopId: (shopId: string) => {
    set({ selectedShopId: shopId });
  },

  setTotalAmount: (amount: number) => {
    set({ totalAmount: amount });
  },
  
  setFileCost: (fileId: string, amount: number) => {
    set((state) => {
      const newCosts = { ...state.fileCosts, [fileId]: amount };
      const newTotal = Object.values(newCosts).reduce((sum, cost) => sum + cost, 0);
      return { fileCosts: newCosts, totalAmount: newTotal };
    });
  },

  removeFileCost: (fileId: string) => {
    set((state) => {
      const newCosts = { ...state.fileCosts };
      delete newCosts[fileId];
      const newTotal = Object.values(newCosts).reduce((sum, cost) => sum + cost, 0);
      return { fileCosts: newCosts, totalAmount: newTotal };
    });
  },
  
  clearCurrentOrder: () => {
    set({ currentOrderId: null, currentFileId: null, filePageCount: 1, totalAmount: null, fileCosts: {} });
  },

  reset: () => {
    set({ currentOrderId: null, currentFileId: null, selectedShopId: null, filePageCount: 1, totalAmount: null });
  }
}));
