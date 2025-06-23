import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { reportParserService, ParsedReportData } from '@/services/reportParserService';
import { reportService } from '@/services/reportService';
import { laboratoryService } from '@/services/laboratoryService';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface EnhancedReportUploadProps {
  productId: string;
  onUploadSuccess?: (report: any) => void;
  onClose?: () => void;
}

interface UploadFormData {
  file: FileList;
  laboratoryId: string;
  analysisType: string;
  results?: string;
}

const EnhancedReportUpload: React.FC<EnhancedReportUploadProps> = ({
  productId,
  onUploadSuccess,
  onClose
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReportData | null>(null);
  const [showParsedData, setShowParsedData] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<UploadFormData>();

  // Load laboratories
  const { data: laboratories = [], loading: loadingLabs } = useAsyncAction(
    async () => {
      const response = await laboratoryService.getLaboratories();
      return response.data || [];
    },
    []
  );

  // Analysis types
  const analysisTypes = [
    { value: 'nutritional', label: 'Análise Nutricional' },
    { value: 'microbiological', label: 'Análise Microbiológica' },
    { value: 'heavyMetals', label: 'Metais Pesados' },
    { value: 'pesticides', label: 'Pesticidas' },
    { value: 'allergens', label: 'Alérgenos' },
    { value: 'physicalChemical', label: 'Físico-Química' },
    { value: 'complete', label: 'Análise Completa' },
    { value: 'other', label: 'Outros' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
      setValue('file', e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = async (file: File) => {
    setSelectedFile(file);
    setParsedData(null);
    
    // Automatically parse the file
    if (file.type === 'application/pdf' || file.type.startsWith('image/') || file.type === 'text/plain') {
      await parseReport(file);
    }
  };

  const parseReport = async (file: File) => {
    setIsParsing(true);
    try {
      const result = await reportParserService.parseReport(file);
      setParsedData(result);
      
      // Auto-detect laboratory if possible
      if (result.laboratoryFormat !== 'UNKNOWN') {
        const matchingLab = laboratories.find(lab => 
          lab.name.toLowerCase().includes(result.laboratoryFormat.toLowerCase())
        );
        if (matchingLab) {
          setValue('laboratoryId', matchingLab.id);
        }
      }
      
      // Auto-detect analysis type
      if (result.microbiological && Object.keys(result.microbiological).length > 0) {
        setValue('analysisType', 'microbiological');
      } else if (result.heavyMetals && Object.keys(result.heavyMetals).length > 0) {
        setValue('analysisType', 'heavyMetals');
      } else if (result.nutritional && Object.keys(result.nutritional).length > 0) {
        setValue('analysisType', 'nutritional');
      }
      
      toast.success(`Relatório analisado com ${result.confidence}% de confiança`);
    } catch (error) {
      toast.error('Erro ao analisar o relatório');
    } finally {
      setIsParsing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    setIsUploading(true);

    try {
      // Prepare the report data with parsed information
      const reportData = {
        productId,
        laboratoryId: data.laboratoryId,
        analysisType: data.analysisType,
        results: parsedData ? JSON.stringify({
          ...parsedData,
          manualNotes: data.results
        }) : data.results,
        report: selectedFile
      };

      const response = await reportService.createReport(reportData);
      
      toast.success('Laudo enviado com sucesso!');
      onUploadSuccess?.(response);
      onClose?.();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro no upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload de Laudo Inteligente</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo do Laudo *
            </label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
                ${selectedFile ? 'border-green-500 bg-green-50' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  
                  {isParsing && (
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analisando relatório...</span>
                    </div>
                  )}
                  
                  {parsedData && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-blue-900">
                          Análise Automática Concluída
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowParsedData(!showParsedData)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">{showParsedData ? 'Ocultar' : 'Ver'} Detalhes</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Laboratório:</span>
                          <span className="ml-2 font-medium">{parsedData.laboratoryFormat}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confiança:</span>
                          <span className="ml-2 font-medium">{parsedData.confidence}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Data Pontos:</span>
                          <span className="ml-2 font-medium">{parsedData.dataPoints.length}</span>
                        </div>
                        {parsedData.reportNumber && (
                          <div>
                            <span className="text-gray-600">Nº Relatório:</span>
                            <span className="ml-2 font-medium">{parsedData.reportNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, imagens ou texto - Análise automática disponível
                  </p>
                </div>
              )}
              
              <input
                type="file"
                {...register('file', { required: 'Arquivo é obrigatório' })}
                onChange={handleFileSelect}
                accept=".pdf,.txt,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              
              {!selectedFile && (
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
                >
                  Selecionar Arquivo
                </label>
              )}
            </div>
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
            )}
          </div>

          {/* Show parsed data details */}
          {showParsedData && parsedData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-900">Dados Extraídos</h4>
              
              {/* Analysis summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {parsedData.microbiological && Object.keys(parsedData.microbiological).length > 0 && (
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-xs text-gray-500">Microbiológico</span>
                    <p className="font-semibold">{Object.keys(parsedData.microbiological).length} testes</p>
                  </div>
                )}
                {parsedData.heavyMetals && Object.keys(parsedData.heavyMetals).length > 0 && (
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-xs text-gray-500">Metais Pesados</span>
                    <p className="font-semibold">{Object.keys(parsedData.heavyMetals).length} elementos</p>
                  </div>
                )}
                {parsedData.nutritional && Object.keys(parsedData.nutritional).length > 0 && (
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-xs text-gray-500">Nutricional</span>
                    <p className="font-semibold">{Object.keys(parsedData.nutritional).length} nutrientes</p>
                  </div>
                )}
                {parsedData.allergens && (
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-xs text-gray-500">Alérgenos</span>
                    <p className="font-semibold">
                      {parsedData.allergens.contains.length + parsedData.allergens.mayContain.length} detectados
                    </p>
                  </div>
                )}
              </div>

              {/* Data points preview */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Pontos de Dados (primeiros 10)</h5>
                <div className="space-y-1">
                  {parsedData.dataPoints.slice(0, 10).map((dp, index) => (
                    <div key={index} className="text-sm flex justify-between py-1 border-b">
                      <span className="text-gray-600">{dp.name}:</span>
                      <span className="font-medium">
                        {dp.value} {dp.unit || ''}
                        {dp.validationStatus && (
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            dp.validationStatus === 'PASSED' ? 'bg-green-100 text-green-800' :
                            dp.validationStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {dp.validationStatus}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {parsedData.extractionErrors && parsedData.extractionErrors.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-1">Avisos de Extração</h5>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {parsedData.extractionErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Laboratory Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Laboratório *
            </label>
            <select
              {...register('laboratoryId', { required: 'Laboratório é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loadingLabs}
            >
              <option value="">Selecione um laboratório</option>
              {laboratories.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} - {lab.accreditation}
                </option>
              ))}
            </select>
            {errors.laboratoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.laboratoryId.message}</p>
            )}
          </div>

          {/* Analysis Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Análise *
            </label>
            <select
              {...register('analysisType', { required: 'Tipo de análise é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione o tipo de análise</option>
              {analysisTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.analysisType && (
              <p className="mt-1 text-sm text-red-600">{errors.analysisType.message}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações Adicionais
            </label>
            <textarea
              {...register('results')}
              rows={3}
              placeholder="Adicione observações ou informações complementares..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              As informações extraídas automaticamente serão combinadas com suas observações
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isUploading || !selectedFile || isParsing}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Enviar Laudo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedReportUpload;