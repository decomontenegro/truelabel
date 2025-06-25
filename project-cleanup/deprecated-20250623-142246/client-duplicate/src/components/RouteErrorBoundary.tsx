import React from 'react';
import { useRouteError, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { captureError } from '@/lib/sentry';

/**
 * Error Boundary para rotas do React Router v6
 * Captura erros em rotas e exibe uma página de erro amigável
 */
export default function RouteErrorBoundary() {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  React.useEffect(() => {
    // Captura o erro no Sentry
    if (error) {
      console.error('Route error:', error);
      captureError(error, {
        context: 'route-error',
        path: window.location.pathname,
      });
    }
  }, [error]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Determinar o tipo de erro
  const isNotFound = error?.message?.includes('404') || error?.message?.includes('Not Found');
  const isUnauthorized = error?.message?.includes('401') || error?.message?.includes('Unauthorized');
  const isForbidden = error?.message?.includes('403') || error?.message?.includes('Forbidden');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>

            {isNotFound ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Página não encontrada
                </h2>
                <p className="text-gray-600 mb-8">
                  A página que você está procurando não existe ou foi movida.
                </p>
              </>
            ) : isUnauthorized ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">401</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Não autorizado
                </h2>
                <p className="text-gray-600 mb-8">
                  Você precisa fazer login para acessar esta página.
                </p>
              </>
            ) : isForbidden ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">403</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Acesso negado
                </h2>
                <p className="text-gray-600 mb-8">
                  Você não tem permissão para acessar esta página.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Oops!</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Algo deu errado
                </h2>
                <p className="text-gray-600 mb-8">
                  Ocorreu um erro inesperado. Por favor, tente novamente.
                </p>
              </>
            )}

            {/* Detalhes do erro em desenvolvimento */}
            {import.meta.env.DEV && error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalhes do erro
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded">
                  <p className="text-xs font-mono text-red-600 break-words">
                    {error.message || error.toString()}
                  </p>
                  {error.stack && (
                    <pre className="mt-2 text-xs text-gray-700 overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              {isUnauthorized ? (
                <Link
                  to="/auth/login"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Fazer Login
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleGoBack}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </button>

                  <button
                    onClick={handleReload}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recarregar
                  </button>
                </>
              )}

              <Link
                to="/"
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir para o início
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Se o problema persistir,{' '}
          <Link
            to="/support"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            entre em contato com o suporte
          </Link>
        </p>
      </div>
    </div>
  );
}