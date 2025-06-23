import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Send,
  Settings,
  Mail,
  Repeat
} from 'lucide-react';
import { ExportOptions, ExportSection, ReportSchedule, AnalyticsFilters } from '@/types/analytics';
import { formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ExportReportsProps {
  filters: AnalyticsFilters;
  onExport: (options: ExportOptions) => Promise<void>;
  onSchedule?: (schedule: ReportSchedule) => Promise<void>;
  loading?: boolean;
}

const ExportReports: React.FC<ExportReportsProps> = ({
  filters,
  onExport,
  onSchedule,
  loading = false
}) => {
  const [exportFormat, setExportFormat] = useState<ExportOptions['format']>('pdf');
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview', 'performance', 'insights']);
  const [customization, setCustomization] = useState({
    layout: 'standard' as const,
    language: 'pt' as const,
    includeRawData: false,
    includeCommentary: true
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedule, setSchedule] = useState<Partial<ReportSchedule>>({
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    time: '09:00',
    recipients: [],
    format: 'pdf'
  });
  const [recipientEmail, setRecipientEmail] = useState('');

  const sections: ExportSection[] = [
    { id: 'overview', name: 'Visão Geral', included: true },
    { id: 'performance', name: 'Performance de Produtos', included: true },
    { id: 'geographic', name: 'Análise Geográfica', included: true },
    { id: 'consumer', name: 'Insights do Consumidor', included: true },
    { id: 'predictive', name: 'Análise Preditiva', included: true },
    { id: 'trends', name: 'Tendências', included: true },
    { id: 'recommendations', name: 'Recomendações', included: true }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleExport = async () => {
    const options: ExportOptions = {
      format: exportFormat,
      sections: sections.map(s => ({
        ...s,
        included: selectedSections.includes(s.id)
      })),
      dateRange: {
        start: new Date(filters.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(filters.endDate || Date.now())
      },
      filters,
      customization: {
        branding: {
          companyName: 'True Label'
        },
        ...customization
      }
    };

    try {
      await onExport(options);
      toast.success(`Relatório ${exportFormat.toUpperCase()} exportado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao exportar relatório. Tente novamente.');
    }
  };

  const handleScheduleReport = async () => {
    if (!onSchedule) return;

    if (schedule.recipients?.length === 0) {
      toast.error('Adicione pelo menos um destinatário');
      return;
    }

    try {
      await onSchedule(schedule as ReportSchedule);
      toast.success('Relatório agendado com sucesso!');
      setIsScheduling(false);
      setSchedule({
        frequency: 'weekly',
        dayOfWeek: 1,
        time: '09:00',
        recipients: [],
        format: 'pdf'
      });
    } catch (error) {
      toast.error('Erro ao agendar relatório. Tente novamente.');
    }
  };

  const addRecipient = () => {
    if (!recipientEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Email inválido');
      return;
    }

    setSchedule(prev => ({
      ...prev,
      recipients: [...(prev.recipients || []), recipientEmail]
    }));
    setRecipientEmail('');
  };

  const removeRecipient = (email: string) => {
    setSchedule(prev => ({
      ...prev,
      recipients: prev.recipients?.filter(r => r !== email) || []
    }));
  };

  const getFormatIcon = (format: ExportOptions['format']) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'csv':
        return <File className="h-5 w-5" />;
      case 'json':
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Opções de Exportação</h3>
        
        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Formato do Relatório</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['pdf', 'excel', 'csv', 'json'] as const).map((format) => (
              <button
                key={format}
                onClick={() => setExportFormat(format)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  exportFormat === format
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {getFormatIcon(format)}
                <span className="font-medium uppercase">{format}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Seções do Relatório</label>
          <div className="space-y-2">
            {sections.map((section) => (
              <label
                key={section.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => handleSectionToggle(section.id)}
                  className="mr-3"
                >
                  {selectedSections.includes(section.id) ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                <span className="text-sm font-medium text-gray-700">{section.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Customization Options */}
        {exportFormat === 'pdf' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
              <select
                value={customization.layout}
                onChange={(e) => setCustomization(prev => ({ ...prev, layout: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="standard">Padrão</option>
                <option value="executive">Executivo</option>
                <option value="detailed">Detalhado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
              <select
                value={customization.language}
                onChange={(e) => setCustomization(prev => ({ ...prev, language: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customization.includeRawData}
                  onChange={(e) => setCustomization(prev => ({ ...prev, includeRawData: e.target.checked }))}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Incluir dados brutos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customization.includeCommentary}
                  onChange={(e) => setCustomization(prev => ({ ...prev, includeCommentary: e.target.checked }))}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Incluir comentários e análises</span>
              </label>
            </div>
          </div>
        )}

        {/* Date Range Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <Calendar className="inline h-4 w-4 mr-1" />
            Período do relatório: {formatDate(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))} 
            {' - '}
            {formatDate(filters.endDate || new Date())}
          </p>
        </div>

        {/* Export Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleExport}
            disabled={loading || selectedSections.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar Relatório
          </button>

          {onSchedule && (
            <button
              onClick={() => setIsScheduling(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Repeat className="h-4 w-4" />
              Agendar Relatório
            </button>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduling && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendar Relatório</h3>
            
            <div className="space-y-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                <select
                  value={schedule.frequency}
                  onChange={(e) => setSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                </select>
              </div>

              {/* Day of Week (for weekly) */}
              {schedule.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) => setSchedule(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sábado</option>
                  </select>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {schedule.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia do Mês</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={schedule.dayOfMonth || 1}
                    onChange={(e) => setSchedule(prev => ({ ...prev, dayOfMonth: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => setSchedule(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatários</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addRecipient}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {schedule.recipients?.map((email) => (
                    <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        onClick={() => removeRecipient(email)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                <select
                  value={schedule.format}
                  onChange={(e) => setSchedule(prev => ({ ...prev, format: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsScheduling(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleScheduleReport}
                disabled={loading || schedule.recipients?.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing import
const X = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

export default ExportReports;