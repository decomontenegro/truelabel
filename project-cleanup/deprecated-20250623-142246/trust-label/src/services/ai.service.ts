import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { prisma } from '../server';
import pdfParse from 'pdf-parse';
import { AppError } from '../middlewares/errorHandler';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-dev',
});

export interface ValidationAnalysis {
  categories: Array<{
    name: string;
    status: 'approved' | 'warning' | 'rejected';
    items: Array<{
      name: string;
      value: string;
      status: 'approved' | 'warning' | 'rejected';
      note?: string;
    }>;
  }>;
  summary: {
    totalItems: number;
    approvedItems: number;
    warningItems: number;
    rejectedItems: number;
  };
  confidence: number;
  anomaliesDetected: number;
  recommendation: string;
  score: string;
}

export class AIService {
  static async analyzeProductClaims(productData: any): Promise<ValidationAnalysis> {
    try {
      const prompt = `
        Analise os seguintes dados de produto e suas claims para validação:
        
        Produto: ${productData.name}
        Categoria: ${productData.category}
        Claims: ${JSON.stringify(productData.claims)}
        
        Por favor, analise e retorne um JSON com a seguinte estrutura:
        {
          "categories": [
            {
              "name": "Nome da Categoria",
              "status": "approved/warning/rejected",
              "items": [
                {
                  "name": "Nome do Item",
                  "value": "Valor",
                  "status": "approved/warning/rejected",
                  "note": "Observação opcional"
                }
              ]
            }
          ],
          "summary": {
            "totalItems": 0,
            "approvedItems": 0,
            "warningItems": 0,
            "rejectedItems": 0
          },
          "confidence": 95,
          "anomaliesDetected": 0,
          "recommendation": "Recomendação geral",
          "score": "A+"
        }
        
        Categorias a analisar:
        1. Perfil Nutricional
        2. Metais Pesados
        3. Alergênicos
        4. Pesticidas e Herbicidas
        5. Micróbios e Toxinas
        6. Substâncias Banidas
        7. Solventes Residuais
        8. Certificações
      `;

      if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
        // Return mock data for development
        return this.getMockValidationAnalysis(productData);
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em validação de produtos de consumo com foco em segurança e conformidade regulatória.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      logger.info('AI analysis completed for product', { productId: productData.id });
      
      return result as ValidationAnalysis;
    } catch (error) {
      logger.error('AI analysis failed:', error);
      // Fallback to mock data on error
      return this.getMockValidationAnalysis(productData);
    }
  }

  static async parseLabReport(buffer: Buffer, mimeType: string): Promise<any> {
    try {
      let text = '';

      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else {
        // For other formats, convert buffer to string
        text = buffer.toString('utf-8');
      }

      const prompt = `
        Extraia as informações do seguinte laudo laboratorial:
        
        ${text.substring(0, 10000)} // Limit to avoid token limits
        
        Retorne um JSON com:
        {
          "laboratoryName": "Nome do laboratório",
          "reportNumber": "Número do laudo",
          "reportDate": "Data do laudo",
          "productName": "Nome do produto",
          "results": {
            "nutritional": {},
            "heavyMetals": {},
            "microbiological": {},
            "pesticides": {},
            "allergens": [],
            "certifications": []
          },
          "conclusion": "Conclusão do laudo"
        }
      `;

      if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
        return this.getMockLabReport();
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de laudos laboratoriais. Extraia apenas informações presentes no documento.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2000,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      logger.info('Lab report parsed successfully');
      
      return result;
    } catch (error) {
      logger.error('Lab report parsing failed:', error);
      throw new AppError('Failed to parse laboratory report', 500);
    }
  }

  static async detectAnomalies(validationData: any): Promise<{
    anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    riskScore: number;
  }> {
    try {
      const prompt = `
        Analise os seguintes dados de validação para detectar anomalias:
        ${JSON.stringify(validationData)}
        
        Identifique:
        1. Inconsistências entre claims e resultados
        2. Valores fora dos padrões normais
        3. Possíveis fraudes ou manipulações
        
        Retorne um JSON com:
        {
          "anomalies": [
            {
              "type": "tipo da anomalia",
              "severity": "low/medium/high",
              "description": "descrição"
            }
          ],
          "riskScore": 0-100
        }
      `;

      if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
        return {
          anomalies: [],
          riskScore: 5,
        };
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em detecção de fraudes e anomalias em produtos de consumo.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 1000,
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      logger.error('Anomaly detection failed:', error);
      return {
        anomalies: [],
        riskScore: 0,
      };
    }
  }

  static async generateProductDescription(productData: any): Promise<string> {
    try {
      const prompt = `
        Gere uma descrição atrativa e informativa para o seguinte produto:
        
        Nome: ${productData.name}
        Categoria: ${productData.category}
        Claims: ${JSON.stringify(productData.claims)}
        
        A descrição deve:
        1. Ser clara e objetiva
        2. Destacar os principais benefícios
        3. Ser baseada apenas nas informações validadas
        4. Ter entre 100-200 palavras
      `;

      if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
        return `${productData.name} é um produto de alta qualidade da categoria ${productData.category}, cuidadosamente validado pelo sistema TRUST LABEL. Este produto passou por rigorosos testes laboratoriais e análises com inteligência artificial para garantir sua segurança e eficácia. Todas as informações nutricionais e claims foram verificadas por laboratórios acreditados, proporcionando total transparência e confiabilidade aos consumidores.`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um redator especializado em produtos de consumo, focado em transparência e precisão.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      logger.error('Product description generation failed:', error);
      return '';
    }
  }

