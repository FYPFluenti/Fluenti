import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    // Query is always enabled since we use httpOnly cookies
    enabled: isInitialized,
  });

  const isAuthenticated = !error && !!user;

  const logout = async () => {
    try {
      // Call the logout API using apiRequest
      await apiRequest('POST', '/api/auth/logout');
      
      // Clear query cache
      queryClient.clear();
      
      // Clear session storage (but not localStorage - we don't use it anymore)
      sessionStorage.clear();
      
      // Invalidate the user query to trigger a re-fetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear cache
      queryClient.clear();
    }
  };

  return {
    user,
    isLoading: !isInitialized || isLoading,
    isAuthenticated,
    error,
    logout,
  };
}
