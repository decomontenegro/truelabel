#!/usr/bin/env node

/**
 * True Label API Route Generator
 * Automatically generates backend routes from registry
 */

const fs = require('fs');
const path = require('path');

class APIRouteGenerator {
  constructor() {
    this.registry = this.loadRegistry();
    this.generatedCode = {
      routes: [],
      middleware: [],
      imports: []
    };
  }

  loadRegistry() {
    try {
      const registryPath = path.join(__dirname, 'api-route-registry.json');
      return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } catch (error) {
      console.error('❌ Failed to load route registry:', error.message);
      process.exit(1);
    }
  }

  generateRouteCode(groupName, group, routeName, route) {
    const fullPath = `${group.prefix}${route.path}`;
    const methodName = route.method.toLowerCase();
    const handlerName = `${groupName}${routeName.charAt(0).toUpperCase() + routeName.slice(1)}`;
    
    let code = `\n// ${route.description || `${groupName} ${routeName}`}\n`;
    code += `app.${methodName}('${fullPath}'`;
    
    if (route.authentication) {
      code += ', authenticate';
    }
    
    code += `, async (req, res) => {\n`;
    code += `  try {\n`;
    
    // Generate request handling based on method
    if (route.method === 'POST' || route.method === 'PUT') {
      if (route.requestSchema) {
        code += `    const { ${Object.keys(route.requestSchema).join(', ')} } = req.body;\n`;
        code += `    \n`;
        code += `    // Validate required fields\n`;
        Object.entries(route.requestSchema).forEach(([field, type]) => {
          if (type === 'string') {
            code += `    if (!${field}) {\n`;
            code += `      return res.status(400).json({ success: false, message: '${field} is required' });\n`;
            code += `    }\n`;
          }
        });
      }
    }
    
    // Generate response based on schema
    if (route.responseSchema) {
      code += `    \n`;
      code += `    const response = {\n`;
      Object.entries(route.responseSchema).forEach(([field, type]) => {
        if (field === 'success') {
          code += `      success: true,\n`;
        } else if (type === 'array') {
          code += `      ${field}: [],\n`;
        } else if (type === 'object') {
          code += `      ${field}: {},\n`;
        } else if (type === 'string') {
          code += `      ${field}: 'Generated response',\n`;
        } else if (type === 'number') {
          code += `      ${field}: 0,\n`;
        } else if (type === 'boolean') {
          code += `      ${field}: true,\n`;
        }
      });
      code += `    };\n`;
      code += `    \n`;
      code += `    res.json(response);\n`;
    } else {
      code += `    res.json({ success: true, message: 'Operation completed' });\n`;
    }
    
    code += `  } catch (error) {\n`;
    code += `    console.error('Error in ${handlerName}:', error);\n`;
    code += `    res.status(500).json({ success: false, message: 'Internal server error' });\n`;
    code += `  }\n`;
    code += `});\n`;
    
    return code;
  }

  generateBackendFile() {
    console.log('🔧 Generating backend routes...');
    
    let backendCode = `const express = require('express');\n`;
    backendCode += `const cors = require('cors');\n`;
    backendCode += `require('dotenv').config();\n\n`;
    backendCode += `const app = express();\n`;
    backendCode += `const PORT = process.env.PORT || 3334;\n\n`;
    
    // CORS configuration
    backendCode += `// CORS configuration\n`;
    backendCode += `app.use(cors({\n`;
    backendCode += `  origin: 'http://localhost:3001',\n`;
    backendCode += `  credentials: true\n`;
    backendCode += `}));\n\n`;
    backendCode += `app.use(express.json());\n\n`;
    
    // Authentication middleware
    backendCode += `// Authentication middleware\n`;
    backendCode += `const authenticate = (req, res, next) => {\n`;
    backendCode += `  const token = req.headers.authorization?.replace('Bearer ', '');\n`;
    backendCode += `  if (!token || !token.startsWith('mock-jwt-token')) {\n`;
    backendCode += `    return res.status(401).json({ success: false, message: 'Authentication required' });\n`;
    backendCode += `  }\n`;
    backendCode += `  req.user = { id: '1', email: 'admin@truelabel.com', role: 'ADMIN' };\n`;
    backendCode += `  next();\n`;
    backendCode += `};\n\n`;
    
    // Health check
    backendCode += `// Health check\n`;
    backendCode += `app.get('/health', (req, res) => {\n`;
    backendCode += `  res.json({ status: 'healthy', port: PORT, timestamp: new Date().toISOString() });\n`;
    backendCode += `});\n\n`;
    
    // Generate routes from registry
    for (const [groupName, group] of Object.entries(this.registry.routes)) {
      backendCode += `// ==========================================\n`;
      backendCode += `// ${groupName.toUpperCase()} ROUTES\n`;
      backendCode += `// ==========================================\n`;
      
      for (const [routeName, route] of Object.entries(group.routes)) {
        if (route.implemented) {
          backendCode += this.generateRouteCode(groupName, group, routeName, route);
        } else {
          backendCode += `\n// TODO: Implement ${route.method} ${group.prefix}${route.path}\n`;
          backendCode += `// Description: ${route.description || 'No description'}\n`;
        }
      }
      
      backendCode += `\n`;
    }
    
    // 404 handler
    backendCode += `// 404 handler\n`;
    backendCode += `app.use('*', (req, res) => {\n`;
    backendCode += `  res.status(404).json({\n`;
    backendCode += `    success: false,\n`;
    backendCode += `    message: 'Endpoint not found',\n`;
    backendCode += `    path: req.originalUrl,\n`;
    backendCode += `    method: req.method\n`;
    backendCode += `  });\n`;
    backendCode += `});\n\n`;
    
    // Server startup
    backendCode += `// Start server\n`;
    backendCode += `app.listen(PORT, () => {\n`;
    backendCode += `  console.log(\`🚀 True Label API Server running on port \${PORT}\`);\n`;
    backendCode += `  console.log(\`🔗 Health check: http://localhost:\${PORT}/health\`);\n`;
    backendCode += `  console.log(\`📋 Routes: \${Object.keys(require('./api-route-registry.json').routes).length} groups\`);\n`;
    backendCode += `  console.log('✅ Generated from route registry');\n`;
    backendCode += `});\n\n`;
    backendCode += `module.exports = app;\n`;
    
    return backendCode;
  }

