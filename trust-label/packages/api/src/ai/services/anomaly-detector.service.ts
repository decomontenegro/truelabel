import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnomalyDetectorService {
  constructor(private prisma: PrismaService) {}

  async detectAnomalies(data: any) {
    const anomalies = [];

    // Check for unusual value patterns
    const valueAnomalies = await this.detectValueAnomalies(data);
    anomalies.push(...valueAnomalies);

    // Check for temporal anomalies
    const temporalAnomalies = await this.detectTemporalAnomalies(data);
    anomalies.push(...temporalAnomalies);

    // Check for consistency anomalies
    const consistencyAnomalies = await this.detectConsistencyAnomalies(data);
    anomalies.push(...consistencyAnomalies);

    return {
      success: true,
      anomalies,
      riskScore: this.calculateRiskScore(anomalies),
      recommendations: this.generateRecommendations(anomalies),
    };
  }

  private async detectValueAnomalies(data: any): Promise<any[]> {
    const anomalies = [];

    // Example: Check if nutritional values are within expected ranges
    if (data.nutritionalData) {
      const { calories, proteins, carbs, fats } = data.nutritionalData;

      // Check macronutrient ratio
      const totalMacros = (proteins * 4) + (carbs * 4) + (fats * 9);
      const calorieDeviation = Math.abs(totalMacros - calories) / calories;

      if (calorieDeviation > 0.1) {
        anomalies.push({
          type: 'VALUE_ANOMALY',
          severity: 'HIGH',
          description: 'Calorie count does not match macronutrient profile',
          deviation: calorieDeviation,
          recommendation: 'Verify nutritional calculations',
        });
      }

      // Check for impossible values
      if (proteins > 100 || carbs > 100 || fats > 100) {
        anomalies.push({
          type: 'VALUE_ANOMALY',
          severity: 'CRITICAL',
          description: 'Nutritional values exceed 100g per serving',
          recommendation: 'Review serving size and nutritional data',
        });
      }
    }

    return anomalies;
  }

  private async detectTemporalAnomalies(data: any): Promise<any[]> {
    const anomalies = [];

    if (data.productId) {
      // Get historical validations
      const historicalValidations = await this.prisma.validation.findMany({
        where: { productId: data.productId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { claims: true },
      });

      if (historicalValidations.length > 1) {
        // Check for sudden changes in values
        for (let i = 1; i < historicalValidations.length; i++) {
          const current = historicalValidations[i - 1];
          const previous = historicalValidations[i];

          // Compare claim values
          for (const currentClaim of current.claims) {
            const previousClaim = previous.claims.find(
              c => c.claimId === currentClaim.claimId
            );

            if (previousClaim && currentClaim.actualValue && previousClaim.actualValue) {
              const currentValue = parseFloat(currentClaim.actualValue);
              const previousValue = parseFloat(previousClaim.actualValue);

              if (!isNaN(currentValue) && !isNaN(previousValue)) {
                const change = Math.abs(currentValue - previousValue) / previousValue;

                if (change > 0.2) {
                  anomalies.push({
                    type: 'TEMPORAL_ANOMALY',
                    severity: 'MEDIUM',
                    description: `Significant change in ${currentClaim.claimId} value`,
                    change: `${(change * 100).toFixed(1)}%`,
                    recommendation: 'Investigate formula or testing methodology changes',
                  });
                }
              }
            }
          }
        }
      }
    }

    return anomalies;
  }

  private async detectConsistencyAnomalies(data: any): Promise<any[]> {
    const anomalies = [];

    // Check for internal consistency
    if (data.claims && Array.isArray(data.claims)) {
      // Check for conflicting claims
      const organicClaim = data.claims.find(c => c.type === 'CERTIFICATION' && c.value.includes('organic'));
      const pesticideClaim = data.claims.find(c => c.type === 'PESTICIDE' && parseFloat(c.value) > 0);

      if (organicClaim && pesticideClaim) {
        anomalies.push({
          type: 'CONSISTENCY_ANOMALY',
          severity: 'HIGH',
          description: 'Product claims organic certification but has pesticide residues',
          recommendation: 'Review organic certification status',
        });
      }

      // Check allergen consistency
      const glutenFreeClaim = data.claims.find(c => c.name?.toLowerCase().includes('gluten-free'));
      const wheatIngredient = data.ingredients?.find((i: string) => i.toLowerCase().includes('wheat'));

      if (glutenFreeClaim && wheatIngredient) {
        anomalies.push({
          type: 'CONSISTENCY_ANOMALY',
          severity: 'CRITICAL',
          description: 'Product claims gluten-free but contains wheat',
          recommendation: 'Urgent review required for allergen claims',
        });
      }
    }

    return anomalies;
  }

  private calculateRiskScore(anomalies: any[]): number {
    const severityWeights = {
      CRITICAL: 1.0,
      HIGH: 0.7,
      MEDIUM: 0.4,
      LOW: 0.2,
    };

    if (anomalies.length === 0) return 0;

    const totalWeight = anomalies.reduce(
      (sum, anomaly) => sum + (severityWeights[anomaly.severity] || 0),
      0
    );

    return Math.min(totalWeight / anomalies.length, 1);
  }

  private generateRecommendations(anomalies: any[]): string[] {
    const recommendations = new Set<string>();

    // Add specific recommendations from anomalies
    anomalies.forEach(anomaly => {
      if (anomaly.recommendation) {
        recommendations.add(anomaly.recommendation);
      }
    });

    // Add general recommendations based on anomaly types
    const hasValueAnomalies = anomalies.some(a => a.type === 'VALUE_ANOMALY');
    const hasTemporalAnomalies = anomalies.some(a => a.type === 'TEMPORAL_ANOMALY');
    const hasConsistencyAnomalies = anomalies.some(a => a.type === 'CONSISTENCY_ANOMALY');

    if (hasValueAnomalies) {
      recommendations.add('Schedule comprehensive laboratory re-testing');
    }

    if (hasTemporalAnomalies) {
      recommendations.add('Document any recent formula or process changes');
    }

    if (hasConsistencyAnomalies) {
      recommendations.add('Review all product claims and certifications');
    }

    return Array.from(recommendations);
  }
}