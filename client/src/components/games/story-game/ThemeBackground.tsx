import React, { useMemo } from 'react';
import { Theme } from '@/types/games/story-game';

interface ThemeBackgroundProps {
  theme: Theme | null;
}

// Floating Particle Component
const FloatingParticle: React.FC<{
  delay: number;
  duration: number;
  left: number;
  size: number;
  opacity: number;
  theme: Theme | null;
}> = ({ delay, duration, left, size, opacity, theme }) => {
  const getParticleColor = () => {
    switch (theme) {
      case 'Fantasy Forest':
        return 'rgba(255, 215, 0, 0.4)'; // Gold sparkles
      case 'Jungle Adventure':
        return 'rgba(34, 197, 94, 0.3)'; // Green particles
      case 'Space Quest':
        return 'rgba(147, 197, 253, 0.5)'; // Blue stars
      case 'Magical School':
        return 'rgba(196, 181, 253, 0.5)'; // Purple magic
      default:
        return 'rgba(255, 182, 45, 0.3)'; // Orange default
    }
  };

  const particleStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: getParticleColor(),
    boxShadow: `0 0 ${size * 2}px ${getParticleColor()}`,
    opacity,
    animation: `floatDown ${duration}s ease-in-out ${delay}s infinite`,
    pointerEvents: 'none',
  };

  return <div style={particleStyle} />;
};

// Leaf Component for Fantasy Forest & Jungle
const FloatingLeaf: React.FC<{
  delay: number;
  duration: number;
  left: number;
  rotation: number;
  theme: Theme | null;
  color: string;
}> = ({ delay, duration, left, rotation, color }) => {
  const leafStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: '20px',
    height: '20px',
    opacity: 0.6,
    background: color,
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    transform: `rotate(${rotation}deg)`,
    animation: `leafFall ${duration}s linear ${delay}s infinite`,
    pointerEvents: 'none',
  };

  return <div style={leafStyle} />;
};

// Sparkle Component for Fantasy Forest & Magical School
const Sparkle: React.FC<{
  delay: number;
  duration: number;
  left: number;
  top: number;
}> = ({ delay, duration, left, top }) => {
  const sparkleStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: '4px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '50%',
    boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
    animation: `sparkle ${duration}s ease-in-out ${delay}s infinite`,
    pointerEvents: 'none',
  };

  return (
    <>
      <div style={sparkleStyle} />
      <div
        style={{
          ...sparkleStyle,
          width: '2px',
          height: '2px',
          transform: 'rotate(45deg)',
        }}
      />
    </>
  );
};

const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  // Seeded random function for consistent particle placement
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate particles based on theme (memoized for performance)

  const getThemeGradient = () => {
    switch (theme) {
      case 'Fantasy Forest':
        return 'from-green-100 via-emerald-50 to-green-100';
      case 'Jungle Adventure':
        return 'from-green-200 via-lime-100 to-green-200';
      case 'Space Quest':
        return 'from-indigo-900 via-purple-900 to-indigo-900';
      case 'Magical School':
        return 'from-purple-100 via-pink-50 to-purple-100';
      default:
        return 'from-orange-50 via-yellow-50 to-orange-50';
    }
  };

  const particles = useMemo(() => {
    const elements: JSX.Element[] = [];
    const particleCount = 20;
    const themeHash = theme?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;

    for (let i = 0; i < particleCount; i++) {
      const seed = themeHash + i * 7919; // Prime number for better distribution
      const delay = seededRandom(seed) * 5;
      const duration = 10 + seededRandom(seed + 1) * 15;
      const left = seededRandom(seed + 2) * 100;
      const size = 3 + seededRandom(seed + 3) * 5;
      const opacity = 0.2 + seededRandom(seed + 4) * 0.4;

      if (theme === 'Fantasy Forest' || theme === 'Jungle Adventure') {
        if (seededRandom(seed + 5) > 0.5) {
          const colors = theme === 'Fantasy Forest' 
            ? ['#f59e0b', '#10b981', '#84cc16']
            : ['#16a34a', '#15803d', '#166534'];
          const colorIndex = Math.floor(seededRandom(seed + 6) * colors.length);
          
          elements.push(
            <FloatingLeaf
              key={`leaf-${i}`}
              delay={delay}
              duration={duration}
              left={left}
              rotation={seededRandom(seed + 7) * 360}
              theme={theme}
              color={colors[colorIndex]}
            />
          );
        } else {
          elements.push(
            <FloatingParticle
              key={`particle-${i}`}
              delay={delay}
              duration={duration}
              left={left}
              size={size}
              opacity={opacity}
              theme={theme}
            />
          );
        }
      } else {
        elements.push(
          <FloatingParticle
            key={`particle-${i}`}
            delay={delay}
            duration={duration}
            left={left}
            size={size}
            opacity={opacity}
            theme={theme}
          />
        );
      }
    }

    if (theme === 'Fantasy Forest' || theme === 'Magical School') {
      for (let i = 0; i < 15; i++) {
        const seed = themeHash + (particleCount + i) * 7919;
        elements.push(
          <Sparkle
            key={`sparkle-${i}`}
            delay={seededRandom(seed) * 4}
            duration={2 + seededRandom(seed + 1) * 2}
            left={seededRandom(seed + 2) * 100}
            top={seededRandom(seed + 3) * 100}
          />
        );
      }
    }

    return elements;
  }, [theme]);

  return (
    <>
      {/* Animated Background Base */}
      <div
        className={`fixed inset-0 bg-gradient-to-b ${getThemeGradient()} animate-pulse-slow opacity-60`}
        style={{
          zIndex: 0,
        }}
      />
      
      {/* Floating Particles Layer - Removed */}

      {/* Gradient Overlay for Text Readability */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/60 pointer-events-none"
        style={{ zIndex: 2 }}
      />
    </>
  );
};

export default ThemeBackground;

