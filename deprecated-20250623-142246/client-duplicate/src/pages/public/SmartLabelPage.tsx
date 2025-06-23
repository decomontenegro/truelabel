import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search,
  QrCode,
  Download,
  Share2,
  ChevronRight,
  Package,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  AlertCircle,
  CheckCircle,
  Award,
  ShieldCheck,
  Leaf,
  Printer,
  X,
  Plus,
  Minus,
  Factory
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SmartLabelHeader from '@/components/smartlabel/SmartLabelHeader';
import NutritionPanel from '@/components/smartlabel/NutritionPanel';
import IngredientsList from '@/components/smartlabel/IngredientsList';
import CertificationBadges from '@/components/smartlabel/CertificationBadges';
import SustainabilityScore from '@/components/smartlabel/SustainabilityScore';
import { smartLabelService, SmartLabelData } from '@/services/smartLabelService';
import { formatDate } from '@/lib/utils';


export default function SmartLabelPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('nutrition');
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<SmartLabelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [compareProducts, setCompareProducts] = useState<SmartLabelData[]>([]);
  const [selectedCompareProducts, setSelectedCompareProducts] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSmartLabelData = async () => {
      if (!code) return;

      try {
        setLoading(true);
        
        // Try to get data by QR code first
        let data: SmartLabelData;
        if (code.startsWith('QR-')) {
          data = await smartLabelService.getSmartLabelByQRCode(code);
        } else {
          // Otherwise treat as product ID
          data = await smartLabelService.getSmartLabelData(code);
        }
        
        setProduct(data);
        
        // Track view
        await smartLabelService.trackInteraction({
          productId: data.id,
          action: 'view'
        });
        
        // Fetch comparable products
        const comparables = await smartLabelService.getComparableProducts(data.id, data.category);
        setCompareProducts(comparables);
      } catch (err: any) {
        console.error('Error fetching SmartLabel data:', err);
        setError(err.message || 'Erro ao carregar informações do produto');
      } finally {
        setLoading(false);
      }
    };

    fetchSmartLabelData();
  }, [code]);

  const handleShare = async () => {
    if (!product) return;

    try {
      // Track share action
      await smartLabelService.trackInteraction({
        productId: product.id,
        action: 'share',
        metadata: {
          shareMethod: navigator.share ? 'native' : 'link'
        }
      });

      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Confira as informações verificadas de ${product.name} - ${product.brand}`,
          url: window.location.href,
        });
      } else {
        // Fallback - copy link
        const shareData = await smartLabelService.generateShareableLink(product.id);
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePrint = async () => {
    if (!product) return;

    try {
      // Track print action
      await smartLabelService.trackInteraction({
        productId: product.id,
        action: 'print'
      });

      window.print();
    } catch (error) {
      console.error('Error printing:', error);
    }
  };

  const handleTabChange = async (tabId: string) => {
    setActiveTab(tabId);
    
    if (product) {
      // Track tab change
      await smartLabelService.trackInteraction({
        productId: product.id,
        action: 'tab_change',
        metadata: { tab: tabId }
      });
    }
  };

  const handleCompare = async (productId: string) => {
    const newSelection = selectedCompareProducts.includes(productId)
      ? selectedCompareProducts.filter(id => id !== productId)
      : [...selectedCompareProducts, productId];
    
    setSelectedCompareProducts(newSelection);

    if (product && newSelection.length > 0) {
      // Track comparison
      await smartLabelService.trackInteraction({
        productId: product.id,
        action: 'compare',
        metadata: {
          comparedWith: newSelection
        }
      });
    }
  };

  // Dynamic tabs based on available data
  const getTabs = () => {
    if (!product) return [];
    
    const tabs = [];
    
    if (product.nutritionalInfo || product.nutritionInfo) {
      tabs.push({ id: 'nutrition', label: 'Nutrição' });
    }
    
    if (product.ingredients) {
      tabs.push({ id: 'ingredients', label: 'Ingredientes' });
    }
    
    if (product.allergenInfo || product.allergens) {
      tabs.push({ id: 'allergens', label: 'Alérgenos' });
    }
    
    if (product.storageInstructions) {
      tabs.push({ id: 'storage', label: 'Armazenamento' });
    }
    
    if (product.certifications || product.seals) {
      tabs.push({ id: 'certifications', label: 'Certificações' });
    }
    
    if (product.sustainabilityScore) {
      tabs.push({ id: 'sustainability', label: 'Sustentabilidade' });
    }
    
    if (product.traceability) {
      tabs.push({ id: 'traceability', label: 'Rastreabilidade' });
    }
    
    if (product.companyInfo || product.contact) {
      tabs.push({ id: 'company', label: 'Empresa' });
    }
    
    return tabs;
  };
  
  const tabs = getTabs();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Produto não encontrado</h2>
          <p className="text-gray-600">O código QR informado não é válido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" ref={printRef}>
      {/* SmartLabel Header with enhanced features */}
      <SmartLabelHeader 
        product={product} 
        onShare={handleShare}
        onPrint={handlePrint}
      />

      {/* Print-only header */}
      <div className="hidden print:block bg-white p-6 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{product?.name}</h1>
            <p className="text-gray-600">{product?.brand} - {product?.category}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Impresso em: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>Fonte: True Label SmartLabel</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b-2 border-gray-100 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-0 overflow-x-auto flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    px-4 sm:px-6 py-4 font-medium whitespace-nowrap transition-all relative
                    ${activeTab === tab.id 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Compare Button */}
            {compareProducts.length > 0 && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="ml-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-colors flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>Comparar ({selectedCompareProducts.length})</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && product && (
          <div className="animate-fadeIn">
            <NutritionPanel 
              nutritionalInfo={product.nutritionalInfo || product.nutritionInfo}
              servingSize={product.usage?.servingSize}
              servingsPerPackage={product.usage?.servingsPerPackage}
              highlights={product.nutritionalHighlights}
            />
          </div>
        )}

        {/* Ingredients Tab */}
        {activeTab === 'ingredients' && product && (
          <div className="animate-fadeIn">
            <IngredientsList 
              ingredients={product.ingredients}
              allergenInfo={product.allergenInfo}
            />
          </div>
        )}

        {/* Allergens Tab */}
        {activeTab === 'allergens' && product && product.allergenInfo && (
          <div className="animate-fadeIn">
            <IngredientsList 
              allergenInfo={product.allergenInfo}
            />
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && product && product.storageInstructions && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Instruções de Armazenamento</h2>
              </div>
              
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary-600 flex items-center">
                      <Package className="h-6 w-6 mr-2" />
                      Antes de Abrir
                    </h3>
                    <ul className="space-y-3">
                      {product.storageInstructions.beforeOpening.map((instruction: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-primary-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary-600 flex items-center">
                      ❄️ Depois de Aberto
                    </h3>
                    <ul className="space-y-3">
                      {product.storageInstructions.afterOpening.map((instruction: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {product.storageInstructions.temperature && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Temperatura ideal: {product.storageInstructions.temperature.min}°{product.storageInstructions.temperature.unit} a {product.storageInstructions.temperature.max}°{product.storageInstructions.temperature.unit}
                    </p>
                  </div>
                )}
                
                {product.usage && product.usage.usageTips && (
                  <div className="bg-white border-2 border-primary-600 rounded-xl p-6 mt-6">
                    <h3 className="text-xl font-semibold mb-4">💡 Dicas de Uso</h3>
                    <ul className="space-y-2">
                      {product.usage.usageTips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary-600 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && product && (
          <div className="animate-fadeIn">
            <CertificationBadges 
              certifications={product.certifications}
              seals={product.seals}
            />
          </div>
        )}

        {/* Sustainability Tab */}
        {activeTab === 'sustainability' && product && (
          <div className="animate-fadeIn">
            <SustainabilityScore 
              sustainabilityScore={product.sustainabilityScore}
              traceability={product.traceability}
            />
          </div>
        )}

        {/* Traceability Tab */}
        {activeTab === 'traceability' && product && product.traceability && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Rastreabilidade</h2>
              </div>
              <div className="p-6">
                {product.traceability.origin && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <MapPin className="h-5 w-5 text-primary-600 mr-2" />
                      Origem
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900">
                        <strong>Local:</strong> {product.traceability.origin.location}
                      </p>
                      {product.traceability.origin.farm && (
                        <p className="text-gray-900 mt-1">
                          <strong>Fazenda:</strong> {product.traceability.origin.farm}
                        </p>
                      )}
                      {product.traceability.origin.harvestDate && (
                        <p className="text-gray-900 mt-1">
                          <strong>Data de Colheita:</strong> {formatDate(product.traceability.origin.harvestDate)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {product.traceability.processing && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Factory className="h-5 w-5 text-primary-600 mr-2" />
                      Processamento
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900">
                        <strong>Unidade:</strong> {product.traceability.processing.facility}
                      </p>
                      {product.traceability.processing.date && (
                        <p className="text-gray-900 mt-1">
                          <strong>Data:</strong> {formatDate(product.traceability.processing.date)}
                        </p>
                      )}
                      {product.traceability.processing.certifications && (
                        <div className="mt-2">
                          <strong>Certificações da Unidade:</strong>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {product.traceability.processing.certifications.map((cert, index) => (
                              <span key={index} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {product.traceability.supplyChainMap && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Mapa completo da cadeia de suprimentos disponível
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Company Tab */}
        {activeTab === 'company' && product && (product.companyInfo || product.contact) && (
          <div className="animate-fadeIn">
            <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-2xl mx-auto text-center">
              {product.companyInfo?.logo ? (
                <img 
                  src={product.companyInfo.logo} 
                  alt={product.companyInfo.name || product.brand}
                  className="h-32 mx-auto mb-6"
                />
              ) : (
                <div className="w-32 h-32 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-6xl font-bold mx-auto mb-6">
                  {(product.companyInfo?.name || product.brand).charAt(0).toLowerCase()}
                </div>
              )}
              
              <h2 className="text-3xl font-bold mb-2">{product.companyInfo?.name || product.brand}</h2>
              
              {product.companyInfo?.description && (
                <p className="text-gray-600 leading-relaxed mb-8">
                  {product.companyInfo.description}
                </p>
              )}
              
              <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
                {product.contact?.customerServicePhone && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">SAC</div>
                    <div className="font-medium flex items-center justify-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {product.contact.customerServicePhone}
                    </div>
                  </div>
                )}
                {product.contact?.customerServiceEmail && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">E-mail</div>
                    <div className="font-medium flex items-center justify-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {product.contact.customerServiceEmail}
                    </div>
                  </div>
                )}
                {product.companyInfo?.website && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Website</div>
                    <div className="font-medium flex items-center justify-center">
                      <Globe className="h-4 w-4 mr-2" />
                      {product.companyInfo.website}
                    </div>
                  </div>
                )}
              </div>
              
              {product.companyInfo?.values && product.companyInfo.values.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Nossos Valores</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {product.companyInfo.values.map((value, index) => (
                      <span key={index} className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {product.companyInfo?.socialMedia && product.companyInfo.socialMedia.length > 0 && (
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Siga-nos</h3>
                  <div className="flex justify-center gap-4">
                    {product.companyInfo.socialMedia.map((social, index) => {
                      const Icon = social.platform === 'facebook' ? Facebook :
                                  social.platform === 'instagram' ? Instagram :
                                  social.platform === 'linkedin' ? Linkedin : Globe;
                      return (
                        <a 
                          key={index}
                          href={social.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Product Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Comparar Produtos</h3>
              <button
                onClick={() => setShowComparison(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Comparison Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Product Selection */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">Selecione produtos para comparar com {product?.name}:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {compareProducts.map((compareProduct) => (
                    <button
                      key={compareProduct.id}
                      onClick={() => handleCompare(compareProduct.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedCompareProducts.includes(compareProduct.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {compareProduct.imageUrl ? (
                        <img 
                          src={compareProduct.imageUrl} 
                          alt={compareProduct.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-900">{compareProduct.name}</p>
                      <p className="text-xs text-gray-600">{compareProduct.brand}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison Table */}
              {selectedCompareProducts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-4 bg-gray-50 font-medium text-gray-700 sticky left-0 z-10">Característica</th>
                        <th className="p-4 bg-gray-50 font-medium text-gray-700">
                          <div className="text-center">
                            <p className="font-semibold">{product?.name}</p>
                            <p className="text-xs text-gray-600">{product?.brand}</p>
                          </div>
                        </th>
                        {selectedCompareProducts.map(id => {
                          const compareProduct = compareProducts.find(p => p.id === id);
                          return compareProduct && (
                            <th key={id} className="p-4 bg-gray-50 font-medium text-gray-700">
                              <div className="text-center">
                                <p className="font-semibold">{compareProduct.name}</p>
                                <p className="text-xs text-gray-600">{compareProduct.brand}</p>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-4 font-medium sticky left-0 bg-white z-10">Categoria</td>
                        <td className="p-4 text-center">{product?.category}</td>
                        {selectedCompareProducts.map(id => {
                          const compareProduct = compareProducts.find(p => p.id === id);
                          return <td key={id} className="p-4 text-center">{compareProduct?.category}</td>;
                        })}
                      </tr>
                      <tr className="border-t">
                        <td className="p-4 font-medium sticky left-0 bg-white z-10">Status de Validação</td>
                        <td className="p-4 text-center">
                          {product?.status === 'VALIDATED' ? (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Validado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                              Pendente
                            </span>
                          )}
                        </td>
                        {selectedCompareProducts.map(id => {
                          const compareProduct = compareProducts.find(p => p.id === id);
                          return (
                            <td key={id} className="p-4 text-center">
                              {compareProduct?.status === 'VALIDATED' ? (
                                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Validado
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                  Pendente
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-t">
                        <td className="p-4 font-medium sticky left-0 bg-white z-10">Certificações</td>
                        <td className="p-4 text-center">
                          {product?.certifications?.length || 0} certificações
                        </td>
                        {selectedCompareProducts.map(id => {
                          const compareProduct = compareProducts.find(p => p.id === id);
                          return (
                            <td key={id} className="p-4 text-center">
                              {compareProduct?.certifications?.length || 0} certificações
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-t">
                        <td className="p-4 font-medium sticky left-0 bg-white z-10">Sustentabilidade</td>
                        <td className="p-4 text-center">
                          {product?.sustainabilityScore ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Leaf className="h-4 w-4 text-green-600" />
                              <span className="font-semibold">{product.sustainabilityScore.overall}/100</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {selectedCompareProducts.map(id => {
                          const compareProduct = compareProducts.find(p => p.id === id);
                          return (
                            <td key={id} className="p-4 text-center">
                              {compareProduct?.sustainabilityScore ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <Leaf className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold">{compareProduct.sustainabilityScore.overall}/100</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\:hidden {
            display: none !important;
          }
          .print\:block {
            display: block !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}