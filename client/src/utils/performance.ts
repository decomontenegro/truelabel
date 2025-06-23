// Performance optimization utilities

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.classList.add('fade-in');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memoize expensive computations
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T) => {
  const cache = new Map();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
};

/**
 * Virtual scrolling for large lists
 */
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private items: any[];
  private scrollTop = 0;
  private visibleStart = 0;
  private visibleEnd = 0;
  
  constructor(
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    renderItem: (item: any, index: number) => HTMLElement
  ) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    
    this.init(renderItem);
  }
  
  private init(renderItem: (item: any, index: number) => HTMLElement) {
    const scrollHandler = throttle(() => {
      this.scrollTop = this.container.scrollTop;
      this.updateVisibleItems(renderItem);
    }, 16); // ~60fps
    
    this.container.addEventListener('scroll', scrollHandler);
    this.updateVisibleItems(renderItem);
  }
  
  private updateVisibleItems(renderItem: (item: any, index: number) => HTMLElement) {
    const containerHeight = this.container.clientHeight;
    this.visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    this.visibleEnd = Math.ceil((this.scrollTop + containerHeight) / this.itemHeight);
    
    // Clear container
    this.container.innerHTML = '';
    
    // Add spacer for items above
    const spacerTop = document.createElement('div');
    spacerTop.style.height = `${this.visibleStart * this.itemHeight}px`;
    this.container.appendChild(spacerTop);
    
    // Render visible items
    for (let i = this.visibleStart; i < Math.min(this.visibleEnd, this.items.length); i++) {
      this.container.appendChild(renderItem(this.items[i], i));
    }
    
    // Add spacer for items below
    const spacerBottom = document.createElement('div');
    const remainingItems = Math.max(0, this.items.length - this.visibleEnd);
    spacerBottom.style.height = `${remainingItems * this.itemHeight}px`;
    this.container.appendChild(spacerBottom);
  }
}

/**
 * Preload critical resources
 */
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/fonts/inter-var.woff2',
    '/api/v1/auth/verify',
    '/api/v1/products?limit=10',
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.endsWith('.woff2')) {
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    } else if (resource.includes('/api/')) {
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
};

/**
 * Web Worker for heavy computations
 */
export const createWorker = (workerFunction: Function) => {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript'
  });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  
  return {
    worker,
    terminate: () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    }
  };
};

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = 
  window.requestIdleCallback ||
  function (cb: IdleRequestCallback) {
    const start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      } as IdleDeadline);
    }, 1);
  };

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      console.warn(`Start mark '${startMark}' not found`);
      return;
    }
    
    const duration = (end || performance.now()) - start;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        event_category: 'Performance',
      });
    }
    
    return duration;
  }
  
  logNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;
    
    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;
    
    const metrics = {
      'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
      'TCP Connection': timing.connectEnd - timing.connectStart,
      'Request Time': timing.responseStart - timing.requestStart,
      'Response Time': timing.responseEnd - timing.responseStart,
      'DOM Processing': timing.domComplete - timing.domLoading,
      'Page Load': timing.loadEventEnd - navigationStart,
    };
    
    console.table(metrics);
  }
}

/**
 * Optimize images on the fly
 */
export const optimizeImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}) => {
  // If using a CDN that supports image optimization
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('fm', options.format);
  
  return `${url}?${params.toString()}`;
};

/**
 * Service Worker registration
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registered:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, show update notification
              console.log('New content available, please refresh.');
            }
          });
        }
      });
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
};