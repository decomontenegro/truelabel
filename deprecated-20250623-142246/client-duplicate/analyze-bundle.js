// Bundle Size Analysis for True Label
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeBundle() {
  console.log('Analyzing True Label Bundle Sizes...\n');
  
  const distPath = path.join(__dirname, 'dist');
  const results = {
    files: [],
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    assetSize: 0,
    analysis: {}
  };

  try {
    // Read all files in dist directory
    async function readDirectory(dirPath, baseDir = '') {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.join(baseDir, entry.name);
        
        if (entry.isDirectory()) {
          await readDirectory(fullPath, relativePath);
        } else {
          const stats = await fs.stat(fullPath);
          const sizeKB = stats.size / 1024;
          
          results.files.push({
            path: relativePath,
            size: sizeKB,
            type: getFileType(entry.name)
          });
          
          results.totalSize += sizeKB;
          
          // Categorize by type
          if (entry.name.endsWith('.js')) {
            results.jsSize += sizeKB;
          } else if (entry.name.endsWith('.css')) {
            results.cssSize += sizeKB;
          } else {
            results.assetSize += sizeKB;
          }
        }
      }
    }
    
    await readDirectory(distPath);
    
    // Sort files by size
    results.files.sort((a, b) => b.size - a.size);
    
    // Analyze main chunks
    const mainChunks = results.files.filter(f => f.type === 'javascript' && f.size > 100);
    const largeFiles = results.files.filter(f => f.size > 500);
    
    // Check for code splitting
    const chunkFiles = results.files.filter(f => f.path.includes('chunk'));
    
    // Generate report
    const report = generateBundleReport(results, mainChunks, largeFiles, chunkFiles);
    await fs.writeFile('bundle-analysis-report.md', report);
    console.log('Bundle analysis report saved to bundle-analysis-report.md');
    
  } catch (error) {
    console.error('Error analyzing bundle:', error);
    console.log('\nMake sure to build the project first: npm run build');
  }
}

function getFileType(filename) {
  if (filename.endsWith('.js')) return 'javascript';
  if (filename.endsWith('.css')) return 'css';
  if (filename.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
  if (filename.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
  return 'other';
}

function generateBundleReport(results, mainChunks, largeFiles, chunkFiles) {
  const timestamp = new Date().toISOString();
  
  return `# True Label Bundle Size Analysis

Generated: ${timestamp}

## Summary

- **Total Bundle Size**: ${results.totalSize.toFixed(2)} KB
- **JavaScript**: ${results.jsSize.toFixed(2)} KB (${((results.jsSize / results.totalSize) * 100).toFixed(1)}%)
- **CSS**: ${results.cssSize.toFixed(2)} KB (${((results.cssSize / results.totalSize) * 100).toFixed(1)}%)
- **Assets**: ${results.assetSize.toFixed(2)} KB (${((results.assetSize / results.totalSize) * 100).toFixed(1)}%)
- **Total Files**: ${results.files.length}

## Largest Files (Top 10)

| File | Size (KB) | Type |
|------|-----------|------|
${results.files.slice(0, 10).map(f => `| ${f.path} | ${f.size.toFixed(2)} | ${f.type} |`).join('\n')}

## Main JavaScript Chunks

${mainChunks.length > 0 ? mainChunks.map(chunk => `- **${chunk.path}**: ${chunk.size.toFixed(2)} KB`).join('\n') : 'No main chunks found'}

## Code Splitting Analysis

- **Number of chunks**: ${chunkFiles.length}
- **Chunk files**: ${chunkFiles.length > 0 ? chunkFiles.map(f => f.path).join(', ') : 'None found'}

## Files Over 500KB

${largeFiles.length > 0 ? largeFiles.map(f => `- **${f.path}**: ${f.size.toFixed(2)} KB`).join('\n') : 'No files over 500KB found'}

## Optimization Recommendations

Based on the bundle analysis:

${results.totalSize > 5000 ? `### 1. Bundle Size Reduction Needed
- Total bundle size (${results.totalSize.toFixed(2)} KB) exceeds recommended limit
- Consider implementing the following optimizations:
` : '### 1. Bundle Size is Reasonable\n'}

${results.jsSize > 3000 ? `### 2. JavaScript Optimization
- JavaScript bundle (${results.jsSize.toFixed(2)} KB) is large
- Recommendations:
  - Implement route-based code splitting
  - Use dynamic imports for heavy components
  - Tree-shake unused dependencies
  - Consider using lighter alternatives for large libraries
` : ''}

${chunkFiles.length < 5 ? `### 3. Improve Code Splitting
- Only ${chunkFiles.length} chunks detected
- Recommendations:
  - Split routes into separate chunks
  - Lazy load heavy components
  - Use React.lazy() for component-level splitting
` : ''}

${largeFiles.length > 0 ? `### 4. Large File Alert
- ${largeFiles.length} files exceed 500KB
- These files should be optimized or split
` : ''}

### 5. General Recommendations

1. **Enable Compression**
   - Use gzip/brotli compression on server
   - This can reduce bundle size by 60-80%

2. **Optimize Dependencies**
   - Audit package.json for unused dependencies
   - Use bundle analyzers to identify large libraries
   - Consider lighter alternatives

3. **Asset Optimization**
   - Convert images to WebP format
   - Implement responsive images
   - Use SVGs for icons

4. **Build Configuration**
   - Ensure production builds are optimized
   - Enable minification and tree-shaking
   - Use modern build targets

## Next Steps

1. Run \`npm run build -- --analyze\` to get detailed bundle visualization
2. Implement route-based code splitting
3. Audit and optimize largest dependencies
4. Set up performance budgets in CI/CD pipeline
`;
}

// Run analysis
analyzeBundle().catch(console.error);