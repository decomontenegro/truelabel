import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Report {
  id: string;
  fileName: string;
  productName: string;
  productId: string;
  laboratoryName: string;
  laboratoryId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  fileSize: number;
  fileType: string;
  downloadUrl?: string;
  observations?: string;
}

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Carregar relatórios reais
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/reports', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Mapear dados da API para o formato esperado
          const mappedReports = (data.reports || []).map((report: any) => ({
            id: report.id,
            fileName: report.originalName,
            productName: report.product?.name || 'Produto não encontrado',
            productId: report.productId,
            laboratoryName: report.laboratory?.name || 'Laboratório não encontrado',
            laboratoryId: report.laboratoryId,
            status: report.isVerified ? 'APPROVED' : 'PENDING',
            uploadedAt: report.createdAt,
            fileSize: report.fileSize,
            fileType: report.mimeType,
            downloadUrl: `/api/reports/${report.id}/download`,
            observations: report.results || ''
          }));
          setReports(mappedReports);
        } else {
          setReports([]);
        }
      } catch (error) {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendente' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Aprovado' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejeitado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.laboratoryName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpload = async (data: { file: File; productId: string; laboratoryId: string; analysisType: string }) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('productId', data.productId);
      formData.append('laboratoryId', data.laboratoryId);
      formData.append('analysisType', data.analysisType);

      const response = await fetch('http://localhost:3001/api/reports', {
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

      // Recarregar relatórios
      const reportsResponse = await fetch('http://localhost:3001/api/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }

      setShowUploadModal(false);
      toast.success('Relatório enviado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar relatório');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) return;

    try {
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('Relatório excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir relatório');
    }
  };

  const getStatsData = () => {
    const total = reports.length;
    const approved = reports.filter(r => r.status === 'APPROVED').length;
    const pending = reports.filter(r => r.status === 'PENDING').length;
    const rejected = reports.filter(r => r.status === 'REJECTED').length;

    return { total, approved, pending, rejected };
  };

  const stats = getStatsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Gerencie relatórios de análise</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Enviar Relatório
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Relatórios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejeitados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar relatórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="ALL">Todos os status</option>
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovados</option>
              <option value="REJECTED">Rejeitados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum relatório encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {reports.length === 0
                ? 'Comece enviando o primeiro relatório'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar Relatório
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laboratório
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.fileName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(report.fileSize)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {report.laboratoryName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {formatDate(report.uploadedAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {report.downloadUrl && (
                          <button
                            onClick={() => window.open(report.downloadUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {report.downloadUrl && (
                          <button
                            onClick={() => window.open(report.downloadUrl, '_blank')}
                            className="text-green-600 hover:text-green-900"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enviar Relatório
            </h3>

            <UploadComponent
              onUpload={handleUpload}
              uploading={uploading}
              onCancel={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Upload
interface UploadComponentProps {
  onUpload: (data: { file: File; productId: string; laboratoryId: string; analysisType: string }) => void;
  uploading: boolean;
  onCancel: () => void;
}

const UploadComponent: React.FC<UploadComponentProps> = ({ onUpload, uploading, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    productId: '',
    laboratoryId: '',
    analysisType: ''
  });

  // Carregar produtos e laboratórios
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, labsRes] = await Promise.all([
          fetch('http://localhost:3001/api/products', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch('http://localhost:3001/api/laboratories', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        } else {
        }

        if (labsRes.ok) {
          const labsData = await labsRes.json();
          setLaboratories(labsData.laboratories || []);
        } else {
        }
      } catch (error) {
      }
    };
    loadData();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast.error('Apenas arquivos PDF e imagens são aceitos');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast.error('Apenas arquivos PDF e imagens são aceitos');
      }
    }
  };

  const handleSubmit = () => {
    if (selectedFile && formData.productId && formData.laboratoryId && formData.analysisType) {
      onUpload({
        file: selectedFile,
        productId: formData.productId,
        laboratoryId: formData.laboratoryId,
        analysisType: formData.analysisType
      });
    } else {
      toast.error('Preencha todos os campos obrigatórios');
    }
  };

  const isFormValid = selectedFile && formData.productId && formData.laboratoryId && formData.analysisType;

  return (
    <div className="space-y-4">
      {/* Seleção de Produto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Produto *
        </label>
        <select
          value={formData.productId}
          onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
          className="input w-full"
          disabled={uploading}
        >
          <option value="">Selecione um produto</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} - {product.brand}
            </option>
          ))}
        </select>
      </div>

      {/* Seleção de Laboratório */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Laboratório *
        </label>
        <select
          value={formData.laboratoryId}
          onChange={(e) => setFormData(prev => ({ ...prev, laboratoryId: e.target.value }))}
          className="input w-full"
          disabled={uploading}
        >
          <option value="">Selecione um laboratório</option>
          {laboratories.map(lab => (
            <option key={lab.id} value={lab.id}>
              {lab.name} - {lab.accreditation}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de Análise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Análise *
        </label>
        <select
          value={formData.analysisType}
          onChange={(e) => setFormData(prev => ({ ...prev, analysisType: e.target.value }))}
          className="input w-full"
          disabled={uploading}
        >
          <option value="">Selecione o tipo de análise</option>
          <option value="nutritional">Análise Nutricional</option>
          <option value="microbiological">Análise Microbiológica</option>
          <option value="contaminants">Análise de Contaminantes</option>
          <option value="allergens">Análise de Alérgenos</option>
          <option value="protein">Análise de Proteínas</option>
          <option value="gluten">Análise de Glúten</option>
          <option value="other">Outros</option>
        </select>
      </div>

      {/* Upload de Arquivo */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Arraste e solte um arquivo aqui, ou
        </p>
        <label className="cursor-pointer">
          <span className="text-blue-600 hover:text-blue-700 font-medium">
            clique para selecionar
          </span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">
          PDF ou imagens até 10MB
        </p>
      </div>

      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-gray-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-600 hover:text-red-700"
              disabled={uploading}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={uploading}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={!isFormValid || uploading}
        >
          {uploading ? (
            <>
              <div className="loading-spinner w-4 h-4 mr-2"></div>
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Enviar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;