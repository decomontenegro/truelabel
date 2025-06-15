import { PrismaClient } from '@prisma/client';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ParsedData {
  productName?: string;
  brand?: string;
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    [key: string]: any;
  };
  ingredients?: string[];
  allergens?: string[];
  certifications?: string[];
  analysisResults?: {
    [key: string]: any;
  };
}

export class ReportParserService {
  // Parse PDF report
  async parsePDF(filePath: string): Promise<ParsedData> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const text = data.text;
      
      return this.extractDataFromText(text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF report');
    }
  }

  // Parse text from any document
  private extractDataFromText(text: string): ParsedData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const parsedData: ParsedData = {};

    // Extract product name
    const productNameMatch = text.match(/(?:produto|product|nome|name):\s*(.+)/i);
    if (productNameMatch) {
      parsedData.productName = productNameMatch[1].trim();
    }

    // Extract brand
    const brandMatch = text.match(/(?:marca|brand|fabricante|manufacturer):\s*(.+)/i);
    if (brandMatch) {
      parsedData.brand = brandMatch[1].trim();
    }

    // Extract batch number
    const batchMatch = text.match(/(?:lote|batch|lot):\s*(.+)/i);
    if (batchMatch) {
      parsedData.batchNumber = batchMatch[1].trim();
    }

    // Extract dates
    const manufactureDateMatch = text.match(/(?:data de fabrica[çc][ãa]o|manufacture date|prod date):\s*(.+)/i);
    if (manufactureDateMatch) {
      parsedData.manufactureDate = this.parseDate(manufactureDateMatch[1]);
    }

    const expiryDateMatch = text.match(/(?:validade|expiry|expire|vencimento):\s*(.+)/i);
    if (expiryDateMatch) {
      parsedData.expiryDate = this.parseDate(expiryDateMatch[1]);
    }

    // Extract nutritional information
    parsedData.nutritionalInfo = this.extractNutritionalInfo(text);

    // Extract ingredients
    parsedData.ingredients = this.extractIngredients(text);

    // Extract allergens
    parsedData.allergens = this.extractAllergens(text);

    // Extract certifications
    parsedData.certifications = this.extractCertifications(text);

    return parsedData;
  }

  // Extract nutritional information
  private extractNutritionalInfo(text: string): ParsedData['nutritionalInfo'] {
    const nutritionalInfo: ParsedData['nutritionalInfo'] = {};
    
    // Common nutritional patterns
    const patterns = {
      calories: /(?:calorias|calories|kcal|energia|energy)[\s:]+(\d+(?:[.,]\d+)?)/i,
      protein: /(?:prote[íi]nas?|protein)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /(?:carboidratos?|carbohydrates?|carbs)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
      fat: /(?:gorduras?\s+totais?|total\s+fat|lipids?)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /(?:fibras?|fiber|fibre)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
      sodium: /(?:s[óo]dio|sodium)[\s:]+(\d+(?:[.,]\d+)?)\s*mg/i,
      sugar: /(?:a[çc][úu]cares?|sugars?)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
      saturatedFat: /(?:gorduras?\s+saturadas?|saturated\s+fat)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
      transFat: /(?:gorduras?\s+trans|trans\s+fat)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        nutritionalInfo[key] = parseFloat(match[1].replace(',', '.'));
      }
    }

    return nutritionalInfo;
  }

  // Extract ingredients
  private extractIngredients(text: string): string[] {
    const ingredients: string[] = [];
    
    // Look for ingredients section
    const ingredientsMatch = text.match(/(?:ingredientes?|ingredients?):\s*(.+?)(?:\n|$)/i);
    if (ingredientsMatch) {
      const ingredientsList = ingredientsMatch[1];
      // Split by common separators
      const items = ingredientsList.split(/[,;]/).map(item => item.trim()).filter(item => item);
      ingredients.push(...items);
    }

    return ingredients;
  }

  // Extract allergens
  private extractAllergens(text: string): string[] {
    const allergens: string[] = [];
    const commonAllergens = [
      'leite', 'milk',
      'ovo', 'egg',
      'soja', 'soy',
      'trigo', 'wheat',
      'glúten', 'gluten',
      'amendoim', 'peanut',
      'castanha', 'nuts',
      'peixe', 'fish',
      'crustáceo', 'shellfish',
      'frutos do mar', 'seafood'
    ];

    // Check for allergen section
    const allergenMatch = text.match(/(?:al[ée]rgenos?|allergens?|cont[ée]m|contains):\s*(.+?)(?:\n|$)/i);
    if (allergenMatch) {
      const allergenText = allergenMatch[1].toLowerCase();
      for (const allergen of commonAllergens) {
        if (allergenText.includes(allergen.toLowerCase())) {
          allergens.push(allergen);
        }
      }
    }

    return [...new Set(allergens)]; // Remove duplicates
  }

  // Extract certifications
  private extractCertifications(text: string): string[] {
    const certifications: string[] = [];
    const certPatterns = [
      /ISO\s*\d+/gi,
      /HACCP/gi,
      /BRC/gi,
      /IFS/gi,
      /SIF\s*\d+/gi,
      /org[âa]nico/gi,
      /organic/gi,
      /halal/gi,
      /kosher/gi,
      /vegano?/gi,
      /gluten[\s-]?free/gi,
    ];

    for (const pattern of certPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        certifications.push(...matches);
      }
    }

    return [...new Set(certifications)]; // Remove duplicates
  }

  // Parse date string to ISO format
  private parseDate(dateStr: string): string {
    // Try different date formats
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0] || format === formats[2]) {
          // DD/MM/YYYY or DD-MM-YYYY
          return `${match[3]}-${match[2]}-${match[1]}`;
        } else {
          // YYYY-MM-DD
          return match[0];
        }
      }
    }

    return dateStr; // Return original if no match
  }

  // Save parsed data to database
  async saveParsedData(reportId: string, parsedData: ParsedData) {
    try {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          results: parsedData as any,
          isParsed: true,
          parsedAt: new Date()
        }
      });

      // If nutritional info exists, update product
      if (parsedData.nutritionalInfo && parsedData.productName) {
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { name: parsedData.productName },
              { brand: parsedData.brand || '' }
            ]
          }
        });

        if (product) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              nutritionalInfo: parsedData.nutritionalInfo as any
            }
          });
        }
      }

      return parsedData;
    } catch (error) {
      console.error('Error saving parsed data:', error);
      throw new Error('Failed to save parsed data');
    }
  }

  // Main parse method
  async parseReport(reportId: string): Promise<ParsedData> {
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    let parsedData: ParsedData = {};

    // Parse based on file type
    const fileExtension = path.extname(report.originalName).toLowerCase();
    
    if (fileExtension === '.pdf') {
      parsedData = await this.parsePDF(report.filePath);
    } else if (['.txt', '.csv'].includes(fileExtension)) {
      const text = fs.readFileSync(report.filePath, 'utf-8');
      parsedData = this.extractDataFromText(text);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    // Save parsed data
    await this.saveParsedData(reportId, parsedData);

    return parsedData;
  }
}

export default new ReportParserService();