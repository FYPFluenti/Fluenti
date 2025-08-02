import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

interface RoleBasedComponentProps {
  allowedRoles: ('child' | 'adult' | 'guardian')[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleBasedComponent({ allowedRoles, children, fallback = null }: RoleBasedComponentProps) {
  const { user } = useAuth();
  
  if (!user) {
    return <>{fallback}</>;
  }
  
  const userType = (user as any)?.userType;
  
  if (!userType || !allowedRoles.includes(userType)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface UserTypeGuardProps {
  userType: 'child' | 'adult' | 'guardian';
  children: ReactNode;
  fallback?: ReactNode;
}

export function UserTypeGuard({ userType, children, fallback = null }: UserTypeGuardProps) {
  const { user } = useAuth();
  
  if (!user) {
    return <>{fallback}</>;
  }
  
  const currentUserType = (user as any)?.userType;
  
  if (currentUserType !== userType) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
