/**
 * Analytics Utilities
 * 
 * Funções utilitárias para processamento de dados de analytics
 */

import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  AnalyticsFilter,
  TrendData,
  PeriodData,
  AnalyticsEvent
} from '../types';

class AnalyticsUtils {
  /**
   * Gerar filtros de data para períodos comuns
   */
  getDateRangePresets(): Record<string, { start: string; end: string }> {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    return {
      today: {
        start: today,
        end: today,
      },
      yesterday: {
        start: format(subDays(now, 1), 'yyyy-MM-dd'),
        end: format(subDays(now, 1), 'yyyy-MM-dd'),
      },
      last7days: {
        start: format(subDays(now, 7), 'yyyy-MM-dd'),
        end: today,
      },
      last30days: {
        start: format(subDays(now, 30), 'yyyy-MM-dd'),
        end: today,
      },
      last90days: {
        start: format(subDays(now, 90), 'yyyy-MM-dd'),
        end: today,
      },
      thisMonth: {
        start: format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'),
        end: today,
      },
      lastMonth: {
        start: format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM-dd'),
        end: format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd'),
      },
    };
  }

  /**
   * Calcular mudança percentual entre dois valores
   */
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Formatar números para exibição
   */
  formatNumber(value: number, options?: {
    compact?: boolean;
    currency?: boolean;
    percentage?: boolean;
    decimals?: number;
  }): string {
    const { compact = false, currency = false, percentage = false, decimals = 0 } = options || {};

    if (percentage) {
      return `${value.toFixed(decimals)}%`;
    }

    if (currency) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    }

