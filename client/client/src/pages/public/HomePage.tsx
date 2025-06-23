import { Link } from 'react-router-dom';
import { Shield, CheckCircle, Users, BarChart3, QrCode, FileCheck } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Validação Transparente
              <span className="text-primary-600 block">para Produtos CPG</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Conecte diretamente claims, tabelas nutricionais e selos a laudos 
              laboratoriais acreditados. Restaure a confiança do consumidor através 
              da transparência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/register"
                className="btn-primary btn-lg"
              >
                Começar Agora
              </Link>
              <Link
                to="/how-it-works"
                className="btn-outline btn-lg"
              >
                Como Funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Um processo simples e seguro que conecta marcas, laboratórios e consumidores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1. Cadastro de Produtos
              </h3>
              <p className="text-gray-600">
                Marcas cadastram produtos com claims, tabelas nutricionais e informações detalhadas
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                2. Validação Laboratorial
              </h3>
              <p className="text-gray-600">
                Laboratórios acreditados enviam laudos diretamente para nossa plataforma
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                3. Acesso via QR Code
              </h3>
              <p className="text-gray-600">
                Consumidores escaneiam QR codes nas embalagens para ver validações
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Benefícios para Todos os Stakeholders
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Para Consumidores</h3>
                    <p className="text-gray-600">
                      Acesso direto a evidências científicas que comprovam claims de produtos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Para Marcas</h3>
                    <p className="text-gray-600">
                      Diferenciação competitiva através da transparência e confiança
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Para Laboratórios</h3>
                    <p className="text-gray-600">
                      Nova fonte de receita e maior visibilidade dos serviços
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Para Varejistas</h3>
                    <p className="text-gray-600">
                      Critério adicional para seleção e promoção de produtos
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <Users className="h-12 w-12 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">100+</div>
                  <div className="text-sm text-gray-600">Marcas Parceiras</div>
                </div>
                
                <div className="text-center">
                  <Shield className="h-12 w-12 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600">Laboratórios</div>
                </div>
                
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">10k+</div>
                  <div className="text-sm text-gray-600">Produtos Validados</div>
                </div>
                
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">1M+</div>
                  <div className="text-sm text-gray-600">QR Codes Escaneados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Junte-se às marcas que já estão construindo confiança através da transparência
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="bg-white text-primary-600 hover:bg-gray-100 btn btn-lg"
            >
              Cadastrar Marca
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 btn btn-lg"
            >
              Falar com Especialista
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
