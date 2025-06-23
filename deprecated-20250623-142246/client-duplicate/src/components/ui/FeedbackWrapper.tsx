import React from 'react';
import { LoadingState } from './LoadingState';
import { ErrorEmptyState, EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

interface FeedbackWrapperProps {
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  loadingVariant?: 'card' | 'list' | 'table' | 'form' | 'page' | 'inline';
  loadingCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * FeedbackWrapper provides a consistent way to handle loading, error, and empty states
 * Usage:
 * <FeedbackWrapper loading={isLoading} error={error} empty={!data.length}>
 *   {data.map(item => <ItemComponent key={item.id} {...item} />)}
 * </FeedbackWrapper>
 */
export const FeedbackWrapper: React.FC<FeedbackWrapperProps> = ({
  loading,
  error,
  empty,
  loadingVariant = 'card',
  loadingCount = 3,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  onRetry,
  children,
  className,
}) => {
  // Show loading state
  if (loading) {
    return (
      <div className={className}>
        <LoadingState variant={loadingVariant} count={loadingCount} />
      </div>
    );
  }

  // Show error state
  if (error) {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error.message || 'An error occurred';
    
    return (
      <div className={className}>
        <ErrorEmptyState message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }

  // Show empty state
  if (empty) {
    return (
      <div className={className}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  // Show content
  return <div className={className}>{children}</div>;
};

// Specialized feedback wrappers for common use cases
export const ListFeedbackWrapper: React.FC<
  Omit<FeedbackWrapperProps, 'loadingVariant'>
> = (props) => (
  <FeedbackWrapper {...props} loadingVariant="list" />
);

export const TableFeedbackWrapper: React.FC<
  Omit<FeedbackWrapperProps, 'loadingVariant'>
> = (props) => (
  <FeedbackWrapper {...props} loadingVariant="table" />
);

export const CardGridFeedbackWrapper: React.FC<
  Omit<FeedbackWrapperProps, 'loadingVariant'>
> = (props) => (
  <FeedbackWrapper 
    {...props} 
    loadingVariant="card"
    className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', props.className)}
  />
);

// Hook for managing feedback states
export const useFeedbackState = <T = any>() => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const setSuccess = (newData: T) => {
    setData(newData);
    setLoading(false);
    setError(null);
  };

  const setErrorState = (error: Error | string) => {
    setError(typeof error === 'string' ? new Error(error) : error);
    setLoading(false);
  };

  return {
    loading,
    error,
    data,
    reset,
    startLoading,
    setSuccess,
    setError: setErrorState,
    // Computed properties for convenience
    empty: !loading && !error && (!data || (Array.isArray(data) && data.length === 0)),
    hasData: !loading && !error && data && (!Array.isArray(data) || data.length > 0),
  };
};