import React, { useState } from 'react';
import { Package, Clock, CheckCircle, AlertCircle, XCircle, Calendar, Hash, Box } from 'lucide-react';
import { BatchInfo, QualityTest } from '@/types/traceability';
import { format } from 'date-fns';

interface BatchTrackerProps {
  batches: BatchInfo[];
  onBatchSelect?: (batch: BatchInfo) => void;
  selectedBatchId?: string;
}

const BatchTracker: React.FC<BatchTrackerProps> = ({
  batches,
  onBatchSelect,
  selectedBatchId
}) => {
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const getStatusIcon = (status: BatchInfo['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'RECALLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'EXPIRED':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'CONSUMED':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Package className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: BatchInfo['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'RECALLED':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'EXPIRED':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'CONSUMED':
        return 'bg-gray-50 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const getTestResultColor = (result: QualityTest['result']) => {
    switch (result) {
      case 'PASS':
        return 'text-green-600 bg-green-50';
      case 'FAIL':
        return 'text-red-600 bg-red-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleBatchClick = (batch: BatchInfo) => {
    if (onBatchSelect) {
      onBatchSelect(batch);
    }
    setExpandedBatch(expandedBatch === batch.id ? null : batch.id);
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {batches.map((batch) => {
        const isExpanded = expandedBatch === batch.id;
        const isSelected = selectedBatchId === batch.id;
        const expired = isExpired(batch.expiryDate);

        return (
          <div
            key={batch.id}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
              isSelected ? 'border-blue-500' : 'border-gray-200'
            } ${batch.status === 'RECALLED' ? 'border-red-300' : ''}`}
          >
            {/* Batch Header */}
            <div
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                expired ? 'bg-red-50' : ''
              }`}
              onClick={() => handleBatchClick(batch)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(batch.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      {batch.batchNumber}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Produced: {format(new Date(batch.productionDate), 'MMM dd, yyyy')}
                      </span>
                      {batch.expiryDate && (
                        <span className={`flex items-center gap-1 ${expired ? 'text-red-600 font-medium' : ''}`}>
                          <Clock className="w-3 h-3" />
                          Expires: {format(new Date(batch.expiryDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-semibold">
                      {batch.quantity} {batch.unit}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(batch.status)}`}>
                    {batch.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
                {/* Parent/Child Batches */}
                {(batch.parentBatchId || (batch.childBatchIds && batch.childBatchIds.length > 0)) && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Batch Relationships</h4>
                    <div className="space-y-2">
                      {batch.parentBatchId && (
                        <div className="flex items-center gap-2 text-sm">
                          <Box className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Parent Batch:</span>
                          <span className="font-medium text-blue-600">{batch.parentBatchId}</span>
                        </div>
                      )}
                      {batch.childBatchIds && batch.childBatchIds.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Box className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="text-gray-500">Child Batches:</span>
                          <div className="flex flex-wrap gap-2">
                            {batch.childBatchIds.map((childId) => (
                              <span key={childId} className="font-medium text-blue-600">
                                {childId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quality Tests */}
                {batch.qualityTests && batch.qualityTests.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Quality Tests</h4>
                    <div className="space-y-2">
                      {batch.qualityTests.map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{test.testType}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(test.date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTestResultColor(test.result)}`}>
                              {test.result}
                            </span>
                            {test.certificateUrl && (
                              <a
                                href={test.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-1 text-xs text-blue-600 hover:underline"
                              >
                                View Certificate
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supply Chain Events */}
                {batch.events && batch.events.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Recent Events</h4>
                    <div className="space-y-2">
                      {batch.events.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-gray-900">{event.title}</p>
                            <p className="text-gray-500">
                              {event.location} • {format(new Date(event.timestamp), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {batch.events.length > 3 && (
                        <p className="text-sm text-blue-600 ml-5 cursor-pointer hover:underline">
                          View all {batch.events.length} events
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {batches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No batches found</p>
        </div>
      )}
    </div>
  );
};

export default BatchTracker;