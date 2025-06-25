import { useState } from 'react';
import { FileText, Download, Send, Calendar, User, Building } from 'lucide-react';
import { NutritionReport, NutritionFacts, HealthClaim } from '@/types/nutrition';
import { nutritionService } from '@/services/nutritionService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { cn } from '@/lib/utils';

interface NutritionReportGeneratorProps {
  productId: string;
  productName: string;
  nutritionFacts: NutritionFacts;
  healthClaims: string[];
  onReportGenerated?: (report: NutritionReport) => void;
}

const NutritionReportGenerator: React.FC<NutritionReportGeneratorProps> = ({
  productId,
  productName,
  nutritionFacts,
  healthClaims,
  onReportGenerated
}) => {
  const [targetMarket, setTargetMarket] = useState<'BRAZIL' | 'USA' | 'EU' | 'MERCOSUL'>('BRAZIL');
  const [certifierInfo, setCertifierInfo] = useState({
    name: '',
    credentials: '',
    registrationNumber: ''
  });
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeCompliance, setIncludeCompliance] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);

  const { execute: generateReport, loading: generating } = useAsyncAction(
    async () => {
      const report = await nutritionService.generateReport(productId, {
        nutritionFacts,
        healthClaims,
        targetMarket
      });
      onReportGenerated?.(report);
      return report;
    }
  );

  const { execute: exportReport, loading: exporting } = useAsyncAction(
    async (format: 'PDF' | 'EXCEL' | 'JSON') => {
      const blob = await nutritionService.exportNutritionData(productId, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nutrition-report-${productName}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  );

  const handleGenerateReport = () => {
    generateReport();
  };

  const reportSections = [
    {
      id: 'nutrition',
      title: 'Informações Nutricionais',
      description: 'Tabela nutricional completa com valores por porção e por 100g',
      included: true
    },
    {
      id: 'scores',
      title: 'Pontuações Nutricionais',
      description: 'Nutri-Score, Health Star Rating e outras classificações',
      included: true
    },
    {
      id: 'claims',
      title: 'Alegações de Saúde',
      description: 'Validação e análise de alegações nutricionais e de saúde',
      included: true
    },
    {
      id: 'compliance',
      title: 'Conformidade Regulatória',
      description: 'Verificação de conformidade com regulamentações',
      included: includeCompliance
    },
    {
      id: 'comparison',
      title: 'Comparação com Categoria',
      description: 'Análise comparativa com médias da categoria',
      included: includeComparison
    },
    {
      id: 'recommendations',
      title: 'Recomendações',
      description: 'Sugestões de melhoria e otimização nutricional',
      included: includeRecommendations
    }
  ];

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Configurar Relatório</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Market */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mercado Alvo
            </label>
            <select
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value as any)}
              className="select"
            >
              <option value="BRAZIL">Brasil (ANVISA)</option>
              <option value="USA">Estados Unidos (FDA)</option>
              <option value="EU">União Europeia</option>
              <option value="MERCOSUL">MERCOSUL</option>
            </select>
          </div>

          {/* Report Sections */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seções do Relatório
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCompliance}
                  onChange={(e) => setIncludeCompliance(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Incluir análise de conformidade
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeComparison}
                  onChange={(e) => setIncludeComparison(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Incluir comparação com categoria
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeRecommendations}
                  onChange={(e) => setIncludeRecommendations(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Incluir recomendações
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Certifier Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Informações do Nutricionista (Opcional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome</label>
              <input
                type="text"
                value={certifierInfo.name}
                onChange={(e) => setCertifierInfo({ ...certifierInfo, name: e.target.value })}
                placeholder="Nome completo"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Credenciais</label>
              <input
                type="text"
                value={certifierInfo.credentials}
                onChange={(e) => setCertifierInfo({ ...certifierInfo, credentials: e.target.value })}
                placeholder="CRN, título, etc."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Registro</label>
              <input
                type="text"
                value={certifierInfo.registrationNumber}
                onChange={(e) => setCertifierInfo({ ...certifierInfo, registrationNumber: e.target.value })}
                placeholder="Número de registro"
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Prévia do Relatório</h3>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h4 className="text-xl font-bold text-gray-900">
                Relatório de Análise Nutricional
              </h4>
              <p className="text-gray-600 mt-1">{productName}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center justify-end mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date().toLocaleDateString('pt-BR')}
              </div>
              {certifierInfo.name && (
                <div className="flex items-center justify-end">
                  <User className="h-4 w-4 mr-1" />
                  {certifierInfo.name}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {reportSections.filter(s => s.included).map((section) => (
              <div key={section.id} className="border-l-4 border-primary-500 pl-4">
                <h5 className="font-medium text-gray-900">{section.title}</h5>
                <p className="text-sm text-gray-600">{section.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <Building className="h-4 w-4 mr-2" />
              <span>Relatório gerado para o mercado: {targetMarket}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Ações</h3>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn-primary flex items-center"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Exportar como:</span>
            <button
              onClick={() => exportReport('PDF')}
              disabled={exporting || !productId}
              className="btn-outline flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button
              onClick={() => exportReport('EXCEL')}
              disabled={exporting || !productId}
              className="btn-outline flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </button>
            <button
              onClick={() => exportReport('JSON')}
              disabled={exporting || !productId}
              className="btn-outline flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </button>
          </div>

          <button
            disabled={!productId}
            className="btn-outline flex items-center ml-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar por Email
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Sobre os Relatórios Nutricionais</p>
            <ul className="space-y-1 text-xs">
              <li>• Os relatórios são gerados com base nas informações nutricionais fornecidas</li>
              <li>• A conformidade é verificada de acordo com as regulamentações do mercado selecionado</li>
              <li>• As pontuações nutricionais seguem metodologias internacionalmente reconhecidas</li>
              <li>• Para uso oficial, recomenda-se a revisão por um nutricionista registrado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionReportGenerator;