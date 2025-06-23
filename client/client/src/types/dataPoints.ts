/**
 * Comprehensive TypeScript types for TrueLabel data points
 * This file contains interfaces and enums for all laboratory analysis data
 */

/**
 * Analysis types available in the system
 */
export enum AnalysisType {
  MICROBIOLOGICAL = 'microbiological',
  HEAVY_METALS = 'heavy_metals',
  PESTICIDES = 'pesticides',
  MYCOTOXINS = 'mycotoxins',
  MICROSCOPY = 'microscopy',
  BANNED_SUBSTANCES = 'banned_substances',
  RESIDUAL_SOLVENTS = 'residual_solvents',
  ALLERGENS = 'allergens',
  NUTRITIONAL = 'nutritional',
  PHYSICAL_CHEMICAL = 'physical_chemical'
}

/**
 * Compliance status for test results
 */
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending',
  NOT_APPLICABLE = 'not_applicable',
  WARNING = 'warning' // For values close to limits
}

/**
 * Common units of measurement
 */
export enum MeasurementUnit {
  // Weight/Mass
  MG_KG = 'mg/kg',
  UG_KG = 'μg/kg',
  NG_KG = 'ng/kg',
  PPM = 'ppm',
  PPB = 'ppb',
  
  // Microbiological
  CFU_G = 'CFU/g',
  CFU_ML = 'CFU/mL',
  MPN_G = 'MPN/g',
  MPN_ML = 'MPN/mL',
  
  // Presence/Absence
  PRESENCE_25G = 'presence/25g',
  PRESENCE_10G = 'presence/10g',
  
  // Percentage
  PERCENT = '%',
  
  // Count
  COUNT = 'count',
  COUNT_PER_G = 'count/g',
  
  // Other
  BOOLEAN = 'boolean',
  PH = 'pH',
  WATER_ACTIVITY = 'aw'
}

/**
 * Detection methods used in laboratory analysis
 */
export enum DetectionMethod {
  // Microbiological
  ISO_6579 = 'ISO 6579', // Salmonella
  ISO_16649 = 'ISO 16649', // E. coli
  ISO_4833 = 'ISO 4833', // Total plate count
  ISO_21527 = 'ISO 21527', // Yeasts and molds
  
  // Chemical
  HPLC = 'HPLC',
  GC_MS = 'GC-MS',
  LC_MS_MS = 'LC-MS/MS',
  ICP_MS = 'ICP-MS',
  ICP_OES = 'ICP-OES',
  
  // Immunological
  ELISA = 'ELISA',
  LATERAL_FLOW = 'Lateral Flow',
  
  // Microscopy
  OPTICAL_MICROSCOPY = 'Optical Microscopy',
  ELECTRON_MICROSCOPY = 'Electron Microscopy',
  
  // Other
  PCR = 'PCR',
  REAL_TIME_PCR = 'Real-time PCR',
  GRAVIMETRIC = 'Gravimetric',
  SPECTROPHOTOMETRY = 'Spectrophotometry'
}

/**
 * Base interface for all test results
 */
export interface BaseTestResult {
  /** Test/analysis date */
  testDate: Date;
  
  /** Laboratory reference number */
  labReference: string;
  
  /** Laboratory that performed the test */
  laboratoryId: string;
  
  /** Technician who performed the test */
  technicianId?: string;
  
  /** Additional notes or observations */
  notes?: string;
  
  /** Method used for detection/analysis */
  detectionMethod: DetectionMethod | string;
  
  /** Compliance status based on regulatory limits */
  complianceStatus: ComplianceStatus;
  
  /** Reference to the certificate or report */
  certificateId?: string;
}

/**
 * Quantitative test result
 */
export interface QuantitativeResult extends BaseTestResult {
  /** Measured value */
  value: number;
  
  /** Unit of measurement */
  unit: MeasurementUnit;
  
  /** Regulatory limit */
  regulatoryLimit: number;
  
  /** Limit of detection (LOD) */
  limitOfDetection?: number;
  
  /** Limit of quantification (LOQ) */
  limitOfQuantification?: number;
  
  /** Measurement uncertainty */
  uncertainty?: number;
}

/**
 * Qualitative test result (presence/absence)
 */
export interface QualitativeResult extends BaseTestResult {
  /** Detected or not detected */
  detected: boolean;
  
