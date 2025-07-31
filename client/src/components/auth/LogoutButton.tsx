import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function LogoutButton({ 
  className, 
  variant = "outline", 
  size = "sm",
  children 
}: LogoutButtonProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    // Navigate to the logout page which will handle the logout process
    setLocation('/logout');
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {children || "Logout"}
    </Button>
  );
}
