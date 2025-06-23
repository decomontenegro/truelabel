/**
 * Utility functions for error handling
 */

/**
 * Safely extract error message from various error types
 */
export const getErrorMessage = (error: any): string => {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Check for axios error response
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Check for common error message fields
    if (typeof data.error === 'string') {
      return data.error;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (typeof data.msg === 'string') {
      return data.msg;
    }
    
    // If data is a string itself
    if (typeof data === 'string') {
      return data;
    }
  }

  // Check for standard error object
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // Check for network errors
  if (error?.code === 'NETWORK_ERROR') {
    return 'Erro de conexão. Verifique sua internet.';
  }

  // Check for timeout errors
  if (error?.code === 'ECONNABORTED') {
    return 'A requisição demorou muito tempo. Tente novamente.';
  }

  // If error is an object, try to stringify it
  if (typeof error === 'object' && error !== null) {
    try {
      const errorStr = JSON.stringify(error);
      if (errorStr !== '{}') {
        return 'Erro: ' + errorStr;
      }
    } catch {
      // Ignore stringify errors
    }
  }

  // Default error message
  return 'Ocorreu um erro inesperado.';
};

/**
 * Show error toast with safe message extraction
 */
export const showErrorToast = (error: any, fallbackMessage: string = 'Ocorreu um erro inesperado.'): void => {
  // Import toast dynamically to avoid circular dependencies
  import('react-hot-toast').then(({ default: toast }) => {
    const message = getErrorMessage(error) || fallbackMessage;
    toast.error(message);
  });
};

/**
 * Log error for debugging
 */
export const logError = (context: string, error: any): void => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
    
    // Log additional details if it's an axios error
    if (error?.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};