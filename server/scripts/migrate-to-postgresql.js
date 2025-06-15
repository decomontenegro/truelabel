/**
 * Database Migration Script: SQLite to PostgreSQL
 * 
 * Purpose: Migrate existing SQLite data to PostgreSQL for production
 * Dependencies: Prisma Client, fs, path
 * 
 * Usage: npm run migrate:postgresql
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Create two Prisma clients - one for SQLite (source) and one for PostgreSQL (target)
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

const postgresClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://truelabel_user:secure_password@localhost:5432/truelabel_prod?schema=public'
    }
  }
});

/**
 * Migration utility functions
 */
const migrationUtils = {
  /**
   * Log migration progress
   */
  log: (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
  },

  /**
   * Validate data integrity
   */
  validateData: async (tableName, sqliteCount, postgresCount) => {
    if (sqliteCount === postgresCount) {
      migrationUtils.log(`${tableName}: ${postgresCount} records migrated successfully`, 'success');
      return true;
    } else {
      migrationUtils.log(`${tableName}: Data mismatch! SQLite: ${sqliteCount}, PostgreSQL: ${postgresCount}`, 'error');
      return false;
    }
  },

  /**
   * Transform string enums to match PostgreSQL
   */
  transformEnums: (data, enumMappings) => {
    const transformed = { ...data };
    
    Object.keys(enumMappings).forEach(field => {
      if (transformed[field] && enumMappings[field][transformed[field]]) {
        transformed[field] = enumMappings[field][transformed[field]];
      }
    });
    
    return transformed;
  }
};

/**
 * Migration steps
 */
