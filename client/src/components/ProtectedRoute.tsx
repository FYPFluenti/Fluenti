import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: string[];
}

export default function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation('/login');
        return;
      }

      // Check user type permissions
      if (allowedUserTypes && user) {
        const userType = (user as any)?.userType;
        if (!allowedUserTypes.includes(userType)) {
          // Redirect to appropriate dashboard
          switch (userType) {
            case 'child':
              setLocation('/child-dashboard');
              break;
            case 'adult':
              setLocation('/adult-dashboard');
              break;
            case 'guardian':
              setLocation('/guardian-dashboard');
              break;
            default:
              setLocation('/');
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, user, allowedUserTypes, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b1d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}