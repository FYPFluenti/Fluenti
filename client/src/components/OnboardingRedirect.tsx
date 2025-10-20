import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboarding';
import { User } from '@/types/auth';

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that checks if the user needs to complete onboarding
 * and redirects them appropriately
 */
export default function OnboardingRedirect({ children }: OnboardingRedirectProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { needsOnboarding, isLoading: onboardingLoading } = useOnboardingStatus();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect if still loading or not authenticated
    if (authLoading || onboardingLoading || !isAuthenticated) {
      console.log('OnboardingRedirect: Waiting for auth/onboarding data', { authLoading, onboardingLoading, isAuthenticated });
      return;
    }

    // Skip onboarding check for certain routes
    const skipOnboardingRoutes = ['/login', '/signup', '/onboarding', '/logout'];
    if (skipOnboardingRoutes.includes(location)) {
      console.log('OnboardingRedirect: Skipping onboarding check for route:', location);
      return;
    }

    // Check if user is guardian/adult with children (needs onboarding)
    const typedUser = user as User;
    const userTypeRequiresOnboarding = typedUser?.userType === 'guardian' || 
      (typedUser?.userType === 'adult');

    console.log('OnboardingRedirect: User data:', { 
      userType: typedUser?.userType, 
      needsOnboarding, 
      userTypeRequiresOnboarding, 
      location 
    });

    // Redirect to onboarding if needed
    if (userTypeRequiresOnboarding && needsOnboarding) {
      console.log('OnboardingRedirect: Redirecting to onboarding - user needs to complete setup');
      setLocation('/onboarding');
    }
  }, [
    isAuthenticated, 
    authLoading, 
    onboardingLoading, 
    needsOnboarding, 
    location, 
    setLocation, 
    user
  ]);

  // Show loading while determining onboarding status
  if (authLoading || onboardingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#F5B82E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}