// Performance Test Script for True Label
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

async function measurePerformance() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    metrics: {},
    resources: [],
    coverage: {},
    memoryUsage: []
  };

  try {
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false); // First test without cache
    
    // Monitor console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });

    // Collect resource timing
    page.on('response', response => {
      results.resources.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length'] || 0,
        type: response.headers()['content-type'] || 'unknown'
      });
    });

    console.log('1. Testing Initial Load Performance...');
    
    // Navigate and measure initial load
    const startTime = Date.now();
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        navigation: navigation ? {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          requestStart: navigation.requestStart - navigation.fetchStart,
          responseEnd: navigation.responseEnd - navigation.requestStart,
          domComplete: navigation.domComplete - navigation.fetchStart
        } : {},
        paint: paint.map(p => ({ name: p.name, startTime: p.startTime })),
        memory: performance.memory ? {
          usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
          jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
        } : {}
      };
    });
    
    results.metrics.initialLoad = {
      totalLoadTime: loadTime + ' ms',
      ...performanceMetrics
    };

    console.log('2. Testing Core Web Vitals...');
    
    // Measure Core Web Vitals
    const coreWebVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        let metrics = {};
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID (First Input Delay) - simulated
        metrics.fid = 'Requires user interaction';
        
        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          metrics.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Wait a bit to collect metrics
        setTimeout(() => resolve(metrics), 3000);
      });
    });
    
    results.metrics.coreWebVitals = coreWebVitals;

    console.log('3. Testing with Cache Enabled...');
    
    // Test with cache
    await page.setCacheEnabled(true);
    const cachedStartTime = Date.now();
    await page.reload({ waitUntil: 'networkidle0' });
    const cachedLoadTime = Date.now() - cachedStartTime;
    
    results.metrics.cachedLoad = {
      totalLoadTime: cachedLoadTime + ' ms',
      improvement: ((loadTime - cachedLoadTime) / loadTime * 100).toFixed(2) + '%'
    };

    console.log('4. Testing Bundle Sizes...');
    
    // Analyze bundle sizes
    const bundleSizes = results.resources
      .filter(r => r.type && (r.type.includes('javascript') || r.type.includes('css')))
      .reduce((acc, r) => {
        const type = r.type.includes('javascript') ? 'js' : 'css';
        acc[type] = (acc[type] || 0) + parseInt(r.size || 0);
        return acc;
      }, {});
    
    results.metrics.bundleSizes = {
      javascript: (bundleSizes.js / 1024).toFixed(2) + ' KB',
      css: (bundleSizes.css / 1024).toFixed(2) + ' KB',
      total: ((bundleSizes.js + bundleSizes.css) / 1024).toFixed(2) + ' KB'
    };

    console.log('5. Testing Slow Network (3G)...');
    
    // Test on slow 3G
    const client = await page.createCDPSession();
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.6 * 1024 * 1024 / 8,
      uploadThroughput: 750 * 1024 / 8,
      latency: 150
    });
    
    const slow3GStartTime = Date.now();
    await page.reload({ waitUntil: 'networkidle0' });
    const slow3GLoadTime = Date.now() - slow3GStartTime;
    
    results.metrics.slow3G = {
      totalLoadTime: slow3GLoadTime + ' ms',
      degradation: ((slow3GLoadTime - loadTime) / loadTime * 100).toFixed(2) + '%'
    };

    console.log('6. Testing Memory Usage...');
    
    // Monitor memory usage during navigation
    const pages = ['/products', '/validations', '/analytics'];
    for (const path of pages) {
      try {
        await page.goto(`http://localhost:3001${path}`, { waitUntil: 'networkidle0' });
        const memoryUsage = await page.evaluate(() => {
          if (performance.memory) {
            return {
              path: window.location.pathname,
              usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB'
            };
          }
          return null;
        });
        if (memoryUsage) {
          results.memoryUsage.push(memoryUsage);
        }
      } catch (e) {
        console.log(`Failed to test ${path}:`, e.message);
      }
    }

    console.log('7. Testing Image Lazy Loading...');
    
    // Check for lazy loading
    await page.goto('http://localhost:3001/products', { waitUntil: 'networkidle0' });
    const lazyLoadingCheck = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const lazyImages = Array.from(images).filter(img => 
        img.loading === 'lazy' || img.dataset.src || img.classList.contains('lazy')
      );
      return {
        totalImages: images.length,
        lazyImages: lazyImages.length,
        percentage: images.length ? (lazyImages.length / images.length * 100).toFixed(2) + '%' : '0%'
      };
    });
    
    results.metrics.lazyLoading = lazyLoadingCheck;

    console.log('8. Analyzing Performance Bottlenecks...');
    
    // Get long tasks
    const longTasks = await page.evaluate(() => {
      return new Promise((resolve) => {
        const tasks = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            tasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        }).observe({ entryTypes: ['longtask'] });
        
        setTimeout(() => resolve(tasks), 2000);
      });
    });
    
    results.metrics.longTasks = longTasks.filter(t => t.duration > 50);

    // Generate report
    const report = generateReport(results);
    await fs.writeFile('performance-report.md', report);
    console.log('\nPerformance report saved to performance-report.md');
    
  } catch (error) {
    console.error('Error during performance testing:', error);
  } finally {
    await browser.close();
  }
}

