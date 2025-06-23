import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Certification, CertificationFilters, CertificationStatistics } from '@/types/certifications';
import { certificationService } from '@/services/certificationService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import CertificationUploader from '@/components/certifications/CertificationUploader';
import ExpirationAlerts from '@/components/certifications/ExpirationAlerts';
import toast from 'react-hot-toast';

const CertificationsManagementPage: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [statistics, setStatistics] = useState<CertificationStatistics | null>(null);
  const [filters, setFilters] = useState<CertificationFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    type: undefined
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showUploader, setShowUploader] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);

  const { execute: loadCertifications, loading } = useAsyncAction(async () => {
    try {
      const response = await certificationService.getCertifications(filters);
      if (response && response.data) {
        setCertifications(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        setCertifications([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading certifications:', error);
      setCertifications([]);
      setTotalPages(1);
    }
  });

  const { execute: loadStatistics } = useAsyncAction(async () => {
    const stats = await certificationService.getCertificationStatistics();
    setStatistics(stats);
  });

  useEffect(() => {
    loadCertifications();
    loadStatistics();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleBulkDelete = async () => {
    if (!selectedCertifications || selectedCertifications.length === 0) {
      toast.error('Selecione pelo menos uma certificação');
      return;
    }

    if (!confirm(`Deseja remover ${selectedCertifications.length} certificação(ões)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedCertifications.map(id => certificationService.deleteCertification(id))
      );
      toast.success('Certificações removidas com sucesso!');
      setSelectedCertifications([]);
      loadCertifications();
      loadStatistics();
    } catch (error) {
      toast.error('Erro ao remover certificações');
    }
  };

  const exportCertifications = async () => {
    try {
      // In a real implementation, this would call an API endpoint to generate a CSV/Excel file
      const csvContent = [
        ['Nome', 'Tipo', 'Emissor', 'Número', 'Status', 'Data de Emissão', 'Data de Expiração'],
        ...certifications.map(cert => [
          cert.name,
          certificationService.getCertificationTypeLabel(cert.type),
          cert.issuer,
          cert.number,
          certificationService.getCertificationStatusLabel(cert.status),
          new Date(cert.issueDate).toLocaleDateString('pt-BR'),
          new Date(cert.expiryDate).toLocaleDateString('pt-BR')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certifications_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificações exportadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar certificações');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedCertifications(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!certifications || !selectedCertifications) return;
    
    if (selectedCertifications.length === certifications.length) {
      setSelectedCertifications([]);
    } else {
      setSelectedCertifications(certifications.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Certificações</h1>
          <p className="text-gray-600 mt-1">
            Gerencie certificações e selos de qualidade dos produtos
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCertifications}
            className="btn btn-outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setShowUploader(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Certificação
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiradas</p>
                <p className="text-2xl font-bold text-red-600">{statistics.expired}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expirando</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.expiringSoon}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Buscar certificações..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos os Status</option>
                <option value="ACTIVE">Ativo</option>
                <option value="EXPIRED">Expirado</option>
                <option value="PENDING">Pendente</option>
                <option value="SUSPENDED">Suspenso</option>
                <option value="REVOKED">Revogado</option>
              </select>
              
              <select
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any || undefined })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos os Tipos</option>
                <option value="ISO">ISO</option>
                <option value="HACCP">HACCP</option>
                <option value="ORGANIC">Orgânico</option>
                <option value="FAIRTRADE">Comércio Justo</option>
                <option value="KOSHER">Kosher</option>
                <option value="HALAL">Halal</option>
                <option value="VEGAN">Vegano</option>
                <option value="NON_GMO">Não-OGM</option>
                <option value="GLUTEN_FREE">Sem Glúten</option>
              </select>
              
              <button type="submit" className="btn btn-primary">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </button>
            </form>
          </div>

          {/* Bulk Actions */}
          {selectedCertifications && selectedCertifications.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  {selectedCertifications.length} certificação(ões) selecionada(s)
                </p>
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                  Remover Selecionadas
                </button>
              </div>
            </div>
          )}

          {/* Certifications List */}
          <div className="bg-white rounded-lg shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : !certifications || certifications.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma certificação encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece adicionando sua primeira certificação
                </p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Certificação
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedCertifications && certifications && selectedCertifications.length === certifications.length}
                            onChange={selectAll}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emissor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiração
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {certifications && certifications.map((certification) => {
                        const statusColor = certificationService.getCertificationStatusColor(certification.status);
                        const daysUntilExpiry = certificationService.getDaysUntilExpiry(certification.expiryDate);
                        
                        return (
                          <tr key={certification.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedCertifications && selectedCertifications.includes(certification.id)}
                                onChange={() => toggleSelection(certification.id)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {certification.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  #{certification.number}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {certificationService.getCertificationTypeLabel(certification.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {certification.issuer}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                                {certificationService.getCertificationStatusLabel(certification.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm">
                                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                <span className={daysUntilExpiry < 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                  {certificationService.formatExpiryDate(certification.expiryDate)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Link
                                  to={`/dashboard/certifications/${certification.id}`}
                                  className="text-primary-600 hover:text-primary-700"
                                >
                                  <FileText className="w-4 h-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination
                    currentPage={filters.page || 1}
                    totalPages={totalPages}
                    onPageChange={(page) => setFilters({ ...filters, page })}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Expiration Alerts */}
          <ExpirationAlerts />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="w-full btn btn-outline justify-start"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload em Massa
              </button>
              <Link
                to="/dashboard/certifications/calendar"
                className="w-full btn btn-outline justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendário de Expirações
              </Link>
              <Link
                to="/dashboard/certifications/analytics"
                className="w-full btn btn-outline justify-start"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatório de Certificações
              </Link>
            </div>
          </div>

          {/* Upcoming Expirations */}
          {statistics && statistics.upcomingExpirations && statistics.upcomingExpirations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Próximas Expirações
              </h3>
              <div className="space-y-3">
                {statistics.upcomingExpirations.slice(0, 5).map(({ certification, daysUntilExpiry }) => (
                  <div key={certification.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {certification.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {certification.issuer}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${
                      daysUntilExpiry < 30 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {daysUntilExpiry} dias
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CertificationUploader
              onUploadComplete={(certification) => {
                setShowUploader(false);
                loadCertifications();
                loadStatistics();
                toast.success('Certificação adicionada com sucesso!');
              }}
            />
            <div className="p-4 border-t">
              <button
                onClick={() => setShowUploader(false)}
                className="btn btn-outline w-full"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationsManagementPage;