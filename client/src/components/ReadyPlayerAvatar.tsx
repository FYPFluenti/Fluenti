import { useState } from 'react';

interface ReadyPlayerAvatarProps {
  avatarUrl: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  environment?: 'city' | 'apartment' | 'spacestation';
}

export default function ReadyPlayerAvatar({ 
  avatarUrl, 
  size = 'medium', 
  className = '',
  environment = 'apartment'
}: ReadyPlayerAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Size configurations
  const sizes = {
    small: 'w-20 h-20',
    medium: 'w-40 h-40', 
    large: 'w-80 h-80'
  };

  // ✅ Use the VIEWER, not the creator
  const viewerUrl = `https://demo.readyplayer.me/avatar?frameApi=1&clearColor=transparent&cameraInitialDistance=2.5&cameraTarget=0,0.65,0.15&environment=${environment}&animationName=idle&avatar=${avatarUrl}`;

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="sr-only">Loading avatar...</span>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full z-10">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500 mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold">SM</span>
            </div>
            <p className="text-xs text-gray-500">Avatar</p>
          </div>
        </div>
      )}

      {/* Clean Avatar Viewer */}
      <iframe
        src={viewerUrl}
        className={`w-full h-full border-0 rounded-full ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        allow="camera *; microphone *; fullscreen"
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        title="Ready Player Me Avatar"
        style={{ 
          border: 'none',
          background: 'transparent',
          pointerEvents: 'none' // ✅ This prevents interaction with the iframe
        }}
      />
    </div>
  );
}