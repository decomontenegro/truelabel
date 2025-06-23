import { Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Logo from '@/components/ui/Logo';

const PublicLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <Logo variant="default" size="md" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Início
              </Link>
              <Link
                to="/about"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sobre
              </Link>
              <Link
                to="/how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Como Funciona
              </Link>
              <Link
                to="/auth/login"
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/auth/register"
                className="btn-primary"
              >
                Cadastrar
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Início
                </Link>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sobre
                </Link>
                <Link
                  to="/how-it-works"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Como Funciona
                </Link>
                <Link
                  to="/auth/login"
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  className="btn-primary w-fit"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cadastrar
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4">
                <Logo variant="default" size="md" />
              </div>
              <p className="text-gray-600 text-sm">
                Plataforma de validação transparente que conecta claims de produtos
                a laudos laboratoriais acreditados, promovendo confiança no mercado CPG.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Produto
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link to="/how-it-works" className="hover:text-gray-900">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-gray-900">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-gray-900">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Empresa
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link to="/about" className="hover:text-gray-900">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-gray-900">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-gray-900">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 True Label. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
