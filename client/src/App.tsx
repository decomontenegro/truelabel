import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

// Components (sempre carregados)
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import AuthRedirect from '@/components/auth/AuthRedirect';
// QR Modal component
import GlobalQRModal from '@/components/qr/GlobalQRModal';
// import ErrorBoundaryComponent from '@/components/ErrorBoundary';
// import ChatWidget from '@/components/support/ChatWidget';
import { useToast } from '@/components/ui/Toast';

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PublicLayout from '@/components/layouts/PublicLayout';

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const AnalyticsDashboard = lazy(() => import('@/pages/dashboard/AnalyticsDashboard'));
const ProductsPage = lazy(() => import('@/pages/products/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/products/ProductDetailPageSimple'));
const CreateProductPage = lazy(() => import('@/pages/products/CreateProductPage'));
const ProductSealsPage = lazy(() => import('@/pages/products/ProductSealsPage'));
const EditProductPage = lazy(() => import('@/pages/products/EditProductPage'));
const ProductCertificationsPage = lazy(() => import('@/pages/products/ProductCertificationsPage'));
const ValidationsPage = lazy(() => import('@/pages/validations/ValidationsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const ValidationPublicPage = lazy(() => import('@/pages/public/ValidationPublicPage'));
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const TestConnectionPage = lazy(() => import('@/pages/TestConnectionPage'));
const LaboratoriesPage = lazy(() => import('@/pages/admin/LaboratoriesPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const ValidationsPageAdmin = lazy(() => import('@/pages/admin/ValidationsPage'));
const ValidationReviewPage = lazy(() => import('@/pages/admin/ValidationReviewPage'));
const QRAnalyticsPage = lazy(() => import('@/pages/qr/QRAnalyticsPage'));
const ValidationQueuePage = lazy(() => import('@/pages/admin/ValidationQueuePage'));
const LifecycleMonitoringPage = lazy(() => import('@/pages/admin/LifecycleMonitoringPage'));
const QRCodesPage = lazy(() => import('@/pages/brand/QRCodesPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const HowItWorksPage = lazy(() => import('@/pages/public/HowItWorksPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const PricingPage = lazy(() => import('@/pages/public/PricingPage'));
const FAQPage = lazy(() => import('@/pages/public/FAQPage'));
const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage'));
const SealTestPage = lazy(() => import('@/pages/test/SealTestPage'));
const QRTestPage = lazy(() => import('@/pages/test/QRTestPage'));
const ValidationTestPage = lazy(() => import('@/pages/test/ValidationTestPage'));
const SimpleValidationPage = lazy(() => import('@/pages/test/SimpleValidationPage'));
// const NutritionManagementPage = lazy(() => import('@/pages/nutrition/NutritionManagementPage')); // Temporariamente desabilitado
const SmartLabelPage = lazy(() => import('@/pages/public/SmartLabelPage'));
const SmartLabelTestPage = lazy(() => import('@/pages/test/SmartLabelTestPage'));
const SupportManagementPage = lazy(() => import('@/pages/admin/SupportManagementPage'));
const AnalyticsTestPage = lazy(() => import('@/pages/test/AnalyticsTestPage'));
const DesignSystemPage = lazy(() => import('@/pages/test/DesignSystemPage'));
const QRIndividualizationTest = lazy(() => import('@/pages/test/QRIndividualizationTest'));
const QRImplementationStatus = lazy(() => import('@/pages/test/QRImplementationStatus'));
const DebugSKUTest = lazy(() => import('@/pages/test/DebugSKUTest'));
const ValidationRulesTestPage = lazy(() => import('@/pages/test/ValidationRulesTestPage'));
const CertificationsManagementPage = lazy(() => import('@/pages/certifications/CertificationsManagementPage'));
const TraceabilityPage = lazy(() => import('@/pages/products/SimpleTraceabilityPage'));
const ReportParserTest = lazy(() => import('@/pages/test/ReportParserTest'));
const AutomatedValidationTestPage = lazy(() => import('@/pages/test/AutomatedValidationTestPage'));
const QRLifecycleTest = lazy(() => import('@/pages/test/QRLifecycleTest'));
const LaboratoryDashboard = lazy(() => import('@/pages/lab/LaboratoryDashboard'));
const DesignShowcase = lazy(() => import('@/pages/DesignShowcase'));
const BusinessMetrics = lazy(() => import('@/pages/admin/BusinessMetrics'));
const PrivacyDashboard = lazy(() => import('@/pages/PrivacyDashboard'));
const StatusPage = lazy(() => import('@/pages/StatusPage'));

// Non-lazy components
import FeedbackWidget from '@/components/FeedbackWidget';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  const { isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const { toasts } = useToast();

  // Verificar autenticação ao carregar a aplicação
  useEffect(() => {
    const verifyAuth = async () => {
      const token = useAuthStore.getState().token;

      if (token) {
        try {
          setLoading(true);
          const response = await authService.verifyToken();

          if (response.valid) {
            setAuth(response.user, token);
          } else {
            clearAuth();
          }
        } catch (error) {
          clearAuth();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [setAuth, clearAuth, setLoading]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<PublicLayout />} errorElement={<RouteErrorBoundary />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="validation/:qrCode" element={<ValidationPublicPage />} />
            <Route path="smart-label/:code" element={<SmartLabelPage />} />
            {import.meta.env.DEV && (
              <>
                <Route path="test-validation/:qrCode" element={<ValidationTestPage />} />
                <Route path="simple-validation/:qrCode" element={<SimpleValidationPage />} />
                <Route path="test-connection" element={<TestConnectionPage />} />
                <Route path="test-analytics" element={<AnalyticsTestPage />} />
                <Route path="design-system" element={<DesignSystemPage />} />
                <Route path="design-showcase" element={<DesignShowcase />} />
              </>
            )}
          </Route>

      {/* Rotas de autenticação */}
      <Route path="/auth" element={<AuthLayout />} errorElement={<RouteErrorBoundary />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* Rotas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
        errorElement={<RouteErrorBoundary />}
      >
        <Route index element={<DashboardPage />} />

        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsDashboard />} />

        {/* Produtos */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<CreateProductPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="products/:id/edit" element={<EditProductPage />} />
        <Route path="products/:productId/seals" element={<ProductSealsPage />} />
        <Route path="products/:productId/certifications" element={<ProductCertificationsPage />} />

        {/* Relatórios */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Validações */}
        <Route path="validations" element={<ValidationsPageAdmin />} />
        <Route path="validations/queue" element={<ValidationQueuePage />} />
        <Route path="validations/:id/review" element={<ValidationReviewPage />} />
        <Route path="validations/:id/feedback" element={<ValidationReviewPage />} />
        <Route path="qr-analytics/:productId" element={<QRAnalyticsPage />} />
        <Route path="validations/lifecycle" element={<LifecycleMonitoringPage />} />

        {/* Laboratórios */}
        <Route path="laboratories" element={<LaboratoriesPage />} />
        <Route path="lab/dashboard" element={<LaboratoryDashboard />} />
        <Route path="lab/reports" element={<ReportsPage />} />

        {/* QR Codes */}
        <Route path="qr-codes" element={<QRCodesPage />} />
        <Route path="qr-codes/:productId/analytics" element={<QRAnalyticsPage />} />

        {/* Nutrition Management */}
        {/* <Route path="nutrition" element={<NutritionManagementPage />} /> */} {/* Temporariamente desabilitado */}
        
        {/* Certifications Management */}
        <Route path="certifications" element={<CertificationsManagementPage />} />
        
        {/* Traceability */}
        <Route path="products/:productId/traceability" element={<TraceabilityPage />} />

        {/* Perfil */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Admin Routes */}
        <Route path="admin/support" element={<SupportManagementPage />} />
        <Route path="admin/metrics" element={<BusinessMetrics />} />
        <Route path="support-management" element={<SupportManagementPage />} />
        
        {/* Privacy */}
        <Route path="privacy" element={<PrivacyDashboard />} />

        {/* Rotas de teste - apenas em desenvolvimento */}
        {import.meta.env.DEV && (
          <>
            <Route path="test-seals" element={<SealTestPage />} />
            <Route path="test-qr" element={<QRTestPage />} />
            <Route path="test-smart-label" element={<SmartLabelTestPage />} />
            <Route path="test-analytics" element={<AnalyticsTestPage />} />
            <Route path="test-qr-individualization" element={<QRIndividualizationTest />} />
            <Route path="qr-implementation-status" element={<QRImplementationStatus />} />
            <Route path="debug-sku" element={<DebugSKUTest />} />
            <Route path="test-validation-rules" element={<ValidationRulesTestPage />} />
            <Route path="test-report-parser" element={<ReportParserTest />} />
            <Route path="test-automated-validation" element={<AutomatedValidationTestPage />} />
            <Route path="test-qr-lifecycle" element={<QRLifecycleTest />} />
          </>
        )}
      </Route>

      {/* Redirecionamentos */}
      <Route path="/login" element={<AuthRedirect to="/auth/login" />} />
      <Route path="/register" element={<AuthRedirect to="/auth/register" />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <GlobalQRModal />
      <FeedbackWidget />
    </div>
  );
}

export default App;
