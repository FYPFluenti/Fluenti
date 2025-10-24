import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Star, 
  Check, 
  X, 
  ArrowRight,
  ArrowLeft,
  Trophy,
  Sparkles,
  Heart,
  Zap,
  Award,
  Smile,
  PartyPopper,
  Target,
  Brain,
  Headphones,
  Clock,
  Play,
  BookOpen,
  TreePine,
  Palette,
  Music,
  Camera,
  Gamepad2,
  PawPrint,
  Rabbit,
  Fish
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { aiSpeechService, PersonalizedWord, SpeechFeedback, ChildProfile } from '@/services/aiSpeechTherapy';
import { PronunciationAnalyzer } from '@/services/realTimeSpeechRecognition';
import { groqSpeechService, GroqSpeechResult } from '@/services/groqSpeechService';
import { childSpeechService, ChildSpeechResult } from '@/services/childSpeechService';
import { wordPracticeSpeechService, WordPracticeSpeechResult } from '@/services/wordPracticeSpeechService';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';

interface WordPracticeGameProps {
  gameData: any;
  sessionId: string;
  onComplete: (results: any) => void;
  onExit: () => void;
}

export default function WordPracticeGame({ 
  gameData, 
  sessionId, 
  onComplete, 
  onExit 
}: WordPracticeGameProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [score, setScore] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [personalizedWords, setPersonalizedWords] = useState<PersonalizedWord[]>([]);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [cheerfulCharacter, setCheerfulCharacter] = useState(<Sparkles className="w-5 h-5 text-yellow-500" />);
  const [isGroqListening, setIsGroqListening] = useState(false);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);
  
  // 🎤 SIMPLE RECORDING (like Emotional Support) - completely separate from complex childSpeechService
  const { startRecording, stopRecording, isRecording: isSimpleRecording } = useSpeechRecognition();
  
  // AI Enhancement States
  const [gameMode, setGameMode] = useState<'story' | 'classic' | 'challenge' | 'conquest'>('story');
  const [selectedChallengeMode, setSelectedChallengeMode] = useState<string>('');
  const [showModeSelector, setShowModeSelector] = useState(() => {
    // Check if game should start directly (from speech-therapy.tsx)
    if (gameData?.skipSubModes || gameData?.directStart) {
      console.log('🎮 Direct start detected - skipping mode selector:', {
        skipSubModes: gameData.skipSubModes,
        directStart: gameData.directStart,
        selectedMode: gameData.selectedMode
      });
      return false; // Skip mode selector
    }
    return true; // Show mode selector by default
  });
  const [challengeModes, setChallengeModes] = useState<any[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [storyContext, setStoryContext] = useState<any>(null);
  const [emotionalState, setEmotionalState] = useState<any>(null);
  const [companionDialogue, setCompanionDialogue] = useState<string>('');
  const [surpriseReward, setSurpriseReward] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [companionCharacter, setCompanionCharacter] = useState<any>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(5); // 1-10 scale
  
  // NEW: Enhanced UX States
  const [showStoryOpening, setShowStoryOpening] = useState(false);
  const [showEmotionalSupport, setShowEmotionalSupport] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [animalsHelped, setAnimalsHelped] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentFailures, setRecentFailures] = useState(0);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<any[]>([]);
  
  // 🎮 Challenge Mode Selection State
  const [showChallengeModeSelector, setShowChallengeModeSelector] = useState(false);
  
  // ⏱️ Challenge Mode Timer States
  const [challengeTimeLeft, setChallengeTimeLeft] = useState<number | null>(null);
  const [challengeStartTime, setChallengeStartTime] = useState<number | null>(null);
  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🎙️ COMPREHENSIVE AUDIO STATE MANAGEMENT
  // These states ensure no audio conflicts between system and user
  const [isAISpeaking, setIsAISpeaking] = useState(false);           // When AI/TTS is playing
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);       // When user is being recorded
  const [isAIGenerating, setIsAIGenerating] = useState(false);       // When AI is processing
  const [audioLockActive, setAudioLockActive] = useState(false);     // Global audio lock
  
  // Legacy state for backward compatibility
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const groqListeningControllerRef = useRef<{ stop: () => void } | null>(null);
  const audioLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentWord = personalizedWords[currentWordIndex];
  const maxAttempts = 3;

  // ============================================================================
  // 🎙️ COMPREHENSIVE AUDIO STATE MANAGEMENT SYSTEM
  // ============================================================================
  
  /**
   * Central audio state controller to prevent conflicts between:
   * - AI/TTS speaking (system audio)
   * - User speaking (microphone recording)  
   * - AI processing (feedback generation)
   */
  const AudioStateController = {
    // Check if any audio operation is active
    isAnyAudioActive: () => {
      return isAISpeaking || isUserSpeaking || isAIGenerating || audioLockActive;
    },
    
    // Start AI speaking (TTS/Audio playback)
    startAISpeaking: () => {
      console.log('🔊 AudioState: AI Speaking Started');
      setIsAISpeaking(true);
      setIsAudioPlaying(true); // Legacy compatibility
      setAudioLockActive(true);
      
      // Clear any existing timeout
      if (audioLockTimeoutRef.current) {
        clearTimeout(audioLockTimeoutRef.current);
      }
    },
    
    // Stop AI speaking
    stopAISpeaking: () => {
      console.log('✅ AudioState: AI Speaking Stopped');
      setIsAISpeaking(false);
      setIsAudioPlaying(false); // Legacy compatibility
      
      // Keep lock for 300ms to ensure audio fully stops
      audioLockTimeoutRef.current = setTimeout(() => {
        setAudioLockActive(false);
        console.log('🔓 AudioState: Audio lock released');
      }, 300);
    },
    
    // Start user speaking (recording)
    startUserSpeaking: () => {
      if (AudioStateController.isAnyAudioActive()) {
        console.log('⚠️ AudioState: Cannot start user speaking - audio active');
        return false;
      }
      console.log('🎤 AudioState: User Speaking Started');
      setIsUserSpeaking(true);
      setAudioLockActive(true);
      return true;
    },
    
    // Stop user speaking
    stopUserSpeaking: () => {
      console.log('🛑 AudioState: User Speaking Stopped');
      setIsUserSpeaking(false);
      setAudioLockActive(false);
    },
    
    // Start AI generating (processing)
    startAIGenerating: () => {
      console.log('🤖 AudioState: AI Generating Started');
      setIsAIGenerating(true);
      setAudioLockActive(true);
    },
    
    // Stop AI generating
    stopAIGenerating: () => {
      console.log('✅ AudioState: AI Generating Stopped');
      setIsAIGenerating(false);
      setAudioLockActive(false);
    },
    
    // Emergency reset all states
    resetAll: () => {
      console.log('🔄 AudioState: Emergency Reset All States');
      setIsAISpeaking(false);
      setIsUserSpeaking(false);
      setIsAIGenerating(false);
      setIsAudioPlaying(false);
      setAudioLockActive(false);
      
      if (audioLockTimeoutRef.current) {
        clearTimeout(audioLockTimeoutRef.current);
        audioLockTimeoutRef.current = null;
      }
      
      // Cancel any ongoing TTS
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    },
    
    // Get current state for debugging
    getState: () => ({
      isAISpeaking,
      isUserSpeaking,
      isAIGenerating,
      audioLockActive,
      isAnyActive: AudioStateController.isAnyAudioActive()
    })
  };

  // ============================================================================
  // 🧹 AUDIO STATE CLEANUP ON COMPONENT UNMOUNT
  // ============================================================================
  
  useEffect(() => {
    // Cleanup function runs when component unmounts
    return () => {
      console.log('🧹 Component unmounting - cleaning up audio states');
      AudioStateController.resetAll();
    };
  }, []);

  // ============================================================================
  // 🎤 ENHANCED TTS MONITORING FOR RECORDING PROTECTION
  // ============================================================================
  
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        const voices = speechSynthesis.getVoices();
        console.log('🔊 Speech synthesis voices loaded:', voices.length);
        console.log('🎵 Available voices:', voices.slice(0, 5).map(v => `${v.name} (${v.lang})`));
      };
      
      const handleSpeechStart = () => {
        console.log('🔊 Browser TTS started - ensuring AI speaking state');
        if (!isAISpeaking) {
          AudioStateController.startAISpeaking();
        }
      };
      
      const handleSpeechEnd = () => {
        console.log('🔇 Browser TTS ended - ensuring AI speaking state cleared');
        if (isAISpeaking) {
          AudioStateController.stopAISpeaking();
        }
      };
      
      // Listen for global speech synthesis events
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Force voice loading if not already loaded
      if (speechSynthesis.getVoices().length === 0) {
        console.log('� Forcing voice loading...');
        speechSynthesis.getVoices();
      } else {
        handleVoicesChanged();
      }
      
      // Create a monitoring interval to check TTS state
      const ttsMonitor = setInterval(() => {
        if (speechSynthesis.speaking && !isAISpeaking) {
          console.log('⚠️ Detected untracked TTS - fixing state');
          AudioStateController.startAISpeaking();
        } else if (!speechSynthesis.speaking && isAISpeaking) {
          console.log('⚠️ TTS ended but state not cleared - fixing state');
          AudioStateController.stopAISpeaking();
        }
      }, 500);
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        clearInterval(ttsMonitor);
      };
    }
  }, [isAISpeaking]);

  // Check microphone permissions on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('❌ MediaDevices API not supported');
          setHasMicrophonePermission(false);
          toast({
            title: "Browser Not Supported",
            description: "Your browser doesn't support microphone access. Please use Chrome, Edge, or Firefox.",
            variant: "destructive"
          });
          return;
        }

        console.log('🎤 Requesting microphone access...');

        // Request microphone permission FIRST
        // Note: enumerateDevices() won't show device labels until permission is granted
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        console.log('✅ Microphone stream obtained:', {
          active: stream.active,
          tracks: stream.getTracks().length
        });

        // Now enumerate devices AFTER permission is granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        console.log('🎤 Available audio input devices:', {
          count: audioInputs.length,
          devices: audioInputs.map(d => ({ label: d.label, id: d.deviceId.substring(0, 8) }))
        });

        // Check if all devices are Stereo Mix (system audio)
        const allStereoMix = audioInputs.every(d => {
          const label = d.label.toLowerCase();
          return label.includes('stereo mix') || 
                 label.includes('wave out') || 
                 label.includes('what u hear');
        });

        if (allStereoMix) {
          console.error('❌ Only "Stereo Mix" detected - no real microphone available!');
          stream.getTracks().forEach(track => track.stop());
          setHasMicrophonePermission(false);
          
          toast({
            title: "No Real Microphone Found",
            description: "Only 'Stereo Mix' (system audio) is enabled. Please enable your real microphone in Windows Sound Settings → Recording tab → Show Disabled Devices → Enable your microphone.",
            variant: "destructive",
            duration: 20000
          });
          return;
        }

        // Stop the stream after checking
        stream.getTracks().forEach(track => track.stop());
        
        console.log('✅ Microphone permission granted');
        setHasMicrophonePermission(true);
        
        // Show success message
        toast({
          title: "Microphone Ready!",
          description: "You can now start practicing!",
          variant: "default",
          duration: 3000
        });
        
      } catch (error: any) {
        console.error('❌ Microphone access error:', error);
        setHasMicrophonePermission(false);
        
        // Provide specific error messages based on error type
        let title = "Microphone Access Required";
        let description = "Please allow microphone access to play this game.";
        
        if (error.name === 'NotFoundError') {
          title = "No Microphone Found";
          description = "Please connect a microphone or headset, then refresh the page. Check Windows Sound Settings to ensure a microphone is recognized.";
        } else if (error.name === 'NotAllowedError') {
          title = "Permission Denied";
          description = "Click the 🔒 icon in your address bar → Site Settings → Microphone → Allow, then refresh the page.";
        } else if (error.name === 'NotReadableError') {
          title = "Microphone In Use";
          description = "Another app (like Zoom, Teams, or Skype) is using your microphone. Please close it and refresh the page.";
        } else if (error.name === 'OverconstrainedError') {
          title = "Microphone Not Compatible";
          description = "Your microphone doesn't support the required audio settings. Try a different microphone.";
        }
        
        toast({
          title,
          description,
          variant: "destructive",
          duration: 15000
        });
      }
    };

    checkMicrophonePermission();
  }, []);

  // 🎤 SIMPLE RECORDING HANDLER (like Emotional Support)
  const handleSimpleRecordStop = async (blob: Blob) => {
    try {
      console.log('🎤 Word Practice - Processing simple recording...');
      
      // Use simple transcription service (same endpoint as child-transcribe but simpler approach)
      const result = await wordPracticeSpeechService.transcribeAudio(blob, currentWord?.word);
      
      if (result && result.text && result.text.trim() !== '') {
        // Convert to GroqSpeechResult format for compatibility with existing handlers
        const compatibleResult: GroqSpeechResult = {
          text: result.text,
          confidence: result.confidence,
          language: result.language || 'en',
          duration: 0 // Not needed for word practice
        };
        
        console.log('✅ Word Practice - Simple STT result:', compatibleResult);
        
        // Process the result using existing handler
        await handleGroqSpeechResult(compatibleResult);
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking clearly into your microphone.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Word Practice simple recording error:', error);
      toast({
        title: "Recording failed",
        description: "Please try again. Make sure your microphone is working.",
        variant: "destructive"
      });
    }
  };

  // 🎤 SIMPLE RECORDING FUNCTIONS (like Emotional Support)
  const startSimpleRecording = async () => {
    if (isSimpleRecording || !currentWord || isGeneratingFeedback) {
      console.log('⚠️ Cannot start simple recording - already in progress');
      return;
    }

    // Check microphone permission first
    if (hasMicrophonePermission === false) {
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone access in your browser settings.",
        variant: "destructive"
      });
      return;
    }

    if (hasMicrophonePermission === null) {
      toast({
        title: "Please Wait",
        description: "Checking microphone access...",
        variant: "default"
      });
      return;
    }

    try {
      console.log('🎤 Word Practice - Starting simple recording for:', currentWord.word);
      await startRecording();
    } catch (error) {
      console.error('❌ Simple recording start error:', error);
      toast({
        title: "Recording failed to start",
        description: "Please check your microphone and try again.",
        variant: "destructive"
      });
    }
  };

  const stopSimpleRecording = async () => {
    if (!isSimpleRecording) {
      console.log('⚠️ Not currently recording');
      return;
    }

    try {
      console.log('🛑 Word Practice - Stopping simple recording...');
      await stopRecording(handleSimpleRecordStop);
    } catch (error) {
      console.error('❌ Simple recording stop error:', error);
      toast({
        title: "Recording failed to stop",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load child profile on mount (needed for daily quest and other features)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('👤 Fetching child profile from /api/onboarding...');
        const onboardingResponse = await fetch('/api/onboarding', {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        console.log('📡 Onboarding response status:', onboardingResponse.status);

        if (onboardingResponse.ok) {
          const profile = await onboardingResponse.json();
          console.log('✅ Child profile loaded:', profile.childName);
          setChildProfile(profile);
        } else {
          const errorText = await onboardingResponse.text();
          console.error('❌ Failed to load profile:', onboardingResponse.status, errorText);
          // Don't show error toast on initial load - user might not be logged in yet
          console.log('ℹ️ Profile not available - user may need to log in or complete onboarding');
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
      }
    };

    loadProfile();
  }, []);

  // Load challenge modes and daily challenge
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        // Get challenge modes
        console.log('🎮 Fetching challenge modes...');
        const modesResponse = await fetch('/api/ai/challenge-modes', {
          credentials: 'include'
        });
        
        console.log('📡 Modes response status:', modesResponse.status);
        
        if (modesResponse.ok) {
          const data = await modesResponse.json();
          console.log('✅ Challenge modes loaded:', data.modes?.length || 0, 'modes');
          console.log('📋 Modes:', data.modes?.map((m: any) => m.id) || []);
          setChallengeModes(data.modes || []);
        } else {
          const errorText = await modesResponse.text();
          console.error('❌ Failed to fetch challenge modes:', modesResponse.status, errorText);
          toast({
            title: "Failed to Load Challenge Modes",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        }

        // 🏆 Get daily quest from NEW backend (only if profile exists)
        if (childProfile) {
          console.log('🏆 Fetching daily quest for profile:', childProfile.childName);
          const dailyQuestResponse = await fetch('/api/games/daily-quest', {
            credentials: 'include'
          });
          
          console.log('📡 Daily quest response status:', dailyQuestResponse.status);
          
          if (dailyQuestResponse.ok) {
            const data = await dailyQuestResponse.json();
            console.log('✅ Daily quest loaded:', data);
            
            if (data.quest) {
              // Transform backend quest to frontend format
              setDailyChallenge({
                mode: data.quest.challengeMode,
                emoji: data.quest.emoji,
                theme: data.quest.theme,
                description: data.quest.description,
                difficulty: data.quest.difficulty,
                targetScore: data.quest.targetScore,
                targetAccuracy: data.quest.targetAccuracy,
                bonusReward: data.quest.bonusReward,
                isCompleted: data.quest.isCompleted,
                completedToday: data.quest.isCompleted,
                currentStreak: data.streak || 0,
                questId: data.quest._id
              });
            } else {
              console.warn('⚠️ Daily quest response missing quest data:', data);
            }
          } else {
            const errorText = await dailyQuestResponse.text();
            console.error('❌ Failed to fetch daily quest:', dailyQuestResponse.status, errorText);
          }
        } else {
          console.log('⏳ Skipping daily quest - no child profile yet');
        }
      } catch (error) {
        console.error('❌ Failed to load challenges:', error);
        toast({
          title: "Connection Error",
          description: "Could not connect to server. Please check if the server is running.",
          variant: "destructive"
        });
      }
    };

    // ✅ ALWAYS load challenge modes (don't wait for profile)
    console.log('� Loading challenges on mount...');
    loadChallenges();
  }, [childProfile]);

  // ⏱️ Challenge Mode Timer - Start countdown when challenge begins
  useEffect(() => {
    // Only run timer in challenge mode after mode selection (NOT conquest - conquest has different rules)
    if (gameMode !== 'challenge' || showModeSelector || !selectedChallengeMode) {
      return;
    }
    
    console.log('⏱️ Timer Effect Triggered:', {
      gameMode,
      selectedChallengeMode,
      showModeSelector,
      challengeModesCount: challengeModes.length
    });
    
    // Get challenge mode config
    const currentMode = challengeModes.find(m => m.id === selectedChallengeMode);
    if (!currentMode || !currentMode.timeLimit) {
      // No time limit for this mode
      console.warn('⚠️ Challenge mode not found or no time limit:', selectedChallengeMode);
      return;
    }
    
    console.log(`⏱️ Starting ${currentMode.timeLimit}s timer for ${currentMode.name} (${currentMode.id})`);
    
    // Initialize timer
    setChallengeTimeLeft(currentMode.timeLimit);
    setChallengeStartTime(Date.now());
    
    // Start countdown
    challengeTimerRef.current = setInterval(() => {
      setChallengeTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          // Time's up!
          if (challengeTimerRef.current) {
            clearInterval(challengeTimerRef.current);
          }
          
          // Show timeout message
          toast({
            title: "⏰ Time's Up!",
            description: `Challenge complete! Final score: ${score}`,
            duration: 5000
          });
          
          // End game and show results
          setTimeout(() => {
            handleEndSession();
          }, 1000);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup
    return () => {
      if (challengeTimerRef.current) {
        clearInterval(challengeTimerRef.current);
        challengeTimerRef.current = null;
      }
    };
  }, [gameMode, selectedChallengeMode, showModeSelector, challengeModes]);

  // Load child profile and generate personalized words
  useEffect(() => {
    const initializeGame = async () => {
      // ✅ HANDLE DIRECT START from speech-therapy.tsx
      if (gameData?.skipSubModes || gameData?.directStart) {
        console.log('🎮 Direct start mode detected:', {
          gameType: gameData.selectedMode?.type,
          gameName: gameData.selectedMode?.name,
          title: gameData.title
        });
        
        // Set game mode based on the passed data
        if (gameData.selectedMode?.type === 'daily-quest') {
          console.log('🏆 Starting Daily Quest (Conquest Mode)');
          setGameMode('conquest');
          setSelectedChallengeMode(''); // Clear challenge mode
        } else if (gameData.selectedMode?.type === 'challenge-mode') {
          console.log('🎯 Starting Challenge Mode - Speed Round');
          setGameMode('challenge');
          setSelectedChallengeMode('speed_round'); // Set default to speed round (correct ID)
          setShowChallengeModeSelector(false); // Skip challenge mode selector
          // Continue with game initialization (don't return early)
        } else if (gameData.selectedMode?.type === 'story-adventure') {
          console.log('📖 Starting Story Adventure');
          setGameMode('story');
          setSelectedChallengeMode(''); // Clear challenge mode
          // ✅ IMPORTANT: Show story opening when story mode is detected
          setShowStoryOpening(true);
        } else {
          console.log('📝 Starting Classic Mode');
          setGameMode('classic');
          setSelectedChallengeMode(''); // Clear challenge mode
        }
        
        setShowModeSelector(false);
        // Continue with game initialization below
      }

      // Don't initialize if we're still showing mode selector
      if (showModeSelector && !gameData?.skipSubModes && !gameData?.directStart) {
        setIsLoadingWords(false);
        return;
      }

      // ✅ Set loading state at the start
      setIsLoadingWords(true);

      // Use already-loaded profile or fetch if not available
      let profile = childProfile;
      
      if (!profile) {
        try {
          console.log('👤 Profile not loaded yet, fetching from /api/onboarding...');
          const onboardingResponse = await fetch('/api/onboarding', {
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          console.log('📡 Onboarding response status:', onboardingResponse.status);

          if (onboardingResponse.ok) {
            profile = await onboardingResponse.json();
            console.log('✅ Child profile loaded:', profile?.childName);
            if (profile) {
              setChildProfile(profile);
            }
          } else {
            const errorText = await onboardingResponse.text();
            console.error('❌ Failed to load profile:', onboardingResponse.status, errorText);
            throw new Error('Unable to load your profile. Please try refreshing the page.');
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          setIsLoadingWords(false);
          toast({
            title: "Unable to Load Profile",
            description: error instanceof Error ? error.message : "Please check your connection and try again.",
            variant: "destructive"
          });
          return;
        }
      } else {
        console.log('✅ Using already-loaded profile:', profile.childName);
      }

      // Ensure profile is loaded
      if (!profile) {
        console.error('❌ No profile available');
        setIsLoadingWords(false);
        toast({
          title: "Profile Required",
          description: "Please complete onboarding first.",
          variant: "destructive"
        });
        return;
      }

      // At this point, profile is guaranteed to be non-null
      const loadedProfile: ChildProfile = profile;

      try {
          
          // Set random cheerful character based on interests
          const iconComponents = [
            <Sparkles className="w-5 h-5 text-yellow-500" />,
            <Heart className="w-5 h-5 text-pink-500" />,
            <Zap className="w-5 h-5 text-blue-500" />,
            <Trophy className="w-5 h-5 text-amber-500" />,
            <Palette className="w-5 h-5 text-purple-500" />,
            <Music className="w-5 h-5 text-green-500" />,
            <Camera className="w-5 h-5 text-indigo-500" />,
            <Gamepad2 className="w-5 h-5 text-red-500" />
          ];
          if (loadedProfile.interests?.includes('animals')) {
            const animalIcons = [
              <PawPrint className="w-5 h-5 text-orange-500" />,
              <Rabbit className="w-5 h-5 text-gray-600" />,
              <Fish className="w-5 h-5 text-blue-600" />,
              <Heart className="w-5 h-5 text-pink-500" />,
              <Sparkles className="w-5 h-5 text-yellow-500" />
            ];
            setCheerfulCharacter(animalIcons[Math.floor(Math.random() * animalIcons.length)]);
          } else {
            setCheerfulCharacter(iconComponents[Math.floor(Math.random() * iconComponents.length)]);
          }
          
          // Generate story mode with integrated words OR classic mode words OR challenge words
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              if (gameMode === 'story') {
                // Story Mode: Generate story with integrated words
                console.log('📖 Generating story mode with integrated words...');
                setIsLoadingStory(true);
                
                const storyResponse = await fetch('/api/ai/generate-story', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    childProfile: {
                      childName: loadedProfile.childName || 'friend',
                      interests: loadedProfile.interests || []
                    },
                    wordCount: 15
                  })
                });

                if (!storyResponse.ok) {
                  throw new Error('Failed to generate story');
                }

                const story = await storyResponse.json();
                
                if (!story.words || story.words.length === 0) {
                  throw new Error('No words in story');
                }

                // Convert story words to PersonalizedWord format
                const storyWords = story.words.map((sw: any) => ({
                  word: sw.word,
                  phonetic: sw.phonetic,
                  difficulty: sw.difficulty,
                  category: 'story',
                  therapyFocus: 'consonants',
                  visualCue: <Sparkles className="w-6 h-6 text-yellow-500" />, // Icon from scene
                  contextSentence: sw.storyContext,
                  encouragement: sw.successNarrative,
                  ageAppropriate: true
                }));

                setPersonalizedWords(storyWords);
                setStoryContext(story);
                setIsLoadingStory(false);
                
                // ✅ IMPORTANT: Show story opening after story context is loaded
                if (gameData?.selectedMode?.type === 'story-adventure' || gameMode === 'story') {
                  console.log('📖 Triggering story opening after story context loaded');
                  setShowStoryOpening(true);
                }
                
                // Show story introduction
                toast({
                  title: story.title,
                  description: story.introduction,
                  duration: 6000
                });

                console.log('✅ Story mode initialized with', storyWords.length, 'words');
                
                // Generate companion character for story mode
                try {
                  const companionResponse = await fetch('/api/ai/generate-companion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      childProfile: {
                        childName: loadedProfile.childName || 'friend',
                        interests: loadedProfile.interests || []
                      }
                    })
                  });
                  
                  if (companionResponse.ok) {
                    const companion = await companionResponse.json();
                    setCompanionCharacter(companion);
                    console.log('🦊 Companion character:', companion.name, companion.emoji);
                  }
                } catch (error) {
                  console.warn('⚠️ Companion generation failed, using default');
                  setCompanionCharacter({
                    name: 'Sparkle',
                    emoji: <Sparkles className="w-5 h-5 text-yellow-500" />,
                    personality: 'encouraging and friendly'
                  });
                }
                
                break;
                
              } else if (gameMode === 'challenge') {
                // Challenge Mode: Generate words for specific challenge
                console.log('🎮 Generating challenge mode words...', selectedChallengeMode);
                console.log('📊 Challenge Mode Details:', {
                  mode: selectedChallengeMode,
                  modeInfo: challengeModes.find(m => m.id === selectedChallengeMode),
                  allModes: challengeModes.map(m => m.id)
                });
                
                const challengeResponse = await fetch('/api/ai/challenge-words', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    mode: selectedChallengeMode,
                    count: 10,
                    childProfile: {
                      childName: loadedProfile.childName,
                      interests: loadedProfile.interests || []
                    }
                  })
                });

                if (!challengeResponse.ok) {
                  throw new Error('Failed to generate challenge words');
                }

                const challengeData = await challengeResponse.json();
                
                if (!challengeData.words || challengeData.words.length === 0) {
                  throw new Error('No challenge words generated');
                }

                // Convert challenge words to PersonalizedWord format
                const challengeWords = challengeData.words.map((cw: any) => ({
                  word: cw.word,
                  phonetic: cw.phonetic,
                  difficulty: cw.difficulty || 5,
                  category: 'challenge',
                  therapyFocus: 'consonants',
                  visualCue: <Target className="w-6 h-6 text-blue-500" />,
                  contextSentence: cw.context || '',
                  encouragement: `Great job on this ${selectedChallengeMode} challenge!`,
                  ageAppropriate: true
                }));

                setPersonalizedWords(challengeWords);
                
                // Show challenge start message
                const modeName = challengeModes.find(m => m.id === selectedChallengeMode)?.name || 'Challenge';
                toast({
                  title: `${modeName} Started!`,
                  description: `Get ready for the challenge!`,
                  duration: 4000
                });

                console.log('✅ Challenge mode initialized with', challengeWords.length, 'words');
                break;
                
              } else if (gameMode === 'conquest') {
                // 🏆 CONQUEST MODE (Daily Quest): Themed adventure with story and rewards
                console.log('🏆 Generating Daily Quest (Conquest Mode) words...', {
                  theme: dailyChallenge?.theme,
                  emoji: dailyChallenge?.emoji,
                  difficulty: dailyChallenge?.difficulty,
                  targetScore: dailyChallenge?.targetScore
                });
                
                const conquestResponse = await fetch('/api/ai/conquest-words', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    theme: dailyChallenge?.theme || 'Adventure Quest',
                    emoji: dailyChallenge?.emoji || <Sparkles className="w-5 h-5 text-yellow-500" />,
                    difficulty: dailyChallenge?.difficulty || 'medium',
                    count: 12, // More words for conquest mode
                    childProfile: {
                      childName: loadedProfile.childName,
                      interests: loadedProfile.interests || []
                    }
                  })
                });

                if (!conquestResponse.ok) {
                  throw new Error('Failed to generate conquest words');
                }

                const conquestData = await conquestResponse.json();
                
                if (!conquestData.words || conquestData.words.length === 0) {
                  throw new Error('No conquest words generated');
                }

                // Convert conquest words to PersonalizedWord format
                const conquestWords = conquestData.words.map((cw: any) => ({
                  word: cw.word,
                  phonetic: cw.phonetic,
                  difficulty: cw.difficulty || 5,
                  category: 'conquest',
                  therapyFocus: 'consonants',
                  visualCue: dailyChallenge?.emoji || <Trophy className="w-6 h-6 text-yellow-600" />,
                  contextSentence: cw.context || '',
                  encouragement: `Amazing work on today's ${dailyChallenge?.theme || 'quest'}!`,
                  ageAppropriate: true
                }));

                setPersonalizedWords(conquestWords);
                
                // Show conquest start message with theme
                toast({
                  title: `${dailyChallenge?.theme || 'Daily Quest'}!`,
                  description: dailyChallenge?.description || 'Complete today\'s special quest!',
                  duration: 5000
                });

                console.log('✅ Conquest mode initialized with', conquestWords.length, 'words');
                break;
                
              } else {
                // Classic Mode: Generate words without story
                console.log('📝 Generating classic mode words...');
                const words = await aiSpeechService.generatePersonalizedWords(loadedProfile, 'practice');
                if (words && words.length > 0) {
                  setPersonalizedWords(words);
                  break;
                } else {
                  throw new Error('No words generated');
                }
              }
            } catch (error) {
              retryCount++;
              setIsLoadingStory(false);
              if (retryCount >= maxRetries) {
                throw new Error(`Failed to generate game after ${maxRetries} attempts. Please check your connection and try again.`);
              }
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
            }
          }
        
      } catch (error) {
        console.error('Error initializing game:', error);
        setIsLoadingWords(false);
        toast({
          title: "Unable to Create Personalized Game",
          description: error instanceof Error ? error.message : "AI service is currently unavailable. Please check your connection and try again.",
          variant: "destructive"
        });
        return;
      } finally {
        setIsLoadingWords(false);
      }
    };

    initializeGame();
  }, [gameData, showModeSelector, gameMode, selectedChallengeMode, childProfile]);

  // ============================================================================
  // AI ENHANCEMENT FUNCTIONS
  // ============================================================================

  /**
   * Initialize Story Mode - Generate adventure narrative
   * Note: This is now called inline during initializeGame() to ensure words and story match
   */
  const initializeStoryMode = async () => {
    // This function is kept for future use (e.g., regenerating story)
    // Currently called inline during game initialization
    console.log('⚠️ initializeStoryMode called - story should be generated during initializeGame()');
  };

  /**
   * Check emotional state every few words
   */
  const checkEmotionalState = async () => {
    if (attempts.length < 3) return; // Need some data first

    try {
      const recentAttempts = attempts.slice(-10); // Last 10 attempts
      
      // Track recent failures
      const recentFailCount = recentAttempts.filter(a => !a.correct).length;
      setRecentFailures(recentFailCount);
      
      //  TRIGGER EMOTIONAL SUPPORT MODAL after 3 consecutive failures
      if (recentFailCount >= 3 && recentAttempts.length >= 3) {
        const lastThree = recentAttempts.slice(-3);
        const allFailed = lastThree.every(a => !a.correct);
        
        if (allFailed) {
          console.log('😟 Child is struggling - showing emotional support modal');
          setShowEmotionalSupport(true);
          return; // Don't make API call if we're showing support modal
        }
      }
      
      const response = await fetch('/api/ai/detect-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          attempts: recentAttempts.map(a => ({
            word: a.word,
            accuracy: a.accuracy,
            attempt: a.attempt,
            correct: a.correct,
            timestamp: a.timestamp
          }))
        })
      });

      if (!response.ok) return;

      const emotionalData = await response.json();
      setEmotionalState(emotionalData);

      // If intervention needed, get empathetic response
      if (emotionalData.interventionNeeded) {
        console.log('⚠️ Emotional intervention needed:', emotionalData.emotion);
        
        const messageResponse = await fetch('/api/ai/empathetic-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            emotionalState: emotionalData,
            childName: childProfile?.childName || 'friend',
            context: {
              currentWord: currentWord?.word,
              wordNumber: currentWordIndex + 1,
              totalWords: personalizedWords.length
            },
            companionCharacter
          })
        });

        if (messageResponse.ok) {
          const message = await messageResponse.text();
          setCompanionDialogue(message);
          
          // Show companion support in companion dialogue box (not toast)
          console.log('💛 Companion support:', message);
        }
      }

    } catch (error) {
      console.error('❌ Emotional check error:', error);
      // Silent fail - don't interrupt game
    }
  };

  /**
   * Check for achievements and generate rewards
   */
  const checkAchievementsAndRewards = async () => {
    try {
      console.log('🎁 Checking for achievements...', {
        attemptsCount: attempts.length,
        streak,
        stars,
        score,
        currentWordIndex
      });
      
      const response = await fetch('/api/ai/check-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          attempts: attempts.map(a => ({
            word: a.word,
            accuracy: a.accuracy,
            correct: a.correct,
            attempt: a.attempt,
            timestamp: a.timestamp
          })),
          sessionData: {
            streak,
            maxStreak,
            stars,
            score,
            accuracy: totalAccuracy / (currentWordIndex + 1),
            completedWords: currentWordIndex + 1,
            totalWords: personalizedWords.length
          }
        })
      });

      if (!response.ok) {
        console.warn('❌ Achievement check failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('🏆 Achievement check result:', data);
      
      if (data.hasNewAchievements && data.achievements.length > 0) {
        console.log('🎁 New achievements unlocked:', data.achievements);
        
        // Generate reward for first achievement
        const rewardResponse = await fetch('/api/ai/generate-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            achievement: data.achievements[0],
            childProfile: {
              childName: childProfile?.childName || 'Star',
              interests: childProfile?.interests || []
            },
            performanceData: {
              streak,
              stars,
              score
            }
          })
        });

        if (rewardResponse.ok) {
          const reward = await rewardResponse.json();
          console.log('🎉 Reward generated:', reward);
          setSurpriseReward(reward);
          setShowRewardModal(true);
        } else {
          console.warn('❌ Reward generation failed:', rewardResponse.status);
        }
      } else {
        console.log('ℹ️ No new achievements yet');
      }

    } catch (error) {
      console.error('❌ Achievement check error:', error);
      // Silent fail
    }
  };

  // Note: Story mode is now initialized inline during initializeGame()
  // No need for separate effect since story and words are generated together

  // Check emotional state every 3 words
  useEffect(() => {
    if (currentWordIndex > 0 && currentWordIndex % 3 === 0) {
      checkEmotionalState();
    }
  }, [currentWordIndex]);

  const startEnhancedListening = async () => {
    if (isGroqListening || !currentWord || isGeneratingFeedback) {
      console.log('⚠️ Cannot start listening - already in progress or no current word');
      return;
    }

    // 🔒 COMPREHENSIVE AUDIO STATE CHECK
    if (AudioStateController.isAnyAudioActive()) {
      console.log('⚠️ Cannot start recording - audio operation is active');
      console.log('Current audio state:', AudioStateController.getState());
      
      if (isAISpeaking) {
        toast({
          title: "Please Wait",
          description: "Waiting for the word to finish playing...",
          variant: "default",
          duration: 2000
        });
      } else if (isAIGenerating) {
        toast({
          title: "Please Wait",
          description: "AI is processing your response...",
          variant: "default",
          duration: 2000
        });
      } else {
        toast({
          title: "Please Wait",
          description: "Another audio operation is active...",
          variant: "default",
          duration: 2000
        });
      }
      return;
    }

    // Check microphone permission first
    if (hasMicrophonePermission === false) {
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone access in your browser settings and refresh the page.",
        variant: "destructive",
        duration: 10000
      });
      return;
    }

    // If permission check is still pending, wait a moment
    if (hasMicrophonePermission === null) {
      toast({
        title: "Please Wait",
        description: "Checking microphone access...",
        variant: "default",
        duration: 2000
      });
      return;
    }

    try {
      console.log('🎤 Starting Groq Whisper speech recognition for:', currentWord.word);
      
      // ✅ CRITICAL: Emergency reset and cancel any ongoing speech synthesis
      if ('speechSynthesis' in window && speechSynthesis.speaking) {
        console.log('🔇 Emergency cancelling ongoing speech before recording...');
        speechSynthesis.cancel();
        AudioStateController.resetAll();
        // Wait for speech to actually stop (important!)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 🎤 Start user speaking state
      if (!AudioStateController.startUserSpeaking()) {
        console.log('❌ Failed to start user speaking - audio conflict');
        return;
      }
      
      setIsGroqListening(true);
      setIsListening(true);
      
      // Use dedicated Child Speech STT for accurate word recognition
      console.log('🎤 Using Child Speech STT for word:', currentWord.word);
      const result = await childSpeechService.recordAndTranscribe(8000, currentWord.word);
      console.log('✅ Child Speech STT result:', result);
      
      // 🛑 Stop user speaking state - recording complete
      AudioStateController.stopUserSpeaking();
      setIsGroqListening(false);
      setIsListening(false);
      
      if (result && result.text && result.text.trim() !== '') {
        // Convert ChildSpeechResult to GroqSpeechResult format for compatibility
        const compatibleResult: GroqSpeechResult = {
          text: result.text,
          confidence: result.confidence,
          language: result.language || 'en',
          duration: result.duration
        };
        
        // Process the result using existing handler
        await handleGroqSpeechResult(compatibleResult);
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking clearly into your microphone.",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('❌ Reliable speech recognition error:', error);
      
      // 🛑 Stop user speaking state on error
      AudioStateController.stopUserSpeaking();
      setIsGroqListening(false);
      setIsListening(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        toast({
          title: "Microphone Permission Denied",
          description: "Please allow microphone access in your browser settings.",
          variant: "destructive"
        });
      } else if (errorMessage.includes('not found') || errorMessage.includes('NotFoundError')) {
        toast({
          title: "No Microphone Found",
          description: "Please connect a microphone and try again.",
          variant: "destructive"
        });
      } else if (errorMessage.includes('not readable') || errorMessage.includes('NotReadableError')) {
        toast({
          title: "Microphone In Use",
          description: "Your microphone might be used by another application. Please close other apps and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Speech Recognition Error",
          description: errorMessage || "Please check your microphone and try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleGroqSpeechResult = async (result: GroqSpeechResult) => {
    // Get the CURRENT word from the live state
    const liveCurrentWord = personalizedWords[currentWordIndex];
    
    // Early exit if we're no longer listening or if currentWord is null
    if (!liveCurrentWord || isGeneratingFeedback) {
      console.log('⚠️ Ignoring Groq speech result - no current word or already generating feedback');
      return;
    }
    
    // 🤖 Start AI generating state
    AudioStateController.startAIGenerating();
    setIsGeneratingFeedback(true);
    setIsGroqListening(false);
    const targetWord = liveCurrentWord.word.toLowerCase();
    
    console.log('🎯 handleGroqSpeechResult called:', {
      currentWordIndex,
      currentWord: liveCurrentWord?.word,
      targetWord,
      transcript: result.text,
      confidence: result.confidence,
      currentAttempt
    });
    
    // Use AI-powered pronunciation validation instead of hardcoded logic
    let analysis: {
      accuracy: number;
      phonemeAccuracy: number[];
      suggestions: string[];
      isCorrect: boolean;
    };

    try {
      console.log('🤖 Calling AI pronunciation validator...');
      const validation = await aiSpeechService.validatePronunciation(
        targetWord,
        result.text.trim(),
        result.confidence
      );

      console.log('✅ AI Validation Result:', validation);

      analysis = {
        accuracy: validation.accuracy,
        phonemeAccuracy: validation.phonemeErrors.length > 0 
          ? new Array(targetWord.length).fill(Math.max(50, 100 - validation.phonemeErrors.length * 20))
          : new Array(targetWord.length).fill(100),
        suggestions: validation.suggestions,
        isCorrect: validation.isCorrect
      };

      // Show AI feedback immediately
      if (!validation.isCorrect && validation.feedback) {
        console.log('❌ Pronunciation incorrect:', validation.feedback);
      }
    } catch (error) {
      console.error('⚠️ AI validation failed, using fallback analysis:', error);
      // Fallback to basic analysis if AI fails
      analysis = PronunciationAnalyzer.analyzePronunciation(
        targetWord, 
        result.text, 
        result.confidence
      );
    }

    const attemptData = {
      word: liveCurrentWord.word,
      transcript: result.text,
      accuracy: analysis.accuracy,
      correct: analysis.isCorrect,
      confidence: result.confidence,
      attempt: currentAttempt,
      timestamp: new Date(),
      phonemeAccuracy: analysis.phonemeAccuracy,
      suggestions: analysis.suggestions,
      source: 'groq-whisper-ai-validated',
      duration: result.duration
    };

    setAttempts([...attempts, attemptData]);

    // Generate AI-powered feedback
    const childAge = childProfile?.childBirthYear ? 
      new Date().getFullYear() - childProfile.childBirthYear : 5;
    
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount < maxRetries) {
      try {
        const aiFeedback = await aiSpeechService.generateEncouragingFeedback(
          childProfile?.childName || 'friend',
          liveCurrentWord.word,
          result.text,
          analysis.accuracy,
          currentAttempt,
          childAge,
          childProfile?.interests
        );
        
        // Add Groq-specific technical feedback
        if (result.confidence > 0.9) {
          aiFeedback.technicalTip = "Excellent clarity! Your voice was crystal clear.";
        } else if (result.confidence > 0.7) {
          aiFeedback.technicalTip = "Good pronunciation! Try speaking a bit more clearly.";
        }
        
        setFeedback(aiFeedback);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Failed to generate AI feedback after retries:', error);
          setFeedback({
            message: "Great attempt!",
            encouragement: "Keep practicing! You're doing wonderfully!",
            emotionalTone: "supportive"
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
    }

    setShowFeedback(true);
    setIsGeneratingFeedback(false);
    // 🛑 Stop AI generating state
    AudioStateController.stopAIGenerating();

    // Update scoring system ( Using functional updates to prevent stale state)
    let pointsEarned = analysis.accuracy;
    if (analysis.isCorrect && currentAttempt === 1) {
      pointsEarned += 20; // Bonus for first try
      setStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        setMaxStreak(prevMax => Math.max(prevMax, newStreak));
        return newStreak;
      });
    } else if (analysis.isCorrect) {
      pointsEarned += 10; // Smaller bonus for later attempts
      setStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        setMaxStreak(prevMax => Math.max(prevMax, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0); // Reset streak
    }

    // Award stars based on performance ( Using functional update)
    if (analysis.accuracy >= 90) setStars(prevStars => prevStars + 3);
    else if (analysis.accuracy >= 70) setStars(prevStars => prevStars + 2);
    else if (analysis.accuracy >= 50) setStars(prevStars => prevStars + 1);

    // Update score ( Using functional update)
    setScore(prevScore => {
      const newScore = prevScore + pointsEarned;
      const newAccuracy = Math.round(newScore / ((currentWordIndex + 1) * 100) * 100);
      console.log('📊 Score Update:', {
        prevScore,
        pointsEarned,
        newScore,
        currentWordIndex,
        calculatedAccuracy: newAccuracy
      });
      setTotalAccuracy(newAccuracy);
      return newScore;
    });

    // Auto-advance logic
    setTimeout(() => {
      setShowFeedback(false);
      
      if (analysis.isCorrect) {
        console.log('✅ Correct answer - advancing to next word');
        
        // 🎉 Update story progress (if in story mode)
        if (gameMode === 'story') {
          setAnimalsHelped(prev => prev + 1);
          setStoryProgress(((currentWordIndex + 1) / personalizedWords.length) * 100);
          
          // Show celebration for story milestones
          if ((currentWordIndex + 1) % 5 === 0) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }
        }
        
        // Reset recent failures counter on success
        setRecentFailures(0);
        
        // ALWAYS check for achievements and rewards on correct answer
        // Don't await - let it run in background so game continues smoothly
        checkAchievementsAndRewards().catch(err => 
          console.error('Achievement check failed:', err)
        );
        
        if (currentWordIndex < personalizedWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setCurrentAttempt(1);
        } else {
          completeGame();
        }
      } else if (currentAttempt < maxAttempts) {
        console.log(`🔄 Attempt ${currentAttempt} failed - allowing retry`);
        setCurrentAttempt(currentAttempt + 1);
        toast({
          title: `Try ${currentAttempt + 1} of ${maxAttempts}!`,
          description: "You can do it!",
        });
      } else {
        console.log('⏭️ All attempts used - auto-advancing to next word');
        toast({
          title: "Let's try the next word!",
          description: "Don't worry, practice makes perfect!",
        });
        
        if (currentWordIndex < personalizedWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setCurrentAttempt(1);
        } else {
          completeGame();
        }
      }
    }, 3000);
  };

  const stopListening = () => {
    if (groqListeningControllerRef.current && isGroqListening) {
      groqListeningControllerRef.current.stop();
      setIsGroqListening(false);
    }
    setIsListening(false);
    console.log('🛑 Stopped listening');
  };

  const cleanupSpeechRecognition = () => {
    // Stop any ongoing speech recognition
    stopListening();
    
    // Reset speech recognition state
    setIsListening(false);
    setIsGroqListening(false);
    setIsGeneratingFeedback(false);
    // 🛑 Stop AI generating state
    AudioStateController.stopAIGenerating();
    
    console.log('🧹 Cleaning up speech recognition before word advance');
  };



  const completeGame = async () => {
    // Generate AI session summary with retry mechanism
    const wordsCompleted = attempts.filter(a => a.correct).length;
    const childAge = childProfile?.childBirthYear ? 
      new Date().getFullYear() - childProfile.childBirthYear : 5;

    console.log('🎯 Game Complete - Final Stats:', {
      score,
      stars,
      maxStreak,
      totalAccuracy,
      wordsAttempted: personalizedWords.length,
      wordsCompleted,
      attempts: attempts.length,
      gameMode,
      sessionId
    });

    // ============================================================================
    // SYNCHRONIZED COMPLETION FLOW: Achievements → Rewards → Summary → Save All
    // ============================================================================
    
    let achievements: any[] = [];
    let rewards: any[] = [];
    let summary: any = null;

    try {
      // STEP 1: Check for achievements
      console.log('🏆 Step 1: Checking achievements...');
      const achievementResponse = await fetch('/api/ai/check-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionData: {
            score,
            stars,
            streak: maxStreak,
            accuracy: totalAccuracy,
            wordsCompleted,
            gameMode,
            childName: childProfile?.childName
          }
        })
      });

      if (achievementResponse.ok) {
        const data = await achievementResponse.json();
        achievements = data.achievements || [];
        console.log(`🎉 Unlocked ${achievements.length} achievements:`, achievements);
      }

      // STEP 2: Generate and save rewards for each achievement
      if (achievements.length > 0) {
        console.log('🎁 Step 2: Generating rewards...');
        
        // Track unlocked reward IDs to prevent duplicates
        const unlockedRewardIds = new Set<string>();
        
        for (const achievement of achievements) {
          try {
            // Generate reward
            const rewardResponse = await fetch('/api/ai/generate-reward', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                achievementName: achievement,
                childProfile: {
                  childName: childProfile?.childName,
                  interests: childProfile?.interests || []
                }
              })
            });

            if (rewardResponse.ok) {
              const reward = await rewardResponse.json();
              
              // Create unique ID for reward to prevent duplicates
              const rewardId = `${reward.type}_${reward.name}`;
              
              if (!unlockedRewardIds.has(rewardId)) {
                unlockedRewardIds.add(rewardId);
                rewards.push(reward);

                // SAVE reward to database
                console.log('💾 Saving reward to database:', reward.name);
                await fetch('/api/games/save-reward', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    rewardData: {
                      sessionId,
                      childName: childProfile?.childName || 'Child',
                      rewardType: reward.type,
                      rewardName: reward.name,
                      rarity: reward.rarity,
                      icon: reward.icon,
                      description: reward.description,
                      achievement: achievement,
                      abilities: reward.abilities,
                      collectionProgress: reward.collectionProgress,
                      gameMode,
                      metadata: {
                        score,
                        streak: maxStreak,
                        accuracy: totalAccuracy,
                        wordsCompleted
                      }
                    }
                  })
                }).catch(err => {
                  console.error('Failed to save reward:', err);
                  // Continue even if save fails
                });
              } else {
                console.log('⏭️ Skipping duplicate reward:', rewardId);
              }
            }
          } catch (error) {
            console.error('Error generating/saving reward:', error);
            // Continue with other rewards
          }
        }

        console.log(`✅ Generated and saved ${rewards.length} unique rewards`);
      }

      // STEP 3: Generate session summary
      console.log('📊 Step 3: Generating session summary...');
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // 🏆 CONQUEST MODE: Generate quest-specific summary
          if (gameMode === 'conquest' && dailyChallenge) {
            console.log('🏆 Generating conquest mode summary...');
            const questCompleted = score >= dailyChallenge.targetScore;
            const accuracyMet = totalAccuracy >= (dailyChallenge.targetAccuracy || 70);
            
            const conquestSummaryResponse = await fetch('/api/ai/conquest-summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                childName: childProfile?.childName || 'Hero',
                childAge,
                theme: dailyChallenge.theme,
                emoji: dailyChallenge.emoji,
                targetScore: dailyChallenge.targetScore,
                actualScore: score,
                targetAccuracy: dailyChallenge.targetAccuracy,
                actualAccuracy: totalAccuracy,
                wordsCompleted,
                totalWords: personalizedWords.length,
                maxStreak,
                questCompleted,
                accuracyMet,
                interests: childProfile?.interests || []
              })
            });
            
            if (conquestSummaryResponse.ok) {
              summary = await conquestSummaryResponse.json();
              console.log('✅ Conquest summary generated');
            } else {
              throw new Error('Failed to generate conquest summary');
            }
          } 
          // 📖 STORY MODE: Generate story-themed summary
          else if (gameMode === 'story' && storyContext) {
            console.log('📖 Generating story mode summary...');
            
            const storySummaryResponse = await fetch('/api/ai/story-summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                childName: childProfile?.childName || 'Hero',
                childAge,
                storyTheme: storyContext.theme || 'Magical Adventure',
                storyTitle: storyContext.title || 'The Enchanted Forest',
                totalWords: personalizedWords.length,
                wordsCompleted,
                actualAccuracy: totalAccuracy,
                actualScore: score,
                maxStreak,
                interests: childProfile?.interests || []
              })
            });
            
            if (storySummaryResponse.ok) {
              summary = await storySummaryResponse.json();
              console.log('✅ Story summary generated');
            } else {
              throw new Error('Failed to generate story summary');
            }
          } 
          // 🎯 CHALLENGE/CLASSIC MODE: Regular summary
          else {
            summary = await aiSpeechService.generateSessionSummary(
              childProfile?.childName || 'friend',
              personalizedWords.length,
              wordsCompleted,
              totalAccuracy,
              score,
              childAge,
              childProfile?.interests
            );
          }

          console.log('✅ Session summary generated');
          break;

        } catch (error) {
          retryCount++;
          console.warn(`Failed to generate session summary (attempt ${retryCount}):`, error);
          
          if (retryCount >= maxRetries) {
            console.error('Max retries reached for session summary generation');
            
            // Fallback summary based on mode
            if (gameMode === 'conquest' && dailyChallenge) {
              const questCompleted = score >= dailyChallenge.targetScore;
              summary = {
                title: questCompleted ? `Quest Complete!` : `Great Effort!`,
                message: questCompleted 
                  ? `Amazing work! You conquered the ${dailyChallenge.theme} and earned your reward!`
                  : `You gave it your best shot in the ${dailyChallenge.theme}! Keep practicing and you'll conquer it next time!`,
                celebrationMessage: questCompleted ? "Quest Victory!" : "Brave Attempt!"
              };
            } else if (gameMode === 'story' && storyContext) {
              const storyCompleted = wordsCompleted === personalizedWords.length;
              summary = {
                title: storyCompleted ? `${storyContext.title} - Complete!` : `${storyContext.title}`,
                message: storyCompleted
                  ? `What an amazing adventure, ${childProfile?.childName}! You completed the entire story! You practiced ${wordsCompleted} words and scored ${score} points!`
                  : `Great work, ${childProfile?.childName}! You're making wonderful progress in your story adventure! You completed ${wordsCompleted} out of ${personalizedWords.length} words!`,
                celebrationMessage: storyCompleted ? "Story Complete!" : "Adventure Continues!",
                isStoryComplete: storyCompleted
              };
            } else {
              summary = {
                title: `${childProfile?.childName}'s Practice Session`,
                celebrationMessage: "Great job! You worked hard today!"
              };
            }
            break;
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      // STEP 4: Save session summary to database
      if (summary) {
        console.log('💾 Step 4: Saving session summary to database...');
        try {
          await fetch('/api/games/save-session-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              summaryData: {
                sessionId,
                childName: childProfile?.childName || 'Child',
                gameMode,
                title: summary.title || `${childProfile?.childName}'s Session`,
                celebrationMessage: summary.celebrationMessage || 'Amazing work!',
                stats: {
                  totalScore: score,
                  starsEarned: Math.floor(stars / 10),
                  bestStreak: maxStreak,
                  accuracy: totalAccuracy,
                  timeSpent: Math.floor((Date.now() - new Date().getTime()) / 1000),
                  wordsAttempted: personalizedWords.length,
                  wordsCompleted,
                  perfectFirstTries: attempts.filter(a => a.correct && a.attemptNumber === 1).length
                },
                achievements: achievements.map(a => ({
                  id: a,
                  name: a,
                  earnedAt: new Date()
                })),
                rewards: rewards.map(r => ({
                  type: r.type,
                  name: r.name,
                  rarity: r.rarity,
                  icon: r.icon,
                  description: r.description
                })),
                insights: {
                  soundImprovement: {
                    targetSound: personalizedWords[0]?.therapyFocus || 'various',
                    currentAccuracy: totalAccuracy
                  },
                  strengths: [],
                  areasToImprove: [],
                  readyForNext: []
                },
                companionMessage: companionCharacter ? {
                  character: companionCharacter.name,
                  emoji: companionCharacter.emoji,
                  message: companionDialogue || `Great work, ${childProfile?.childName}!`
                } : undefined,
                startedAt: new Date(),
                wordHistory: attempts.map(a => ({
                  word: a.word,
                  targetSound: a.word,
                  attempts: attempts.filter(att => att.word === a.word).length,
                  finalAccuracy: a.accuracy,
                  isCorrect: a.correct,
                  timeSpent: 30 // approximate
                }))
              }
            })
          });
          console.log('✅ Session summary saved to database');
        } catch (error) {
          console.error('Failed to save session summary:', error);
          // Continue - we still show the summary UI
        }
      }

      // STEP 5: Update child progress
      console.log('💾 Step 5: Updating child progress...');
      try {
        await fetch('/api/games/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sessionData: {
              sessionId,
              childName: childProfile?.childName || 'Child',
              gameMode,
              score,
              stars: Math.floor(stars / 10),
              accuracy: totalAccuracy,
              streak: maxStreak,
              wordsCompleted,
              duration: Math.floor((Date.now() - new Date().getTime()) / 1000)
            }
          })
        });
        console.log('✅ Child progress updated');
      } catch (error) {
        console.error('Failed to update progress:', error);
        // Continue - we still show the summary UI
      }

      // STEP 6: Save to legacy session/complete endpoint (for compatibility)
      console.log('💾 Step 6: Saving to legacy session endpoint...');
      try {
        const gameData = {
          personalizedWords: personalizedWords,
          wordsAttempted: attempts.map(a => ({
            word: a.word,
            attempts: attempts.filter(att => att.word === a.word).length,
            accuracy: a.accuracy,
            phonemeAccuracy: a.phonemeAccuracy,
            suggestions: a.suggestions,
            timestamp: a.timestamp
          })),
          aiGenerated: true,
          childProfile: childProfile,
          finalStats: {
            stars,
            streak: maxStreak,
            totalAccuracy,
            score
          }
        };

        await fetch(`/api/games/session/${sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            score,
            accuracy: totalAccuracy,
            gameData
          })
        });
        console.log('✅ Legacy session data saved');
      } catch (error) {
        console.error('Failed to save legacy session:', error);
      }

      // STEP 7: Show summary UI with rewards
      console.log('🎉 Step 7: Showing summary UI...');
      setSessionSummary(summary);
      setAchievementsUnlocked(achievements);
      
      // 🏆 STEP 8: Complete Daily Quest if this was a daily quest game
      if (gameMode === 'challenge' && dailyChallenge && !dailyChallenge.isCompleted) {
        console.log('🏆 Step 8: Checking daily quest completion...');
        try {
          const response = await fetch('/api/games/daily-quest/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              sessionId,
              score,
              accuracy: totalAccuracy
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Daily quest completed!', data);
            
            // Add bonus reward to rewards array
            if (data.bonusReward) {
              rewards.push({
                type: data.bonusReward.type,
                name: data.bonusReward.name,
                rarity: data.bonusReward.rarity,
                icon: data.bonusReward.icon,
                description: data.bonusReward.description,
                achievement: `Daily Quest Bonus: ${dailyChallenge.theme}`,
                abilities: [`+${data.streakBonus} Streak Bonus Points!`],
                collectionProgress: {
                  category: 'Daily Quests',
                  current: data.newStreak,
                  total: 30,
                  nextReward: 'Legendary Calendar Badge'
                }
              });
              
              toast({
                title: "Daily Quest Complete!",
                description: `${data.newStreak} day streak! +${data.streakBonus} bonus points!`,
                variant: "default"
              });
            }
          } else {
            const error = await response.json();
            console.warn('⚠️ Daily quest not completed:', error.error);
            
            // Show why quest wasn't completed
            if (error.required) {
              toast({
                title: "Almost there!",
                description: `Daily quest needs ${error.required.score} points and ${error.required.accuracy}% accuracy. You got ${error.achieved.score} points and ${error.achieved.accuracy}% accuracy. Try again!`,
                variant: "default"
              });
            }
          }
        } catch (error) {
          console.error('❌ Error completing daily quest:', error);
          // Don't fail the whole flow, just log it
        }
      }
      
      // Show first reward modal if we have rewards
      if (rewards.length > 0) {
        setSurpriseReward(rewards[0]);
        setShowRewardModal(true);
        // We'll show session summary after reward modal is closed
      } else {
        setShowSessionSummary(true);
      }

      console.log('✅ Complete game flow finished successfully!');
      
    } catch (error) {
      console.error('❌ Error in complete game flow:', error);
      
      // Fallback: Show basic summary even if everything fails
      setSessionSummary({
        title: `${childProfile?.childName || 'Your'} Practice Session`,
        celebrationMessage: `Great job! You scored ${score} points!`
      });
      setShowSessionSummary(true);
      
      toast({
        title: "Session Complete!",
        description: "We had trouble saving your data, but you still did amazing!",
        variant: "default"
      });
    }
  };

  const skipWord = () => {
    // Deduct points for skipping
    const newScore = Math.max(0, score - 30);
    setScore(newScore);
    setStreak(0); // Reset streak
    
    cleanupSpeechRecognition();
    
    toast({
      title: "Word Skipped",
      description: "No worries! Let's try the next word!",
    });

    if (currentWordIndex < personalizedWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentAttempt(1);
      setShowFeedback(false);
    } else {
      completeGame();
    }
  };

  const handleEndSession = () => {
    // Stop listening and cleanup
    cleanupSpeechRecognition();
    
    // Clear challenge timer
    if (challengeTimerRef.current) {
      clearInterval(challengeTimerRef.current);
      challengeTimerRef.current = null;
    }
    
    console.log('⏰ Challenge timer ended - completing game session');
    
    // Complete the game
    completeGame();
  };

  const playWordAudio = () => {
    // 🔒 Check audio state before starting
    if (AudioStateController.isAnyAudioActive()) {
      console.log('⚠️ Cannot play audio - another audio operation is active');
      console.log('Current audio state:', AudioStateController.getState());
      return;
    }

    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // 🔊 Start AI speaking state
      AudioStateController.startAISpeaking();
      
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.7;
      utterance.pitch = 1.1;
      utterance.volume = 1.0; // Ensure maximum volume
      
      // Enhanced voice selection with debugging
      const voices = speechSynthesis.getVoices();
      console.log('🎵 Available voices:', voices.length);
      
      // Try to find a good voice
      let selectedVoice = voices.find(voice => 
        voice.name.includes('Female') || voice.name.includes('Child')
      ) || voices.find(voice => 
        voice.lang.startsWith('en')
      ) || voices[0];
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎤 Selected voice:', selectedVoice.name, selectedVoice.lang);
      } else {
        console.log('⚠️ No voice selected, using default');
      }
      
      console.log('🔊 Playing word audio:', currentWord.word);
      console.log('🔧 TTS Settings:', {
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume,
        voice: utterance.voice?.name || 'default'
      });
      
      // Enhanced event handlers
      utterance.onstart = () => {
        console.log('🎵 TTS playback started');
      };
      
      utterance.onend = () => {
        console.log('✅ TTS playback finished');
        // 🛑 Stop AI speaking state
        AudioStateController.stopAISpeaking();
      };
      
      utterance.onerror = (error) => {
        console.error('❌ TTS playback error:', error);
        // 🛑 Stop AI speaking state on error
        AudioStateController.stopAISpeaking();
        
        // Show user feedback
        toast({
          title: "Audio Error",
          description: "Could not play word audio. Please try again.",
          variant: "destructive"
        });
      };
      
      // Attempt to speak
      try {
        speechSynthesis.speak(utterance);
        console.log('🚀 TTS speak() called successfully');
      } catch (error) {
        console.error('❌ Error calling speechSynthesis.speak():', error);
        AudioStateController.stopAISpeaking();
      }
    } else {
      console.error('❌ Speech synthesis not supported in this browser');
      toast({
        title: "Audio Not Supported",
        description: "Your browser doesn't support audio playback.",
        variant: "destructive"
      });
    }
  };

  // Loading state for word generation
  if (isLoadingWords) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-[#F5B82E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-foreground">Creating your special words...</p>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
            Our AI is preparing words just for you! {cheerfulCharacter}
          </p>
        </motion.div>
      </div>
    );
  }

  // 🎮 CHALLENGE MODE SELECTION SCREEN (Show this BEFORE main mode selector)
  if (showChallengeModeSelector) {
    console.log('🎮 Rendering challenge mode selector:', {
      showChallengeModeSelector,
      challengeModesCount: challengeModes.length,
      modes: challengeModes.map(m => m.id)
    });
    
    // Show loading if modes not loaded yet
    if (challengeModes.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-white rounded-3xl shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6"
            >
              <Target className="w-16 h-16 text-blue-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Loading Challenge Modes...
            </h2>
            <p className="text-gray-600">
              Getting your challenges ready!
            </p>
            <button
              onClick={() => setShowChallengeModeSelector(false)}
              className="mt-6 text-gray-500 hover:text-gray-700 underline"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-yellow-50 to-red-50 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-3 flex items-center justify-center gap-3">
              <Target className="w-12 h-12 text-orange-600" />
              Choose Your Challenge!
              <Target className="w-12 h-12 text-red-600" />
            </h1>
            <p className="text-xl text-gray-700">
              Pick a challenge mode and show off your speech skills!
            </p>
          </motion.div>

          {/* Challenge Modes Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {challengeModes.map((mode, index) => {
              const isLocked = index !== 0; // Only first mode (Speed Round) is unlocked
              
              return (
                <motion.button
                  key={mode.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    if (isLocked) {
                      // Show toast for locked modes
                      toast({
                        title: "Coming Soon!",
                        description: `${mode.name} mode is under development. Try Speed Round for now!`,
                        variant: "default"
                      });
                      return;
                    }
                    
                    console.log('✅ Selected challenge mode:', mode.id, mode.name);
                    setGameMode('challenge');
                    setSelectedChallengeMode(mode.id);
                    setShowChallengeModeSelector(false);
                    setShowModeSelector(false);
                  }}
                  className={`relative bg-white rounded-3xl p-6 border-4 transition-all transform text-left overflow-hidden ${
                    isLocked 
                      ? 'border-gray-200 opacity-75 cursor-not-allowed' 
                      : 'border-orange-300 hover:border-orange-500 hover:shadow-2xl hover:scale-105'
                  }`}
                  disabled={isLocked}
                >
                  {/* Coming Soon Banner for locked modes */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-gray-700/80 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🚧</div>
                        <div className="text-white font-bold text-xl mb-1">COMING SOON</div>
                        <div className="text-gray-200 text-sm">Under Development</div>
                      </div>
                    </div>
                  )}

                  {/* Difficulty Badge */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                    mode.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    mode.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {mode.difficulty.toUpperCase()}
                  </div>

                  {/* Icon */}
                  <div className="text-6xl mb-4 text-center">{mode.icon}</div>

                  {/* Name */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                    {mode.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 text-center leading-relaxed">
                    {mode.description}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="bg-orange-50 px-3 py-2 rounded-lg">
                      <div className="text-xs text-gray-500">Time</div>
                      <div className="text-lg font-bold text-orange-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {mode.timeLimit}s
                      </div>
                    </div>
                    <div className="bg-purple-50 px-3 py-2 rounded-lg">
                      <div className="text-xs text-gray-500">Bonus</div>
                      <div className="text-lg font-bold text-purple-600 flex items-center gap-1">
                        <Zap className="w-4 h-4" /> {mode.pointMultiplier}x
                      </div>
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <div className="text-xs font-semibold text-gray-500 mb-2">📜 Rules:</div>
                    {mode.rules.slice(0, 2).map((rule: string, i: number) => (
                      <div key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>

                  {/* Play Button */}
                  <div className={`mt-4 py-3 px-6 rounded-xl font-bold text-center ${
                    isLocked 
                      ? 'bg-gray-300 text-gray-500' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  }`}>
                    {isLocked ? 'COMING SOON 🚧' : 'PLAY THIS MODE 🚀'}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => setShowChallengeModeSelector(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors font-semibold text-lg"
            >
              ← Back to Mode Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🎮 ENHANCED GAME MODE SELECTOR (Beautiful UX from Mockup)
  if (showModeSelector && !isLoadingWords && !gameData?.skipSubModes && !gameData?.directStart) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Game Mode Selection */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">What kind of word practice sounds fun today?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Story Adventure */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => {
                  setGameMode('story');
                  setShowModeSelector(false);
                  setShowStoryOpening(true);
                }}
              >
                {/* Game Header */}
                <div className="bg-muted p-6 relative">
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-xl bg-[#ff6b1d]/10 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-[#ff6b1d]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-center mb-2">Story Adventure</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Follow a magical quest! Help forest animals and unlock surprises!
                  </p>
                </div>

                {/* Game Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>15 min</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#ff6b1d]">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">+50 XP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-[#ff6b1d] bg-[#ff6b1d]/10">
                      Easy
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#ff6b1d] fill-[#ff6b1d]" />
                      <Star className="w-4 h-4 text-[#ff6b1d] fill-[#ff6b1d]" />
                      <Star className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="inline-block bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                      Pronunciation
                    </span>
                  </div>

                  <button className="w-full bg-[#ff6b1d] hover:bg-[#e55a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Start Game
                  </button>
                </div>
              </motion.div>

              {/* Challenge Mode */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => {
                  console.log('🎮 Challenge Mode clicked - showing mode selector');
                  setShowChallengeModeSelector(true);
                }}
              >
                {/* Game Header */}
                <div className="bg-muted p-6 relative">
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-xl bg-[#ff6b1d]/10 flex items-center justify-center">
                      <Target className="w-8 h-8 text-[#ff6b1d]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-center mb-2">Challenge Mode</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Speed rounds & memory games with bonus points!
                  </p>
                </div>

                {/* Game Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>12 min</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#ff6b1d]">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">+40 XP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted">
                      Medium
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#ff6b1d] fill-[#ff6b1d]" />
                      <Star className="w-4 h-4 text-muted-foreground/30" />
                      <Star className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="inline-block bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                      Speed
                    </span>
                  </div>

                  <button className="w-full bg-[#ff6b1d] hover:bg-[#e55a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Start Game
                  </button>
                </div>
              </motion.div>

              {/* Daily Quest */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => {
                  console.log('🏆 Daily Quest clicked:', { 
                    hasDailyChallenge: !!dailyChallenge,
                    mode: dailyChallenge?.mode,
                    theme: dailyChallenge?.theme
                  });
                  
                  if (dailyChallenge) {
                    console.log('✅ Starting Daily Quest (Conquest Mode):', {
                      theme: dailyChallenge.theme,
                      emoji: dailyChallenge.emoji,
                      targetScore: dailyChallenge.targetScore,
                      targetAccuracy: dailyChallenge.targetAccuracy
                    });
                    setGameMode('conquest');
                    setShowModeSelector(false);
                  } else {
                    toast({
                      title: "Daily Quest Loading...",
                      description: "Please wait a moment and try again.",
                      variant: "default",
                      duration: 3000
                    });
                    console.warn('⚠️ Daily quest not loaded yet');
                  }
                }}
              >
                {/* Game Header */}
                <div className="bg-muted p-6 relative">
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-xl bg-[#ff6b1d]/10 flex items-center justify-center">
                      <Award className="w-8 h-8 text-[#ff6b1d]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-center mb-2">Daily Quest</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Help marine animals find their way home!
                  </p>
                </div>

                {/* Game Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>18 min</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#ff6b1d]">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">+60 XP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-foreground bg-accent/50">
                      Hard
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#ff6b1d] fill-[#ff6b1d]" />
                      <Star className="w-4 h-4 text-[#ff6b1d] fill-[#ff6b1d]" />
                      <Star className="w-4 h-4 text-[#ff6b1d] fill-[#ff6b1d]" />
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="inline-block bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                      Reading
                    </span>
                  </div>

                  <button className="w-full bg-[#ff6b1d] hover:bg-[#e55a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Start Game
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Back Button */}
            <div className="text-center mt-8">
              <button
                onClick={onExit}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Games
              </button>
            </div>
          </div>

          {/* Companion Introduction */}
          {companionCharacter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border-2 border-blue-200 rounded-2xl p-6 shadow-lg text-center"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="text-5xl">{companionCharacter.emoji || '🦊'}</div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 font-semibold">Your Companion Today:</div>
                  <div className="text-xl font-bold text-gray-800">
                    {companionCharacter.name || 'Finn the Wise Fox'}
                  </div>
                  <div className="text-gray-600 mt-1">
                    "{companionCharacter.greeting || "I've prepared a special adventure for you!"}"
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={onExit}
              className="text-gray-500 hover:text-gray-700 transition-colors font-semibold text-lg"
            >
              ← Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 📖 STORY OPENING SCENE (NEW)
  if (showStoryOpening && storyContext) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 via-blue-100 to-purple-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl w-full"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-green-300">
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-center mb-6 text-green-700 flex items-center justify-center gap-4"
            >
              <TreePine className="w-10 h-10 text-green-600" />
              {storyContext.theme || 'THE ENCHANTED FOREST'}
              <TreePine className="w-10 h-10 text-green-600" />
            </motion.h1>

            {/* Visual Scene */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-6xl mb-8 leading-relaxed"
            >
              🌲🌲 {companionCharacter?.emoji || '🦊'} 🌲🌲 🌈 🌲🌲 🐰 🌲🌲
            </motion.div>

            {/* Story Introduction */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-green-50 rounded-2xl p-8 mb-6 border-2 border-green-200"
            >
              <p className="text-xl text-gray-800 leading-relaxed mb-4">
                {storyContext.introduction || `"Hello, ${childProfile?.childName || 'Friend'}! I'm ${companionCharacter?.name || 'Finn the Fox'}, and I need your help! The forest animals have lost their voices! Only YOU can help them speak again by saying their special words. Are you ready for this magical adventure?"`}
              </p>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">Progress:</span>
                  <span className="text-sm font-bold text-green-600">0/{personalizedWords.length} Animals Saved</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Begin Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              onClick={() => setShowStoryOpening(false)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white text-2xl font-bold py-5 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              🚀 Begin Quest!
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentWord) {
    // Show proper loading state while words are being generated
    if (isLoadingWords || isLoadingStory) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-white rounded-3xl shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6"
            >
              <Sparkles className="w-20 h-20 text-purple-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              ✨ Creating Your Adventure... ✨
            </h2>
            <p className="text-gray-600 mb-4">
              {gameMode === 'story' 
                ? `Preparing a magical story just for ${childProfile?.childName || 'you'}!`
                : gameMode === 'challenge'
                ? `Setting up your ${selectedChallengeMode} challenge...`
                : gameMode === 'conquest'
                ? `🏆 Preparing your ${dailyChallenge?.theme || 'Daily Quest'}...`
                : 'Generating personalized words...'}
            </p>
            <div className="flex gap-2 justify-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-3 h-3 bg-purple-500 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-3 h-3 bg-pink-500 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-3 h-3 bg-blue-500 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      );
    }

    // Only show error if we're NOT loading
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Oops! Something went wrong</h2>
          <p className="text-lg text-gray-600 mb-6">
            We couldn't load your words right now. Let's try again!
          </p>
          <button
            onClick={() => {
              setShowModeSelector(true);
              setPersonalizedWords([]);
              setCurrentWordIndex(0);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // 📊 ENHANCED SESSION SUMMARY MODAL (Dashboard-Style Design from Mockup)
  if (showSessionSummary && sessionSummary) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-3xl p-10 max-w-4xl w-full overflow-y-auto max-h-[90vh] shadow-2xl border-4 border-purple-300"
        >
          {/* Celebration Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <PartyPopper className="w-20 h-20 text-yellow-500" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <Sparkles className="w-20 h-20 text-purple-500" />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
              {sessionSummary.title || 'Amazing Job!'}
            </h1>
            <p className="text-xl text-gray-700 font-semibold">
              Here's how you did, {childProfile?.childName || 'superstar'}!
            </p>
          </motion.div>

          {/* 🎯 4-COLUMN STATS GRID (Dashboard Style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-4 gap-6 mb-8"
          >
            {/* Total Points */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-xl border-4 border-purple-200">
              <div className="text-5xl font-black text-purple-600 mb-2">{score}</div>
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total Points</div>
              <div className="text-3xl mt-2"><Zap className="w-8 h-8 text-yellow-500" /></div>
            </div>

            {/* Stars Earned */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-xl border-4 border-yellow-200">
              <div className="flex items-center justify-center mb-2">
                {[...Array(Math.min(3, Math.floor(stars / 10)))].map((_, i) => (
                  <Star key={i} className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <div className="text-5xl font-black text-yellow-600">{Math.floor(stars / 10)}</div>
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Stars Earned</div>
            </div>

            {/* Best Streak */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-xl border-4 border-orange-200">
              <div className="text-5xl font-black text-orange-600 mb-2">{maxStreak}</div>
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Best Streak</div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>

            {/* Accuracy */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-xl border-4 border-green-200">
              <div className="text-5xl font-black text-green-600 mb-2">{totalAccuracy}%</div>
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Accuracy</div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          {/* Achievements Section */}
          {sessionSummary.achievements && sessionSummary.achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <h3 className="text-2xl font-black text-center mb-5 flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                🏆 Amazing Achievements! 🏆
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {sessionSummary.achievements.map((achievement: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-5 flex items-center gap-3 shadow-lg border-3 border-green-300"
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-base font-bold text-white text-left">{achievement}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Companion Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-3xl p-6 shadow-xl border-4 border-blue-300 relative">
              {/* Speech bubble triangle */}
              <div className="absolute -top-4 left-12 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[20px] border-b-blue-400"></div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-white/20 rounded-full">
                  {sessionSummary.isStoryComplete ? (
                    <Trophy className="w-12 h-12 text-yellow-300" />
                  ) : (
                    cheerfulCharacter
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold text-white mb-2">
                    {companionCharacter?.name || 'Your Companion'} says:
                  </div>
                  <p className="text-xl text-white font-semibold leading-relaxed">
                    "{sessionSummary.message || sessionSummary.encouragement || 'You did an incredible job today! Keep up the amazing work!'}"
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Next Goals (if available) */}
          {sessionSummary.nextGoals && sessionSummary.nextGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mb-8 bg-white/70 rounded-2xl p-6 border-2 border-purple-200"
            >
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-800">
                <Target className="w-6 h-6" />
                🎯 Next Time Let's Try:
              </h4>
              <div className="space-y-3">
                {sessionSummary.nextGoals.map((goal: string, index: number) => (
                  <div key={index} className="text-base text-gray-700 bg-purple-50 border-2 border-purple-200 rounded-xl p-4 font-medium flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    {goal}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex gap-4"
          >
            <button
              onClick={() => {
                setShowSessionSummary(false);
                setShowModeSelector(true);
                setScore(0);
                setStars(0);
                setStreak(0);
                setCurrentWordIndex(0);
                setPersonalizedWords([]);
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-5 px-8 rounded-2xl font-black text-xl hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-purple-600"
            >
              🎮 Play More!
            </button>
            <button
              onClick={() => {
                onComplete({ 
                  score, 
                  accuracy: totalAccuracy, 
                  stars, 
                  maxStreak,
                  summary: sessionSummary 
                });
                setLocation('/speech-therapy');
              }}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 px-8 rounded-2xl font-black text-xl hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-green-600"
            >
              🏠 Go Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      
      {/* 🛠️ AUDIO STATE DEBUG PANEL (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
          <div className="font-bold text-yellow-300 mb-2 flex items-center gap-1">
            <Headphones className="w-4 h-4" /> Audio State Debug
          </div>
          <div className={`flex items-center gap-2 ${isAISpeaking ? 'text-red-300' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isAISpeaking ? 'bg-red-400' : 'bg-gray-600'}`}></div>
            AI Speaking: {isAISpeaking ? 'ON' : 'OFF'}
          </div>
          <div className={`flex items-center gap-2 ${isUserSpeaking ? 'text-blue-300' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
            User Speaking: {isUserSpeaking ? 'ON' : 'OFF'}
          </div>
          <div className={`flex items-center gap-2 ${isAIGenerating ? 'text-purple-300' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isAIGenerating ? 'bg-purple-400' : 'bg-gray-600'}`}></div>
            AI Generating: {isAIGenerating ? 'ON' : 'OFF'}
          </div>
          <div className={`flex items-center gap-2 ${audioLockActive ? 'text-orange-300' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${audioLockActive ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
            Audio Lock: {audioLockActive ? 'ON' : 'OFF'}
          </div>
          <div className="text-xs text-gray-400 mt-2 mb-2">
            Any Active: {AudioStateController.isAnyAudioActive() ? '🔒' : '🔓'}
          </div>
          
          {/* Emergency TTS Test Button */}
          <button
            onClick={() => {
              console.log('🧪 Testing TTS...');
              if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                const testUtterance = new SpeechSynthesisUtterance('Test audio');
                testUtterance.volume = 1;
                testUtterance.rate = 0.8;
                testUtterance.onstart = () => console.log('🎵 Test TTS started');
                testUtterance.onend = () => console.log('✅ Test TTS ended');
                testUtterance.onerror = (e) => console.error('❌ Test TTS error:', e);
                speechSynthesis.speak(testUtterance);
              }
            }}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black text-xs px-2 py-1 rounded mt-1"
          >
            🧪 Test TTS
          </button>
        </div>
      )}
      
      {/* 🎨 ENHANCED HEADER with Story Progress */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-4 mb-6 shadow-lg border-2 border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onExit}
            className="p-3 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-md border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Story Mode Title */}
          {gameMode === 'story' && storyContext && (
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-2">
                {storyContext.theme || 'The Enchanted Forest'}
                <TreePine className="w-6 h-6 text-green-600" />
              </h2>
            </div>
          )}
          
          {/* Challenge Mode Title */}
          {gameMode === 'challenge' && (
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-orange-600">
                {challengeModes.find(m => m.id === selectedChallengeMode)?.name || 'Challenge Mode'} 
                {challengeModes.find(m => m.id === selectedChallengeMode)?.icon || '⚡'}
              </h2>
            </div>
          )}
          
          {/* 🏆 CONQUEST MODE TITLE (Daily Quest) */}
          {gameMode === 'conquest' && dailyChallenge && (
            <div className="flex-1 text-center">
              <div className="inline-block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-2xl px-6 py-3 shadow-xl border-4 border-yellow-300">
                <div className="flex items-center gap-3 justify-center">
                  <span className="text-4xl animate-bounce">{dailyChallenge.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-black text-white drop-shadow-lg">
                      {dailyChallenge.theme}
                    </h2>
                    <p className="text-xs text-yellow-100 font-semibold">Daily Quest • Today's Adventure</p>
                  </div>
                  <span className="text-4xl animate-bounce">{dailyChallenge.emoji}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>

        {/* Stats Row */}
        <div className={`grid ${gameMode === 'challenge' && challengeTimeLeft !== null ? 'grid-cols-5' : 'grid-cols-4'} gap-3 mb-4`}>
          <div className="bg-white rounded-xl p-3 text-center shadow-md border border-purple-200">
            <div className="text-xs text-gray-500 font-semibold mb-1">Progress</div>
            <div className="text-2xl font-black text-purple-600">
              {currentWordIndex + 1}<span className="text-sm text-gray-400">/{personalizedWords.length}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-md border border-yellow-200">
            <div className="text-xs text-gray-500 font-semibold mb-1">Score</div>
            <div className="text-2xl font-black text-[#F5B82E] flex items-center justify-center gap-1">
              {score} <Zap className="w-5 h-5" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-md border border-orange-200">
            <div className="text-xs text-gray-500 font-semibold mb-1">Stars</div>
            <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
              {Math.floor(stars / 10)} <Star className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 text-center shadow-md border border-green-200">
            <div className="text-xs text-gray-500 font-semibold mb-1">Streak</div>
            <div className="text-2xl font-black text-green-500 flex items-center justify-center gap-1">
              {streak} {streak >= 5 ? <Zap className="w-5 h-5 text-orange-500 fill-current" /> : <Heart className="w-5 h-5 fill-current" />}
            </div>
          </div>
          
          {/* ⏱️ Challenge Mode Timer */}
          {gameMode === 'challenge' && challengeTimeLeft !== null && (
            <div className={`bg-white rounded-xl p-3 text-center shadow-md border-2 ${
              challengeTimeLeft <= 10 ? 'border-red-400 animate-pulse' : 'border-orange-300'
            }`}>
              <div className="text-xs text-gray-500 font-semibold mb-1">Time Left</div>
              <div className={`text-2xl font-black flex items-center justify-center gap-1 ${
                challengeTimeLeft <= 10 ? 'text-red-500' : 'text-orange-500'
              }`}>
                ⏱️ {Math.floor(challengeTimeLeft / 60)}:{(challengeTimeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}
          
          {/* 🏆 CONQUEST MODE TARGET SCORE */}
          {gameMode === 'conquest' && dailyChallenge && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 text-center shadow-md border-2 border-yellow-400">
              <div className="text-xs text-gray-600 font-bold mb-1">Quest Goal</div>
              <div className="text-2xl font-black text-orange-600 flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5" />
                {dailyChallenge.targetScore}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Progress Bar with Story Context */}
        {gameMode === 'story' ? (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Story Progress:</span>
              <span className="text-sm font-black text-green-600">
                {animalsHelped}/{personalizedWords.length} Animals Saved 🐾
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden relative shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentWordIndex + 1) / personalizedWords.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                {Math.round(((currentWordIndex + 1) / personalizedWords.length) * 100)}% Complete
              </div>
            </div>
          </div>
        ) : gameMode === 'conquest' && dailyChallenge ? (
          /* 🏆 CONQUEST MODE PROGRESS */
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-gray-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Quest Progress: {currentWordIndex + 1}/{personalizedWords.length} Words
              </span>
              <span className={`font-bold ${score >= dailyChallenge.targetScore ? 'text-green-600' : 'text-orange-600'}`}>
                {score} / {dailyChallenge.targetScore} points 
                {score >= dailyChallenge.targetScore ? ' ✅' : ''}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden relative shadow-lg border-2 border-yellow-400">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (score / dailyChallenge.targetScore) * 100)}%` }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-md">
                {Math.round(Math.min(100, (score / dailyChallenge.targetScore) * 100))}% to Victory!
              </div>
            </div>
            {/* Quest Description */}
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-3 border-2 border-yellow-300">
              <p className="text-sm text-gray-700 font-medium text-center">
                {dailyChallenge.emoji} {dailyChallenge.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#F5B82E] to-orange-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentWordIndex + 1) / personalizedWords.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {Math.round(((currentWordIndex + 1) / personalizedWords.length) * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Main Word Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWordIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 mb-6"
        >
          {/* Word Display */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F5B82E]/20 to-orange-400/20 flex items-center justify-center mb-2 border-4 border-[#F5B82E]/30">
                {currentWord.visualCue ? (
                  <div className="text-6xl">{currentWord.visualCue}</div>
                ) : (
                  <Sparkles className="w-16 h-16 text-[#F5B82E]" />
                )}
              </div>
              {/* Cheerful character */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-3xl flex justify-center"
              >
                {cheerfulCharacter}
              </motion.div>
            </motion.div>
            
            <h2 className="text-6xl font-bold mb-4 capitalize bg-gradient-to-r from-[#F5B82E] to-orange-400 bg-clip-text text-transparent">
              {currentWord.word}
            </h2>
            
            <p className="text-2xl text-muted-foreground mb-3">
              {currentWord.phonetic}
            </p>
            
            <div className="flex justify-center gap-2 mb-4">
              <div className="inline-block px-4 py-2 bg-[#F5B82E]/10 border border-[#F5B82E]/30 rounded-full">
                <span className="text-sm font-medium capitalize text-[#F5B82E]">{currentWord.category}</span>
              </div>
              {currentWord.therapyFocus && (
                <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                  <span className="text-sm font-medium text-blue-600">{currentWord.therapyFocus}</span>
                </div>
              )}
              <div className="inline-block px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Groq Whisper
                </span>
              </div>
            </div>

            {/* Story Mode Context */}
            {gameMode === 'story' && storyContext && storyContext.words?.[currentWordIndex] && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 mb-4 max-w-xl mx-auto"
              >
                {/* Visual Scene */}
                {storyContext.words[currentWordIndex].visualScene && (
                  <div className="text-4xl text-center mb-3">
                    {storyContext.words[currentWordIndex].visualScene}
                  </div>
                )}

                {/* Story Context */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 mb-3">
                  <p className="text-base text-gray-700 leading-relaxed">
                    {storyContext.words[currentWordIndex].storyContext}
                  </p>
                </div>

                {/* Character Dialogue */}
                {storyContext.words[currentWordIndex].characterDialogue && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {companionCharacter?.emoji || '🌟'}
                      </div>
                      <p className="text-base text-gray-700 flex-1 italic">
                        "{storyContext.words[currentWordIndex].characterDialogue}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Companion Support (if intervention needed) */}
                {companionDialogue && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {companionCharacter?.emoji || '💛'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800 mb-1">
                          {companionCharacter?.name || 'Your Friend'} says:
                        </p>
                        <p className="text-base text-gray-700">
                          {companionDialogue}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Attempt indicator */}
            <div className="flex justify-center gap-2 mb-4">
              {[...Array(maxAttempts)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < currentAttempt 
                      ? 'bg-[#F5B82E]' 
                      : 'bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 max-w-md mx-auto">
            <button
              onClick={playWordAudio}
              className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 text-blue-700 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105"
            >
              <Headphones className="w-6 h-6" />
              <span className="text-lg font-semibold">🎧 Listen Carefully</span>
            </button>
            
            <motion.button
              onClick={isSimpleRecording ? stopSimpleRecording : startSimpleRecording}
              disabled={showFeedback || isGeneratingFeedback || hasMicrophonePermission === null || hasMicrophonePermission === false}
              className={`w-full py-6 px-6 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-all transform hover:scale-105 ${
                isSimpleRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg' 
                  : hasMicrophonePermission === null
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : hasMicrophonePermission === false
                  ? 'bg-red-300 text-red-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#F5B82E] to-orange-400 hover:shadow-xl text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              whileTap={{ scale: 0.95 }}
            >
              {isSimpleRecording ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="w-7 h-7" />
                  </motion.div>
                  I'm Listening... 👂
                </>
              ) : isGeneratingFeedback ? (
                <>
                  <Brain className="w-7 h-7 animate-spin" />
                  Thinking...
                </>
              ) : hasMicrophonePermission === null ? (
                <>
                  <Mic className="w-7 h-7 animate-pulse" />
                  ⏳ Checking Microphone...
                </>
              ) : hasMicrophonePermission === false ? (
                <>
                  <MicOff className="w-7 h-7" />
                  🚫 Microphone Denied
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7" />
                  🎤 Say "{currentWord.word}"
                </>
              )}
            </motion.button>

            {currentAttempt > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="text-sm font-medium text-yellow-700 flex items-center justify-center gap-2">
                  Try {currentAttempt} of {maxAttempts} - You can do it! {cheerfulCharacter}
                </div>
              </motion.div>
            )}

            <button
              onClick={skipWord}
              className="w-full text-muted-foreground hover:text-red-500 py-3 px-4 rounded-lg transition-colors text-sm border-2 border-dashed border-muted hover:border-red-200"
            >
              Skip this word (-30 points) →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Enhanced AI Feedback Modal */}
      <AnimatePresence>
        {showFeedback && feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-gray-200"
            >
              {/* Animated Character */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
                  feedback.emotionalTone === 'excited' ? 'bg-gradient-to-br from-green-400 to-green-500' :
                  feedback.emotionalTone === 'proud' ? 'bg-gradient-to-br from-[#ff6b1d] to-[#ff8a4a]' :
                  feedback.emotionalTone === 'encouraging' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                  'bg-gradient-to-br from-blue-400 to-blue-500'
                }`}>
                  {feedback.emotionalTone === 'excited' ? (
                    <PartyPopper className="w-10 h-10 text-white" />
                  ) : feedback.emotionalTone === 'proud' ? (
                    <Trophy className="w-10 h-10 text-white" />
                  ) : feedback.emotionalTone === 'encouraging' ? (
                    <Smile className="w-10 h-10 text-white" />
                  ) : (
                    <Heart className="w-10 h-10 text-white" />
                  )}
                </div>
                
                {/* Cheerful character celebration */}
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: 2,
                    ease: "easeInOut"
                  }}
                  className="text-4xl mb-2"
                >
                  {cheerfulCharacter}
                </motion.div>
              </motion.div>

              {/* AI-Generated Feedback Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  {feedback.message}
                </h3>

                <p className="text-lg text-gray-700 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  {feedback.encouragement}
                </p>

                {feedback.technicalTip && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-blue-900">Helpful Tip:</span>
                    </div>
                    <p className="text-sm text-blue-700">{feedback.technicalTip}</p>
                  </div>
                )}

                {feedback.nextSteps && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-green-900">Next Step:</span>
                    </div>
                    <p className="text-sm text-green-700">{feedback.nextSteps}</p>
                  </div>
                )}
              </motion.div>

              {/* Performance Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          i < Math.floor((attempts[attempts.length - 1]?.accuracy || 0) / 20)
                            ? 'text-[#ff6b1d] fill-[#ff6b1d]'
                            : 'text-gray-300'
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-[#ff6b1d] to-[#ff8a4a] text-white py-4 px-6 rounded-2xl shadow-lg">
                  <p className="text-sm font-medium">Points Earned</p>
                  <p className="text-3xl font-bold flex items-center justify-center gap-2">
                    +{attempts[attempts.length - 1]?.accuracy || 0} <Target className="w-4 h-4 text-blue-500" />
                  </p>
                </div>
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={() => setShowFeedback(false)}
                className="w-full bg-gradient-to-r from-[#ff6b1d] to-[#ff8a4a] text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                whileTap={{ scale: 0.95 }}
              >
                {currentWordIndex >= personalizedWords.length - 1 && currentAttempt >= maxAttempts ? 
                  "Finish Game!" : 
                  currentAttempt < maxAttempts && (attempts[attempts.length - 1]?.accuracy || 0) < 70 ?
                  "Try Again!" :
                  "Next Word!"
                }
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 😟 EMOTIONAL SUPPORT MODAL (When child is frustrated) */}
      <AnimatePresence>
        {showEmotionalSupport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-4 border-yellow-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Companion Header */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-3"
                >
                  {companionCharacter?.emoji || '🦊'}
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {companionCharacter?.name || 'Finn'} Notices Something...
                </h2>
              </div>

              {/* Support Message */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-3 border-yellow-300 rounded-2xl p-6 mb-6">
                <h3 className="text-2xl font-bold text-center text-yellow-900 mb-4">
                  💙 Hey {childProfile?.childName || 'Friend'} 💙
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  I can see you're working really hard on these words. They're tricky ones! Even grown-ups find them challenging sometimes. 🤗
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  You know what? You've already helped {animalsHelped} animals today! That's AMAZING! 🌟
                </p>
                <p className="text-lg text-gray-700 leading-relaxed font-semibold">
                  What would you like to do?
                </p>
              </div>

              {/* Support Options Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => {
                    setCurrentDifficulty(Math.max(1, currentDifficulty - 1));
                    setShowEmotionalSupport(false);
                    setRecentFailures(0);
                    toast({
                      title: "Let's try something easier!",
                      description: "You've got this!"
                    });
                  }}
                  className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 rounded-xl p-4 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <Star className="w-10 h-10 text-yellow-500 fill-current" />
                  <div className="text-sm font-bold text-green-800">Try an Easier Word First</div>
                </button>

                <button
                  onClick={() => {
                    setGameMode('challenge');
                    setSelectedChallengeMode('memory_master');
                    setShowEmotionalSupport(false);
                    setRecentFailures(0);
                    toast({
                      title: "Let's play something fun!",
                      description: "Memory game starting!"
                    });
                  }}
                  className="bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 rounded-xl p-4 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2"><Brain className="w-10 h-10 text-purple-500" /></div>
                  <div className="text-sm font-bold text-blue-800">Play a Fun Memory Game</div>
                </button>

                <button
                  onClick={() => {
                    setShowEmotionalSupport(false);
                    setRecentFailures(0);
                    toast({
                      title: "Take your time!",
                      description: "Come back when you're ready!",
                      duration: 5000
                    });
                    setTimeout(() => {
                      onExit();
                    }, 2000);
                  }}
                  className="bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 rounded-xl p-4 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2"><Clock className="w-10 h-10 text-purple-600" /></div>
                  <div className="text-sm font-bold text-purple-800">Take a Quick Break</div>
                  <div className="text-xs text-purple-600">(2 minutes)</div>
                </button>

                <button
                  onClick={() => {
                    setShowEmotionalSupport(false);
                    setRecentFailures(0);
                    playWordAudio();
                    toast({
                      title: "You're brave!",
                      description: "Let's do this together!"
                    });
                  }}
                  className="bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-orange-300 rounded-xl p-4 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2"><Heart className="w-10 h-10 text-red-500" /></div>
                  <div className="text-sm font-bold text-orange-800">Keep Trying (I'll help!)</div>
                </button>
              </div>

              {/* Encouragement Footer */}
              <p className="text-center text-lg text-gray-600 font-semibold">
                Remember: Every try makes you stronger! 💪✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎁 ENHANCED SURPRISE REWARD MODAL (Beautiful Design from Mockup) */}
      <AnimatePresence>
        {showRewardModal && surpriseReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
            onClick={() => setShowRewardModal(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: 360, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: -360, opacity: 0 }}
              transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
              className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-3xl p-10 max-w-lg w-full shadow-2xl border-4 border-yellow-400 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sparkle Background Animation */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-3xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -50, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              {/* Header */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
              >
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                  ✨ SOMETHING MAGICAL HAPPENED! ✨
                </h2>
              </motion.div>

              {/* Celebration Emoji Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-center text-8xl mb-6"
              >
                🎉 🎊 🌟 ⭐ ✨ 🎁 ✨ ⭐ 🌟 🎊 🎉
              </motion.div>

              {/* Main Reward Display */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                className="bg-white rounded-2xl p-8 mb-6 shadow-xl border-4 border-purple-300"
              >
                {/* Reward Icon */}
                <div className="text-9xl text-center mb-4">
                  {surpriseReward.type === 'character' ? '🦄' :
                   surpriseReward.type === 'badge' ? '🏅' :
                   surpriseReward.type === 'theme' ? '🌈' :
                   surpriseReward.type === 'power_up' ? '⚡' : '🎁'}
                </div>

                {/* Reward Name */}
                <h3 className="text-4xl font-black text-center text-gray-800 mb-3">
                  YOU UNLOCKED: {surpriseReward.name?.toUpperCase()}!
                </h3>

                {/* Rarity Badge */}
                <div className="flex justify-center mb-4">
                  <div className={`px-6 py-2 rounded-full font-bold text-lg uppercase tracking-wider shadow-lg ${
                    surpriseReward.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white animate-pulse' :
                    surpriseReward.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' :
                    surpriseReward.rarity === 'rare' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                    'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                  }`}>
                    ⭐ {surpriseReward.rarity?.toUpperCase()} {surpriseReward.type?.toUpperCase()} ⭐
                  </div>
                </div>

                {/* Achievement Description */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center mb-4"
                >
                  <p className="text-lg text-gray-700 mb-3">
                    <span className="font-bold">Achievement:</span> {surpriseReward.achievement || 'Perfect Performance!'}
                  </p>
                  <p className="text-base text-gray-600 leading-relaxed italic">
                    "{surpriseReward.description}"
                  </p>
                </motion.div>

                {/* Special Abilities */}
                {surpriseReward.abilities && surpriseReward.abilities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="bg-purple-50 rounded-xl p-4 mb-4 border-2 border-purple-200"
                  >
                    <h4 className="font-black text-purple-800 mb-3 text-lg text-center">
                      🌟 Special Powers:
                    </h4>
                    <div className="space-y-2">
                      {surpriseReward.abilities.map((ability: string, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.3 + idx * 0.1 }}
                          className="text-base text-purple-900 font-medium flex items-center gap-2"
                        >
                          <Sparkles className="w-6 h-6 text-yellow-500" />
                          {ability}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Collection Progress */}
              {surpriseReward.collectionProgress && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="bg-white/70 rounded-xl p-4 mb-6 border-2 border-green-300"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-base font-bold text-gray-800">
                      [{surpriseReward.collectionProgress.category} Collection]
                    </span>
                    <span className="text-xl font-black text-green-600">
                      {surpriseReward.collectionProgress.current}/{surpriseReward.collectionProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(surpriseReward.collectionProgress.current / surpriseReward.collectionProgress.total) * 100}%` 
                      }}
                      transition={{ duration: 1.5, delay: 1.7 }}
                      className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex items-center justify-end pr-2"
                    >
                      <span className="text-xs font-bold text-white">
                        {Math.round((surpriseReward.collectionProgress.current / surpriseReward.collectionProgress.total) * 100)}%
                      </span>
                    </motion.div>
                  </div>
                  {surpriseReward.collectionProgress.nextReward && (
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Next: <span className="font-bold">{surpriseReward.collectionProgress.nextReward}</span> at {surpriseReward.collectionProgress.nextMilestone}!
                    </p>
                  )}
                </motion.div>
              )}

              {/* Continue Button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.8, type: "spring" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRewardModal(false)}
                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white py-5 px-8 rounded-2xl font-black text-2xl shadow-2xl border-4 border-green-600"
              >
                Awesome! Continue! 🚀
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