function generateReport(results) {
  const report = `# True Label Performance Report

Generated: ${results.timestamp}

## 1. Initial Load Performance

- **Total Load Time**: ${results.metrics.initialLoad.totalLoadTime}
- **DOM Content Loaded**: ${results.metrics.initialLoad.navigation.domContentLoaded} ms
- **DOM Interactive**: ${results.metrics.initialLoad.navigation.domInteractive} ms
- **DOM Complete**: ${results.metrics.initialLoad.navigation.domComplete} ms

### Paint Metrics
${results.metrics.initialLoad.paint.map(p => `- **${p.name}**: ${p.startTime.toFixed(2)} ms`).join('\n')}

### Memory Usage
- **Used JS Heap**: ${results.metrics.initialLoad.memory.usedJSHeapSize}
- **Total JS Heap**: ${results.metrics.initialLoad.memory.totalJSHeapSize}

## 2. Core Web Vitals

- **LCP (Largest Contentful Paint)**: ${results.metrics.coreWebVitals.lcp ? results.metrics.coreWebVitals.lcp.toFixed(2) + ' ms' : 'N/A'}
- **FID (First Input Delay)**: ${results.metrics.coreWebVitals.fid}
- **CLS (Cumulative Layout Shift)**: ${results.metrics.coreWebVitals.cls ? results.metrics.coreWebVitals.cls.toFixed(4) : 'N/A'}

## 3. Cache Performance

- **Cached Load Time**: ${results.metrics.cachedLoad.totalLoadTime}
- **Cache Improvement**: ${results.metrics.cachedLoad.improvement}

## 4. Bundle Sizes

- **JavaScript**: ${results.metrics.bundleSizes.javascript}
- **CSS**: ${results.metrics.bundleSizes.css}
- **Total**: ${results.metrics.bundleSizes.total}

## 5. Network Performance

### Slow 3G Performance
- **Load Time**: ${results.metrics.slow3G.totalLoadTime}
- **Performance Degradation**: ${results.metrics.slow3G.degradation}

## 6. Memory Usage by Route

${results.memoryUsage.map(m => `- **${m.path}**: ${m.usedJSHeapSize}`).join('\n')}

## 7. Image Optimization

- **Total Images**: ${results.metrics.lazyLoading.totalImages}
- **Lazy Loaded Images**: ${results.metrics.lazyLoading.lazyImages}
- **Lazy Loading Coverage**: ${results.metrics.lazyLoading.percentage}

## 8. Performance Bottlenecks

### Long Tasks (> 50ms)
${results.metrics.longTasks.length > 0 ? 
  results.metrics.longTasks.map(t => `- Task at ${t.startTime.toFixed(2)}ms: ${t.duration.toFixed(2)}ms`).join('\n') :
  'No long tasks detected'}

## Recommendations

Based on the performance analysis:

1. **Initial Load Optimization**
   ${results.metrics.initialLoad.totalLoadTime > 3000 ? '- Consider code splitting to reduce initial bundle size' : '- Initial load time is good'}
   ${results.metrics.bundleSizes.total > 500 ? '- Bundle size is large, consider tree shaking and lazy loading' : '- Bundle size is reasonable'}

2. **Core Web Vitals**
   ${results.metrics.coreWebVitals.lcp > 2500 ? '- LCP needs improvement, optimize largest content element' : '- LCP is within acceptable range'}
   ${results.metrics.coreWebVitals.cls > 0.1 ? '- CLS needs improvement, stabilize layout shifts' : '- CLS is good'}

3. **Network Performance**
   ${results.metrics.slow3G.degradation > 300 ? '- Consider implementing progressive enhancement for slow connections' : '- Network performance degradation is acceptable'}

4. **Image Optimization**
   ${results.metrics.lazyLoading.percentage < 50 ? '- Implement lazy loading for more images' : '- Good lazy loading coverage'}

5. **Caching**
   ${results.metrics.cachedLoad.improvement < 30 ? '- Cache effectiveness could be improved' : '- Caching is working effectively'}
`;

  return report;
}

// Run the test
measurePerformance().catch(console.error);