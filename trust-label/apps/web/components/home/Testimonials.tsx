'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@trust-label/ui';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'CEO, Naturals Brasil',
    company: 'Marca de Cosméticos',
    content: 'O TRUST Label transformou completamente nossa relação com os clientes. As vendas aumentaram 40% após implementarmos a validação transparente.',
    rating: 5,
    image: '/images/testimonial-1.jpg',
  },
  {
    name: 'Dr. Carlos Mendes',
    role: 'Diretor Técnico',
    company: 'LabTest Análises',
    content: 'A plataforma nos trouxe novos clientes e valorizou nosso trabalho. É gratificante ver nossas análises gerando confiança no mercado.',
    rating: 5,
    image: '/images/testimonial-2.jpg',
  },
  {
    name: 'Ana Costa',
    role: 'Consumidora',
    company: 'São Paulo, SP',
    content: 'Finalmente posso confiar no que compro! Escaneio o QR code e vejo exatamente o que estou consumindo. Mudou minha forma de comprar.',
    rating: 5,
    image: '/images/testimonial-3.jpg',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-gray-600">
              Histórias de sucesso de marcas, laboratórios e consumidores
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full relative">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-trust-100" />
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-trust-100 rounded-full flex items-center justify-center">
                      <span className="text-trust-600 font-bold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}