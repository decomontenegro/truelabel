#!/usr/bin/env node

/**
 * True Label API Route Audit System
 * Performs comprehensive analysis of all API routes
 */

const fs = require('fs');
const path = require('path');

class APIRouteAuditor {
  constructor() {
    this.frontendRoutes = new Map();
    this.backendRoutes = new Map();
    this.missingRoutes = [];
    this.conflictingRoutes = [];
    this.auditResults = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {},
      recommendations: []
    };
  }

  // Scan frontend for API calls
  scanFrontendRoutes() {
    console.log('🔍 Scanning frontend for API routes...');
    
    const frontendDir = path.join(__dirname, 'client/src');
    this.scanDirectory(frontendDir, (filePath, content) => {
      this.extractFrontendAPIRoutes(filePath, content);
    });
  }

  // Scan backend for route definitions
  scanBackendRoutes() {
    console.log('🔍 Scanning backend for route definitions...');
    
    const backendDir = path.join(__dirname, 'server/src');
    this.scanDirectory(backendDir, (filePath, content) => {
      this.extractBackendRoutes(filePath, content);
    });
  }

  scanDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.includes('node_modules')) {
        this.scanDirectory(fullPath, callback);
      } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          callback(fullPath, content);
        } catch (error) {
          console.warn(`⚠️  Could not read file: ${fullPath}`);
        }
      }
    }
  }

  extractFrontendAPIRoutes(filePath, content) {
    // Patterns to match API calls
    const patterns = [
      /api\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /axios\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /fetch\s*\(\s*['"`]([^'"`]*\/api\/[^'"`]+)['"`]/g,
      /VITE_API_BASE_URL[^'"`]*['"`]([^'"`]+)['"`]/g,
      /endpoints\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const route = match[1];
        if (route && route.startsWith('/')) {
          const method = this.extractHTTPMethod(content, match.index);
          const key = `${method} ${route}`;
          
          if (!this.frontendRoutes.has(key)) {
            this.frontendRoutes.set(key, {
              route,
              method,
              files: [],
              usageCount: 0
            });
          }
          
          const routeData = this.frontendRoutes.get(key);
          routeData.files.push(filePath.replace(__dirname, ''));
          routeData.usageCount++;
        }
      }
    });
  }

  extractBackendRoutes(filePath, content) {
    // Patterns to match route definitions
    const patterns = [
      /app\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /router\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const route = match[1];
        const method = this.extractHTTPMethodFromDefinition(match[0]);
        const key = `${method.toUpperCase()} ${route}`;
        
        if (!this.backendRoutes.has(key)) {
          this.backendRoutes.set(key, {
            route,
            method: method.toUpperCase(),
            file: filePath.replace(__dirname, ''),
            implemented: true
          });
        }
      }
    });
  }

  extractHTTPMethod(content, index) {
    const beforeMatch = content.substring(Math.max(0, index - 50), index);
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of methods) {
      if (beforeMatch.toLowerCase().includes(method.toLowerCase())) {
        return method;
      }
    }
    return 'GET'; // Default
  }

  extractHTTPMethodFromDefinition(definition) {
    const match = definition.match(/\.(get|post|put|delete|patch)\s*\(/);
    return match ? match[1].toUpperCase() : 'GET';
  }

  analyzeRoutes() {
    console.log('📊 Analyzing route consistency...');
    
    // Find missing routes
    for (const [key, frontendRoute] of this.frontendRoutes) {
      if (!this.backendRoutes.has(key)) {
        this.missingRoutes.push({
          route: frontendRoute.route,
          method: frontendRoute.method,
          usageCount: frontendRoute.usageCount,
          files: frontendRoute.files
        });
      }
    }

    // Generate summary
    this.auditResults.summary = {
      frontendRoutes: this.frontendRoutes.size,
      backendRoutes: this.backendRoutes.size,
      missingRoutes: this.missingRoutes.length,
      implementationRate: ((this.backendRoutes.size / this.frontendRoutes.size) * 100).toFixed(1) + '%'
    };

    this.auditResults.details = {
      frontendRoutes: Array.from(this.frontendRoutes.entries()),
      backendRoutes: Array.from(this.backendRoutes.entries()),
      missingRoutes: this.missingRoutes
    };

    this.generateRecommendations();
  }

  generateRecommendations() {
    this.auditResults.recommendations = [
      {
        priority: 'HIGH',
        category: 'Missing Routes',
        count: this.missingRoutes.length,
        description: 'Implement missing backend routes to prevent 404 errors',
        routes: this.missingRoutes.slice(0, 5) // Top 5
      }
    ];

    if (this.missingRoutes.length > 10) {
      this.auditResults.recommendations.push({
        priority: 'MEDIUM',
        category: 'Route Management',
        description: 'Consider implementing a route registry system to prevent future mismatches'
      });
    }
  }

  generateReport() {
    const reportPath = path.join(__dirname, 'api-route-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
    
    console.log('\n📋 API Route Audit Report');
    console.log('========================');
    console.log(`Frontend Routes: ${this.auditResults.summary.frontendRoutes}`);
    console.log(`Backend Routes: ${this.auditResults.summary.backendRoutes}`);
    console.log(`Missing Routes: ${this.auditResults.summary.missingRoutes}`);
    console.log(`Implementation Rate: ${this.auditResults.summary.implementationRate}`);
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    if (this.missingRoutes.length > 0) {
      console.log('\n❌ Missing Routes:');
      this.missingRoutes.forEach(route => {
        console.log(`   ${route.method} ${route.route} (used ${route.usageCount} times)`);
      });
    }
  }

  async run() {
    console.log('🚀 Starting True Label API Route Audit...\n');
    
    this.scanFrontendRoutes();
    this.scanBackendRoutes();
    this.analyzeRoutes();
    this.generateReport();
    
    console.log('\n✅ Audit completed!');
    return this.auditResults;
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new APIRouteAuditor();
  auditor.run().catch(console.error);
}

module.exports = APIRouteAuditor;
