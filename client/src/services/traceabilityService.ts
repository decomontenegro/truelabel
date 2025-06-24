import api from './api';
import {
  SupplyChainEvent,
  BatchInfo,
  Supplier,
  OriginClaim,
  TraceabilityReport,
  CreateSupplyChainEventData,
  TraceabilitySearchParams,
  SupplyChainSummary,
  SupplyChainRoute,
  OriginEvidence
} from '@/types/traceability';

class TraceabilityService {
  // Supply Chain Events
  async getSupplyChainEvents(productId: string): Promise<SupplyChainEvent[]> {
    console.log('🔍 TraceabilityService: Buscando eventos para produto', productId);
    try {
      const response = await api.get(`/traceability/products/${productId}/events`);
      console.log('✅ TraceabilityService: Eventos obtidos com sucesso', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ TraceabilityService: Erro ao buscar eventos', error);
      throw error;
    }
  }

  async createSupplyChainEvent(data: CreateSupplyChainEventData): Promise<SupplyChainEvent> {
    const response = await api.post('/traceability/events', data);
    return response.data;
  }

  async updateSupplyChainEvent(eventId: string, data: Partial<CreateSupplyChainEventData>): Promise<SupplyChainEvent> {
    const response = await api.put(`/traceability/events/${eventId}`, data);
    return response.data;
  }

  async deleteSupplyChainEvent(eventId: string): Promise<void> {
    await api.delete(`/traceability/events/${eventId}`);
  }

  // Batch Management
  async getBatchInfo(batchNumber: string): Promise<BatchInfo> {
    const response = await api.get(`/traceability/batches/${batchNumber}`);
    return response.data;
  }

  async createBatch(data: Partial<BatchInfo>): Promise<BatchInfo> {
    const response = await api.post('/traceability/batches', data);
    return response.data;
  }

  async updateBatch(batchId: string, data: Partial<BatchInfo>): Promise<BatchInfo> {
    const response = await api.put(`/traceability/batches/${batchId}`, data);
    return response.data;
  }

  async getBatchesByProduct(productId: string): Promise<BatchInfo[]> {
    const response = await api.get(`/traceability/products/${productId}/batches`);
    return response.data;
  }

  async splitBatch(batchId: string, quantities: number[]): Promise<BatchInfo[]> {
    const response = await api.post(`/traceability/batches/${batchId}/split`, { quantities });
    return response.data;
  }

  async mergeBatches(batchIds: string[]): Promise<BatchInfo> {
    const response = await api.post('/traceability/batches/merge', { batchIds });
    return response.data;
  }

  // Supplier Management
  async getSuppliers(productId?: string): Promise<Supplier[]> {
    const url = productId ? `/traceability/products/${productId}/suppliers` : '/traceability/suppliers';
    const response = await api.get(url);
    return response.data;
  }

  async getSupplier(supplierId: string): Promise<Supplier> {
    const response = await api.get(`/traceability/suppliers/${supplierId}`);
    return response.data;
  }

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const response = await api.post('/traceability/suppliers', data);
    return response.data;
  }

  async updateSupplier(supplierId: string, data: Partial<Supplier>): Promise<Supplier> {
    const response = await api.put(`/traceability/suppliers/${supplierId}`, data);
    return response.data;
  }

  async linkSupplierToProduct(productId: string, supplierId: string, role: string): Promise<void> {
    await api.post(`/traceability/products/${productId}/suppliers/${supplierId}`, { role });
  }

  async unlinkSupplierFromProduct(productId: string, supplierId: string): Promise<void> {
    await api.delete(`/traceability/products/${productId}/suppliers/${supplierId}`);
  }

  // Origin Verification
  async getOriginClaims(productId: string): Promise<OriginClaim[]> {
    const response = await api.get(`/traceability/products/${productId}/origins`);
    return response.data;
  }

  async verifyOrigin(claimId: string, evidence: OriginEvidence[]): Promise<OriginClaim> {
    const response = await api.post(`/traceability/origins/${claimId}/verify`, { evidence });
    return response.data;
  }

  async createOriginClaim(data: Partial<OriginClaim>): Promise<OriginClaim> {
    const response = await api.post('/traceability/origins', data);
    return response.data;
  }

  // Supply Chain Routes
  async getSupplyChainRoute(productId: string, batchId?: string): Promise<SupplyChainRoute> {
    const params = batchId ? { batchId } : {};
    const response = await api.get(`/traceability/products/${productId}/route`, { params });
    return response.data;
  }

  async calculateCarbonFootprint(productId: string): Promise<{ footprint: number; breakdown: any }> {
    const response = await api.get(`/traceability/products/${productId}/carbon-footprint`);
    return response.data;
  }

  // Reports
  async generateTraceabilityReport(productId: string, reportType: string): Promise<TraceabilityReport> {
    const response = await api.post(`/traceability/products/${productId}/reports`, { reportType });
    return response.data;
  }

  async getTraceabilityReports(productId: string): Promise<TraceabilityReport[]> {
    const response = await api.get(`/traceability/products/${productId}/reports`);
    return response.data;
  }

  async downloadTraceabilityReport(reportId: string): Promise<Blob> {
    const response = await api.get(`/traceability/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Search and Analytics
  async searchSupplyChainEvents(params: TraceabilitySearchParams): Promise<SupplyChainEvent[]> {
    const response = await api.get('/traceability/events/search', { params });
    return response.data;
  }

  async getSupplyChainSummary(productId: string): Promise<SupplyChainSummary> {
    console.log('🔍 TraceabilityService: Buscando resumo para produto', productId);
    try {
      const response = await api.get(`/traceability/products/${productId}/summary`);
      console.log('✅ TraceabilityService: Resumo obtido com sucesso', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ TraceabilityService: Erro ao buscar resumo', error);
      throw error;
    }
  }

  async getTraceabilityAnalytics(productId: string): Promise<any> {
    const response = await api.get(`/traceability/products/${productId}/analytics`);
    return response.data;
  }

  // Document Management
  async uploadTraceabilityDocument(productId: string, eventId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('productId', productId);
    formData.append('eventId', eventId);

    const response = await api.post('/traceability/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url;
  }

  async verifyDocument(documentId: string): Promise<{ valid: boolean; hash: string }> {
    const response = await api.get(`/traceability/documents/${documentId}/verify`);
    return response.data;
  }

  // Blockchain Integration (if applicable)
  async recordOnBlockchain(eventId: string): Promise<{ transactionHash: string }> {
    const response = await api.post(`/traceability/events/${eventId}/blockchain`);
    return response.data;
  }

  async verifyBlockchainRecord(eventId: string): Promise<{ verified: boolean; data: any }> {
    const response = await api.get(`/traceability/events/${eventId}/blockchain/verify`);
    return response.data;
  }
}

export default new TraceabilityService();