import React, { useEffect, useState, useRef } from 'react';
import { SparkleIcon } from './icons';

interface StoryBookCardProps {
  text: string;
  isNew?: boolean;
  delay?: number;
}

const StoryBookCard: React.FC<StoryBookCardProps> = ({ 
  text, 
  isNew = false,
  delay = 0 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Always set the text, but animate only if it's new
    if (!isNew) {
      setDisplayText(text);
      setIsAnimating(false);
      return;
    }

    // Only animate once per new chunk
    if (hasAnimatedRef.current) {
      setDisplayText(text);
      setIsAnimating(false);
      return;
    }

    hasAnimatedRef.current = true;
    setIsAnimating(true);
    setDisplayText(''); // Start with empty for fade-in effect

    // Fade-in effect with slight delay
    const timer1 = setTimeout(() => {
      setDisplayText(text);
    }, delay);

    const timer2 = setTimeout(() => {
      setIsAnimating(false);
    }, delay + 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [text, isNew, delay]);

  // Typewriter effect (optional, commented out for performance)
  // Uncomment if you prefer typewriter effect instead of fade-in
  /*
  useEffect(() => {
    if (!isNew || hasAnimatedRef.current) {
      setDisplayText(text);
      return;
    }

    hasAnimatedRef.current = true;
    setDisplayText('');
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30); // Adjust speed here (lower = faster)

    return () => clearInterval(typeInterval);
  }, [text, isNew]);
  */

  return (
    <div className="relative group">
      {/* Main Storybook Scroll Container */}
      <div 
        className={`
          relative
          bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50
          border-4 border-amber-700/30
          rounded-tl-[30px] rounded-tr-[20px] rounded-br-[30px] rounded-bl-[20px]
          shadow-2xl
          p-5 md:p-6
          transition-all duration-500
          ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        `}
        style={{
          backgroundImage: `
            radial-gradient(circle at 25px 25px, rgba(139, 69, 19, 0.05) 2%, transparent 0%),
            linear-gradient(to bottom, rgba(245, 245, 220, 0.3) 0%, transparent 100%)
          `,
          backgroundSize: '50px 50px, 100% 100%',
          boxShadow: `
            0 20px 40px rgba(139, 69, 19, 0.2),
            0 0 20px rgba(255, 215, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 0 rgba(139, 69, 19, 0.1)
          `,
        }}
      >
        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
          }}
        />

        {/* Animated Page-Turn Corner (top-right) */}
        <div 
          className="absolute top-0 right-0 w-20 h-20 pointer-events-none overflow-hidden"
          style={{
            animation: 'pageCorner 4s ease-in-out infinite',
          }}
        >
          {/* Corner fold layer */}
          <div 
            className="absolute top-0 right-0 w-full h-full"
            style={{
              background: 'linear-gradient(135deg, transparent 45%, rgba(139, 69, 19, 0.12) 50%, rgba(139, 69, 19, 0.08) 60%, transparent 65%)',
              clipPath: 'polygon(100% 0, 100% 55%, 55% 100%, 100% 100%)',
            }}
          />
          {/* Inner shadow for depth */}
          <div 
            className="absolute top-0 right-0 w-12 h-12"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0%, transparent 70%)',
              clipPath: 'polygon(100% 0, 100% 50%, 50% 100%, 100% 100%)',
            }}
          />
          {/* Highlight edge */}
          <div 
            className="absolute top-0 right-0 w-14 h-14"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
              clipPath: 'polygon(100% 0, 100% 48%, 48% 100%, 100% 100%)',
            }}
          />
        </div>

        {/* Decorative corner accent */}
        <div className="absolute top-2 right-2 w-6 h-6">
          <SparkleIcon className="w-6 h-6 text-amber-400/40 animate-pulse" />
        </div>

        {/* Text Content */}
        <div className="relative z-10">
          <p 
            ref={textRef}
            className="text-base md:text-lg leading-relaxed font-normal text-gray-800 whitespace-pre-wrap"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
            }}
          >
            {displayText || text}
          </p>
        </div>

        {/* Parchment texture overlay */}
        <div 
          className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(139, 69, 19, 0.03) 2px,
                rgba(139, 69, 19, 0.03) 4px
              )
            `,
          }}
        />
      </div>

      {/* Outer glow ring */}
      <div 
        className="absolute -inset-2 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 182, 45, 0.2))',
        }}
      />
    </div>
  );
};

export default StoryBookCard;


