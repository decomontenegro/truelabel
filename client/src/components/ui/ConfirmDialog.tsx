import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmButtonVariant?: 'danger' | 'primary' | 'secondary';
  showIcon?: boolean;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  confirmButtonVariant,
  showIcon = true,
  loading = false,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="h-6 w-6 text-red-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    info: <Info className="h-6 w-6 text-blue-600" />,
  };

  const iconBackgrounds = {
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100',
  };

  const buttonVariants = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
  };

  const actualConfirmButtonVariant = confirmButtonVariant || (variant === 'danger' ? 'danger' : 'primary');

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {showIcon && (
                <div
                  className={cn(
                    'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
                    iconBackgrounds[variant]
                  )}
                >
                  {icons[variant]}
                </div>
              )}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || isConfirming}
              className={cn(
                'inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm',
                buttonVariants[actualConfirmButtonVariant],
                (loading || isConfirming) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading || isConfirming ? 'Processing...' : confirmText}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || isConfirming}
              className={cn(
                'mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm',
                (loading || isConfirming) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook for easy confirmation dialogs
interface UseConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmButtonVariant?: 'danger' | 'primary' | 'secondary';
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions>({});
  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((confirmOptions?: UseConfirmOptions): Promise<boolean> => {
    setOptions(confirmOptions || {});
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolver?.resolve(true);
    setResolver(null);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolver?.resolve(false);
    setResolver(null);
  }, [resolver]);

  const ConfirmDialogComponent = useCallback(() => {
    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title || 'Confirm Action'}
        message={options.message || 'Are you sure you want to proceed?'}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        confirmButtonVariant={options.confirmButtonVariant}
      />
    );
  }, [isOpen, options, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
};

// Preset confirmation dialogs
export const DeleteConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, loading }) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Item"
      message={
        itemName
          ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
          : 'Are you sure you want to delete this item? This action cannot be undone.'
      }
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      confirmButtonVariant="danger"
      loading={loading}
    />
  );
};

export const DiscardChangesDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Discard Changes"
      message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      confirmText="Discard"
      cancelText="Keep Editing"
      variant="warning"
      confirmButtonVariant="danger"
    />
  );
};

// Inline confirmation for small actions
interface InlineConfirmProps {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const InlineConfirm: React.FC<InlineConfirmProps> = ({
  onConfirm,
  children,
  message = 'Are you sure?',
  className,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      setShowConfirm(false);
    } catch (error) {
      console.error('Inline confirm error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (showConfirm) {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <span className="text-sm text-gray-600">{message}</span>
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {isConfirming ? 'Processing...' : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isConfirming}
          className="text-sm font-medium text-gray-600 hover:text-gray-700 disabled:opacity-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div onClick={() => setShowConfirm(true)} className={className}>
      {children}
    </div>
  );
};