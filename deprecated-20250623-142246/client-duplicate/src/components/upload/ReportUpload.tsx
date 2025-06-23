import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface ReportUploadProps {
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

const ReportUpload: React.FC<ReportUploadProps> = ({
  productId,
  onUploadSuccess,
  onClose
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<UploadFormData>();

  const watchedFile = watch('file');

  // Tipos de análise disponíveis
  const analysisTypes = [
    { value: 'nutritional', label: 'Análise Nutricional' },
    { value: 'gluten', label: 'Análise de Glúten' },
    { value: 'protein', label: 'Análise de Proteína' },
    { value: 'microbiological', label: 'Análise Microbiológica' },
    { value: 'chemical', label: 'Análise Química' },
    { value: 'allergens', label: 'Análise de Alérgenos' },
    { value: 'other', label: 'Outros' }
  ];

  // Laboratórios mock (em produção viria da API)
  const laboratories = [
    { id: '1', name: 'Lab Análises Técnicas', accreditation: 'ISO/IEC 17025' },
    { id: '2', name: 'Instituto de Qualidade', accreditation: 'INMETRO' },
    { id: '3', name: 'Centro de Pesquisas', accreditation: 'ISO/IEC 17025' }
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
      setSelectedFile(file);
      setValue('file', e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
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
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('productId', productId);
      formData.append('laboratoryId', data.laboratoryId);
      formData.append('analysisType', data.analysisType);
      
      if (data.results) {
        formData.append('results', data.results);
      }

      const response = await fetch('/api/upload/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload');
      }

      const result = await response.json();
      
      toast.success('Laudo enviado com sucesso!');
      onUploadSuccess?.(result.report);
      onClose?.();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro no upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload de Laudo</h2>
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
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX ou imagens até 10MB
                  </p>
                </div>
              )}
              
              <input
                type="file"
                {...register('file', { required: 'Arquivo é obrigatório' })}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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

          {/* Laboratory Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Laboratório *
            </label>
            <select
              {...register('laboratoryId', { required: 'Laboratório é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

          {/* Results (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resultados (Opcional)
            </label>
            <textarea
              {...register('results')}
              rows={4}
              placeholder="Descreva os principais resultados do laudo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Você pode adicionar um resumo dos resultados para facilitar a validação
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
              disabled={isUploading || !selectedFile}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

export default ReportUpload;
