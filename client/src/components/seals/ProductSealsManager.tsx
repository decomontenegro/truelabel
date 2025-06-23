import React, { useState, useEffect } from 'react';
import {
  Shield,
  Award,
  Leaf,
  Heart,
  TreePine,
  Plus,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Product } from '@/types';
import { Seal, ProductSeal, SEAL_CATEGORIES } from '@/types/seals';
import { sealService } from '@/services/sealService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ProductSealsManagerProps {
  product: Product;
  onUpdate?: () => void;
}

const ProductSealsManager: React.FC<ProductSealsManagerProps> = ({ product, onUpdate }) => {
  const [productSeals, setProductSeals] = useState<ProductSeal[]>([]);
  const [availableSeals, setAvailableSeals] = useState<Seal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSeal, setSelectedSeal] = useState<Seal | null>(null);
  const [compliance, setCompliance] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [product.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar selos disponíveis (sempre funciona com fallback local)
      const sealsResponse = await sealService.getSeals({ isActive: true });

      const availableSeals = sealsResponse?.seals || [];

      // Verificar se os selos têm a estrutura correta
      if (availableSeals.length > 0) {
      }

      setAvailableSeals(availableSeals);

      // Carregar selos do produto
      try {
        const productSealsResponse = await sealService.getProductSeals({ productId: product.id });

        const productSeals = productSealsResponse?.productSeals || [];
        setProductSeals(productSeals);

        // Calcular compliance
        const existingSealIds = productSeals.map((ps: ProductSeal) => ps.sealId);
        const missingRequiredSeals = availableSeals.filter((seal: Seal) =>
          seal.isRequired && !existingSealIds.includes(seal.id)
        );

        const expiredSeals = productSeals.filter((ps: ProductSeal) =>
          ps.expiryDate && sealService.isSealExpired(ps.expiryDate)
        );

        const validSeals = productSeals.filter((ps: ProductSeal) =>
          ps.status === 'VERIFIED' && (!ps.expiryDate || !sealService.isSealExpired(ps.expiryDate))
        );

        const isCompliant = missingRequiredSeals.length === 0 && expiredSeals.length === 0;

        setCompliance({
          isCompliant,
          missingRequiredSeals,
          expiredSeals,
          validSeals,
          warnings: isCompliant ? [] : ['Produto não está em conformidade com todos os requisitos']
        });


      } catch (error) {

        // Fallback: inicializar com dados vazios
        setProductSeals([]);
        setCompliance({
          isCompliant: false,
          missingRequiredSeals: availableSeals.filter(s => s.isRequired),
          expiredSeals: [],
          validSeals: [],
          warnings: ['Erro ao carregar selos do produto. Usando dados locais.']
        });
      }

    } catch (error) {
      toast.error('Erro ao carregar selos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeal = async (sealData: any) => {
    try {
      if (!selectedSeal) {
        toast.error('Nenhum selo selecionado');
        return;
      }


      // Preparar dados para a API
      const productSealData = {
        productId: product.id,
        sealId: selectedSeal.id,
        certificateNumber: sealData.certificateNumber || undefined,
        issuedDate: sealData.issuedDate || undefined,
        expiryDate: sealData.expiryDate || undefined,
        validatingLaboratory: sealData.validatingLaboratory || undefined,
        documentUrl: sealData.documentUrl || undefined,
        notes: sealData.notes || undefined
      };


      // Chamar API para adicionar selo
      const response = await sealService.addProductSeal(productSealData);


      // Atualizar lista de selos do produto
      await loadData();

      // Fechar modal
      setShowAddModal(false);
      setSelectedSeal(null);

      toast.success('Selo adicionado com sucesso!');

      // Callback para atualizar componente pai se necessário
      onUpdate?.();

    } catch (error: any) {

      // Tratar diferentes tipos de erro
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Dados inválidos';
        toast.error(typeof errorMessage === 'string' ? errorMessage : 'Dados inválidos');
      } else if (error.response?.status === 404) {
        toast.error('Produto ou selo não encontrado');
      } else {
        toast.error('Erro ao adicionar selo. Tente novamente.');
      }
    }
  };

  const handleRemoveSeal = async (productSealId: string) => {
    if (!confirm('Tem certeza que deseja remover este selo?')) return;

    try {

      // Chamar API para remover selo
      await sealService.removeProductSeal(productSealId);


      // Atualizar lista de selos do produto
      await loadData();

      toast.success('Selo removido com sucesso!');

      // Callback para atualizar componente pai se necessário
      onUpdate?.();

    } catch (error: any) {

      // Tratar diferentes tipos de erro
      if (error.response?.status === 404) {
        toast.error('Selo não encontrado');
      } else {
        toast.error('Erro ao remover selo. Tente novamente.');
      }
    }
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return CheckCircle;
      case 'PENDING': return Clock;
      case 'EXPIRED': return AlertTriangle;
      case 'INVALID': return X;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Status */}
      {compliance && (
        <div className={`p-4 rounded-lg border ${
          compliance.isCompliant
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center mb-2">
            {compliance.isCompliant ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            )}
            <h3 className={`font-semibold ${
              compliance.isCompliant ? 'text-green-800' : 'text-red-800'
            }`}>
              {compliance.isCompliant ? 'Produto em Conformidade' : 'Produto Não Conforme'}
            </h3>
          </div>

          {compliance.missingRequiredSeals.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-red-700 font-medium">Selos obrigatórios faltantes:</p>
              <ul className="text-sm text-red-600 ml-4">
                {compliance.missingRequiredSeals.map((seal: Seal) => (
                  <li key={seal.id}>• {seal.name}</li>
                ))}
              </ul>
            </div>
          )}

          {compliance.expiredSeals.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-red-700 font-medium">Selos expirados:</p>
              <ul className="text-sm text-red-600 ml-4">
                {compliance.expiredSeals.map((productSeal: ProductSeal) => (
                  <li key={productSeal.id}>• {productSeal.seal.name}</li>
                ))}
              </ul>
            </div>
          )}

          {compliance.warnings.length > 0 && (
            <div>
              <p className="text-sm text-yellow-700 font-medium">Avisos:</p>
              <ul className="text-sm text-yellow-600 ml-4">
                {compliance.warnings.map((warning: string, index: number) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Product Seals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Selos do Produto ({productSeals.length})
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Selo
          </button>
        </div>

        {productSeals.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum selo adicionado
            </h4>
            <p className="text-gray-600 mb-4">
              Adicione selos para validar as claims do produto
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              Adicionar Primeiro Selo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productSeals.map((productSeal) => {
              const IconComponent = getCategoryIcon(productSeal.seal.category);
              const StatusIcon = getStatusIcon(productSeal.status);
              const categoryColor = getCategoryColor(productSeal.seal.category);
              const statusColor = sealService.getSealStatusColor(productSeal.status);

              return (
                <div key={productSeal.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg bg-${categoryColor}-100 mr-3`}>
                        <IconComponent className={`w-5 h-5 text-${categoryColor}-600`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {productSeal.seal.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {productSeal.seal.purpose}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSeal(productSeal.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <div className="flex items-center">
                        <StatusIcon className={`w-4 h-4 text-${statusColor}-600 mr-1`} />
                        <span className={`text-sm font-medium text-${statusColor}-600`}>
                          {sealService.getSealStatusLabel(productSeal.status)}
                        </span>
                      </div>
                    </div>

                    {productSeal.certificateNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Certificado:</span>
                        <span className="text-sm font-mono text-gray-900">
                          {productSeal.certificateNumber}
                        </span>
                      </div>
                    )}

                    {productSeal.expiryDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Expira em:</span>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          <span className={`text-sm ${
                            sealService.isSealExpired(productSeal.expiryDate)
                              ? 'text-red-600 font-medium'
                              : 'text-gray-900'
                          }`}>
                            {sealService.formatExpiryDate(productSeal.expiryDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {productSeal.validatingLaboratory && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Laboratório:</span>
                        <span className="text-sm text-gray-900">
                          {productSeal.validatingLaboratory}
                        </span>
                      </div>
                    )}

                    {productSeal.documentUrl && (
                      <div className="pt-2">
                        <a
                          href={productSeal.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Ver Documento
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Seal Modal */}
      {showAddModal && (
        <AddSealModal
          availableSeals={availableSeals}
          productSeals={productSeals}
          onClose={() => {
            setShowAddModal(false);
            setSelectedSeal(null);
          }}
          onSelectSeal={setSelectedSeal}
          onAddSeal={handleAddSeal}
          selectedSeal={selectedSeal}
        />
      )}
    </div>
  );
};

// Modal para adicionar selo (implementação simplificada)
const AddSealModal: React.FC<any> = ({
  availableSeals,
  productSeals,
  onClose,
  onSelectSeal,
  onAddSeal,
  selectedSeal
}) => {
  const [formData, setFormData] = useState({
    certificateNumber: '',
    issuedDate: '',
    expiryDate: '',
    validatingLaboratory: '',
    documentUrl: '',
    notes: ''
  });

  const existingSealIds = productSeals.map((ps: ProductSeal) => ps.sealId);
  const availableSealsFiltered = availableSeals.filter((seal: Seal) =>
    !existingSealIds.includes(seal.id)
  );

  // Debug logs

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeal) return;

    onAddSeal(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Adicionar Selo
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedSeal ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Selecione um selo para adicionar ao produto:
            </p>
            {availableSealsFiltered.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum selo disponível para adicionar</p>
                <p className="text-xs text-gray-400 mt-2">
                  Total de selos: {availableSeals.length} | Filtrados: {availableSealsFiltered.length}
                </p>
              </div>
            ) : null}
            {availableSealsFiltered.map((seal: Seal) => {
              const IconComponent = getCategoryIcon(seal.category);
              const categoryColor = getCategoryColor(seal.category);

              return (
                <button
                  key={seal.id}
                  onClick={() => onSelectSeal(seal)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg bg-${categoryColor}-100 mr-3`}>
                      <IconComponent className={`w-4 h-4 text-${categoryColor}-600`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{seal.name}</h4>
                      <p className="text-sm text-gray-600">{seal.purpose}</p>
                      {seal.isRequired && (
                        <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded mt-1">
                          Obrigatório
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedSeal.name}</h4>
              <p className="text-sm text-gray-600">{selectedSeal.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Certificado
              </label>
              <input
                type="text"
                value={formData.certificateNumber}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: ABC123456"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Expiração
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laboratório Validador
              </label>
              <input
                type="text"
                value={formData.validatingLaboratory}
                onChange={(e) => setFormData({ ...formData, validatingLaboratory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nome do laboratório"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Documento
              </label>
              <input
                type="url"
                value={formData.documentUrl}
                onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Observações adicionais..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 btn btn-primary"
              >
                Adicionar Selo
              </button>
              <button
                type="button"
                onClick={() => onSelectSeal(null)}
                className="btn btn-outline"
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'REGULATORY': return Shield;
    case 'QUALITY': return Award;
    case 'ORGANIC': return Leaf;
    case 'ETHICAL': return Heart;
    case 'ENVIRONMENTAL': return TreePine;
    default: return Shield;
  }
};

const getCategoryColor = (category: string) => {
  const categoryData = SEAL_CATEGORIES.find(c => c.id === category);
  return categoryData?.color || 'gray';
};

export default ProductSealsManager;
