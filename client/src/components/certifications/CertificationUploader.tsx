import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { CreateCertificationData, CertificationType, VerificationMethod } from '@/types/certifications';
import { certificationService } from '@/services/certificationService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface CertificationUploaderProps {
  onUploadComplete?: (certification: any) => void;
  productId?: string;
}

const CertificationUploader: React.FC<CertificationUploaderProps> = ({ onUploadComplete, productId }) => {
  const [formData, setFormData] = useState<CreateCertificationData>({
    name: '',
    description: '',
    issuer: '',
    number: '',
    issueDate: '',
    expiryDate: '',
    type: 'OTHER',
    verificationMethod: 'MANUAL',
    verificationUrl: '',
    scope: '',
    standards: []
  });
  
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { execute: createCertification, loading } = useAsyncAction(async () => {
    // Validate form
    if (!formData.name || !formData.issuer || !formData.number || !formData.issueDate || !formData.expiryDate) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Create certification first
    const certificationResponse = await certificationService.createCertification(formData);
    
    // Upload document if available
    if (documentFile) {
      setIsUploading(true);
      try {
        const documentResponse = await certificationService.uploadCertificateDocument(
          certificationResponse.certification.id,
          documentFile
        );
        
        // Update certification with document URL
        await certificationService.updateCertification(certificationResponse.certification.id, {
          documentUrl: documentResponse.documentUrl
        });
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error('Erro ao fazer upload do documento');
      } finally {
        setIsUploading(false);
      }
    }

    toast.success('Certificação criada com sucesso!');
    
    // If productId is provided, link to product
    if (productId) {
      await certificationService.addProductCertification({
        productId,
        certificationId: certificationResponse.certification.id,
        certificateNumber: formData.number,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate
      });
    }

    onUploadComplete?.(certificationResponse.certification);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      issuer: '',
      number: '',
      issueDate: '',
      expiryDate: '',
      type: 'OTHER',
      verificationMethod: 'MANUAL',
      verificationUrl: '',
      scope: '',
      standards: []
    });
    setDocumentFile(null);
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      setDocumentFile(file);
    }
  };

  const removeFile = () => {
    setDocumentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const certificationTypes: Array<{ value: CertificationType; label: string }> = [
    { value: 'ISO', label: 'ISO' },
    { value: 'HACCP', label: 'HACCP' },
    { value: 'ORGANIC', label: 'Orgânico' },
    { value: 'FAIRTRADE', label: 'Comércio Justo' },
    { value: 'KOSHER', label: 'Kosher' },
    { value: 'HALAL', label: 'Halal' },
    { value: 'VEGAN', label: 'Vegano' },
    { value: 'NON_GMO', label: 'Não-OGM' },
    { value: 'GLUTEN_FREE', label: 'Sem Glúten' },
    { value: 'RAINFOREST_ALLIANCE', label: 'Rainforest Alliance' },
    { value: 'BRC', label: 'BRC' },
    { value: 'IFS', label: 'IFS' },
    { value: 'OTHER', label: 'Outro' }
  ];

  const verificationMethods: Array<{ value: VerificationMethod; label: string }> = [
    { value: 'QR_CODE', label: 'QR Code' },
    { value: 'CERTIFICATE_NUMBER', label: 'Número do Certificado' },
    { value: 'WEBSITE', label: 'Website' },
    { value: 'API', label: 'API' },
    { value: 'MANUAL', label: 'Manual' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Nova Certificação</h3>

      <form onSubmit={(e) => { e.preventDefault(); createCertification(); }} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Certificação *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: ISO 9001:2015"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CertificationType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {certificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Issuer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emissor *
            </label>
            <input
              type="text"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Bureau Veritas"
              required
            />
          </div>

          {/* Certificate Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Certificado *
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: BR-12345/2024"
              required
            />
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Emissão *
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Expiração *
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min={formData.issueDate}
              required
            />
          </div>

          {/* Verification Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Verificação
            </label>
            <select
              value={formData.verificationMethod}
              onChange={(e) => setFormData({ ...formData, verificationMethod: e.target.value as VerificationMethod })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {verificationMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Verification URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de Verificação
            </label>
            <input
              type="url"
              value={formData.verificationUrl}
              onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://..."
            />
          </div>

          {/* Scope */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Escopo
            </label>
            <input
              type="text"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Gestão da Qualidade, Produção de Alimentos"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descrição detalhada da certificação..."
            />
          </div>

          {/* Standards */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Normas/Padrões
            </label>
            <input
              type="text"
              value={formData.standards?.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                standards: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: ISO 9001, ISO 14001 (separados por vírgula)"
            />
          </div>
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documento do Certificado
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {documentFile ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-gray-400 mr-3" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{documentFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Arraste e solte o documento aqui ou
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-sm"
                >
                  Selecionar Arquivo
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, DOCX, JPG ou PNG (máx. 10MB)
                </p>
              </>
            )}
          </div>

          {isUploading && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Enviando documento...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                issuer: '',
                number: '',
                issueDate: '',
                expiryDate: '',
                type: 'OTHER',
                verificationMethod: 'MANUAL',
                verificationUrl: '',
                scope: '',
                standards: []
              });
              setDocumentFile(null);
            }}
            className="btn btn-outline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || isUploading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Certificação'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CertificationUploader;