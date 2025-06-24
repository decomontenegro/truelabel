/**
 * Zero-Downtime Database Migration Script
 * SQLite to PostgreSQL with real-time sync
 */

import { PrismaClient as SQLitePrisma } from '@prisma/client';
import { PrismaClient as PostgresPrisma } from '@prisma/client';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import pLimit from 'p-limit';
import { performance } from 'perf_hooks';
import winston from 'winston';
import { WebClient } from '@slack/web-api';
import Redis from 'ioredis';

// Configuration
const config = {
  sqlite: {
    url: process.env.SQLITE_URL || 'file:./dev.db'
  },
  postgres: {
    url: process.env.POSTGRES_URL || 'postgresql://user:pass@localhost:5432/truelabel'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  slack: {
    token: process.env.SLACK_TOKEN,
    channel: process.env.SLACK_CHANNEL || '#database-migration'
  },
  migration: {
    batchSize: 1000,
    parallelWorkers: 4,
    syncInterval: 5000, // 5 seconds
    validationSampleSize: 0.1, // 10% sample validation
    readOnlyMode: false
  }
};

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'migration-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'migration-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Slack notifications
const slack = config.slack.token ? new WebClient(config.slack.token) : null;

// Redis for coordination
const redis = new Redis(config.redis.url);

/**
 * Migration Progress Tracker
 */
class MigrationProgress {
  private progress: Map<string, any> = new Map();

  update(table: string, data: any) {
    this.progress.set(table, {
      ...this.progress.get(table),
      ...data,
      lastUpdate: new Date()
    });
  }

  get(table: string) {
    return this.progress.get(table);
  }

  getSummary() {
    const summary: any = {};
    this.progress.forEach((value, key) => {
      summary[key] = value;
    });
    return summary;
  }
}

/**
 * Database Change Tracker
 */
class ChangeDataCapture extends EventEmitter {
  private sqliteClient: SQLitePrisma;
  private postgresClient: PostgresPrisma;
  private isRunning = false;
  private lastSyncTime: Map<string, Date> = new Map();

  constructor(sqlite: SQLitePrisma, postgres: PostgresPrisma) {
    super();
    this.sqliteClient = sqlite;
    this.postgresClient = postgres;
  }

  async start() {
    this.isRunning = true;
    this.trackChanges();
  }

  async stop() {
    this.isRunning = false;
  }

  private async trackChanges() {
    while (this.isRunning) {
      try {
        // Track changes for each table
        const tables = [
          'users', 'products', 'validations', 'reports',
          'laboratories', 'productSeals', 'qrCodeAccesses',
          'validationQueue', 'analyticsEvents'
        ];

        for (const table of tables) {
          await this.syncTable(table);
        }

        // Wait before next sync cycle
        await new Promise(resolve => setTimeout(resolve, config.migration.syncInterval));
      } catch (error) {
        logger.error('CDC error:', error);
        this.emit('error', error);
      }
    }
  }

  private async syncTable(tableName: string) {
    const lastSync = this.lastSyncTime.get(tableName) || new Date(0);
    const currentTime = new Date();

    try {
      // Get changed records since last sync
      const changes = await (this.sqliteClient as any)[tableName].findMany({
        where: {
          OR: [
            { updatedAt: { gt: lastSync } },
            { createdAt: { gt: lastSync } }
          ]
        }
      });

      if (changes.length > 0) {
        logger.info(`Syncing ${changes.length} changes for ${tableName}`);
        
        // Sync changes to PostgreSQL
        for (const record of changes) {
          await this.syncRecord(tableName, record);
        }

        this.emit('sync', { table: tableName, count: changes.length });
      }

      this.lastSyncTime.set(tableName, currentTime);
    } catch (error) {
      logger.error(`Error syncing ${tableName}:`, error);
      this.emit('error', { table: tableName, error });
    }
  }

  private async syncRecord(tableName: string, record: any) {
    try {
      // Check if record exists in PostgreSQL
      const exists = await (this.postgresClient as any)[tableName].findUnique({
        where: { id: record.id }
      });

      if (exists) {
        // Update existing record
        await (this.postgresClient as any)[tableName].update({
          where: { id: record.id },
          data: this.transformRecord(tableName, record)
        });
      } else {
        // Create new record
        await (this.postgresClient as any)[tableName].create({
          data: this.transformRecord(tableName, record)
        });
      }
    } catch (error) {
      logger.error(`Error syncing record ${record.id} in ${tableName}:`, error);
      throw error;
    }
  }

  private transformRecord(tableName: string, record: any): any {
    // Transform data types for PostgreSQL compatibility
    const transformed = { ...record };

    // Convert JSON strings to objects
    if (tableName === 'products' && transformed.nutritionalInfo) {
      try {
        transformed.nutritionalInfo = JSON.parse(transformed.nutritionalInfo);
      } catch {}
    }

    if (tableName === 'products' && transformed.claims) {
      try {
        transformed.claims = transformed.claims.split(',').map((c: string) => c.trim());
      } catch {}
    }

    // Handle other transformations...
    return transformed;
  }
}

/**
 * Zero-Downtime Migration Manager
 */
export class ZeroDowntimeMigration {
  private sqliteClient: SQLitePrisma;
  private postgresClient: PostgresPrisma;
  private cdc: ChangeDataCapture;
  private progress: MigrationProgress;
  private migrationId: string;

  constructor() {
    this.sqliteClient = new SQLitePrisma({
      datasources: { db: { url: config.sqlite.url } }
    });
    this.postgresClient = new PostgresPrisma({
      datasources: { db: { url: config.postgres.url } }
    });
    this.cdc = new ChangeDataCapture(this.sqliteClient, this.postgresClient);
    this.progress = new MigrationProgress();
    this.migrationId = createHash('md5').update(Date.now().toString()).digest('hex');
  }

  async execute() {
    try {
      await this.notifyStart();
      
      // Phase 1: Initial bulk migration
      logger.info('Phase 1: Starting initial bulk migration');
      await this.bulkMigration();

      // Phase 2: Start real-time sync
      logger.info('Phase 2: Starting real-time synchronization');
      await this.startRealtimeSync();

      // Phase 3: Validation
      logger.info('Phase 3: Validating data integrity');
      const validationResult = await this.validateMigration();
      
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validationResult.errors)}`);
      }

      // Phase 4: Switch to read-only mode
      logger.info('Phase 4: Switching to read-only mode');
      await this.enableReadOnlyMode();

      // Phase 5: Final sync
      logger.info('Phase 5: Performing final synchronization');
      await this.finalSync();

      // Phase 6: Cutover
      logger.info('Phase 6: Performing cutover');
      await this.performCutover();

      await this.notifySuccess();
      
    } catch (error) {
      logger.error('Migration failed:', error);
      await this.rollback();
      await this.notifyFailure(error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async bulkMigration() {
    const tables = [
      { name: 'users', dependencies: [] },
      { name: 'laboratories', dependencies: [] },
      { name: 'products', dependencies: ['users'] },
      { name: 'reports', dependencies: ['products', 'laboratories'] },
      { name: 'validations', dependencies: ['products', 'reports', 'users'] },
      { name: 'productSeals', dependencies: ['products'] },
      { name: 'qrCodeAccesses', dependencies: [] },
      { name: 'validationQueue', dependencies: ['products', 'users'] },
      { name: 'validationQueueHistory', dependencies: ['validationQueue', 'users'] },
      { name: 'analyticsEvents', dependencies: ['users'] }
    ];

    // Migrate tables respecting dependencies
    for (const table of tables) {
      await this.migrateTable(table.name);
    }
  }

  private async migrateTable(tableName: string) {
    const startTime = performance.now();
    logger.info(`Migrating ${tableName}...`);
    
    try {
      // Get total count
      const totalCount = await (this.sqliteClient as any)[tableName].count();
      logger.info(`Found ${totalCount} records in ${tableName}`);

      // Create progress tracker
      this.progress.update(tableName, {
        total: totalCount,
        migrated: 0,
        status: 'in_progress'
      });

      // Migrate in batches
      const limit = pLimit(config.migration.parallelWorkers);
      const batchSize = config.migration.batchSize;
      const batches = Math.ceil(totalCount / batchSize);

      const batchPromises = [];
      for (let i = 0; i < batches; i++) {
        batchPromises.push(
          limit(() => this.migrateBatch(tableName, i * batchSize, batchSize))
        );
      }

      await Promise.all(batchPromises);

      // Update progress
      const duration = (performance.now() - startTime) / 1000;
      this.progress.update(tableName, {
        status: 'completed',
        duration: duration,
        recordsPerSecond: Math.round(totalCount / duration)
      });

      logger.info(`✅ ${tableName} migration completed in ${duration.toFixed(2)}s`);
      
    } catch (error) {
      this.progress.update(tableName, {
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  private async migrateBatch(tableName: string, skip: number, take: number) {
    try {
      // Fetch batch from SQLite
      const records = await (this.sqliteClient as any)[tableName].findMany({
        skip,
        take,
        orderBy: { id: 'asc' }
      });

      // Transform and insert into PostgreSQL
      const transformedRecords = records.map((record: any) => 
        this.cdc['transformRecord'](tableName, record)
      );

      // Use createMany for better performance
      await (this.postgresClient as any)[tableName].createMany({
        data: transformedRecords,
        skipDuplicates: true
      });

      // Update progress
      const current = this.progress.get(tableName);
      this.progress.update(tableName, {
        migrated: (current?.migrated || 0) + records.length
      });

    } catch (error) {
      logger.error(`Error migrating batch ${skip}-${skip + take} for ${tableName}:`, error);
      throw error;
    }
  }

  private async startRealtimeSync() {
    // Set up change tracking
    this.cdc.on('sync', (data) => {
      logger.info(`Real-time sync: ${data.table} - ${data.count} records`);
    });

    this.cdc.on('error', (error) => {
      logger.error('Real-time sync error:', error);
    });

    // Start CDC
    await this.cdc.start();

    // Monitor sync lag
    setInterval(async () => {
      const lag = await this.checkSyncLag();
      if (lag > 60000) { // 1 minute
        logger.warn(`High sync lag detected: ${lag}ms`);
        await this.notifyHighLag(lag);
      }
    }, 30000); // Check every 30 seconds
  }

  private async checkSyncLag(): Promise<number> {
    // Compare latest record timestamps between databases
    const sqliteLatest = await this.sqliteClient.product.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    const postgresLatest = await this.postgresClient.product.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!sqliteLatest || !postgresLatest) return 0;

    return sqliteLatest.updatedAt.getTime() - postgresLatest.updatedAt.getTime();
  }

  private async validateMigration() {
    logger.info('Starting data validation...');
    const errors: any[] = [];

    // Validate record counts
    const tables = ['users', 'products', 'validations', 'reports'];
    
    for (const table of tables) {
      const sqliteCount = await (this.sqliteClient as any)[table].count();
      const postgresCount = await (this.postgresClient as any)[table].count();
      
      if (sqliteCount !== postgresCount) {
        errors.push({
          table,
          type: 'count_mismatch',
          sqlite: sqliteCount,
          postgres: postgresCount
        });
      }
    }

    // Sample data validation
    const sampleSize = Math.floor(1000 * config.migration.validationSampleSize);
    const sampleErrors = await this.validateSampleData(sampleSize);
    errors.push(...sampleErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async validateSampleData(sampleSize: number) {
    const errors: any[] = [];
    
    // Validate products sample
    const productSample = await this.sqliteClient.product.findMany({
      take: sampleSize,
      orderBy: { createdAt: 'desc' }
    });

    for (const sqliteProduct of productSample) {
      const postgresProduct = await this.postgresClient.product.findUnique({
        where: { id: sqliteProduct.id }
      });

      if (!postgresProduct) {
        errors.push({
          type: 'missing_record',
          table: 'products',
          id: sqliteProduct.id
        });
        continue;
      }

      // Validate critical fields
      const criticalFields = ['name', 'sku', 'status', 'userId'];
      for (const field of criticalFields) {
        if ((sqliteProduct as any)[field] !== (postgresProduct as any)[field]) {
          errors.push({
            type: 'field_mismatch',
            table: 'products',
            id: sqliteProduct.id,
            field,
            sqlite: (sqliteProduct as any)[field],
            postgres: (postgresProduct as any)[field]
          });
        }
      }
    }

    return errors;
  }

  private async enableReadOnlyMode() {
    // Set read-only flag in Redis
    await redis.set('db:readonly', 'true', 'EX', 3600);
    
    // Notify application instances
    await redis.publish('db:mode', JSON.stringify({
      mode: 'readonly',
      reason: 'migration',
      timestamp: new Date()
    }));

    logger.info('Database switched to read-only mode');
  }

  private async finalSync() {
    // Stop CDC temporarily
    await this.cdc.stop();

    // Get final changes
    const tables = ['users', 'products', 'validations', 'reports'];
    
    for (const table of tables) {
      const recentChanges = await (this.sqliteClient as any)[table].findMany({
        where: {
          updatedAt: {
            gt: new Date(Date.now() - 300000) // Last 5 minutes
          }
        }
      });

      logger.info(`Final sync: ${recentChanges.length} recent changes in ${table}`);

      for (const record of recentChanges) {
        await this.cdc['syncRecord'](table, record);
      }
    }
  }

  private async performCutover() {
    logger.info('Performing database cutover...');

    // Update connection string in Redis for dynamic switching
    await redis.set('db:connection', config.postgres.url);
    
    // Notify all application instances
    await redis.publish('db:cutover', JSON.stringify({
      from: 'sqlite',
      to: 'postgresql',
      timestamp: new Date(),
      migrationId: this.migrationId
    }));

    // Wait for applications to switch
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    // Disable read-only mode
    await redis.del('db:readonly');

    logger.info('Cutover completed');
  }

  private async rollback() {
    logger.error('Starting rollback...');

    try {
      // Stop CDC
      await this.cdc.stop();

      // Re-enable SQLite writes
      await redis.del('db:readonly');
      
      // Restore original connection
      await redis.set('db:connection', config.sqlite.url);
      
      // Notify applications
      await redis.publish('db:rollback', JSON.stringify({
        migrationId: this.migrationId,
        timestamp: new Date()
      }));

      logger.info('Rollback completed');
    } catch (error) {
      logger.error('Rollback failed:', error);
    }
  }

  private async cleanup() {
    await this.sqliteClient.$disconnect();
    await this.postgresClient.$disconnect();
    await redis.quit();
  }

  // Notification methods
  private async notifyStart() {
    const message = `🚀 Database migration started\nID: ${this.migrationId}\nMode: Zero-downtime`;
    await this.sendSlackMessage(message);
  }

  private async notifySuccess() {
    const summary = this.progress.getSummary();
    const message = `✅ Database migration completed successfully!\nID: ${this.migrationId}\nSummary: ${JSON.stringify(summary, null, 2)}`;
    await this.sendSlackMessage(message);
  }

  private async notifyFailure(error: any) {
    const message = `❌ Database migration failed!\nID: ${this.migrationId}\nError: ${error.message}`;
    await this.sendSlackMessage(message);
  }

  private async notifyHighLag(lag: number) {
    const message = `⚠️ High replication lag detected: ${lag}ms`;
    await this.sendSlackMessage(message);
  }

  private async sendSlackMessage(text: string) {
    if (slack) {
      try {
        await slack.chat.postMessage({
          channel: config.slack.channel,
          text
        });
      } catch (error) {
        logger.error('Failed to send Slack notification:', error);
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const migration = new ZeroDowntimeMigration();
  
  migration.execute()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

export default ZeroDowntimeMigration;