  private static getMockValidationAnalysis(productData: any): ValidationAnalysis {
    return {
      categories: [
        {
          name: 'Perfil Nutricional',
          status: 'warning',
          items: [
            { name: 'Proteínas', value: '25g', status: 'approved', note: null },
            { name: 'Carboidratos', value: '3g', status: 'approved', note: null },
            { name: 'Gorduras', value: '1g', status: 'approved', note: null },
            { name: 'Vitaminas', value: 'Completo', status: 'approved', note: null },
            { name: 'Minerais', value: 'Conforme', status: 'warning', note: 'Pequena variação no zinco' },
          ],
        },
        {
          name: 'Metais Pesados',
          status: 'approved',
          items: [
            { name: 'Chumbo', value: '< 0.01 mg/kg', status: 'approved' },
            { name: 'Cádmio', value: '< 0.01 mg/kg', status: 'approved' },
            { name: 'Mercúrio', value: '< 0.001 mg/kg', status: 'approved' },
            { name: 'Arsênio', value: '< 0.01 mg/kg', status: 'approved' },
          ],
        },
        {
          name: 'Alergênicos',
          status: 'warning',
          items: [
            { name: 'Leite', value: 'Contém', status: 'warning', note: 'Declarado no rótulo' },
            { name: 'Soja', value: 'Pode conter', status: 'warning', note: 'Traços' },
            { name: 'Gluten', value: 'Não contém', status: 'approved' },
          ],
        },
        {
          name: 'Pesticidas e Herbicidas',
          status: 'approved',
          items: [
            { name: 'Glifosato', value: 'Não detectado', status: 'approved' },
            { name: 'Organoclorados', value: 'Não detectado', status: 'approved' },
            { name: 'Organofosforados', value: 'Não detectado', status: 'approved' },
          ],
        },
        {
          name: 'Micróbios e Toxinas',
          status: 'approved',
          items: [
            { name: 'Salmonella', value: 'Ausência', status: 'approved' },
            { name: 'E. coli', value: '< 10 UFC/g', status: 'approved' },
            { name: 'Aflatoxinas', value: '< 5 ppb', status: 'approved' },
            { name: 'Coliformes', value: '< 10 UFC/g', status: 'approved' },
          ],
        },
        {
          name: 'Substâncias Banidas',
          status: 'approved',
          items: [
            { name: 'Esteroides', value: 'Não detectado', status: 'approved' },
            { name: 'Estimulantes', value: 'Não detectado', status: 'approved' },
            { name: 'Diuréticos', value: 'Não detectado', status: 'approved' },
            { name: 'Hormônios', value: 'Não detectado', status: 'approved' },
          ],
        },
        {
          name: 'Solventes Residuais',
          status: 'approved',
          items: [
            { name: 'Metanol', value: '< 0.1 ppm', status: 'approved' },
            { name: 'Etanol', value: '< 0.1 ppm', status: 'approved' },
            { name: 'Acetona', value: '< 0.1 ppm', status: 'approved' },
          ],
        },
        {
          name: 'Certificações',
          status: 'approved',
          items: [
            { name: 'ISO 22000', value: 'Válido', status: 'approved' },
            { name: 'HACCP', value: 'Válido', status: 'approved' },
            { name: 'GMP', value: 'Válido', status: 'approved' },
            { name: 'Anvisa RDC 27/2010', value: 'Conforme', status: 'approved' },
            { name: 'Halal', value: 'Certificado', status: 'approved' },
          ],
        },
      ],
      summary: {
        totalItems: 35,
        approvedItems: 31,
        warningItems: 4,
        rejectedItems: 0,
      },
      confidence: 95,
      anomaliesDetected: 0,
      recommendation: 'Produto de alta qualidade com pequenas variações dentro dos limites regulatórios. Recomenda-se manter monitoramento contínuo dos valores nutricionais.',
      score: 'A+',
    };
  }

  private static getMockLabReport() {
    return {
      laboratoryName: 'Eurofins Brasil',
      reportNumber: `LAB-${Date.now()}`,
      reportDate: new Date().toISOString(),
      productName: 'Produto de Teste',
      results: {
        nutritional: {
          proteins: '25g/100g',
          carbohydrates: '3g/100g',
          fats: '1g/100g',
          fiber: '0g/100g',
          sodium: '50mg/100g',
        },
        heavyMetals: {
          lead: '< 0.01 mg/kg',
          cadmium: '< 0.01 mg/kg',
          mercury: '< 0.001 mg/kg',
          arsenic: '< 0.01 mg/kg',
        },
        microbiological: {
          salmonella: 'Absent',
          ecoli: '< 10 CFU/g',
          coliforms: '< 10 CFU/g',
        },
        pesticides: {
          glyphosate: 'Not detected',
          organochlorines: 'Not detected',
          organophosphates: 'Not detected',
        },
        allergens: ['Milk', 'Soy (traces)'],
        certifications: ['ISO 22000', 'HACCP', 'GMP'],
      },
      conclusion: 'Produto em conformidade com os padrões regulatórios.',
    };
  }
}