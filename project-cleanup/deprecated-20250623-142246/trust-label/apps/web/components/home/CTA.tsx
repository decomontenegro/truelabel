'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@trust-label/ui';
import { ArrowRight, CheckCircle } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-trust-600 to-trust-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Comece a Construir Confiança Hoje
          </h2>
          <p className="text-xl text-trust-100 mb-8">
            Junte-se a centenas de marcas que já estão aumentando vendas
            através da transparência verificada
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-trust-600 hover:bg-gray-100"
              asChild
            >
              <Link href="/register">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Falar com Vendas</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Teste grátis por 30 dias</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Suporte completo</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}