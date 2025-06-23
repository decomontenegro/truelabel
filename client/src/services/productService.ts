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
    console.log('%c🔍 TRUELABEL: Getting products from API ONLY', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold;');
    console.log('%cFilters:', 'color: #00ff00; font-weight: bold;', filters);

    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    console.log('%c🌐 Fetching from API...', 'color: #0099ff; font-weight: bold;');
    const response = await api.get(`/products?${params.toString()}`);

    console.log('%c✅ API RESPONSE:', 'color: #00ff00; font-weight: bold;', response.data);

    // Adaptar resposta da API real
    const products = response.data.products || [];
    const result = {
      data: products,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: products.length,
        totalPages: 1
      },
    };

    console.log('%c✅ FINAL RESULT:', 'background: #00ff00; color: #000000; font-size: 16px; font-weight: bold;', result);
    return result;
  },

  // Obter produto específico
  async getProduct(id: string): Promise<{ product: Product }> {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      console.warn('Product API not available, checking local storage');

      // Fallback: Check local storage
      const localProducts = JSON.parse(localStorage.getItem('mockProducts') || '[]');
      const localProduct = localProducts.find((product: Product) => product.id === id);

      if (localProduct) {
        return { product: localProduct };
      }

      throw new Error(`Product with ID ${id} not found`);
    }
  },

  // Obter produto por ID (alias para compatibilidade)
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data.product || response.data;
    } catch (error: any) {
      console.warn('Product API not available, checking local storage');

      // Fallback: Check local storage
      const localProducts = JSON.parse(localStorage.getItem('mockProducts') || '[]');
      const localProduct = localProducts.find((product: Product) => product.id === id);

      if (localProduct) {
        return localProduct;
      }

      throw new Error(`Product with ID ${id} not found`);
    }
  },

  // Criar produto
  async createProduct(data: CreateProductData): Promise<{ product: Product; message: string }> {
    console.log('%c🚀 TRUELABEL: Creating product via API ONLY', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold;');
    console.log('%cData:', 'color: #00ff00; font-weight: bold;', data);

    const productData = {
      name: data.name,
      brand: data.brand,
      category: data.category,
      description: data.description || '',
      claims: data.claims || '',
      sku: data.sku || `SKU-${Date.now()}`
    };

    console.log('%c🌐 Sending to API...', 'color: #0099ff; font-weight: bold;');

    const response = await api.post('/products', productData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('%c✅ API SUCCESS!', 'color: #00ff00; font-weight: bold;', response.data);

    // Transform API response to expected format
    const product = response.data.product || response.data;
    return {
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description || '',
        claims: product.claims || '',
        sku: product.sku || data.sku || `SKU-${Date.now()}`,
        status: product.status || 'PENDING',
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: product.updatedAt || new Date().toISOString(),
        imageUrl: data.imageUrl || '',
        nutritionalInfo: data.nutritionalInfo || ''
      },
      message: response.data.message || 'Produto criado com sucesso'
    };
  },

  // Atualizar produto
  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<{ product: Product; message: string }> {
    try {
      const formData = createFormData(data);

      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.warn('Product API not available, updating local product');

      // Fallback: Update local product
      const localProducts = this.getLocalProducts();
      const productIndex = localProducts.findIndex(p => p.id === id);

      if (productIndex === -1) {
        throw new Error(`Product with ID ${id} not found`);
      }

      // Update the product
      const updatedProduct = {
        ...localProducts[productIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };

      localProducts[productIndex] = updatedProduct;
      localStorage.setItem('mockProducts', JSON.stringify(localProducts));

      return {
        product: updatedProduct,
        message: 'Produto atualizado com sucesso (modo demonstração)'
      };
    }
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
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      console.warn('Product API not available, deleting local product');

      // Fallback: Delete local product
      const localProducts = this.getLocalProducts();
      const productExists = localProducts.some(p => p.id === id);

      if (!productExists) {
        throw new Error(`Product with ID ${id} not found`);
      }

      this.removeLocalProduct(id);

      return {
        message: 'Produto removido com sucesso (modo demonstração)'
      };
    }
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

  // Utility methods for data management
  getLocalProducts(): Product[] {
    return JSON.parse(localStorage.getItem('mockProducts') || '[]');
  },

  saveLocalProduct(product: Product): void {
    const existingProducts = this.getLocalProducts();
    const index = existingProducts.findIndex(p => p.id === product.id);

    if (index >= 0) {
      existingProducts[index] = product;
    } else {
      existingProducts.push(product);
    }

    localStorage.setItem('mockProducts', JSON.stringify(existingProducts));
  },

  removeLocalProduct(productId: string): void {
    const existingProducts = this.getLocalProducts();
    const filteredProducts = existingProducts.filter(p => p.id !== productId);
    localStorage.setItem('mockProducts', JSON.stringify(filteredProducts));
  },

  clearLocalProducts(): void {
    localStorage.removeItem('mockProducts');
  },

  // Check if product exists locally
  hasLocalProduct(productId: string): boolean {
    const localProducts = this.getLocalProducts();
    return localProducts.some(p => p.id === productId);
  },

  // DEBUG FUNCTION - Test localStorage manually
  debugTest(): void {
    console.log('%c🧪 DEBUG TEST STARTED', 'background: #ff0000; color: #ffffff; font-size: 16px; font-weight: bold;');

    // Test localStorage write
    const testProduct = {
      id: `test-${Date.now()}`,
      name: 'Test Product',
      brand: 'Test Brand',
      category: 'Test Category',
      sku: 'TEST-001',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('mockProducts') || '[]');
    existing.push(testProduct);
    localStorage.setItem('mockProducts', JSON.stringify(existing));

    const verification = JSON.parse(localStorage.getItem('mockProducts') || '[]');
    console.log('%c🧪 TEST RESULT:', 'background: #00ff00; color: #000000; font-size: 14px; font-weight: bold;', verification);

    return verification;
  }
};

// Expose debug function globally for testing
(window as any).debugProductService = productService.debugTest;
(window as any).productService = productService;

export default productService;
