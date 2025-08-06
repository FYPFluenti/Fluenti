import { LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  className = "", 
  children 
}: LogoutButtonProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    setLocation('/logout'); // redirect to logout
  };

  return (
    <button
      onClick={handleLogout}
      className={`w-full px-4 py-3 text-sm text-left text-[#111] font-medium flex items-center gap-2 hover:bg-gray-100 transition ${className}`}
    >
      <LogOut className="w-4 h-4" />
      {children || "log out"}
    </button>
  );
}
