import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Política de Privacidade
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transparência sobre como coletamos, usamos e protegemos seus dados
            </p>
            <p className="text-sm text-gray-500">
              Última atualização: 30 de maio de 2024
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Proteção</h3>
                <p className="text-sm text-gray-600">Dados protegidos com criptografia</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Segurança</h3>
                <p className="text-sm text-gray-600">Acesso restrito e controlado</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Eye className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Transparência</h3>
                <p className="text-sm text-gray-600">Uso claro e informado</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">LGPD</h3>
                <p className="text-sm text-gray-600">Conformidade total</p>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Informações que Coletamos</h2>
            <p className="text-gray-600 mb-6">
              Coletamos informações que você nos fornece diretamente, informações coletadas automaticamente 
              quando você usa nossos serviços, e informações de terceiros quando aplicável.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Dados de cadastro (nome, email, empresa)</li>
              <li>Informações de produtos e claims</li>
              <li>Dados de contato e comunicação</li>
              <li>Informações de pagamento (processadas por terceiros)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Dados de uso da plataforma</li>
              <li>Informações do dispositivo e navegador</li>
              <li>Endereço IP e localização aproximada</li>
              <li>Cookies e tecnologias similares</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Como Usamos suas Informações</h2>
            <p className="text-gray-600 mb-6">
              Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, 
              bem como para comunicação e conformidade legal.
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Fornecer e operar a plataforma True Label</li>
              <li>Processar validações de produtos</li>
              <li>Comunicar sobre serviços e atualizações</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Prevenir fraudes e garantir segurança</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. Compartilhamento de Informações</h2>
            <p className="text-gray-600 mb-6">
              Não vendemos suas informações pessoais. Compartilhamos dados apenas nas seguintes situações:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Com laboratórios parceiros para validações (dados necessários apenas)</li>
              <li>Com prestadores de serviços que nos auxiliam (sob acordos de confidencialidade)</li>
              <li>Quando exigido por lei ou autoridades competentes</li>
              <li>Para proteger direitos, propriedade ou segurança</li>
              <li>Com seu consentimento explícito</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Segurança dos Dados</h2>
            <p className="text-gray-600 mb-6">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups seguros e regulares</li>
              <li>Treinamento regular da equipe</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. Seus Direitos (LGPD)</h2>
            <p className="text-gray-600 mb-6">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação dos dados tratados com consentimento</li>
              <li>Revogação do consentimento</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Retenção de Dados</h2>
            <p className="text-gray-600 mb-6">
              Mantemos suas informações pelo tempo necessário para cumprir os propósitos descritos 
              nesta política, exceto quando um período de retenção mais longo for exigido por lei.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Cookies</h2>
            <p className="text-gray-600 mb-6">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
              analisar o uso da plataforma e personalizar conteúdo. Você pode controlar 
              cookies através das configurações do seu navegador.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Alterações nesta Política</h2>
            <p className="text-gray-600 mb-6">
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças 
              significativas através da plataforma ou por email.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Contato</h2>
            <p className="text-gray-600 mb-6">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>

            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-2">
                <strong>Email:</strong> privacidade@truelabel.com
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Telefone:</strong> +55 (11) 3000-0000
              </p>
              <p className="text-gray-600">
                <strong>Endereço:</strong> Av. Paulista, 1000 - São Paulo, SP - 01310-100
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
