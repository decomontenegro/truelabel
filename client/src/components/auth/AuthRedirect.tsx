import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AuthRedirectProps {
  to: string;
}

const AuthRedirect = ({ to }: AuthRedirectProps) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to={to} replace />;
};

export default AuthRedirect;