  /** Sample size tested */
  sampleSize?: string;
}

/**
 * Microbiological analysis results
 */
export interface MicrobiologicalAnalysis {
  /** Salmonella spp. */
  salmonella: QualitativeResult;
  
  /** Escherichia coli */
  eColi: QuantitativeResult;
  
  /** Total coliforms */
  totalColiforms: QuantitativeResult;
  
  /** Fecal coliforms */
  fecalColiforms: QuantitativeResult;
  
  /** Listeria monocytogenes */
  listeriaMonocytogenes: QualitativeResult;
  
  /** Staphylococcus aureus */
  staphylococcusAureus: QuantitativeResult;
  
  /** Clostridium perfringens */
  clostridiumPerfringens: QuantitativeResult;
  
  /** Bacillus cereus */
  bacillusCereus: QuantitativeResult;
  
  /** Total plate count (aerobic mesophilic bacteria) */
  totalPlateCount: QuantitativeResult;
  
  /** Yeasts */
  yeasts: QuantitativeResult;
  
  /** Molds */
  molds: QuantitativeResult;
  
  /** Enterobacteriaceae */
  enterobacteriaceae: QuantitativeResult;
  
  /** Pseudomonas aeruginosa */
  pseudomonasAeruginosa: QuantitativeResult;
}

/**
 * Heavy metals analysis results
 */
export interface HeavyMetalsAnalysis {
  /** Mercury (Hg) */
  mercury: QuantitativeResult;
  
  /** Arsenic (As) */
  arsenic: QuantitativeResult;
  
  /** Cadmium (Cd) */
  cadmium: QuantitativeResult;
  
  /** Lead (Pb) */
  lead: QuantitativeResult;
  
  /** Chromium (Cr) */
  chromium?: QuantitativeResult;
  
  /** Nickel (Ni) */
  nickel?: QuantitativeResult;
  
  /** Copper (Cu) */
  copper?: QuantitativeResult;
  
  /** Zinc (Zn) */
  zinc?: QuantitativeResult;
  
  /** Aluminum (Al) */
  aluminum?: QuantitativeResult;
  
  /** Tin (Sn) */
  tin?: QuantitativeResult;
}

/**
 * Pesticides and herbicides analysis results
 */
export interface PesticidesAnalysis {
  /** Glyphosate */
  glyphosate: QuantitativeResult;
  
  /** AMPA (Aminomethylphosphonic acid) - glyphosate metabolite */
  ampa: QuantitativeResult;
  
  /** Atrazine */
  atrazine: QuantitativeResult;
  
  /** 2,4-D (Dichlorophenoxyacetic acid) */
  dichlorophenoxyaceticAcid: QuantitativeResult;
  
  /** Chlorpyrifos */
  chlorpyrifos: QuantitativeResult;
  
  /** Organochlorines (total) */
  organochlorines?: QuantitativeResult;
  
  /** Organophosphates (total) */
  organophosphates?: QuantitativeResult;
  
  /** Pyrethroids (total) */
  pyrethroids?: QuantitativeResult;
  
  /** Carbamates (total) */
  carbamates?: QuantitativeResult;
  
  /** Multi-residue screen results */
  multiResidueScreen?: PesticideResidue[];
}

/**
 * Individual pesticide residue result
 */
export interface PesticideResidue {
  /** Pesticide name */
  name: string;
  
  /** CAS number */
  casNumber?: string;
  
  /** Result */
  result: QuantitativeResult;
}

/**
 * Mycotoxins and aflatoxins analysis results
 */
export interface MycotoxinsAnalysis {
  /** Aflatoxin B1 */
  aflatoxinB1: QuantitativeResult;
  
  /** Aflatoxin B2 */
  aflatoxinB2: QuantitativeResult;
  
  /** Aflatoxin G1 */
  aflatoxinG1: QuantitativeResult;
  
  /** Aflatoxin G2 */
  aflatoxinG2: QuantitativeResult;
  
  /** Total aflatoxins (B1+B2+G1+G2) */
  totalAflatoxins: QuantitativeResult;
  
  /** Ochratoxin A */
  ochratoxinA: QuantitativeResult;
  
  /** Deoxynivalenol (DON) */
  deoxynivalenol: QuantitativeResult;
  
  /** Zearalenone */
  zearalenone: QuantitativeResult;
  
