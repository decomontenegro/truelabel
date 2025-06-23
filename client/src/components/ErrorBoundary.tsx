import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureError } from '@/lib/sentry';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Captura erros em qualquer componente filho e exibe uma UI de fallback
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro no console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Captura o erro no Sentry
    captureError(error, {
      componentStack: errorInfo.componentStack,
      props: this.props,
    });

    // Chama callback customizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Atualiza o state com informações do erro
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Se um fallback customizado foi fornecido, use-o
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // UI de fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Ops! Algo deu errado
              </h1>
              
              <p className="text-gray-600 mb-6">
                Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
              </p>

              {/* Detalhes do erro em desenvolvimento */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Detalhes técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
                    <p className="font-semibold text-red-600">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-gray-700 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </button>
                
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir para início
                </Link>
              </div>
            </div>

            {/* Link para suporte */}
            <p className="mt-4 text-center text-sm text-gray-500">
              Precisa de ajuda?{' '}
              <a
                href="/support"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Entre em contato com o suporte
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Hook para usar com Error Boundaries
 * Permite que componentes funcionais "lancem" erros para o Error Boundary
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    throwError: setError,
    clearError: () => setError(null),
  };
}