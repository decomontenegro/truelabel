import React, { useState, useEffect } from 'react';
import { validationService } from '@/services/validationService';
import { reportService } from '@/services/reportService';
import { productService } from '@/services/productService';
import { automatedValidationService, WorkflowStates } from '@/services/automatedValidationService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { 
  Upload, 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Ban,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';

interface QueueItem {
  id: string;
  reportId: string;
  productId: string;
  priority: string;
  state: string;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  validationId?: string;
}

export default function AutomatedValidationTestPage() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const { execute: loadData } = useAsyncAction(async () => {
    const [productsRes, reportsRes] = await Promise.all([
      productService.getProducts({ limit: 20 }),
      reportService.getReports({ limit: 20 })
    ]);
    setProducts(productsRes.data);
    setReports(reportsRes.data);
  });

  const { execute: queueValidation, loading: queueing } = useAsyncAction(
    async (priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW') => {
      if (!selectedReport || !selectedProduct) {
        throw new Error('Please select a product and report');
      }

      const result = await validationService.queueAutomatedValidation(
        selectedReport.id,
        selectedProduct.id,
        priority
      );

      refreshQueueStatus();
      return result;
    }
  );

  const { execute: cancelValidation } = useAsyncAction(async (queueId: string) => {
    await validationService.cancelAutomatedValidation(queueId);
    refreshQueueStatus();
  });

  const { execute: retryValidation } = useAsyncAction(async (queueId: string) => {
    await validationService.retryAutomatedValidation(queueId);
    refreshQueueStatus();
  });

  const refreshQueueStatus = async () => {
    const status = await validationService.getAutomatedQueueStatus();
    setQueueStatus(status);
  };

  // Start auto-refresh
  useEffect(() => {
    loadData();
    refreshQueueStatus();

    const interval = setInterval(() => {
      refreshQueueStatus();
    }, 2000); // Refresh every 2 seconds

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const getStateIcon = (state: string) => {
    switch (state) {
      case WorkflowStates.QUEUED:
        return <Clock className="w-5 h-5 text-gray-500" />;
      case WorkflowStates.ANALYZING:
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case WorkflowStates.VALIDATING:
        return <BarChart3 className="w-5 h-5 text-purple-500 animate-pulse" />;
      case WorkflowStates.REVIEW_REQUIRED:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case WorkflowStates.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case WorkflowStates.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case WorkflowStates.QUEUED:
        return 'bg-gray-100 text-gray-700';
      case WorkflowStates.ANALYZING:
        return 'bg-blue-100 text-blue-700';
      case WorkflowStates.VALIDATING:
        return 'bg-purple-100 text-purple-700';
      case WorkflowStates.REVIEW_REQUIRED:
        return 'bg-yellow-100 text-yellow-700';
      case WorkflowStates.COMPLETED:
        return 'bg-green-100 text-green-700';
      case WorkflowStates.FAILED:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-blue-500 text-white';
      case 'LOW':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Automated Validation Engine Test</h1>

      {/* Queue Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center justify-between">
            <span>Queue Status</span>
            <button
              onClick={refreshQueueStatus}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </h2>
        </div>
        <div className="p-6">
          {queueStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{queueStatus.totalItems}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              {Object.entries(queueStatus.byState || {}).map(([state, count]) => (
                <div key={state} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    {getStateIcon(state)}
                  </div>
                  <div className="text-xl font-semibold">{count as number}</div>
                  <div className="text-sm text-gray-600">{state}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Queue New Validation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Queue New Validation</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Product</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value);
                setSelectedProduct(product);
              }}
            >
              <option value="">Choose a product...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.brand} (SKU: {product.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Report</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={selectedReport?.id || ''}
              onChange={(e) => {
                const report = reports.find(r => r.id === e.target.value);
                setSelectedReport(report);
              }}
            >
              <option value="">Choose a report...</option>
              {reports.map(report => (
                <option key={report.id} value={report.id}>
                  {report.originalName} - {report.analysisType} ({report.laboratory?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => queueValidation('URGENT')}
              disabled={queueing || !selectedProduct || !selectedReport}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Queue as Urgent
            </button>
            <button
              onClick={() => queueValidation('HIGH')}
              disabled={queueing || !selectedProduct || !selectedReport}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Queue as High
            </button>
            <button
              onClick={() => queueValidation('NORMAL')}
              disabled={queueing || !selectedProduct || !selectedReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Queue as Normal
            </button>
            <button
              onClick={() => queueValidation('LOW')}
              disabled={queueing || !selectedProduct || !selectedReport}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Queue as Low
            </button>
          </div>
        </div>
      </div>

      {/* Example Analysis Result */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Example Analysis Output</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Analysis Result Structure:</h4>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "id": "analysis-1234567890",
  "timestamp": "2024-01-15T10:30:00Z",
  "algorithm": "TrueLabel-AutoValidator-v1.0",
  "version": "1.0.0",
  "confidence": 92.5,
  "processingTime": 1250,
  "findings": [
    {
      "category": "COMPLIANCE",
      "severity": "HIGH",
      "dataPoint": "sodium",
      "description": "Value 2500mg/100g exceeds maximum limit",
      "evidence": {"value": 2500, "unit": "mg/100g"},
      "suggestedAction": "Review product formulation"
    },
    {
      "category": "CONSISTENCY",
      "severity": "MEDIUM",
      "dataPoint": "calories",
      "description": "Caloric value deviates 12% from expected",
      "evidence": "Reported: 380 kcal, Expected: 425 kcal",
      "suggestedAction": "Verify caloric calculation method"
    }
  ],
  "recommendations": [
    "Address 1 critical compliance issue before approval",
    "Review 2 moderate issues for potential improvement",
    "Implement data validation checks"
  ]
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Validation Rules Applied:</h4>
              <ul className="text-sm space-y-1">
                <li>• Nutritional limits (protein, fat, carbs, sodium, etc.)</li>
                <li>• Microbiological safety (coliforms, salmonella, listeria)</li>
                <li>• Data consistency checks (macronutrient sum, caloric calculation)</li>
                <li>• Anomaly detection (placeholder values, precision errors)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Confidence Score Calculation:</h4>
              <ul className="text-sm space-y-1">
                <li>• Base score: 100%</li>
                <li>• HIGH severity finding: -20 points each</li>
                <li>• MEDIUM severity finding: -10 points each</li>
                <li>• LOW severity finding: -5 points each</li>
                <li>• Minimum threshold for auto-approval: 85%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow States */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Workflow States</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {Object.entries(WorkflowStates).map(([key, state]) => (
              <div key={key} className="flex items-center gap-3">
                {getStateIcon(state)}
                <div>
                  <div className="font-medium">{state}</div>
                  <div className="text-sm text-gray-600">
                    {state === WorkflowStates.QUEUED && 'Waiting in queue for processing'}
                    {state === WorkflowStates.ANALYZING && 'Parsing and analyzing report data'}
                    {state === WorkflowStates.VALIDATING && 'Applying validation rules and scoring'}
                    {state === WorkflowStates.REVIEW_REQUIRED && 'Manual review needed (confidence < 85%)'}
                    {state === WorkflowStates.COMPLETED && 'Validation created successfully'}
                    {state === WorkflowStates.FAILED && 'Processing failed after max attempts'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}