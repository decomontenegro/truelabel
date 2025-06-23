import api, { createFormData } from './api';
import { Product, CreateProductData, PaginatedResponse } from '@/types';

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export const productService = {
  // Listar produtos
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/products?${params.toString()}`);

    // Adaptar resposta da API real
    const products = response.data.products || [];
    return {
      data: products,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: products.length,
        totalPages: 1
      },
    };
  },

  // Obter produto específico
  async getProduct(id: string): Promise<{ product: Product }> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Obter produto por ID (alias para compatibilidade)
  async getProductById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.product || response.data;
  },

  // Criar produto
  async createProduct(data: CreateProductData): Promise<{ product: Product; message: string }> {
    const formData = createFormData(data);

    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Atualizar produto
  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<{ product: Product; message: string }> {
    const formData = createFormData(data);

    const response = await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Gerar QR Code
  async generateQRCode(id: string): Promise<{ qrCode: string; validationUrl: string; message: string }> {
    const response = await api.post(`/products/${id}/qr-code`);
    return response.data;
  },

  // Update SmartLabel preference
  async updateSmartLabelPreference(id: string, enableSmartLabel: boolean): Promise<{ product: Product; message: string }> {
    const response = await api.put(`/products/${id}/smart-label-preference`, {
      enableSmartLabel
    });
    return response.data;
  },

  // Deletar produto
  async deleteProduct(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Obter categorias disponíveis (mock - pode ser implementado no backend)
  async getCategories(): Promise<string[]> {
    // Por enquanto, retornamos categorias fixas
    // No futuro, isso pode vir do backend
    return [
      'Alimentos',
      'Bebidas',
      'Suplementos',
      'Cosméticos',
      'Produtos de Limpeza',
      'Medicamentos',
      'Outros'
    ];
  },

  // Obter claims comuns (mock - pode ser implementado no backend)
  async getCommonClaims(): Promise<string[]> {
    return [
      'Sem Glúten',
      'Sem Lactose',
      'Fonte de Proteína',
      'Rico em Fibras',
      'Sem Açúcar',
      'Orgânico',
      'Natural',
      'Vegano',
      'Vegetariano',
      'Sem Conservantes',
      'Sem Corantes',
      'Light',
      'Diet',
      'Zero Sódio',
      'Integral'
    ];
  },
};
