import toast from 'react-hot-toast';
import { getErrorMessage } from './errorHandling';

/**
 * Safe toast utility that ensures only strings are passed to react-hot-toast
 */
export const safeToast = {
  success: (message: any, options?: any) => {
    const safeMessage = typeof message === 'string' ? message : String(message);
    return toast.success(safeMessage, options);
  },

  error: (message: any, options?: any) => {
    const safeMessage = typeof message === 'string' ? message : getErrorMessage(message);
    return toast.error(safeMessage, options);
  },

  loading: (message: any, options?: any) => {
    const safeMessage = typeof message === 'string' ? message : String(message);
    return toast.loading(safeMessage, options);
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: any;
      success: any;
      error: any;
    },
    options?: any
  ) => {
    return toast.promise(
      promise,
      {
        loading: typeof msgs.loading === 'string' ? msgs.loading : String(msgs.loading),
        success: typeof msgs.success === 'string' ? msgs.success : String(msgs.success),
        error: typeof msgs.error === 'string' ? msgs.error : getErrorMessage(msgs.error),
      },
      options
    );
  },

  custom: (message: any, options?: any) => {
    return toast.custom(message, options);
  },

  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    return toast.remove(toastId);
  },
};

export default safeToast;