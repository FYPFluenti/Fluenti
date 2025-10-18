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
  Headphones
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { aiSpeechService, PersonalizedWord, SpeechFeedback, ChildProfile } from '@/services/aiSpeechTherapy';
import { RealTimeSpeechRecognition, PronunciationAnalyzer, SpeechRecognitionResult } from '@/services/realTimeSpeechRecognition';
import { HybridSpeechRecognition, HybridPronunciationAnalyzer, HybridSpeechResult } from '@/services/hybridSpeechService';
import { microsoftSpeechService } from '@/services/microsoftSpeechService';
import { groqSpeechService, GroqSpeechResult } from '@/services/groqSpeechService';

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
  const [cheerfulCharacter, setCheerfulCharacter] = useState('🌟');
  const [isGroqListening, setIsGroqListening] = useState(false);
  
  const speechRecognitionRef = useRef<RealTimeSpeechRecognition | null>(null);
  const hybridSpeechRef = useRef<HybridSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const groqListeningControllerRef = useRef<{ stop: () => void } | null>(null);

  const currentWord = personalizedWords[currentWordIndex];
  const maxAttempts = 3;

  // Load child profile and generate personalized words
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Fetch child's onboarding data
        const token = localStorage.getItem('authToken');
        const onboardingResponse = await fetch('/api/onboarding', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (onboardingResponse.ok) {
          const profile = await onboardingResponse.json();
          setChildProfile(profile);
          
          // Set random cheerful character based on interests
          const characters = ['🌟', '🦋', '🌈', '🎈', '🎭', '🎯', '🎪', '🎨'];
          if (profile.interests?.includes('animals')) {
            setCheerfulCharacter(['🐱', '🐶', '🦊', '🐸', '🐰'][Math.floor(Math.random() * 5)]);
          } else {
            setCheerfulCharacter(characters[Math.floor(Math.random() * characters.length)]);
          }
          
          // Generate personalized words using AI with retry mechanism
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const words = await aiSpeechService.generatePersonalizedWords(profile, 'practice');
              if (words && words.length > 0) {
                setPersonalizedWords(words);
                break;
              } else {
                throw new Error('No words generated');
              }
            } catch (error) {
              retryCount++;
              if (retryCount >= maxRetries) {
                throw new Error(`Failed to generate words after ${maxRetries} attempts. Please check your connection and try again.`);
              }
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
            }
          }
        } else {
          throw new Error('Unable to load your profile. Please try refreshing the page.');
        }
        
      } catch (error) {
        console.error('Error initializing game:', error);
        setIsLoadingWords(false);
        toast({
          title: "Unable to Create Personalized Game",
          description: "AI service is currently unavailable. Please check your connection and try again.",
          variant: "destructive"
        });
        // Don't set any fallback words - let the user retry
        return;
      } finally {
        setIsLoadingWords(false);
      }
    };

    initializeGame();
  }, [gameData]);

  const startEnhancedListening = async () => {
    if (!isListening && currentWord && !isGeneratingFeedback) {
      try {
        console.log('🎯 Starting Groq Whisper speech recognition for:', currentWord.word);
        setIsGroqListening(true);
        
        // Use Groq's Whisper for transcription
        const result = await groqSpeechService.recordAndTranscribe(5000); // 5 second recording
        
        if (result && result.text && result.text.trim() !== '') {
          // Process the Groq result
          await handleGroqSpeechResult(result);
        } else {
          toast({
            title: "No speech detected",
            description: "Please try speaking clearly into your microphone.",
            variant: "default"
          });
          setIsGroqListening(false);
        }
        
      } catch (error) {
        console.error('Groq speech recognition error:', error);
        setIsGroqListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Please check your microphone and try again.",
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
    
    // Enhanced pronunciation analysis using Groq's high-quality transcription
    const analysis = PronunciationAnalyzer.analyzePronunciation(
      targetWord, 
      result.text, 
      result.confidence
    );

    // Boost accuracy for high-quality Groq transcriptions
    if (result.confidence > 0.8 && analysis.accuracy > 70) {
      analysis.accuracy = Math.min(100, analysis.accuracy + 10);
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
      source: 'groq-whisper',
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
            encouragement: "Keep practicing! You're doing wonderfully! " + cheerfulCharacter,
            emotionalTone: "supportive"
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
    }

    setShowFeedback(true);
    setIsGeneratingFeedback(false);

    // Update scoring system
    let pointsEarned = analysis.accuracy;
    if (analysis.isCorrect && currentAttempt === 1) {
      pointsEarned += 20; // Bonus for first try
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
    } else if (analysis.isCorrect) {
      pointsEarned += 10; // Smaller bonus for later attempts
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
    } else {
      setStreak(0); // Reset streak
    }

    // Award stars based on performance
    if (analysis.accuracy >= 90) setStars(stars + 3);
    else if (analysis.accuracy >= 70) setStars(stars + 2);
    else if (analysis.accuracy >= 50) setStars(stars + 1);

    const newScore = score + pointsEarned;
    setScore(newScore);
    setTotalAccuracy(Math.round(newScore / ((currentWordIndex + 1) * 100) * 100));

    // Auto-advance logic
    setTimeout(() => {
      setShowFeedback(false);
      
      if (analysis.isCorrect) {
        console.log('✅ Correct answer - advancing to next word');
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
          description: "You can do it! " + cheerfulCharacter,
        });
      } else {
        console.log('⏭️ All attempts used - auto-advancing to next word');
        toast({
          title: "Let's try the next word!",
          description: "Don't worry, practice makes perfect! " + cheerfulCharacter,
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

  const startListening = async () => {
    // Legacy method - now redirects to Groq
    await startEnhancedListening();
  };

  const startHybridListening = async () => {
    // Legacy method - now redirects to Groq
    await startEnhancedListening();
  };

  const stopListening = () => {
    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stopListening();
    }
    if (hybridSpeechRef.current && isListening) {
      hybridSpeechRef.current.stopListening();
    }
    if (groqListeningControllerRef.current && isGroqListening) {
      groqListeningControllerRef.current.stop();
      setIsGroqListening(false);
    }
    setIsListening(false);
  };

  const cleanupSpeechRecognition = () => {
    // Stop any ongoing speech recognition
    stopListening();
    
    // Reset speech recognition state
    setIsListening(false);
    setIsGroqListening(false);
    setIsGeneratingFeedback(false);
    
    console.log('🧹 Cleaning up speech recognition before word advance');
  };

  const handleSpeechResult = async (
    transcript: string, 
    confidence: number, 
    alternatives?: Array<{ transcript: string; confidence: number }>,
    microsoftResult?: any
  ) => {
    // Get the CURRENT word from the live state, not the closure
    const liveCurrentWord = personalizedWords[currentWordIndex];
    
    // Early exit if we're no longer listening or if currentWord is null
    if (!liveCurrentWord || isGeneratingFeedback) {
      console.log('⚠️ Ignoring speech result - no current word or already generating feedback');
      return;
    }
    
    setIsGeneratingFeedback(true);
    const targetWord = liveCurrentWord.word.toLowerCase();
    
    // Debug logging to track word synchronization
    console.log('🎯 handleSpeechResult called:', {
      currentWordIndex,
      currentWord: liveCurrentWord?.word,
      targetWord,
      transcript,
      currentAttempt,
      closureWord: currentWord?.word // Show what the closure thinks currentWord is
    });
    
    // Use Microsoft Speech result if available, otherwise use standard analysis
    let analysis;
    if (microsoftResult) {
      console.log('🎯 Using Microsoft Speech assessment result');
      analysis = {
        accuracy: Math.round(microsoftResult.pronunciationScore),
        phonemeAccuracy: microsoftResult.phonemeDetails?.map((p: any) => Math.round(p.accuracy)) || [],
        suggestions: microsoftResult.suggestions || ['Keep practicing!'],
        isCorrect: microsoftResult.isCorrect,
        source: 'microsoft'
      };
    } else {
      // Use advanced pronunciation analysis
      analysis = PronunciationAnalyzer.analyzePronunciation(
        targetWord, 
        transcript, 
        confidence, 
        alternatives
      );
    }

    const attemptData = {
      word: liveCurrentWord.word, // Use live word, not closure word
      transcript,
      accuracy: analysis.accuracy,
      correct: analysis.isCorrect,
      confidence,
      attempt: currentAttempt,
      timestamp: new Date(),
      phonemeAccuracy: analysis.phonemeAccuracy,
      suggestions: analysis.suggestions
    };

    setAttempts([...attempts, attemptData]);

    // Generate AI-powered feedback with retry mechanism
    const childAge = childProfile?.childBirthYear ? 
      new Date().getFullYear() - childProfile.childBirthYear : 5;
    
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount < maxRetries) {
      try {
        const aiFeedback = await aiSpeechService.generateEncouragingFeedback(
          childProfile?.childName || 'friend',
          liveCurrentWord.word, // Use live word for AI feedback
          transcript,
          analysis.accuracy,
          currentAttempt,
          childAge,
          childProfile?.interests
        );
        
        setFeedback(aiFeedback);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Failed to generate AI feedback after retries:', error);
          toast({
            title: "Unable to Generate Personalized Feedback",
            description: "AI service temporarily unavailable. Please try again.",
            variant: "destructive"
          });
          // Show generic loading message instead of proceeding without feedback
          setFeedback({
            message: "Loading your personalized feedback...",
            encouragement: "Please wait a moment while we prepare your response.",
            emotionalTone: "supportive"
          });
          return; // Don't proceed with the game flow
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }

    setShowFeedback(true);
    setIsGeneratingFeedback(false);

    // Update scoring with more nuanced system
    let pointsEarned = analysis.accuracy;
    if (analysis.isCorrect && currentAttempt === 1) {
      pointsEarned += 20; // Bonus for first try
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
    } else if (analysis.isCorrect) {
      pointsEarned += 10; // Smaller bonus for later attempts
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
    } else {
      setStreak(0); // Reset streak
    }

    // Award stars based on performance
    if (analysis.accuracy >= 90) setStars(stars + 3);
    else if (analysis.accuracy >= 70) setStars(stars + 2);
    else if (analysis.accuracy >= 50) setStars(stars + 1);

    const newScore = score + pointsEarned;
    setScore(newScore);
    setTotalAccuracy(Math.round(newScore / ((currentWordIndex + 1) * 100) * 100));

    // Auto-advance logic
    setTimeout(() => {
      setShowFeedback(false);
      
      console.log('🎯 Auto-advance decision:', {
        currentAttempt,
        maxAttempts,
        isCorrect: analysis.isCorrect,
        accuracy: analysis.accuracy,
        shouldTryAgain: currentAttempt < maxAttempts && !analysis.isCorrect,
        shouldAdvance: analysis.isCorrect || currentAttempt >= maxAttempts
      });
      
      if (analysis.isCorrect) {
        // Correct answer - move to next word
        console.log('✅ Correct answer - advancing to next word');
        cleanupSpeechRecognition();
        
        if (currentWordIndex < personalizedWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setCurrentAttempt(1);
        } else {
          completeGame();
        }
      } else if (currentAttempt < maxAttempts) {
        // Give another try
        console.log(`🔄 Attempt ${currentAttempt} failed - allowing retry`);
        setCurrentAttempt(currentAttempt + 1);
        toast({
          title: `Try ${currentAttempt + 1} of ${maxAttempts}!`,
          description: "You can do it! " + cheerfulCharacter,
        });
      } else {
        // Used all attempts - move to next word automatically
        console.log('⏭️ All attempts used - auto-advancing to next word');
        cleanupSpeechRecognition();
        
        toast({
          title: "Let's try the next word!",
          description: "Don't worry, practice makes perfect! " + cheerfulCharacter,
          variant: "default"
        });
        
        if (currentWordIndex < personalizedWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setCurrentAttempt(1);
        } else {
          completeGame();
        }
      }
    }, 3000); // Longer display time for AI feedback
  };

  const handleHybridSpeechResult = async (result: HybridSpeechResult) => {
    // Get the CURRENT word from the live state, not the closure
    const liveCurrentWord = personalizedWords[currentWordIndex];
    
    // Early exit if we're no longer listening or if currentWord is null
    if (!liveCurrentWord || isGeneratingFeedback) {
      console.log('⚠️ Ignoring hybrid speech result - no current word or already generating feedback');
      return;
    }
    
    setIsGeneratingFeedback(true);
    const targetWord = liveCurrentWord.word.toLowerCase();
    
    console.log('🎯 handleHybridSpeechResult called:', {
      currentWordIndex,
      currentWord: liveCurrentWord?.word,
      targetWord,
      transcript: result.transcript,
      currentAttempt,
      closureWord: currentWord?.word // Show what the closure thinks currentWord is
    });
    
    // Use hybrid pronunciation analysis (prioritizes Microsoft assessment if available)
    const analysis = HybridPronunciationAnalyzer.analyzePronunciation(
      targetWord,
      result.transcript,
      result.confidence,
      result.alternatives,
      result.microsoftAssessment
    );

    const attemptData = {
      word: liveCurrentWord.word, // Use live word, not closure word
      transcript: result.transcript,
      accuracy: analysis.accuracy,
      correct: analysis.isCorrect,
      confidence: result.confidence,
      attempt: currentAttempt,
      timestamp: new Date(),
      phonemeAccuracy: analysis.phonemeAccuracy,
      suggestions: analysis.suggestions,
      assessmentSource: analysis.source,
      microsoftScore: result.microsoftAssessment?.pronunciationScore
    };

    setAttempts([...attempts, attemptData]);

    // Generate AI-powered feedback with enhanced Microsoft data
    const childAge = childProfile?.childBirthYear ? 
      new Date().getFullYear() - childProfile.childBirthYear : 5;
    
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount < maxRetries) {
      try {
        const feedbackPrompt = result.microsoftAssessment 
          ? `${liveCurrentWord.word} (pronounced: ${result.transcript}, Microsoft pronunciation score: ${result.microsoftAssessment.pronunciationScore})`
          : `${liveCurrentWord.word} (pronounced: ${result.transcript})`;
          
        const aiFeedback = await aiSpeechService.generateEncouragingFeedback(
          childProfile?.childName || 'friend',
          feedbackPrompt,
          result.transcript,
          analysis.accuracy,
          currentAttempt,
          childAge,
          childProfile?.interests
        );
        
        // Enhance feedback with Microsoft-specific insights
        if (result.microsoftAssessment && analysis.detailedFeedback) {
          aiFeedback.technicalTip = analysis.detailedFeedback;
        }
        
        setFeedback(aiFeedback);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Failed to generate AI feedback after retries:', error);
          setFeedback({
            message: "Great attempt! Keep practicing!",
            encouragement: "You're doing wonderfully! " + cheerfulCharacter,
            emotionalTone: "supportive",
            technicalTip: analysis.detailedFeedback
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
    }

    setShowFeedback(true);
    setIsGeneratingFeedback(false);

    // Enhanced scoring with Microsoft assessment bonus
    let pointsEarned = analysis.accuracy;
    if (result.microsoftAssessment?.pronunciationScore) {
      pointsEarned += (result.microsoftAssessment.pronunciationScore - 50) * 0.5; // Bonus for high Microsoft scores
    }
    
    if (analysis.isCorrect && currentAttempt === 1) {
      pointsEarned += 20;
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
    } else if (analysis.isCorrect) {
      pointsEarned += 10;
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
    } else {
      setStreak(0);
    }

    if (analysis.accuracy >= 90) setStars(stars + 3);
    else if (analysis.accuracy >= 70) setStars(stars + 2);
    else if (analysis.accuracy >= 50) setStars(stars + 1);

    const newScore = score + pointsEarned;
    setScore(newScore);
    setTotalAccuracy(Math.round(newScore / ((currentWordIndex + 1) * 100) * 100));

    // Auto-advance with same logic as regular handler
    setTimeout(() => {
      setShowFeedback(false);
      
      if (analysis.isCorrect) {
        cleanupSpeechRecognition();
        if (currentWordIndex < personalizedWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setCurrentAttempt(1);
        } else {
          completeGame();
        }
      } else if (currentAttempt < maxAttempts) {
        setCurrentAttempt(currentAttempt + 1);
        toast({
          title: `Try ${currentAttempt + 1} of ${maxAttempts}!`,
          description: "You can do it! " + cheerfulCharacter,
        });
      } else {
        cleanupSpeechRecognition();
        toast({
          title: "Let's try the next word!",
          description: "Don't worry, practice makes perfect! " + cheerfulCharacter,
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

  const completeGame = async () => {
    // Generate AI session summary with retry mechanism
    const wordsCompleted = attempts.filter(a => a.correct).length;
    const childAge = childProfile?.childBirthYear ? 
      new Date().getFullYear() - childProfile.childBirthYear : 5;

    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const summary = await aiSpeechService.generateSessionSummary(
          childProfile?.childName || 'friend',
          personalizedWords.length,
          wordsCompleted,
          totalAccuracy,
          score,
          childAge,
          childProfile?.interests
        );

        setSessionSummary(summary);
        setShowSessionSummary(true);
        break;

      } catch (error) {
        retryCount++;
        console.warn(`Failed to generate session summary (attempt ${retryCount}):`, error);
        
        if (retryCount >= maxRetries) {
          console.error('Max retries reached for session summary generation');
          setSessionSummary("Great job! The AI is taking a break, but you did wonderfully!");
          setShowSessionSummary(true);
          break;
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    try {
      // Save to backend
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

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/games/session/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score,
          accuracy: totalAccuracy,
          gameData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

    } catch (error) {
      console.error('Error saving game session:', error);
      // Still show the summary even if save fails - AI summary already generated above
      if (!sessionSummary) {
        setSessionSummary("Great job! You worked hard today!");
      }
      setShowSessionSummary(true);
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
      description: "No worries! Let's try the next word " + cheerfulCharacter,
    });

    if (currentWordIndex < personalizedWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentAttempt(1);
      setShowFeedback(false);
    } else {
      completeGame();
    }
  };

  const playWordAudio = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.7;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      
      // Try to use a child-friendly voice
      const voices = speechSynthesis.getVoices();
      const childVoice = voices.find(voice => 
        voice.name.includes('Female') || voice.name.includes('Child')
      );
      if (childVoice) {
        utterance.voice = childVoice;
      }
      
      speechSynthesis.speak(utterance);
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
          <p className="text-muted-foreground mt-2">Our AI is preparing words just for you! {cheerfulCharacter}</p>
        </motion.div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl text-red-500">No words available. Please try again.</p>
        </div>
      </div>
    );
  }

  // Session Summary Modal
  if (showSessionSummary && sessionSummary) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-card border-2 border-[#F5B82E] rounded-3xl p-8 max-w-lg w-full text-center overflow-y-auto max-h-[90vh]"
        >
          {/* Celebration Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F5B82E] to-orange-400 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#F5B82E] mb-2">
              {sessionSummary.title}
            </h1>
          </motion.div>

          {/* Character and Message */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <div className="text-6xl mb-4">{cheerfulCharacter}</div>
            <p className="text-lg text-foreground mb-4">
              {sessionSummary.message}
            </p>
          </motion.div>

          {/* Stats Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-[#F5B82E]">{score}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-center">
                {[...Array(Math.min(3, Math.floor(stars / 10)))].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-[#F5B82E] fill-[#F5B82E]" />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">Stars Earned</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-[#F5B82E]">{maxStreak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-[#F5B82E]">{totalAccuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>

          {/* Achievements */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-[#F5B82E]" />
              Amazing Achievements!
            </h3>
            <div className="space-y-2">
              {sessionSummary.achievements.map((achievement: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm">{achievement}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Encouragement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-6 p-4 bg-[#F5B82E]/10 rounded-lg border border-[#F5B82E]/20"
          >
            <p className="text-foreground font-medium">
              {sessionSummary.encouragement}
            </p>
          </motion.div>

          {/* Next Goals */}
          {sessionSummary.nextGoals && sessionSummary.nextGoals.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold mb-2 flex items-center justify-center gap-2">
                <Target className="w-4 h-4 text-[#F5B82E]" />
                Next Time Let's Try:
              </h4>
              <div className="space-y-1">
                {sessionSummary.nextGoals.map((goal: string, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {goal}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Save the game completion results first
                onComplete({ 
                  score, 
                  accuracy: totalAccuracy, 
                  stars, 
                  maxStreak,
                  summary: sessionSummary 
                });
                // Then navigate to speech therapy page to see all games
                setLocation('/speech-therapy');
              }}
              className="flex-1 bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Continue Learning! 🚀
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-lg font-bold">
              {currentWordIndex + 1}/{personalizedWords.length}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-lg font-bold text-[#F5B82E] flex items-center gap-1">
              {score}
              <Zap className="w-4 h-4" />
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Stars</div>
            <div className="text-lg font-bold text-[#F5B82E] flex items-center gap-1">
              {Math.floor(stars / 10)}
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">Streak</div>
            <div className="text-lg font-bold text-green-500 flex items-center gap-1">
              {streak}
              <Heart className="w-4 h-4 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-3 mb-8 relative overflow-hidden">
        <motion.div 
          className="bg-gradient-to-r from-[#F5B82E] to-orange-400 h-3 rounded-full transition-all duration-500"
          style={{ width: `${((currentWordIndex + 1) / personalizedWords.length) * 100}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${((currentWordIndex + 1) / personalizedWords.length) * 100}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {Math.round(((currentWordIndex + 1) / personalizedWords.length) * 100)}%
        </div>
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
                className="text-3xl"
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
                <span className="text-sm font-medium text-green-600">🚀 Groq Whisper</span>
              </div>
            </div>

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
              onClick={isListening || isGroqListening ? stopListening : startEnhancedListening}
              disabled={showFeedback || isGeneratingFeedback}
              className={`w-full py-6 px-6 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-all transform hover:scale-105 ${
                isListening || isGroqListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg' 
                  : 'bg-gradient-to-r from-[#F5B82E] to-orange-400 hover:shadow-xl text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              whileTap={{ scale: 0.95 }}
            >
              {isListening || isGroqListening ? (
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
                <div className="text-sm font-medium text-yellow-700">
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
              className="bg-white/95 backdrop-blur border-4 border-[#F5B82E] rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl"
            >
              {/* Animated Character */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  feedback.emotionalTone === 'excited' ? 'bg-green-100 border-4 border-green-300' :
                  feedback.emotionalTone === 'proud' ? 'bg-purple-100 border-4 border-purple-300' :
                  feedback.emotionalTone === 'encouraging' ? 'bg-yellow-100 border-4 border-yellow-300' :
                  'bg-blue-100 border-4 border-blue-300'
                }`}>
                  {feedback.emotionalTone === 'excited' ? (
                    <PartyPopper className="w-12 h-12 text-green-600" />
                  ) : feedback.emotionalTone === 'proud' ? (
                    <Trophy className="w-12 h-12 text-purple-600" />
                  ) : feedback.emotionalTone === 'encouraging' ? (
                    <Smile className="w-12 h-12 text-yellow-600" />
                  ) : (
                    <Heart className="w-12 h-12 text-blue-600" />
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
                <h3 className="text-2xl font-bold mb-3 text-[#F5B82E]">
                  {feedback.message}
                </h3>

                <p className="text-lg text-foreground mb-4 bg-[#F5B82E]/10 p-4 rounded-lg border border-[#F5B82E]/20">
                  {feedback.encouragement}
                </p>

                {feedback.technicalTip && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-700">Helpful Tip:</span>
                    </div>
                    <p className="text-sm text-blue-600">{feedback.technicalTip}</p>
                  </div>
                )}

                {feedback.nextSteps && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-green-700">Next Step:</span>
                    </div>
                    <p className="text-sm text-green-600">{feedback.nextSteps}</p>
                  </div>
                )}
              </motion.div>

              {/* Performance Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-4"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          i < Math.floor((attempts[attempts.length - 1]?.accuracy || 0) / 20)
                            ? 'text-[#F5B82E] fill-[#F5B82E]'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white py-3 px-6 rounded-xl">
                  <p className="text-sm font-medium">Points Earned</p>
                  <p className="text-2xl font-bold">
                    +{attempts[attempts.length - 1]?.accuracy || 0} 🎯
                  </p>
                </div>
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={() => setShowFeedback(false)}
                className="w-full bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105"
                whileTap={{ scale: 0.95 }}
              >
                {currentWordIndex >= personalizedWords.length - 1 && currentAttempt >= maxAttempts ? 
                  "🎉 Finish Game!" : 
                  currentAttempt < maxAttempts && (attempts[attempts.length - 1]?.accuracy || 0) < 70 ?
                  "Try Again! 💪" :
                  "Next Word! 🚀"
                }
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
