import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { name: 'Como Funciona', href: '/how-it-works' },
      { name: 'Benefícios', href: '/benefits' },
      { name: 'Preços', href: '/pricing' },
      { name: 'FAQ', href: '/faq' },
    ],
    empresa: [
      { name: 'Sobre Nós', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Carreiras', href: '/careers' },
      { name: 'Contato', href: '/contact' },
    ],
    legal: [
      { name: 'Termos de Uso', href: '/terms' },
      { name: 'Privacidade', href: '/privacy' },
      { name: 'Cookies', href: '/cookies' },
      { name: 'Segurança', href: '/security' },
    ],
    social: [
      { name: 'LinkedIn', href: 'https://linkedin.com/company/trust-label' },
      { name: 'Twitter', href: 'https://twitter.com/trustlabel' },
      { name: 'Instagram', href: 'https://instagram.com/trustlabel' },
      { name: 'YouTube', href: 'https://youtube.com/@trustlabel' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-trust-400" />
              <span className="font-bold text-xl text-white">TRUST Label</span>
            </Link>
            <p className="text-sm mb-4">
              Transparência e confiança em produtos de consumo através de validação
              laboratorial independente e tecnologia blockchain.
            </p>
            <p className="text-xs text-gray-500">
              © {currentYear} TRUST Label. Todos os direitos reservados.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Produto</h3>
            <ul className="space-y-2">
              {footerLinks.produto.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-trust-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-trust-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-trust-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              Desenvolvido com 💙 para um mundo mais transparente
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {footerLinks.social.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-trust-400 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}