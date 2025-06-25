import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Mail, 
  Check, 
  X, 
  AlertCircle, 
  Info,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  Home,
  Shield,
  BarChart,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function DesignShowcase() {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);

  const showToast = (type: 'success' | 'error' | 'loading' | 'custom') => {
    switch (type) {
      case 'success':
        toast.success('Operação realizada com sucesso!');
        break;
      case 'error':
        toast.error('Ocorreu um erro ao processar a solicitação');
        break;
      case 'loading':
        toast.loading('Processando...');
        setTimeout(() => toast.dismiss(), 2000);
        break;
      case 'custom':
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-lg rounded-lg p-4 flex items-center`}>
            <Shield className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="font-medium">Validação Concluída</p>
              <p className="text-sm text-gray-600">Produto verificado com sucesso</p>
            </div>
          </div>
        ));
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Design Showcase</h1>
          <p className="text-lg text-gray-600">
            Todos os componentes e estilos do True Label em um só lugar
          </p>
        </div>

        {/* Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Cores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="w-full h-24 bg-primary-600 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-gray-500">#2563eb</p>
            </div>
            <div className="text-center">
              <div className="w-full h-24 bg-green-600 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-gray-500">#16a34a</p>
            </div>
            <div className="text-center">
              <div className="w-full h-24 bg-yellow-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-gray-500">#eab308</p>
            </div>
            <div className="text-center">
              <div className="w-full h-24 bg-red-600 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Danger</p>
              <p className="text-xs text-gray-500">#dc2626</p>
            </div>
            <div className="text-center">
              <div className="w-full h-24 bg-gray-600 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Gray</p>
              <p className="text-xs text-gray-500">#4b5563</p>
            </div>
            <div className="text-center">
              <div className="w-full h-24 bg-gray-900 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Dark</p>
              <p className="text-xs text-gray-500">#111827</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Tipografia</h2>
          <Card className="p-6">
            <h1 className="text-4xl font-bold mb-4">Heading 1 - Bold</h1>
            <h2 className="text-3xl font-semibold mb-4">Heading 2 - Semibold</h2>
            <h3 className="text-2xl font-medium mb-4">Heading 3 - Medium</h3>
            <h4 className="text-xl font-medium mb-4">Heading 4 - Medium</h4>
            <p className="text-lg mb-4">Parágrafo grande - Lorem ipsum dolor sit amet</p>
            <p className="mb-4">Parágrafo normal - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p className="text-sm text-gray-600 mb-4">Texto pequeno - Lorem ipsum dolor sit amet</p>
            <p className="text-xs text-gray-500">Texto extra pequeno - Lorem ipsum dolor sit amet</p>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Botões</h2>
          <Card className="p-6">
            <div className="space-y-6">
              {/* Primary Buttons */}
              <div>
                <h3 className="text-lg font-medium mb-3">Primary</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary">Default</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    With Icon
                  </Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h3 className="text-lg font-medium mb-3">Secondary</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="sm">Small</Button>
                  <Button variant="secondary">Default</Button>
                  <Button variant="secondary" size="lg">Large</Button>
                  <Button variant="secondary" disabled>Disabled</Button>
                </div>
              </div>

              {/* Outline Buttons */}
              <div>
                <h3 className="text-lg font-medium mb-3">Outline</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">Small</Button>
                  <Button variant="outline">Default</Button>
                  <Button variant="outline" size="lg">Large</Button>
                  <Button variant="outline" disabled>Disabled</Button>
                </div>
              </div>

              {/* Danger Buttons */}
              <div>
                <h3 className="text-lg font-medium mb-3">Danger</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="danger" size="sm">Delete</Button>
                  <Button variant="danger">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                  <Button variant="danger" disabled>Disabled</Button>
                </div>
              </div>

              {/* Ghost Buttons */}
              <div>
                <h3 className="text-lg font-medium mb-3">Ghost</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" size="sm">Small</Button>
                  <Button variant="ghost">Default</Button>
                  <Button variant="ghost">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Form Elements */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Formulários</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Input Fields</h3>
              <div className="space-y-4">
                <Input
                  label="Nome Completo"
                  placeholder="Digite seu nome"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@exemplo.com"
                  icon={<Mail className="w-5 h-5 text-gray-400" />}
                />
                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                />
                <Input
                  label="Buscar"
                  placeholder="Buscar produtos..."
                  icon={<Search className="w-5 h-5 text-gray-400" />}
                />
                <Input
                  label="Campo Desabilitado"
                  placeholder="Não editável"
                  disabled
                />
                <Input
                  label="Campo com Erro"
                  placeholder="Campo inválido"
                  error="Este campo é obrigatório"
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Select & Checkbox</h3>
              <div className="space-y-4">
                <Select
                  label="Categoria"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  options={[
                    { value: '', label: 'Selecione uma categoria' },
                    { value: 'alimentos', label: 'Alimentos' },
                    { value: 'bebidas', label: 'Bebidas' },
                    { value: 'cosmeticos', label: 'Cosméticos' },
                  ]}
                />
                
                <Select
                  label="Status"
                  value=""
                  onChange={() => {}}
                  options={[
                    { value: '', label: 'Selecione um status' },
                    { value: 'active', label: 'Ativo' },
                    { value: 'inactive', label: 'Inativo' },
                  ]}
                  disabled
                />

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checkboxValue}
                      onChange={(e) => setCheckboxValue(e.target.checked)}
                      className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm">Aceito os termos de uso</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="option"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm">Opção 1</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="option"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm">Opção 2</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Digite uma descrição..."
                  />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <BarChart className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold">Total de Vendas</h3>
                  <p className="text-2xl font-bold">R$ 45.231</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">+12.5% em relação ao mês anterior</p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold mb-2">Card Interativo</h3>
              <p className="text-gray-600 mb-4">
                Este card tem hover effect e transição suave.
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Ver Detalhes
              </Button>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-600">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="font-semibold text-green-900">Validação Aprovada</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Produto verificado e aprovado com sucesso.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Alerts */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Alertas</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="font-medium text-blue-900">Informação</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Esta é uma mensagem informativa para o usuário.
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="font-medium text-green-900">Sucesso</h3>
                <p className="text-sm text-green-700 mt-1">
                  Operação realizada com sucesso!
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="font-medium text-yellow-900">Aviso</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Atenção: Esta ação requer confirmação.
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <X className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="font-medium text-red-900">Erro</h3>
                <p className="text-sm text-red-700 mt-1">
                  Ocorreu um erro ao processar sua solicitação.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Estados de Carregamento</h2>
          <Card className="p-6">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <LoadingSpinner size="small" />
                <p className="text-sm mt-2">Small</p>
              </div>
              <div className="text-center">
                <LoadingSpinner />
                <p className="text-sm mt-2">Default</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="large" />
                <p className="text-sm mt-2">Large</p>
              </div>
              <div className="text-center">
                <Button loading>
                  Carregando
                </Button>
                <p className="text-sm mt-2">Button</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Toasts */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Notificações Toast</h2>
          <Card className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => showToast('success')}>
                Success Toast
              </Button>
              <Button variant="danger" onClick={() => showToast('error')}>
                Error Toast
              </Button>
              <Button variant="secondary" onClick={() => showToast('loading')}>
                Loading Toast
              </Button>
              <Button variant="outline" onClick={() => showToast('custom')}>
                Custom Toast
              </Button>
            </div>
          </Card>
        </section>

        {/* Tables */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Tabelas</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Produto Exemplo</div>
                          <div className="text-sm text-gray-500">Categoria: Alimentos</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">PRD-001</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Validado
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Outro Produto</div>
                          <div className="text-sm text-gray-500">Categoria: Bebidas</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">PRD-002</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pendente
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Icons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Ícones</h2>
          <Card className="p-6">
            <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
              {[
                Home, Shield, BarChart, Settings, Bell, Mail, 
                Search, Download, Upload, Edit, Trash2, Plus,
                Check, X, AlertCircle, Info, ChevronRight
              ].map((Icon, index) => (
                <div key={index} className="flex flex-col items-center p-3 hover:bg-gray-50 rounded-lg">
                  <Icon className="h-6 w-6 text-gray-700 mb-1" />
                  <span className="text-xs text-gray-500">{Icon.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}