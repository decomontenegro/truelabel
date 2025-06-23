import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  width, 
  height 
}) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700 rounded",
        className
      )}
      style={{ width, height }}
    />
  );
};

interface LoadingStateProps {
  variant?: 'card' | 'list' | 'table' | 'form' | 'page' | 'inline';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  variant = 'card', 
  count = 1,
  className 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <Skeleton className="h-8 w-full" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border-b flex items-center space-x-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        );

      case 'page':
        return (
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>{renderCardSkeleton()}</div>
              ))}
            </div>
          </div>
        );

      case 'inline':
        return <Skeleton className="h-4 w-24 inline-block" />;

      default:
        return null;
    }
  };

  const renderCardSkeleton = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  };

  if (count > 1 && variant !== 'page' && variant !== 'inline') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  return <div className={className}>{renderSkeleton()}</div>;
};

// Specific skeleton components for common use cases
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-full" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-6 w-16 rounded-full" />
    </td>
    <td className="px-6 py-4">
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </td>
  </tr>
);