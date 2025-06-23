import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { reportParserService, ParsedReportData } from '@/services/reportParserService';

export default function ReportParserTest() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setError(null);
      setParsedData(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await reportParserService.parseReport(file);
      setParsedData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse report');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = (result: any) => {
    if (!result || typeof result !== 'object') return null;

    return (
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium">{result.value}</span>
          {result.unit && <span className="text-gray-500 ml-1">{result.unit}</span>}
          {result.detectionLimit && (
            <span className="text-xs text-gray-400 ml-2">(LOD: {result.detectionLimit})</span>
          )}
        </div>
        {result.status && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            result.status === 'PASS' ? 'bg-green-100 text-green-800' :
            result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {result.status}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Report Parser Test</h1>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Laboratory Report</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Drop your laboratory report here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PDF, images (JPG, PNG), and text files
          </p>
          
          <input
            type="file"
            accept=".pdf,.txt,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
          >
            Select File
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-gray-700">{file.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <button
              onClick={handleParse}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Parsing...' : 'Parse Report'}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Parsing Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Parsed Data Display */}
      {parsedData && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Report Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Laboratory Format:</span>
                <span className="ml-2 font-medium">{parsedData.laboratoryFormat}</span>
              </div>
              <div>
                <span className="text-gray-600">Confidence Score:</span>
                <span className="ml-2 font-medium">{parsedData.confidence}%</span>
              </div>
              {parsedData.reportNumber && (
                <div>
                  <span className="text-gray-600">Report Number:</span>
                  <span className="ml-2 font-medium">{parsedData.reportNumber}</span>
                </div>
              )}
              {parsedData.reportDate && (
                <div>
                  <span className="text-gray-600">Report Date:</span>
                  <span className="ml-2 font-medium">{parsedData.reportDate}</span>
                </div>
              )}
              {parsedData.sampleId && (
                <div>
                  <span className="text-gray-600">Sample ID:</span>
                  <span className="ml-2 font-medium">{parsedData.sampleId}</span>
                </div>
              )}
              {parsedData.productName && (
                <div>
                  <span className="text-gray-600">Product Name:</span>
                  <span className="ml-2 font-medium">{parsedData.productName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Microbiological Analysis */}
          {parsedData.microbiological && Object.keys(parsedData.microbiological).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Microbiological Analysis</h2>
              <div className="space-y-3">
                {Object.entries(parsedData.microbiological).map(([key, value]) => (
                  <div key={key} className="border-b pb-2">
                    <div className="text-gray-700 mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    {renderTestResult(value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heavy Metals */}
          {parsedData.heavyMetals && Object.keys(parsedData.heavyMetals).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Heavy Metals Analysis</h2>
              <div className="space-y-3">
                {Object.entries(parsedData.heavyMetals).map(([key, value]) => (
                  <div key={key} className="border-b pb-2">
                    <div className="text-gray-700 mb-1">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </div>
                    {renderTestResult(value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutritional Information */}
          {parsedData.nutritional && Object.keys(parsedData.nutritional).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Nutritional Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(parsedData.nutritional).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                    <span className="font-medium">
                      {typeof value === 'number' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Points Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Extracted Data Points ({parsedData.dataPoints.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Parameter</th>
                    <th className="text-left py-2">Value</th>
                    <th className="text-left py-2">Unit</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.dataPoints.slice(0, 20).map((dp) => (
                    <tr key={dp.dataPointId} className="border-b">
                      <td className="py-2">{dp.name}</td>
                      <td className="py-2">{dp.value}</td>
                      <td className="py-2">{dp.unit || '-'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          dp.validationStatus === 'PASSED' ? 'bg-green-100 text-green-800' :
                          dp.validationStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                          dp.validationStatus === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {dp.validationStatus}
                        </span>
                      </td>
                      <td className="py-2">{dp.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.dataPoints.length > 20 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 20 of {parsedData.dataPoints.length} data points
                </p>
              )}
            </div>
          </div>

          {/* Extraction Errors */}
          {parsedData.extractionErrors && parsedData.extractionErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Extraction Warnings</h3>
              <ul className="list-disc list-inside text-yellow-700">
                {parsedData.extractionErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}