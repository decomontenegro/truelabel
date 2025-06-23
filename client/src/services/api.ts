import axios, { AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import config from '@/config/env';
import { apiRequestLimiter } from '@/lib/rateLimiter';
import { createApiInterceptor } from '@/config/endpoints';
import { getErrorMessage } from '@/utils/errorHandling';

// Configurar base URL da API

// Criar instância do axios
export const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Aplicar interceptors personalizados
createApiInterceptor(api);

// Interceptor para adicionar token de autenticação e rate limiting
api.interceptors.request.use(
  (config) => {
    // Rate limiting global
    const endpoint = `${config.method}-${config.url}`;
    if (!apiRequestLimiter.check(endpoint)) {
      const error: any = new Error('Muitas requisições. Aguarde um momento.');
      error.code = 'RATE_LIMIT_EXCEEDED';
      return Promise.reject(error);
    }

    // Adicionar token de autenticação
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle mock responses
    if (error.__MOCK_RESPONSE__) {
      return Promise.resolve(error.response);
    }
    
    const { response } = error;

    // Tratar erro de rate limiting do cliente
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      toast.error(String(error.message));
      return Promise.reject(error);
    }

    if (response?.status === 401) {
      // Token expirado ou inválido - mas não redirecionar se já estiver na página de login
      const isLoginPage = window.location.pathname.includes('/auth/login') || window.location.pathname.includes('/login');
      
      if (!isLoginPage) {
        useAuthStore.getState().clearAuth();
        toast.error('Sessão expirada. Faça login novamente.');
        window.location.href = '/auth/login';
      }
      // Se estiver na página de login, deixar o componente tratar o erro
    } else if (response?.status === 403) {
      toast.error('Você não tem permissão para esta ação.');
    } else if (response?.status === 404) {
      toast.error('Recurso não encontrado.');
    } else if (response?.status === 429) {
      // Rate limiting do servidor
      toast.error('Muitas requisições. Por favor, aguarde um momento.');
    } else if (response?.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente.');
    } else if (response?.data?.error) {
      const errorMsg = getErrorMessage(response.data.error);
      toast.error(errorMsg);
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Erro de conexão. Verifique sua internet.');
    } else {
      toast.error('Ocorreu um erro inesperado.');
    }

    return Promise.reject(error);
  }
);

// Função helper para upload de arquivos
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File) {
          formData.append(`${key}[${index}]`, item);
        } else {
          formData.append(`${key}[${index}]`, String(item));
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return formData;
};

// Função helper para download de arquivos
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Erro ao baixar arquivo');
  }
};

export default api;
