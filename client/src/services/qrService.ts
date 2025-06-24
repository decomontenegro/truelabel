import api from './api';

interface QRCodeData {
  qrCode: string;
  validationUrl: string;
  qrCodeImage: string;
  product?: {
    id: string;
    name: string;
    brand: string;
    sku: string;
  };
}

interface QRCodeAccess {
  id: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  accessedAt: string;
}

interface QRCodeAccessStats {
  accesses: QRCodeAccess[];
  statistics: {
    total: number;
    today: number;
    thisWeek: number;
  };
}

interface ProductValidationData {
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    description: string;
    claims: string;
    nutritionalInfo?: any;
    imageUrl?: string;
    status: string;
  };
  brand: {
    name: string;
    email: string;
  };
  validation: {
    id: string;
    status: string;
    claimsValidated: Record<string, any>;
    summary?: string;
    validatedAt: string;
    laboratory: {
      name: string;
      accreditation: string;
    };
  } | null;
  accessedAt: string;
}

export const qrService = {
  // Gerar QR Code para produto
  async generateQRCode(productId: string): Promise<QRCodeData> {
    const response = await api.post('/qr/generate', { productId });
    return response.data;
  },

  // Validar produto via QR Code (público)
  async validateQRCode(qrCode: string): Promise<ProductValidationData> {
    // Esta é uma chamada pública, não precisa de autenticação
    const response = await api.get(`/qr/validate/${qrCode}`);
    return response.data;
  },

  // Obter acessos ao QR Code
  async getQRCodeAccesses(productId: string): Promise<QRCodeAccessStats> {
    const response = await api.get(`/qr/analytics/${productId}`);
    return response.data;
  },

  // Verificar se produto tem QR Code
  async hasQRCode(productId: string): Promise<boolean> {
    try {
      // Fazer uma chamada mais leve para verificar se existe
      const response = await api.get(`/qr/accesses/${productId}`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      // Se houver erro de CORS ou outro erro, assumir que não tem QR Code
      return false;
    }
  },

  // Gerar URL de validação
  generateValidationUrl(qrCode: string): string {
    const baseUrl = process.env.REACT_APP_QR_BASE_URL || window.location.origin;
    return `${baseUrl}/validation/${qrCode}`;
  },

  // Download da imagem do QR Code
  downloadQRCodeImage(qrCodeImage: string, productName: string): void {
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `qr-code-${productName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Copiar URL de validação para clipboard
  async copyValidationUrl(validationUrl: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(validationUrl);
      return true;
    } catch (error) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = validationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  },

  // Compartilhar QR Code (Web Share API)
  async shareQRCode(qrCodeData: QRCodeData): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title: `Validação - ${qrCodeData.product.name}`,
        text: `Verifique a autenticidade do produto ${qrCodeData.product.name} da marca ${qrCodeData.product.brand}`,
        url: qrCodeData.validationUrl
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Formatar estatísticas de acesso
  formatAccessStats(stats: QRCodeAccessStats['statistics']): Array<{
    label: string;
    value: number;
    description: string;
  }> {
    return [
      {
        label: 'Total',
        value: stats.total,
        description: 'Acessos totais'
      },
      {
        label: 'Hoje',
        value: stats.today,
        description: 'Acessos hoje'
      },
      {
        label: 'Esta semana',
        value: stats.thisWeek,
        description: 'Acessos nos últimos 7 dias'
      }
    ];
  },

  // Analisar User Agent
  parseUserAgent(userAgent: string): {
    browser: string;
    os: string;
    device: string;
  } {
    // Análise básica do User Agent
    let browser = 'Desconhecido';
    let os = 'Desconhecido';
    let device = 'Desktop';

    // Detectar browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detectar OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // Detectar dispositivo
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet';
    }

    return { browser, os, device };
  },

  // Formatar acesso para exibição
  formatAccess(access: QRCodeAccess): {
    id: string;
    time: string;
    location: string;
    device: string;
    browser: string;
  } {
    const userAgentInfo = this.parseUserAgent(access.userAgent);

    return {
      id: access.id,
      time: new Date(access.accessedAt).toLocaleString('pt-BR'),
      location: access.location || access.ipAddress,
      device: `${userAgentInfo.device} (${userAgentInfo.os})`,
      browser: userAgentInfo.browser
    };
  },

  // Validar formato do QR Code
  isValidQRCode(qrCode: string): boolean {
    // QR codes são strings hexadecimais de 16 caracteres
    const qrCodeRegex = /^[a-f0-9]{16}$/i;
    return qrCodeRegex.test(qrCode);
  },

  // Gerar QR Code de teste (para desenvolvimento)
  generateTestQRCode(): string {
    return Math.random().toString(16).substring(2, 18);
  },

  // Obter cor do status de validação
  getValidationStatusColor(status: string): string {
    switch (status) {
      case 'VALIDATED':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  },

  // Formatar claims validados para exibição pública
  formatValidatedClaims(claimsValidated: Record<string, any>): Array<{
    claim: string;
    validated: boolean;
    icon: string;
  }> {
    return Object.entries(claimsValidated).map(([claim, data]) => ({
      claim,
      validated: data.validated || false,
      icon: data.validated ? '✅' : '❌'
    }));
  },

  // Calcular score de confiabilidade
  calculateTrustScore(validation: ProductValidationData['validation']): {
    score: number;
    level: string;
    color: string;
  } {
    if (!validation) {
      return { score: 0, level: 'Não validado', color: 'gray' };
    }

    const validatedClaims = Object.values(validation.claimsValidated).filter(
      (claim: any) => claim.validated
    ).length;
    const totalClaims = Object.keys(validation.claimsValidated).length;

    const score = totalClaims > 0 ? (validatedClaims / totalClaims) * 100 : 0;

    let level = 'Baixo';
    let color = 'red';

    if (score >= 80) {
      level = 'Alto';
      color = 'green';
    } else if (score >= 60) {
      level = 'Médio';
      color = 'yellow';
    }

    return { score: Math.round(score), level, color };
  },

  // Lifecycle Management Methods

  // Batch update QR code status
  async batchUpdateStatus(qrIds: string[], status: 'active' | 'suspended', reason?: string): Promise<any> {
    const response = await api.put('/qr/batch-update-status', {
      qrIds,
      status,
      reason
    });
    return response.data;
  },

  // Get QR code lifecycle
  async getQRCodeLifecycle(qrId: string): Promise<any> {
    const response = await api.get(`/qr/${qrId}/lifecycle`);
    return response.data;
  },

  // Regenerate QR code
  async regenerateQRCode(productId: string, oldQrId?: string): Promise<QRCodeData> {
    const response = await api.post('/qr/regenerate', { 
      productId, 
      oldQrId 
    });
    return response.data;
  },

  // Get QR codes by product
  async getQRCodesByProduct(productId: string): Promise<any[]> {
    const response = await api.get(`/qr/product/${productId}`);
    return response.data.qrCodes || [];
  },

  // Suspend QR code
  async suspendQRCode(qrId: string, reason: string): Promise<any> {
    const response = await api.put(`/qr/${qrId}/suspend`, { reason });
    return response.data;
  },

  // Reactivate QR code
  async reactivateQRCode(qrId: string): Promise<any> {
    const response = await api.put(`/qr/${qrId}/reactivate`);
    return response.data;
  }
};

export default qrService;
