import React from 'react';
import { 
  Package, 
  FileText, 
  Search, 
  UserPlus, 
  Plus, 
  Upload,
  Inbox,
  Database,
  AlertCircle,
  LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant?: 'default' | 'search' | 'error' | 'no-data' | 'no-access';
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  className,
}) => {
  const icons = {
    default: Inbox,
    search: Search,
    error: AlertCircle,
    'no-data': Database,
    'no-access': AlertCircle,
  };

  const Icon = CustomIcon || icons[variant];

  const renderAction = (actionConfig: typeof action, isPrimary = true) => {
    if (!actionConfig) return null;

    const buttonClass = cn(
      'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
      isPrimary
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
    );

    if (actionConfig.href) {
      return (
        <Link to={actionConfig.href} className={buttonClass}>
          {actionConfig.label}
        </Link>
      );
    }

    return (
      <button onClick={actionConfig.onClick} className={buttonClass}>
        {actionConfig.label}
      </button>
    );
  };

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto max-w-md">
        <Icon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        )}
        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {renderAction(action, true)}
            {renderAction(secondaryAction, false)}
          </div>
        )}
      </div>
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const ProductEmptyState: React.FC<{ onCreateClick?: () => void }> = ({ 
  onCreateClick 
}) => (
  <EmptyState
    icon={Package}
    title="No products yet"
    description="Get started by creating your first product to begin tracking and validating."
    action={{
      label: "Create Product",
      onClick: onCreateClick,
      href: !onCreateClick ? "/dashboard/products/new" : undefined,
    }}
  />
);

export const SearchEmptyState: React.FC<{ searchTerm?: string }> = ({ 
  searchTerm 
}) => (
  <EmptyState
    variant="search"
    title="No results found"
    description={
      searchTerm
        ? `We couldn't find any results for "${searchTerm}". Try adjusting your search.`
        : "Try adjusting your search criteria or filters."
    }
  />
);

export const ReportEmptyState: React.FC = () => (
  <EmptyState
    icon={FileText}
    title="No reports available"
    description="Reports will appear here once products have been validated."
  />
);

export const ValidationEmptyState: React.FC = () => (
  <EmptyState
    icon={FileText}
    title="No validations yet"
    description="Validations will appear here once products have been scanned."
  />
);

export const ErrorEmptyState: React.FC<{ 
  onRetry?: () => void;
  message?: string;
}> = ({ 
  onRetry,
  message 
}) => (
  <EmptyState
    variant="error"
    title="Something went wrong"
    description={message || "We encountered an error loading this content. Please try again."}
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry,
    } : undefined}
  />
);

export const NoAccessEmptyState: React.FC = () => (
  <EmptyState
    variant="no-access"
    title="Access restricted"
    description="You don't have permission to view this content. Contact your administrator for access."
    action={{
      label: "Go to Dashboard",
      href: "/dashboard",
    }}
  />
);

// List empty state with icon grid
interface ListEmptyStateProps {
  title: string;
  description?: string;
  items?: Array<{
    icon: LucideIcon;
    label: string;
    description: string;
  }>;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  title,
  description,
  items,
  action,
}) => {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      )}
      
      {items && items.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
          {items.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <div key={index} className="text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <ItemIcon className="h-full w-full" />
                </div>
                <h4 className="mt-2 text-sm font-medium text-gray-900">
                  {item.label}
                </h4>
                <p className="mt-1 text-xs text-gray-500">{item.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {action && (
        <div className="mt-8">
          {action.href ? (
            <Link
              to={action.href}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};