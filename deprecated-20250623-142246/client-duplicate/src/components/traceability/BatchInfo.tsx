import React from 'react';
import { Calendar, Package, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { BatchInfo as BatchInfoType } from '@/services/traceabilityService';

interface BatchInfoProps {
  batch: BatchInfoType;
  className?: string;
}

export const BatchInfo: React.FC<BatchInfoProps> = ({ batch, className = '' }) => {
  const getStatusColor = (status: BatchInfoType['status']) => {
    switch (status) {
      case 'in_production':
        return 'bg-yellow-100 text-yellow-800';
      case 'quality_check':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: BatchInfoType['status']) => {
    switch (status) {
      case 'in_production':
        return Clock;
      case 'quality_check':
        return AlertCircle;
      case 'approved':
        return CheckCircle;
      case 'shipped':
        return Package;
      case 'delivered':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getCheckResultIcon = (result: string) => {
    switch (result) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const StatusIcon = getStatusIcon(batch.status);

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Batch Information</h3>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            batch.status
          )}`}
        >
          <StatusIcon className="w-4 h-4 mr-1" />
          {batch.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Batch Number</p>
            <p className="text-lg font-mono font-medium text-gray-900">{batch.batchNumber}</p>
          </div>
          
          <div className="flex space-x-4">
            <div>
              <p className="text-sm text-gray-500">Production Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(batch.productionDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiration Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(batch.expirationDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="text-sm font-medium text-gray-900">
              {batch.quantity} {batch.unit}
            </p>
          </div>
        </div>

        {/* Quality Checks */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quality Checks</h4>
          <div className="space-y-2">
            {batch.qualityChecks.map((check) => (
              <div
                key={check.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {getCheckResultIcon(check.result)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{check.type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(check.date).toLocaleDateString()} - {check.inspector}
                  </p>
                  {check.notes && (
                    <p className="text-xs text-gray-600 mt-1">{check.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Batch Timeline</h4>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          <div className="space-y-4">
            {[
              { status: 'in_production', label: 'Production Started', date: batch.productionDate },
              { status: 'quality_check', label: 'Quality Check', date: batch.qualityChecks[0]?.date },
              { status: 'approved', label: 'Approved', date: batch.qualityChecks.find(c => c.result === 'passed')?.date },
              { status: 'shipped', label: 'Shipped', date: null },
              { status: 'delivered', label: 'Delivered', date: null },
            ].map((item, index) => {
              const isActive = ['in_production', 'quality_check', 'approved', 'shipped', 'delivered'].indexOf(batch.status) >= index;
              const Icon = getStatusIcon(item.status as BatchInfoType['status']);
              
              return (
                <div key={item.status} className="relative flex items-center">
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="ml-12">
                    <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.label}
                    </p>
                    {item.date && (
                      <p className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};