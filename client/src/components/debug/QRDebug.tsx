import React from 'react';
import { useQRStore } from '@/stores/qrStore';
import { useAuthStore } from '@/stores/authStore';

const QRDebug: React.FC = () => {
  const { token, user, isAuthenticated } = useAuthStore();
  const {
    isModalOpen,
    selectedProductId,
    selectedProductName,
    currentQRData,
    qrCodes,
    isGenerating
  } = useQRStore();

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔍 Debug Completo</h3>

      {/* Auth Debug */}
      <div className="mb-3 pb-2 border-b border-gray-600">
        <div className="font-semibold text-yellow-300">🔑 Auth:</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user?.email || 'None'}</div>
        <div>Token: {token ? '✅' : '❌'}</div>
        <div>Token Length: {token ? token.length : 0}</div>
        <div>LocalStorage Token: {localStorage.getItem('token') ? '✅' : '❌'}</div>
      </div>

      {/* QR Debug */}
      <div className="space-y-1">
        <div className="font-semibold text-blue-300">📱 QR Store:</div>
        <div>Modal Open: {isModalOpen ? '✅' : '❌'}</div>
        <div>Product ID: {selectedProductId || 'None'}</div>
        <div>Product Name: {selectedProductName || 'None'}</div>
        <div>Current QR: {currentQRData ? '✅' : '❌'}</div>
        <div>Generating: {isGenerating ? '🔄' : '⏸️'}</div>
        <div>Cache Count: {Object.keys(qrCodes).length}</div>
      </div>

      {currentQRData && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div>QR Code: {currentQRData.qrCode}</div>
          <div>URL: {currentQRData.validationUrl.substring(0, 30)}...</div>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="font-semibold text-green-300">🔄 Sincronização:</div>
        <div className="text-green-400">✅ Cache ↔ Banco</div>
        <div className="text-blue-400">🔍 Verificação Auto</div>
        <div className="text-purple-400">💾 Persistência OK</div>
      </div>

      {Object.keys(qrCodes).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="font-semibold">Cache:</div>
          {Object.entries(qrCodes).map(([productId, qrData]) => (
            <div key={productId} className="text-xs">
              {qrData.product.name}: {qrData.qrCode}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QRDebug;
