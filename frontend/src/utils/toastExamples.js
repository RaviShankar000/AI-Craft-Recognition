/**
 * Toast Utilities
 * Common toast patterns and helpers for API calls
 */

/**
 * Example usage patterns for toast notifications
 */

// ========================================
// BASIC USAGE
// ========================================

/*
import { useToast } from '../context/ToastContext';

const MyComponent = () => {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong!');
  };

  const handleInfo = () => {
    toast.info('This is an informational message');
  };

  const handleWarning = () => {
    toast.warning('Please be careful!');
  };
};
*/

// ========================================
// API CALL WITH TOAST
// ========================================

/*
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';

const MyComponent = () => {
  const toast = useToast();
  const { setLoading } = useLoading();

  const fetchData = async () => {
    setLoading('data', true);
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      
      if (data.success) {
        toast.success('Data loaded successfully');
      } else {
        toast.error(data.error || 'Failed to load data');
      }
    } catch (error) {
      toast.handleApiError(error, 'Failed to fetch data');
    } finally {
      setLoading('data', false);
    }
  };
};
*/

// ========================================
// PROMISE-BASED TOAST
// ========================================

/*
import { useToast } from '../context/ToastContext';

const MyComponent = () => {
  const toast = useToast();

  const saveData = async () => {
    const savePromise = fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(res => res.json());

    toast.promise(savePromise, {
      loading: 'Saving...',
      success: 'Saved successfully!',
      error: 'Failed to save'
    });
  };
};
*/

// ========================================
// FORM SUBMISSION WITH TOAST
// ========================================

/*
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';

const MyForm = () => {
  const toast = useToast();
  const { setLoading, isLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading('form', true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Form submitted successfully');
        // Reset form or redirect
      } else {
        toast.error(data.error || 'Submission failed');
      }
    } catch (error) {
      toast.handleApiError(error);
    } finally {
      setLoading('form', false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isLoading('form')}>
        {isLoading('form') ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
*/

// ========================================
// DELETE WITH CONFIRMATION
// ========================================

/*
import { useToast } from '../context/ToastContext';

const MyComponent = () => {
  const toast = useToast();

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delete/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Deleted successfully');
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.handleApiError(error);
    }
  };
};
*/

// ========================================
// LOADING TOAST
// ========================================

/*
import { useToast } from '../context/ToastContext';

const MyComponent = () => {
  const toast = useToast();

  const longOperation = async () => {
    const loadingToast = toast.loading('Processing...');
    
    try {
      await performLongOperation();
      toast.dismiss(loadingToast);
      toast.success('Operation completed!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Operation failed');
    }
  };
};
*/

// ========================================
// CUSTOM DURATION AND POSITION
// ========================================

/*
import { useToast } from '../context/ToastContext';

const MyComponent = () => {
  const toast = useToast();

  const showCustomToast = () => {
    toast.success('This will stay longer', {
      duration: 10000, // 10 seconds
      position: 'bottom-center'
    });
  };
};
*/

// ========================================
// FILE UPLOAD WITH PROGRESS
// ========================================

/*
import { useToast } from '../context/ToastContext';

const FileUpload = () => {
  const toast = useToast();

  const handleUpload = async (file) => {
    const uploadPromise = new Promise(async (resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        
        if (data.success) {
          resolve(data);
        } else {
          reject(new Error(data.error));
        }
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(uploadPromise, {
      loading: `Uploading ${file.name}...`,
      success: `${file.name} uploaded successfully!`,
      error: `Failed to upload ${file.name}`
    });
  };
};
*/

// ========================================
// AUTHENTICATION WITH TOAST
// ========================================

/*
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const toast = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate('/dashboard');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.handleApiError(error, 'Login failed');
    }
  };
};
*/

export const toastExamples = {
  // This file contains examples only
  // Import useToast from '../context/ToastContext' to use toast notifications
};
