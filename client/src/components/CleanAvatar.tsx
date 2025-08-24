import { useState } from 'react';

interface CleanAvatarProps {
  avatarUrl: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  animate?: boolean;
}

export default function CleanAvatar({ 
  avatarUrl, 
  size = 'medium', 
  className = '',
  animate = true
}: CleanAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Size configurations
  const sizes = {
    small: 'w-20 h-20',
    medium: 'w-40 h-40', 
    large: 'w-80 h-80'
  };

  // Use Ready Player Me's clean viewer
  const viewerUrl = `https://demo.readyplayer.me/avatar?frameApi=1&clearColor=transparent&cameraInitialDistance=2&cameraTarget=0,1.5,0&animationName=${animate ? 'idle' : 'none'}&avatar=${avatarUrl}&background=transparent`;

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-full z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-full z-10">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mx-auto mb-2 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <p className="text-xs text-gray-500">Samaha</p>
          </div>
        </div>
      )}

      {/* Clean Avatar Display */}
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <iframe
          src={viewerUrl}
          className={`w-full h-full border-0 ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700`}
          allow="camera *; microphone *"
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          title="3D Avatar"
          style={{ 
            border: 'none',
            background: 'transparent',
            pointerEvents: 'none', // Prevents clicking/interaction
            transform: 'scale(1.1)', // Slightly zoom to fill better
            transformOrigin: 'center center'
          }}
        />
      </div>
    </div>
  );
}