import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface AsyncActionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export interface AsyncActionState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

/**
 * Hook para gerenciar ações assíncronas com loading, error e success states
 * Padroniza o tratamento de loading states em toda a aplicação
 */
export const useAsyncAction = <T = any>(
  action: (...args: any[]) => Promise<T>,
  options: AsyncActionOptions = {}
) => {
  const [state, setState] = useState<AsyncActionState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await action(...args);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          data: result,
          error: null,
        }));

        // Callback de sucesso
        onSuccess?.(result);

        // Toast de sucesso
        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorObj,
        }));

        // Callback de erro
        onError?.(errorObj);

        // Toast de erro
        if (showErrorToast) {
          const message = errorMessage || getErrorMessage(errorObj);
          toast.error(message);
        }

        return null;
      }
    },
    [action, successMessage, errorMessage, onSuccess, onError, showSuccessToast, showErrorToast]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

/**
 * Extrai mensagem de erro de diferentes tipos de erro
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.code === 'NETWORK_ERROR') {
    return 'Erro de conexão. Verifique sua internet.';
  }

  return 'Ocorreu um erro inesperado.';
};

/**
 * Hook específico para operações CRUD
 */
export const useCrudActions = <T = any>(service: {
  create?: (data: any) => Promise<T>;
  update?: (id: string, data: any) => Promise<T>;
  delete?: (id: string) => Promise<void>;
}) => {
  const createAction = useAsyncAction(
    service.create || (() => Promise.reject(new Error('Create not implemented'))),
    {
      successMessage: 'Item criado com sucesso!',
      errorMessage: 'Erro ao criar item',
    }
  );

  const updateAction = useAsyncAction(
    service.update || (() => Promise.reject(new Error('Update not implemented'))),
    {
      successMessage: 'Item atualizado com sucesso!',
      errorMessage: 'Erro ao atualizar item',
    }
  );

  const deleteAction = useAsyncAction(
    service.delete || (() => Promise.reject(new Error('Delete not implemented'))),
    {
      successMessage: 'Item excluído com sucesso!',
      errorMessage: 'Erro ao excluir item',
    }
  );

  return {
    create: createAction,
    update: updateAction,
    delete: deleteAction,
    isLoading: createAction.isLoading || updateAction.isLoading || deleteAction.isLoading,
    hasError: createAction.error || updateAction.error || deleteAction.error,
  };
};

/**
 * Hook para operações de upload de arquivo
 */
export const useFileUpload = (
  uploadFn: (file: File, onProgress?: (progress: number) => void) => Promise<any>,
  options: AsyncActionOptions = {}
) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAction = useAsyncAction(
    async (file: File) => {
      setUploadProgress(0);
      return uploadFn(file, setUploadProgress);
    },
    {
      successMessage: 'Arquivo enviado com sucesso!',
      errorMessage: 'Erro ao enviar arquivo',
      ...options,
    }
  );

  const reset = () => {
    uploadAction.reset();
    setUploadProgress(0);
  };

  return {
    ...uploadAction,
    uploadProgress,
    reset,
  };
};
