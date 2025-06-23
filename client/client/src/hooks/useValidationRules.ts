import { useState, useCallback } from 'react';
import { 
  ProductAnalysis, 
  validateProductAnalysis,
  ValidationResult,
  calculateOverallStatus,
  generateValidationFeedback 
} from '@/config/validationRules';
import { validationService } from '@/services/validationService';

interface UseValidationRulesReturn {
  isValidating: boolean;
  validationResults: ValidationResult[] | null;
  overallStatus: ReturnType<typeof calculateOverallStatus> | null;
  feedback: ReturnType<typeof generateValidationFeedback> | null;
  validateAnalysis: (analysis: ProductAnalysis) => void;
  validateReport: (reportData: any) => Promise<{
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  clearResults: () => void;
}

export const useValidationRules = (): UseValidationRulesReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [overallStatus, setOverallStatus] = useState<ReturnType<typeof calculateOverallStatus> | null>(null);
  const [feedback, setFeedback] = useState<ReturnType<typeof generateValidationFeedback> | null>(null);

  const validateAnalysis = useCallback((analysis: ProductAnalysis) => {
    setIsValidating(true);
    
    try {
      const { results, overallStatus, feedback } = validateProductAnalysis(analysis);
      
      setValidationResults(results);
      setOverallStatus(overallStatus);
      setFeedback(feedback);
    } catch (error) {
      console.error('Error validating analysis:', error);
      // Reset state on error
      setValidationResults(null);
      setOverallStatus(null);
      setFeedback(null);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateReport = useCallback(async (reportData: any) => {
    setIsValidating(true);
    
    try {
      const result = await validationService.checkRegulatoryCompliance(reportData);
      return result;
    } catch (error) {
      console.error('Error validating report:', error);
      return {
        isCompliant: false,
        issues: ['Erro ao validar relatório'],
        recommendations: []
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setValidationResults(null);
    setOverallStatus(null);
    setFeedback(null);
  }, []);

  return {
    isValidating,
    validationResults,
    overallStatus,
    feedback,
    validateAnalysis,
    validateReport,
    clearResults
  };
};

// Helper hook for formatting validation data from various sources
export const useValidationDataFormatter = () => {
  const formatReportForValidation = useCallback((report: any): ProductAnalysis => {
    // Extract and format microbiological data
    const microbiological = report.analyses?.microbiological?.map((item: any) => ({
      parameter: item.parameter || item.name,
      value: parseFloat(item.value) || 0,
      unit: item.unit || 'CFU/g'
    })) || [];

    // Extract and format heavy metals data
    const heavyMetals = report.analyses?.heavyMetals?.map((item: any) => ({
      parameter: item.parameter || item.name,
      value: parseFloat(item.value) || 0,
      unit: item.unit || 'mg/kg'
    })) || [];

    // Extract and format pesticides data
    const pesticides = report.analyses?.pesticides?.map((item: any) => ({
      parameter: item.parameter || item.name,
      value: parseFloat(item.value) || 0,
      unit: item.unit || 'mg/kg'
    })) || [];

    // Extract and format mycotoxins data
    const mycotoxins = report.analyses?.mycotoxins?.map((item: any) => ({
      parameter: item.parameter || item.name,
      value: parseFloat(item.value) || 0,
      unit: item.unit || 'μg/kg'
    })) || [];

    // Extract and format nutritional data
    const nutritional = report.analyses?.nutritional?.map((item: any) => ({
      parameter: item.parameter || item.name,
      declaredValue: parseFloat(item.declaredValue) || parseFloat(item.declared) || 0,
      actualValue: parseFloat(item.actualValue) || parseFloat(item.actual) || parseFloat(item.value) || 0,
      unit: item.unit || 'g'
    })) || [];

    return {
      microbiological,
      heavyMetals,
      pesticides,
      mycotoxins,
      nutritional
    };
  }, []);

  const formatValidationSummary = useCallback((
    overallStatus: ReturnType<typeof calculateOverallStatus>,
    validationResults: ValidationResult[]
  ) => {
    const parametersByStatus = {
      approved: validationResults.filter(r => r.status === 'approved').map(r => r.parameter),
      warning: validationResults.filter(r => r.status === 'warning').map(r => r.parameter),
      rejected: validationResults.filter(r => r.status === 'rejected').map(r => r.parameter)
    };

    return {
      status: overallStatus.status,
      summary: overallStatus.summary,
      statistics: {
        total: validationResults.length,
        approved: parametersByStatus.approved.length,
        warnings: parametersByStatus.warning.length,
        rejected: parametersByStatus.rejected.length,
        approvalRate: validationResults.length > 0 
          ? (parametersByStatus.approved.length / validationResults.length * 100).toFixed(1)
          : '0'
      },
      parametersByStatus,
      criticalParameters: validationResults
        .filter(r => r.status === 'rejected')
        .map(r => ({
          parameter: r.parameter,
          value: r.value,
          unit: r.unit,
          message: r.message,
          reference: r.regulatoryReference
        }))
    };
  }, []);

  return {
    formatReportForValidation,
    formatValidationSummary
  };
};

export default useValidationRules;