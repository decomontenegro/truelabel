import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Package,
  FileText,
  CheckCircle,
  FlaskConical,
  User,
  LogOut,
  Bell,
  Settings,
  QrCode,
  BarChart3,
  HeadphonesIcon,
  Apple,
  Award,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';
import NotificationDropdown from '@/components/ui/NotificationDropdown';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    toast.success('Logout realizado com sucesso');
    navigate('/');
  };

  // Navegação específica para laboratórios
  const labNavigation = [
    { name: 'Dashboard', href: '/dashboard/lab/dashboard', icon: Home, roles: ['LAB'] },
    { name: 'Relatórios', href: '/dashboard/lab/reports', icon: FileText, roles: ['LAB'] },
    { name: 'Validações', href: '/dashboard/validations', icon: CheckCircle, roles: ['LAB'] },
    { name: 'Nutrição', href: '/dashboard/nutrition', icon: Apple, roles: ['LAB'] },
  ];

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['ADMIN', 'BRAND'] },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['ADMIN', 'BRAND'] },
    { name: 'Produtos', href: '/dashboard/products', icon: Package, roles: ['ADMIN', 'BRAND'] },
    { name: 'Certificações', href: '/dashboard/certifications', icon: Award, roles: ['ADMIN', 'BRAND'] },
    { name: 'Nutrição', href: '/dashboard/nutrition', icon: Apple, roles: ['ADMIN', 'BRAND'] },
    { name: 'Relatórios', href: '/dashboard/reports', icon: FileText, roles: ['ADMIN', 'BRAND'] },
    { name: 'Validações', href: '/dashboard/validations', icon: CheckCircle, roles: ['ADMIN', 'BRAND'] },
    { name: 'Ciclo de Vida', href: '/dashboard/validations/lifecycle', icon: Clock, roles: ['ADMIN'] },
    { name: 'QR Codes', href: '/dashboard/qr-codes', icon: QrCode, roles: ['ADMIN', 'BRAND'] },
    { name: 'Laboratórios', href: '/dashboard/laboratories', icon: FlaskConical, roles: ['ADMIN'] },
    { name: 'Suporte', href: '/dashboard/support-management', icon: HeadphonesIcon, roles: ['ADMIN'] },
  ];

  const filteredNavigation = user?.role === 'LAB' 
    ? labNavigation
    : navigation.filter(item => item.roles.includes(user?.role || ''));

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Logo variant="default" size="md" />
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link group flex items-center text-base font-medium ${
                    isActive(item.href) ? 'nav-link-active' : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-4 h-6 w-6 transition-transform duration-200 ${
                    isActive(item.href) ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Logo variant="default" size="md" />
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link group flex items-center text-sm font-medium ${
                    isActive(item.href) ? 'nav-link-active' : ''
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-transform duration-200 ${
                    isActive(item.href) ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {filteredNavigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationDropdown />

                {/* User menu */}
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/dashboard/profile"
                      className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="hidden md:block">{user?.name}</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Sair"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
