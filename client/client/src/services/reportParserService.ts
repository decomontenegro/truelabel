import { 
  Report, 
  DataPointValidation, 
  ValidationThreshold,
  NutritionFacts,
  VitaminMineral,
  AllergenInfo
} from '@/types';

// Laboratory format types
export enum LaboratoryFormat {
  EUROFINS = 'EUROFINS',
  SGS = 'SGS',
  INTERTEK = 'INTERTEK',
  BUREAU_VERITAS = 'BUREAU_VERITAS',
  ALS = 'ALS',
  UNKNOWN = 'UNKNOWN'
}

// Analysis types
export interface MicrobiologicalAnalysis {
  totalPlateCount?: TestResult;
  coliforms?: TestResult;
  ecoli?: TestResult;
  salmonella?: TestResult;
  listeria?: TestResult;
  staphylococcus?: TestResult;
  yeastAndMold?: TestResult;
  bacillus?: TestResult;
  clostridium?: TestResult;
  enterobacteriaceae?: TestResult;
  customTests?: Array<{
    name: string;
    result: TestResult;
  }>;
}

export interface HeavyMetalsAnalysis {
  lead?: TestResult;
  cadmium?: TestResult;
  mercury?: TestResult;
  arsenic?: TestResult;
  chromium?: TestResult;
  copper?: TestResult;
  zinc?: TestResult;
  nickel?: TestResult;
  aluminum?: TestResult;
  tin?: TestResult;
}

export interface PesticidesAnalysis {
  organophosphates?: TestResult[];
  organochlorines?: TestResult[];
  pyrethroids?: TestResult[];
  carbamates?: TestResult[];
  neonicotinoids?: TestResult[];
  totalPesticides?: TestResult;
}

export interface ExtendedNutritionalProfile extends Partial<NutritionFacts> {
  moisture?: number;
  ash?: number;
  pH?: number;
  acidity?: number;
  brix?: number;
  alcohol?: number;
  aminoAcids?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  fattyAcids?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
}

export interface TestResult {
  value: string | number;
  unit?: string;
  method?: string;
  detectionLimit?: string;
  quantificationLimit?: string;
  uncertainty?: string;
  status?: 'PASS' | 'FAIL' | 'WARNING';
  reference?: string;
}

// Parsed report structure
export interface ParsedReportData {
  laboratoryFormat: LaboratoryFormat;
  reportNumber?: string;
  reportDate?: string;
  sampleId?: string;
  productName?: string;
  batchNumber?: string;
  collectionDate?: string;
  analysisStartDate?: string;
  analysisEndDate?: string;
  
  microbiological?: MicrobiologicalAnalysis;
  heavyMetals?: HeavyMetalsAnalysis;
  pesticides?: PesticidesAnalysis;
  nutritional?: ExtendedNutritionalProfile;
  allergens?: AllergenInfo;
  physicalChemical?: Record<string, TestResult>;
  
  rawData?: string;
  confidence: number;
  extractionErrors?: string[];
  dataPoints: DataPointValidation[];
}

