'use client';

import { 
  Shield, 
  QrCode, 
  FileCheck, 
  Users, 
  BarChart3, 
  Lock,
  Microscope,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: QrCode,
    title: 'QR Codes Inteligentes',
    description: 'Cada produto recebe um QR code único e seguro que conecta diretamente aos relatórios de validação.',
  },
  {
    icon: Microscope,
    title: 'Validação Laboratorial',
    description: 'Parceria com laboratórios acreditados para análises independentes e confiáveis.',
  },
  {
    icon: Shield,
    title: 'Blockchain Seguro',
    description: 'Dados imutáveis e rastreáveis garantem a integridade das informações.',
  },
  {
    icon: FileCheck,
    title: 'Conformidade Total',
    description: 'Atendimento completo às normas ANVISA, INMETRO e regulamentações internacionais.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Dashboards completos com insights sobre escaneamentos e engajamento.',
  },
  {
    icon: Users,
    title: 'Portal do Consumidor',
    description: 'Interface intuitiva para verificação instantânea de produtos e denúncias.',
  },
  {
    icon: Lock,
    title: 'Segurança de Dados',
    description: 'Criptografia de ponta a ponta e conformidade com LGPD.',
  },
  {
    icon: Award,
    title: 'Certificação Digital',
    description: 'Selos digitais verificáveis para produtos validados.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recursos Poderosos para Transparência Total
            </h2>
            <p className="text-xl text-gray-600">
              Tecnologia de ponta para garantir a veracidade das informações
              de produtos e construir confiança com consumidores.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-trust-100 rounded-lg mb-4">
                <feature.icon className="h-6 w-6 text-trust-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}