import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../server/src/utils/logger';
import crypto from '../server/src/utils/crypto';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Validation result types
interface ValidationError {
  table: string;
  recordId: string;
  field?: string;
  error: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  success: boolean;
  tablesValidated: number;
  recordsValidated: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

// Table validation functions
async function validateUsers(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  try {
    const users = await prisma.user.findMany({
      include: {
        brands: true,
        laboratories: true,
        consents: true
      }
    });

    for (const user of users) {
      // Check email format
      if (!z.string().email().safeParse(user.email).success) {
        errors.push({
          table: 'users',
          recordId: user.id,
          field: 'email',
          error: 'Invalid email format',
          severity: 'error'
        });
      }

      // Check encrypted fields
      try {
        const decryptedName = crypto.decryptField(user.name);
        if (!decryptedName || decryptedName.length === 0) {
          errors.push({
            table: 'users',
            recordId: user.id,
            field: 'name',
            error: 'Name decryption failed or empty',
            severity: 'error'
          });
        }
      } catch (error) {
        errors.push({
          table: 'users',
          recordId: user.id,
          field: 'name',
          error: 'Name decryption error',
          severity: 'error'
        });
      }

      // Check role consistency
      if (user.role === 'BRAND' && user.brands.length === 0) {
        errors.push({
          table: 'users',
          recordId: user.id,
          error: 'Brand user without associated brands',
          severity: 'warning'
        });
      }

      if (user.role === 'LABORATORY' && user.laboratories.length === 0) {
        errors.push({
          table: 'users',
          recordId: user.id,
          error: 'Laboratory user without associated laboratories',
          severity: 'warning'
        });
      }

      // Check LGPD compliance
      if (!user.deletedAt && user.consents.length === 0) {
        errors.push({
          table: 'users',
          recordId: user.id,
          error: 'Active user without consent records',
          severity: 'warning'
        });
      }
    }

    logger.info(`Validated ${users.length} users`);
  } catch (error) {
    logger.error('Error validating users:', error);
    errors.push({
      table: 'users',
      recordId: 'N/A',
      error: 'Table validation failed',
      severity: 'error'
    });
  }

  return errors;
}

async function validateBrands(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  try {
    const brands = await prisma.brand.findMany({
      include: {
        users: true,
        products: true
      }
    });

    for (const brand of brands) {
      // Check CNPJ format (Brazilian company ID)
      if (!brand.cnpj.match(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)) {
        errors.push({
          table: 'brands',
          recordId: brand.id,
          field: 'cnpj',
          error: 'Invalid CNPJ format',
          severity: 'error'
        });
      }

      // Check brand has at least one user
      if (brand.users.length === 0) {
        errors.push({
          table: 'brands',
          recordId: brand.id,
          error: 'Brand without associated users',
          severity: 'error'
        });
      }

      // Check website URL if provided
      if (brand.website && !z.string().url().safeParse(brand.website).success) {
        errors.push({
          table: 'brands',
          recordId: brand.id,
          field: 'website',
          error: 'Invalid website URL',
          severity: 'warning'
        });
      }

      // Check logo file exists if specified
      if (brand.logo) {
        const logoPath = path.join(process.cwd(), 'server', brand.logo);
        try {
          await fs.access(logoPath);
        } catch {
          errors.push({
            table: 'brands',
            recordId: brand.id,
            field: 'logo',
            error: 'Logo file not found',
            severity: 'warning'
          });
        }
      }
    }

    logger.info(`Validated ${brands.length} brands`);
  } catch (error) {
    logger.error('Error validating brands:', error);
    errors.push({
      table: 'brands',
      recordId: 'N/A',
      error: 'Table validation failed',
      severity: 'error'
    });
  }

  return errors;
}

async function validateProducts(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  try {
    const products = await prisma.product.findMany({
      include: {
        brand: true,
        validations: true,
        qrCode: true
      }
    });

    for (const product of products) {
      // Check SKU format
      if (!product.sku || product.sku.length < 3) {
        errors.push({
          table: 'products',
          recordId: product.id,
          field: 'sku',
          error: 'Invalid or missing SKU',
          severity: 'error'
        });
      }

      // Check barcode format if provided
      if (product.barcode && !product.barcode.match(/^\d{8,14}$/)) {
        errors.push({
          table: 'products',
          recordId: product.id,
          field: 'barcode',
          error: 'Invalid barcode format',
          severity: 'warning'
        });
      }

      // Check product has brand
      if (!product.brand) {
        errors.push({
          table: 'products',
          recordId: product.id,
          error: 'Product without associated brand',
          severity: 'error'
        });
      }

      // Check status consistency
      if (product.status === 'VALIDATED' && product.validations.length === 0) {
        errors.push({
          table: 'products',
          recordId: product.id,
          error: 'Validated product without validation records',
          severity: 'error'
        });
      }

      // Check QR code for published products
      if (product.status === 'PUBLISHED' && !product.qrCode) {
        errors.push({
          table: 'products',
          recordId: product.id,
          error: 'Published product without QR code',
          severity: 'error'
        });
      }

      // Validate claims array
      if (product.claims && !Array.isArray(product.claims)) {
        errors.push({
          table: 'products',
          recordId: product.id,
          field: 'claims',
          error: 'Claims must be an array',
          severity: 'error'
        });
      }
    }

    logger.info(`Validated ${products.length} products`);
  } catch (error) {
    logger.error('Error validating products:', error);
    errors.push({
      table: 'products',
      recordId: 'N/A',
      error: 'Table validation failed',
      severity: 'error'
    });
  }

  return errors;
}

async function validateLaboratories(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  try {
    const laboratories = await prisma.laboratory.findMany({
      include: {
        users: true,
        reports: true
      }
    });

    for (const lab of laboratories) {
      // Check CNPJ format
      if (!lab.cnpj.match(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)) {
        errors.push({
          table: 'laboratories',
          recordId: lab.id,
          field: 'cnpj',
          error: 'Invalid CNPJ format',
          severity: 'error'
        });
      }

      // Check accreditation number format
      if (!lab.accreditationNumber || lab.accreditationNumber.length < 5) {
        errors.push({
          table: 'laboratories',
          recordId: lab.id,
          field: 'accreditationNumber',
          error: 'Invalid or missing accreditation number',
          severity: 'error'
        });
      }

      // Check lab has at least one user
      if (lab.users.length === 0) {
        errors.push({
          table: 'laboratories',
          recordId: lab.id,
          error: 'Laboratory without associated users',
          severity: 'error'
        });
      }

      // Check accreditation body
      const validBodies = ['INMETRO', 'ISO/IEC 17025', 'ANVISA'];
      if (!validBodies.includes(lab.accreditationBody)) {
        errors.push({
          table: 'laboratories',
          recordId: lab.id,
          field: 'accreditationBody',
          error: 'Invalid accreditation body',
          severity: 'warning'
        });
      }
    }

    logger.info(`Validated ${laboratories.length} laboratories`);
  } catch (error) {
    logger.error('Error validating laboratories:', error);
    errors.push({
      table: 'laboratories',
      recordId: 'N/A',
      error: 'Table validation failed',
      severity: 'error'
    });
  }

  return errors;
}

async function validateValidations(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  try {
    const validations = await prisma.validation.findMany({
      include: {
        product: true,
        analysisReport: true,
        validator: true,
        seals: true
      }
    });

    for (const validation of validations) {
      // Check validation has product
      if (!validation.product) {
        errors.push({
          table: 'validations',
          recordId: validation.id,
          error: 'Validation without associated product',
          severity: 'error'
        });
      }

      // Check validation has analysis report
      if (!validation.analysisReport) {
        errors.push({
          table: 'validations',
          recordId: validation.id,
          error: 'Validation without analysis report',
          severity: 'error'
        });
      }

      // Check approved validations have validator
      if (validation.status === 'APPROVED' && !validation.validatorId) {
        errors.push({
          table: 'validations',
          recordId: validation.id,
          error: 'Approved validation without validator',
          severity: 'error'
        });
      }

      // Check expiry date for approved validations
      if (validation.status === 'APPROVED' && validation.expiryDate) {
        if (new Date(validation.expiryDate) < new Date()) {
          errors.push({
            table: 'validations',
            recordId: validation.id,
            error: 'Expired validation still marked as approved',
            severity: 'warning'
          });
        }
      }

      // Check seal associations
      if (validation.seals.length === 0 && validation.status === 'APPROVED') {
        errors.push({
          table: 'validations',
          recordId: validation.id,
          error: 'Approved validation without seals',
          severity: 'warning'
        });
      }
    }

    logger.info(`Validated ${validations.length} validations`);
  } catch (error) {
    logger.error('Error validating validations:', error);
    errors.push({
      table: 'validations',
      recordId: 'N/A',
      error: 'Table validation failed',
      severity: 'error'
    });
  }

  return errors;
}

async function validateQRCodes(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  try {
    const qrCodes = await prisma.qRCode.findMany({
      include: {
        product: true,
        scans: true
      }
    });

    for (const qr of qrCodes) {
      // Check QR code format
      if (!qr.code || qr.code.length < 10) {
        errors.push({
          table: 'qr_codes',
          recordId: qr.id,
          field: 'code',
          error: 'Invalid QR code format',
          severity: 'error'
        });
      }

      // Check QR has associated product
      if (!qr.product) {
        errors.push({
          table: 'qr_codes',
          recordId: qr.id,
          error: 'QR code without associated product',
          severity: 'error'
        });
      }

      // Check uniqueness of code
      const duplicates = await prisma.qRCode.count({
        where: { code: qr.code }
      });
      
      if (duplicates > 1) {
        errors.push({
          table: 'qr_codes',
          recordId: qr.id,
          field: 'code',
          error: 'Duplicate QR code found',
          severity: 'error'
        });
      }

      // Check scan count consistency
      if (qr.scanCount !== qr.scans.length) {
        errors.push({
          table: 'qr_codes',
          recordId: qr.id,
          error: `Scan count mismatch: ${qr.scanCount} vs ${qr.scans.length} actual scans`,
          severity: 'warning'
        });
      }
    }

    logger.info(`Validated ${qrCodes.length} QR codes`);
  } catch (error) {
    logger.error('Error validating QR codes:', error);
    errors.push({
      table: 'qr_codes',
      recordId: 'N/A',
      error: 'Table validation failed',
      severity: 'error'
    });
  }

  return errors;
}

async function validateDataRelationships(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  try {
    // Check orphaned records
    const orphanedReports = await prisma.analysisReport.findMany({
      where: {
        validation: null
      }
    });

    for (const report of orphanedReports) {
      errors.push({
        table: 'analysis_reports',
        recordId: report.id,
        error: 'Orphaned analysis report without validation',
        severity: 'warning'
      });
    }

    // Check circular references
    const brands = await prisma.brand.findMany({
      include: {
        products: {
          include: {
            brand: true
          }
        }
      }
    });

    for (const brand of brands) {
      for (const product of brand.products) {
        if (product.brandId !== brand.id) {
          errors.push({
            table: 'products',
            recordId: product.id,
            error: 'Product brand reference mismatch',
            severity: 'error'
          });
        }
      }
    }

    logger.info('Validated data relationships');
  } catch (error) {
    logger.error('Error validating relationships:', error);
    errors.push({
      table: 'relationships',
      recordId: 'N/A',
      error: 'Relationship validation failed',
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Run complete data integrity validation
 */
export async function validateDataIntegrity(
  options: { 
    stopOnError?: boolean; 
    tables?: string[];
    outputFile?: string;
  } = {}
): Promise<ValidationResult> {
  const startTime = new Date();
  const allErrors: ValidationError[] = [];
  let tablesValidated = 0;
  let recordsValidated = 0;

  logger.info('Starting data integrity validation');

  // Define validation functions
  const validations: Record<string, () => Promise<ValidationError[]>> = {
    users: validateUsers,
    brands: validateBrands,
    products: validateProducts,
    laboratories: validateLaboratories,
    validations: validateValidations,
    qr_codes: validateQRCodes,
    relationships: validateDataRelationships
  };

  // Filter tables if specified
  const tablesToValidate = options.tables || Object.keys(validations);

  for (const table of tablesToValidate) {
    if (validations[table]) {
      try {
        logger.info(`Validating table: ${table}`);
        const errors = await validations[table]();
        allErrors.push(...errors);
        tablesValidated++;

        if (options.stopOnError && errors.some(e => e.severity === 'error')) {
          logger.error(`Critical errors found in ${table}, stopping validation`);
          break;
        }
      } catch (error) {
        logger.error(`Failed to validate ${table}:`, error);
        allErrors.push({
          table,
          recordId: 'N/A',
          error: 'Table validation failed',
          severity: 'error'
        });
      }
    }
  }

  // Count total records validated
  recordsValidated = await prisma.user.count() +
    await prisma.brand.count() +
    await prisma.product.count() +
    await prisma.laboratory.count() +
    await prisma.validation.count() +
    await prisma.qRCode.count();

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  const result: ValidationResult = {
    success: !allErrors.some(e => e.severity === 'error'),
    tablesValidated,
    recordsValidated,
    errors: allErrors.filter(e => e.severity === 'error'),
    warnings: allErrors.filter(e => e.severity === 'warning'),
    startTime,
    endTime,
    duration
  };

  // Generate report
  const report = generateValidationReport(result);
  
  if (options.outputFile) {
    await fs.writeFile(options.outputFile, report);
    logger.info(`Validation report saved to ${options.outputFile}`);
  } else {
    console.log(report);
  }

  return result;
}

/**
 * Generate validation report
 */
function generateValidationReport(result: ValidationResult): string {
  const report = [];
  
  report.push('# Data Integrity Validation Report');
  report.push(`Generated: ${result.endTime.toISOString()}`);
  report.push(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  report.push('');
  
  report.push('## Summary');
  report.push(`- Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  report.push(`- Tables Validated: ${result.tablesValidated}`);
  report.push(`- Records Validated: ${result.recordsValidated}`);
  report.push(`- Errors: ${result.errors.length}`);
  report.push(`- Warnings: ${result.warnings.length}`);
  report.push('');
  
  if (result.errors.length > 0) {
    report.push('## Errors');
    report.push('');
    
    // Group errors by table
    const errorsByTable = result.errors.reduce((acc, error) => {
      if (!acc[error.table]) acc[error.table] = [];
      acc[error.table].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);
    
    for (const [table, errors] of Object.entries(errorsByTable)) {
      report.push(`### ${table}`);
      errors.forEach(error => {
        report.push(`- **Record ${error.recordId}**: ${error.error}${error.field ? ` (field: ${error.field})` : ''}`);
      });
      report.push('');
    }
  }
  
  if (result.warnings.length > 0) {
    report.push('## Warnings');
    report.push('');
    
    // Group warnings by table
    const warningsByTable = result.warnings.reduce((acc, warning) => {
      if (!acc[warning.table]) acc[warning.table] = [];
      acc[warning.table].push(warning);
      return acc;
    }, {} as Record<string, ValidationError[]>);
    
    for (const [table, warnings] of Object.entries(warningsByTable)) {
      report.push(`### ${table}`);
      warnings.forEach(warning => {
        report.push(`- **Record ${warning.recordId}**: ${warning.error}${warning.field ? ` (field: ${warning.field})` : ''}`);
      });
      report.push('');
    }
  }
  
  if (result.success) {
    report.push('## ✅ Validation Passed');
    report.push('All critical data integrity checks passed successfully.');
  } else {
    report.push('## ❌ Validation Failed');
    report.push('Critical data integrity issues found. Please fix the errors before proceeding.');
  }
  
  return report.join('\n');
}

/**
 * Fix common data issues
 */
export async function fixDataIssues(dryRun: boolean = true): Promise<void> {
  logger.info(`Starting data fixes (dry run: ${dryRun})`);
  
  if (!dryRun) {
    // Fix scan count mismatches
    const qrCodes = await prisma.qRCode.findMany({
      include: { scans: true }
    });
    
    for (const qr of qrCodes) {
      const actualCount = qr.scans.length;
      if (qr.scanCount !== actualCount) {
        await prisma.qRCode.update({
          where: { id: qr.id },
          data: { scanCount: actualCount }
        });
        logger.info(`Fixed scan count for QR ${qr.id}: ${qr.scanCount} -> ${actualCount}`);
      }
    }
    
    // Create missing consent records for active users
    const usersWithoutConsent = await prisma.user.findMany({
      where: {
        deletedAt: null,
        consents: {
          none: {}
        }
      }
    });
    
    for (const user of usersWithoutConsent) {
      await prisma.consent.create({
        data: {
          userId: user.id,
          type: 'TERMS_OF_SERVICE',
          granted: true,
          ipAddress: 'migration'
        }
      });
      logger.info(`Created default consent for user ${user.id}`);
    }
  }
  
  logger.info('Data fixes completed');
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const options = {
    stopOnError: process.argv.includes('--stop-on-error'),
    dryRun: process.argv.includes('--dry-run'),
    outputFile: process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1]
  };
  
  (async () => {
    try {
      switch (command) {
        case 'validate':
          await validateDataIntegrity(options);
          break;
          
        case 'fix':
          await fixDataIssues(options.dryRun);
          break;
          
        default:
          console.log('Usage: ts-node validate-data.ts <command> [options]');
          console.log('Commands:');
          console.log('  validate    Run data integrity validation');
          console.log('  fix         Fix common data issues');
          console.log('Options:');
          console.log('  --stop-on-error    Stop validation on first error');
          console.log('  --dry-run          Show what would be fixed without making changes');
          console.log('  --output=file      Save validation report to file');
          process.exit(1);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}