// Pattern matching configurations
const LAB_PATTERNS = {
  [LaboratoryFormat.EUROFINS]: {
    reportNumber: /Report\s*(?:Number|No\.?|#)\s*:?\s*([\w-]+)/i,
    date: /(?:Report\s*)?Date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    sampleId: /Sample\s*(?:ID|Number|Code)\s*:?\s*([\w-]+)/i,
  },
  [LaboratoryFormat.SGS]: {
    reportNumber: /SGS\s*Report\s*(?:No\.?|Number)\s*:?\s*([\w-]+)/i,
    date: /Issue\s*Date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    sampleId: /Sample\s*Reference\s*:?\s*([\w-]+)/i,
  },
  [LaboratoryFormat.INTERTEK]: {
    reportNumber: /Certificate\s*(?:No\.?|Number)\s*:?\s*([\w-]+)/i,
    date: /Test\s*Date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    sampleId: /Lab\s*(?:Sample\s*)?(?:No\.?|Number)\s*:?\s*([\w-]+)/i,
  }
};

// Unit conversion mappings
const UNIT_CONVERSIONS: Record<string, string> = {
  'mg/kg': 'ppm',
  'μg/kg': 'ppb',
  'ug/kg': 'ppb',
  'mg/L': 'ppm',
  'μg/L': 'ppb',
  'ug/L': 'ppb',
  'UFC/g': 'CFU/g',
  'NMP/g': 'MPN/g',
  'Col/g': 'CFU/g'
};

// Parameter name mappings (Portuguese/English)
const PARAMETER_MAPPINGS: Record<string, string> = {
  // Microbiological
  'contagem total': 'totalPlateCount',
  'contagem padrão em placas': 'totalPlateCount',
  'aerobic plate count': 'totalPlateCount',
  'coliformes totais': 'coliforms',
  'total coliforms': 'coliforms',
  'escherichia coli': 'ecoli',
  'e. coli': 'ecoli',
  'salmonela': 'salmonella',
  'listeria monocytogenes': 'listeria',
  'staphylococcus aureus': 'staphylococcus',
  'bolores e leveduras': 'yeastAndMold',
  'yeast and mold': 'yeastAndMold',
  'bacillus cereus': 'bacillus',
  'clostridium perfringens': 'clostridium',
  'enterobactérias': 'enterobacteriaceae',
  
  // Heavy metals
  'chumbo': 'lead',
  'lead': 'lead',
  'pb': 'lead',
  'cádmio': 'cadmium',
  'cadmium': 'cadmium',
  'cd': 'cadmium',
  'mercúrio': 'mercury',
  'mercury': 'mercury',
  'hg': 'mercury',
  'arsênio': 'arsenic',
  'arsenic': 'arsenic',
  'as': 'arsenic',
  'cromo': 'chromium',
  'chromium': 'chromium',
  'cr': 'chromium',
  'cobre': 'copper',
  'copper': 'copper',
  'cu': 'copper',
  'zinco': 'zinc',
  'zinc': 'zinc',
  'zn': 'zinc',
  'níquel': 'nickel',
  'nickel': 'nickel',
  'ni': 'nickel',
  'alumínio': 'aluminum',
  'aluminum': 'aluminum',
  'al': 'aluminum',
  'estanho': 'tin',
  'tin': 'tin',
  'sn': 'tin',
  
  // Nutritional
  'umidade': 'moisture',
  'moisture': 'moisture',
  'cinzas': 'ash',
  'ash': 'ash',
  'proteína': 'protein',
  'protein': 'protein',
  'gordura': 'totalFat',
  'lipídios': 'totalFat',
  'fat': 'totalFat',
  'carboidratos': 'totalCarbohydrates',
  'carbohydrates': 'totalCarbohydrates',
  'fibra alimentar': 'dietaryFiber',
  'dietary fiber': 'dietaryFiber',
  'açúcares totais': 'totalSugars',
  'total sugars': 'totalSugars',
  'sódio': 'sodium',
  'sodium': 'sodium',
  'na': 'sodium',
  'calorias': 'calories',
  'energia': 'calories',
  'energy': 'calories',
  'valor energético': 'calories'
};

// Detection limit patterns
const DETECTION_LIMIT_PATTERNS = [
  /<\s*([\d.]+)/,
  /ND\s*\(([\d.]+)\)/,
  /LOD\s*:\s*([\d.]+)/,
  /LQ\s*:\s*([\d.]+)/,
  /não detectado/i,
  /not detected/i,
  /ausente/i,
  /absent/i,
  /negativo/i,
  /negative/i
];

class ReportParserService {
  /**
   * Main method to parse a laboratory report
   */
  async parseReport(file: File): Promise<ParsedReportData> {
    try {
      const content = await this.extractTextFromFile(file);
      const format = this.detectLabFormat(content);
      
      const parsedData: ParsedReportData = {
        laboratoryFormat: format,
        confidence: 0,
        dataPoints: [],
        extractionErrors: []
      };

      // Extract basic information
      this.extractBasicInfo(content, format, parsedData);
      
      // Extract different analysis types
      parsedData.microbiological = this.extractMicrobiological(content);
      parsedData.heavyMetals = this.extractHeavyMetals(content);
      parsedData.nutritional = this.extractNutritional(content);
      parsedData.pesticides = this.extractPesticides(content);
      parsedData.allergens = this.extractAllergens(content);
      parsedData.physicalChemical = this.extractPhysicalChemical(content);
      
      // Convert to data points
      parsedData.dataPoints = this.convertToDataPoints(parsedData);
      
      // Calculate confidence score
      parsedData.confidence = this.calculateConfidence(parsedData);
      
      // Validate extracted data
      const validation = this.validateExtractedData(parsedData);
      if (!validation.isValid) {
        parsedData.extractionErrors = validation.errors;
      }
      
      parsedData.rawData = content;
      
      return parsedData;
    } catch (error) {
      throw new Error(`Failed to parse report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text content from file (PDF, image, or text)
   */
  private async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'text/plain') {
      return await file.text();
    }
    
    if (file.type === 'application/pdf') {
      // In a real implementation, you would use a PDF parsing library
      // For now, we'll simulate with a placeholder
      return await this.extractTextFromPDF(file);
    }
    
    if (file.type.startsWith('image/')) {
      // In a real implementation, you would use OCR
      return await this.performOCR(file);
    }
    
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  /**
   * Simulate PDF text extraction (would use pdf.js or similar in production)
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    // This is a placeholder - in production, use a library like pdf.js
    console.log('PDF extraction would happen here for:', file.name);
    return 'Sample PDF content...';
  }

  /**
   * Simulate OCR (would use Tesseract.js or cloud service in production)
   */
  private async performOCR(file: File): Promise<string> {
    // This is a placeholder - in production, use OCR service
    console.log('OCR would happen here for:', file.name);
    return 'Sample OCR content...';
  }

  /**
   * Detect laboratory format from content
   */
  detectLabFormat(content: string): LaboratoryFormat {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('eurofins') || contentLower.includes('eurofins scientific')) {
      return LaboratoryFormat.EUROFINS;
    }
    if (contentLower.includes('sgs') || contentLower.includes('société générale de surveillance')) {
      return LaboratoryFormat.SGS;
    }
    if (contentLower.includes('intertek')) {
      return LaboratoryFormat.INTERTEK;
    }
    if (contentLower.includes('bureau veritas') || contentLower.includes('bv')) {
      return LaboratoryFormat.BUREAU_VERITAS;
    }
    if (contentLower.includes('als') || contentLower.includes('australian laboratory services')) {
      return LaboratoryFormat.ALS;
    }
    
    return LaboratoryFormat.UNKNOWN;
  }

  /**
   * Extract basic report information
   */
  private extractBasicInfo(content: string, format: LaboratoryFormat, parsedData: ParsedReportData): void {
    const patterns = LAB_PATTERNS[format] || LAB_PATTERNS[LaboratoryFormat.EUROFINS];
    
    // Extract report number
    const reportMatch = content.match(patterns.reportNumber);
    if (reportMatch) {
      parsedData.reportNumber = reportMatch[1];
    }
    
    // Extract date
    const dateMatch = content.match(patterns.date);
    if (dateMatch) {
      parsedData.reportDate = this.normalizeDate(dateMatch[1]);
    }
    
    // Extract sample ID
    const sampleMatch = content.match(patterns.sampleId);
    if (sampleMatch) {
      parsedData.sampleId = sampleMatch[1];
    }
    
    // Extract product name
    const productMatch = content.match(/(?:Product|Produto|Sample\s*Name|Nome\s*da\s*Amostra)\s*:?\s*([^\n\r]+)/i);
    if (productMatch) {
      parsedData.productName = productMatch[1].trim();
    }
    
    // Extract batch number
    const batchMatch = content.match(/(?:Batch|Lote|Lot)\s*(?:Number|No\.?|#)?\s*:?\s*([\w-]+)/i);
    if (batchMatch) {
      parsedData.batchNumber = batchMatch[1];
    }
  }

  /**
   * Extract microbiological analysis
   */
  extractMicrobiological(content: string): MicrobiologicalAnalysis {
    const analysis: MicrobiologicalAnalysis = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const normalizedLine = line.toLowerCase();
      
      for (const [term, field] of Object.entries(PARAMETER_MAPPINGS)) {
        if (normalizedLine.includes(term) && this.isMicrobiologicalField(field)) {
          const result = this.extractTestResult(line);
          if (result) {
            (analysis as any)[field] = result;
          }
        }
      }
    }
    
    return analysis;
  }

  /**
   * Extract heavy metals analysis
   */
  extractHeavyMetals(content: string): HeavyMetalsAnalysis {
    const analysis: HeavyMetalsAnalysis = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const normalizedLine = line.toLowerCase();
      
      for (const [term, field] of Object.entries(PARAMETER_MAPPINGS)) {
        if (normalizedLine.includes(term) && this.isHeavyMetalField(field)) {
          const result = this.extractTestResult(line);
          if (result) {
            (analysis as any)[field] = result;
          }
        }
      }
    }
    
    return analysis;
  }

  /**
   * Extract nutritional information
   */
  extractNutritional(content: string): ExtendedNutritionalProfile {
    const profile: ExtendedNutritionalProfile = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const normalizedLine = line.toLowerCase();
      
      for (const [term, field] of Object.entries(PARAMETER_MAPPINGS)) {
        if (normalizedLine.includes(term) && this.isNutritionalField(field)) {
          const result = this.extractNumericalValue(line);
          if (result !== null) {
            (profile as any)[field] = result.value;
          }
        }
      }
    }
    
    // Extract vitamins and minerals
    const vitamins = this.extractVitaminsAndMinerals(content, 'vitamin');
    const minerals = this.extractVitaminsAndMinerals(content, 'mineral');
    
    if (vitamins.length > 0) {
      profile.vitamins = vitamins;
    }
    if (minerals.length > 0) {
      profile.minerals = minerals;
    }
    
    return profile;
  }

  /**
   * Extract pesticides analysis
   */
  private extractPesticides(content: string): PesticidesAnalysis {
    const analysis: PesticidesAnalysis = {};
    const pesticidesSection = this.extractSection(content, ['pesticides', 'pesticidas', 'agrotóxicos']);
    
    if (!pesticidesSection) return analysis;
    
    // Extract individual pesticides
    const pesticidePattern = /([a-zA-Z\s-]+)\s*([\d.]+)\s*(mg\/kg|μg\/kg|ppm|ppb)/gi;
    const matches = [...pesticidesSection.matchAll(pesticidePattern)];
    
    const pesticides: TestResult[] = matches.map(match => ({
      value: parseFloat(match[2]),
      unit: this.normalizeUnit(match[3]),
      status: this.determinePesticideStatus(parseFloat(match[2]), match[3])
    }));
    
    if (pesticides.length > 0) {
      analysis.totalPesticides = {
        value: pesticides.length,
        unit: 'compounds detected',
        status: pesticides.some(p => p.status === 'FAIL') ? 'FAIL' : 'PASS'
      };
    }
    
    return analysis;
  }

  /**
   * Extract allergen information
   */
  private extractAllergens(content: string): AllergenInfo {
    const allergenInfo: AllergenInfo = {
      contains: [],
      mayContain: [],
      freeFrom: []
    };
    
    const allergenSection = this.extractSection(content, ['allergen', 'alérgeno', 'alergênico']);
    if (!allergenSection) return allergenInfo;
    
    const commonAllergens = [
      'milk', 'leite',
      'egg', 'ovo',
      'soy', 'soja',
      'wheat', 'trigo',
      'peanut', 'amendoim',
      'tree nut', 'castanha',
      'fish', 'peixe',
      'shellfish', 'crustáceo',
      'sesame', 'gergelim',
      'gluten', 'glúten'
    ];
    
    for (const allergen of commonAllergens) {
      const allergenRegex = new RegExp(`${allergen}[^\\n]*(?:present|presente|detected|detectado)`, 'i');
      if (allergenRegex.test(allergenSection)) {
        allergenInfo.contains.push(allergen);
      }
      
      const mayContainRegex = new RegExp(`may contain[^\\n]*${allergen}|pode conter[^\\n]*${allergen}`, 'i');
      if (mayContainRegex.test(allergenSection)) {
        allergenInfo.mayContain.push(allergen);
      }
      
      const freeFromRegex = new RegExp(`free from[^\\n]*${allergen}|livre de[^\\n]*${allergen}`, 'i');
      if (freeFromRegex.test(allergenSection)) {
        allergenInfo.freeFrom.push(allergen);
      }
    }
    
    return allergenInfo;
  }

  /**
   * Extract physical-chemical parameters
   */
  private extractPhysicalChemical(content: string): Record<string, TestResult> {
    const parameters: Record<string, TestResult> = {};
    const physChemSection = this.extractSection(content, ['physical', 'chemical', 'físico', 'químico']);
    
    if (!physChemSection) return parameters;
    
    const commonParams = {
      'ph': /pH\s*:?\s*([\d.]+)/i,
      'acidity': /(?:acidity|acidez)\s*:?\s*([\d.]+)\s*(%|g\/100g)/i,
      'brix': /(?:brix|°brix)\s*:?\s*([\d.]+)/i,
      'density': /(?:density|densidade)\s*:?\s*([\d.]+)\s*(g\/ml|kg\/m3)/i,
      'viscosity': /(?:viscosity|viscosidade)\s*:?\s*([\d.]+)\s*(cP|mPa\.s)/i,
      'color': /(?:color|cor)\s*:?\s*([^\n]+)/i,
      'turbidity': /(?:turbidity|turbidez)\s*:?\s*([\d.]+)\s*(NTU|FTU)/i
    };
    
    for (const [param, regex] of Object.entries(commonParams)) {
      const match = physChemSection.match(regex);
      if (match) {
        parameters[param] = {
          value: param === 'color' ? match[1].trim() : parseFloat(match[1]),
          unit: match[2] || undefined
        };
      }
    }
    
    return parameters;
  }

  /**
   * Extract test result from a line
   */
  private extractTestResult(line: string): TestResult | null {
    // Try to extract numerical result
    const numericalResult = this.extractNumericalValue(line);
    if (numericalResult) {
      return {
        value: numericalResult.value,
        unit: numericalResult.unit,
        status: this.determineStatus(numericalResult.value, numericalResult.unit)
      };
    }
    
    // Check for detection limit patterns
    for (const pattern of DETECTION_LIMIT_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        return {
          value: match[1] || 'ND',
          detectionLimit: match[1],
          status: 'PASS'
        };
      }
    }
    
    // Check for qualitative results
    if (/ausente|absent|negativo|negative/i.test(line)) {
      return {
        value: 'Absent',
        status: 'PASS'
      };
    }
    
    if (/presente|present|positivo|positive/i.test(line)) {
      return {
        value: 'Present',
        status: 'FAIL'
      };
    }
    
    return null;
  }

  /**
   * Extract numerical value and unit from text
   */
  private extractNumericalValue(text: string): { value: number; unit?: string } | null {
    const patterns = [
      /([\d.]+)\s*(mg\/kg|μg\/kg|ug\/kg|g\/100g|g\/L|mg\/L|μg\/L|ug\/L|ppm|ppb|%|IU|CFU\/g|UFC\/g|NMP\/g|MPN\/g)/i,
      /([\d.]+)\s*x\s*10\^([\d]+)\s*(CFU\/g|UFC\/g|NMP\/g|MPN\/g)/i,
      /([\d,]+)\s*(kcal|cal|kJ)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[3] && match[2]) {
          // Scientific notation
          const value = parseFloat(match[1]) * Math.pow(10, parseInt(match[2]));
          return { value, unit: match[3] };
        } else {
          // Regular notation
          const value = parseFloat(match[1].replace(',', '.'));
          return { value, unit: this.normalizeUnit(match[2]) };
        }
      }
    }
    
    return null;
  }

  /**
   * Extract vitamins and minerals
   */
  private extractVitaminsAndMinerals(content: string, type: 'vitamin' | 'mineral'): VitaminMineral[] {
    const items: VitaminMineral[] = [];
    const section = this.extractSection(content, [type, type === 'vitamin' ? 'vitamina' : 'mineral']);
    
    if (!section) return items;
    
    const patterns = type === 'vitamin' 
      ? ['vitamin a', 'vitamin b1', 'vitamin b2', 'vitamin b3', 'vitamin b6', 'vitamin b12', 'vitamin c', 'vitamin d', 'vitamin e', 'vitamin k']
      : ['calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc', 'copper', 'manganese', 'selenium'];
    
    for (const nutrient of patterns) {
      const regex = new RegExp(`${nutrient}[^\\n]*([\d.]+)\\s*(mg|mcg|μg|ug|IU)`, 'i');
      const match = section.match(regex);
      if (match) {
        items.push({
          name: nutrient,
          amount: parseFloat(match[1]),
          unit: this.normalizeUnit(match[2]) as 'mg' | 'mcg' | 'IU' | 'g'
        });
      }
    }
    
    return items;
  }

  /**
   * Extract a specific section from content
   */
  private extractSection(content: string, keywords: string[]): string | null {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent = '';
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      if (keywords.some(keyword => lineLower.includes(keyword))) {
        inSection = true;
      } else if (inSection && /^[A-Z][A-Z\s]+:?$/.test(line.trim())) {
        // New section header detected
        break;
      }
      
      if (inSection) {
        sectionContent += line + '\n';
      }
    }
    
    return sectionContent || null;
  }

  /**
   * Convert parsed data to data points for validation
   */
  private convertToDataPoints(parsedData: ParsedReportData): DataPointValidation[] {
    const dataPoints: DataPointValidation[] = [];
    
    // Convert microbiological data
    if (parsedData.microbiological) {
      for (const [key, value] of Object.entries(parsedData.microbiological)) {
        if (value && typeof value === 'object' && 'value' in value) {
          dataPoints.push({
            dataPointId: `micro_${key}`,
            name: this.formatFieldName(key),
            value: value.value,
            unit: value.unit,
            validationStatus: value.status === 'PASS' ? 'PASSED' : 
                           value.status === 'FAIL' ? 'FAILED' : 'WARNING',
            source: 'LAB_REPORT'
          });
        }
      }
    }
    
    // Convert heavy metals data
    if (parsedData.heavyMetals) {
      for (const [key, value] of Object.entries(parsedData.heavyMetals)) {
        if (value && typeof value === 'object' && 'value' in value) {
          dataPoints.push({
            dataPointId: `metal_${key}`,
            name: this.formatFieldName(key),
            value: value.value,
            unit: value.unit,
            validationStatus: value.status === 'PASS' ? 'PASSED' : 
                           value.status === 'FAIL' ? 'FAILED' : 'WARNING',
            source: 'LAB_REPORT',
            threshold: this.getHeavyMetalThreshold(key)
          });
        }
      }
    }
    
    // Convert nutritional data
    if (parsedData.nutritional) {
      for (const [key, value] of Object.entries(parsedData.nutritional)) {
        if (typeof value === 'number') {
          dataPoints.push({
            dataPointId: `nutri_${key}`,
            name: this.formatFieldName(key),
            value: value,
            unit: this.getNutritionalUnit(key),
            validationStatus: 'NOT_APPLICABLE',
            source: 'LAB_REPORT'
          });
        }
      }
    }
    
    return dataPoints;
  }

  /**
   * Calculate confidence score for extracted data
   */
  private calculateConfidence(parsedData: ParsedReportData): number {
    let score = 0;
    let factors = 0;
    
    // Check if format was detected
    if (parsedData.laboratoryFormat !== LaboratoryFormat.UNKNOWN) {
      score += 20;
    }
    factors++;
    
    // Check basic info completeness
    const basicInfoFields = ['reportNumber', 'reportDate', 'sampleId'];
    const basicInfoScore = basicInfoFields.filter(field => (parsedData as any)[field]).length / basicInfoFields.length * 20;
    score += basicInfoScore;
    factors++;
    
    // Check data extraction
    const hasData = 
      (parsedData.microbiological && Object.keys(parsedData.microbiological).length > 0) ||
      (parsedData.heavyMetals && Object.keys(parsedData.heavyMetals).length > 0) ||
      (parsedData.nutritional && Object.keys(parsedData.nutritional).length > 0);
    
    if (hasData) {
      score += 30;
    }
    factors++;
    
    // Check data point count
    const dataPointScore = Math.min(parsedData.dataPoints.length / 10, 1) * 30;
    score += dataPointScore;
    factors++;
    
    return Math.round(score);
  }

  /**
   * Validate extracted data
   */
  validateExtractedData(data: ParsedReportData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if any data was extracted
    if (data.dataPoints.length === 0) {
      errors.push('No data points were extracted from the report');
    }
    
    // Check date validity
    if (data.reportDate) {
      const date = new Date(data.reportDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid report date format');
      }
    }
    
    // Check for required fields based on report type
    if (data.microbiological && Object.keys(data.microbiological).length > 0) {
      // Microbiological reports should have at least basic parameters
      const requiredMicro = ['totalPlateCount', 'coliforms'];
      const hasMicro = requiredMicro.some(field => (data.microbiological as any)[field]);
      if (!hasMicro) {
        errors.push('Microbiological report missing basic parameters');
      }
    }
    
    // Validate numerical values
    for (const dataPoint of data.dataPoints) {
      if (typeof dataPoint.value === 'number' && (isNaN(dataPoint.value) || dataPoint.value < 0)) {
        errors.push(`Invalid value for ${dataPoint.name}: ${dataPoint.value}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper methods
   */
  private normalizeUnit(unit: string): string {
    return UNIT_CONVERSIONS[unit] || unit;
  }

  private normalizeDate(dateStr: string): string {
    // Convert various date formats to ISO format
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map(p => p.padStart(2, '0'));
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month}-${day}`;
    }
    return dateStr;
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private isMicrobiologicalField(field: string): boolean {
    const microFields = ['totalPlateCount', 'coliforms', 'ecoli', 'salmonella', 'listeria', 
                        'staphylococcus', 'yeastAndMold', 'bacillus', 'clostridium', 'enterobacteriaceae'];
    return microFields.includes(field);
  }

  private isHeavyMetalField(field: string): boolean {
    const metalFields = ['lead', 'cadmium', 'mercury', 'arsenic', 'chromium', 
                        'copper', 'zinc', 'nickel', 'aluminum', 'tin'];
    return metalFields.includes(field);
  }

  private isNutritionalField(field: string): boolean {
    const nutriFields = ['calories', 'totalFat', 'saturatedFat', 'protein', 
                        'totalCarbohydrates', 'dietaryFiber', 'totalSugars', 'sodium',
                        'moisture', 'ash', 'pH'];
    return nutriFields.includes(field);
  }

  private getNutritionalUnit(field: string): string {
    const units: Record<string, string> = {
      calories: 'kcal',
      totalFat: 'g',
      saturatedFat: 'g',
      protein: 'g',
      totalCarbohydrates: 'g',
      dietaryFiber: 'g',
      totalSugars: 'g',
      sodium: 'mg',
      moisture: '%',
      ash: '%',
      pH: ''
    };
    return units[field] || '';
  }

  private getHeavyMetalThreshold(metal: string): ValidationThreshold {
    // These are example thresholds - should be configured based on regulations
    const thresholds: Record<string, ValidationThreshold> = {
      lead: { max: 0.5, unit: 'mg/kg' },
      cadmium: { max: 0.1, unit: 'mg/kg' },
      mercury: { max: 0.05, unit: 'mg/kg' },
      arsenic: { max: 1.0, unit: 'mg/kg' }
    };
    return thresholds[metal] || {};
  }

  private determineStatus(value: number | string, unit?: string): 'PASS' | 'FAIL' | 'WARNING' {
    // This is a simplified status determination
    // In production, this would check against regulatory limits
    if (typeof value === 'string') {
      return value.toLowerCase().includes('absent') || value.toLowerCase().includes('nd') ? 'PASS' : 'WARNING';
    }
    
    // Example: Check if value exceeds common limits
    if (unit === 'CFU/g' && value > 10000) return 'FAIL';
    if (unit === 'mg/kg' && value > 1) return 'WARNING';
    
    return 'PASS';
  }

  private determinePesticideStatus(value: number, unit: string): 'PASS' | 'FAIL' | 'WARNING' {
    // Convert to mg/kg for comparison
    let valueInMgKg = value;
    if (unit === 'μg/kg' || unit === 'ppb') {
      valueInMgKg = value / 1000;
    }
    
    // Default MRL (Maximum Residue Limit) for most pesticides
    if (valueInMgKg > 0.01) return 'FAIL';
    if (valueInMgKg > 0.005) return 'WARNING';
    return 'PASS';
  }
}

// Export singleton instance
export const reportParserService = new ReportParserService();

// Export types and enums
export type { 
  ParsedReportData, 
  MicrobiologicalAnalysis, 
  HeavyMetalsAnalysis,
  ExtendedNutritionalProfile,
  TestResult 
};