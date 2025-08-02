import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced error suppression for better UX
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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure URL is absolute by prepending API_BASE_URL if it's relative
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // Include auth token in headers if available
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add auth token from localStorage if available
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
    
    // Include auth token in headers if available
    const headers: Record<string, string> = {};
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    
    try {
      const res = await fetch(fullUrl, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // Don't log 401 errors when we expect them (e.g., when not authenticated)
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
