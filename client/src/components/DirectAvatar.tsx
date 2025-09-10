import { useState } from 'react';

interface DirectAvatarProps {
  avatarUrl: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  name?: string;
}

export default function DirectAvatar({ 
  avatarUrl, 
  size = 'medium', 
  className = '',
  name = 'Samaha'
}: DirectAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizes = {
    small: 'w-20 h-20',
    medium: 'w-40 h-40', 
    large: 'w-80 h-80'
  };

  // Extract avatar ID from the GLB URL
  const getAvatarId = (url: string) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.glb', '');
  };

  const avatarId = getAvatarId(avatarUrl);
  
  // Use Ready Player Me's direct image rendering
  const imageUrl = `https://render.readyplayer.me/render/${avatarId}.png?scene=headshot&width=1024&height=1024&quality=high`;

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-full z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Preparing {name}...</span>
          </div>
        </div>
      )}

      {/* Error/Fallback State */}
      {hasError && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mx-auto mb-2 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">{name.charAt(0).toUpperCase()}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">{name}</p>
          </div>
        </div>
      )}

      {/* Clean Avatar Image - Face Only */}
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 shadow-lg">
        <img
          src={imageUrl}
          alt={`${name} - Speech Therapy Avatar`}
          className={`w-full h-full object-cover object-center ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700`}
          style={{
            objectPosition: 'center 30%', // Focus on face area
          }}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>

      {/* Ready Indicator */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-full shadow-lg animate-pulse" 
             title="Ready for Speech Therapy">
        </div>
      )}
    </div>
  );
}