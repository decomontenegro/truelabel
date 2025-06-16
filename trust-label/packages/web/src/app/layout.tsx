import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TRUST LABEL - Transparência em Validação de Produtos',
  description: 'Plataforma de validação inteligente que conecta claims de produtos a laudos laboratoriais acreditados',
  keywords: 'trust label, validação, cpg, transparência, laboratório, qr code',
  authors: [{ name: 'TRUST LABEL Team' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://trust-label.com',
    siteName: 'TRUST LABEL',
    title: 'TRUST LABEL - Transparência em Validação de Produtos',
    description: 'Validação inteligente de produtos CPG com IA',
    images: [
      {
        url: 'https://trust-label.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TRUST LABEL Platform',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}