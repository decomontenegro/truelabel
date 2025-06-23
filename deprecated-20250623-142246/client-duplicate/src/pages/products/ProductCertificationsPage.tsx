import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Plus, Upload, Download, RefreshCw } from 'lucide-react';
import { certificationService } from '@/services/certificationService';
import { productService } from '@/services/productService';
import { CertificationBadgeGroup, CertificationModal, CertificationValidatorList } from '@/components/certifications';
import type { Certification, CertificationType } from '@/types/certifications';
import { CERTIFICATION_INFO } from '@/types/certifications';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAsyncAction } from '@/hooks/useAsyncAction';

const ProductCertificationsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const { execute: loadData } = useAsyncAction(async () => {
    if (!productId) return;
    
    const [productData, certificationsData] = await Promise.all([
      productService.getProductById(productId),
      certificationService.getProductCertifications(productId)
    ]);
    
    setProduct(productData);
    setCertifications(certificationsData);
  });

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [productId]);

  const handleRefreshValidations = async () => {
    try {
      const certificationIds = certifications.map(c => c.id);
      const validations = await certificationService.validateCertifications(certificationIds);
      toast.success('Validações atualizadas com sucesso');
      // Atualizar o estado local com os novos status se necessário
    } catch (error) {
      toast.error('Erro ao atualizar validações');
    }
  };

  const handleViewCertification = (certification: Certification) => {
    setSelectedCertification(certification);
    setShowModal(true);
  };

  const handleAddCertification = async (data: CertificationCreateInput) => {
    try {
      const newCertification = await certificationService.createCertification({
        ...data,
        productId: productId!
      });
      setCertifications([...certifications, newCertification]);
      toast.success('Certificação adicionada com sucesso');
      setShowAddForm(false);
    } catch (error) {
      toast.error('Erro ao adicionar certificação');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Produto não encontrado</h2>
          <button
            onClick={() => navigate('/dashboard/products')}
            className="btn btn-primary"
          >
            Voltar para Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/dashboard/products/${productId}`)}
            className="btn btn-outline btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificações do Produto</h1>
            <p className="text-gray-600">{product.name} • {product.brand}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefreshValidations}
            className="btn btn-outline flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Validações
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Certificação
          </button>
        </div>
      </div>

      {/* Certification Badges Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral das Certificações</h2>
        {certifications.length > 0 ? (
          <CertificationBadgeGroup
            certifications={certifications}
            size="md"
            showStatus={true}
            onBadgeClick={handleViewCertification}
            maxDisplay={10}
          />
        ) : (
          <p className="text-gray-500">Nenhuma certificação cadastrada para este produto.</p>
        )}
      </div>

      {/* Certification Validator List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <CertificationValidatorList
          certifications={certifications}
          autoValidate={true}
        />
      </div>

      {/* Add Certification Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Nova Certificação</h2>
          <AddCertificationForm
            onSubmit={handleAddCertification}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Certification Modal */}
      <CertificationModal
        certification={selectedCertification}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

// Add Certification Form Component
const AddCertificationForm: React.FC<{
  onSubmit: (data: CertificationCreateInput) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: CertificationType.ANVISA,
    registrationNumber: '',
    issueDate: '',
    expiryDate: '',
    scope: '',
    verificationUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as CertificationCreateInput);
  };

  const certificationTypes = Object.values(CertificationType).filter(
    type => type !== CertificationType.OTHER
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Tipo de Certificação
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as CertificationType })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          {certificationTypes.map((type) => {
            const info = CERTIFICATION_INFO[type];
            return (
              <option key={type} value={type}>
                {info.icon} {info.name} ({info.abbreviation})
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
            Número de Registro
          </label>
          <input
            type="text"
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
            Escopo
          </label>
          <input
            type="text"
            id="scope"
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Ex: Todos os produtos da linha X"
          />
        </div>

        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
            Data de Emissão
          </label>
          <input
            type="date"
            id="issueDate"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
            Data de Validade
          </label>
          <input
            type="date"
            id="expiryDate"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="verificationUrl" className="block text-sm font-medium text-gray-700">
          URL de Verificação
        </label>
        <input
          type="url"
          id="verificationUrl"
          value={formData.verificationUrl}
          onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="https://exemplo.com/verificar/123456"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          Adicionar Certificação
        </button>
      </div>
    </form>
  );
};

export default ProductCertificationsPage;