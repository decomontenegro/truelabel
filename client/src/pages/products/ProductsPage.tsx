import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Package } from 'lucide-react';
import { productService } from '@/services/productService';
import { validationService } from '@/services/validationService';
import { useAuthStore } from '@/stores/authStore';
import { useQRStore } from '@/stores/qrStore';
import { debounce } from '@/lib/utils';
import ProductRow from '@/components/products/ProductRow';
import ProductCard from '@/components/products/ProductCard';
import Pagination from '@/components/ui/Pagination';
import { FeedbackWrapper } from '@/components/ui/FeedbackWrapper';
import { ProductEmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';

const ProductsPage = () => {
  const { user } = useAuthStore();
  const { openModal } = useQRStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearch(value);
      setPage(1); // Reset page on search
    }, 300),
    []
  );

  // Callbacks devem vir antes de qualquer return condicional
  const handleQRCodeClick = useCallback((product: any) => {
    openModal(product.id, product.name);
  }, [openModal]);

  const handleValidateClick = useCallback(async (product: any) => {
    try {
      // Primeiro, verificar se já existe uma validação para este produto
      const existingValidations = await validationService.getValidations({
        productId: product.id,
        page: 1,
        limit: 1
      });

      if (existingValidations.data && existingValidations.data.length > 0) {
        // Se já existe validação, redirecionar para a página de revisão
        const existingValidation = existingValidations.data[0];
        toast.info('Redirecionando para a validação existente...');
        navigate(`/dashboard/validations/${existingValidation.id}/review`);
        return;
      }

      const response = await validationService.createValidation({
        productId: product.id,
        type: 'MANUAL',
        status: 'PENDING',
        claimsValidated: {},
        summary: 'Validação manual solicitada',
        notes: 'Validação solicitada através da interface de produtos'
      });

      toast.success('Validação solicitada com sucesso!');

      // Invalidar cache para recarregar produtos e atualizar o status
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: any) {
      console.error('Erro ao solicitar validação:', error);

      // Verificar se é erro de validação duplicada (409)
      if (error?.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData?.message?.includes('already exists')) {
          toast.error('Este produto já possui uma validação. Acesse a seção "Validações" para visualizar ou atualizar.');
        } else {
          toast.error('Validação já existe para este produto');
        }
      } else if (error?.response?.status === 400) {
        const errorData = error.response.data;
        toast.error(errorData?.message || 'Dados inválidos para validação');
      } else if (error?.response?.status === 404) {
        toast.error('Produto não encontrado');
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao solicitar validação';
        toast.error(errorMessage);
      }
    }
  }, [queryClient, navigate]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  }, []);

  // Queries
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', { search: debouncedSearch, category, status, page }],
    queryFn: () => productService.getProducts({ 
      search: debouncedSearch, 
      category, 
      status, 
      page, 
      limit: 10 
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  // Dados derivados
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie seus produtos e validações</p>
        </div>

        {(user?.role === 'BRAND' || user?.role === 'ADMIN') && (
          <Link
            to="/dashboard/products/new"
            className="btn-primary flex items-center mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>

          <select
            value={category}
            onChange={handleCategoryChange}
            className="select"
          >
            <option value="">Todas as categorias</option>
            {categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={handleStatusChange}
            className="select"
          >
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="PENDING">Pendente</option>
            <option value="VALIDATED">Validado</option>
            <option value="REJECTED">Rejeitado</option>
            <option value="EXPIRED">Expirado</option>
          </select>

          <button className="btn-outline flex items-center justify-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Products List */}
      <FeedbackWrapper
        loading={isLoading}
        error={error}
        empty={products.length === 0}
        loadingVariant="list"
        loadingCount={5}
        emptyTitle={search || category || status ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
        emptyDescription={
          search || category || status
            ? 'Tente ajustar os filtros de busca.'
            : 'Comece cadastrando seu primeiro produto.'
        }
        emptyAction={
          (user?.role === 'BRAND' || user?.role === 'ADMIN') && !search && !category && !status
            ? {
                label: 'Cadastrar Produto',
                onClick: () => navigate('/dashboard/products/new'),
              }
            : undefined
        }
      >
      {products.length > 0 && (
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    userRole={user?.role}
                    onQRCodeClick={handleQRCodeClick}
                    onValidateClick={handleValidateClick}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                userRole={user?.role}
                onQRCodeClick={handleQRCodeClick}
                onValidateClick={handleValidateClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
      </FeedbackWrapper>
    </div>
  );
};

export default ProductsPage;
