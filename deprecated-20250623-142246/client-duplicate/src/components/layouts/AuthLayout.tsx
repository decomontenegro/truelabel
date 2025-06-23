import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/components/ui/Logo';

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore();

  // Se já estiver autenticado, redirecionar para dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo variant="default" size="lg" />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Plataforma de Validação Transparente
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Ao continuar, você concorda com nossos{' '}
          <a href="/terms" className="text-primary-600 hover:text-primary-500">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/privacy" className="text-primary-600 hover:text-primary-500">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
