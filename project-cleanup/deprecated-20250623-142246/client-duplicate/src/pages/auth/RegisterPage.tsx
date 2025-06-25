import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus, Building, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { RegisterForm } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      role: 'BRAND',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      
      setAuth(response.user, response.token);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Criar nova conta</h2>
        <p className="mt-2 text-sm text-gray-600">
          Ou{' '}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            entrar na sua conta existente
          </Link>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Tipo de conta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de conta
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative">
              <input
                {...register('role')}
                type="radio"
                value="BRAND"
                className="sr-only"
              />
              <div className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${selectedRole === 'BRAND' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}>
                <Building className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                <div className="text-sm font-medium text-center">Marca CPG</div>
                <div className="text-xs text-gray-500 text-center mt-1">
                  Empresas que fabricam produtos
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                {...register('role')}
                type="radio"
                value="LAB"
                className="sr-only"
              />
              <div className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${selectedRole === 'LAB' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}>
                <FlaskConical className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                <div className="text-sm font-medium text-center">Laboratório</div>
                <div className="text-xs text-gray-500 text-center mt-1">
                  Laboratórios de análise
                </div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {selectedRole === 'BRAND' ? 'Nome da Empresa' : 'Nome do Laboratório'}
          </label>
          <div className="mt-1">
            <input
              {...register('name', {
                required: 'Nome é obrigatório',
                minLength: {
                  value: 2,
                  message: 'Nome deve ter pelo menos 2 caracteres',
                },
              })}
              type="text"
              autoComplete="organization"
              className="input"
              placeholder={selectedRole === 'BRAND' ? 'Sua Empresa Ltda' : 'Laboratório de Análises'}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email corporativo
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
              className="input"
              placeholder="contato@suaempresa.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
              autoComplete="new-password"
              className="input pr-10"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            Concordo com os{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Política de Privacidade
            </Link>
          </label>
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
                <UserPlus className="h-4 w-4 mr-2" />
                Criar conta
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
