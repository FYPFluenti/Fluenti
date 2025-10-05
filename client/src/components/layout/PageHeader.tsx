import React from 'react';
import HeaderControls from './HeaderControls';

interface PageHeaderProps {
  children?: React.ReactNode;
  showControls?: boolean;
  className?: string;
}

export default function PageHeader({
  children,
  showControls = true,
  className = "flex justify-between items-center py-6 flex-shrink-0"
}: PageHeaderProps) {
  return (
    <header className={className}>
      <div />
      {children}
      {showControls && <HeaderControls />}
    </header>
  );
}