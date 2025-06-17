'use client';

import { motion } from 'framer-motion';
import { Building2, FlaskConical, QrCode, Smartphone } from 'lucide-react';

const steps = [
  {
    icon: Building2,
    title: 'Empresas Cadastram Produtos',
    description: 'Marcas registram seus produtos e reivindicações na plataforma TRUST Label.',
    color: 'bg-blue-500',
  },
  {
    icon: FlaskConical,
    title: 'Laboratórios Validam',
    description: 'Laboratórios acreditados realizam análises independentes e carregam relatórios.',
    color: 'bg-green-500',
  },
  {
    icon: QrCode,
    title: 'QR Codes São Gerados',
    description: 'Códigos QR únicos e seguros são criados para cada produto validado.',
    color: 'bg-purple-500',
  },
  {
    icon: Smartphone,
    title: 'Consumidores Verificam',
    description: 'Clientes escaneiam o QR code e acessam instantaneamente as informações verificadas.',
    color: 'bg-orange-500',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600">
              Processo simples e transparente para validação de produtos
            </p>
          </motion.div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 -translate-y-1/2 hidden lg:block" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-white rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center relative z-10`}>
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}