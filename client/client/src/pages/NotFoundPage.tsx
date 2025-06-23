import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Página não encontrada
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            A página que você está procurando não existe.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn-outline flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Se você acredita que isso é um erro, entre em contato conosco.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
