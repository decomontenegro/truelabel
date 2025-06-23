import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Plus, Calendar, CheckCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { ProductCertification } from '@/types/certifications';
import { Product } from '@/types';
import { certificationService } from '@/services/certificationService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ProductCertificationsSectionProps {
  product: Product;
  canEdit?: boolean;
}

const ProductCertificationsSection: React.FC<ProductCertificationsSectionProps> = ({ 
  product, 
  canEdit = false 
}) => {
  const [certifications, setCertifications] = useState<ProductCertification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertifications();
  }, [product.id]);

  const loadCertifications = async () => {
    try {
      setLoading(true);
      const productCerts = await certificationService.getProductCertifications(product.id);
      setCertifications(productCerts);
    } catch (error) {
      console.error('Error loading certifications:', error);
      toast.error('Erro ao carregar certificações');
    } finally {
      setLoading(false);
    }
  };

  const removeCertification = async (certificationId: string) => {
    if (!confirm('Deseja remover esta certificação do produto?')) return;

    try {
      await certificationService.removeProductCertification(certificationId);
      toast.success('Certificação removida com sucesso!');
      loadCertifications();
    } catch (error) {
      console.error('Error removing certification:', error);
      toast.error('Erro ao remover certificação');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Award className="w-6 h-6 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Certificações ({certifications.length})
          </h3>
        </div>
        
        {canEdit && (
          <Link
            to={`/dashboard/products/${product.id}/certifications`}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Gerenciar
          </Link>
        )}
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Nenhuma certificação adicionada a este produto
          </p>
          {canEdit && (
            <Link
              to={`/dashboard/products/${product.id}/certifications`}
              className="btn btn-primary"
            >
              Adicionar Certificação
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((productCert) => {
            const cert = productCert.certification;
            const isExpired = certificationService.isCertificationExpired(productCert.expiryDate);
            const statusColor = certificationService.getCertificationStatusColor(productCert.status);
            
            return (
              <div 
                key={productCert.id} 
                className={`border rounded-lg p-4 ${
                  isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {cert.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {certificationService.getCertificationTypeLabel(cert.type)}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                    {certificationService.getCertificationStatusLabel(productCert.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Emissor:</span>
                    <span className="font-medium text-gray-900">{cert.issuer}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Certificado:</span>
                    <span className="font-mono text-gray-900">{productCert.certificateNumber}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Válido até:</span>
                    <div className="flex items-center">
                      {isExpired ? (
                        <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                      ) : (
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      )}
                      <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {certificationService.formatExpiryDate(productCert.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {productCert.verifiedAt && (
                    <div className="flex items-center text-green-600 text-xs mt-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificado em {new Date(productCert.verifiedAt).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  {productCert.documentUrl && (
                    <a
                      href={productCert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Ver Documento
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                  
                  {canEdit && (
                    <button
                      onClick={() => removeCertification(productCert.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductCertificationsSection;