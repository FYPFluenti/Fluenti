import React from 'react';
import { UserIcon, AIIconModern } from '@/components/icons/ProfileIcons';

interface MessageHeaderProps {
  type: 'user' | 'ai';
  timestamp?: Date;
  userName?: string;
  isNewMessage?: boolean;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({ 
  type, 
  timestamp, 
  userName,
  isNewMessage = false
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getDisplayName = () => {
    if (type === 'user') {
      return userName || 'You';
    }
    return 'Fluenti AI';
  };

  const getStatusColor = () => {
    if (type === 'user') {
      return 'text-primary';
    }
    return 'text-emerald-600';
  };

  return (
    <div className={`flex items-center gap-3 mb-2 ${
      type === 'user' ? 'flex-row-reverse' : 'flex-row'
    } ${isNewMessage ? 'animate-in slide-in-from-left-2 fade-in-0 duration-300' : ''}`}>
      {/* Profile Icon */}
      <div className={`flex-shrink-0 p-1.5 rounded-full border-2 transition-all duration-200 ${
        type === 'user' 
          ? 'bg-primary/10 border-primary/20 text-primary' 
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
      }`}>
        {type === 'user' ? (
          <UserIcon size={20} className="drop-shadow-sm" />
        ) : (
          <AIIconModern size={20} className="drop-shadow-sm" />
        )}
      </div>

      {/* Name only */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={`font-medium text-sm ${getStatusColor()}`}>
          {getDisplayName()}
        </span>
      </div>
    </div>
  );
};

export default MessageHeader;