import { lazy, Suspense } from 'react';
import { PageLoader } from '../components/SkeletonLoaders';

/**
 * Lazy Loading Utilities
 * Code splitting and dynamic imports for better performance
 */

/**
 * Lazy load a component with automatic suspense wrapper
 * @param {Function} importFunc - Dynamic import function
 * @param {Component} fallback - Loading component (default: PageLoader)
 * @returns {Component} Wrapped lazy component
 */
export const lazyLoad = (importFunc, fallback = <PageLoader />) => {
  const LazyComponent = lazy(importFunc);

  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Lazy load with retry logic (handles chunk load errors)
 * @param {Function} importFunc - Dynamic import function
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise} Component promise
 */
export const lazyWithRetry = (importFunc, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attemptImport = (retriesLeft) => {
      importFunc()
        .then(resolve)
        .catch((error) => {
          if (retriesLeft === 0) {
            reject(error);
            return;
          }
          
          console.warn(`Chunk load failed, retrying... (${retriesLeft} attempts left)`);
          
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, retries - retriesLeft) * 1000;
          setTimeout(() => attemptImport(retriesLeft - 1), delay);
        });
    };

    attemptImport(retries);
  });
};

/**
 * Preload a lazy component
 * Useful for preloading components before they're needed
 * @param {Function} importFunc - Dynamic import function
 */
export const preload = (importFunc) => {
  importFunc();
};

/**
 * Lazy load with prefetch on hover/focus
 * @param {Function} importFunc - Dynamic import function
 * @returns {Object} { Component, prefetch }
 */
export const lazyWithPrefetch = (importFunc) => {
  let componentPromise = null;

  const prefetch = () => {
    if (!componentPromise) {
      componentPromise = importFunc();
    }
    return componentPromise;
  };

  const Component = lazy(() => {
    if (componentPromise) {
      return componentPromise;
    }
    return prefetch();
  });

  return { Component, prefetch };
};

// ==============================================
// PRE-CONFIGURED LAZY LOADED COMPONENTS
// ==============================================

// Admin components (only loaded for admin users)
export const LazyAdminAnalytics = lazyLoad(() =>
  lazyWithRetry(() => import('../components/AdminAnalytics'))
);

// Heavy components with code splitting
export const LazyChatbot = lazyLoad(() =>
  lazyWithRetry(() => import('../components/Chatbot'))
);

export const LazyMarketplace = lazyLoad(() =>
  lazyWithRetry(() => import('../components/Marketplace'))
);

export const LazyCraftUpload = lazyLoad(() =>
  lazyWithRetry(() => import('../components/CraftUpload'))
);

export const LazyCraftPredictor = lazyLoad(() =>
  lazyWithRetry(() => import('../components/CraftPredictor'))
);

export const LazyCart = lazyLoad(() =>
  lazyWithRetry(() => import('../components/Cart'))
);

export const LazyOrderHistory = lazyLoad(() =>
  lazyWithRetry(() => import('../components/OrderHistory'))
);

// ==============================================
// ROUTE-BASED CODE SPLITTING
// ==============================================

/**
 * Route components with lazy loading
 */
export const routes = {
  // Feature routes
  marketplace: LazyMarketplace,
  crafts: LazyCraftUpload,
  cart: LazyCart,
  orders: LazyOrderHistory,
  chat: LazyChatbot,
};

// ==============================================
// PREFETCH STRATEGIES
// ==============================================

/**
 * Prefetch components on route hover
 * @param {Object} routeMap - Map of route paths to import functions
 */
export const prefetchOnHover = (routeMap) => {
  Object.entries(routeMap).forEach(([path, importFunc]) => {
    const links = document.querySelectorAll(`a[href="${path}"]`);
    links.forEach((link) => {
      link.addEventListener('mouseenter', () => preload(importFunc), { once: true });
      link.addEventListener('focus', () => preload(importFunc), { once: true });
    });
  });
};

/**
 * Prefetch components on idle
 * Uses requestIdleCallback to prefetch during browser idle time
 * @param {Array} importFuncs - Array of import functions
 */
export const prefetchOnIdle = (importFuncs) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFuncs.forEach((importFunc) => preload(importFunc));
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      importFuncs.forEach((importFunc) => preload(importFunc));
    }, 1000);
  }
};

/**
 * Prefetch based on user role
 * @param {string} role - User role
 */
export const prefetchByRole = (role) => {
  const prefetchMap = {
    admin: [
      () => import('../components/AdminAnalytics'),
    ],
    user: [
      () => import('../components/Marketplace'),
      () => import('../components/Cart'),
      () => import('../components/CraftUpload'),
    ],
  };

  const componentsToPreload = prefetchMap[role] || prefetchMap.user;
  prefetchOnIdle(componentsToPreload);
};

// ==============================================
// BUNDLE SIZE OPTIMIZATION HELPERS
// ==============================================

/**
 * Check if code splitting is supported
 */
export const isCodeSplittingSupported = () => {
  try {
    new Function('import("")');
    return true;
  } catch {
    return false;
  }
};

/**
 * Get chunk load error handler
 * Provides user-friendly error messages for chunk load failures
 */
export const chunkLoadErrorHandler = (error) => {
  if (error.name === 'ChunkLoadError') {
    console.error('Failed to load application chunk. Please refresh the page.');
    // You can show a toast notification here
    return true;
  }
  return false;
};

/**
 * Register service worker for caching chunks
 */
export const registerChunkCache = () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
};

export default {
  lazyLoad,
  lazyWithRetry,
  lazyWithPrefetch,
  preload,
  prefetchOnHover,
  prefetchOnIdle,
  prefetchByRole,
  routes,
  chunkLoadErrorHandler,
  isCodeSplittingSupported,
  registerChunkCache,
};
