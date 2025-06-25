/**
 * Validation Rules Engine Configuration
 * Based on Brazilian regulatory standards (ANVISA, MAPA)
 */

export interface ValidationRule {
  parameter: string;
  unit: string;
  limits: {
    min?: number;
    max?: number;
    warningThreshold?: number;
  };
  regulatorySource: string;
  category: 'microbiological' | 'chemical' | 'nutritional' | 'physical';
  severity: 'critical' | 'major' | 'minor';
}

export interface ValidationResult {
  parameter: string;
  value: number;
  unit: string;
  status: 'approved' | 'warning' | 'rejected';
  message: string;
  regulatoryReference?: string;
}

// ANVISA RDC 331/2019 and RDC 724/2022 - Microbiological Standards
export const MICROBIOLOGICAL_LIMITS: Record<string, ValidationRule> = {
  // General food products
  aerobic_mesophiles: {
    parameter: 'Aerobic Mesophiles',
    unit: 'CFU/g',
    limits: { max: 100000, warningThreshold: 50000 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'major'
  },
  total_coliforms: {
    parameter: 'Total Coliforms',
    unit: 'CFU/g',
    limits: { max: 1000, warningThreshold: 500 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'major'
  },
  thermotolerant_coliforms: {
    parameter: 'Thermotolerant Coliforms (45°C)',
    unit: 'CFU/g',
    limits: { max: 100, warningThreshold: 50 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'critical'
  },
  escherichia_coli: {
    parameter: 'Escherichia coli',
    unit: 'CFU/g',
    limits: { max: 10, warningThreshold: 5 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'critical'
  },
  salmonella: {
    parameter: 'Salmonella sp.',
    unit: 'in 25g',
    limits: { max: 0 }, // Must be absent
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'critical'
  },
  listeria_monocytogenes: {
    parameter: 'Listeria monocytogenes',
    unit: 'CFU/g',
    limits: { max: 100, warningThreshold: 50 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'critical'
  },
  staphylococcus_aureus: {
    parameter: 'Staphylococcus aureus',
    unit: 'CFU/g',
    limits: { max: 1000, warningThreshold: 500 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'major'
  },
  bacillus_cereus: {
    parameter: 'Bacillus cereus',
    unit: 'CFU/g',
    limits: { max: 1000, warningThreshold: 500 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'major'
  },
  clostridium_perfringens: {
    parameter: 'Clostridium perfringens',
    unit: 'CFU/g',
    limits: { max: 100, warningThreshold: 50 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'major'
  },
  yeasts_molds: {
    parameter: 'Yeasts and Molds',
    unit: 'CFU/g',
    limits: { max: 10000, warningThreshold: 5000 },
    regulatorySource: 'ANVISA RDC 331/2019',
    category: 'microbiological',
    severity: 'minor'
  }
};

// ANVISA RDC 722/2022 - Heavy Metal Maximum Limits
export const HEAVY_METAL_LIMITS: Record<string, ValidationRule> = {
  lead: {
    parameter: 'Lead (Pb)',
    unit: 'mg/kg',
    limits: { max: 0.5, warningThreshold: 0.4 },
    regulatorySource: 'ANVISA RDC 722/2022',
    category: 'chemical',
    severity: 'critical'
  },
  cadmium: {
    parameter: 'Cadmium (Cd)',
    unit: 'mg/kg',
    limits: { max: 0.1, warningThreshold: 0.08 },
    regulatorySource: 'ANVISA RDC 722/2022',
    category: 'chemical',
    severity: 'critical'
  },
  mercury: {
    parameter: 'Mercury (Hg)',
    unit: 'mg/kg',
    limits: { max: 0.05, warningThreshold: 0.04 },
    regulatorySource: 'ANVISA RDC 722/2022',
    category: 'chemical',
    severity: 'critical'
  },
  arsenic: {
    parameter: 'Arsenic (As)',
    unit: 'mg/kg',
    limits: { max: 0.3, warningThreshold: 0.25 },
    regulatorySource: 'ANVISA RDC 722/2022',
    category: 'chemical',
    severity: 'critical'
  },
  tin: {
    parameter: 'Tin (Sn)',
    unit: 'mg/kg',
    limits: { max: 250, warningThreshold: 200 }, // For canned foods
    regulatorySource: 'ANVISA RDC 722/2022',
    category: 'chemical',
    severity: 'major'
  },
  copper: {
    parameter: 'Copper (Cu)',
    unit: 'mg/kg',
    limits: { max: 30, warningThreshold: 25 },
    regulatorySource: 'ANVISA RDC 722/2022',
    category: 'chemical',
    severity: 'minor'
  },
  chromium: {
    parameter: 'Chromium (Cr)',
    unit: 'mg/kg',
    limits: { max: 0.1, warningThreshold: 0.08 },
    regulatorySource: 'ANVISA RDC 722/2022',
    category: 'chemical',
    severity: 'major'
  }
};

// ANVISA/MAPA - Pesticide Maximum Residue Limits (MRLs)
export const PESTICIDE_MRLS: Record<string, ValidationRule> = {
  // Common pesticides with general limits
  glyphosate: {
    parameter: 'Glyphosate',
    unit: 'mg/kg',
    limits: { max: 0.1, warningThreshold: 0.08 },
    regulatorySource: 'ANVISA Monograph',
    category: 'chemical',
    severity: 'critical'
  },
  chlorpyrifos: {
    parameter: 'Chlorpyrifos',
    unit: 'mg/kg',
    limits: { max: 0.05, warningThreshold: 0.04 },
    regulatorySource: 'ANVISA Monograph',
    category: 'chemical',
    severity: 'critical'
  },
  carbendazim: {
    parameter: 'Carbendazim',
    unit: 'mg/kg',
    limits: { max: 0.1, warningThreshold: 0.08 },
    regulatorySource: 'ANVISA Monograph',
    category: 'chemical',
    severity: 'major'
  },
  imidacloprid: {
    parameter: 'Imidacloprid',
    unit: 'mg/kg',
    limits: { max: 0.05, warningThreshold: 0.04 },
    regulatorySource: 'ANVISA Monograph',
    category: 'chemical',
    severity: 'major'
  },
  deltamethrin: {
    parameter: 'Deltamethrin',
    unit: 'mg/kg',
    limits: { max: 0.02, warningThreshold: 0.015 },
    regulatorySource: 'ANVISA Monograph',
    category: 'chemical',
    severity: 'major'
  }
};

// ANVISA RDC 723/2022 - Mycotoxin Limits
export const MYCOTOXIN_LIMITS: Record<string, ValidationRule> = {
  aflatoxin_b1: {
    parameter: 'Aflatoxin B1',
    unit: 'μg/kg',
    limits: { max: 5, warningThreshold: 4 },
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'critical'
  },
  aflatoxin_total: {
    parameter: 'Total Aflatoxins (B1+B2+G1+G2)',
    unit: 'μg/kg',
    limits: { max: 20, warningThreshold: 15 },
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'critical'
  },
  aflatoxin_m1: {
    parameter: 'Aflatoxin M1',
    unit: 'μg/L',
    limits: { max: 0.5, warningThreshold: 0.4 }, // For milk products
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'critical'
  },
  ochratoxin_a: {
    parameter: 'Ochratoxin A',
    unit: 'μg/kg',
    limits: { max: 10, warningThreshold: 8 },
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'major'
  },
  deoxynivalenol: {
    parameter: 'Deoxynivalenol (DON)',
    unit: 'μg/kg',
    limits: { max: 1000, warningThreshold: 800 },
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'major'
  },
  zearalenone: {
    parameter: 'Zearalenone',
    unit: 'μg/kg',
    limits: { max: 200, warningThreshold: 150 },
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'major'
  },
  fumonisin: {
    parameter: 'Fumonisins (B1+B2)',
    unit: 'μg/kg',
    limits: { max: 1500, warningThreshold: 1200 },
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'major'
  },
  patulin: {
    parameter: 'Patulin',
    unit: 'μg/L',
    limits: { max: 50, warningThreshold: 40 }, // For fruit juices
    regulatorySource: 'ANVISA RDC 723/2022',
    category: 'chemical',
    severity: 'major'
  }
};

// ANVISA RDC 429/2020 - Nutritional Tolerance Ranges
export const NUTRITIONAL_TOLERANCES = {
  // Macronutrients: ±20% tolerance
  macronutrients: {
    tolerance: 0.20, // 20%
    parameters: ['protein', 'total_fat', 'carbohydrates', 'dietary_fiber', 'sugar']
  },
  // Micronutrients: Different tolerances based on declared value
  micronutrients: {
    highValue: { threshold: 100, tolerance: 0.20 }, // ≥100mg/100μg: ±20%
    lowValue: { threshold: 100, tolerance: 0.45 }   // <100mg/100μg: ±45%
  },
  // Energy: ±20% tolerance
  energy: {
    tolerance: 0.20,
    parameters: ['calories', 'energy_kj']
  },
  // Sodium: +20% tolerance (no lower limit)
  sodium: {
    upperTolerance: 0.20,
    lowerTolerance: null
  }
};

/**
 * Helper Functions for Validation
 */

export function validateMicrobiological(
  parameter: string,
  value: number,
  unit: string
): ValidationResult {
  const rule = MICROBIOLOGICAL_LIMITS[parameter.toLowerCase().replace(/\s+/g, '_')];
  
  if (!rule) {
    return {
      parameter,
      value,
      unit,
      status: 'warning',
      message: 'No regulatory limit defined for this parameter'
    };
  }

  // Special handling for Salmonella (presence/absence test)
  if (parameter.toLowerCase().includes('salmonella')) {
    return {
      parameter,
      value,
      unit,
      status: value === 0 ? 'approved' : 'rejected',
      message: value === 0 ? 'Absent (compliant)' : 'Present (non-compliant)',
      regulatoryReference: rule.regulatorySource
    };
  }

  if (value > rule.limits.max!) {
    return {
      parameter,
      value,
      unit,
      status: 'rejected',
      message: `Exceeds maximum limit of ${rule.limits.max} ${rule.unit}`,
      regulatoryReference: rule.regulatorySource
    };
  }

  if (rule.limits.warningThreshold && value > rule.limits.warningThreshold) {
    return {
      parameter,
      value,
      unit,
      status: 'warning',
      message: `Above warning threshold of ${rule.limits.warningThreshold} ${rule.unit}`,
      regulatoryReference: rule.regulatorySource
    };
  }

  return {
    parameter,
    value,
    unit,
    status: 'approved',
    message: 'Within acceptable limits',
    regulatoryReference: rule.regulatorySource
  };
}

export function validateChemical(
  parameter: string,
  value: number,
  unit: string,
  category: 'heavy_metal' | 'pesticide' | 'mycotoxin'
): ValidationResult {
  let rule: ValidationRule | undefined;
  
  switch (category) {
    case 'heavy_metal':
      rule = HEAVY_METAL_LIMITS[parameter.toLowerCase().replace(/\s+/g, '_')];
      break;
    case 'pesticide':
      rule = PESTICIDE_MRLS[parameter.toLowerCase().replace(/\s+/g, '_')];
      break;
    case 'mycotoxin':
      rule = MYCOTOXIN_LIMITS[parameter.toLowerCase().replace(/\s+/g, '_')];
      break;
  }

  if (!rule) {
    return {
      parameter,
      value,
      unit,
      status: 'warning',
      message: 'No regulatory limit defined for this parameter'
    };
  }

  if (value > rule.limits.max!) {
    return {
      parameter,
      value,
      unit,
      status: 'rejected',
      message: `Exceeds maximum limit of ${rule.limits.max} ${rule.unit}`,
      regulatoryReference: rule.regulatorySource
    };
  }

  if (rule.limits.warningThreshold && value > rule.limits.warningThreshold) {
    return {
      parameter,
      value,
      unit,
      status: 'warning',
      message: `Above warning threshold of ${rule.limits.warningThreshold} ${rule.unit}`,
      regulatoryReference: rule.regulatorySource
    };
  }

  return {
    parameter,
    value,
    unit,
    status: 'approved',
    message: 'Within acceptable limits',
    regulatoryReference: rule.regulatorySource
  };
}

export function validateNutritional(
  parameter: string,
  declaredValue: number,
  actualValue: number,
  unit: string
): ValidationResult {
  const paramLower = parameter.toLowerCase();
  let tolerance: number;
  let allowedMin: number;
  let allowedMax: number;

  // Determine tolerance based on parameter type
  if (NUTRITIONAL_TOLERANCES.macronutrients.parameters.includes(paramLower)) {
    tolerance = NUTRITIONAL_TOLERANCES.macronutrients.tolerance;
    allowedMin = declaredValue * (1 - tolerance);
    allowedMax = declaredValue * (1 + tolerance);
  } else if (NUTRITIONAL_TOLERANCES.energy.parameters.includes(paramLower)) {
    tolerance = NUTRITIONAL_TOLERANCES.energy.tolerance;
    allowedMin = declaredValue * (1 - tolerance);
    allowedMax = declaredValue * (1 + tolerance);
  } else if (paramLower === 'sodium') {
    // Sodium has special rules: no lower limit, +20% upper
    allowedMin = 0;
    allowedMax = declaredValue * (1 + NUTRITIONAL_TOLERANCES.sodium.upperTolerance);
  } else {
    // Assume micronutrient
    const isMg = unit.toLowerCase().includes('mg');
    const threshold = isMg ? 100 : 0.1; // 100mg or 100μg
    
    if (declaredValue >= threshold) {
      tolerance = NUTRITIONAL_TOLERANCES.micronutrients.highValue.tolerance;
    } else {
      tolerance = NUTRITIONAL_TOLERANCES.micronutrients.lowValue.tolerance;
    }
    
    allowedMin = declaredValue * (1 - tolerance);
    allowedMax = declaredValue * (1 + tolerance);
  }

  // Validate against tolerances
  if (actualValue < allowedMin) {
    return {
      parameter,
      value: actualValue,
      unit,
      status: 'rejected',
      message: `Below minimum tolerance (declared: ${declaredValue}, min allowed: ${allowedMin.toFixed(2)})`,
      regulatoryReference: 'ANVISA RDC 429/2020'
    };
  }

  if (actualValue > allowedMax) {
    return {
      parameter,
      value: actualValue,
      unit,
      status: 'rejected',
      message: `Above maximum tolerance (declared: ${declaredValue}, max allowed: ${allowedMax.toFixed(2)})`,
      regulatoryReference: 'ANVISA RDC 429/2020'
    };
  }

  // Check if within warning range (±5% of tolerance limits)
  const warningMargin = 0.05;
  if (actualValue < allowedMin * (1 + warningMargin) || 
      actualValue > allowedMax * (1 - warningMargin)) {
    return {
      parameter,
      value: actualValue,
      unit,
      status: 'warning',
      message: `Near tolerance limits (declared: ${declaredValue}, actual: ${actualValue})`,
      regulatoryReference: 'ANVISA RDC 429/2020'
    };
  }

  return {
    parameter,
    value: actualValue,
    unit,
    status: 'approved',
    message: `Within tolerance range (declared: ${declaredValue}, actual: ${actualValue})`,
    regulatoryReference: 'ANVISA RDC 429/2020'
  };
}

/**
 * Calculate overall validation status based on individual results
 */
export function calculateOverallStatus(results: ValidationResult[]): {
  status: 'approved' | 'conditional' | 'rejected';
  summary: string;
  criticalIssues: number;
  warnings: number;
} {
  const rejected = results.filter(r => r.status === 'rejected');
  const warnings = results.filter(r => r.status === 'warning');
  
  // Check for critical rejections
  const criticalRejections = rejected.filter(r => {
    // Check if it's a critical parameter based on all rule categories
    const allRules = {
      ...MICROBIOLOGICAL_LIMITS,
      ...HEAVY_METAL_LIMITS,
      ...PESTICIDE_MRLS,
      ...MYCOTOXIN_LIMITS
    };
    
    const rule = Object.values(allRules).find(
      rule => rule.parameter === r.parameter
    );
    
    return rule?.severity === 'critical';
  });

  if (criticalRejections.length > 0) {
    return {
      status: 'rejected',
      summary: `Product rejected due to ${criticalRejections.length} critical non-compliance(s)`,
      criticalIssues: rejected.length,
      warnings: warnings.length
    };
  }

  if (rejected.length > 0) {
    return {
      status: 'rejected',
      summary: `Product rejected due to ${rejected.length} non-compliance(s)`,
      criticalIssues: rejected.length,
      warnings: warnings.length
    };
  }

  if (warnings.length > 0) {
    return {
      status: 'conditional',
      summary: `Product conditionally approved with ${warnings.length} warning(s)`,
      criticalIssues: 0,
      warnings: warnings.length
    };
  }

  return {
    status: 'approved',
    summary: 'Product meets all regulatory requirements',
    criticalIssues: 0,
    warnings: 0
  };
}

/**
 * Generate detailed validation feedback messages
 */
export function generateValidationFeedback(results: ValidationResult[]): {
  microbiological: string[];
  chemical: string[];
  nutritional: string[];
  recommendations: string[];
} {
  const feedback = {
    microbiological: [] as string[],
    chemical: [] as string[],
    nutritional: [] as string[],
    recommendations: [] as string[]
  };

  results.forEach(result => {
    const message = `${result.parameter}: ${result.message}`;
    
    // Categorize feedback
    if (result.parameter.toLowerCase().includes('coliform') ||
        result.parameter.toLowerCase().includes('salmonella') ||
        result.parameter.toLowerCase().includes('listeria') ||
        result.parameter.toLowerCase().includes('staphylococcus') ||
        result.parameter.toLowerCase().includes('escherichia') ||
        result.parameter.toLowerCase().includes('bacillus') ||
        result.parameter.toLowerCase().includes('clostridium') ||
        result.parameter.toLowerCase().includes('yeast') ||
        result.parameter.toLowerCase().includes('mold') ||
        result.parameter.toLowerCase().includes('mesophile')) {
      feedback.microbiological.push(message);
    } else if (result.parameter.toLowerCase().includes('lead') ||
               result.parameter.toLowerCase().includes('cadmium') ||
               result.parameter.toLowerCase().includes('mercury') ||
               result.parameter.toLowerCase().includes('arsenic') ||
               result.parameter.toLowerCase().includes('aflatoxin') ||
               result.parameter.toLowerCase().includes('ochratoxin') ||
               result.parameter.toLowerCase().includes('mycotoxin') ||
               result.parameter.toLowerCase().includes('pesticide')) {
      feedback.chemical.push(message);
    } else {
      feedback.nutritional.push(message);
    }

    // Generate recommendations for issues
    if (result.status === 'rejected' || result.status === 'warning') {
      if (result.parameter.toLowerCase().includes('coliform')) {
        feedback.recommendations.push(
          'Review hygiene practices and implement stricter sanitation protocols'
        );
      } else if (result.parameter.toLowerCase().includes('aflatoxin')) {
        feedback.recommendations.push(
          'Improve storage conditions to prevent fungal growth and mycotoxin production'
        );
      } else if (result.parameter.toLowerCase().includes('lead') || 
                 result.parameter.toLowerCase().includes('heavy')) {
        feedback.recommendations.push(
          'Investigate raw material sources and processing equipment for contamination'
        );
      }
    }
  });

  // Remove duplicate recommendations
  feedback.recommendations = [...new Set(feedback.recommendations)];

  return feedback;
}

/**
 * Validate a complete product analysis report
 */
export interface ProductAnalysis {
  microbiological?: Array<{ parameter: string; value: number; unit: string }>;
  heavyMetals?: Array<{ parameter: string; value: number; unit: string }>;
  pesticides?: Array<{ parameter: string; value: number; unit: string }>;
  mycotoxins?: Array<{ parameter: string; value: number; unit: string }>;
  nutritional?: Array<{ 
    parameter: string; 
    declaredValue: number; 
    actualValue: number; 
    unit: string 
  }>;
}

export function validateProductAnalysis(analysis: ProductAnalysis): {
  results: ValidationResult[];
  overallStatus: ReturnType<typeof calculateOverallStatus>;
  feedback: ReturnType<typeof generateValidationFeedback>;
} {
  const results: ValidationResult[] = [];

  // Validate microbiological parameters
  if (analysis.microbiological) {
    analysis.microbiological.forEach(item => {
      results.push(validateMicrobiological(item.parameter, item.value, item.unit));
    });
  }

  // Validate heavy metals
  if (analysis.heavyMetals) {
    analysis.heavyMetals.forEach(item => {
      results.push(validateChemical(item.parameter, item.value, item.unit, 'heavy_metal'));
    });
  }

  // Validate pesticides
  if (analysis.pesticides) {
    analysis.pesticides.forEach(item => {
      results.push(validateChemical(item.parameter, item.value, item.unit, 'pesticide'));
    });
  }

  // Validate mycotoxins
  if (analysis.mycotoxins) {
    analysis.mycotoxins.forEach(item => {
      results.push(validateChemical(item.parameter, item.value, item.unit, 'mycotoxin'));
    });
  }

  // Validate nutritional data
  if (analysis.nutritional) {
    analysis.nutritional.forEach(item => {
      results.push(validateNutritional(
        item.parameter, 
        item.declaredValue, 
        item.actualValue, 
        item.unit
      ));
    });
  }

  const overallStatus = calculateOverallStatus(results);
  const feedback = generateValidationFeedback(results);

  return {
    results,
    overallStatus,
    feedback
  };
}

// Export all limits for reference
export const ALL_VALIDATION_RULES = {
  microbiological: MICROBIOLOGICAL_LIMITS,
  heavyMetals: HEAVY_METAL_LIMITS,
  pesticides: PESTICIDE_MRLS,
  mycotoxins: MYCOTOXIN_LIMITS,
  nutritional: NUTRITIONAL_TOLERANCES
};