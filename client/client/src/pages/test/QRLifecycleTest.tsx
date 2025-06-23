import React, { useState, useEffect } from 'react';
import { qrLifecycleService, QRCodeStatus } from '@/services/qrLifecycleService';
import { validationService } from '@/services/validationService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';

interface TestResult {
  testName: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export function QRLifecycleTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedValidation, setSelectedValidation] = useState<string>('');
  const [validations, setValidations] = useState<any[]>([]);
  const [testQRCode, setTestQRCode] = useState<string>('');
  const [qrStatus, setQRStatus] = useState<any>(null);

  useEffect(() => {
    loadValidations();
  }, []);

  const loadValidations = async () => {
    try {
      const response = await validationService.getValidations({ limit: 50 });
      setValidations(response.data);
    } catch (error) {
      console.error('Error loading validations:', error);
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
    setTestQRCode('');
    setQRStatus(null);
  };

  // Test 1: Generate QR on Approval
  const testGenerateOnApproval = async () => {
    if (!selectedValidation) {
      toast.error('Please select a validation first');
      return;
    }

    setIsLoading(true);
    const testName = 'Generate QR on Approval';
    
    try {
      const result = await qrLifecycleService.generateOnApproval(selectedValidation);
      
      if (result.success && result.qrCode) {
        setTestQRCode(result.qrCode);
        addTestResult({
          testName,
          status: 'success',
          message: result.message,
          data: { qrCode: result.qrCode }
        });
        toast.success('QR Code generated successfully!');
      } else {
        addTestResult({
          testName,
          status: 'error',
          message: result.message
        });
        toast.error(result.message);
      }
    } catch (error: any) {
      addTestResult({
        testName,
        status: 'error',
        message: error.message || 'Failed to generate QR code'
      });
      toast.error('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  // Test 2: Check QR Status
  const testGetQRStatus = async () => {
    if (!testQRCode) {
      toast.error('No QR code available. Generate one first.');
      return;
    }

    setIsLoading(true);
    const testName = 'Get QR Status';
    
    try {
      const status = await qrLifecycleService.getQRStatus(testQRCode);
      setQRStatus(status);
      
      addTestResult({
        testName,
        status: 'success',
        message: `QR Status: ${status.status}`,
        data: status
      });
      toast.success('QR status retrieved successfully!');
    } catch (error: any) {
      addTestResult({
        testName,
        status: 'error',
        message: error.message || 'Failed to get QR status'
      });
      toast.error('Failed to get QR status');
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Suspend QR Code
  const testSuspendQR = async () => {
    if (!testQRCode) {
      toast.error('No QR code available. Generate one first.');
      return;
    }

    setIsLoading(true);
    const testName = 'Suspend QR Code';
    
    try {
      const result = await qrLifecycleService.suspendQRCode(
        testQRCode,
        'Testing suspension functionality'
      );
      
      if (result.success) {
        addTestResult({
          testName,
          status: 'success',
          message: result.message
        });
        toast.success('QR Code suspended successfully!');
        // Refresh status
        await testGetQRStatus();
      } else {
        addTestResult({
          testName,
          status: 'error',
          message: result.message
        });
        toast.error(result.message);
      }
    } catch (error: any) {
      addTestResult({
        testName,
        status: 'error',
        message: error.message || 'Failed to suspend QR code'
      });
      toast.error('Failed to suspend QR code');
    } finally {
      setIsLoading(false);
    }
  };

  // Test 4: Reactivate QR Code
  const testReactivateQR = async () => {
    if (!testQRCode) {
      toast.error('No QR code available. Generate one first.');
      return;
    }

    setIsLoading(true);
    const testName = 'Reactivate QR Code';
    
    try {
      const result = await qrLifecycleService.reactivateQRCode(
        testQRCode,
        'Testing reactivation functionality'
      );
      
      if (result.success) {
        addTestResult({
          testName,
          status: 'success',
          message: result.message
        });
        toast.success('QR Code reactivated successfully!');
        // Refresh status
        await testGetQRStatus();
      } else {
        addTestResult({
          testName,
          status: 'error',
          message: result.message
        });
        toast.error(result.message);
      }
    } catch (error: any) {
      addTestResult({
        testName,
        status: 'error',
        message: error.message || 'Failed to reactivate QR code'
      });
      toast.error('Failed to reactivate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  // Test 5: Batch QR Generation
  const testBatchGeneration = async () => {
    if (!selectedValidation) {
      toast.error('Please select a validation first');
      return;
    }

    setIsLoading(true);
    const testName = 'Batch QR Generation';
    
    try {
      // Get validation details
      const { validation } = await validationService.getValidation(selectedValidation);
      
      const result = await qrLifecycleService.generateBatchQRCodes({
        productId: validation.productId,
        batchNumber: 'TEST-BATCH-001',
        quantity: 5,
        validationId: selectedValidation,
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      });
      
      if (result.success && result.qrCodes) {
        addTestResult({
          testName,
          status: 'success',
          message: result.message,
          data: { qrCodes: result.qrCodes }
        });
        toast.success(`Generated ${result.qrCodes.length} QR codes!`);
        // Set the first one as test QR
        setTestQRCode(result.qrCodes[0]);
      } else {
        addTestResult({
          testName,
          status: 'error',
          message: result.message
        });
        toast.error(result.message);
      }
    } catch (error: any) {
      addTestResult({
        testName,
        status: 'error',
        message: error.message || 'Failed to generate batch QR codes'
      });
      toast.error('Failed to generate batch QR codes');
    } finally {
      setIsLoading(false);
    }
  };

  // Test 6: Update QR Content
  const testUpdateQRContent = async () => {
    if (!testQRCode) {
      toast.error('No QR code available. Generate one first.');
      return;
    }

    setIsLoading(true);
    const testName = 'Update QR Content';
    
    try {
      const result = await qrLifecycleService.updateQRContent(testQRCode, {
        status: 'APPROVED',
        summary: 'Updated validation summary for testing',
        validatedAt: new Date().toISOString(),
        lifecycle: {
          validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 180 days
        }
      });
      
      if (result.success) {
        addTestResult({
          testName,
          status: 'success',
          message: result.message
        });
        toast.success('QR content updated successfully!');
      } else {
        addTestResult({
          testName,
          status: 'error',
          message: result.message
        });
        toast.error(result.message);
      }
    } catch (error: any) {
      addTestResult({
        testName,
        status: 'error',
        message: error.message || 'Failed to update QR content'
      });
      toast.error('Failed to update QR content');
    } finally {
      setIsLoading(false);
    }
  };

  // Test 7: Invalidate on Expiry
  const testInvalidateOnExpiry = async () => {
    if (!selectedValidation) {
      toast.error('Please select a validation first');
      return;
    }

    setIsLoading(true);
    const testName = 'Invalidate QR on Expiry';
    
    try {
      const result = await qrLifecycleService.invalidateOnExpiry(selectedValidation);
      
      if (result.success) {
        addTestResult({
          testName,
          status: 'success',
          message: result.message
        });
        toast.success('QR Code invalidated successfully!');
        // Refresh status
        if (testQRCode) {
          await testGetQRStatus();
        }
      } else {
        addTestResult({
          testName,
          status: 'error',
          message: result.message
        });
        toast.error(result.message);
      }
    } catch (error: any) {
      addTestResult({
        testName,
        status: 'error',
        message: error.message || 'Failed to invalidate QR code'
      });
      toast.error('Failed to invalidate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">QR Code Lifecycle Management Test</h1>
      
      {/* Configuration Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Validation
          </label>
          <select
            value={selectedValidation}
            onChange={(e) => setSelectedValidation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a validation...</option>
            {validations.map((validation) => (
              <option key={validation.id} value={validation.id}>
                {validation.product?.name || 'Unknown Product'} - 
                Status: {validation.status} - 
                ID: {validation.id}
              </option>
            ))}
          </select>
        </div>

        {testQRCode && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Current Test QR Code:</p>
            <p className="font-mono text-sm mt-1">{testQRCode}</p>
          </div>
        )}

        {qrStatus && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">QR Code Status:</p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Status:</span> {qrStatus.status}</p>
              {qrStatus.lifecycle && (
                <>
                  <p><span className="font-medium">Generated At:</span> {new Date(qrStatus.lifecycle.generatedAt).toLocaleString()}</p>
                  {qrStatus.lifecycle.expirationDate && (
                    <p><span className="font-medium">Expires At:</span> {new Date(qrStatus.lifecycle.expirationDate).toLocaleString()}</p>
                  )}
                </>
              )}
              {qrStatus.product && (
                <p><span className="font-medium">Product:</span> {qrStatus.product.name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={testGenerateOnApproval}
            disabled={isLoading || !selectedValidation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate QR on Approval
          </button>

          <button
            onClick={testGetQRStatus}
            disabled={isLoading || !testQRCode}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Check QR Status
          </button>

          <button
            onClick={testSuspendQR}
            disabled={isLoading || !testQRCode}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Suspend QR Code
          </button>

          <button
            onClick={testReactivateQR}
            disabled={isLoading || !testQRCode}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Reactivate QR Code
          </button>

          <button
            onClick={testBatchGeneration}
            disabled={isLoading || !selectedValidation}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate Batch QRs
          </button>

          <button
            onClick={testUpdateQRContent}
            disabled={isLoading || !testQRCode}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Update QR Content
          </button>

          <button
            onClick={testInvalidateOnExpiry}
            disabled={isLoading || !selectedValidation}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Invalidate on Expiry
          </button>

          <button
            onClick={clearResults}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Test Results</h2>
        
        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {testResults.length === 0 && !isLoading && (
          <p className="text-gray-500 text-center py-8">
            No test results yet. Run a test to see results.
          </p>
        )}

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-300'
                  : result.status === 'error'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{result.testName}</h3>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <span
                  className={`ml-4 text-sm font-medium ${
                    result.status === 'success'
                      ? 'text-green-600'
                      : result.status === 'error'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {result.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Select a validation from the dropdown (preferably one with APPROVED status)</li>
          <li>Click "Generate QR on Approval" to create a QR code</li>
          <li>Use "Check QR Status" to verify the current status</li>
          <li>Test lifecycle operations: Suspend, Reactivate, Update Content</li>
          <li>Try "Generate Batch QRs" for multiple QR codes</li>
          <li>Test "Invalidate on Expiry" to simulate expiration</li>
        </ol>
      </div>
    </div>
  );
}