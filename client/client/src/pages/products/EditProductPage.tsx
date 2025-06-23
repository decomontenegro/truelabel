import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { productService } from '@/services/productService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const product = await productService.getProductById(id!);
      
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        sku: product.sku || '',
        description: product.description || '',
        claims: product.claims || '',
        nutritionalInfo: product.nutritionalInfo ? JSON.stringify(product.nutritionalInfo, null, 2) : '',
        imageUrl: product.imageUrl || ''
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Produto não encontrado');
        navigate('/dashboard/products');
      } else {
        toast.error('Erro ao carregar produto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.brand || !formData.category || !formData.sku) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);

      // Validar JSON das informações nutricionais
      let nutritionalInfo = null;
      if (formData.nutritionalInfo.trim()) {
        try {
          nutritionalInfo = JSON.parse(formData.nutritionalInfo);
        } catch (jsonError) {
          toast.error('Formato JSON inválido nas informações nutricionais');
          return;
        }
      }

      const updateData = {
        ...formData,
        nutritionalInfo
      };

      await productService.updateProduct(id!, updateData);
      toast.success('Produto atualizado com sucesso!');
      navigate(`/dashboard/products/${id}`);
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Dados inválidos. Verifique os campos.');
      } else if (error.response?.status === 409) {
        toast.error('SKU já existe. Use um SKU único.');
      } else if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        toast.error('Erro ao atualizar produto. Tente novamente.');
      }
    } finally {
      setSaving(false);
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
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/dashboard/products/${id}`)}
          className="btn btn-outline btn-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
          <p className="text-gray-600">Atualize as informações do produto</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Informações Básicas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Ex: Whey Protein Premium"
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Marca *
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                required
                value={formData.brand}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Ex: NutriMax"
              />
            </div>

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

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                required
                value={formData.sku}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Ex: WP-001-VAN"
              />
            </div>
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

        {/* Claims Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Claims e Alegações</h2>

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
        </div>

        {/* Nutritional Info Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Informações Nutricionais</h2>

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
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/products/${id}`)}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;
