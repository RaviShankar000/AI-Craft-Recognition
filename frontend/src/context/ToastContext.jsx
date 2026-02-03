import { createContext, useContext } from 'react';
import toast, { Toaster, Toast } from 'react-hot-toast';

const ToastContext = createContext(null);

/**
 * ToastProvider - Global toast notification system
 * Provides consistent toast notifications throughout the app
 */
export const ToastProvider = ({ children }) => {
  // Success toast
  const success = (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
      ...options,
    });
  };

  // Error toast
  const error = (message, options = {}) => {
    return toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
      ...options,
    });
  };

  // Info toast
  const info = (message, options = {}) => {
    return toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      ...options,
    });
  };

  // Warning toast
  const warning = (message, options = {}) => {
    return toast(message, {
      duration: 3500,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      ...options,
    });
  };

  // Loading toast (promise-based)
  const loading = (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6b7280',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      ...options,
    });
  };

  // Promise toast - shows loading, then success/error
  const promise = (promiseFunc, messages, options = {}) => {
    return toast.promise(
      promiseFunc,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        position: 'top-right',
        style: {
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          style: {
            background: '#10b981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        error: {
          style: {
            background: '#ef4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        ...options,
      }
    );
  };

  // Custom toast with full control
  const custom = (content, options = {}) => {
    return toast.custom(content, {
      position: 'top-right',
      ...options,
    });
  };

  // Dismiss a specific toast
  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  // Dismiss all toasts
  const dismissAll = () => {
    toast.dismiss();
  };

  // API helper - show toast based on API response
  const handleApiResponse = (response, successMessage, errorMessage) => {
    if (response.success) {
      success(successMessage || response.message || 'Operation successful');
      return true;
    } else {
      error(errorMessage || response.error || 'Operation failed');
      return false;
    }
  };

  // API helper - catch errors and show toast
  const handleApiError = (err, customMessage) => {
    const message = 
      customMessage || 
      err.response?.data?.error || 
      err.message || 
      'An error occurred';
    error(message);
  };

  const value = {
    success,
    error,
    info,
    warning,
    loading,
    promise,
    custom,
    dismiss,
    dismissAll,
    handleApiResponse,
    handleApiError,
  };

  return (
    <ToastContext.Provider value={value}>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default options for all toasts
          duration: 3000,
          style: {
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      {children}
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook - Access toast notifications
 * @returns {Object} Toast context value
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Export raw toast for advanced usage
export { toast };

export default ToastContext;
