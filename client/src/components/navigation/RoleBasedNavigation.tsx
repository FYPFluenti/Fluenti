import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Home, 
  MessageCircle, 
  Heart, 
  BarChart3, 
  Target,
  Users,
  Calendar,
  Settings,
  BookOpen,
  Star,
  Gift,
  Gamepad2
} from "lucide-react";

interface RoleBasedNavigationProps {
  currentPage?: string;
}

export function RoleBasedNavigation({ currentPage }: RoleBasedNavigationProps) {
  const { user } = useAuth();
  const userType = (user as any)?.userType;

  const getNavigationItems = () => {
    switch (userType) {
      case 'child':
        // Child users: Only speech therapy games and related features
        return [
          { href: '/child-dashboard', label: 'Home', icon: Home },
          { href: '/speech-therapy', label: 'Speech Games', icon: Gamepad2 },
          { href: '/progress', label: 'My Progress', icon: Star },
        ];
      
      case 'guardian':
        // Guardian users: Only child progress monitoring
        return [
          { href: '/guardian-dashboard', label: 'Dashboard', icon: Home },
          { href: '/progress', label: 'Child Progress', icon: BarChart3 },
        ];
      
      default: // adult
        // Adult users: Only emotional therapy features
        return [
          { href: '/adult-dashboard', label: 'Dashboard', icon: Home },
          { href: '/emotional-support', label: 'Emotional Support', icon: Heart },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.href;
        
        return (
          <Link key={item.href} href={item.href}>
            <Button 
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`flex items-center space-x-2 ${
                userType === 'child' ? 'hover:bg-pink-100' : 
                userType === 'guardian' ? 'hover:bg-green-100' : 
                'hover:bg-blue-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