  /** Fumonisin B1 */
  fumonisinB1: QuantitativeResult;
  
  /** Fumonisin B2 */
  fumonisinB2: QuantitativeResult;
  
  /** T-2 toxin */
  t2Toxin: QuantitativeResult;
  
  /** HT-2 toxin */
  ht2Toxin: QuantitativeResult;
  
  /** Patulin */
  patulin?: QuantitativeResult;
}

/**
 * Microscopy and macroscopy analysis results
 */
export interface MicroscopyAnalysis {
  /** Insect fragments */
  insectFragments: QuantitativeResult & {
    /** Types of insects identified */
    insectTypes?: string[];
  };
  
  /** Whole insects */
  wholeInsects: QuantitativeResult & {
    /** Species identified */
    species?: string[];
  };
  
  /** Mites */
  mites: QuantitativeResult & {
    /** Dead or alive */
    status?: 'dead' | 'alive' | 'both';
  };
  
  /** Animal hair (rodent) */
  rodentHair: QuantitativeResult;
  
  /** Animal hair (other) */
  animalHair: QuantitativeResult & {
    /** Type of animal if identified */
    animalType?: string;
  };
  
  /** Foreign matter */
  foreignMatter: {
    /** Glass particles */
    glass: QuantitativeResult;
    
    /** Metal particles */
    metal: QuantitativeResult;
    
    /** Plastic particles */
    plastic: QuantitativeResult;
    
    /** Wood particles */
    wood: QuantitativeResult;
    
    /** Stones/sand */
    stones: QuantitativeResult;
    
    /** Other foreign matter */
    other?: QuantitativeResult & {
      description: string;
    };
  };
  
  /** Filth and contamination */
  filth: {
    /** Rodent excreta */
    rodentExcreta: QuantitativeResult;
    
    /** Bird excreta */
    birdExcreta: QuantitativeResult;
    
    /** Insect excreta */
    insectExcreta: QuantitativeResult;
  };
}

/**
 * Banned substances analysis results
 */
export interface BannedSubstancesAnalysis {
  /** Anabolic agents */
  anabolicAgents: {
    /** Testosterone */
    testosterone: QuantitativeResult;
    
    /** Nandrolone */
    nandrolone: QuantitativeResult;
    
    /** Boldenone */
    boldenone: QuantitativeResult;
    
    /** Stanozolol */
    stanozolol: QuantitativeResult;
    
    /** Other anabolic steroids */
    otherSteroids?: BannedSubstance[];
  };
  
  /** Beta-agonists */
  betaAgonists: {
    /** Clenbuterol */
    clenbuterol: QuantitativeResult;
    
    /** Salbutamol */
    salbutamol: QuantitativeResult;
    
    /** Ractopamine */
    ractopamine: QuantitativeResult;
    
    /** Other beta-agonists */
    others?: BannedSubstance[];
  };
  
  /** Hormones */
  hormones: {
    /** Growth hormone (GH) */
    growthHormone: QuantitativeResult;
    
    /** Insulin-like growth factor (IGF-1) */
    igf1: QuantitativeResult;
    
    /** Thyroid hormones */
    thyroidHormones?: QuantitativeResult;
  };
  
  /** Antibiotics (prohibited) */
  prohibitedAntibiotics: {
    /** Chloramphenicol */
    chloramphenicol: QuantitativeResult;
    
    /** Nitrofurans */
    nitrofurans: QuantitativeResult;
    
    /** Others */
    others?: BannedSubstance[];
  };
}

/**
 * Individual banned substance result
 */
export interface BannedSubstance {
  /** Substance name */
  name: string;
  
  /** CAS number */
  casNumber?: string;
  
  /** Result */
  result: QuantitativeResult;
}

/**
 * Residual solvents analysis results
 */
export interface ResidualSolventsAnalysis {
  /** Ethanol */
  ethanol: QuantitativeResult;
  
  /** Methanol */
  methanol: QuantitativeResult;
  
  /** Acetone */
  acetone: QuantitativeResult;
  
  /** Isopropanol */
  isopropanol: QuantitativeResult;
  
  /** Hexane */
  hexane: QuantitativeResult;
  
  /** Benzene */
  benzene: QuantitativeResult;
  
  /** Toluene */
  toluene: QuantitativeResult;
  
