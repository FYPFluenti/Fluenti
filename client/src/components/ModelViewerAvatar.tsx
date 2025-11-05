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
  autoRotate?: boolean;      
  cameraControls?: boolean;  
  fullBody?: boolean;
  // Lip-sync props
  isListening?: boolean;
  isSpeaking?: boolean;
  audioUrl?: string;
  text?: string;
  onLipSyncComplete?: () => void;
}

interface LipSyncData {
  visemes: Array<{
    time: number;
    value: string;
    weight: number;
  }>;
  duration: number;
}

export default function ModelViewerAvatar({ 
  avatarUrl, 
  size = 'medium', 
  className = '',
  autoRotate = false,       
  cameraControls = true,     
  fullBody = false,
  isListening = false,
  isSpeaking = false,
  audioUrl,
  text,
  onLipSyncComplete,
}: ModelViewerAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lipSyncData, setLipSyncData] = useState<LipSyncData | null>(null);
  const [isProcessingLipSync, setIsProcessingLipSync] = useState(false);
  const modelViewerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>();

  // Size configurations
  const sizes = {
    small: 'w-20 h-20',
    medium: 'w-40 h-40', 
    large: 'w-80 h-80'
  };

  // Viseme to blend shape mapping (for ReadyPlayerMe avatars)
  const visemeBlendShapes: { [key: string]: string } = {
    'sil': 'mouthClose',     // Silence
    'PP': 'mouthPucker',     // P, B, M
    'FF': 'mouthFunnel',     // F, V
    'TH': 'mouthOpen',       // TH
    'DD': 'mouthOpen',       // D, T, N, L
    'kk': 'mouthOpen',       // K, G
    'CH': 'mouthShrugUpper', // CH, J, SH
    'SS': 'mouthPress',      // S, Z
    'nn': 'mouthClose',      // N, NG
    'RR': 'mouthRollUpper',  // R
    'aa': 'mouthOpen',       // AH, AX
    'E': 'mouthSmile',       // EH, ER
    'I': 'mouthSmile',       // IH, IY
    'O': 'mouthFunnel',      // AO, OW
    'U': 'mouthPucker'       // UH, UW
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

  // Generate lip-sync data from text or audio
  const generateLipSyncData = async (inputText?: string, inputAudioUrl?: string) => {
    try {
      setIsProcessingLipSync(true);
      
      const response = await fetch('/api/lip-sync/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          audioUrl: inputAudioUrl,
          userId: 'SamahaMunir' // Current user
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lip-sync data');
      }

      const data: LipSyncData = await response.json();
      setLipSyncData(data);
      return data;
    } catch (error) {
      console.error('Error generating lip-sync data:', error);
      return null;
    } finally {
      setIsProcessingLipSync(false);
    }
  };

  // Apply viseme to avatar
  const applyViseme = (viseme: string, weight: number) => {
    if (!modelViewerRef.current) return;

    const modelViewer = modelViewerRef.current;
    const blendShapeName = visemeBlendShapes[viseme] || 'mouthClose';
    
    try {
      // Reset all mouth blend shapes
      Object.values(visemeBlendShapes).forEach(shapeName => {
        modelViewer.model?.setBlendShapeWeight(shapeName, 0);
      });
      
      // Apply current viseme
      modelViewer.model?.setBlendShapeWeight(blendShapeName, weight);
    } catch (error) {
      console.error('Error applying viseme:', error);
    }
  };

  // Animate lip-sync
  const animateLipSync = (lipSyncData: LipSyncData, startTime: number) => {
    const animate = () => {
      const currentTime = (Date.now() - startTime) / 1000; // Convert to seconds
      
      if (currentTime >= lipSyncData.duration) {
        // Animation complete
        applyViseme('sil', 1); // Return to silence
        onLipSyncComplete?.();
        return;
      }
      
      // Find current viseme
      const currentViseme = lipSyncData.visemes.find((viseme, index) => {
        const nextViseme = lipSyncData.visemes[index + 1];
        return currentTime >= viseme.time && (!nextViseme || currentTime < nextViseme.time);
      });
      
      if (currentViseme) {
        applyViseme(currentViseme.value, currentViseme.weight);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  // Start lip-sync with audio
  const startLipSyncWithAudio = async (audioUrl: string, text?: string) => {
    const lipSync = await generateLipSyncData(text, audioUrl);
    if (!lipSync) return;

    // Create and play audio
    audioRef.current = new Audio(audioUrl);
    audioRef.current.crossOrigin = 'anonymous';
    
    audioRef.current.onloadeddata = () => {
      if (audioRef.current) {
        audioRef.current.play();
        animateLipSync(lipSync, Date.now());
      }
    };
    
    audioRef.current.onerror = () => {
      console.error('Error loading audio');
      onLipSyncComplete?.();
    };
  };

  // Start lip-sync with text only
  const startLipSyncWithText = async (text: string) => {
    const lipSync = await generateLipSyncData(text);
    if (!lipSync) return;
    
    animateLipSync(lipSync, Date.now());
  };

  // Handle speaking state changes
  useEffect(() => {
    if (isSpeaking) {
      if (audioUrl) {
        startLipSyncWithAudio(audioUrl, text);
      } else if (text) {
        startLipSyncWithText(text);
      }
    } else {
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      applyViseme('sil', 1);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking, audioUrl, text]);

  // Handle listening state (subtle mouth animation)
  useEffect(() => {
    if (isListening && !isSpeaking) {
      const breathingAnimation = () => {
        const time = Date.now() / 1000;
        const breathingIntensity = (Math.sin(time * 0.5) + 1) * 0.1; // Gentle breathing
        applyViseme('sil', 0.8 + breathingIntensity);
        
        if (isListening) {
          animationFrameRef.current = requestAnimationFrame(breathingAnimation);
        }
      };
      breathingAnimation();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // Initialize blend shapes to neutral position
    setTimeout(() => {
      applyViseme('sil', 1);
    }, 100);
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
      {(isLoading || isProcessingLipSync) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-full z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {isProcessingLipSync ? 'Processing speech...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute top-2 right-2 z-20">
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}

      {/* Listening Indicator */}
      {isListening && !isSpeaking && (
        <div className="absolute top-2 right-2 z-20">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
        </div>
      )}

      {/* Model Viewer */}
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <model-viewer
          ref={modelViewerRef}
          src={avatarUrl}
          alt="Samaha's 3D Avatar"
          camera-controls={cameraControls}  
          auto-rotate={autoRotate ? true : undefined}
          disable-zoom={true}
          disable-pan={true}
          touch-action="pan-y"
          interaction-prompt="none"
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent'
          }}
          camera-orbit="0deg 90deg 1.1m"
          camera-target="0m 1.60m 0m"
          field-of-view="30deg"
          min-camera-orbit="-45deg 70deg 1.1m"
          max-camera-orbit="45deg 110deg 1.1m"
          min-field-of-view="30deg"
          max-field-of-view="30deg"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
}