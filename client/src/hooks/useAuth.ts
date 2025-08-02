import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [authToken, setAuthToken] = useState<string | null>(() => {
    // Initialize with current localStorage value
    return typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Monitor auth token changes
  useEffect(() => {
    setIsInitialized(true);
    const token = localStorage.getItem('authToken');
    setAuthToken(token);
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        setAuthToken(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    // Only query if we have an auth token and we're initialized
    enabled: !!authToken && isInitialized,
  });

  const isAuthenticated = !error && !!user && !!authToken;

  const logout = async () => {
    try {
      // Call the logout API using apiRequest
      await apiRequest('GET', '/api/logout');
      
      // Clear the auth token first
      localStorage.removeItem('authToken');
      setAuthToken(null);
      
      // Clear query cache
      queryClient.clear();
      
      // Clear other storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Invalidate the user query to trigger a re-fetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local storage
      localStorage.removeItem('authToken');
      setAuthToken(null);
      queryClient.clear();
    }
  };

  return {
    user,
    isLoading: !isInitialized || (isLoading && !!authToken),
    isAuthenticated,
    error,
    logout,
  };
}
