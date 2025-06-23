import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Componente de imagem com lazy loading usando Intersection Observer
 * Melhora a performance carregando imagens apenas quando visíveis
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E',
  className,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Pré-carregar a imagem
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
              onLoad?.();
            };
            
            img.onerror = () => {
              setIsError(true);
              onError?.();
            };
            
            // Desconectar observer após carregar
            if (imgRef.current) {
              observer.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Observar a imagem
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    // Cleanup
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, threshold, rootMargin, onLoad, onError]);

  if (isError) {
    return (
      <div 
        className={clsx(
          'flex items-center justify-center bg-gray-200 text-gray-400',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={clsx(
        'transition-opacity duration-300',
        {
          'opacity-0': !isLoaded && imageSrc === src,
          'opacity-100': isLoaded || imageSrc === placeholder,
        },
        className
      )}
      loading="lazy"
      {...props}
    />
  );
};

// Componente para background images com lazy loading
export const LazyBackgroundImage: React.FC<{
  src: string;
  className?: string;
  children?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}> = ({ src, className, children, threshold = 0.1, rootMargin = '50px' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Pré-carregar a imagem
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setIsLoaded(true);
            };
            
            // Desconectar observer
            if (divRef.current) {
              observer.unobserve(divRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    return () => {
      if (divRef.current) {
        observer.unobserve(divRef.current);
      }
    };
  }, [src, threshold, rootMargin]);

  return (
    <div
      ref={divRef}
      className={className}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : undefined,
      }}
    >
      {children}
    </div>
  );
};