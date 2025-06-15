import { PrismaClient } from '@prisma/client';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';
import cron from 'node-cron';

const prisma = new PrismaClient();

/**
 * Serviço de cache warming para pré-carregar dados frequentemente acessados
 */
class CacheWarmingService {
  private isRunning = false;

  /**
   * Iniciar o serviço de cache warming
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Cache warming service já está em execução');
      return;
    }

    this.isRunning = true;
    console.log('🔥 Iniciando serviço de cache warming...');

    // Aquecer cache inicial
    this.warmCache();

    // Agendar aquecimento periódico (a cada 30 minutos)
    cron.schedule('*/30 * * * *', () => {
      console.log('🔄 Executando cache warming agendado...');
      this.warmCache();
    });

    // Aquecer cache de produtos mais acessados (a cada 10 minutos)
    cron.schedule('*/10 * * * *', () => {
      this.warmPopularProducts();
    });

    // Aquecer estatísticas (a cada hora)
    cron.schedule('0 * * * *', () => {
      this.warmStatistics();
    });
  }

  /**
   * Aquecer cache com dados essenciais
   */
  private async warmCache() {
    try {
      await Promise.all([
        this.warmLaboratories(),
        this.warmRecentProducts(),
        this.warmValidationQueue(),
        this.warmUserSessions()
      ]);
      console.log('✅ Cache warming concluído');
    } catch (error) {
      console.error('❌ Erro no cache warming:', error);
    }
  }

  /**
   * Aquecer cache de laboratórios
   */
  private async warmLaboratories() {
    try {
      const laboratories = await prisma.laboratory.findMany({
        select: {
          id: true,
          name: true,
          accreditation: true,
          email: true,
          phone: true,
          status: true
        },
        where: {
          status: 'ACTIVE'
        }
      });

      // Salvar lista completa
      await cache.set(CacheKeys.laboratoryList(), laboratories, CacheTTL.long);

      // Salvar cada laboratório individualmente
      await Promise.all(
        laboratories.map(lab =>
          cache.set(CacheKeys.laboratory(lab.id), lab, CacheTTL.long)
        )
      );

      console.log(`📦 ${laboratories.length} laboratórios aquecidos no cache`);
    } catch (error) {
      console.error('Erro ao aquecer laboratórios:', error);
    }
  }

  /**
   * Aquecer produtos recentes
   */
  private async warmRecentProducts() {
    try {
      // Buscar produtos mais recentes
      const recentProducts = await prisma.product.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          validations: {
            select: { status: true, validatedAt: true }
          },
          _count: {
            select: { reports: true }
          }
        }
      });

      // Salvar cada produto
      await Promise.all(
        recentProducts.map(product =>
          cache.set(CacheKeys.product(product.id), product, CacheTTL.medium)
        )
      );

      // Salvar mapeamento SKU -> ID
      await Promise.all(
        recentProducts.map(product =>
          cache.set(CacheKeys.productBySku(product.sku), product.id, CacheTTL.long)
        )
      );

      console.log(`📦 ${recentProducts.length} produtos recentes aquecidos no cache`);
    } catch (error) {
      console.error('Erro ao aquecer produtos recentes:', error);
    }
  }

  /**
   * Aquecer produtos populares (mais acessados)
   */
  private async warmPopularProducts() {
    try {
      // Buscar do cache de QR scans para identificar produtos populares
      const popularProductIds: string[] = [];
      
      // Por enquanto, usar produtos com mais validações como proxy
      const popularProducts = await prisma.product.findMany({
        take: 20,
        include: {
          user: {
            select: { name: true, email: true }
          },
          validations: {
            select: { status: true, validatedAt: true }
          },
          _count: {
            select: { reports: true, validations: true }
          }
        },
        orderBy: {
          validations: {
            _count: 'desc'
          }
        }
      });

      await Promise.all(
        popularProducts.map(product =>
          cache.set(CacheKeys.product(product.id), product, CacheTTL.medium)
        )
      );

      console.log(`🔥 ${popularProducts.length} produtos populares aquecidos no cache`);
    } catch (error) {
      console.error('Erro ao aquecer produtos populares:', error);
    }
  }

  /**
   * Aquecer fila de validações
   */
  private async warmValidationQueue() {
    try {
      const pendingValidations = await prisma.validation.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          createdAt: true
        }
      });

      // Limpar fila antiga
      await cache.del(CacheKeys.validationQueue());

      // Adicionar à fila ordenada
      for (const validation of pendingValidations) {
        await cache.zadd(
          CacheKeys.validationQueue(),
          new Date(validation.createdAt).getTime(),
          validation.id
        );
      }

      console.log(`📦 ${pendingValidations.length} validações pendentes aquecidas no cache`);
    } catch (error) {
      console.error('Erro ao aquecer fila de validações:', error);
    }
  }

  /**
   * Aquecer estatísticas
   */
  private async warmStatistics() {
    try {
      // Estatísticas globais
      const [
        totalProducts,
        totalValidations,
        totalReports,
        approvedValidations
      ] = await Promise.all([
        prisma.product.count(),
        prisma.validation.count(),
        prisma.report.count(),
        prisma.validation.count({ where: { status: 'APPROVED' } })
      ]);

      const globalStats = {
        products: totalProducts,
        validations: totalValidations,
        reports: totalReports,
        approvalRate: totalValidations > 0 
          ? (approvedValidations / totalValidations * 100).toFixed(1) 
          : 0
      };

      await cache.set(
        CacheKeys.analytics('global-stats', 'all'),
        globalStats,
        CacheTTL.medium
      );

      // Estatísticas por marca (top 10)
      const topBrands = await prisma.user.findMany({
        where: { role: 'BRAND' },
        take: 10,
        select: {
          id: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: {
          products: {
            _count: 'desc'
          }
        }
      });

      for (const brand of topBrands) {
        if (brand._count.products > 0) {
          const brandStats = await this.calculateUserStats(brand.id);
          await cache.set(
            CacheKeys.analytics('validation-stats', brand.id),
            brandStats,
            CacheTTL.medium
          );
        }
      }

      console.log('📊 Estatísticas aquecidas no cache');
    } catch (error) {
      console.error('Erro ao aquecer estatísticas:', error);
    }
  }

  /**
   * Aquecer sessões de usuários ativos
   */
  private async warmUserSessions() {
    try {
      // Buscar usuários que fizeram login recentemente (últimas 24 horas)
      const recentUsers = await prisma.user.findMany({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          email: true,
          role: true
        }
      });

      // Não podemos aquecer sessões JWT diretamente,
      // mas podemos pré-carregar dados de usuário
      await Promise.all(
        recentUsers.map(user =>
          cache.set(CacheKeys.userByEmail(user.email), user, CacheTTL.medium)
        )
      );

      console.log(`👥 ${recentUsers.length} usuários ativos pré-carregados`);
    } catch (error) {
      console.error('Erro ao aquecer sessões:', error);
    }
  }

  /**
   * Calcular estatísticas de um usuário
   */
  private async calculateUserStats(userId: string) {
    const where = { product: { userId } };

    const [total, approved, rejected, partial, pending] = await Promise.all([
      prisma.validation.count({ where }),
      prisma.validation.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.validation.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.validation.count({ where: { ...where, status: 'PARTIAL' } }),
      prisma.validation.count({ where: { ...where, status: 'PENDING' } })
    ]);

    return {
      overview: {
        total,
        approved,
        rejected,
        partial,
        pending
      }
    };
  }

  /**
   * Limpar cache expirado
   */
  async cleanup() {
    try {
      // O Redis remove automaticamente chaves expiradas,
      // mas podemos limpar padrões específicos se necessário
      const patterns = [
        'products:*:*', // Listas de produtos paginadas
        'analytics:*:*' // Estatísticas antigas
      ];

      for (const pattern of patterns) {
        const deleted = await cache.clearPattern(pattern);
        if (deleted > 0) {
          console.log(`🧹 ${deleted} chaves removidas para padrão: ${pattern}`);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}

export default new CacheWarmingService();