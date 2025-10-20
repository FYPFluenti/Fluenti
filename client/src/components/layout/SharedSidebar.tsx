import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Gamepad2,
  LineChart,
  Smile,
  User,
  Settings,
} from 'lucide-react';
import FluentiLogo from '@/components/FluentiLogo';
import { LogoutButton } from '../auth/LogoutButton';
import OnboardingStatsIcon from '@/components/icons/OnboardingStatsIcon';

interface SidebarProps {
  onFeedbackOpen?: () => void;
  currentPage?: string; 
}

export default function SharedSidebar({ onFeedbackOpen, currentPage }: SidebarProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [, setLocation] = useLocation();
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const sidebarItems = [
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
      icon: OnboardingStatsIcon, 
      label: "onboarding stats", 
      id: "onboarding-stats", 
      path: "/onboarding-statistics",
      isActive: currentPage === "onboarding-stats"
    },
    { 
      icon: Smile, 
      label: "feedback", 
      id: "feedback",
      isActive: currentPage === "feedback"
    },
  ];

  const handleItemClick = (item: any) => {
    if (item.id === "feedback") {
      onFeedbackOpen?.();
    } else if (item.path) {
      setLocation(item.path);
    }
  };

  return (
    <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-50 border-r border-border">
      {/* Logo/Home Button */}
      <div
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
        className="relative group"
      >
        <button
          onClick={() => setLocation("/child-dashboard")}
          aria-label="Go to home"
          className="w-12 h-12 grid place-items-center rounded-xl transition hover:bg-muted"
        >
          <FluentiLogo
            className="w-10 h-10 text-[#ff6b1d] transition-colors duration-150 group-hover:text-[#ff8a4a]"
          />
        </button>

        {hovered === "home" && (
          <motion.div
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 12 }}
            exit={{ opacity: 0, x: 5 }}
            className="absolute left-[38px] bottom-1 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg shadow-md border border-border z-10"
          >
            home
          </motion.div>
        )}
      </div>

      {/* Navigation Items */}
      {sidebarItems.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
          className="relative group"
        >
          <button
            onClick={() => handleItemClick(item)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition group ${
              item.isActive ? 'bg-[#ff6b1d] text-white' : 'hover:bg-muted'
            }`}
            aria-label={item.label}
          >
            <item.icon className={`w-7 h-7 transition-colors duration-150 ${
              item.isActive 
                ? 'text-white' 
                : 'text-foreground group-hover:text-muted-foreground'
            }`} />
          </button>

          {hovered === item.id && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 12 }}
              exit={{ opacity: 0, x: 5 }}
              className="absolute left-[38px] bottom-0 bg-popover text-popover-foreground px-4 py-2 rounded-lg shadow-md border border-border z-10 whitespace-nowrap"
            >
              {item.label}
            </motion.div>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {/* User Menu */}
      <div 
        className="relative" 
        onMouseEnter={() => { 
          if (hideTimer.current) clearTimeout(hideTimer.current); 
          setShowUserMenu(true); 
        }} 
        onMouseLeave={() => { 
          hideTimer.current = setTimeout(() => setShowUserMenu(false), 200); 
        }}
      >
        <button
          className="group w-10 h-10 flex items-center justify-center rounded-full transition hover:bg-muted"
          aria-haspopup="menu"
          aria-expanded={showUserMenu}
        >
          <User
            className={`w-7 h-7 transition-colors duration-150 ${
              showUserMenu
                ? "text-muted-foreground"
                : "text-muted-foreground group-hover:text-muted-foreground"
            }`}
          />
        </button>

        {showUserMenu && (
          <div className="absolute left-12 bottom-0 w-48 bg-popover border border-border rounded-xl shadow-lg p-4 z-50 space-y-2">
            <button 
              onClick={() => setLocation("/settings")} 
              className="w-full px-5 py-3 text-sm flex items-center gap-3 hover:bg-muted hover:brightness-90 rounded-lg"
            >
              <Settings className="w-5 h-5" />
              <span className="text-foreground font-medium">Settings</span>
            </button>
            <div className="border-t border-border my-1" />
            <LogoutButton className="w-full px-5 py-3 text-base text-left hover:bg-gray-200 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white bg-orange-500 text-white font-medium flex items-center gap-3 rounded-lg" />
          </div>
        )}
      </div>
    </aside>
  );
}

// Ensure named export for better compatibility
export { SharedSidebar };