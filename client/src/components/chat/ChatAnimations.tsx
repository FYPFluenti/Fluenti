import React from 'react';
import { Brain, MessageCircle } from 'lucide-react';

interface ThinkingIndicatorProps {
  className?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex justify-start">
        <div className="max-w-[80%] min-w-[160px]">
          <div className="flex items-center gap-3">
            {/* Animated brain icon */}
            <div className="relative">
              <Brain className="w-4 h-4 text-emerald-600 animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <Brain className="w-4 h-4 text-emerald-600/30" />
              </div>
            </div>
            
            {/* Animated text inline with icon */}
            <div className="text-sm text-muted-foreground animate-pulse italic">
              thinking
            </div>
            
            {/* Animated dots */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-600/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-600/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-600/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MessageAnimationWrapperProps {
  children: React.ReactNode;
  isNew?: boolean;
  delay?: number;
}

export const MessageAnimationWrapper: React.FC<MessageAnimationWrapperProps> = ({ 
  children, 
  isNew = false, 
  delay = 0 
}) => {
  return (
    <div 
      className={`${
        isNew 
          ? 'animate-in slide-in-from-bottom-4 fade-in-0 duration-500' 
          : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
      <MessageCircle className="w-4 h-4 animate-pulse" />
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm">Typing...</span>
    </div>
  );
};

export default ThinkingIndicator;