const migrationSteps = {
  /**
   * Step 1: Migrate Users
   */
  migrateUsers: async () => {
    migrationUtils.log('Starting Users migration...');
    
    try {
      const users = await sqliteClient.user.findMany();
      migrationUtils.log(`Found ${users.length} users to migrate`);
      
      for (const user of users) {
        await postgresClient.user.create({
          data: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
      }
      
      const postgresCount = await postgresClient.user.count();
      return migrationUtils.validateData('Users', users.length, postgresCount);
    } catch (error) {
      migrationUtils.log(`Users migration failed: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Step 2: Migrate Laboratories
   */
  migrateLaboratories: async () => {
    migrationUtils.log('Starting Laboratories migration...');
    
    try {
      const laboratories = await sqliteClient.laboratory.findMany();
      migrationUtils.log(`Found ${laboratories.length} laboratories to migrate`);
      
      for (const lab of laboratories) {
        await postgresClient.laboratory.create({
          data: {
            id: lab.id,
            name: lab.name,
            accreditation: lab.accreditation,
            email: lab.email,
            phone: lab.phone,
            address: lab.address,
            isActive: lab.isActive,
            createdAt: lab.createdAt,
            updatedAt: lab.updatedAt
          }
        });
      }
      
      const postgresCount = await postgresClient.laboratory.count();
      return migrationUtils.validateData('Laboratories', laboratories.length, postgresCount);
    } catch (error) {
      migrationUtils.log(`Laboratories migration failed: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Step 3: Migrate Products
   */
  migrateProducts: async () => {
    migrationUtils.log('Starting Products migration...');
    
    try {
      const products = await sqliteClient.product.findMany();
      migrationUtils.log(`Found ${products.length} products to migrate`);
      
      for (const product of products) {
        await postgresClient.product.create({
          data: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            description: product.description,
            sku: product.sku,
            batchNumber: product.batchNumber,
            nutritionalInfo: product.nutritionalInfo,
            claims: product.claims,
            imageUrl: product.imageUrl,
            qrCode: product.qrCode,
            status: product.status,
            userId: product.userId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          }
        });
      }
      
      const postgresCount = await postgresClient.product.count();
      return migrationUtils.validateData('Products', products.length, postgresCount);
    } catch (error) {
      migrationUtils.log(`Products migration failed: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Step 4: Migrate Reports
   */
  migrateReports: async () => {
    migrationUtils.log('Starting Reports migration...');
    
    try {
      const reports = await sqliteClient.report.findMany();
      migrationUtils.log(`Found ${reports.length} reports to migrate`);
      
      for (const report of reports) {
        await postgresClient.report.create({
          data: {
            id: report.id,
            fileName: report.fileName,
            originalName: report.originalName,
            filePath: report.filePath,
            fileSize: report.fileSize,
            mimeType: report.mimeType,
            analysisType: report.analysisType,
            results: report.results,
            isVerified: report.isVerified,
            verificationHash: report.verificationHash,
            productId: report.productId,
            laboratoryId: report.laboratoryId,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
          }
        });
      }
      
      const postgresCount = await postgresClient.report.count();
      return migrationUtils.validateData('Reports', reports.length, postgresCount);
    } catch (error) {
      migrationUtils.log(`Reports migration failed: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Step 5: Migrate Validations
   */
  migrateValidations: async () => {
    migrationUtils.log('Starting Validations migration...');
    
    try {
      const validations = await sqliteClient.validation.findMany();
      migrationUtils.log(`Found ${validations.length} validations to migrate`);
      
      for (const validation of validations) {
        await postgresClient.validation.create({
          data: {
            id: validation.id,
            status: validation.status,
            type: validation.type,
            claimsValidated: validation.claimsValidated,
            summary: validation.summary,
            notes: validation.notes,
            validatedAt: validation.validatedAt,
            productId: validation.productId,
            reportId: validation.reportId,
            userId: validation.userId,
            createdAt: validation.createdAt,
            updatedAt: validation.updatedAt
          }
        });
      }
      
      const postgresCount = await postgresClient.validation.count();
      return migrationUtils.validateData('Validations', validations.length, postgresCount);
    } catch (error) {
      migrationUtils.log(`Validations migration failed: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Step 6: Migrate Product Seals
   */
  migrateProductSeals: async () => {
    migrationUtils.log('Starting Product Seals migration...');
    
    try {
      const seals = await sqliteClient.productSeal.findMany();
      migrationUtils.log(`Found ${seals.length} product seals to migrate`);
      
      for (const seal of seals) {
        await postgresClient.productSeal.create({
          data: {
            id: seal.id,
            productId: seal.productId,
            sealId: seal.sealId,
            certificateNumber: seal.certificateNumber,
            issuedDate: seal.issuedDate,
            expiryDate: seal.expiryDate,
            validatingLaboratory: seal.validatingLaboratory,
            documentUrl: seal.documentUrl,
            status: seal.status,
            verifiedBy: seal.verifiedBy,
            verifiedAt: seal.verifiedAt,
            notes: seal.notes,
            createdAt: seal.createdAt,
            updatedAt: seal.updatedAt
          }
        });
      }
      
      const postgresCount = await postgresClient.productSeal.count();
      return migrationUtils.validateData('Product Seals', seals.length, postgresCount);
    } catch (error) {
      migrationUtils.log(`Product Seals migration failed: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Step 7: Migrate QR Code Access logs
   */
  migrateQRCodeAccess: async () => {
    migrationUtils.log('Starting QR Code Access migration...');
    
    try {
      const accesses = await sqliteClient.qRCodeAccess.findMany();
      migrationUtils.log(`Found ${accesses.length} QR code access records to migrate`);
      
      for (const access of accesses) {
        await postgresClient.qRCodeAccess.create({
          data: {
            id: access.id,
            qrCode: access.qrCode,
            ipAddress: access.ipAddress,
            userAgent: access.userAgent,
            location: access.location,
            accessedAt: access.accessedAt
          }
        });
      }
      
      const postgresCount = await postgresClient.qRCodeAccess.count();
      return migrationUtils.validateData('QR Code Access', accesses.length, postgresCount);
    } catch (error) {
      migrationUtils.log(`QR Code Access migration failed: ${error.message}`, 'error');
      return false;
    }
  }
};

/**
 * Main migration function
 */
async function runMigration() {
  migrationUtils.log('🚀 Starting database migration from SQLite to PostgreSQL...');
  
  try {
    // Test connections
    await sqliteClient.$connect();
    await postgresClient.$connect();
    migrationUtils.log('Database connections established');
    
    // Run migration steps in order
    const steps = [
      migrationSteps.migrateUsers,
      migrationSteps.migrateLaboratories,
      migrationSteps.migrateProducts,
      migrationSteps.migrateReports,
      migrationSteps.migrateValidations,
      migrationSteps.migrateProductSeals,
      migrationSteps.migrateQRCodeAccess
    ];
    
    let allSuccessful = true;
    
    for (const step of steps) {
      const success = await step();
      if (!success) {
        allSuccessful = false;
        break;
      }
    }
    
    if (allSuccessful) {
      migrationUtils.log('🎉 Migration completed successfully!', 'success');
      
      // Generate migration report
      const report = {
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        tables: {
          users: await postgresClient.user.count(),
          laboratories: await postgresClient.laboratory.count(),
          products: await postgresClient.product.count(),
          reports: await postgresClient.report.count(),
          validations: await postgresClient.validation.count(),
          productSeals: await postgresClient.productSeal.count(),
          qrCodeAccess: await postgresClient.qRCodeAccess.count()
        }
      };
      
      fs.writeFileSync(
        path.join(__dirname, '../migration-report.json'),
        JSON.stringify(report, null, 2)
      );
      
      migrationUtils.log('Migration report saved to migration-report.json', 'success');
    } else {
      migrationUtils.log('Migration failed. Please check the errors above.', 'error');
      process.exit(1);
    }
    
  } catch (error) {
    migrationUtils.log(`Migration failed with error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrationUtils, migrationSteps };
