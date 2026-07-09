import { create } from 'zustand';

interface OrderState {
  currentOrderId: string | null;
  currentFileId: string | null;
  selectedShopId: string | null;
  filePageCount: number;
  totalAmount: number | null;
  setCurrentOrder: (orderId: string, fileId: string, pageCount: number) => void;
  setSelectedShopId: (shopId: string) => void;
  setTotalAmount: (amount: number) => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentOrderId: null,
  currentFileId: null,
  selectedShopId: null,
  filePageCount: 1,
  totalAmount: null,
  
  setCurrentOrder: (orderId: string, fileId: string, pageCount: number) => {
    set({ currentOrderId: orderId, currentFileId: fileId, filePageCount: pageCount });
  },

  setSelectedShopId: (shopId: string) => {
    set({ selectedShopId: shopId });
  },

  setTotalAmount: (amount: number) => {
    set({ totalAmount: amount });
  },
  
  clearCurrentOrder: () => {
    set({ currentOrderId: null, currentFileId: null, filePageCount: 1, totalAmount: null });
  }
}));
