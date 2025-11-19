import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn } from "@/lib/queryClient";
import { OnboardingData } from "@/types/auth";

interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
  hasStarted: boolean;
}

export function useOnboardingStatus() {
  const { isAuthenticated, user } = useAuth();
  
  const { data, isLoading, error } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!isAuthenticated && !!user,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const needsOnboarding = data ? !data.isCompleted : true; // New users need onboarding
  
  console.log('useOnboardingStatus:', { data, needsOnboarding, isLoading, error });

  return {
    onboardingStatus: data || { isCompleted: false, currentStep: 1, hasStarted: false },
    isLoading,
    error,
    needsOnboarding,
  };
}

export function useOnboardingData() {
  const { isAuthenticated, user } = useAuth();
  
  const { data, isLoading, error } = useQuery<OnboardingData | null>({
    queryKey: ["/api/onboarding"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!isAuthenticated && !!user,
    retry: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    onboardingData: data,
    isLoading,
    error,
  };
}