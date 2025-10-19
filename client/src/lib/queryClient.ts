import { QueryClient, QueryFunction } from "@tanstack/react-query";

const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  // Suppress common expected errors to reduce console noise
  if (message.includes('401') || 
      message.includes('Unauthorized') || 
      message.includes('Failed to load resource') ||
      (message.includes('speech/session') && message.includes('401'))) {
    // Still log in development for debugging
    if (!import.meta.env.PROD) {
      console.warn('🔒 Auth error (expected):', ...args);
    }
    return; // Suppress in production
  }
  
  // Let other errors through
  originalConsoleError.apply(console, args);
};

// Configure API base URL based on environment
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://fluentiai-backend.onrender.com' 
  : 'http://localhost:3000';

// WebSocket configuration - moved to a function to get token when needed
const getWebSocketUrl = () => {
  const WS_PORT = import.meta.env.VITE_WS_PORT || '3000';
  const token = localStorage.getItem('authToken') || 'anonymous';
  return `ws://localhost:${WS_PORT}/?token=${token}`;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error = new Error(`${res.status}: ${text}`);
    
    // Don't log 401 errors to reduce console noise - they are expected when not authenticated
    if (res.status !== 401) {
      console.error('API Error:', error.message);
    }
    
    throw error;
  }
}


type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    // Ensure URL is absolute by prepending API_BASE_URL if it's relative
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // No need to add Authorization header - cookies are sent automatically
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    try {
      const res = await fetch(fullUrl, {
        headers,
        credentials: "include", // Important: include cookies in request
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // Don't log 401 errors when we expect them (e.g., when not authenticated)
        // Try to refresh token automatically
        if (res.status === 401) {
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
            });
            
            if (refreshRes.ok) {
              // Token refreshed, retry original request
              const retryRes = await fetch(fullUrl, {
                headers,
                credentials: "include",
              });
              
              if (retryRes.ok) {
                return await retryRes.json();
              }
            }
          } catch (refreshError) {
            // Refresh failed, return null
            console.log('Token refresh failed, user needs to log in');
          }
        }
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Only re-throw if it's not a 401 that we're handling gracefully
      if (unauthorizedBehavior === "returnNull" && error instanceof Error && error.message.includes('401')) {
        return null;
      }
      throw error;
    }
  };

// API request function for direct HTTP calls
export const apiRequest = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any): Promise<Response> => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: include cookies
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // Don't throw on HTTP errors - let the caller handle response status
    // This allows us to read error messages from the response body
    return response;
  } catch (error) {
    // Network errors or fetch failures
    throw new Error('Network error: Unable to connect to server');
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
