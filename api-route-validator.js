#!/usr/bin/env node

/**
 * True Label API Route Validator
 * Validates route consistency and prevents conflicts
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios').default;

class APIRouteValidator {
  constructor() {
    this.registry = this.loadRegistry();
    this.validationResults = {
      timestamp: new Date().toISOString(),
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      warnings: [],
      summary: {}
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

  async validatePortAvailability() {
    console.log('🔍 Validating port availability...');
    
    const baseUrl = this.registry.baseUrl;
    const port = new URL(baseUrl).port;
    
    try {
      const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
      console.log(`✅ Backend is running on port ${port}`);
      this.validationResults.passed++;
      return true;
    } catch (error) {
      this.addError(`Backend not responding on port ${port}`, 'PORT_UNAVAILABLE');
      return false;
    }
  }

  async validateRouteImplementation() {
    console.log('🔍 Validating route implementations...');
    
    const baseUrl = this.registry.baseUrl;
    let implementedCount = 0;
    let totalCount = 0;

    for (const [groupName, group] of Object.entries(this.registry.routes)) {
      for (const [routeName, route] of Object.entries(group.routes)) {
        totalCount++;
        
        if (!route.implemented) {
          this.addWarning(`Route not implemented: ${route.method} ${group.prefix}${route.path}`, 'NOT_IMPLEMENTED');
          continue;
        }

        try {
          const url = `${baseUrl}${group.prefix}${route.path.replace(':id', 'test-id')}`;
          const config = {
            method: route.method.toLowerCase(),
            url,
            timeout: 5000,
            validateStatus: (status) => status < 500 // Accept 4xx as valid responses
          };

          if (route.authentication) {
            config.headers = { Authorization: 'Bearer mock-jwt-token-123' };
          }

          const response = await axios(config);
          
          if (response.status < 400) {
            implementedCount++;
            this.validationResults.passed++;
          } else if (response.status === 404) {
            this.addError(`Route returns 404: ${route.method} ${group.prefix}${route.path}`, 'ROUTE_NOT_FOUND');
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.addError(`Connection refused for: ${route.method} ${group.prefix}${route.path}`, 'CONNECTION_REFUSED');
          } else {
            this.addWarning(`Route validation failed: ${route.method} ${group.prefix}${route.path} - ${error.message}`, 'VALIDATION_FAILED');
          }
        }
      }
    }

    this.validationResults.summary.routeImplementation = {
      total: totalCount,
      implemented: implementedCount,
      rate: `${((implementedCount / totalCount) * 100).toFixed(1)}%`
    };
  }

  validateRouteConsistency() {
    console.log('🔍 Validating route consistency...');
    
    const duplicates = new Map();
    const conflicts = [];

    for (const [groupName, group] of Object.entries(this.registry.routes)) {
      for (const [routeName, route] of Object.entries(group.routes)) {
        const fullPath = `${route.method} ${group.prefix}${route.path}`;
        
        if (duplicates.has(fullPath)) {
          conflicts.push({
            route: fullPath,
            groups: [duplicates.get(fullPath), groupName]
          });
        } else {
          duplicates.set(fullPath, groupName);
        }
      }
    }

    if (conflicts.length > 0) {
      conflicts.forEach(conflict => {
        this.addError(`Duplicate route definition: ${conflict.route}`, 'DUPLICATE_ROUTE');
      });
    } else {
      console.log('✅ No route conflicts found');
      this.validationResults.passed++;
    }
  }

  validateSchemaConsistency() {
    console.log('🔍 Validating schema consistency...');
    
    let schemaIssues = 0;

    for (const [groupName, group] of Object.entries(this.registry.routes)) {
      for (const [routeName, route] of Object.entries(group.routes)) {
        if (route.implemented) {
          if (!route.description) {
            this.addWarning(`Missing description: ${route.method} ${group.prefix}${route.path}`, 'MISSING_DESCRIPTION');
            schemaIssues++;
          }

          if (route.method === 'POST' && !route.requestSchema) {
            this.addWarning(`Missing request schema: ${route.method} ${group.prefix}${route.path}`, 'MISSING_REQUEST_SCHEMA');
            schemaIssues++;
          }

          if (!route.responseSchema) {
            this.addWarning(`Missing response schema: ${route.method} ${group.prefix}${route.path}`, 'MISSING_RESPONSE_SCHEMA');
            schemaIssues++;
          }
        }
      }
    }

    this.validationResults.summary.schemaConsistency = {
      issues: schemaIssues,
      status: schemaIssues === 0 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };
  }

  addError(message, code) {
    this.validationResults.errors.push({ message, code, timestamp: new Date().toISOString() });
    this.validationResults.failed++;
    console.log(`❌ ${message}`);
  }

  addWarning(message, code) {
    this.validationResults.warnings.push({ message, code, timestamp: new Date().toISOString() });
    this.validationResults.warnings++;
    console.log(`⚠️  ${message}`);
  }

  generateReport() {
    const reportPath = path.join(__dirname, 'api-route-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.validationResults, null, 2));
    
    console.log('\n📋 API Route Validation Report');
    console.log('==============================');
    console.log(`✅ Passed: ${this.validationResults.passed}`);
    console.log(`❌ Failed: ${this.validationResults.failed}`);
    console.log(`⚠️  Warnings: ${this.validationResults.warnings}`);
    
    if (this.validationResults.summary.routeImplementation) {
      console.log(`🔗 Route Implementation: ${this.validationResults.summary.routeImplementation.rate}`);
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    return this.validationResults.failed === 0;
  }

  async run() {
    console.log('🚀 Starting True Label API Route Validation...\n');
    
    const isBackendRunning = await this.validatePortAvailability();
    
    if (isBackendRunning) {
      await this.validateRouteImplementation();
    }
    
    this.validateRouteConsistency();
    this.validateSchemaConsistency();
    
    const success = this.generateReport();
    
    console.log(success ? '\n✅ Validation completed successfully!' : '\n❌ Validation completed with errors!');
    
    return success;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new APIRouteValidator();
  validator.run()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

module.exports = APIRouteValidator;
