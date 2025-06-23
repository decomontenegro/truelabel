import React, { useState } from 'react';
import { QrCode, Power, PowerOff, RefreshCw, AlertTriangle, Download, Upload, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { qrService } from '../../services/qrService';
import { toast } from 'react-hot-toast';

interface QRCode {
  id: string;
  code: string;
  productSku: string;
  productName: string;
  status: 'active' | 'expired' | 'suspended';
  createdAt: Date;
  expiryDate?: Date;
  lastScanned?: Date;
  scanCount: number;
  suspendedReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
}

interface QRStatusManagerProps {
  qrCodes: QRCode[];
  onStatusChange?: () => void;
  onRegenerate?: (qrId: string) => void;
}

export const QRStatusManager: React.FC<QRStatusManagerProps> = ({
  qrCodes,
  onStatusChange,
  onRegenerate
}) => {
  const [selectedQRs, setSelectedQRs] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'suspended'>('all');
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const { execute: suspendQRs, loading: suspending } = useAsyncAction(async () => {
    if (selectedQRs.size === 0) {
      toast.error('Please select QR codes to suspend');
      return;
    }
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    await qrService.batchUpdateStatus(Array.from(selectedQRs), 'suspended', suspendReason);
    toast.success(`${selectedQRs.size} QR code(s) suspended`);
    setSelectedQRs(new Set());
    setSuspendReason('');
    setShowSuspendModal(false);
    onStatusChange?.();
  });

  const { execute: reactivateQRs, loading: reactivating } = useAsyncAction(async () => {
    if (selectedQRs.size === 0) {
      toast.error('Please select QR codes to reactivate');
      return;
    }

    await qrService.batchUpdateStatus(Array.from(selectedQRs), 'active');
    toast.success(`${selectedQRs.size} QR code(s) reactivated`);
    setSelectedQRs(new Set());
    onStatusChange?.();
  });

  const { execute: regenerateQRs, loading: regenerating } = useAsyncAction(async () => {
    if (selectedQRs.size === 0) {
      toast.error('Please select QR codes to regenerate');
      return;
    }

    for (const qrId of Array.from(selectedQRs)) {
      await onRegenerate?.(qrId);
    }
    toast.success(`${selectedQRs.size} QR code(s) regenerated`);
    setSelectedQRs(new Set());
  });

  const handleSelectAll = () => {
    const filteredQRs = getFilteredQRs();
    if (selectedQRs.size === filteredQRs.length) {
      setSelectedQRs(new Set());
    } else {
      setSelectedQRs(new Set(filteredQRs.map(qr => qr.id)));
    }
  };

  const handleSelectQR = (qrId: string) => {
    const newSelected = new Set(selectedQRs);
    if (newSelected.has(qrId)) {
      newSelected.delete(qrId);
    } else {
      newSelected.add(qrId);
    }
    setSelectedQRs(newSelected);
  };

  const getFilteredQRs = () => {
    if (filterStatus === 'all') return qrCodes;
    return qrCodes.filter(qr => qr.status === filterStatus);
  };

  const exportQRReport = () => {
    const data = getFilteredQRs().map(qr => ({
      Code: qr.code,
      Product: qr.productName,
      SKU: qr.productSku,
      Status: qr.status,
      Created: format(qr.createdAt, 'yyyy-MM-dd'),
      Expiry: qr.expiryDate ? format(qr.expiryDate, 'yyyy-MM-dd') : 'N/A',
      'Scan Count': qr.scanCount,
      'Last Scanned': qr.lastScanned ? format(qr.lastScanned, 'yyyy-MM-dd HH:mm') : 'Never'
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-status-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: QRCode['status']) => {
    switch (status) {
      case 'active':
        return <Power className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <PowerOff className="h-4 w-4 text-red-600" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: QRCode['status']) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredQRs = getFilteredQRs();
  const hasSelectedActive = Array.from(selectedQRs).some(id => 
    qrCodes.find(qr => qr.id === id)?.status === 'active'
  );
  const hasSelectedSuspended = Array.from(selectedQRs).some(id => 
    qrCodes.find(qr => qr.id === id)?.status === 'suspended'
  );

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Status Management
          </h3>
          <button
            onClick={exportQRReport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border-gray-300 text-sm"
            >
              <option value="all">All ({qrCodes.length})</option>
              <option value="active">Active ({qrCodes.filter(qr => qr.status === 'active').length})</option>
              <option value="expired">Expired ({qrCodes.filter(qr => qr.status === 'expired').length})</option>
              <option value="suspended">Suspended ({qrCodes.filter(qr => qr.status === 'suspended').length})</option>
            </select>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedQRs.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                {selectedQRs.size} QR code(s) selected
              </p>
              <div className="flex items-center gap-2">
                {hasSelectedActive && (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    disabled={suspending}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 disabled:opacity-50"
                  >
                    <PowerOff className="h-4 w-4" />
                    Suspend
                  </button>
                )}
                {hasSelectedSuspended && (
                  <button
                    onClick={reactivateQRs}
                    disabled={reactivating}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    <Power className="h-4 w-4" />
                    Reactivate
                  </button>
                )}
                <button
                  onClick={regenerateQRs}
                  disabled={regenerating}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    {selectedQRs.size === filteredQRs.length && filteredQRs.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    Select
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQRs.map((qr) => (
                <tr key={qr.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedQRs.has(qr.id)}
                      onChange={() => handleSelectQR(qr.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{qr.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{qr.productName}</div>
                    <div className="text-xs text-gray-500">SKU: {qr.productSku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(qr.status)}
                    {qr.suspendedReason && (
                      <p className="text-xs text-gray-500 mt-1">Reason: {qr.suspendedReason}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{format(qr.createdAt, 'MMM d, yyyy')}</div>
                    {qr.expiryDate && (
                      <div className="text-xs text-gray-500">
                        Expires: {format(qr.expiryDate, 'MMM d, yyyy')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{qr.scanCount}</div>
                    {qr.lastScanned && (
                      <div className="text-xs text-gray-500">
                        Last: {format(qr.lastScanned, 'MMM d')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {qr.status === 'active' && (
                        <button
                          onClick={() => {
                            setSelectedQRs(new Set([qr.id]));
                            setShowSuspendModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="Suspend QR Code"
                        >
                          <PowerOff className="h-4 w-4" />
                        </button>
                      )}
                      {qr.status === 'suspended' && (
                        <button
                          onClick={() => {
                            setSelectedQRs(new Set([qr.id]));
                            reactivateQRs();
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivate QR Code"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onRegenerate?.(qr.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Regenerate QR Code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspend QR Codes</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to suspend {selectedQRs.size} QR code(s). This will prevent them from being scanned.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for suspension
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter reason for suspension..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={suspendQRs}
                disabled={suspending || !suspendReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {suspending ? 'Suspending...' : 'Suspend QR Codes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};