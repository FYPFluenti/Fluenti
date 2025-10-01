import { LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth'; // ✅ Add this import
import { useToast } from '@/hooks/use-toast'; // ✅ Add this import
import { Button } from '../ui/button';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "ghost" | "default" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LogoutButton({ 
  className, 
  children, 
  variant = "ghost", 
  size = "default" 
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast(); // ✅ Destructure toast from useToast

  const handleLogout = async () => {
    try {
      await logout();
      
      // Better logout experience - redirect to a thank you page or home
      setLocation('/');
      
      // Optional: Show a nice goodbye message
      toast({
        title: "See you soon! 👋",
        description: "You've been successfully logged out. Come back anytime!",
        duration: 3000,
      });
      
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      className={className}
      variant={variant}
      size={size}
    >
      <LogOut className="w-4 h-4 mr-2" />
      {children || "Logout"}
    </Button>
  );
}

// Also export as default for compatibility
export default LogoutButton;