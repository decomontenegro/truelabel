#!/usr/bin/env node

/**
 * True Label API Route Manager
 * Comprehensive route management system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APIRouteAuditor = require('./api-route-audit');
const APIRouteValidator = require('./api-route-validator');
const APIRouteGenerator = require('./api-route-generator');

class APIRouteManager {
  constructor() {
    this.commands = {
      audit: 'Perform complete route audit',
      validate: 'Validate route consistency',
      generate: 'Generate routes from registry',
      sync: 'Sync routes between frontend and backend',
      status: 'Show current route status',
      fix: 'Auto-fix common route issues',
      help: 'Show this help message'
    };
  }

  async audit() {
    console.log('🔍 Running route audit...\n');
    const auditor = new APIRouteAuditor();
    const results = await auditor.run();
    
    this.updateRegistryFromAudit(results);
    return results;
  }

  async validate() {
    console.log('✅ Running route validation...\n');
    const validator = new APIRouteValidator();
    return await validator.run();
  }

  async generate() {
    console.log('🔧 Generating routes...\n');
    const generator = new APIRouteGenerator();
    await generator.run();
    
    console.log('\n🔄 To use generated backend:');
    console.log('cd server && node src/index-generated.js');
  }

  async sync() {
    console.log('🔄 Syncing routes...\n');
    
    // Run audit first
    const auditResults = await this.audit();
    
    // Generate missing routes
    if (auditResults.details.missingRoutes.length > 0) {
      console.log('🔧 Generating missing routes...');
      await this.generate();
    }
    
    // Validate after generation
    console.log('✅ Validating after sync...');
    await this.validate();
    
    console.log('\n✅ Route sync completed!');
  }

  async status() {
    console.log('📊 Route Status Report\n');
    
    try {
      const registry = JSON.parse(fs.readFileSync('api-route-registry.json', 'utf8'));
      
      console.log('📋 Registry Information:');
      console.log(`   Version: ${registry.version}`);
      console.log(`   Last Updated: ${registry.lastUpdated}`);
      console.log(`   Base URL: ${registry.baseUrl}`);
      console.log(`   Total Routes: ${registry.metadata.totalRoutes}`);
      console.log(`   Implemented: ${registry.metadata.implementedRoutes}`);
      console.log(`   Implementation Rate: ${registry.metadata.implementationRate}`);
      console.log(`   Missing Routes: ${registry.metadata.missingRoutes}`);
      
      console.log('\n📊 Route Groups:');
      for (const [groupName, group] of Object.entries(registry.routes)) {
        const routeCount = Object.keys(group.routes).length;
        const implementedCount = Object.values(group.routes).filter(r => r.implemented).length;
        const rate = ((implementedCount / routeCount) * 100).toFixed(0);
        console.log(`   ${groupName}: ${implementedCount}/${routeCount} (${rate}%)`);
      }
      
    } catch (error) {
      console.log('❌ Could not load registry status');
    }
    
    // Check if backend is running
    try {
      const { execSync } = require('child_process');
      const result = execSync('lsof -i :3334', { encoding: 'utf8' });
      console.log('\n🟢 Backend Status: Running on port 3334');
    } catch (error) {
      console.log('\n🔴 Backend Status: Not running');
    }
  }

  async fix() {
    console.log('🔧 Auto-fixing common route issues...\n');
    
    let fixCount = 0;
    
    // Fix 1: Update registry with current timestamp
    try {
      const registry = JSON.parse(fs.readFileSync('api-route-registry.json', 'utf8'));
      registry.lastUpdated = new Date().toISOString();
      fs.writeFileSync('api-route-registry.json', JSON.stringify(registry, null, 2));
      console.log('✅ Updated registry timestamp');
      fixCount++;
    } catch (error) {
      console.log('❌ Could not update registry');
    }
    
    // Fix 2: Ensure backend directory exists
    const backendDir = path.join(__dirname, 'server/src');
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir, { recursive: true });
      console.log('✅ Created backend directory');
      fixCount++;
    }
    
    // Fix 3: Ensure frontend service directory exists
    const serviceDir = path.join(__dirname, 'client/src/services');
    if (!fs.existsSync(serviceDir)) {
      fs.mkdirSync(serviceDir, { recursive: true });
      console.log('✅ Created frontend service directory');
      fixCount++;
    }
    
    // Fix 4: Generate missing files if needed
    if (!fs.existsSync('server/src/index-generated.js')) {
      await this.generate();
      console.log('✅ Generated missing backend file');
      fixCount++;
    }
    
    console.log(`\n✅ Applied ${fixCount} fixes`);
  }

  updateRegistryFromAudit(auditResults) {
    try {
      const registry = JSON.parse(fs.readFileSync('api-route-registry.json', 'utf8'));
      
      // Update metadata
      registry.lastUpdated = new Date().toISOString();
      registry.metadata.totalRoutes = auditResults.summary.frontendRoutes;
      registry.metadata.implementedRoutes = auditResults.summary.backendRoutes;
      registry.metadata.implementationRate = auditResults.summary.implementationRate;
      registry.metadata.missingRoutes = auditResults.summary.missingRoutes;
      
      fs.writeFileSync('api-route-registry.json', JSON.stringify(registry, null, 2));
      console.log('✅ Updated registry with audit results');
    } catch (error) {
      console.log('⚠️  Could not update registry from audit');
    }
  }

  showHelp() {
    console.log('🏷️  True Label API Route Manager\n');
    console.log('Available commands:\n');
    
    for (const [command, description] of Object.entries(this.commands)) {
      console.log(`   ${command.padEnd(10)} - ${description}`);
    }
    
    console.log('\nUsage:');
    console.log('   node api-route-manager.js <command>');
    console.log('\nExamples:');
    console.log('   node api-route-manager.js audit');
    console.log('   node api-route-manager.js sync');
    console.log('   node api-route-manager.js status');
  }

  async run(command) {
    if (!command || command === 'help') {
      this.showHelp();
      return;
    }

    if (!this.commands[command]) {
      console.log(`❌ Unknown command: ${command}`);
      this.showHelp();
      return;
    }

    try {
      await this[command]();
    } catch (error) {
      console.error(`💥 Error running ${command}:`, error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new APIRouteManager();
  const command = process.argv[2];
  manager.run(command);
}

module.exports = APIRouteManager;
