import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface QRCodeData {
  qrCode: string;
  validationUrl: string;
  qrCodeImage: string;
  product: {
    id: string;
    name: string;
    brand: string;
    sku: string;
  };
}

interface QRState {
  // Estado atual
  currentQRData: QRCodeData | null;
  isGenerating: boolean;

  // QR Codes gerados (cache)
  qrCodes: Record<string, QRCodeData>; // productId -> QRCodeData

  // Modal state
  isModalOpen: boolean;
  selectedProductId: string | null;
  selectedProductName: string | null;

  // Timestamp para forçar re-render
  lastUpdate: number;

  // Actions
  setCurrentQRData: (data: QRCodeData | null) => void;
  setIsGenerating: (generating: boolean) => void;
  addQRCode: (productId: string, data: QRCodeData) => void;
  getQRCode: (productId: string) => QRCodeData | null;
  clearCurrentQR: () => void;
  clearAllQRCodes: () => void;
  clearCache: () => void;

  // Modal actions
  openModal: (productId: string, productName: string) => void;
  closeModal: () => void;
}

export const useQRStore = create<QRState>()(
  persist(
    (set, get) => ({
      currentQRData: null,
      isGenerating: false,
      qrCodes: {},
      isModalOpen: false,
      selectedProductId: null,
      selectedProductName: null,
      lastUpdate: Date.now(),

      setCurrentQRData: (data: QRCodeData | null) => {
        set({ currentQRData: data });
      },

      setIsGenerating: (generating: boolean) => {
        set({ isGenerating: generating });
      },

      addQRCode: (productId: string, data: QRCodeData) => {
        set((state) => ({
          qrCodes: {
            ...state.qrCodes,
            [productId]: data
          },
          currentQRData: data,
          lastUpdate: Date.now() // Atualizar timestamp para forçar re-render
        }));
      },

      getQRCode: (productId: string) => {
        const state = get();
        return state.qrCodes[productId] || null;
      },

      clearCurrentQR: () => {
        set({ currentQRData: null });
      },

      clearAllQRCodes: () => {
        set({
          qrCodes: {},
          currentQRData: null
        });
      },

      clearCache: () => {
        set({
          qrCodes: {},
          currentQRData: null,
          isModalOpen: false,
          selectedProductId: null,
          selectedProductName: null
        });
      },

      openModal: (productId: string, productName: string) => {
        const existingQR = get().qrCodes[productId];
        set({
          isModalOpen: true,
          selectedProductId: productId,
          selectedProductName: productName,
          currentQRData: existingQR || null
        });
      },

      closeModal: () => {
        set({
          isModalOpen: false,
          selectedProductId: null,
          selectedProductName: null
        });
      },
    }),
    {
      name: 'qr-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        qrCodes: state.qrCodes,
      }),
    }
  )
);
