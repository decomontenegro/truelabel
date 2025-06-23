import React from 'react';
import { Check, Star, ArrowRight } from 'lucide-react';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'R$ 299',
      period: '/mês',
      description: 'Ideal para marcas iniciantes',
      features: [
        'Até 10 produtos',
        'Validações básicas',
        'QR Codes ilimitados',
        'Suporte por email',
        'Dashboard básico'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: 'R$ 799',
      period: '/mês',
      description: 'Para marcas em crescimento',
      features: [
        'Até 50 produtos',
        'Validações avançadas',
        'QR Codes ilimitados',
        'Suporte prioritário',
        'Analytics avançados',
        'API access',
        'Relatórios customizados'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      description: 'Para grandes empresas',
      features: [
        'Produtos ilimitados',
        'Validações premium',
        'QR Codes ilimitados',
        'Suporte dedicado',
        'Analytics completos',
        'API completa',
        'Integração customizada',
        'SLA garantido'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Planos e Preços
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Escolha o plano ideal para sua marca e comece a construir confiança 
              através da transparência científica.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-lg shadow-lg border-2 p-8 ${
                  plan.popular ? 'border-primary-500' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Mais Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full btn ${
                    plan.popular ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Falar com Vendas' : 'Começar Agora'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perguntas sobre Preços
            </h2>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Os preços incluem as análises laboratoriais?
              </h3>
              <p className="text-gray-600">
                Não, as análises laboratoriais são cobradas separadamente pelos laboratórios parceiros. 
                Nossos planos cobrem apenas o uso da plataforma de validação.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim, você pode cancelar sua assinatura a qualquer momento. Não há multas ou taxas de cancelamento.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Há desconto para pagamento anual?
              </h3>
              <p className="text-gray-600">
                Sim, oferecemos 20% de desconto para pagamentos anuais em todos os planos.
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
            Comece sua jornada de transparência hoje mesmo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/register" className="bg-white text-primary-600 hover:bg-gray-100 btn btn-lg">
              Teste Grátis por 14 Dias
            </a>
            <a href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 btn btn-lg">
              Falar com Especialista
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
