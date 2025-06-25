'use client';

import Link from 'next/link';
import { Button } from '@trust-label/ui';
import { Shield, QrCode, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-gradient-to-b from-trust-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-6">
              <Shield className="h-16 w-16 text-trust-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transparência Total em{' '}
              <span className="text-trust-600">Produtos de Consumo</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Conecte reivindicações de produtos a relatórios laboratoriais
              verificados através de QR codes inteligentes. Construa confiança,
              aumente vendas.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button size="lg" asChild>
              <Link href="/register">Começar Gratuitamente</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">
                <QrCode className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Validação Laboratorial</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Blockchain Seguro</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Conformidade ANVISA</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Image/Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 max-w-6xl mx-auto"
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-trust-500 to-trust-700 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-4">
                  Como o TRUST Label Funciona
                </h3>
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      1
                    </span>
                    <span>Empresas cadastram produtos e reivindicações</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </span>
                    <span>Laboratórios validam com análises independentes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      3
                    </span>
                    <span>QR codes únicos são gerados para cada produto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      4
                    </span>
                    <span>Consumidores verificam instantaneamente</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                  <QrCode className="h-48 w-48 text-trust-600" />
                  <p className="text-center mt-4 text-gray-600 font-medium">
                    Escaneie para verificar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}