  /** Chloroform */
  chloroform: QuantitativeResult;
  
  /** Dichloromethane */
  dichloromethane: QuantitativeResult;
  
  /** Ethyl acetate */
  ethylAcetate: QuantitativeResult;
  
  /** Other solvents */
  others?: SolventResidue[];
}

/**
 * Individual solvent residue result
 */
export interface SolventResidue {
  /** Solvent name */
  name: string;
  
  /** CAS number */
  casNumber?: string;
  
  /** Result */
  result: QuantitativeResult;
}

/**
 * Allergens analysis results
 */
export interface AllergensAnalysis {
  /** Milk proteins (casein, whey) */
  milk: AllergenResult;
  
  /** Egg proteins */
  egg: AllergenResult;
  
  /** Gluten (gliadin) */
  gluten: AllergenResult;
  
  /** Peanut proteins */
  peanuts: AllergenResult;
  
  /** Tree nuts */
  treeNuts: {
    /** Almonds */
    almonds: AllergenResult;
    
    /** Brazil nuts */
    brazilNuts: AllergenResult;
    
    /** Cashews */
    cashews: AllergenResult;
    
    /** Hazelnuts */
    hazelnuts: AllergenResult;
    
    /** Walnuts */
    walnuts: AllergenResult;
    
    /** Pecans */
    pecans: AllergenResult;
    
    /** Pistachios */
    pistachios: AllergenResult;
    
    /** Macadamia nuts */
    macadamiaNuts: AllergenResult;
  };
  
  /** Soy proteins */
  soy: AllergenResult;
  
  /** Fish proteins */
  fish: AllergenResult;
  
  /** Crustacean proteins */
  crustaceans: AllergenResult;
  
  /** Mollusks */
  mollusks: AllergenResult;
  
  /** Sesame */
  sesame: AllergenResult;
  
  /** Mustard */
  mustard: AllergenResult;
  
  /** Celery */
  celery: AllergenResult;
  
  /** Lupin */
  lupin: AllergenResult;
  
  /** Sulfites */
  sulfites: QuantitativeResult;
}

/**
 * Allergen test result
 */
export interface AllergenResult extends BaseTestResult {
  /** Detected or not detected */
  detected: boolean;
  
  /** Quantitative value if applicable */
  value?: number;
  
  /** Unit if quantitative */
  unit?: MeasurementUnit;
  
  /** Threshold for labeling */
  labelingThreshold?: number;
}

/**
 * Extended nutritional profile beyond standard nutrition facts
 */
export interface ExtendedNutritionalProfile {
  /** Basic macronutrients (already in nutrition facts) */
  macronutrients: {
    /** Total carbohydrates breakdown */
    carbohydrates: {
      total: number;
      sugars: {
        total: number;
        addedSugars: number;
        naturalSugars: number;
        /** Individual sugars */
        glucose?: number;
        fructose?: number;
        sucrose?: number;
        lactose?: number;
        maltose?: number;
      };
      fiber: {
        total: number;
        soluble: number;
        insoluble: number;
      };
      starch: number;
      sugarAlcohols?: number;
    };
    
    /** Protein quality */
    protein: {
      total: number;
      /** Amino acid profile */
      aminoAcids?: AminoAcidProfile;
      /** Protein Digestibility Corrected Amino Acid Score */
      pdcaas?: number;
    };
    
    /** Fat profile */
    fats: {
      total: number;
      saturated: number;
      trans: number;
      monounsaturated: number;
      polyunsaturated: number;
      /** Omega fatty acids */
      omega3?: number;
      omega6?: number;
      omega9?: number;
      /** Cholesterol */
      cholesterol: number;
    };
  };
  
  /** Vitamins */
  vitamins: {
    /** Fat-soluble vitamins */
    vitaminA: NutrientValue;
    vitaminD: NutrientValue;
    vitaminE: NutrientValue;
    vitaminK: NutrientValue;
    
    /** Water-soluble vitamins */
    vitaminC: NutrientValue;
    thiamin: NutrientValue; // B1
    riboflavin: NutrientValue; // B2
    niacin: NutrientValue; // B3
    pantothenicAcid: NutrientValue; // B5
    vitaminB6: NutrientValue;
    biotin: NutrientValue; // B7
    folate: NutrientValue; // B9
    vitaminB12: NutrientValue;
    choline?: NutrientValue;
  };
  
