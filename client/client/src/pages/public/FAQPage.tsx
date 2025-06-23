import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData = [
    {
      category: 'Geral',
      questions: [
        {
          question: 'O que é a True Label?',
          answer: 'A True Label é uma plataforma que conecta claims de produtos CPG a evidências científicas através de laudos laboratoriais acreditados, promovendo transparência e confiança no mercado.'
        },
        {
          question: 'Como funciona o processo de validação?',
          answer: 'O processo envolve 3 etapas: 1) Cadastro do produto com claims, 2) Análise laboratorial por laboratórios acreditados, 3) Validação científica por nossa equipe de especialistas.'
        },
        {
          question: 'Quanto tempo leva para validar um produto?',
          answer: 'O tempo varia de 15 a 30 dias úteis, dependendo da complexidade dos claims e da disponibilidade dos laboratórios parceiros.'
        }
      ]
    },
    {
      category: 'Para Marcas',
      questions: [
        {
          question: 'Quais tipos de produtos podem ser validados?',
          answer: 'Validamos produtos alimentícios, suplementos, cosméticos e produtos de higiene pessoal que possuam claims nutricionais, funcionais ou de qualidade.'
        },
        {
          question: 'Preciso ter laudos laboratoriais próprios?',
          answer: 'Não necessariamente. Podemos conectar você com nossos laboratórios parceiros para realizar as análises necessárias.'
        },
        {
          question: 'Como os QR Codes são gerados?',
          answer: 'Após a validação, geramos automaticamente QR Codes únicos para cada produto, que podem ser impressos nas embalagens.'
        }
      ]
    },
    {
      category: 'Para Laboratórios',
      questions: [
        {
          question: 'Como posso me tornar um laboratório parceiro?',
          answer: 'Entre em contato conosco através do formulário de contato. Avaliamos laboratórios com acreditação ISO/IEC 17025 e experiência em análises de produtos CPG.'
        },
        {
          question: 'Quais são os requisitos técnicos?',
          answer: 'Exigimos acreditação ISO/IEC 17025, métodos analíticos validados e capacidade de emitir laudos técnicos detalhados.'
        },
        {
          question: 'Como funciona a remuneração?',
          answer: 'Os laboratórios são remunerados diretamente pelas marcas pelos serviços de análise prestados.'
        }
      ]
    },
    {
      category: 'Técnico',
      questions: [
        {
          question: 'Os dados são seguros?',
          answer: 'Sim, utilizamos criptografia de ponta e seguimos as melhores práticas de segurança para proteger todos os dados da plataforma.'
        },
        {
          question: 'Há uma API disponível?',
          answer: 'Sim, oferecemos API REST completa para integração com sistemas existentes. Disponível nos planos Professional e Enterprise.'
        },
        {
          question: 'Como funciona a verificação dos QR Codes?',
          answer: 'Os QR Codes direcionam para uma página pública onde consumidores podem ver todas as validações e evidências científicas do produto.'
        }
      ]
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Perguntas Frequentes
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Encontre respostas para as dúvidas mais comuns sobre a True Label
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar perguntas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFAQ.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Nenhuma pergunta encontrada para "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredFAQ.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {category.category}
                  </h2>
                  
                  <div className="space-y-4">
                    {category.questions.map((item, itemIndex) => {
                      const globalIndex = categoryIndex * 100 + itemIndex;
                      const isOpen = openItems.includes(globalIndex);
                      
                      return (
                        <div
                          key={itemIndex}
                          className="bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <button
                            onClick={() => toggleItem(globalIndex)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                          >
                            <span className="font-medium text-gray-900">
                              {item.question}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            )}
                          </button>
                          
                          {isOpen && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-600 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Não encontrou sua resposta?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Nossa equipe está pronta para ajudar você com qualquer dúvida
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="btn btn-primary"
            >
              Entrar em Contato
            </a>
            <a
              href="mailto:suporte@truelabel.com"
              className="btn btn-outline"
            >
              Enviar Email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
