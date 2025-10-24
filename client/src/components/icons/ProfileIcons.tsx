import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// User Profile Icon - Person silhouette
export const UserIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle 
        cx="12" 
        cy="8" 
        r="4" 
        fill="currentColor" 
        opacity="0.8"
      />
      <path 
        d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
};

// AI Profile Icon - Robot/Brain hybrid
export const AIIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Robot head */}
      <rect 
        x="6" 
        y="8" 
        width="12" 
        height="10" 
        rx="3" 
        fill="currentColor" 
        opacity="0.1"
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      
      {/* Brain pattern inside */}
      <path 
        d="M8 11c1 0 1.5.5 2 1s1-1 2-1 1.5.5 2 1" 
        stroke="currentColor" 
        strokeWidth="1" 
        fill="none"
        opacity="0.7"
      />
      <path 
        d="M8 14c1 0 1.5-.5 2-1s1 1 2 1 1.5-.5 2-1" 
        stroke="currentColor" 
        strokeWidth="1" 
        fill="none"
        opacity="0.7"
      />
      
      {/* Eyes */}
      <circle 
        cx="10" 
        cy="12" 
        r="1" 
        fill="currentColor"
      />
      <circle 
        cx="14" 
        cy="12" 
        r="1" 
        fill="currentColor"
      />
      
      {/* Antenna */}
      <line 
        x1="12" 
        y1="8" 
        x2="12" 
        y2="5" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle 
        cx="12" 
        cy="4" 
        r="1" 
        fill="currentColor"
      />
    </svg>
  );
};

// Alternative AI Icon - More modern/friendly
export const AIIconModern: React.FC<IconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="8" 
        fill="currentColor" 
        opacity="0.1"
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      
      {/* Neural network pattern */}
      <circle cx="8" cy="9" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="16" cy="9" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="15" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="16" cy="15" r="1" fill="currentColor" opacity="0.6" />
      
      {/* Connections */}
      <line x1="8" y1="9" x2="12" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <line x1="16" y1="9" x2="12" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <line x1="12" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <line x1="12" y1="12" x2="16" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
};

export default { UserIcon, AIIcon, AIIconModern };