  /** Minerals */
  minerals: {
    /** Major minerals */
    calcium: NutrientValue;
    phosphorus: NutrientValue;
    magnesium: NutrientValue;
    sodium: NutrientValue;
    potassium: NutrientValue;
    chloride: NutrientValue;
    sulfur?: NutrientValue;
    
    /** Trace minerals */
    iron: NutrientValue;
    zinc: NutrientValue;
    copper: NutrientValue;
    manganese: NutrientValue;
    selenium: NutrientValue;
    iodine: NutrientValue;
    chromium?: NutrientValue;
    molybdenum?: NutrientValue;
    fluoride?: NutrientValue;
  };
  
  /** Other components */
  otherComponents?: {
    /** Caffeine content */
    caffeine?: NutrientValue;
    
    /** Alcohol content */
    alcohol?: NutrientValue;
    
    /** Water content */
    water?: NutrientValue;
    
    /** Ash content */
    ash?: NutrientValue;
    
    /** pH value */
    ph?: number;
    
    /** Water activity */
    waterActivity?: number;
  };
}

/**
 * Amino acid profile
 */
export interface AminoAcidProfile {
  /** Essential amino acids */
  essential: {
    histidine: number;
    isoleucine: number;
    leucine: number;
    lysine: number;
    methionine: number;
    phenylalanine: number;
    threonine: number;
    tryptophan: number;
    valine: number;
  };
  
  /** Non-essential amino acids */
  nonEssential: {
    alanine: number;
    arginine: number;
    asparticAcid: number;
    cysteine: number;
    glutamicAcid: number;
    glycine: number;
    proline: number;
    serine: number;
    tyrosine: number;
  };
}

/**
 * Nutrient value with unit and daily value percentage
 */
export interface NutrientValue {
  /** Amount */
  value: number;
  
  /** Unit */
  unit: string;
  
  /** % Daily Value */
  dailyValue?: number;
  
  /** Test method used */
  testMethod?: string;
}

/**
 * Complete product analysis data
 */
export interface ProductAnalysisData {
  /** Product identification */
  productId: string;
  batchNumber: string;
  sampleId: string;
  
  /** Analysis metadata */
  analysisDate: Date;
  reportNumber: string;
  laboratoryId: string;
  
  /** All analysis results */
  microbiological?: MicrobiologicalAnalysis;
  heavyMetals?: HeavyMetalsAnalysis;
  pesticides?: PesticidesAnalysis;
  mycotoxins?: MycotoxinsAnalysis;
  microscopy?: MicroscopyAnalysis;
  bannedSubstances?: BannedSubstancesAnalysis;
  residualSolvents?: ResidualSolventsAnalysis;
  allergens?: AllergensAnalysis;
  nutritionalProfile?: ExtendedNutritionalProfile;
  
  /** Overall compliance summary */
  overallCompliance: ComplianceStatus;
  
  /** Non-compliant parameters */
  nonCompliantParameters?: string[];
  
  /** Certification status */
  certificationStatus?: {
    certified: boolean;
    certificateNumber?: string;
    validUntil?: Date;
  };
}

/**
 * Analysis request for laboratory
 */
export interface AnalysisRequest {
  /** Requested analysis types */
  analysisTypes: AnalysisType[];
  
  /** Specific parameters to test */
  specificParameters?: string[];
  
  /** Urgency level */
  urgency: 'standard' | 'urgent' | 'critical';
  
  /** Special instructions */
  specialInstructions?: string;
  
  /** Regulatory standard to follow */
  regulatoryStandard?: string;
  
  /** Target market/country */
  targetMarket?: string;
}

/**
 * Laboratory capabilities
 */
export interface LaboratoryCapabilities {
  /** Laboratory ID */
  laboratoryId: string;
  
  /** Available analysis types */
  availableAnalyses: AnalysisType[];
  
  /** Accreditations */
  accreditations: string[];
  
  /** ISO certifications */
  isoCertifications: string[];
  
  /** Detection methods available */
  detectionMethods: DetectionMethod[];
  
  /** Turnaround times by analysis type */
  turnaroundTimes: Record<AnalysisType, number>; // in days
  
  /** Minimum sample requirements */
  sampleRequirements: Record<AnalysisType, string>;
}