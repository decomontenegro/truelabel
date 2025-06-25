/**
 * Tests and usage examples for the Validation Rules Engine
 */

import {
  validateMicrobiological,
  validateChemical,
  validateNutritional,
  validateProductAnalysis,
  ProductAnalysis
} from './validationRules';

// Example 1: Microbiological validation
console.log('=== Microbiological Validation Examples ===');

// Test case: E. coli within limits
const ecoliResult = validateMicrobiological('Escherichia coli', 5, 'CFU/g');
console.log('E. coli (5 CFU/g):', ecoliResult);
// Expected: { status: 'warning', message: 'Above warning threshold...' }

// Test case: Salmonella absent
const salmonellaResult = validateMicrobiological('Salmonella sp.', 0, 'in 25g');
console.log('Salmonella (absent):', salmonellaResult);
// Expected: { status: 'approved', message: 'Absent (compliant)' }

// Test case: Total coliforms exceeding limit
const coliformResult = validateMicrobiological('Total Coliforms', 1500, 'CFU/g');
console.log('Total Coliforms (1500 CFU/g):', coliformResult);
// Expected: { status: 'rejected', message: 'Exceeds maximum limit...' }

// Example 2: Heavy metals validation
console.log('\n=== Heavy Metal Validation Examples ===');

// Test case: Lead within limits
const leadResult = validateChemical('Lead (Pb)', 0.3, 'mg/kg', 'heavy_metal');
console.log('Lead (0.3 mg/kg):', leadResult);
// Expected: { status: 'approved', message: 'Within acceptable limits' }

// Test case: Cadmium at warning level
const cadmiumResult = validateChemical('Cadmium (Cd)', 0.09, 'mg/kg', 'heavy_metal');
console.log('Cadmium (0.09 mg/kg):', cadmiumResult);
// Expected: { status: 'warning', message: 'Above warning threshold...' }

// Example 3: Mycotoxin validation
console.log('\n=== Mycotoxin Validation Examples ===');

// Test case: Aflatoxin B1 exceeding limit
const aflatoxinResult = validateChemical('Aflatoxin B1', 7, 'μg/kg', 'mycotoxin');
console.log('Aflatoxin B1 (7 μg/kg):', aflatoxinResult);
// Expected: { status: 'rejected', message: 'Exceeds maximum limit...' }

// Example 4: Nutritional validation
console.log('\n=== Nutritional Validation Examples ===');

// Test case: Protein within tolerance
const proteinResult = validateNutritional('Protein', 10, 9.5, 'g');
console.log('Protein (declared: 10g, actual: 9.5g):', proteinResult);
// Expected: { status: 'approved', message: 'Within tolerance range...' }

// Test case: Sodium exceeding tolerance
const sodiumResult = validateNutritional('Sodium', 100, 125, 'mg');
console.log('Sodium (declared: 100mg, actual: 125mg):', sodiumResult);
// Expected: { status: 'rejected', message: 'Above maximum tolerance...' }

// Test case: Vitamin C (micronutrient) with low value tolerance
const vitaminCResult = validateNutritional('Vitamin C', 50, 30, 'mg');
console.log('Vitamin C (declared: 50mg, actual: 30mg):', vitaminCResult);
// Expected: { status: 'approved', message: 'Within tolerance range...' } (45% tolerance)

// Example 5: Complete product analysis
console.log('\n=== Complete Product Analysis Example ===');

