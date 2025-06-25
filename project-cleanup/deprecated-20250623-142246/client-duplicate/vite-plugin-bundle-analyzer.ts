import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';

interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
}

export function bundleAnalyzer(): Plugin {
  const bundles: BundleInfo[] = [];

  return {
    name: 'vite-plugin-bundle-analyzer',
    
    generateBundle(options, bundle) {
      // Analisar cada chunk gerado
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' || fileName.endsWith('.js')) {
          const code = chunk.type === 'chunk' ? chunk.code : (chunk as any).source;
          const size = Buffer.byteLength(code, 'utf8');
          const gzipSize = gzipSync(code).length;
          
          bundles.push({
            name: fileName,
            size,
            gzipSize
          });
        }
      }
    },
    
    closeBundle() {
      // Ordenar por tamanho
      bundles.sort((a, b) => b.size - a.size);
      
      // Criar relatório
      const report = {
        timestamp: new Date().toISOString(),
        totalSize: bundles.reduce((acc, b) => acc + b.size, 0),
        totalGzipSize: bundles.reduce((acc, b) => acc + b.gzipSize, 0),
        bundles: bundles.map(b => ({
          ...b,
          sizeKB: (b.size / 1024).toFixed(2),
          gzipSizeKB: (b.gzipSize / 1024).toFixed(2)
        }))
      };
      
      // Salvar relatório
      const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      // Log no console
      console.log('\n📦 Bundle Analysis Report:');
      console.log('=' .repeat(60));
      console.log(`Total Size: ${(report.totalSize / 1024).toFixed(2)} KB`);
      console.log(`Total Gzip: ${(report.totalGzipSize / 1024).toFixed(2)} KB`);
      console.log('=' .repeat(60));
      console.log('\nTop 10 Largest Bundles:');
      console.log('-' .repeat(60));
      
      bundles.slice(0, 10).forEach((bundle, index) => {
        console.log(
          `${(index + 1).toString().padStart(2)}. ${bundle.name.padEnd(35)} ` +
          `${(bundle.size / 1024).toFixed(2).padStart(8)} KB ` +
          `(gzip: ${(bundle.gzipSize / 1024).toFixed(2).padStart(8)} KB)`
        );
      });
      
      console.log('\n✅ Full report saved to bundle-analysis.json\n');
      
      // Avisos para bundles grandes
      const largeBundles = bundles.filter(b => b.size > 250 * 1024);
      if (largeBundles.length > 0) {
        console.warn('⚠️  Warning: The following bundles exceed 250KB:');
        largeBundles.forEach(b => {
          console.warn(`   - ${b.name} (${(b.size / 1024).toFixed(2)} KB)`);
        });
        console.log('');
      }
    }
  };
}