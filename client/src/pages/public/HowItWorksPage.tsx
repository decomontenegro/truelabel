import React from 'react';
import { FileCheck, Shield, QrCode, Users, CheckCircle, ArrowRight, Upload, Search, Award } from 'lucide-react';

const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Como Funciona a True Label
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Um processo simples e seguro que conecta claims de produtos a evidências 
              científicas, promovendo transparência em todo o ecossistema CPG.
            </p>
          </div>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Processo em 3 Etapas Simples
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Da validação laboratorial ao acesso do consumidor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center relative">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileCheck className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                1. Cadastro e Validação
              </h3>
              <p className="text-gray-600 mb-6">
                Marcas cadastram produtos com claims e informações nutricionais. 
                Laboratórios acreditados enviam laudos que comprovam as alegações.
              </p>
              <div className="hidden md:block absolute top-10 -right-4 text-primary-300">
                <ArrowRight className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center relative">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                2. Verificação Científica
              </h3>
              <p className="text-gray-600 mb-6">
                Nossa equipe de especialistas analisa os laudos laboratoriais e 
                valida cientificamente cada claim do produto.
              </p>
              <div className="hidden md:block absolute top-10 -right-4 text-primary-300">
                <ArrowRight className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                3. Acesso Transparente
              </h3>
              <p className="text-gray-600 mb-6">
                Consumidores escaneiam QR codes nas embalagens para acessar 
                todas as validações e evidências científicas do produto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Steps */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Processo Detalhado
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Entenda cada etapa do processo de validação
            </p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Cadastro de Produtos</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  As marcas cadastram seus produtos na plataforma, incluindo informações 
                  detalhadas sobre claims nutricionais, funcionais e de qualidade.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Informações nutricionais completas
                  </li>
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Claims funcionais e de saúde
                  </li>
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Certificações e selos
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary-100 p-4 rounded-lg text-center">
                    <Upload className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Upload</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <FileCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Análise</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Validação</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Processo atual: Cadastro de produto
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-100 p-4 rounded-lg text-center">
                      <Upload className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium">Concluído</div>
                    </div>
                    <div className="bg-primary-100 p-4 rounded-lg text-center">
                      <FileCheck className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                      <div className="text-sm font-medium">Análise</div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">Validação</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Processo atual: Análise laboratorial
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Análise Laboratorial</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Laboratórios acreditados realizam análises específicas e enviam 
                  laudos técnicos que comprovam ou refutam os claims do produto.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Laboratórios ISO/IEC 17025 acreditados
                  </li>
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Métodos analíticos validados
                  </li>
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Laudos técnicos detalhados
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Validação Científica</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Nossa equipe de especialistas analisa os laudos e valida 
                  cientificamente cada claim, gerando um relatório de validação.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Análise por especialistas qualificados
                  </li>
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Validação baseada em evidências
                  </li>
                  <li className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Relatório detalhado de validação
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-100 p-4 rounded-lg text-center">
                    <Upload className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Concluído</div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg text-center">
                    <FileCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Concluído</div>
                  </div>
                  <div className="bg-primary-100 p-4 rounded-lg text-center">
                    <Award className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Validação</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Processo atual: Validação científica
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Benefícios para Todos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nossa plataforma cria valor para todos os participantes do ecossistema
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Consumidores</h3>
              <p className="text-gray-600 text-sm">
                Acesso direto a evidências científicas que comprovam claims de produtos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Marcas</h3>
              <p className="text-gray-600 text-sm">
                Diferenciação competitiva através da transparência e confiança
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Laboratórios</h3>
              <p className="text-gray-600 text-sm">
                Nova fonte de receita e maior visibilidade dos serviços
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Varejistas</h3>
              <p className="text-gray-600 text-sm">
                Critério adicional para seleção e promoção de produtos
              </p>
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
            <a
              href="/auth/register"
              className="bg-white text-primary-600 hover:bg-gray-100 btn btn-lg"
            >
              Cadastrar Marca
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 btn btn-lg"
            >
              Falar com Especialista
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
