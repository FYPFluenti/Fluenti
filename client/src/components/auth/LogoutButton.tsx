import { LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '../ui/button';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "ghost" | "default" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LogoutButton({ 
  className = "", 
  children,
  variant = "default",
  size = "default"
}: LogoutButtonProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    setLocation('/logout'); // redirect to logout
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={className}
    >
      <LogOut className="w-4 h-4" />
      {children || "log out"}
    </Button>
  );
}
