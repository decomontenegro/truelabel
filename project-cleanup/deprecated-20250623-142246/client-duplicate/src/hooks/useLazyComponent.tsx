import React, { useEffect, useState, useRef, ComponentType } from 'react';

interface LazyComponentOptions {
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
  preload?: boolean;
}

/**
 * Hook para lazy loading de componentes pesados usando Intersection Observer
 * Útil para componentes como gráficos, mapas, editores, etc.
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    fallback = null,
    preload = false
  } = options;

  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Se preload está ativado, carregar imediatamente
    if (preload) {
      loadComponent();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoadedRef.current) {
            loadComponent();
            
            // Desconectar observer após carregar
            if (observerRef.current) {
              observer.unobserve(observerRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Observar o elemento
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [preload, threshold, rootMargin]);

  const loadComponent = async () => {
    if (hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load component:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    Component,
    isLoading,
    error,
    observerRef,
    fallback,
    reload: () => {
      hasLoadedRef.current = false;
      loadComponent();
    }
  };
}

/**
 * Componente wrapper para lazy loading
 */
export function LazyComponentWrapper<P extends object>({
  importFn,
  fallback,
  errorFallback,
  ...props
}: {
  importFn: () => Promise<{ default: ComponentType<P> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
} & P) {
  const { Component, isLoading, error, observerRef } = useLazyComponent(importFn, {
    fallback
  });

  // Elemento para observar
  if (!Component) {
    return (
      <div ref={observerRef}>
        {isLoading ? (fallback || <div>Loading...</div>) : null}
      </div>
    );
  }

  // Erro ao carregar
  if (error) {
    return <>{errorFallback || <div>Error loading component</div>}</>;
  }

  // Componente carregado
  return <Component {...(props as P)} />;
}

/**
 * Função helper para pré-carregar componentes
 */
export function preloadComponent(importFn: () => Promise<any>) {
  // Iniciar o carregamento mas não aguardar
  importFn().catch(err => {
    console.warn('Failed to preload component:', err);
  });
}

/**
 * Hook para pré-carregar múltiplos componentes
 */
export function usePreloadComponents(
  components: Array<() => Promise<any>>,
  delay = 2000
) {
  useEffect(() => {
    const timer = setTimeout(() => {
      components.forEach(preloadComponent);
    }, delay);

    return () => clearTimeout(timer);
  }, [components, delay]);
}