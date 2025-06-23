import React, { useState } from 'react';
import { ArrowLeft, Save, Upload, X, Apple, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { toast } from '@/components/ui/Toast';
import ValidatedInput from '@/components/ui/ValidatedInput';
import { validateSKU, sanitizeHTML } from '@/lib/validation';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import NutritionEditor from '@/components/nutrition/NutritionEditor';
import ClaimsValidator from '@/components/nutrition/ClaimsValidator';
import { NutritionFacts, ComplianceWarning, HealthClaim } from '@/types/nutrition';

interface ProductFormData {
  name: string;
  brand: string;
  category: string;
  sku: string;
  description: string;
  claims: string;
  nutritionalInfo: string;
  imageUrl: string;
}

const CreateProductPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionFacts | null>(null);
  const [nutritionWarnings, setNutritionWarnings] = useState<ComplianceWarning[]>([]);
  const [validatedClaims, setValidatedClaims] = useState<HealthClaim[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brand: '',
    category: '',
    sku: '',
    description: '',
    claims: '',
    nutritionalInfo: '',
    imageUrl: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNutritionChange = (data: NutritionFacts) => {
    setNutritionData(data);
    // Update the JSON string for backward compatibility
    setFormData(prev => ({
      ...prev,
      nutritionalInfo: JSON.stringify(data, null, 2)
    }));
  };

  const handleNutritionValidation = (warnings: ComplianceWarning[]) => {
    setNutritionWarnings(warnings);
  };

  const handleClaimsValidation = (claims: HealthClaim[]) => {
    setValidatedClaims(claims);
  };

  const getClaimsArray = (): string[] => {
    return formData.claims.split(',').map(c => c.trim()).filter(Boolean);
  };

  const handleClaimsChange = (claims: string[]) => {
    setFormData(prev => ({
      ...prev,
      claims: claims.join(', ')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.brand || !formData.category || !formData.sku) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validação adicional do SKU
    if (!validateSKU(formData.sku)) {
      toast.error('SKU inválido');
      return;
    }

    try {
      setLoading(true);
      
      // Sanitizar dados antes de enviar
      const sanitizedData = {
        ...formData,
        description: sanitizeHTML(formData.description),
        nutritionalInfo: sanitizeHTML(formData.nutritionalInfo),
      };

      // Validar JSON das informações nutricionais
      let nutritionalInfo = null;
      if (sanitizedData.nutritionalInfo.trim()) {
        try {
          nutritionalInfo = JSON.parse(sanitizedData.nutritionalInfo);
        } catch (jsonError) {
          toast.error('Formato JSON inválido nas informações nutricionais');
          return;
        }
      }

      const productData = {
        ...sanitizedData,
        nutritionalInfo
      };

      await productService.createProduct(productData);
      toast.success('Produto criado com sucesso!');
      navigate('/dashboard/products');
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Dados inválidos. Verifique os campos.');
      } else if (error.response?.status === 409) {
        toast.error('SKU já existe. Use um SKU único.');
      } else if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        toast.error('Erro ao criar produto. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Alimentos',
    'Bebidas',
    'Suplementos',
    'Cosméticos',
    'Higiene Pessoal',
    'Produtos Naturais',
    'Outros'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard/products')}
          className="btn btn-outline btn-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Informações Básicas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ValidatedInput
              id="name"
              name="name"
              label="Nome do Produto"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Whey Protein Premium"
              validate={(value) => {
                if (value.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
                if (value.length > 100) return 'Nome deve ter no máximo 100 caracteres';
                return true;
              }}
              showValidIcon
            />

            <ValidatedInput
              id="brand"
              name="brand"
              label="Marca"
              required
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="Ex: NutriMax"
              validate={(value) => {
                if (value.length < 2) return 'Marca deve ter pelo menos 2 caracteres';
                if (value.length > 50) return 'Marca deve ter no máximo 50 caracteres';
                return true;
              }}
              showValidIcon
            />

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="input w-full"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <ValidatedInput
              id="sku"
              name="sku"
              label="SKU"
              required
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="Ex: WP-001-VAN"
              validate={(value) => {
                if (!validateSKU(value)) {
                  return 'SKU deve conter apenas letras, números, hífens e underscores (3-50 caracteres)';
                }
                return true;
              }}
              showValidIcon
            />
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="input w-full"
              placeholder="Descreva o produto, seus benefícios e características..."
            />
          </div>

          <div className="mt-6">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              className="input w-full"
              placeholder="https://exemplo.com/imagem-produto.jpg"
            />
          </div>
        </div>

        {/* Nutritional Info Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Informações Nutricionais</h2>
            <button
              type="button"
              onClick={() => setShowAdvancedNutrition(!showAdvancedNutrition)}
              className="btn-outline text-sm flex items-center"
            >
              <Apple className="h-4 w-4 mr-2" />
              {showAdvancedNutrition ? 'Editor Simples' : 'Editor Avançado'}
            </button>
          </div>

          {showAdvancedNutrition ? (
            <>
              <NutritionEditor
                initialData={nutritionData || undefined}
                onChange={handleNutritionChange}
                onValidate={handleNutritionValidation}
                targetMarket="BRAZIL"
              />
              
              {nutritionWarnings.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Avisos de Validação
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {nutritionWarnings.map((warning, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            {warning.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <label htmlFor="nutritionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Informações Nutricionais (JSON)
              </label>
              <textarea
                id="nutritionalInfo"
                name="nutritionalInfo"
                rows={6}
                value={formData.nutritionalInfo}
                onChange={handleInputChange}
                className="input w-full font-mono text-sm"
                placeholder={`{
  "calorias": "120 kcal",
  "proteinas": "25g",
  "carboidratos": "2g",
  "gorduras": "1g",
  "fibras": "0g",
  "sodio": "50mg"
}`}
              />
              <p className="text-sm text-gray-500 mt-1">
                Formato JSON válido. Deixe em branco se não aplicável.
              </p>
            </div>
          )}
        </div>

        {/* Claims Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Claims e Alegações</h2>

          {showAdvancedNutrition && nutritionData ? (
            <ClaimsValidator
              nutritionFacts={nutritionData}
              initialClaims={getClaimsArray()}
              onChange={handleClaimsChange}
              onValidation={handleClaimsValidation}
              targetMarket="BRAZIL"
            />
          ) : (
            <div>
              <label htmlFor="claims" className="block text-sm font-medium text-gray-700 mb-2">
                Claims do Produto
              </label>
              <textarea
                id="claims"
                name="claims"
                rows={4}
                value={formData.claims}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Ex: Rico em proteínas, Sem açúcar adicionado, Fonte de vitaminas..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Separe múltiplos claims por vírgula
              </p>
            </div>
          )}
          
          {/* Compliance Status Summary */}
          {showAdvancedNutrition && validatedClaims.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status de Conformidade</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {validatedClaims.filter(c => c.status === 'VALID').length}
                  </p>
                  <p className="text-xs text-gray-600">Válidas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {validatedClaims.filter(c => c.status === 'WARNING').length}
                  </p>
                  <p className="text-xs text-gray-600">Avisos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {validatedClaims.filter(c => c.status === 'INVALID').length}
                  </p>
                  <p className="text-xs text-gray-600">Inválidas</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/products')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Criar Produto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProductPage;
