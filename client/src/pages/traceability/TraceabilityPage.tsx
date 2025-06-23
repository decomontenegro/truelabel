import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Package, Truck, Calendar, Users, FileText, 
  Plus, Download, Filter, Search, Globe, Leaf, BarChart3
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SupplyChainMap from '@/components/traceability/SupplyChainMap';
import BatchTracker from '@/components/traceability/BatchTracker';
import OriginVerifier from '@/components/traceability/OriginVerifier';
import SupplierCard from '@/components/traceability/SupplierCard';
import TraceabilityTimeline from '@/components/traceability/TraceabilityTimeline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import traceabilityService from '@/services/traceabilityService';
import { productService } from '@/services/productService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { 
  SupplyChainEvent, 
  BatchInfo, 
  Supplier, 
  OriginClaim, 
  SupplyChainRoute,
  SupplyChainSummary 
} from '@/types/traceability';
import { Product } from '@/types';
import { toast } from 'react-hot-toast';

const TraceabilityPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'batches' | 'suppliers' | 'origins'>('timeline');
  const [product, setProduct] = useState<Product | null>(null);
  const [events, setEvents] = useState<SupplyChainEvent[]>([]);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [origins, setOrigins] = useState<OriginClaim[]>([]);
  const [route, setRoute] = useState<SupplyChainRoute | null>(null);
  const [summary, setSummary] = useState<SupplyChainSummary | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  const { execute: loadTraceabilityData, loading } = useAsyncAction(async () => {
    if (!productId) return;

    // Load product data
    const productData = await productService.getProduct(productId);
    setProduct(productData);

    // Load all traceability data in parallel
    const [
      eventsData,
      batchesData,
      suppliersData,
      originsData,
      routeData,
      summaryData
    ] = await Promise.all([
      traceabilityService.getSupplyChainEvents(productId),
      traceabilityService.getBatchesByProduct(productId),
      traceabilityService.getSuppliers(productId),
      traceabilityService.getOriginClaims(productId),
      traceabilityService.getSupplyChainRoute(productId),
      traceabilityService.getSupplyChainSummary(productId)
    ]);

    setEvents(eventsData);
    setBatches(batchesData);
    setSuppliers(suppliersData);
    setOrigins(originsData);
    setRoute(routeData);
    setSummary(summaryData);
  });

  useEffect(() => {
    loadTraceabilityData();
  }, [productId]);

  const handleGenerateReport = async () => {
    try {
      const report = await traceabilityService.generateTraceabilityReport(productId!, 'FULL');
      const blob = await traceabilityService.downloadTraceabilityReport(report.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traceability-report-${product?.sku}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const handleAddEvent = async (eventData: any) => {
    try {
      await traceabilityService.createSupplyChainEvent({
        productId: productId!,
        ...eventData
      });
      toast.success('Event added successfully');
      setShowAddEventModal(false);
      loadTraceabilityData();
    } catch (error) {
      toast.error('Failed to add event');
    }
  };

  const handleBatchSelect = (batch: BatchInfo) => {
    setSelectedBatch(batch);
    setActiveTab('timeline');
  };

  const handleSupplierClick = (supplier: Supplier) => {
    // Navigate to supplier details or show modal
    console.log('Supplier clicked:', supplier);
  };

  const handleOriginVerify = async (claimId: string, evidence: any[]) => {
    try {
      await traceabilityService.verifyOrigin(claimId, evidence);
      toast.success('Origin claim verified');
      loadTraceabilityData();
    } catch (error) {
      toast.error('Failed to verify origin');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Product not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supply Chain Traceability</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {product.name}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">SKU:</span> {product.sku}
                </span>
                {product.batchNumber && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Batch:</span> {product.batchNumber}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddEventModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalEvents}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Locations</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.uniqueLocations}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Compliance</p>
                    <p className="text-2xl font-bold text-green-600">{summary.complianceScore}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalDistance ? `${(summary.totalDistance / 1000).toFixed(0)}k km` : 'N/A'}
                    </p>
                  </div>
                  <Globe className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1">
          <nav className="flex space-x-1">
            {[
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'map', label: 'Supply Chain Map', icon: MapPin },
              { id: 'batches', label: 'Batch Tracking', icon: Package },
              { id: 'suppliers', label: 'Suppliers', icon: Users },
              { id: 'origins', label: 'Origin Verification', icon: Globe }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'timeline' && (
            <TraceabilityTimeline 
              events={selectedBatch ? events.filter(e => e.metadata?.batchId === selectedBatch.id) : events}
              showFilters={true}
            />
          )}

          {activeTab === 'map' && route && (
            <SupplyChainMap 
              route={route}
              height="600px"
              showDetails={true}
            />
          )}

          {activeTab === 'batches' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Batch Tracking</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search batches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <BatchTracker 
                batches={batches.filter(batch => 
                  searchTerm === '' || 
                  batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                onBatchSelect={handleBatchSelect}
                selectedBatchId={selectedBatch?.id}
              />
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Supply Chain Partners</h3>
                <span className="text-sm text-gray-500">{suppliers.length} suppliers</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <SupplierCard 
                    key={supplier.id}
                    supplier={supplier}
                    onClick={handleSupplierClick}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'origins' && (
            <OriginVerifier 
              claims={origins}
              onVerify={handleOriginVerify}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TraceabilityPage;