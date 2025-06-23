import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { LoginForm } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await authService.login(data);

      setAuth(response.user, response.token);
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Entrar na sua conta</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Ou{' '}
          <Link
            to="/auth/register"
            className="link font-medium"
          >
            criar uma nova conta
          </Link>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 transition-colors duration-200 hover:text-neutral-900">
            Email
          </label>
          <div className="mt-1">
            <input
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
              type="email"
              autoComplete="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error-600 animate-slide-down">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 transition-colors duration-200 hover:text-neutral-900">
            Senha
          </label>
          <div className="mt-1 relative">
            <input
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres',
                },
              })}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Sua senha"
            />
            <button
              type="button"
              className="icon-btn absolute inset-y-0 right-0 pr-3"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-neutral-400" />
              ) : (
                <Eye className="h-5 w-5 text-neutral-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-error-600 animate-slide-down">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="checkbox"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-900 cursor-pointer hover:text-neutral-700 transition-colors duration-200">
              Lembrar de mim
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/auth/forgot-password"
              className="link font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex justify-center items-center"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-neutral-500">Ou</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Primeira vez aqui?{' '}
            <Link
              to="/auth/register"
              className="link font-medium"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      {/* Demo credentials */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Contas de demonstração:</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Admin:</strong> admin@cpgvalidation.com / admin123</p>
          <p><strong>Marca:</strong> marca@exemplo.com / brand123</p>
          <p><strong>Lab:</strong> analista@labexemplo.com / lab123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