const productAnalysis: ProductAnalysis = {
  microbiological: [
    { parameter: 'Total Coliforms', value: 800, unit: 'CFU/g' },
    { parameter: 'Escherichia coli', value: 8, unit: 'CFU/g' },
    { parameter: 'Salmonella sp.', value: 0, unit: 'in 25g' },
    { parameter: 'Yeasts and Molds', value: 3000, unit: 'CFU/g' }
  ],
  heavyMetals: [
    { parameter: 'Lead (Pb)', value: 0.45, unit: 'mg/kg' },
    { parameter: 'Cadmium (Cd)', value: 0.05, unit: 'mg/kg' },
    { parameter: 'Mercury (Hg)', value: 0.02, unit: 'mg/kg' }
  ],
  mycotoxins: [
    { parameter: 'Total Aflatoxins (B1+B2+G1+G2)', value: 18, unit: 'μg/kg' },
    { parameter: 'Ochratoxin A', value: 5, unit: 'μg/kg' }
  ],
  nutritional: [
    { parameter: 'Protein', declaredValue: 25, actualValue: 24, unit: 'g' },
    { parameter: 'Total Fat', declaredValue: 10, actualValue: 11, unit: 'g' },
    { parameter: 'Sodium', declaredValue: 500, actualValue: 550, unit: 'mg' },
    { parameter: 'Iron', declaredValue: 15, actualValue: 14, unit: 'mg' }
  ]
};

const validationReport = validateProductAnalysis(productAnalysis);

console.log('\nValidation Results Summary:');
console.log('Overall Status:', validationReport.overallStatus);
console.log('\nDetailed Results:');
validationReport.results.forEach(result => {
  console.log(`- ${result.parameter}: ${result.status.toUpperCase()} - ${result.message}`);
});

console.log('\nFeedback by Category:');
console.log('Microbiological:', validationReport.feedback.microbiological);
console.log('Chemical:', validationReport.feedback.chemical);
console.log('Nutritional:', validationReport.feedback.nutritional);
console.log('\nRecommendations:', validationReport.feedback.recommendations);

// Example 6: Using validation for decision making
console.log('\n=== Decision Making Example ===');

const { status, summary, criticalIssues, warnings } = validationReport.overallStatus;

if (status === 'approved') {
  console.log('✅ Product approved for release');
} else if (status === 'conditional') {
  console.log('⚠️ Product requires review before release');
  console.log(`   Found ${warnings} warning(s) that need attention`);
} else {
  console.log('❌ Product rejected - cannot be released');
  console.log(`   Found ${criticalIssues} critical issue(s)`);
  
  // Check for specific critical parameters
  const criticalParams = validationReport.results
    .filter(r => r.status === 'rejected')
    .map(r => r.parameter);
  
  console.log('   Critical parameters:', criticalParams.join(', '));
}

// Export test data for use in other components
export const sampleValidationData = {
  passedAnalysis: {
    microbiological: [
      { parameter: 'Total Coliforms', value: 100, unit: 'CFU/g' },
      { parameter: 'Escherichia coli', value: 5, unit: 'CFU/g' },
      { parameter: 'Salmonella sp.', value: 0, unit: 'in 25g' }
    ],
    heavyMetals: [
      { parameter: 'Lead (Pb)', value: 0.2, unit: 'mg/kg' },
      { parameter: 'Cadmium (Cd)', value: 0.05, unit: 'mg/kg' }
    ],
    nutritional: [
      { parameter: 'Protein', declaredValue: 20, actualValue: 19.5, unit: 'g' },
      { parameter: 'Sodium', declaredValue: 300, actualValue: 320, unit: 'mg' }
    ]
  },
  
  failedAnalysis: {
    microbiological: [
      { parameter: 'Salmonella sp.', value: 1, unit: 'in 25g' }, // Critical failure
      { parameter: 'Total Coliforms', value: 2000, unit: 'CFU/g' }
    ],
    heavyMetals: [
      { parameter: 'Lead (Pb)', value: 0.8, unit: 'mg/kg' }, // Exceeds limit
      { parameter: 'Mercury (Hg)', value: 0.1, unit: 'mg/kg' }
    ],
    mycotoxins: [
      { parameter: 'Aflatoxin B1', value: 10, unit: 'μg/kg' } // Critical toxin
    ]
  },
  
  warningAnalysis: {
    microbiological: [
      { parameter: 'Total Coliforms', value: 600, unit: 'CFU/g' }, // Warning level
      { parameter: 'Yeasts and Molds', value: 7000, unit: 'CFU/g' }
    ],
    heavyMetals: [
      { parameter: 'Lead (Pb)', value: 0.42, unit: 'mg/kg' } // Warning threshold
    ]
  }
};