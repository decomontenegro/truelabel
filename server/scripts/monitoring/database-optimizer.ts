/**
 * Database Performance Optimizer and Monitor
 * Continuous monitoring and optimization for PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import winston from 'winston';
import { WebClient } from '@slack/web-api';
import * as os from 'os';

// Configuration
const config = {
  monitoring: {
    enabled: process.env.DB_MONITORING_ENABLED !== 'false',
    interval: parseInt(process.env.DB_MONITORING_INTERVAL || '60000'), // 1 minute
    slackToken: process.env.SLACK_TOKEN,
    slackChannel: process.env.SLACK_CHANNEL || '#db-performance'
  },
  thresholds: {
    slowQueryMs: 1000,
    highConnectionCount: 80, // percentage
    cacheHitRatio: 0.95,
    indexScanRatio: 0.95,
    replicationLagSeconds: 10,
    tableBoatRatio: 0.2,
    deadlockCount: 5
  },
  optimization: {
    autoVacuum: true,
    autoAnalyze: true,
    autoReindex: true,
    autoPartition: true
  }
};

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'db-optimizer' },
  transports: [
    new winston.transports.File({ filename: 'db-optimizer.log' }),
    new winston.transports.Console()
  ]
});

// Slack client
const slack = config.monitoring.slackToken ? 
  new WebClient(config.monitoring.slackToken) : null;

/**
 * Database Performance Monitor
 */
