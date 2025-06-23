// Lighthouse Performance Test for True Label
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { URL } from 'url';
import { promises as fs } from 'fs';

async function runLighthouse() {
  console.log('Starting Lighthouse Performance Analysis...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test different pages
    const pages = [
      { url: 'http://localhost:3001', name: 'Homepage' },
      { url: 'http://localhost:3001/products', name: 'Products Page' },
      { url: 'http://localhost:3001/validations', name: 'Validations Page' },
      { url: 'http://localhost:3001/analytics', name: 'Analytics Page' }
    ];

    const results = [];

    for (const pageTest of pages) {
      console.log(`Testing ${pageTest.name}...`);
      
      // Run Lighthouse
      const { lhr } = await lighthouse(pageTest.url, {
        port: new URL(browser.wsEndpoint()).port,
        output: 'json',
        logLevel: 'error',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      });

      const metrics = {
        page: pageTest.name,
        url: pageTest.url,
        scores: {
          performance: lhr.categories.performance.score * 100,
          accessibility: lhr.categories.accessibility.score * 100,
          bestPractices: lhr.categories['best-practices'].score * 100,
          seo: lhr.categories.seo.score * 100
        },
        metrics: {
          firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
          totalBlockingTime: lhr.audits['total-blocking-time'].numericValue,
          cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
          speedIndex: lhr.audits['speed-index'].numericValue,
          timeToInteractive: lhr.audits['interactive'].numericValue
        },
        opportunities: []
      };

      // Get performance opportunities
      const opportunityAudits = Object.values(lhr.audits)
        .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.numericValue > 0)
        .sort((a, b) => b.numericValue - a.numericValue)
        .slice(0, 5);

      for (const audit of opportunityAudits) {
        metrics.opportunities.push({
          title: audit.title,
          savings: audit.displayValue || `${(audit.numericValue / 1000).toFixed(2)}s`
        });
      }

      results.push(metrics);
    }

    // Generate comprehensive report
    const report = generateDetailedReport(results);
    await fs.writeFile('lighthouse-performance-report.md', report);
    console.log('\nLighthouse report saved to lighthouse-performance-report.md');

  } catch (error) {
    console.error('Error running Lighthouse:', error);
  } finally {
    await browser.close();
  }
}

function generateDetailedReport(results) {
  const timestamp = new Date().toISOString();
  
  let report = `# True Label - Lighthouse Performance Analysis

Generated: ${timestamp}

## Executive Summary

`;

  // Calculate average scores
  const avgScores = {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0
  };

  results.forEach(r => {
    Object.keys(avgScores).forEach(key => {
      avgScores[key] += r.scores[key];
    });
  });

  Object.keys(avgScores).forEach(key => {
    avgScores[key] = (avgScores[key] / results.length).toFixed(1);
  });

  report += `### Average Scores Across All Pages
- **Performance**: ${avgScores.performance}/100
- **Accessibility**: ${avgScores.accessibility}/100
- **Best Practices**: ${avgScores.bestPractices}/100
- **SEO**: ${avgScores.seo}/100

## Detailed Results by Page

`;

  results.forEach(result => {
    report += `### ${result.page}
**URL**: ${result.url}

#### Scores
- Performance: ${result.scores.performance.toFixed(1)}/100
- Accessibility: ${result.scores.accessibility.toFixed(1)}/100
- Best Practices: ${result.scores.bestPractices.toFixed(1)}/100
- SEO: ${result.scores.seo.toFixed(1)}/100

#### Core Web Vitals
- **FCP (First Contentful Paint)**: ${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s
- **LCP (Largest Contentful Paint)**: ${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s
- **TBT (Total Blocking Time)**: ${result.metrics.totalBlockingTime.toFixed(0)}ms
- **CLS (Cumulative Layout Shift)**: ${result.metrics.cumulativeLayoutShift.toFixed(3)}

#### Other Metrics
- **Speed Index**: ${(result.metrics.speedIndex / 1000).toFixed(2)}s
- **Time to Interactive**: ${(result.metrics.timeToInteractive / 1000).toFixed(2)}s

`;

    if (result.opportunities.length > 0) {
      report += `#### Top Optimization Opportunities
`;
      result.opportunities.forEach(opp => {
        report += `- **${opp.title}**: Potential savings of ${opp.savings}\n`;
      });
    }

    report += '\n---\n\n';
  });

  report += `## Performance Optimization Recommendations

Based on the Lighthouse analysis, here are the key recommendations:

### 1. Bundle Size Optimization
`;

  const avgPerformance = parseFloat(avgScores.performance);
  if (avgPerformance < 90) {
    report += `- The average performance score of ${avgPerformance} indicates room for improvement
- Consider implementing code splitting for routes
- Use dynamic imports for heavy components
- Analyze bundle with webpack-bundle-analyzer
`;
  } else {
    report += `- Excellent performance score of ${avgPerformance}
- Continue monitoring bundle sizes as the app grows
`;
  }

  report += `
### 2. Core Web Vitals Improvements

`;

  // Check LCP across pages
  const avgLCP = results.reduce((sum, r) => sum + r.metrics.largestContentfulPaint, 0) / results.length;
  if (avgLCP > 2500) {
    report += `- **LCP needs improvement** (avg: ${(avgLCP / 1000).toFixed(2)}s, target: <2.5s)
  - Optimize server response times
  - Use efficient cache policy
  - Optimize images and use next-gen formats
`;
  }

  // Check CLS
  const avgCLS = results.reduce((sum, r) => sum + r.metrics.cumulativeLayoutShift, 0) / results.length;
  if (avgCLS > 0.1) {
    report += `- **CLS needs attention** (avg: ${avgCLS.toFixed(3)}, target: <0.1)
  - Add size attributes to images and videos
  - Ensure fonts load without layout shift
  - Avoid inserting content above existing content
`;
  }

  report += `
### 3. Accessibility Improvements
`;

  if (avgScores.accessibility < 100) {
    report += `- Accessibility score: ${avgScores.accessibility}/100
- Run detailed accessibility audit
- Ensure proper ARIA labels
- Check color contrast ratios
- Verify keyboard navigation
`;
  } else {
    report += `- Perfect accessibility score! Keep maintaining these standards.
`;
  }

  report += `
### 4. SEO Optimization
`;

  if (avgScores.seo < 100) {
    report += `- SEO score: ${avgScores.seo}/100
- Ensure all pages have meta descriptions
- Add structured data where appropriate
- Verify robots.txt and sitemap
`;
  }

  report += `
### 5. Performance Budget Recommendations

Based on the analysis, here are recommended performance budgets:

- **JavaScript Bundle**: < 500KB (gzipped)
- **CSS Bundle**: < 100KB (gzipped)
- **Total Page Weight**: < 2MB
- **Time to Interactive**: < 3.8s
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s

### 6. Monitoring and Continuous Improvement

1. Set up automated Lighthouse CI in your deployment pipeline
2. Monitor Real User Metrics (RUM) using tools like Google Analytics
3. Implement performance budgets in your build process
4. Regular performance audits (weekly/monthly)
5. A/B test performance improvements

## Conclusion

The True Label application shows ${avgPerformance >= 80 ? 'good' : avgPerformance >= 50 ? 'moderate' : 'poor'} overall performance with an average score of ${avgScores.performance}/100. 
Focus on the recommendations above to improve user experience and meet Core Web Vitals thresholds.
`;

  return report;
}

// Run the test
runLighthouse().catch(console.error);