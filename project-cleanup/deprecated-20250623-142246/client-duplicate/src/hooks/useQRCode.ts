import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { qrService } from '@/services/qrService';
import { useQRStore } from '@/stores/qrStore';
import toast from 'react-hot-toast';

export interface QRCodeData {
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

export interface UseQRCodeOptions {
  onSuccess?: (data: QRCodeData) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook unificado para gerenciamento de QR codes
 * Centraliza toda a lógica de geração, cache e estado
 */
export const useQRCode = (productId: string, options: UseQRCodeOptions = {}) => {
  const { addQRCode, getQRCode } = useQRStore();
  const [isGenerating, setIsGenerating] = useState(false);

  // Verificar se já existe QR code no cache
  const cachedQR = getQRCode(productId);

  // Mutation para gerar QR code
  const generateMutation = useMutation({
    mutationFn: () => qrService.generateQRCode(productId),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (data: QRCodeData) => {
      // Adicionar ao cache global
      addQRCode(productId, data);
      
      // Callback personalizado
      options.onSuccess?.(data);
      
      // Toast de sucesso
      const message = options.successMessage || 'QR Code gerado com sucesso!';
      toast.success(message);
    },
    onError: (error: Error) => {
      // Callback personalizado
      options.onError?.(error);
      
      // Toast de erro
      const message = options.errorMessage || error.message || 'Erro ao gerar QR Code';
      toast.error(message);
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Query para buscar estatísticas de acesso
  const accessStatsQuery = useQuery({
    queryKey: ['qr-access-stats', productId],
    queryFn: () => qrService.getQRCodeAccesses(productId),
    enabled: !!cachedQR?.qrCode,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Funções de utilidade
  const generateQRCode = () => {
    if (isGenerating) return;
    generateMutation.mutate();
  };

  const copyToClipboard = async (text: string, type: string = 'Texto') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copiado para a área de transferência!`);
    } catch (error) {
      toast.error('Erro ao copiar para a área de transferência');
    }
  };

  const downloadQRCode = () => {
    if (!cachedQR) return;

    const link = document.createElement('a');
    link.href = cachedQR.qrCodeImage;
    link.download = `qr-code-${cachedQR.product.sku || cachedQR.qrCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('QR Code baixado com sucesso!');
  };

  const openValidationPage = () => {
    if (!cachedQR) return;
    window.open(cachedQR.validationUrl, '_blank');
  };

  return {
    // Estado
    qrData: cachedQR,
    isGenerating: isGenerating || generateMutation.isPending,
    hasQRCode: !!cachedQR,
    
    // Estatísticas
    accessStats: accessStatsQuery.data,
    isLoadingStats: accessStatsQuery.isLoading,
    
    // Ações
    generateQRCode,
    copyToClipboard,
    downloadQRCode,
    openValidationPage,
    
    // Estados de erro
    error: generateMutation.error || accessStatsQuery.error,
    isError: generateMutation.isError || accessStatsQuery.isError,
  };
};

/**
 * Hook para validação pública de QR codes
 */
export const useQRValidation = (qrCode: string) => {
  return useQuery({
    queryKey: ['qr-validation', qrCode],
    queryFn: () => qrService.validateQRCode(qrCode),
    enabled: !!qrCode,
    retry: false,
    staleTime: 0, // Sempre buscar dados frescos para validação
  });
};

/**
 * Hook para modal global de QR codes
 */
export const useQRModal = () => {
  const { 
    isModalOpen, 
    selectedProductId, 
    selectedProductName,
    openModal, 
    closeModal 
  } = useQRStore();

  return {
    isOpen: isModalOpen,
    productId: selectedProductId,
    productName: selectedProductName,
    open: openModal,
    close: closeModal,
  };
};
