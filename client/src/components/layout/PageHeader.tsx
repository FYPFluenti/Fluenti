import React from 'react';
import HeaderControls from './HeaderControls';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  showControls?: boolean;
  showPreferencesLabel?: boolean;
  showDarkModeLabel?: boolean;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  children,
  showControls = true,
  showPreferencesLabel = true,
  showDarkModeLabel = true,
  className = "flex justify-between items-center py-6 flex-shrink-0"
}: PageHeaderProps) {
  return (
    <header className={className}>
      {/* Left side - Title or custom content */}
      <div>
        {title && (
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>

      {/* Right side - Controls */}
      {showControls && (
        <HeaderControls 
          showPreferencesLabel={showPreferencesLabel}
          showDarkModeLabel={showDarkModeLabel}
        />
      )}
    </header>
  );
}