export class DatabasePerformanceMonitor {
  private prisma: PrismaClient;
  private metrics: Map<string, any> = new Map();
  private alerts: Map<string, Date> = new Map();

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
      ]
    });

    this.setupQueryLogging();
  }

  /**
   * Start monitoring
   */
  async start() {
    logger.info('Starting database performance monitoring');

    // Continuous monitoring
    setInterval(() => this.collectMetrics(), config.monitoring.interval);

    // Scheduled optimizations
    this.scheduleOptimizations();

    // Initial metrics collection
    await this.collectMetrics();
  }

  /**
   * Setup query logging for slow query detection
   */
  private setupQueryLogging() {
    (this.prisma as any).$on('query', (e: any) => {
      if (e.duration > config.thresholds.slowQueryMs) {
        this.handleSlowQuery(e);
      }
    });
  }

  /**
   * Collect all performance metrics
   */
  private async collectMetrics() {
    try {
      const [
        connectionStats,
        cacheStats,
        tableStats,
        indexStats,
        replicationStats,
        lockStats,
        queryStats
      ] = await Promise.all([
        this.getConnectionStats(),
        this.getCacheStats(),
        this.getTableStats(),
        this.getIndexStats(),
        this.getReplicationStats(),
        this.getLockStats(),
        this.getQueryStats()
      ]);

      // Store metrics
      this.metrics.set('connections', connectionStats);
      this.metrics.set('cache', cacheStats);
      this.metrics.set('tables', tableStats);
      this.metrics.set('indexes', indexStats);
      this.metrics.set('replication', replicationStats);
      this.metrics.set('locks', lockStats);
      this.metrics.set('queries', queryStats);

      // Check thresholds and alert if needed
      await this.checkThresholds();

      // Log summary
      logger.info('Metrics collected', {
        connections: connectionStats.percentage,
        cacheHitRatio: cacheStats.hitRatio,
        slowQueries: queryStats.slowCount
      });

    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Get connection statistics
   */
  private async getConnectionStats() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        count(*) as current_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')) as percentage
      FROM pg_stat_activity
    `;

    return result[0];
  }

  /**
   * Get cache hit statistics
   */
  private async getCacheStats() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit) as heap_hit,
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read) + 0.01) as hit_ratio
      FROM pg_statio_user_tables
    `;

    const bufferStats = await this.prisma.$queryRaw<any[]>`
      SELECT 
        buffers_checkpoint,
        buffers_clean,
        buffers_backend,
        buffers_alloc
      FROM pg_stat_bgwriter
    `;

    return {
      ...result[0],
      ...bufferStats[0],
      hitRatio: parseFloat(result[0].hit_ratio)
    };
  }

  /**
   * Get table statistics including bloat
   */
  private async getTableStats() {
    const tableStats = await this.prisma.$queryRaw<any[]>`
      WITH table_bloat AS (
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as bloat_size,
          round((pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename))::numeric / pg_total_relation_size(schemaname||'.'||tablename), 2) as bloat_ratio
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      )
      SELECT * FROM table_bloat
      WHERE bloat_ratio > ${config.thresholds.tableBoatRatio}
      ORDER BY bloat_ratio DESC
      LIMIT 10
    `;

    const vacuumStats = await this.prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze,
        n_dead_tup,
        n_live_tup,
        round(n_dead_tup::numeric / (n_live_tup + n_dead_tup + 1), 2) as dead_ratio
      FROM pg_stat_user_tables
      WHERE n_dead_tup > 1000
      ORDER BY dead_ratio DESC
      LIMIT 10
    `;

    return {
      bloatedTables: tableStats,
      needsVacuum: vacuumStats
    };
  }

  /**
   * Get index statistics
   */
  private async getIndexStats() {
    const unusedIndexes = await this.prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      AND indexrelid NOT IN (
        SELECT conindid FROM pg_constraint WHERE contype = 'p'
      )
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 20
    `;

    const indexBloat = await this.prisma.$queryRaw<any[]>`
      WITH btree_index_atts AS (
        SELECT
          nspname,
          indexclass.relname as index_name,
          indexclass.reltuples,
          indexclass.relpages,
          tableclass.relname as tablename,
          (indexrelid::regclass)::text as index_fullname
        FROM pg_index
        JOIN pg_class AS indexclass ON pg_index.indexrelid = indexclass.oid
        JOIN pg_class AS tableclass ON pg_index.indrelid = tableclass.oid
        JOIN pg_namespace ON pg_namespace.oid = indexclass.relnamespace
        WHERE indexclass.relkind = 'i'
        AND nspname NOT IN ('pg_catalog', 'information_schema')
      )
      SELECT
        index_name,
        tablename,
        pg_size_pretty((relpages::bigint * 8192)::bigint) AS index_size,
        CASE WHEN relpages > 0
          THEN round(100.0 * (relpages - (reltuples * 16 / 8192)), 2)
          ELSE 0
        END AS bloat_percentage
      FROM btree_index_atts
      WHERE relpages > 100
      ORDER BY bloat_percentage DESC
      LIMIT 10
    `;

    return {
      unusedIndexes,
      bloatedIndexes: indexBloat
    };
  }

  /**
   * Get replication statistics
   */
  private async getReplicationStats() {
    try {
      const replicationStatus = await this.prisma.$queryRaw<any[]>`
        SELECT
          client_addr,
          state,
          sent_lsn,
          write_lsn,
          flush_lsn,
          replay_lsn,
          EXTRACT(EPOCH FROM (now() - write_lag))::int as write_lag_seconds,
          EXTRACT(EPOCH FROM (now() - flush_lag))::int as flush_lag_seconds,
          EXTRACT(EPOCH FROM (now() - replay_lag))::int as replay_lag_seconds
        FROM pg_stat_replication
      `;

      return {
        replicas: replicationStatus,
        maxLag: Math.max(...replicationStatus.map(r => r.replay_lag_seconds || 0))
      };
    } catch {
      return { replicas: [], maxLag: 0 };
    }
  }

  /**
   * Get lock statistics
   */
  private async getLockStats() {
    const locks = await this.prisma.$queryRaw<any[]>`
      SELECT
        locktype,
        mode,
        count(*) as count
      FROM pg_locks
      WHERE NOT granted
      GROUP BY locktype, mode
      ORDER BY count DESC
    `;

    const deadlocks = await this.prisma.$queryRaw<any[]>`
      SELECT deadlocks FROM pg_stat_database WHERE datname = current_database()
    `;

    return {
      waitingLocks: locks,
      deadlocks: deadlocks[0]?.deadlocks || 0
    };
  }

  /**
   * Get query statistics
   */
  private async getQueryStats() {
    try {
      const slowQueries = await this.prisma.$queryRaw<any[]>`
        SELECT
          query,
          calls,
          mean_exec_time,
          max_exec_time,
          total_exec_time,
          stddev_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > ${config.thresholds.slowQueryMs}
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `;

      return {
        slowQueries,
        slowCount: slowQueries.length
      };
    } catch {
      // pg_stat_statements might not be enabled
      return { slowQueries: [], slowCount: 0 };
    }
  }

  /**
   * Check thresholds and send alerts
   */
  private async checkThresholds() {
    const alerts: string[] = [];

    // Connection pool
    const connections = this.metrics.get('connections');
    if (connections?.percentage > config.thresholds.highConnectionCount) {
      alerts.push(`High connection usage: ${connections.percentage.toFixed(1)}%`);
    }

    // Cache hit ratio
    const cache = this.metrics.get('cache');
    if (cache?.hitRatio < config.thresholds.cacheHitRatio) {
      alerts.push(`Low cache hit ratio: ${(cache.hitRatio * 100).toFixed(1)}%`);
    }

    // Replication lag
    const replication = this.metrics.get('replication');
    if (replication?.maxLag > config.thresholds.replicationLagSeconds) {
      alerts.push(`High replication lag: ${replication.maxLag}s`);
    }

    // Deadlocks
    const locks = this.metrics.get('locks');
    if (locks?.deadlocks > config.thresholds.deadlockCount) {
      alerts.push(`High deadlock count: ${locks.deadlocks}`);
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlert(alerts);
    }
  }

  /**
   * Handle slow query
   */
  private async handleSlowQuery(queryEvent: any) {
    logger.warn('Slow query detected', {
      query: queryEvent.query,
      duration: queryEvent.duration,
      params: queryEvent.params
    });

    // Analyze query plan
    try {
      const explainResult = await this.prisma.$queryRaw`
        EXPLAIN (ANALYZE, BUFFERS) ${queryEvent.query}
      `;
      
      logger.info('Query plan', { plan: explainResult });
    } catch (error) {
      logger.error('Failed to analyze query plan', error);
    }
  }

  /**
   * Send alert
   */
  private async sendAlert(alerts: string[]) {
    const alertKey = alerts.join('|');
    const lastAlert = this.alerts.get(alertKey);
    
    // Rate limit alerts (1 per hour)
    if (lastAlert && (Date.now() - lastAlert.getTime() < 3600000)) {
      return;
    }

    this.alerts.set(alertKey, new Date());

    const message = `🚨 Database Performance Alert\n${alerts.join('\n')}`;
    
    logger.warn(message);

    if (slack) {
      await slack.chat.postMessage({
        channel: config.monitoring.slackChannel,
        text: message,
        attachments: [{
          color: 'warning',
          fields: [
            {
              title: 'Server',
              value: os.hostname(),
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            }
          ]
        }]
      }).catch(err => logger.error('Failed to send Slack alert', err));
    }
  }

  /**
   * Schedule automatic optimizations
   */
  private scheduleOptimizations() {
    // Daily vacuum analyze at 2 AM
    new CronJob('0 2 * * *', async () => {
      if (config.optimization.autoVacuum) {
        await this.performVacuumAnalyze();
      }
    }, null, true);

    // Weekly reindex at Sunday 3 AM
    new CronJob('0 3 * * 0', async () => {
      if (config.optimization.autoReindex) {
        await this.performReindex();
      }
    }, null, true);

    // Monthly partition maintenance
    new CronJob('0 4 1 * *', async () => {
      if (config.optimization.autoPartition) {
        await this.maintainPartitions();
      }
    }, null, true);

    // Hourly materialized view refresh
    new CronJob('0 * * * *', async () => {
      await this.refreshMaterializedViews();
    }, null, true);
  }

  /**
   * Perform vacuum analyze
   */
  private async performVacuumAnalyze() {
    logger.info('Starting vacuum analyze');
    
    try {
      const tables = this.metrics.get('tables')?.needsVacuum || [];
      
      for (const table of tables) {
        if (table.dead_ratio > 0.1) {
          await this.prisma.$executeRaw`
            VACUUM (ANALYZE) ${table.schemaname}.${table.tablename}
          `;
          logger.info(`Vacuumed ${table.tablename}`);
        }
      }
      
      // Update statistics
      await this.prisma.$executeRaw`ANALYZE`;
      
      logger.info('Vacuum analyze completed');
    } catch (error) {
      logger.error('Vacuum analyze failed', error);
    }
  }

  /**
   * Perform reindex
   */
  private async performReindex() {
    logger.info('Starting reindex');
    
    try {
      const indexes = this.metrics.get('indexes')?.bloatedIndexes || [];
      
      for (const index of indexes) {
        if (index.bloat_percentage > 30) {
          await this.prisma.$executeRaw`
            REINDEX INDEX CONCURRENTLY ${index.index_name}
          `;
          logger.info(`Reindexed ${index.index_name}`);
        }
      }
      
      logger.info('Reindex completed');
    } catch (error) {
      logger.error('Reindex failed', error);
    }
  }

  /**
   * Maintain partitions
   */
  private async maintainPartitions() {
    logger.info('Starting partition maintenance');
    
    try {
      // Create future partitions
      await this.prisma.$executeRaw`
        SELECT create_monthly_partitions('qr_code_accesses', 3);
        SELECT create_monthly_partitions('analytics_events', 3);
      `;
      
      // Drop old partitions
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      await this.prisma.$executeRaw`
        SELECT drop_old_partitions('qr_code_accesses', $1::timestamp);
        SELECT drop_old_partitions('analytics_events', $1::timestamp);
      ` as any;
      
      logger.info('Partition maintenance completed');
    } catch (error) {
      logger.error('Partition maintenance failed', error);
    }
  }

  /**
   * Refresh materialized views
   */
  private async refreshMaterializedViews() {
    logger.info('Refreshing materialized views');
    
    try {
      await this.prisma.$executeRaw`
        REFRESH MATERIALIZED VIEW CONCURRENTLY brand_dashboard_stats;
        REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products;
      `;
      
      logger.info('Materialized views refreshed');
    } catch (error) {
      logger.error('Materialized view refresh failed', error);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<string> {
    const metrics = Object.fromEntries(this.metrics);
    
    const report = `
# Database Performance Report
Generated: ${new Date().toISOString()}

## Connection Statistics
- Current: ${metrics.connections?.current_connections || 0}
- Maximum: ${metrics.connections?.max_connections || 0}
- Usage: ${metrics.connections?.percentage?.toFixed(1) || 0}%

## Cache Performance
- Hit Ratio: ${(metrics.cache?.hitRatio * 100)?.toFixed(1) || 0}%
- Buffer Checkpoints: ${metrics.cache?.buffers_checkpoint || 0}
- Buffer Clean: ${metrics.cache?.buffers_clean || 0}

## Table Health
- Tables with high bloat: ${metrics.tables?.bloatedTables?.length || 0}
- Tables needing vacuum: ${metrics.tables?.needsVacuum?.length || 0}

## Index Health
- Unused indexes: ${metrics.indexes?.unusedIndexes?.length || 0}
- Bloated indexes: ${metrics.indexes?.bloatedIndexes?.length || 0}

## Replication Status
- Active replicas: ${metrics.replication?.replicas?.length || 0}
- Maximum lag: ${metrics.replication?.maxLag || 0}s

## Query Performance
- Slow queries: ${metrics.queries?.slowCount || 0}

## Recommendations
${this.generateRecommendations(metrics)}
    `;

    return report;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: any): string {
    const recommendations: string[] = [];

    if (metrics.connections?.percentage > 80) {
      recommendations.push('- Increase max_connections or implement connection pooling');
    }

    if (metrics.cache?.hitRatio < 0.95) {
      recommendations.push('- Increase shared_buffers to improve cache hit ratio');
    }

    if (metrics.tables?.bloatedTables?.length > 0) {
      recommendations.push('- Run VACUUM FULL on heavily bloated tables');
    }

    if (metrics.indexes?.unusedIndexes?.length > 5) {
      recommendations.push('- Consider dropping unused indexes to reduce maintenance overhead');
    }

    if (metrics.queries?.slowCount > 10) {
      recommendations.push('- Analyze and optimize slow queries');
    }

    return recommendations.join('\n') || '- No immediate optimizations needed';
  }
}

// Export and CLI
if (require.main === module) {
  const monitor = new DatabasePerformanceMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      monitor.start();
      logger.info('Database performance monitor started');
      break;
      
    case 'report':
      monitor.generateReport().then(report => {
        console.log(report);
        process.exit(0);
      });
      break;
      
    default:
      console.log('Usage: database-optimizer.ts [start|report]');
      process.exit(1);
  }
}

export default DatabasePerformanceMonitor;