import { useCallback, useRef } from 'react';

interface AudioHookOptions {
  volume?: number;
  preload?: boolean;
}

export const useAudio = (src: string, options: AudioHookOptions = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { volume = 1, preload = true } = options;

  const play = useCallback(async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(src);
        audioRef.current.volume = volume;
        if (preload) {
          audioRef.current.preload = 'auto';
        }
      }
      
      // Reset audio to beginning if it was played before
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [src, volume, preload]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, pause, stop };
};

// Hook for playing notification sounds
export const useNotificationSounds = () => {
  // Create simple audio using Web Audio API for basic sounds
  const playSound = useCallback((frequency: number, duration: number, volume: number = 0.3) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound generation failed:', error);
    }
  }, []);

  const playSendSound = useCallback(() => {
    // Pleasant send sound - ascending notes
    playSound(800, 0.1, 0.2);
    setTimeout(() => playSound(1000, 0.1, 0.15), 50);
  }, [playSound]);

  const playReceiveSound = useCallback(() => {
    // Gentle receive sound - descending notes
    playSound(600, 0.15, 0.2);
    setTimeout(() => playSound(500, 0.15, 0.15), 75);
  }, [playSound]);

  const playTypingSound = useCallback(() => {
    // Very subtle typing sound with random frequency variation
    const baseFreq = 350 + Math.random() * 100; // 350-450 Hz range
    playSound(baseFreq, 0.03, 0.08); // Shorter duration, lower volume
  }, [playSound]);

  return {
    playSendSound,
    playReceiveSound,
    playTypingSound
  };
};