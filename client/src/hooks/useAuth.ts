import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !error && !!user;
  
  // Debug logging
  console.log('useAuth state:', { user, isLoading, error, isAuthenticated });

  const logout = async () => {
    try {
      // Call the logout API using apiRequest
      await apiRequest('GET', '/api/logout');
      
      // Clear query cache
      queryClient.clear();
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Invalidate the user query to trigger a re-fetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    logout,
  };
}
