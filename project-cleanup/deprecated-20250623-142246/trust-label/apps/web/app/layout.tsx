import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@trust-label/ui';
import { Providers } from './providers';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TRUST Label - Transparência em Produtos de Consumo',
  description: 'Plataforma de validação transparente que conecta reivindicações de produtos a relatórios laboratoriais acreditados via códigos QR.',
  keywords: 'trust label, validação, produtos, transparência, qr code, laboratório, certificação',
  authors: [{ name: 'TRUST Label Team' }],
  openGraph: {
    title: 'TRUST Label',
    description: 'Transparência em Produtos de Consumo',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://trust.label',
    siteName: 'TRUST Label',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}