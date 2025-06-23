import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedProducts?: string[];
}

interface FAQSectionProps {
  productId?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ productId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock FAQ data - in production, this would come from an API
  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Como verificar a autenticidade do meu produto?',
      answer: 'Para verificar a autenticidade, escaneie o código QR presente na embalagem do produto usando a câmera do seu celular ou nosso aplicativo. O sistema mostrará imediatamente se o produto é autêntico e fornecerá informações detalhadas sobre ele.',
      category: 'autenticidade',
      relatedProducts: ['all']
    },
    {
      id: '2',
      question: 'O que fazer se o código QR estiver danificado?',
      answer: 'Se o código QR estiver danificado, você pode inserir manualmente o código alfanumérico que aparece abaixo do QR Code em nossa página de validação. Se ainda tiver problemas, entre em contato com nosso suporte.',
      category: 'problemas',
      relatedProducts: ['all']
    },
    {
      id: '3',
      question: 'Por que meu produto aparece como "já validado"?',
      answer: 'Isso pode ocorrer se o código já foi escaneado anteriormente. Por segurança, registramos a primeira validação. Se você comprou o produto novo e está vendo esta mensagem, entre em contato imediatamente com nosso suporte para investigarmos.',
      category: 'validação',
      relatedProducts: ['all']
    },
    {
      id: '4',
      question: 'Como funciona o sistema de selos de autenticidade?',
      answer: 'Nossos selos possuem tecnologia antifalsificação com códigos únicos. Cada selo é rastreável e vinculado a um produto específico. Ao escanear, você acessa o histórico completo do produto, incluindo origem, data de fabricação e certificações.',
      category: 'autenticidade',
      relatedProducts: ['all']
    },
    {
      id: '5',
      question: 'Posso registrar meu produto após a compra?',
      answer: 'Sim! Após validar a autenticidade, você pode registrar o produto em seu nome. Isso garante benefícios como garantia estendida, suporte prioritário e notificações sobre recalls ou atualizações importantes.',
      category: 'registro',
      relatedProducts: ['all']
    },
    {
      id: '6',
      question: 'O que são os relatórios de laboratório?',
      answer: 'São documentos oficiais emitidos por laboratórios credenciados que atestam a qualidade e composição dos produtos. Você pode acessá-los escaneando o código QR e navegando até a seção "Certificações" na página do produto.',
      category: 'certificações',
      relatedProducts: ['all']
    },
    {
      id: '7',
      question: 'Como reportar um produto falsificado?',
      answer: 'Se você suspeita ter adquirido um produto falsificado, clique no botão "Reportar Falsificação" na página de validação ou entre em contato diretamente conosco. Mantenha a embalagem e comprovante de compra para investigação.',
      category: 'problemas',
      relatedProducts: ['all']
    },
    {
      id: '8',
      question: 'Meus dados estão seguros ao validar um produto?',
      answer: 'Sim, utilizamos criptografia de ponta a ponta e seguimos as normas da LGPD. Seus dados são usados apenas para melhorar nossos serviços e combater falsificações. Você pode consultar nossa política de privacidade completa.',
      category: 'segurança',
      relatedProducts: ['all']
    }
  ];

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'autenticidade', label: 'Autenticidade' },
    { value: 'validação', label: 'Validação' },
    { value: 'problemas', label: 'Problemas' },
    { value: 'registro', label: 'Registro' },
    { value: 'certificações', label: 'Certificações' },
    { value: 'segurança', label: 'Segurança' }
  ];

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesProduct = !productId || item.relatedProducts?.includes('all') || 
                          item.relatedProducts?.includes(productId);
    
    return matchesSearch && matchesCategory && matchesProduct;
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter */}
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar nas perguntas frequentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* FAQ Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Nenhuma pergunta encontrada.</p>
            <p className="text-sm text-gray-400 mt-2">
              Tente buscar com outros termos ou entre em contato conosco.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map(item => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 flex-1 pr-3">
                    {item.question}
                  </h4>
                  {expandedItems.has(item.id) ? (
                    <ChevronUp className="text-gray-400" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={20} />
                  )}
                </button>
                
                {expandedItems.has(item.id) && (
                  <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {categories.find(c => c.value === item.category)?.label}
                      </span>
                      <button className="text-xs text-blue-600 hover:underline">
                        Esta resposta foi útil?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Still need help? */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-sm text-center text-gray-600">
          Não encontrou o que procurava?{' '}
          <button className="text-blue-600 hover:underline font-medium">
            Fale com nosso suporte
          </button>
        </p>
      </div>
    </div>
  );
};

export default FAQSection;