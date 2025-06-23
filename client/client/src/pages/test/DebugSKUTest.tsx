import React, { useState } from 'react';
import { productService } from '@/services/productService';
import { api } from '@/services/api';

export default function DebugSKUTest() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    setResults([]);
    const logs: any[] = [];

    try {
      // Step 1: Create a product with SKU
      const productData = {
        name: 'Debug SKU Test',
        brand: 'Test Brand',
        category: 'Alimentos',
        sku: `DEBUG-SKU-${Date.now()}`,
        description: 'Testing SKU field',
        claims: 'Test'
      };

      logs.push({
        step: 'Product Data to Send',
        data: productData
      });

      const createResponse = await productService.createProduct(productData);
      logs.push({
        step: 'Product Created',
        data: createResponse.product,
        hasSKU: !!createResponse.product.sku
      });

      // Step 2: Fetch product directly
      const fetchResponse = await productService.getProduct(createResponse.product.id);
      logs.push({
        step: 'Product Fetched',
        data: fetchResponse.product,
        hasSKU: !!fetchResponse.product.sku
      });

      // Step 3: Generate QR Code
      const qrResponse = await api.post('/qr/generate', { 
        productId: createResponse.product.id 
      });
      logs.push({
        step: 'QR Code Generated',
        data: qrResponse.data
      });

      // Step 4: Validate QR Code
      const validationUrl = `${api.defaults.baseURL}/qr/validate/${qrResponse.data.qrCode}`;
      const validationResponse = await fetch(validationUrl);
      const validationData = await validationResponse.json();
      
      logs.push({
        step: 'Validation Response',
        url: validationUrl,
        data: validationData,
        productHasSKU: !!validationData.product?.sku
      });

      // Step 5: Direct API call to products endpoint
      const directResponse = await api.get(`/products/${createResponse.product.id}`);
      logs.push({
        step: 'Direct Product API',
        data: directResponse.data,
        hasSKU: !!directResponse.data.product?.sku
      });

    } catch (error: any) {
      logs.push({
        step: 'Error',
        error: error.message,
        details: error.response?.data
      });
    }

    setResults(logs);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug SKU Field Test</h1>
      
      <button
        onClick={runDebugTest}
        disabled={loading}
        className="btn-primary mb-6"
      >
        {loading ? 'Running Test...' : 'Run Debug Test'}
      </button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-lg mb-2">{result.step}</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}