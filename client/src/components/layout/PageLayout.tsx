import React, { useState } from 'react';
import SharedSidebar from './SharedSidebar';
import FeedbackModal from './FeedbackModel';

interface PageLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  className?: string;
}

export default function PageLayout({ 
  children, 
  currentPage,
  className = "min-h-screen bg-background text-foreground"
}: PageLayoutProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className={className}>
      <SharedSidebar 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage={currentPage}
      />
      
      {/* Main content with left margin for sidebar */}
      <div className="ml-20">
        {children}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </div>
  );
}