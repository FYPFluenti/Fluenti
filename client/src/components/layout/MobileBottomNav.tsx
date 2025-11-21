import React from 'react';
import { useLocation } from 'wouter';
import {
  Gamepad2,
  LineChart,
  Smile,
  User,
  Settings,
  Home,
} from 'lucide-react';

interface MobileBottomNavProps {
  onFeedbackOpen?: () => void;
  currentPage?: string;
  userType?: 'child' | 'adult';
}

export default function MobileBottomNav({ onFeedbackOpen, currentPage, userType = 'child' }: MobileBottomNavProps) {
  const [, setLocation] = useLocation();

  const childNavItems = [
    { 
      icon: Home, 
      label: "home", 
      id: "dashboard", 
      path: "/child-dashboard",
      isActive: currentPage === "dashboard"
    },
    { 
      icon: Gamepad2, 
      label: "games", 
      id: "games", 
      path: "/speech-therapy",
      isActive: currentPage === "games"
    },
    { 
      icon: LineChart, 
      label: "progress", 
      id: "progress", 
      path: "/progress-dashboard",
      isActive: currentPage === "progress"
    },
    { 
      icon: Smile, 
      label: "feedback", 
      id: "feedback",
      isActive: currentPage === "feedback"
    },
    { 
      icon: Settings, 
      label: "settings", 
      id: "settings", 
      path: "/settings",
      isActive: currentPage === "settings"
    },
  ];

  const adultNavItems = [
    { 
      icon: Home, 
      label: "home", 
      id: "dashboard", 
      path: "/adult-dashboard",
      isActive: currentPage === "dashboard"
    },
    { 
      icon: Smile, 
      label: "support", 
      id: "emotional", 
      path: "/emotional-support",
      isActive: currentPage === "emotional"
    },
    { 
      icon: LineChart, 
      label: "progress", 
      id: "history", 
      path: "/adult-history",
      isActive: currentPage === "history" || currentPage === "progress"
    },
    { 
      icon: User, 
      label: "insights", 
      id: "insights", 
      path: "/psychological-insights",
      isActive: currentPage === "insights"
    },
    { 
      icon: Settings, 
      label: "settings", 
      id: "settings", 
      path: "/adult-settings",
      isActive: currentPage === "settings"
    },
  ];

  const navItems = userType === 'adult' ? adultNavItems : childNavItems;

  const handleItemClick = (item: any) => {
    if (item.id === "feedback" && onFeedbackOpen) {
      onFeedbackOpen();
    } else if (item.path) {
      setLocation(item.path);
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[72px] ${
                item.isActive
                  ? 'text-[#ff6b1d] bg-[#ff6b1d]/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}