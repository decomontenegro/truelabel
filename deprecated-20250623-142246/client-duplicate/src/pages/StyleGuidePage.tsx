import React from 'react';
import Logo from '@/components/ui/Logo';
import ColorPalette from '@/components/ui/ColorPalette';

const StyleGuidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="xl" className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Style Guide</h1>
          <p className="text-lg text-gray-600">
            Guia de identidade visual da True Label
          </p>
        </div>

        {/* Logo Variations */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Variações do Logo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Default Logo */}
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Padrão (Preto)</h3>
              <div className="flex justify-center">
                <Logo variant="default" size="lg" />
              </div>
            </div>

            {/* Blue Logo */}
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Azul</h3>
              <div className="flex justify-center">
                <Logo variant="blue" size="lg" />
              </div>
            </div>

            {/* White Logo */}
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-white mb-4">Branco</h3>
              <div className="flex justify-center">
                <Logo variant="white" size="lg" />
              </div>
            </div>
          </div>

          {/* Icon Only */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Apenas Ícone</h3>
            <div className="flex space-x-8 items-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <Logo iconOnly variant="default" size="lg" />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <Logo iconOnly variant="blue" size="lg" />
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-200">
                <Logo iconOnly variant="white" size="lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <ColorPalette />
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Tipografia</h2>
          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Heading 1 - Inter Bold</h1>
                <p className="text-sm text-gray-500 mt-1">text-4xl font-bold</p>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-900">Heading 2 - Inter Semibold</h2>
                <p className="text-sm text-gray-500 mt-1">text-3xl font-semibold</p>
              </div>
              <div>
                <h3 className="text-2xl font-medium text-gray-900">Heading 3 - Inter Medium</h3>
                <p className="text-sm text-gray-500 mt-1">text-2xl font-medium</p>
              </div>
              <div>
                <p className="text-base text-gray-700">
                  Texto do corpo - Inter Regular. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="text-sm text-gray-500 mt-1">text-base</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Texto pequeno - Inter Regular. Usado para legendas e informações secundárias.
                </p>
                <p className="text-sm text-gray-500 mt-1">text-sm</p>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Botões</h2>
          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Botão Primário
                </button>
                <button className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                  Botão Secundário
                </button>
                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Botão Neutro
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StyleGuidePage;
