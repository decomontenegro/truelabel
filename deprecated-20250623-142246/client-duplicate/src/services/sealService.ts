import api from './api';
import { Seal, ProductSeal, SealValidation, BRAZILIAN_SEALS } from '@/types/seals';

interface SealFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isRequired?: boolean;
  isActive?: boolean;
}

interface ProductSealFilters {
  productId?: string;
  sealId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface CreateProductSealData {
  productId: string;
  sealId: string;
  certificateNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  validatingLaboratory?: string;
  documentUrl?: string;
  notes?: string;
}

interface ValidateSealData {
  productSealId: string;
  status: 'APPROVED' | 'REJECTED';
  notes?: string;
  evidenceUrls?: string[];
}

export const sealService = {
  // Listar selos disponíveis
  async getSeals(filters: SealFilters = {}): Promise<{ seals: Seal[]; total: number }> {
    try {

      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const url = `/seals?${params.toString()}`;

      const response = await api.get(url);

      // A API retorna um array diretamente, não um objeto com seals
      const seals = Array.isArray(response.data) ? response.data : response.data.seals || [];

      return {
        seals,
        total: seals.length
      };
    } catch (error) {
      // Fallback para dados locais se API não estiver disponível

      let filteredSeals = BRAZILIAN_SEALS.map((seal, index) => ({
        ...seal,
        id: `seal-${index + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Aplicar filtros
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredSeals = filteredSeals.filter(seal =>
          seal.name.toLowerCase().includes(search) ||
          seal.purpose.toLowerCase().includes(search) ||
          seal.description.toLowerCase().includes(search)
        );
      }

      if (filters.category) {
        filteredSeals = filteredSeals.filter(seal => seal.category === filters.category);
      }

      if (filters.isRequired !== undefined) {
        filteredSeals = filteredSeals.filter(seal => seal.isRequired === filters.isRequired);
      }

      if (filters.isActive !== undefined) {
        filteredSeals = filteredSeals.filter(seal => seal.isActive === filters.isActive);
      }


      return {
        seals: filteredSeals,
        total: filteredSeals.length
      };
    }
  },

  // Obter selo específico
  async getSeal(id: string): Promise<{ seal: Seal }> {
    try {
      const response = await api.get(`/seals/${id}`);
      return response.data;
    } catch (error) {
      // Fallback para dados locais
      const sealIndex = parseInt(id.replace('seal-', '')) - 1;
      if (sealIndex >= 0 && sealIndex < BRAZILIAN_SEALS.length) {
        const seal = {
          ...BRAZILIAN_SEALS[sealIndex],
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return { seal };
      }
      throw new Error('Selo não encontrado');
    }
  },

  // Listar selos de um produto
  async getProductSeals(filters: ProductSealFilters = {}): Promise<{ productSeals: ProductSeal[]; total: number }> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/product-seals?${params.toString()}`);

      // A API retorna um array diretamente, não um objeto com productSeals
      const productSeals = Array.isArray(response.data) ? response.data : [];

      return {
        productSeals,
        total: productSeals.length
      };
    } catch (error) {
      // Retornar dados vazios se API não estiver disponível
      return { productSeals: [], total: 0 };
    }
  },

  // Adicionar selo a um produto
  async addProductSeal(data: CreateProductSealData): Promise<{ productSeal: ProductSeal; message: string }> {
    const response = await api.post('/product-seals', data);
    return response.data;
  },

  // Atualizar selo do produto
  async updateProductSeal(id: string, data: Partial<CreateProductSealData>): Promise<{ productSeal: ProductSeal; message: string }> {
    const response = await api.put(`/product-seals/${id}`, data);
    return response.data;
  },

  // Remover selo do produto
  async removeProductSeal(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/product-seals/${id}`);
    return response.data;
  },

  // Validar selo do produto
  async validateProductSeal(data: ValidateSealData): Promise<{ validation: SealValidation; message: string }> {
    const response = await api.post('/seal-validations', data);
    return response.data;
  },

  // Obter validações de um selo
  async getSealValidations(productSealId: string): Promise<{ validations: SealValidation[] }> {
    const response = await api.get(`/product-seals/${productSealId}/validations`);
    return response.data;
  },

  // Verificar se produto possui selo específico
  async checkProductSeal(productId: string, sealId: string): Promise<{ hasSeal: boolean; productSeal?: ProductSeal }> {
    try {
      const response = await this.getProductSeals({ productId, sealId });
      const productSeal = response.productSeals.find(ps => ps.sealId === sealId);

      return {
        hasSeal: !!productSeal,
        productSeal
      };
    } catch (error) {
      return { hasSeal: false };
    }
  },

  // Obter selos obrigatórios para uma categoria
  async getRequiredSeals(category?: string): Promise<Seal[]> {
    const response = await this.getSeals({ isRequired: true, isActive: true });

    if (category) {
      return response.seals.filter(seal =>
        seal.category === category ||
        seal.category === 'REGULATORY'
      );
    }

    return response.seals;
  },

  // Verificar conformidade de selos de um produto
  async checkProductCompliance(productId: string, productCategory?: string): Promise<{
    isCompliant: boolean;
    missingRequiredSeals: Seal[];
    expiredSeals: ProductSeal[];
    validSeals: ProductSeal[];
    warnings: string[];
  }> {
    try {
      const [requiredSeals, productSeals] = await Promise.all([
        this.getRequiredSeals(productCategory),
        this.getProductSeals({ productId })
      ]);

      const validSeals: ProductSeal[] = [];
      const expiredSeals: ProductSeal[] = [];
      const warnings: string[] = [];

      // Verificar selos do produto
      productSeals.productSeals.forEach(productSeal => {
        if (productSeal.status === 'EXPIRED') {
          expiredSeals.push(productSeal);
        } else if (productSeal.status === 'VERIFIED') {
          validSeals.push(productSeal);

          // Verificar se está próximo do vencimento
          if (productSeal.expiryDate) {
            const expiryDate = new Date(productSeal.expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
              warnings.push(`Selo "${productSeal.seal.name}" expira em ${daysUntilExpiry} dias`);
            }
          }
        }
      });

      // Verificar selos obrigatórios faltantes
      const productSealIds = productSeals.productSeals.map(ps => ps.sealId);
      const missingRequiredSeals = requiredSeals.filter(seal =>
        !productSealIds.includes(seal.id)
      );

      const isCompliant = missingRequiredSeals.length === 0 && expiredSeals.length === 0;

      return {
        isCompliant,
        missingRequiredSeals,
        expiredSeals,
        validSeals,
        warnings
      };
    } catch (error) {
      return {
        isCompliant: false,
        missingRequiredSeals: [],
        expiredSeals: [],
        validSeals: [],
        warnings: ['Erro ao verificar conformidade dos selos']
      };
    }
  },

  // Validar dados do selo
  validateSealData(data: CreateProductSealData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.productId) {
      errors.push('ID do produto é obrigatório');
    }

    if (!data.sealId) {
      errors.push('Selo é obrigatório');
    }

    if (data.issuedDate && data.expiryDate) {
      const issuedDate = new Date(data.issuedDate);
      const expiryDate = new Date(data.expiryDate);

      if (expiryDate <= issuedDate) {
        errors.push('Data de expiração deve ser posterior à data de emissão');
      }
    }

    if (data.certificateNumber && data.certificateNumber.trim().length < 3) {
      errors.push('Número do certificado deve ter pelo menos 3 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Formatar data de expiração
  formatExpiryDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  // Verificar se selo está expirado
  isSealExpired(expiryDate?: string): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  },

  // Obter cor do status do selo
  getSealStatusColor(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'green';
      case 'PENDING': return 'yellow';
      case 'EXPIRED': return 'red';
      case 'INVALID': return 'red';
      default: return 'gray';
    }
  },

  // Obter label do status do selo
  getSealStatusLabel(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'Verificado';
      case 'PENDING': return 'Pendente';
      case 'EXPIRED': return 'Expirado';
      case 'INVALID': return 'Inválido';
      default: return 'Desconhecido';
    }
  }
};

export default sealService;
