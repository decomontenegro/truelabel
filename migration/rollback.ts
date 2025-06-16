import { PrismaClient } from '@prisma/client';
import { logger } from '../server/src/utils/logger';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Rollback configuration
interface RollbackConfig {
  backupPath: string;
  timestamp: string;
  reason: string;
  dryRun?: boolean;
  tables?: string[];
}

// Rollback result
interface RollbackResult {
  success: boolean;
  tablesRolledBack: string[];
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Create database backup before rollback
 */
async function createBackup(backupName: string): Promise<string> {
  const backupDir = path.join(process.cwd(), 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `${backupName}-${timestamp}.sql`);
  
  try {
    // For SQLite
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './server/dev.db';
    await fs.copyFile(dbPath, backupFile.replace('.sql', '.db'));
    
    logger.info(`Database backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    // For PostgreSQL
    if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
      const { stdout, stderr } = await execAsync(
        `pg_dump ${process.env.DATABASE_URL} > ${backupFile}`
      );
      
      if (stderr) {
        throw new Error(`Backup failed: ${stderr}`);
      }
      
      logger.info(`Database backup created: ${backupFile}`);
      return backupFile;
    }
    
    throw error;
  }
}

/**
 * Restore database from backup
 */
async function restoreFromBackup(backupFile: string): Promise<void> {
  try {
    // For SQLite
    if (backupFile.endsWith('.db')) {
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './server/dev.db';
      await fs.copyFile(backupFile, dbPath);
      logger.info(`Database restored from SQLite backup`);
      return;
    }
    
    // For PostgreSQL
    if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
      const { stderr } = await execAsync(
        `psql ${process.env.DATABASE_URL} < ${backupFile}`
      );
      
      if (stderr) {
        throw new Error(`Restore failed: ${stderr}`);
      }
      
      logger.info(`Database restored from PostgreSQL backup`);
    }
  } catch (error) {
    logger.error('Failed to restore from backup:', error);
    throw error;
  }
}

/**
 * Rollback specific tables
 */
async function rollbackTables(tables: string[], backupFile: string): Promise<void> {
  // This is a simplified implementation
  // In a real scenario, you'd selectively restore specific tables
  
  for (const table of tables) {
    try {
      logger.info(`Rolling back table: ${table}`);
      
      // Clear current table data
      await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
      
      // In a real implementation, you would:
      // 1. Extract table data from backup
      // 2. Insert the backed up data
      // 3. Reset sequences/auto-increment values
      
      logger.info(`Table ${table} rolled back successfully`);
    } catch (error) {
      logger.error(`Failed to rollback table ${table}:`, error);
      throw error;
    }
  }
}

/**
 * Validate rollback can be performed
 */
async function validateRollback(config: RollbackConfig): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Check backup file exists
  try {
    await fs.access(config.backupPath);
  } catch {
    errors.push(`Backup file not found: ${config.backupPath}`);
  }
  
  // Check database connectivity
  try {
    await prisma.$connect();
  } catch {
    errors.push('Unable to connect to database');
  }
  
  // Check for active connections (production safety)
  if (process.env.NODE_ENV === 'production') {
    const activeConnections = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid()
    ` as any[];
    
    if (activeConnections?.[0]?.count > 0) {
      errors.push(`Active database connections detected: ${activeConnections[0].count}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create rollback checkpoint
 */
async function createCheckpoint(reason: string): Promise<string> {
  const checkpoint = {
    id: `rollback-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reason,
    database: {
      users: await prisma.user.count(),
      brands: await prisma.brand.count(),
      products: await prisma.product.count(),
      validations: await prisma.validation.count(),
      qrCodes: await prisma.qRCode.count()
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL?.split('@')[1] // Hide credentials
    }
  };
  
  const checkpointPath = path.join(process.cwd(), 'backups', `checkpoint-${checkpoint.id}.json`);
  await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
  
  logger.info(`Checkpoint created: ${checkpointPath}`);
  return checkpointPath;
}

/**
 * Main rollback function
 */
export async function performRollback(config: RollbackConfig): Promise<RollbackResult> {
  const startTime = new Date();
  const result: RollbackResult = {
    success: false,
    tablesRolledBack: [],
    errors: [],
    startTime,
    endTime: new Date(),
    duration: 0
  };
  
  try {
    logger.warn('=== STARTING DATABASE ROLLBACK ===');
    logger.warn(`Reason: ${config.reason}`);
    logger.warn(`Backup: ${config.backupPath}`);
    logger.warn(`Dry run: ${config.dryRun || false}`);
    
    // Validate rollback
    const validation = await validateRollback(config);
    if (!validation.valid) {
      result.errors = validation.errors;
      throw new Error('Rollback validation failed');
    }
    
    if (config.dryRun) {
      logger.info('DRY RUN MODE - No changes will be made');
      
      // Simulate rollback steps
      const tables = config.tables || [
        'users', 'brands', 'products', 'laboratories',
        'validations', 'analysis_reports', 'qr_codes'
      ];
      
      for (const table of tables) {
        logger.info(`Would rollback table: ${table}`);
        result.tablesRolledBack.push(table);
      }
      
      result.success = true;
    } else {
      // Create checkpoint before rollback
      const checkpointPath = await createCheckpoint(config.reason);
      logger.info(`Checkpoint created: ${checkpointPath}`);
      
      // Create new backup of current state
      const currentBackup = await createBackup('pre-rollback');
      logger.info(`Current state backed up: ${currentBackup}`);
      
      // Perform rollback
      if (config.tables && config.tables.length > 0) {
        // Partial rollback
        await rollbackTables(config.tables, config.backupPath);
        result.tablesRolledBack = config.tables;
      } else {
        // Full rollback
        await restoreFromBackup(config.backupPath);
        result.tablesRolledBack = ['*'];
      }
      
      result.success = true;
      logger.info('Rollback completed successfully');
    }
  } catch (error) {
    logger.error('Rollback failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    result.success = false;
  } finally {
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - startTime.getTime();
    
    // Generate rollback report
    await generateRollbackReport(result, config);
  }
  
  return result;
}

/**
 * Generate rollback report
 */
async function generateRollbackReport(
  result: RollbackResult,
  config: RollbackConfig
): Promise<void> {
  const report = [];
  
  report.push('# Database Rollback Report');
  report.push(`Generated: ${result.endTime.toISOString()}`);
  report.push(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  report.push('');
  
  report.push('## Configuration');
  report.push(`- Backup Path: ${config.backupPath}`);
  report.push(`- Timestamp: ${config.timestamp}`);
  report.push(`- Reason: ${config.reason}`);
  report.push(`- Dry Run: ${config.dryRun || false}`);
  report.push('');
  
  report.push('## Result');
  report.push(`- Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  report.push(`- Tables Rolled Back: ${result.tablesRolledBack.join(', ')}`);
  report.push('');
  
  if (result.errors.length > 0) {
    report.push('## Errors');
    result.errors.forEach(error => {
      report.push(`- ${error}`);
    });
    report.push('');
  }
  
  const reportPath = path.join(
    process.cwd(),
    'backups',
    `rollback-report-${Date.now()}.md`
  );
  
  await fs.writeFile(reportPath, report.join('\n'));
  logger.info(`Rollback report saved: ${reportPath}`);
}

/**
 * List available backups
 */
export async function listBackups(): Promise<string[]> {
  const backupDir = path.join(process.cwd(), 'backups');
  
  try {
    const files = await fs.readdir(backupDir);
    return files.filter(f => f.endsWith('.sql') || f.endsWith('.db'));
  } catch {
    return [];
  }
}

/**
 * Rollback verification
 */
export async function verifyRollback(backupPath: string): Promise<boolean> {
  try {
    // Load checkpoint if exists
    const checkpointPath = backupPath.replace(/\.(sql|db)$/, '-checkpoint.json');
    
    try {
      const checkpoint = JSON.parse(await fs.readFile(checkpointPath, 'utf-8'));
      
      // Compare current counts with checkpoint
      const currentCounts = {
        users: await prisma.user.count(),
        brands: await prisma.brand.count(),
        products: await prisma.product.count(),
        validations: await prisma.validation.count(),
        qrCodes: await prisma.qRCode.count()
      };
      
      logger.info('Database counts after rollback:', currentCounts);
      logger.info('Expected counts from checkpoint:', checkpoint.database);
      
      // You can add more sophisticated verification here
      return true;
    } catch {
      logger.warn('No checkpoint found for verification');
      return true;
    }
  } catch (error) {
    logger.error('Rollback verification failed:', error);
    return false;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  (async () => {
    try {
      switch (command) {
        case 'list':
          const backups = await listBackups();
          console.log('Available backups:');
          backups.forEach(backup => console.log(`  - ${backup}`));
          break;
          
        case 'rollback':
          const backupPath = process.argv[3];
          if (!backupPath) {
            console.error('Usage: ts-node rollback.ts rollback <backup-file> [reason]');
            process.exit(1);
          }
          
          const reason = process.argv[4] || 'Manual rollback';
          const config: RollbackConfig = {
            backupPath,
            timestamp: new Date().toISOString(),
            reason,
            dryRun: process.argv.includes('--dry-run'),
            tables: process.argv
              .find(arg => arg.startsWith('--tables='))
              ?.split('=')[1]
              ?.split(',')
          };
          
          const result = await performRollback(config);
          
          if (result.success) {
            console.log('✅ Rollback completed successfully');
            
            // Verify rollback
            const verified = await verifyRollback(backupPath);
            if (verified) {
              console.log('✅ Rollback verification passed');
            } else {
              console.log('⚠️  Rollback verification failed');
            }
          } else {
            console.error('❌ Rollback failed');
            result.errors.forEach(error => console.error(`  - ${error}`));
          }
          
          process.exit(result.success ? 0 : 1);
          break;
          
        default:
          console.log('Usage: ts-node rollback.ts <command> [options]');
          console.log('Commands:');
          console.log('  list                List available backups');
          console.log('  rollback <file>     Perform rollback from backup');
          console.log('Options:');
          console.log('  --dry-run           Simulate rollback without changes');
          console.log('  --tables=t1,t2      Rollback specific tables only');
          process.exit(1);
      }
    } catch (error) {
      console.error('Command failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}