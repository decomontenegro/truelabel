'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@trust-label/ui';
import { TrendingUp, Shield, Users, Zap } from 'lucide-react';

const benefits = {
  brands: {
    title: 'Para Marcas',
    icon: TrendingUp,
    items: [
      'Aumente vendas com transparência verificada',
      'Diferencie-se da concorrência',
      'Construa lealdade do consumidor',
      'Reduza custos com recalls',
      'Analytics detalhado de engajamento',
      'Conformidade regulatória simplificada',
    ],
  },
  consumers: {
    title: 'Para Consumidores',
    icon: Users,
    items: [
      'Verifique instantaneamente reivindicações',
      'Acesse relatórios laboratoriais completos',
      'Compare produtos com confiança',
      'Denuncie produtos suspeitos',
      'Histórico de produtos verificados',
      'Alertas sobre recalls e atualizações',
    ],
  },
  laboratories: {
    title: 'Para Laboratórios',
    icon: Shield,
    items: [
      'Nova fonte de receita',
      'Valorização de análises',
      'Visibilidade aumentada',
      'Processo digital simplificado',
      'Integração com sistemas existentes',
      'Reconhecimento de qualidade',
    ],
  },
};

export function Benefits() {
  return (
    <section id="benefits" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Benefícios para Todos
            </h2>
            <p className="text-xl text-gray-600">
              TRUST Label cria valor para todo o ecossistema de produtos de consumo
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {Object.entries(benefits).map(([key, benefit], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-trust-600" />
                    </div>
                    <CardTitle>{benefit.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {benefit.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <Zap className="h-5 w-5 text-trust-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}