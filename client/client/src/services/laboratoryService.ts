import api from './api';
import { Laboratory, PaginatedResponse } from '@/types';

interface LaboratoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

interface CreateLaboratoryData {
  name: string;
  accreditation: string;
  email: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

interface LaboratoryStats {
  totalReports: number;
  validatedReports: number;
  pendingReports: number;
  verificationRate: number;
}

export const laboratoryService = {
  // Listar laboratórios
  async getLaboratories(filters: LaboratoryFilters = {}): Promise<PaginatedResponse<Laboratory>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/laboratories?${params.toString()}`);
    
    // Adaptar resposta da API real
    const laboratories = response.data.laboratories || [];
    return {
      data: laboratories,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: laboratories.length,
        totalPages: 1
      },
    };
  },

  // Obter laboratório específico
  async getLaboratory(id: string): Promise<{ laboratory: Laboratory }> {
    const response = await api.get(`/laboratories/${id}`);
    return response.data;
  },

  // Criar laboratório
  async createLaboratory(data: CreateLaboratoryData): Promise<{ laboratory: Laboratory; message: string }> {
    const response = await api.post('/laboratories', data);
    return response.data;
  },

  // Atualizar laboratório
  async updateLaboratory(id: string, data: Partial<CreateLaboratoryData>): Promise<{ laboratory: Laboratory; message: string }> {
    const response = await api.put(`/laboratories/${id}`, data);
    return response.data;
  },

  // Ativar/Desativar laboratório
  async updateLaboratoryStatus(id: string, isActive: boolean): Promise<{ laboratory: Laboratory; message: string }> {
    const response = await api.patch(`/laboratories/${id}/status`, { isActive });
    return response.data;
  },

  // Deletar laboratório
  async deleteLaboratory(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/laboratories/${id}`);
    return response.data;
  },

  // Obter estatísticas do laboratório
  async getLaboratoryStats(id: string): Promise<{ stats: LaboratoryStats }> {
    const response = await api.get(`/laboratories/${id}/stats`);
    return response.data;
  },

  // Obter laboratórios ativos (para seleção em formulários)
  async getActiveLaboratories(): Promise<Laboratory[]> {
    const response = await this.getLaboratories({ active: true, limit: 100 });
    return response.data;
  },

  // Buscar laboratórios por nome ou acreditação
  async searchLaboratories(query: string): Promise<Laboratory[]> {
    const response = await this.getLaboratories({ search: query, active: true, limit: 20 });
    return response.data;
  },

  // Verificar se email está disponível
  async checkEmailAvailability(email: string, excludeId?: string): Promise<{ available: boolean }> {
    try {
      // Como não temos endpoint específico, vamos buscar laboratórios e verificar
      const response = await this.getLaboratories({ limit: 1000 });
      const laboratories = response.data;
      
      const emailExists = laboratories.some(lab => 
        lab.email.toLowerCase() === email.toLowerCase() && 
        (!excludeId || lab.id !== excludeId)
      );
      
      return { available: !emailExists };
    } catch (error) {
      // Em caso de erro, assumir que não está disponível por segurança
      return { available: false };
    }
  },

  // Obter laboratórios com mais relatórios
  async getTopLaboratories(limit: number = 5): Promise<Laboratory[]> {
    const response = await this.getLaboratories({ limit: 100 });
    
    // Ordenar por número de relatórios (decrescente)
    const sortedLabs = response.data.sort((a, b) => {
      const aReports = a._count?.reports || 0;
      const bReports = b._count?.reports || 0;
      return bReports - aReports;
    });
    
    return sortedLabs.slice(0, limit);
  },

  // Validar dados do laboratório
  validateLaboratoryData(data: CreateLaboratoryData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!data.accreditation || data.accreditation.trim().length < 1) {
      errors.push('Acreditação é obrigatória');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email inválido');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Telefone inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validar email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validar telefone
  isValidPhone(phone: string): boolean {
    // Aceitar formatos: (11) 1234-5678, (11) 91234-5678, 11 1234-5678, etc.
    const phoneRegex = /^(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Formatar telefone
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  },

  // Obter tipos de acreditação comuns
  getCommonAccreditations(): string[] {
    return [
      'ISO/IEC 17025:2017',
      'ISO/IEC 17025:2005',
      'ABNT NBR ISO/IEC 17025',
      'INMETRO',
      'ANVISA',
      'MAPA',
      'Rede Brasileira de Laboratórios de Ensaios',
      'CGCRE',
      'Outros'
    ];
  }
};

export default laboratoryService;