  generateFrontendService() {
    console.log('🔧 Generating frontend API service...');
    
    let serviceCode = `/**\n`;
    serviceCode += ` * True Label API Service\n`;
    serviceCode += ` * Auto-generated from route registry\n`;
    serviceCode += ` */\n\n`;
    serviceCode += `import axios from 'axios';\n\n`;
    serviceCode += `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3334';\n\n`;
    serviceCode += `const api = axios.create({\n`;
    serviceCode += `  baseURL: API_BASE_URL,\n`;
    serviceCode += `  timeout: 30000,\n`;
    serviceCode += `  headers: {\n`;
    serviceCode += `    'Content-Type': 'application/json'\n`;
    serviceCode += `  }\n`;
    serviceCode += `});\n\n`;
    
    // Add auth interceptor
    serviceCode += `// Add auth token to requests\n`;
    serviceCode += `api.interceptors.request.use((config) => {\n`;
    serviceCode += `  const token = localStorage.getItem('authToken');\n`;
    serviceCode += `  if (token) {\n`;
    serviceCode += `    config.headers.Authorization = \`Bearer \${token}\`;\n`;
    serviceCode += `  }\n`;
    serviceCode += `  return config;\n`;
    serviceCode += `});\n\n`;
    
    // Generate service methods
    for (const [groupName, group] of Object.entries(this.registry.routes)) {
      serviceCode += `// ${groupName.toUpperCase()} API\n`;
      serviceCode += `export const ${groupName}API = {\n`;
      
      for (const [routeName, route] of Object.entries(group.routes)) {
        const methodName = routeName;
        const fullPath = `${group.prefix}${route.path}`;
        
        serviceCode += `  ${methodName}: `;
        
        if (route.method === 'GET') {
          serviceCode += `(params = {}) => api.get('${fullPath}', { params }),\n`;
        } else if (route.method === 'POST') {
          serviceCode += `(data = {}) => api.post('${fullPath}', data),\n`;
        } else if (route.method === 'PUT') {
          serviceCode += `(id, data = {}) => api.put('${fullPath.replace(':id', '${id}')}', data),\n`;
        } else if (route.method === 'DELETE') {
          serviceCode += `(id) => api.delete('${fullPath.replace(':id', '${id}')}'),\n`;
        }
      }
      
      serviceCode += `};\n\n`;
    }
    
    serviceCode += `export default api;\n`;
    
    return serviceCode;
  }

  async run() {
    console.log('🚀 Starting True Label API Route Generation...\n');
    
    // Generate backend file
    const backendCode = this.generateBackendFile();
    const backendPath = path.join(__dirname, 'server/src/index-generated.js');
    fs.writeFileSync(backendPath, backendCode);
    console.log(`✅ Generated backend: ${backendPath}`);
    
    // Generate frontend service
    const serviceCode = this.generateFrontendService();
    const servicePath = path.join(__dirname, 'client/src/services/api-generated.ts');
    
    // Ensure directory exists
    const serviceDir = path.dirname(servicePath);
    if (!fs.existsSync(serviceDir)) {
      fs.mkdirSync(serviceDir, { recursive: true });
    }
    
    fs.writeFileSync(servicePath, serviceCode);
    console.log(`✅ Generated frontend service: ${servicePath}`);
    
    console.log('\n📋 Generation Summary:');
    console.log(`Routes generated: ${this.registry.metadata.totalRoutes}`);
    console.log(`Implementation rate: ${this.registry.metadata.implementationRate}`);
    
    console.log('\n✅ Route generation completed!');
  }
}

// Run generator if called directly
if (require.main === module) {
  const generator = new APIRouteGenerator();
  generator.run().catch(console.error);
}

module.exports = APIRouteGenerator;
