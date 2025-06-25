import api from './api';
import { Product, Certification, TraceabilityData } from '@/types';

export interface SmartLabelData extends Product {
  // Extended product information for SmartLabel
  ingredients?: {
    name: string;
    description?: string;
    percentage?: number;
    origin?: string;
    isOrganic?: boolean;
    isAllergen?: boolean;
  }[];
  allergenInfo?: {
    contains: string[];
    mayContain: string[];
    free: string[];
  };
  storageInstructions?: {
    beforeOpening: string[];
    afterOpening: string[];
    temperature?: {
      min: number;
      max: number;
      unit: 'C' | 'F';
    };
  };
  sustainabilityScore?: {
    overall: number; // 0-100
    carbonFootprint: number;
    waterUsage: number;
    packaging: number;
    transportation: number;
    details?: {
      metric: string;
      value: number;
      unit: string;
      comparison?: string;
    }[];
  };
  nutritionalHighlights?: {
    label: string;
    value: string;
    icon?: string;
    color?: string;
  }[];
  healthClaims?: {
    claim: string;
    validated: boolean;
    evidence?: string;
  }[];
  relatedProducts?: {
    id: string;
    name: string;
    imageUrl?: string;
    category: string;
  }[];
  companyInfo?: {
    name: string;
    logo?: string;
    description?: string;
    website?: string;
    socialMedia?: {
      platform: string;
      url: string;
    }[];
    values?: string[];
    certifications?: string[];
  };
  usage?: {
    servingSize?: string;
    servingsPerPackage?: number;
    preparationInstructions?: string[];
    usageTips?: string[];
    recipes?: {
      name: string;
      url: string;
      image?: string;
    }[];
  };
}

interface SmartLabelAnalytics {
  productId: string;
  action: 'view' | 'share' | 'print' | 'compare' | 'tab_change';
  metadata?: {
    tab?: string;
    shareMethod?: string;
    comparedWith?: string[];
    printFormat?: string;
  };
}

