import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw, FileText, Filter, Download, Search, CheckCircle } from 'lucide-react';
import { format, isPast, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { validationService } from '@/services/validationService';
import { productService } from '@/services/productService';
import { LifecycleMetrics, ExpirationWarningBadge } from '@/components/lifecycle';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ExpiringValidation {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  brandName: string;
  validationType: string;
  validatedAt: Date;
  expiryDate: Date;
  daysUntilExpiry: number;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface RevalidationRequest {
  id: string;
  productId: string;
  productName: string;
  requestedBy: string;
  requestedAt: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  formulaChanged: boolean;
}

interface FormulaChangeAlert {
  id: string;
  productId: string;
  productName: string;
  changedAt: Date;
  description: string;
  affectedValidations: number;
  revalidationRequired: boolean;
}

const LifecycleMonitoringPage: React.FC = () => {
  const [expiringValidations, setExpiringValidations] = useState<ExpiringValidation[]>([]);
  const [revalidationRequests, setRevalidationRequests] = useState<RevalidationRequest[]>([]);
  const [formulaChangeAlerts, setFormulaChangeAlerts] = useState<FormulaChangeAlert[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterDays, setFilterDays] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'expiring' | 'requests' | 'alerts'>('expiring');

  useEffect(() => {
    fetchData();
  }, [filterDays]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [validations, requests, alerts, metricsData] = await Promise.all([
        validationService.getExpiringValidations(filterDays),
        validationService.getRevalidationRequests(),
        validationService.getFormulaChangeAlerts(),
        validationService.getLifecycleMetrics()
      ]);

      setExpiringValidations(validations.map((v: any) => ({
        ...v,
        validatedAt: new Date(v.validatedAt),
        expiryDate: new Date(v.expiryDate),
        daysUntilExpiry: Math.ceil((new Date(v.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        status: isPast(new Date(v.expiryDate)) ? 'expired' : 
                Math.ceil((new Date(v.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7 ? 'expiring_soon' : 'active'
      })));

      setRevalidationRequests(requests.map((r: any) => ({
        ...r,
        requestedAt: new Date(r.requestedAt)
      })));

      setFormulaChangeAlerts(alerts.map((a: any) => ({
        ...a,
        changedAt: new Date(a.changedAt)
      })));

      setMetrics(metricsData);
    } catch (error) {
      toast.error('Error loading lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  const { execute: batchRequestRevalidation, loading: batchRequesting } = useAsyncAction(async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select validations to request revalidation');
      return;
    }

    await validationService.batchRequestRevalidation(Array.from(selectedItems));
    toast.success(`Revalidation requested for ${selectedItems.size} products`);
    setSelectedItems(new Set());
    fetchData();
  });

  const { execute: exportReport, loading: exporting } = useAsyncAction(async () => {
    const data = expiringValidations.map(val => ({
      'Product': val.productName,
      'SKU': val.productSku,
      'Brand': val.brandName,
      'Validation Type': val.validationType,
      'Validated Date': format(val.validatedAt, 'yyyy-MM-dd'),
      'Expiry Date': format(val.expiryDate, 'yyyy-MM-dd'),
      'Days Until Expiry': val.daysUntilExpiry,
      'Status': val.status
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifecycle-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const getFilteredItems = () => {
    let items: any[] = [];
    
    switch (activeTab) {
      case 'expiring':
        items = expiringValidations;
        break;
      case 'requests':
        items = revalidationRequests;
        break;
      case 'alerts':
        items = formulaChangeAlerts;
        break;
    }

    if (searchTerm) {
      items = items.filter(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productSku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return items;
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return badges[urgency as keyof typeof badges] || badges.medium;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lifecycle Monitoring</h1>
          <p className="text-gray-600 mt-1">Monitor and manage validation lifecycles across all products</p>
        </div>
        <button
          onClick={exportReport}
          disabled={exporting}
          className="btn btn-outline flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Metrics */}
      {metrics && <LifecycleMetrics metrics={metrics} />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="pl-10 w-full rounded-lg border-gray-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value))}
              className="rounded-lg border-gray-300"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('expiring')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'expiring' 
                ? 'text-indigo-600 border-indigo-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Expiring Validations ({expiringValidations.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests' 
                ? 'text-indigo-600 border-indigo-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Revalidation Requests ({revalidationRequests.filter(r => r.status === 'pending').length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'alerts' 
                ? 'text-indigo-600 border-indigo-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Formula Change Alerts ({formulaChangeAlerts.length})
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'expiring' && (
            <div className="space-y-4">
              {selectedItems.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedItems.size} validation(s) selected
                    </p>
                    <button
                      onClick={batchRequestRevalidation}
                      disabled={batchRequesting}
                      className="btn btn-primary btn-sm"
                    >
                      Request Revalidation
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-3">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(new Set(getFilteredItems().map(item => item.id)));
                            } else {
                              setSelectedItems(new Set());
                            }
                          }}
                          checked={selectedItems.size === getFilteredItems().length && getFilteredItems().length > 0}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validation Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredItems().map((validation: ExpiringValidation) => (
                      <tr key={validation.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(validation.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedItems);
                              if (e.target.checked) {
                                newSelected.add(validation.id);
                              } else {
                                newSelected.delete(validation.id);
                              }
                              setSelectedItems(newSelected);
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{validation.productName}</p>
                            <p className="text-xs text-gray-500">SKU: {validation.productSku}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {validation.brandName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {validation.validationType}
                        </td>
                        <td className="px-6 py-4">
                          <ExpirationWarningBadge 
                            expiryDate={validation.expiryDate}
                            type="validation"
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => window.location.href = `/dashboard/products/${validation.productId}`}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredItems().map((request: RevalidationRequest) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{request.productName}</p>
                          {request.formulaChanged && (
                            <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              Formula changed
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {request.requestedBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(request.requestedAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadge(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.location.href = `/dashboard/products/${request.productId}`}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            View
                          </button>
                          {request.status === 'pending' && (
                            <button
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Process
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {getFilteredItems().map((alert: FormulaChangeAlert) => (
                <div key={alert.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{alert.productName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-gray-500">
                          Changed {format(alert.changedAt, 'MMM d, yyyy')}
                        </span>
                        <span className="text-orange-600 font-medium">
                          {alert.affectedValidations} validation(s) affected
                        </span>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => window.location.href = `/dashboard/products/${alert.productId}`}
                          className="btn btn-sm btn-outline"
                        >
                          Review Product
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LifecycleMonitoringPage;