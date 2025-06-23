import React from 'react';
import { Shield, Users, Target, Award, CheckCircle, Heart } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Sobre a True Label
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Somos uma plataforma inovadora que conecta marcas, laboratórios e consumidores 
              através da transparência e validação científica de produtos CPG.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossa Missão</h3>
              <p className="text-gray-600">
                Restaurar a confiança do consumidor no mercado CPG através da transparência 
                e validação científica de claims de produtos.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossa Visão</h3>
              <p className="text-gray-600">
                Ser a plataforma líder global em validação transparente de produtos, 
                criando um ecossistema de confiança para todos os stakeholders.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossos Valores</h3>
              <p className="text-gray-600">
                Transparência, integridade científica, inovação e compromisso com 
                a verdade em cada validação que realizamos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nossa História
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  A True Label nasceu da necessidade urgente de restaurar a confiança 
                  no mercado de produtos de consumo. Com o crescimento exponencial de 
                  claims nutricionais e funcionais, consumidores perderam a capacidade 
                  de distinguir entre marketing e ciência.
                </p>
                <p>
                  Nossa equipe, formada por especialistas em nutrição, tecnologia e 
                  regulamentação, desenvolveu uma plataforma que conecta diretamente 
                  claims de produtos a laudos laboratoriais acreditados.
                </p>
                <p>
                  Hoje, trabalhamos com mais de 100 marcas e 50 laboratórios, 
                  validando milhares de produtos e promovendo transparência em 
                  todo o ecossistema CPG.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Nossos Números</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">100+</div>
                  <div className="text-sm text-gray-600">Marcas Parceiras</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">50+</div>
                  <div className="text-sm text-gray-600">Laboratórios</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">10k+</div>
                  <div className="text-sm text-gray-600">Produtos Validados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">1M+</div>
                  <div className="text-sm text-gray-600">Validações Acessadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossa Equipe
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Especialistas dedicados a transformar o mercado CPG através da transparência
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-200 w-32 h-32 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Dr. Ana Silva</h3>
              <p className="text-primary-600 mb-2">CEO & Fundadora</p>
              <p className="text-gray-600 text-sm">
                PhD em Nutrição, 15 anos de experiência em regulamentação de alimentos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-200 w-32 h-32 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Carlos Santos</h3>
              <p className="text-primary-600 mb-2">CTO</p>
              <p className="text-gray-600 text-sm">
                Engenheiro de Software, especialista em plataformas de validação
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-200 w-32 h-32 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Dra. Maria Costa</h3>
              <p className="text-primary-600 mb-2">Diretora Científica</p>
              <p className="text-gray-600 text-sm">
                Bioquímica, especialista em análises laboratoriais e acreditação
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossos Compromissos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Princípios que guiam cada decisão e ação da True Label
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparência Total</h3>
              <p className="text-gray-600 text-sm">
                Todas as validações são baseadas em evidências científicas verificáveis
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança de Dados</h3>
              <p className="text-gray-600 text-sm">
                Proteção rigorosa de todas as informações de marcas e laboratórios
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excelência Científica</h3>
              <p className="text-gray-600 text-sm">
                Parceria apenas com laboratórios acreditados e reconhecidos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Impacto Social</h3>
              <p className="text-gray-600 text-sm">
                Promover escolhas mais conscientes e informadas dos consumidores
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Faça Parte da Revolução da Transparência
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Junte-se a nós na missão de transformar o mercado CPG através da ciência e transparência
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/register"
              className="bg-white text-primary-600 hover:bg-gray-100 btn btn-lg"
            >
              Começar Agora
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 btn btn-lg"
            >
              Falar Conosco
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