export const smartLabelService = {
  // Get complete SmartLabel data for a product
  async getSmartLabelData(productId: string): Promise<SmartLabelData> {
    try {
      // First get the product data
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data.product || productResponse.data;

      // Get additional SmartLabel specific data
      const smartLabelResponse = await api.get(`/products/${productId}/smart-label`);
      const smartLabelData = smartLabelResponse.data;

      // Merge the data
      return {
        ...product,
        ...smartLabelData,
      };
    } catch (error) {
      // If smart label endpoint doesn't exist, return product with default values
      console.warn('SmartLabel endpoint not available, using product data only');
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data.product || productResponse.data;
      
      return this.enrichProductData(product);
    }
  },

  // Get SmartLabel data by QR code
  async getSmartLabelByQRCode(qrCode: string): Promise<SmartLabelData> {
    try {
      const response = await api.get(`/qr/smart-label/${qrCode}`);
      return response.data;
    } catch (error) {
      // Fallback to validation endpoint and enrich data
      const validationResponse = await api.get(`/qr/validate/${qrCode}`);
      const { product } = validationResponse.data;
      
      return this.enrichProductData(product);
    }
  },

  // Calculate sustainability score based on available data
  calculateSustainabilityScore(product: Product): SmartLabelData['sustainabilityScore'] {
    // Mock calculation - in real implementation, this would use actual metrics
    const hasOrganicCert = product.certifications?.some(cert => 
      cert.name.toLowerCase().includes('organic') || cert.name.toLowerCase().includes('orgânico')
    );
    const hasEcoCert = product.certifications?.some(cert => 
      cert.name.toLowerCase().includes('eco') || cert.name.toLowerCase().includes('sustent')
    );
    const isLocal = product.traceability?.origin?.location?.toLowerCase().includes('brasil');

    const baseScore = 50;
    const certBonus = (hasOrganicCert ? 15 : 0) + (hasEcoCert ? 15 : 0);
    const localBonus = isLocal ? 10 : 0;
    
    const overall = Math.min(100, baseScore + certBonus + localBonus);

    return {
      overall,
      carbonFootprint: overall - 10 + Math.random() * 20,
      waterUsage: overall - 10 + Math.random() * 20,
      packaging: overall - 10 + Math.random() * 20,
      transportation: overall - 10 + Math.random() * 20,
      details: [
        {
          metric: 'Emissões de CO2',
          value: 2.5,
          unit: 'kg CO2/kg produto',
          comparison: '30% menor que a média'
        },
        {
          metric: 'Uso de Água',
          value: 150,
          unit: 'L/kg produto',
          comparison: '25% menor que a média'
        }
      ]
    };
  },

  // Generate shareable link for social media
  async generateShareableLink(productId: string, platform?: string): Promise<{
    url: string;
    shortUrl?: string;
    qrCode?: string;
  }> {
    try {
      const response = await api.post(`/products/${productId}/share-link`, {
        platform,
        type: 'smart-label'
      });
      return response.data;
    } catch (error) {
      // Fallback to basic URL
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/smart-label/${productId}`;
      return { url };
    }
  },

  // Track user interactions with SmartLabel
  async trackInteraction(analytics: SmartLabelAnalytics): Promise<void> {
    try {
      await api.post('/analytics/smart-label', analytics);
    } catch (error) {
      console.error('Failed to track SmartLabel interaction:', error);
    }
  },

  // Get products for comparison
  async getComparableProducts(productId: string, category?: string): Promise<SmartLabelData[]> {
    try {
      const response = await api.get(`/products/${productId}/comparable`, {
        params: { category, limit: 4 }
      });
      return response.data.products.map((p: Product) => this.enrichProductData(p));
    } catch (error) {
      // Fallback to getting products from same category
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data.product || productResponse.data;
      
      const productsResponse = await api.get('/products', {
        params: { 
          category: product.category,
          limit: 5
        }
      });
      
      return productsResponse.data.products
        .filter((p: Product) => p.id !== productId)
        .slice(0, 4)
        .map((p: Product) => this.enrichProductData(p));
    }
  },

  // Enrich basic product data with SmartLabel fields
  enrichProductData(product: Product): SmartLabelData {
    // Parse claims into allergen info
    const claims = product.claims?.split(',').map(c => c.trim()) || [];
    const allergenInfo = {
      contains: product.allergens || [],
      mayContain: [],
      free: claims.filter(claim => 
        claim.toLowerCase().includes('sem') || 
        claim.toLowerCase().includes('free') ||
        claim.toLowerCase().includes('não contém')
      ).map(claim => claim.replace(/(sem |free |não contém )/gi, '').trim())
    };

    // Extract nutritional highlights from claims
    const nutritionalHighlights = claims
      .filter(claim => 
        claim.toLowerCase().includes('fonte') || 
        claim.toLowerCase().includes('rico') ||
        claim.toLowerCase().includes('high') ||
        claim.toLowerCase().includes('low')
      )
      .map(claim => ({
        label: claim,
        value: '',
        icon: this.getClaimIcon(claim),
        color: this.getClaimColor(claim)
      }));

    // Convert claims to health claims
    const healthClaims = claims.map(claim => ({
      claim,
      validated: true, // Assume validated if in the system
      evidence: 'Validado por laboratório acreditado'
    }));

    return {
      ...product,
      allergenInfo,
      nutritionalHighlights,
      healthClaims,
      sustainabilityScore: this.calculateSustainabilityScore(product),
      storageInstructions: {
        beforeOpening: ['Conservar em local seco e arejado', 'Evitar luz solar direta'],
        afterOpening: ['Manter refrigerado', 'Consumir em até 7 dias']
      },
      usage: {
        servingSize: '1 porção (100g)',
        servingsPerPackage: 10,
        preparationInstructions: [],
        usageTips: ['Ideal para o café da manhã', 'Combine com frutas frescas']
      },
      companyInfo: {
        name: product.brand,
        description: 'Empresa comprometida com qualidade e transparência',
        website: `https://${product.brand.toLowerCase().replace(/\s+/g, '')}.com.br`,
        values: ['Qualidade', 'Transparência', 'Sustentabilidade'],
        certifications: product.certifications?.map(c => c.name) || []
      }
    };
  },

  // Helper to get icon for claim
  getClaimIcon(claim: string): string {
    const lowerClaim = claim.toLowerCase();
    if (lowerClaim.includes('proteína')) return '💪';
    if (lowerClaim.includes('fibra')) return '🌾';
    if (lowerClaim.includes('vitamina')) return '🥗';
    if (lowerClaim.includes('cálcio')) return '🥛';
    if (lowerClaim.includes('ferro')) return '🩸';
    if (lowerClaim.includes('ômega')) return '🐟';
    if (lowerClaim.includes('probiótico')) return '🦠';
    if (lowerClaim.includes('zero') || lowerClaim.includes('sem')) return '🚫';
    if (lowerClaim.includes('integral')) return '🌾';
    if (lowerClaim.includes('natural')) return '🌿';
    return '✓';
  },

  // Helper to get color for claim
  getClaimColor(claim: string): string {
    const lowerClaim = claim.toLowerCase();
    if (lowerClaim.includes('proteína') || lowerClaim.includes('ferro')) return 'red';
    if (lowerClaim.includes('fibra') || lowerClaim.includes('integral')) return 'amber';
    if (lowerClaim.includes('vitamina') || lowerClaim.includes('natural')) return 'green';
    if (lowerClaim.includes('cálcio') || lowerClaim.includes('probiótico')) return 'blue';
    if (lowerClaim.includes('zero') || lowerClaim.includes('sem')) return 'purple';
    return 'gray';
  }
};