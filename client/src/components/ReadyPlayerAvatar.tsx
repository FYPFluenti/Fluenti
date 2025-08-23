import { Avatar } from "@readyplayerme/visage";
import { useState } from "react";

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
  environment = 'city'
}: ReadyPlayerAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Size configurations
  const sizes = {
    small: 'w-20 h-20',
    medium: 'w-40 h-40', 
    large: 'w-80 h-80'
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="sr-only">Loading avatar...</p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Avatar failed to load</p>
          </div>
        </div>
      )}

      {/* Ready Player Me Avatar */}
      <div className="w-full h-full rounded-full overflow-hidden">
        <Avatar
          modelSrc={avatarUrl}
          cameraInitialDistance={3}
          
          environment={environment}
          cameraTarget={0.65} // ✅ Fixed: 3D vector
          
          onLoaded={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          
          style={{ 
            width: '100%', 
            height: '100%',
            borderRadius: '50%'
          }}
        />
      </div>
    </div>
  );
}