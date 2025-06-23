import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Apple, 
  BarChart3, 
  FileText, 
  Shield, 
  Search,
  Filter,
  Plus,
  ChevronRight 
} from 'lucide-react';
import { productService } from '@/services/productService';
import { nutritionService } from '@/services/nutritionService';
import { useAuthStore } from '@/stores/authStore';
import NutritionEditor from '@/components/nutrition/NutritionEditor';
import ClaimsValidator from '@/components/nutrition/ClaimsValidator';
import NutritionalComparison from '@/components/nutrition/NutritionalComparison';
import ComplianceChecker from '@/components/nutrition/ComplianceChecker';
import NutritionReportGenerator from '@/components/nutrition/NutritionReportGenerator';
import { NutritionFacts, ComplianceWarning, HealthClaim, ComplianceStatus } from '@/types/nutrition';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'editor' | 'claims' | 'comparison' | 'compliance' | 'reports';

const NutritionManagementPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionFacts | null>(null);
  const [healthClaims, setHealthClaims] = useState<string[]>([]);
  const [comparisonProducts, setComparisonProducts] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products', { search, category }],
    queryFn: () => productService.getProducts({ search, category, limit: 20 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const products = productsData?.data || [];

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    if (product.nutritionalInfo || product.nutritionInfo) {
      setNutritionData(product.nutritionalInfo || product.nutritionInfo);
    }
    if (product.claims) {
      setHealthClaims(product.claims.split(',').map(c => c.trim()).filter(Boolean));
    }
  };

  const handleNutritionUpdate = (data: NutritionFacts) => {
    setNutritionData(data);
  };

  const handleClaimsUpdate = (claims: string[]) => {
    setHealthClaims(claims);
  };

  const handleAddToComparison = (productId: string) => {
    if (!comparisonProducts.includes(productId) && comparisonProducts.length < 4) {
      setComparisonProducts([...comparisonProducts, productId]);
    }
  };

  const removeFromComparison = (productId: string) => {
    setComparisonProducts(comparisonProducts.filter(id => id !== productId));
  };

  const tabs = [
    { id: 'editor' as TabType, label: 'Editor Nutricional', icon: Apple },
    { id: 'claims' as TabType, label: 'Validar Alegações', icon: Shield },
    { id: 'comparison' as TabType, label: 'Comparar Produtos', icon: BarChart3 },
    { id: 'compliance' as TabType, label: 'Conformidade', icon: Shield },
    { id: 'reports' as TabType, label: 'Relatórios', icon: FileText },
  ];

  // Check permissions
  const canEdit = user?.role === 'ADMIN' || user?.role === 'BRAND';
  const canViewReports = user?.role === 'ADMIN' || user?.role === 'BRAND' || user?.role === 'LAB';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise Nutricional</h1>
          <p className="text-gray-600">Gerencie informações nutricionais e conformidade</p>
        </div>
      </div>

      {/* Product Selection */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Selecionar Produto</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select"
          >
            <option value="">Todas as categorias</option>
            {categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button className="btn-outline flex items-center justify-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-all",
                selectedProduct?.id === product.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleProductSelect(product)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.brand}</p>
                  <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                </div>
                {activeTab === 'comparison' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToComparison(product.id);
                    }}
                    disabled={comparisonProducts.includes(product.id)}
                    className={cn(
                      "ml-2 p-1 rounded",
                      comparisonProducts.includes(product.id)
                        ? "bg-green-100 text-green-600"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              {product.nutritionalInfo && (
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <Apple className="h-3 w-3 mr-1" />
                  Informações nutricionais disponíveis
                </div>
              )}
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <>
          {/* Selected Product Info */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Apple className="h-5 w-5 text-primary-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedProduct.brand} • {selectedProduct.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/dashboard/products/${selectedProduct.id}`)}
                className="btn-outline text-sm flex items-center"
              >
                Ver Produto
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isDisabled = 
                    (tab.id === 'reports' && !canViewReports) ||
                    (tab.id === 'editor' && !canEdit);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id)}
                      disabled={isDisabled}
                      className={cn(
                        "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                        activeTab === tab.id
                          ? "border-primary-500 text-primary-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'editor' && nutritionData && (
                <NutritionEditor
                  initialData={nutritionData}
                  onChange={handleNutritionUpdate}
                  targetMarket="BRAZIL"
                />
              )}

              {activeTab === 'claims' && nutritionData && (
                <ClaimsValidator
                  nutritionFacts={nutritionData}
                  initialClaims={healthClaims}
                  onChange={handleClaimsUpdate}
                  targetMarket="BRAZIL"
                />
              )}

              {activeTab === 'comparison' && (
                <div className="space-y-4">
                  {comparisonProducts.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-700">
                          {comparisonProducts.length} produto(s) selecionado(s) para comparação
                        </p>
                        <button
                          onClick={() => setComparisonProducts([])}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Limpar seleção
                        </button>
                      </div>
                    </div>
                  )}
                  <NutritionalComparison
                    productIds={comparisonProducts}
                    onProductRemove={removeFromComparison}
                  />
                </div>
              )}

              {activeTab === 'compliance' && nutritionData && (
                <ComplianceChecker
                  nutritionFacts={nutritionData}
                  healthClaims={healthClaims}
                  productCategory={selectedProduct.category}
                  targetMarket="BRAZIL"
                />
              )}

              {activeTab === 'reports' && nutritionData && (
                <NutritionReportGenerator
                  productId={selectedProduct.id}
                  productName={selectedProduct.name}
                  nutritionFacts={nutritionData}
                  healthClaims={healthClaims}
                />
              )}

              {!nutritionData && activeTab !== 'comparison' && (
                <div className="text-center py-12">
                  <Apple className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Este produto ainda não possui informações nutricionais cadastradas.
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setNutritionData({
                          servingSize: 100,
                          servingUnit: 'g',
                          calories: 0,
                          totalFat: 0,
                          saturatedFat: 0,
                          transFat: 0,
                          cholesterol: 0,
                          sodium: 0,
                          totalCarbohydrates: 0,
                          dietaryFiber: 0,
                          totalSugars: 0,
                          protein: 0
                        });
                        setActiveTab('editor');
                      }}
                      className="btn-primary mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Informações Nutricionais
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NutritionManagementPage;