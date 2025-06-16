import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { logger } from '../server/src/utils/logger';
import crypto from '../server/src/utils/crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'BRAND', 'LABORATORY', 'VALIDATOR']),
  phone: z.string().optional(),
  cpf: z.string().optional()
});

const BrandSchema = z.object({
  name: z.string(),
  cnpj: z.string(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  userEmail: z.string().email()
});

const ProductSchema = z.object({
  name: z.string(),
  sku: z.string(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  brandName: z.string(),
  category: z.string(),
  claims: z.string().optional()
});

// Import options
interface ImportOptions {
  batchSize?: number;
  dryRun?: boolean;
  validateOnly?: boolean;
  continueOnError?: boolean;
}

// Import results
interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: any[];
  duration: number;
}

/**
 * Import users from CSV
 */
export async function importUsers(
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const startTime = Date.now();
  const { batchSize = 100, dryRun = false, validateOnly = false, continueOnError = false } = options;
  
  const result: ImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    duration: 0
  };

  try {
    const records: any[] = [];
    
    // Parse CSV
    await new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (data) => records.push(data))
        .on('error', reject)
        .on('end', resolve);
    });

    logger.info(`Found ${records.length} users to import`);

    // Validate all records first
    const validRecords: any[] = [];
    for (const [index, record] of records.entries()) {
      try {
        const validated = UserSchema.parse(record);
        validRecords.push({ ...validated, originalIndex: index });
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: index + 2,
          data: record,
          error: error instanceof Error ? error.message : 'Validation failed'
        });
        
        if (!continueOnError) {
          throw new Error(`Validation failed at row ${index + 2}`);
        }
      }
    }

    if (validateOnly) {
      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      return result;
    }

    // Import in batches
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          for (const user of batch) {
            try {
              // Check if user exists
              const existing = await tx.user.findUnique({
                where: { email: user.email }
              });

              if (existing) {
                logger.warn(`User ${user.email} already exists, skipping`);
                continue;
              }

              // Hash password if provided
              const hashedPassword = user.password 
                ? await crypto.hashPassword(user.password)
                : await crypto.hashPassword(crypto.generateSecureToken(16));

              // Encrypt PII
              const encryptedData = {
                ...user,
                name: crypto.encryptField(user.name),
                phone: user.phone ? crypto.encryptField(user.phone) : null,
                cpf: user.cpf ? crypto.encryptField(user.cpf) : null,
                password: hashedPassword
              };

              // Create user
              await tx.user.create({
                data: {
                  email: encryptedData.email,
                  name: encryptedData.name,
                  password: encryptedData.password,
                  role: encryptedData.role,
                  phone: encryptedData.phone,
                  cpf: encryptedData.cpf,
                  active: true
                }
              });

              result.imported++;
            } catch (error) {
              result.failed++;
              result.errors.push({
                row: user.originalIndex + 2,
                data: user,
                error: error instanceof Error ? error.message : 'Import failed'
              });

              if (!continueOnError) {
                throw error;
              }
            }
          }
        });
      } else {
        // Dry run - just count
        result.imported += batch.length;
      }

      logger.info(`Processed ${i + batch.length} of ${validRecords.length} users`);
    }

    result.success = result.failed === 0;
  } catch (error) {
    logger.error('User import failed:', error);
    result.success = false;
    if (result.errors.length === 0) {
      result.errors.push({
        general: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Import brands from CSV
 */
export async function importBrands(
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const startTime = Date.now();
  const { batchSize = 50, dryRun = false, validateOnly = false, continueOnError = false } = options;
  
  const result: ImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    duration: 0
  };

  try {
    const records: any[] = [];
    
    // Parse CSV
    await new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (data) => records.push(data))
        .on('error', reject)
        .on('end', resolve);
    });

    logger.info(`Found ${records.length} brands to import`);

    // Validate all records
    const validRecords: any[] = [];
    for (const [index, record] of records.entries()) {
      try {
        const validated = BrandSchema.parse(record);
        validRecords.push({ ...validated, originalIndex: index });
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: index + 2,
          data: record,
          error: error instanceof Error ? error.message : 'Validation failed'
        });
        
        if (!continueOnError) {
          throw new Error(`Validation failed at row ${index + 2}`);
        }
      }
    }

    if (validateOnly) {
      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      return result;
    }

    // Import in batches
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          for (const brand of batch) {
            try {
              // Find user
              const user = await tx.user.findUnique({
                where: { email: brand.userEmail }
              });

              if (!user) {
                throw new Error(`User ${brand.userEmail} not found`);
              }

              // Check if brand exists
              const existing = await tx.brand.findUnique({
                where: { cnpj: brand.cnpj }
              });

              if (existing) {
                logger.warn(`Brand ${brand.name} (${brand.cnpj}) already exists, skipping`);
                continue;
              }

              // Create brand
              await tx.brand.create({
                data: {
                  name: brand.name,
                  cnpj: brand.cnpj,
                  description: brand.description,
                  website: brand.website,
                  logo: brand.logo,
                  active: true,
                  users: {
                    connect: { id: user.id }
                  }
                }
              });

              result.imported++;
            } catch (error) {
              result.failed++;
              result.errors.push({
                row: brand.originalIndex + 2,
                data: brand,
                error: error instanceof Error ? error.message : 'Import failed'
              });

              if (!continueOnError) {
                throw error;
              }
            }
          }
        });
      } else {
        result.imported += batch.length;
      }

      logger.info(`Processed ${i + batch.length} of ${validRecords.length} brands`);
    }

    result.success = result.failed === 0;
  } catch (error) {
    logger.error('Brand import failed:', error);
    result.success = false;
    if (result.errors.length === 0) {
      result.errors.push({
        general: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Import products from CSV
 */
export async function importProducts(
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const startTime = Date.now();
  const { batchSize = 100, dryRun = false, validateOnly = false, continueOnError = false } = options;
  
  const result: ImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    duration: 0
  };

  try {
    const records: any[] = [];
    
    // Parse CSV
    await new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (data) => records.push(data))
        .on('error', reject)
        .on('end', resolve);
    });

    logger.info(`Found ${records.length} products to import`);

    // Validate all records
    const validRecords: any[] = [];
    for (const [index, record] of records.entries()) {
      try {
        const validated = ProductSchema.parse(record);
        validRecords.push({ ...validated, originalIndex: index });
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: index + 2,
          data: record,
          error: error instanceof Error ? error.message : 'Validation failed'
        });
        
        if (!continueOnError) {
          throw new Error(`Validation failed at row ${index + 2}`);
        }
      }
    }

    if (validateOnly) {
      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      return result;
    }

    // Import in batches
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          for (const product of batch) {
            try {
              // Find brand
              const brand = await tx.brand.findFirst({
                where: { name: product.brandName }
              });

              if (!brand) {
                throw new Error(`Brand ${product.brandName} not found`);
              }

              // Check if product exists
              const existing = await tx.product.findFirst({
                where: {
                  sku: product.sku,
                  brandId: brand.id
                }
              });

              if (existing) {
                logger.warn(`Product ${product.name} (${product.sku}) already exists, skipping`);
                continue;
              }

              // Parse claims
              const claims = product.claims ? product.claims.split(',').map((c: string) => c.trim()) : [];

              // Create product
              await tx.product.create({
                data: {
                  name: product.name,
                  sku: product.sku,
                  barcode: product.barcode,
                  description: product.description,
                  category: product.category,
                  claims,
                  brandId: brand.id,
                  status: 'DRAFT'
                }
              });

              result.imported++;
            } catch (error) {
              result.failed++;
              result.errors.push({
                row: product.originalIndex + 2,
                data: product,
                error: error instanceof Error ? error.message : 'Import failed'
              });

              if (!continueOnError) {
                throw error;
              }
            }
          }
        });
      } else {
        result.imported += batch.length;
      }

      logger.info(`Processed ${i + batch.length} of ${validRecords.length} products`);
    }

    result.success = result.failed === 0;
  } catch (error) {
    logger.error('Product import failed:', error);
    result.success = false;
    if (result.errors.length === 0) {
      result.errors.push({
        general: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Generate import report
 */
export async function generateImportReport(results: Record<string, ImportResult>): Promise<string> {
  const report = [];
  
  report.push('# Data Import Report');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');
  
  for (const [type, result] of Object.entries(results)) {
    report.push(`## ${type} Import`);
    report.push(`- Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    report.push(`- Imported: ${result.imported}`);
    report.push(`- Failed: ${result.failed}`);
    report.push(`- Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.errors.length > 0) {
      report.push('');
      report.push('### Errors:');
      result.errors.slice(0, 10).forEach(error => {
        report.push(`- Row ${error.row || 'N/A'}: ${error.error}`);
      });
      
      if (result.errors.length > 10) {
        report.push(`- ... and ${result.errors.length - 10} more errors`);
      }
    }
    
    report.push('');
  }
  
  const reportPath = path.join(process.cwd(), `import-report-${Date.now()}.md`);
  await fs.writeFile(reportPath, report.join('\n'));
  
  return reportPath;
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const filePath = process.argv[3];
  
  if (!command || !filePath) {
    console.log('Usage: ts-node import-data.ts <command> <file>');
    console.log('Commands: users, brands, products, all');
    process.exit(1);
  }
  
  (async () => {
    try {
      const options: ImportOptions = {
        batchSize: 100,
        dryRun: process.argv.includes('--dry-run'),
        validateOnly: process.argv.includes('--validate'),
        continueOnError: process.argv.includes('--continue')
      };
      
      const results: Record<string, ImportResult> = {};
      
      switch (command) {
        case 'users':
          results.Users = await importUsers(filePath, options);
          break;
          
        case 'brands':
          results.Brands = await importBrands(filePath, options);
          break;
          
        case 'products':
          results.Products = await importProducts(filePath, options);
          break;
          
        case 'all':
          // Import in order: users -> brands -> products
          const basePath = path.dirname(filePath);
          results.Users = await importUsers(path.join(basePath, 'users.csv'), options);
          results.Brands = await importBrands(path.join(basePath, 'brands.csv'), options);
          results.Products = await importProducts(path.join(basePath, 'products.csv'), options);
          break;
          
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
      
      // Generate report
      const reportPath = await generateImportReport(results);
      console.log(`Import completed. Report saved to: ${reportPath}`);
      
      // Exit with error if any imports failed
      const allSuccess = Object.values(results).every(r => r.success);
      process.exit(allSuccess ? 0 : 1);
      
    } catch (error) {
      console.error('Import failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}