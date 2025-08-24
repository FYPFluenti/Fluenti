import { useEffect, useRef, useState } from 'react';

// Import model-viewer types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface ModelViewerAvatarProps {
  avatarUrl: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  
}

export default function ModelViewerAvatar({ 
  avatarUrl, 
  size = 'medium', 
  className = '',
  
}: ModelViewerAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const modelViewerRef = useRef<any>(null);

  // Size configurations
  const sizes = {
    small: 'w-20 h-20',
    medium: 'w-40 h-40', 
    large: 'w-80 h-80'
  };

  useEffect(() => {
    // Dynamically import model-viewer
    import('@google/model-viewer').then(() => {
      setIsLoading(false);
    }).catch(() => {
      setHasError(true);
      setIsLoading(false);
    });
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`relative ${sizes[size]} ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-full">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mx-auto mb-2 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <p className="text-xs text-gray-500">Samaha</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-full z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Loading Samaha...</span>
          </div>
        </div>
      )}

      {/* Model Viewer - Face & Shoulders Focus */}
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <model-viewer
          ref={modelViewerRef}
          src={avatarUrl}
          alt="Samaha's 3D Avatar"
          camera-controls
          disable-zoom
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent'
          }}
          camera-orbit="0deg 85deg 1.2m"     // ✅ Perfect for face/shoulders
          camera-target="0m 1.6m 0m"         // ✅ Focus on head area
          field-of-view="30deg"              // ✅ Zoomed in appropriately
          min-camera-orbit="auto auto 0.8m"  // ✅ Don't zoom too far
          max-camera-orbit="auto auto 2m"    // ✅ Don't zoom too close
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
}