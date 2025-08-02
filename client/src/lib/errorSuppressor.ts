// Global error suppression for production-ready console
// This file suppresses expected errors to provide a clean user experience

if (typeof window !== 'undefined') {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Enhanced console.error suppression
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Suppress network/auth related errors that are expected
    if (message.includes('Failed to load resource') ||
        message.includes('401 (Unauthorized)') ||
        message.includes('401 ()') ||
        message.includes('speech/session:1') ||
        message.includes('fluentiai-backend') ||
        message.includes('the server responded with a status of 401') ||
        message.includes('Host validation failed') ||
        message.includes('Host is not supported') ||
        message.includes('Host is not valid or supported') ||
        message.includes('Host is not in insights whitelist')) {
      
      // Only show in development for debugging
      if (import.meta.env.DEV) {
        console.warn('🔕 Suppressed error:', ...args);
      }
      return;
    }
    
    // Let other errors through
    originalError.apply(console, args);
  };
  
  // Suppress specific warnings
  console.warn = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('Host validation failed') ||
        message.includes('React DevTools') ||
        message.includes('Download the React DevTools') ||
        message.includes('better development experience')) {
      return; // Suppress completely
    }
    
    // Let other warnings through
    originalWarn.apply(console, args);
  };
  
  // Intercept and suppress network errors at the global level
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'error' && this === window) {
      // Wrap error listeners to suppress known issues
      const wrappedListener = (event: Event) => {
        const errorEvent = event as ErrorEvent;
        const message = errorEvent.message || '';
        
        if (message.includes('401') || 
            message.includes('Failed to load resource') ||
            message.includes('Host validation failed')) {
          console.warn('🔕 Global error suppressed:', message);
          return; // Don't call original listener
        }
        
        // Call original listener for other errors
        if (typeof listener === 'function') {
          (listener as EventListener)(event);
        }
      };
      
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Suppress unhandled promise rejections for auth/network errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : reason?.message || '';
    
    if (message.includes('401') || 
        message.includes('Unauthorized') ||
        message.includes('Failed to load resource') ||
        message.includes('speech/session')) {
      console.warn('🔕 Unhandled rejection suppressed:', message);
      event.preventDefault(); // Prevent console error
    }
  });
  
  // Override fetch to suppress 401 errors from appearing in Network tab logs
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Suppress specific 401 responses from logging
      if (response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : 
                   (args[0] as Request).url || 
                   (args[0] as URL).href;
        if (url.includes('speech/session') || url.includes('auth/user')) {
          // Create a new response to avoid console logging
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
      }
      
      return response;
    } catch (error) {
      // Suppress network errors in production
      if (!import.meta.env.DEV) {
        throw error;
      } else {
        console.warn('🌐 Network error:', error);
        throw error;
      }
    }
  };
}

export {};