    if (compact && value >= 1000) {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
    }

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Agrupar dados por período
   */
  groupDataByPeriod(
    data: any[],
    dateField: string,
    valueField: string,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): PeriodData[] {
    const grouped = new Map<string, number>();

    data.forEach(item => {
      const date = parseISO(item[dateField]);
      let key: string;

      switch (granularity) {
        case 'hour':
          key = format(date, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          key = format(date, 'yyyy-\'W\'ww');
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      grouped.set(key, (grouped.get(key) || 0) + (item[valueField] || 1));
    });

    return Array.from(grouped.entries())
      .map(([period, value]) => ({ period, value }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Calcular tendência dos dados
   */
  calculateTrend(data: TrendData[]): {
    direction: 'up' | 'down' | 'stable';
    strength: 'weak' | 'moderate' | 'strong';
    percentage: number;
  } {
    if (data.length < 2) {
      return { direction: 'stable', strength: 'weak', percentage: 0 };
    }

    const first = data[0].value;
    const last = data[data.length - 1].value;
    const percentage = this.calculatePercentageChange(last, first);

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentage) > 1) {
      direction = percentage > 0 ? 'up' : 'down';
    }

    let strength: 'weak' | 'moderate' | 'strong' = 'weak';
    const absPercentage = Math.abs(percentage);
    if (absPercentage > 20) {
      strength = 'strong';
    } else if (absPercentage > 5) {
      strength = 'moderate';
    }

    return { direction, strength, percentage };
  }

  /**
   * Gerar dados de exemplo para desenvolvimento
   */
  generateMockTrendData(days: number = 30): TrendData[] {
    const data: TrendData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(now, i), 'yyyy-MM-dd');
      const baseValue = 100;
      const randomVariation = (Math.random() - 0.5) * 20;
      const trendFactor = (days - i) * 0.5; // Tendência crescente
      const value = Math.max(0, Math.round(baseValue + randomVariation + trendFactor));

      data.push({
        date,
        value,
        change: i === days - 1 ? 0 : value - data[data.length - 1]?.value || 0,
      });
    }

    // Calcular changePercent
    data.forEach((item, index) => {
      if (index > 0) {
        const previous = data[index - 1].value;
        item.changePercent = this.calculatePercentageChange(item.value, previous);
      }
    });

    return data;
  }

  /**
   * Filtrar eventos por critérios
   */
  filterEvents(
    events: AnalyticsEvent[],
    filters: {
      eventType?: string[];
      entityType?: string[];
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
    }
  ): AnalyticsEvent[] {
    return events.filter(event => {
      // Filtro por tipo de evento
      if (filters.eventType?.length && !filters.eventType.includes(event.eventType)) {
        return false;
      }

      // Filtro por tipo de entidade
      if (filters.entityType?.length && !filters.entityType.includes(event.entityType)) {
        return false;
      }

      // Filtro por data
      if (filters.dateFrom) {
        const eventDate = parseISO(event.timestamp);
        const fromDate = startOfDay(parseISO(filters.dateFrom));
        if (eventDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const eventDate = parseISO(event.timestamp);
        const toDate = endOfDay(parseISO(filters.dateTo));
        if (eventDate > toDate) return false;
      }

      // Filtro por usuário
      if (filters.userId && event.userId !== filters.userId) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calcular métricas de engajamento
   */
  calculateEngagementMetrics(events: AnalyticsEvent[]): {
    totalEvents: number;
    uniqueUsers: number;
    avgEventsPerUser: number;
    topEventTypes: Array<{ type: string; count: number; percentage: number }>;
  } {
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const avgEventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;

    // Contar eventos por tipo
    const eventTypeCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEventTypes = Object.entries(eventTypeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / totalEvents) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents,
      uniqueUsers,
      avgEventsPerUser,
      topEventTypes,
    };
  }

  /**
   * Calcular taxa de conversão
   */
  calculateConversionRate(
    totalVisitors: number,
    conversions: number
  ): number {
    if (totalVisitors === 0) return 0;
    return (conversions / totalVisitors) * 100;
  }

  /**
   * Gerar insights automáticos
   */
  generateInsights(data: {
    current: any;
    previous: any;
    trends: TrendData[];
  }): Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    value?: string;
  }> {
    const insights = [];

    // Insight de crescimento
    if (data.current && data.previous) {
      const growth = this.calculatePercentageChange(data.current.total, data.previous.total);
      
      if (Math.abs(growth) > 5) {
        insights.push({
          type: growth > 0 ? 'positive' : 'negative',
          title: growth > 0 ? 'Crescimento Detectado' : 'Declínio Detectado',
          description: `${Math.abs(growth).toFixed(1)}% ${growth > 0 ? 'aumento' : 'diminuição'} em relação ao período anterior`,
          value: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
        });
      }
    }

    // Insight de tendência
    if (data.trends?.length > 0) {
      const trend = this.calculateTrend(data.trends);
      
      if (trend.strength !== 'weak') {
        insights.push({
          type: trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral',
          title: `Tendência ${trend.direction === 'up' ? 'Crescente' : trend.direction === 'down' ? 'Decrescente' : 'Estável'}`,
          description: `Tendência ${trend.strength === 'strong' ? 'forte' : 'moderada'} nos últimos ${data.trends.length} períodos`,
          value: `${trend.percentage > 0 ? '+' : ''}${trend.percentage.toFixed(1)}%`,
        });
      }
    }

    return insights;
  }

  /**
   * Validar filtros de analytics
   */
  validateFilters(filters: AnalyticsFilter): string[] {
    const errors: string[] = [];

    // Validar datas
    const startDate = parseISO(filters.dateRange.start);
    const endDate = parseISO(filters.dateRange.end);

    if (isNaN(startDate.getTime())) {
      errors.push('Data de início inválida');
    }

    if (isNaN(endDate.getTime())) {
      errors.push('Data de fim inválida');
    }

    if (startDate > endDate) {
      errors.push('Data de início deve ser anterior à data de fim');
    }

    // Validar período máximo (1 ano)
    const maxDays = 365;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > maxDays) {
      errors.push(`Período máximo permitido é de ${maxDays} dias`);
    }

    return errors;
  }
}

export const analyticsUtils = new AnalyticsUtils();
