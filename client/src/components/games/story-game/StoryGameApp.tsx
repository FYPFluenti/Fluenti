import React, { useReducer, useEffect, useRef } from 'react';
import { GameState, GameAction, Theme, CustomStoryInputs, CustomStoryStep, Character, EndingType, StoryChunk, ThematicFeedback, MAX_SCORE, CHALLENGES_PER_LEVEL, ALL_BADGES, INITIAL_FOCUS_STARS, MAX_FOCUS_STARS, TherapyType, BadgeInfo, GamePhase, RewardContent, AssessmentResult, SocialAssessmentResult } from '@/types/games/story-game';
import WelcomeScreen from './WelcomeScreen';
import StartScreen from './StartScreen';
import StoryScreen from './StoryScreen';
import RewardScreen from './RewardScreen';
import CustomAdventureScreen from './CustomAdventureScreen';
import CharacterSelectionScreen from './CharacterSelectionScreen';
import AssessmentScreen from './AssessmentScreen';
import AnalysisResultScreen from './AnalysisResultScreen';
import { startStory, continueStory, createCustomStory, assessSpeechLevel, generateRewardContent, analyzeSocialCommunication, testApiKey, getChildAgeFromOnboarding, calculateChildAge, ChildAge } from '@/services/geminiService';
import { useOnboardingData } from '@/hooks/useOnboarding';
import { OnboardingData } from '@/types/auth';
import { useStoryGameProgress, useSaveStoryGameProgress, useSaveStoryGameSession } from '@/hooks/useStoryGameProgress';
import TherapySelectionScreen from './TherapySelectionScreen';
import SocialAssessmentScreen from './SocialAssessmentScreen';

const initialCustomInputs: CustomStoryInputs = {
    characterName: '',
    setting: '',
    interest: '',
    currentStep: 'characterName',
};

const initialState: GameState = {
  phase: 'welcome',
  therapyType: 'none',
  assessmentFeedback: null,
  assessmentTitle: null,
  sessionBadges: [],
  character: null,
  theme: null,
  story: [],
  totalScore: 0,
  speechScore: 0,
  levels: {
    pronunciation: 1,
    fluency: 1,
    dld: 1,
    social: 1,
  },
  speechChallengesCompletedInLevel: 0,
  focusStars: INITIAL_FOCUS_STARS,
  latestSpeechFeedback: null,
  latestThematicFeedback: null,
  latestLanguageFeedback: null,
  wordBank: [],
  latestBadgeEarned: null,
  endingType: null,
  rewardContent: null,
  isLoading: false,
  error: null,
  isListening: false,
  isOnCooldown: false,
  customStoryInputs: initialCustomInputs,
};

// Fisher-Yates shuffle algorithm
function shuffle(array: BadgeInfo[]) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[currentIndex], array[randomIndex]];
    }
    return array;
}


function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_SAVED_PROGRESS': {
      const { levels, therapyType, assessmentTitle, assessmentFeedback } = action.payload;
      // Initialize sessionBadges if not already set (needed when skipping assessment)
      // Create badges for levels starting from the current level
      const currentLevel = therapyType !== 'none' && levels[therapyType] ? levels[therapyType] : 1;
      const shuffledBadges = shuffle([...ALL_BADGES]);
      const sessionBadges = state.sessionBadges.length > 0 
        ? state.sessionBadges 
        : shuffledBadges.slice(0, 10).map((badge, index) => ({
            ...badge,
            level: currentLevel + index
          }));
      
      return {
        ...state,
        levels,
        therapyType: therapyType === 'none' ? state.therapyType : therapyType,
        assessmentTitle: assessmentTitle || state.assessmentTitle,
        assessmentFeedback: assessmentFeedback || state.assessmentFeedback,
        sessionBadges: sessionBadges
      };
    }
    case 'PROCEED_TO_THERAPY_SELECTION':
        return { ...state, phase: 'therapySelection' };
    case 'SELECT_THERAPY_GROUP': {
        const therapyType = action.payload;
        // Save therapy type selection immediately
        // Note: We'll save this in the component handler to ensure it's saved to DB
        if (therapyType === 'social') {
            return { ...state, therapyType, phase: 'socialAssessment' };
        }
        return { ...state, therapyType, phase: 'assessment' };
    }
    case 'SELECT_THERAPY_GROUP_SKIP_ASSESSMENT': {
        // Skip assessment because it already exists - go directly to character selection
        const therapyType = action.payload;
        // Initialize sessionBadges if not already set (needed when skipping assessment)
        // Create badges for levels starting from the current level
        const currentLevel = state.levels[therapyType] || 1;
        const shuffledBadges = shuffle([...ALL_BADGES]);
        const sessionBadges = state.sessionBadges.length > 0 
          ? state.sessionBadges 
          : shuffledBadges.slice(0, 10).map((badge, index) => ({
              ...badge,
              level: currentLevel + index
            }));
        
        return { 
          ...state, 
          therapyType, 
          phase: 'characterSelection',
          sessionBadges: sessionBadges
        };
    }
    case 'START_ASSESSMENT_ANALYSIS':
    case 'START_SOCIAL_ASSESSMENT_ANALYSIS':
      return { ...state, isLoading: true, error: null };
    case 'ASSESSMENT_ANALYSIS_SUCCESS': {
        const { level, title, feedback } = action.payload;
        const currentTherapy = state.therapyType;

        if (currentTherapy === 'none') {
            return { ...state, isLoading: false, error: "Invalid therapy type for assessment." };
        }

        // Handle all therapy types including social
        const newLevels = { ...state.levels, [currentTherapy]: level };
        const shuffledBadges = shuffle([...ALL_BADGES]);
        const sessionBadges = shuffledBadges.slice(0, 10).map((badge, index) => ({
            ...badge,
            level: level + index + 1
        }));
        
        return { 
            ...state, 
            isLoading: false, 
            assessmentTitle: title,
            assessmentFeedback: feedback,
            sessionBadges: sessionBadges,
            levels: newLevels,
            phase: 'analysisResult'
        };
    }
    case 'SOCIAL_ASSESSMENT_SUCCESS':
        {
      const shuffledBadges = shuffle([...ALL_BADGES]);
      const sessionBadges = shuffledBadges.slice(0, 10).map((badge, index) => ({
        ...badge,
        level: index + 2 // Badges are awarded from level 2 upwards
      }));

      return { 
        ...state, 
        isLoading: false, 
        therapyType: action.payload.therapyType,
        assessmentTitle: action.payload.title,
        assessmentFeedback: action.payload.feedback,
        sessionBadges: sessionBadges,
        phase: 'analysisResult'
      };
    }
    case 'ASSESSMENT_ANALYSIS_FAILURE': {
        const currentTherapy = state.therapyType;
         if (currentTherapy === 'none' || currentTherapy === 'social') {
            return { ...state, isLoading: false, error: "An unknown error occurred." };
        }
        const therapyName = { pronunciation: "Pronunciation", fluency: "Fluency", dld: "Language" }[currentTherapy];
        const newLevels = { ...state.levels, [currentTherapy]: 5 }; // Default to level 5 on error
        return {
            ...state,
            isLoading: false,
            error: action.payload,
            levels: newLevels,
            assessmentTitle: "Let's Start!",
            assessmentFeedback: `Oops, my ears had a glitch! We'll start you at Level 5 for your ${therapyName} adventure and go from there.`,
            phase: 'analysisResult'
        };
    }
    case 'SOCIAL_ASSESSMENT_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        therapyType: 'social',
        assessmentTitle: "Oops, an error!",
        assessmentFeedback: "Oops, something went wrong with my ears! Let's just focus on our social adventure.",
        phase: 'analysisResult'
      };
    case 'PROCEED_TO_CHARACTER_SELECTION':
      return { ...state, phase: 'characterSelection' };
    case 'SELECT_CHARACTER':
      if (action.payload.id === 'custom') {
        return { 
            ...initialState, 
            phase: 'customizing', 
            character: action.payload, 
            therapyType: state.therapyType,
            assessmentFeedback: state.assessmentFeedback,
            assessmentTitle: state.assessmentTitle,
            sessionBadges: state.sessionBadges,
            levels: state.levels,
        };
      }
      return { ...state, phase: 'start', character: action.payload };
    case 'START_GAME':
      return { ...state, isLoading: true, theme: action.payload };
    case 'START_CUSTOM_ADVENTURE':
      return { ...initialState, phase: 'customizing', theme: 'Custom Adventure' };
    case 'CUSTOM_STORY_STEP_SUCCESS': {
        const { step, value } = action.payload;
        const newInputs = { ...state.customStoryInputs, [step]: value };
        
        let nextStep: CustomStoryStep = 'done';
        if (step === 'characterName') nextStep = 'setting';
        if (step === 'setting') nextStep = 'interest';
        
        return {
            ...state,
            customStoryInputs: { ...newInputs, currentStep: nextStep },
        };
    }
    case 'CREATE_CUSTOM_STORY_START':
        return { ...state, isLoading: true };
    case 'START_STORY_SUCCESS': {
      const newStoryChunk: StoryChunk = { 
        id: 1, 
        author: 'ai', 
        text: action.payload.storyChunk || '', 
        suggestions: action.payload.suggestions 
      };
      return {
        ...state,
        phase: 'playing',
        isLoading: false,
        story: [newStoryChunk],
        error: null,
      };
    }
    // START_SESSION case removed - not used in GameAction type
    case 'START_STORY_FAILURE': {
        return { 
            ...state, 
            error: action.payload,
            phase: 'start', // Stay on start screen, don't redirect
            isLoading: false, 
            therapyType: state.therapyType,
            assessmentFeedback: state.assessmentFeedback,
            assessmentTitle: state.assessmentTitle,
            sessionBadges: state.sessionBadges,
            levels: state.levels,
        };
    }
    case 'START_LISTENING':
      return { ...state, isListening: true, error: null };
    case 'STOP_LISTENING':
      return { ...state, isListening: false };
    case 'CONTINUE_STORY_START': {
      const newUserChunk: StoryChunk = { id: state.story.length + 1, author: 'user', text: action.payload };
      return {
        ...state,
        isLoading: true,
        latestSpeechFeedback: null,
        latestThematicFeedback: null,
        latestLanguageFeedback: null,
        latestBadgeEarned: null,
        story: [...state.story, newUserChunk],
      };
    }
    case 'CONTINUE_STORY_SUCCESS': {
        const { storyChunk, emotion, suggestions, creativityScore, speechFeedback, thematicFeedback, languageFeedback, challengeSuccess, challenge } = action.payload;
        
        const newAiChunk: StoryChunk = { 
          id: state.story.length + 1, 
          author: 'ai', 
          text: storyChunk || '', 
          emotion, 
          suggestions, 
          challenge 
        };
        
        let newLevels = { ...state.levels };
        let newWordsCorrect = state.speechChallengesCompletedInLevel;
        let newBadge: GameState['latestBadgeEarned'] = null;
        let newFocusStars = state.focusStars;
        let newWordBank = state.wordBank;
        let finalEndingType: EndingType | null = null;
        let sessionBadgesToUse: GameState['sessionBadges'] = state.sessionBadges;

        if (languageFeedback?.newVocabularyIntroduced) {
            newWordBank = Array.from(new Set([...state.wordBank, ...languageFeedback.newVocabularyIntroduced]));
        }

        // --- Authoritative Game Logic ---
        // CRITICAL FIX: At this point, story array has: [...previous chunks, user input]
        // So we need to look at index -2 to find the AI's challenge that the user was responding to
        const lastAiChunk = state.story.length >= 2 ? state.story[state.story.length - 2] : null;
        const wasPreviousTurnChallenge = lastAiChunk?.author === 'ai' && !!lastAiChunk.challenge;
        
        // Add debug logging
        console.log('StoryGameApp Challenge Detection:', {
            storyLength: state.story.length,
            lastAiChunk,
            wasPreviousTurnChallenge,
            challengeSuccess,
            focusStars: state.focusStars,
            newFocusStars
        });

        // CRITICAL: Authoritatively set the creativity score. It MUST be 0 if it was a challenge turn.
        const creativityToAdd = wasPreviousTurnChallenge ? 0 : creativityScore;
        const newScore = Math.min(MAX_SCORE, state.totalScore + creativityToAdd);
        
        // CRITICAL: Speech score changes ONLY during challenges, and comes from AI evaluation
        const newSpeechScore = Math.min(MAX_SCORE, state.speechScore + speechFeedback.scoreChange);
        
        // CRITICAL: Only modify stars and challenge progress if the user was responding to a challenge.
        if (wasPreviousTurnChallenge) {
            console.log('PROCESSING CHALLENGE RESULT:', {
                challengeSuccess,
                oldStars: state.focusStars,
                oldChallengesCompleted: state.speechChallengesCompletedInLevel
            });
            
            // challengeSuccess should be true/false from AI evaluation, never null for challenge responses
            if (challengeSuccess === true) {
                newFocusStars = Math.min(MAX_FOCUS_STARS, state.focusStars + 1);
                newWordsCorrect++; // Increment completed challenges counter
                console.log('CHALLENGE SUCCESS: +1 star, +1 challenge completed');
            } else if (challengeSuccess === false) {
                newFocusStars = Math.max(0, state.focusStars - 1);
                console.log('CHALLENGE FAILURE: -1 star, no progress');
                // Don't increment challenge counter on failure
            } else {
                console.warn('CHALLENGE EVALUATION ERROR: challengeSuccess should not be null for challenge responses!');
            }
            
            console.log('AFTER CHALLENGE PROCESSING:', {
                newStars: newFocusStars,
                newChallengesCompleted: newWordsCorrect
            });
        } else {
            console.log('REGULAR STORY TURN: No star changes');
        }
        // CRITICAL: Stars should NEVER change during regular story turns (when wasPreviousTurnChallenge is false)

        // Check for WIN condition (Level Up) - takes priority
        // Applies to ALL therapy types: pronunciation, fluency, DLD, social
        if (newWordsCorrect >= CHALLENGES_PER_LEVEL) {
            finalEndingType = 'happy';
            if (state.therapyType !== 'none') {
                newLevels[state.therapyType]++;
            }
            const currentLevel = state.therapyType !== 'none' ? newLevels[state.therapyType] : 1;
            
            // If sessionBadges is empty, initialize it now (fallback for cases where assessment was skipped)
            if (sessionBadgesToUse.length === 0) {
              const shuffledBadges = shuffle([...ALL_BADGES]);
              sessionBadgesToUse = shuffledBadges.slice(0, 10).map((badge, index) => ({
                ...badge,
                level: currentLevel + index
              }));
            }
            
            newBadge = sessionBadgesToUse.find(b => b.level === currentLevel) || null;
            newWordsCorrect = 0; // Reset for next level
            
            console.log('[Level Up] Badge check:', {
              currentLevel,
              sessionBadgesCount: sessionBadgesToUse.length,
              foundBadge: !!newBadge,
              badgeTitle: newBadge?.title
            });
        } 
        // Check for LOSE condition (Focus Stars) - only if not already won
        // Applies to ALL therapy types: pronunciation, fluency, DLD, social
        else if (newFocusStars <= 0) {
            finalEndingType = 'sad';
        }
        // Story continues if neither win nor lose condition is met
        // NO natural conclusions - story ONLY ends on win/lose
        
        // Update sessionBadges if we initialized it during level up
        const updatedSessionBadges = sessionBadgesToUse;
        
        const newState = {
            ...state,
            isLoading: false,
            story: [...state.story, newAiChunk],
            totalScore: Math.max(0, newScore),
            speechScore: Math.max(0, newSpeechScore),
            levels: newLevels,
            speechChallengesCompletedInLevel: newWordsCorrect,
            focusStars: newFocusStars,
            latestSpeechFeedback: speechFeedback,
            latestThematicFeedback: thematicFeedback,
            latestLanguageFeedback: languageFeedback || null,
            wordBank: newWordBank,
            latestBadgeEarned: newBadge,
            sessionBadges: updatedSessionBadges,
            error: null,
            endingType: finalEndingType,
        };

        return newState;
    }
    case 'CONTINUE_STORY_FAILURE':
        return {
            ...state,
            isLoading: false,
            error: action.payload,
            story: state.story.slice(0, -1),
        };
    case 'FINISH_STORY_NARRATION':
        return { ...state, phase: 'reward' };
    case 'FETCH_REWARD_CONTENT_START':
        return { ...state, isLoading: true, rewardContent: null };
    case 'FETCH_REWARD_CONTENT_SUCCESS':
        return { ...state, isLoading: false, rewardContent: action.payload };
    case 'FETCH_REWARD_CONTENT_FAILURE':
        // Fallback to a generic reward if the API fails
        return { 
            ...state, 
            isLoading: false, 
            error: action.payload,
            rewardContent: {
                title: "Adventure Complete!",
                message: "You created a wonderful story!",
                badgeText: "Creative Storyteller Badge"
            }
        };
    case 'RESTART_GAME':
      // Manually reset game-specific state to their initial values
      // while preserving session-specific state like therapy type and levels.
      // This ensures a clean start for the new game without making the user
      // go through the initial setup again.
      return {
        ...state, // Preserve existing state like levels, therapyType, etc.
        phase: 'characterSelection',
        // Reset game-specific state
        character: null,
        theme: null,
        story: [],
        totalScore: 0,
        speechScore: 0,
        speechChallengesCompletedInLevel: 0,
        focusStars: INITIAL_FOCUS_STARS,
        latestSpeechFeedback: null,
        latestThematicFeedback: null,
        latestLanguageFeedback: null,
        wordBank: [],
        latestBadgeEarned: null,
        endingType: null,
        rewardContent: null,
        isLoading: false,
        error: null,
        isListening: false,
        isOnCooldown: false,
        customStoryInputs: initialCustomInputs,
      };
    case 'START_COOLDOWN':
        return { ...state, isOnCooldown: true };
    case 'END_COOLDOWN':
        return { ...state, isOnCooldown: false };
    default:
      return state;
  }
}

const StoryGameApp: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  const { phase, endingType, totalScore, levels, therapyType, character, theme } = state;
  const currentLevel = therapyType !== 'none' ? levels[therapyType] : 1;
  
  // Session tracking
  const sessionStartTimeRef = React.useRef<Date | null>(null);
  const sessionIdRef = React.useRef<string | null>(null);
  
  // Fetch onboarding data to get child age
  const { onboardingData } = useOnboardingData();
  
  // Fetch story game progress
  const { progress: storyGameProgress, isLoading: progressLoading } = useStoryGameProgress();
  const saveProgress = useSaveStoryGameProgress();
  const saveSession = useSaveStoryGameSession();
  
  // Calculate child age from onboarding data
  const childAge: ChildAge = React.useMemo(() => {
    if (onboardingData) {
      // calculateChildAge handles both Date and string types for childBirthDate
      return calculateChildAge(onboardingData.childBirthDate, onboardingData.childBirthYear);
    }
    // Return default age if onboarding data not available
    return { years: 6, months: 0 };
  }, [onboardingData]);

  // Load saved progress on mount - only redirect on initial load, not during assessment flow
  useEffect(() => {
    if (storyGameProgress && !progressLoading) {
      // Load saved levels (always load if available)
      if (storyGameProgress.currentLevels) {
        dispatch({
          type: 'LOAD_SAVED_PROGRESS',
          payload: {
            levels: storyGameProgress.currentLevels,
            therapyType: storyGameProgress.selectedTherapyType || 'none'
          }
        } as any);
      }
      
      // Only auto-redirect if we're starting from welcome phase (initial load)
      // Don't redirect if we're already in assessment/analysisResult/characterSelection phase
      // Redirect to therapy selection so users can choose any therapy type (new or previously assessed)
      if (
        storyGameProgress.hasCompletedInitialSetup && 
        storyGameProgress.selectedTherapyType &&
        phase === 'welcome'
      ) {
        // Set therapy type and levels from saved progress
        dispatch({
          type: 'LOAD_SAVED_PROGRESS',
          payload: {
            levels: storyGameProgress.currentLevels,
            therapyType: storyGameProgress.selectedTherapyType,
            assessmentTitle: storyGameProgress.assessments[storyGameProgress.selectedTherapyType]?.title || null,
            assessmentFeedback: storyGameProgress.assessments[storyGameProgress.selectedTherapyType]?.feedback || null
          }
        } as any);
        // Redirect to therapy selection so users can choose any focus
        // handleTherapySelection will handle skipping assessment if already assessed
        dispatch({ type: 'PROCEED_TO_THERAPY_SELECTION' });
      }
    }
  }, [storyGameProgress, progressLoading, phase]);

  // Expose API test function to browser console for debugging
  useEffect(() => {
    // @ts-ignore - exposing to window for console testing
    window.testGeminiApi = async () => {
      console.log("🧪 Testing Gemini API...");
      const result = await testApiKey();
      if (result.success) {
        console.log("✅", result.message);
      } else {
        console.error("❌", result.message);
        if (result.error) {
          console.error("Error:", result.error);
        }
      }
      return result;
    };
    console.log("💡 To test your API key, run: testGeminiApi() in the console");
  }, []);

  // Track session start when game begins
  useEffect(() => {
    if (phase === 'playing' && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date();
      sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [phase]);

  // Ref to track if session has already been saved (prevents multiple saves)
  const sessionSavedRef = useRef(false);

  // Save session when game ends (only once)
  // Only depend on phase to prevent multiple triggers - state values are always current
  useEffect(() => {
    // Only save when entering reward phase, session exists, and hasn't been saved yet
    if (phase === 'reward' && sessionStartTimeRef.current && sessionIdRef.current && state.therapyType !== 'none' && !sessionSavedRef.current) {
      sessionSavedRef.current = true; // Mark as saved immediately to prevent multiple calls
      
      const saveGameSession = async () => {
        try {
          // Use current state values (state from useReducer is always current)
          // TypeScript: We've already checked therapyType !== 'none', so we can safely cast
          const currentTherapyType = state.therapyType as 'pronunciation' | 'fluency' | 'dld' | 'social';
          const currentLevels = state.levels;
          const levelAtStart = storyGameProgress?.currentLevels?.[currentTherapyType] || currentLevels[currentTherapyType];
          const levelAtEnd = currentLevels[currentTherapyType];
          const levelUp = levelAtEnd > levelAtStart;

          console.log('[Session Save] Saving session:', {
            therapyType: currentTherapyType,
            levelAtStart,
            levelAtEnd,
            levelUp,
            totalScore: state.totalScore
          });

          await saveSession.mutateAsync({
            sessionId: sessionIdRef.current!,
            therapyType: currentTherapyType,
            character: state.character?.name,
            theme: state.theme || undefined,
            totalScore: state.totalScore,
            speechScore: state.speechScore,
            creativityScore: state.totalScore,
            endingType: state.endingType || undefined,
            challengesCompleted: state.speechChallengesCompletedInLevel,
            levelAtStart,
            levelAtEnd,
            levelUp,
            storyLength: state.story.length,
            wordBank: state.wordBank,
            startTime: sessionStartTimeRef.current!.toISOString(),
            endTime: new Date().toISOString()
          });

          // Save badge if earned (per therapy type)
          const badgesToSave: { pronunciation: string[]; fluency: string[]; dld: string[]; social: string[] } = {
            pronunciation: [],
            fluency: [],
            dld: [],
            social: []
          };
          if (state.latestBadgeEarned) {
            badgesToSave[currentTherapyType] = [state.latestBadgeEarned.title];
          }
          
          // Ensure current level never goes below initial assessment level
          const initialAssessmentLevel = storyGameProgress?.assessments?.[currentTherapyType]?.level;
          const finalLevels = { ...currentLevels };
          if (initialAssessmentLevel && finalLevels[currentTherapyType] < initialAssessmentLevel) {
            // If child lost and level went below initial, keep it at initial level
            finalLevels[currentTherapyType] = initialAssessmentLevel;
          }
          
          console.log('[Session Save] Updating progress with levels:', finalLevels);
          
          // Update progress levels and badges
          await saveProgress.mutateAsync({
            currentLevels: finalLevels,
            ...(Object.keys(badgesToSave).some(key => badgesToSave[key as keyof typeof badgesToSave].length > 0) && { badgesEarned: badgesToSave })
          });
          
          console.log('[Session Save] ✅ Session saved successfully');
          
          // Reset session tracking
          sessionStartTimeRef.current = null;
          sessionIdRef.current = null;
        } catch (error) {
          console.error('Failed to save game session:', error);
          // Reset the flag on error so it can retry if needed (but only once more)
          sessionSavedRef.current = false;
        }
      };
      saveGameSession();
    }
    
    // Reset saved flag when leaving reward phase
    if (phase !== 'reward') {
      sessionSavedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]); // Only depend on phase - state values are always current from useReducer

  useEffect(() => {
    if (phase === 'reward' && !state.rewardContent && !state.isLoading) {
      const fetchReward = async () => {
        dispatch({ type: 'FETCH_REWARD_CONTENT_START' });
        try {
          const content = await generateRewardContent(endingType || 'neutral', totalScore, currentLevel, character, theme, therapyType, childAge);
          dispatch({ type: 'FETCH_REWARD_CONTENT_SUCCESS', payload: content });
        } catch(e: any) {
          dispatch({ type: 'FETCH_REWARD_CONTENT_FAILURE', payload: e.message });
        }
      };
      fetchReward();
    }
  }, [phase, endingType, totalScore, currentLevel, character, theme, therapyType, state.rewardContent, state.isLoading, childAge]);

  const handleAssessmentComplete = async (results: AssessmentResult[]) => {
    if (state.therapyType === 'none' || state.therapyType === 'social') return;
    dispatch({ type: 'START_ASSESSMENT_ANALYSIS' });
    try {
      const { level, title, feedbackText } = await assessSpeechLevel(results, state.therapyType, childAge);
      dispatch({ type: 'ASSESSMENT_ANALYSIS_SUCCESS', payload: { level, title, feedback: feedbackText } });
      
      // Save assessment data to database
      // Note: API expects 'assessment' (singular) but we cast it as any to match server interface
      try {
        await saveProgress.mutateAsync({
          assessment: {
            therapyType: state.therapyType,
            level,
            title,
            feedback: feedbackText
          },
          currentLevels: {
            ...state.levels,
            [state.therapyType]: level
          },
          selectedTherapyType: state.therapyType,
          hasCompletedInitialSetup: true
        } as any);
      } catch (saveError) {
        console.error('Failed to save assessment:', saveError);
      }
    } catch (e: any) {
      dispatch({ type: 'ASSESSMENT_ANALYSIS_FAILURE', payload: e.message });
    }
  };

  const handleSocialAssessmentComplete = async (results: SocialAssessmentResult[]) => {
    dispatch({ type: 'START_SOCIAL_ASSESSMENT_ANALYSIS' });
    try {
      const { level, title, feedbackText } = await analyzeSocialCommunication(results, childAge);
      dispatch({ type: 'ASSESSMENT_ANALYSIS_SUCCESS', payload: { level, title, feedback: feedbackText } });
      
      // Save social assessment data to database
      // Note: API expects 'assessment' (singular) but we cast it as any to match server interface
      try {
        await saveProgress.mutateAsync({
          assessment: {
            therapyType: 'social',
            level,
            title,
            feedback: feedbackText
          },
          currentLevels: {
            ...state.levels,
            social: level
          },
          selectedTherapyType: 'social',
          hasCompletedInitialSetup: true
        } as any);
      } catch (saveError) {
        console.error('Failed to save social assessment:', saveError);
      }
    } catch (e: any) {
      dispatch({ type: 'SOCIAL_ASSESSMENT_FAILURE', payload: e.message });
    }
  };

  const handleSelectCharacter = (character: Character) => {
    dispatch({ type: 'SELECT_CHARACTER', payload: character });
  };

  const handleStart = async (theme: Theme) => {
    if (!state.character) {
      dispatch({ type: 'START_STORY_FAILURE', payload: "No character selected!"});
      return;
    }
    dispatch({ type: 'START_GAME', payload: theme });
    try {
      const initialStory = await startStory(theme, state.character.name, childAge);
      dispatch({ type: 'START_STORY_SUCCESS', payload: initialStory });
    } catch (e: any) {
      dispatch({ type: 'START_STORY_FAILURE', payload: e.message });
    }
  };

  const handleCustomStoryAnswer = (step: 'characterName' | 'setting' | 'interest', value: string) => {
    dispatch({ type: 'CUSTOM_STORY_STEP_SUCCESS', payload: { step, value } });
  };
  
  const handleCreateCustomStory = async (inputs: CustomStoryInputs) => {
    dispatch({ type: 'CREATE_CUSTOM_STORY_START', payload: { theme: 'Custom Adventure', customInputs: inputs } });
    try {
        const initialStory = await createCustomStory(inputs);
        dispatch({ type: 'START_STORY_SUCCESS', payload: initialStory });
    } catch (e: any) {
        dispatch({ type: 'START_STORY_FAILURE', payload: e.message });
    }
  };

  const handleContinueStory = async (userInput: string) => {
    if (state.isOnCooldown || state.isLoading || state.isListening) return;

    const lastAiChunk = state.story.slice().reverse().find(chunk => chunk.author === 'ai');
    const suggestions = lastAiChunk?.suggestions || [];
    const lowerUserInput = userInput.toLowerCase();
    const isSuggestionUsed = suggestions.some(suggestion => lowerUserInput.includes(suggestion.toLowerCase()));
    const isOriginalIdea = !isSuggestionUsed;

    // FIX: Create the up-to-date story array to pass to the API service.
    // This includes the user's latest input, resolving the stale state issue.
    // FIX (line 519): Explicitly type `storyForApi` as `StoryChunk[]` to prevent TypeScript from widening the `author` property of the new user story chunk from the literal `'user'` to `string`.
    const storyForApi: StoryChunk[] = [...state.story, { id: state.story.length + 1, author: 'user', text: userInput }];

    dispatch({ type: 'CONTINUE_STORY_START', payload: userInput });
    try {
      // Pass the corrected `storyForApi` array instead of the stale `state.story`.
      const result = await continueStory(storyForApi, userInput, state.therapyType, currentLevel, state.totalScore, state.speechScore, isOriginalIdea, state.focusStars, state.speechChallengesCompletedInLevel, childAge);
      dispatch({ type: 'CONTINUE_STORY_SUCCESS', payload: result });

      if (!result.endingType && state.focusStars > 0) {
        dispatch({ type: 'START_COOLDOWN' });
        setTimeout(() => {
          dispatch({ type: 'END_COOLDOWN' });
        }, 3000); 
      }
    } catch (e: any) {
      dispatch({ type: 'CONTINUE_STORY_FAILURE', payload: e.message });
    }
  };

  const handleRestart = () => {
    // Reset session tracking
    sessionStartTimeRef.current = null;
    sessionIdRef.current = null;
    dispatch({ type: 'RESTART_GAME' });
  };
  
  const handleTherapySelection = async (therapyType: 'pronunciation' | 'fluency' | 'dld' | 'social') => {
    // Save therapy type selection to database first (this will trigger a refetch)
    try {
      await saveProgress.mutateAsync({
        selectedTherapyType: therapyType
      });
      // Wait a bit for the query to refetch
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Failed to save therapy selection:', error);
      // Even if save fails, continue with the check using current data
    }
    
    // Check if this therapy type has already been assessed
    // Check if assessment exists and has a level (all therapy types work the same way: pronunciation, fluency, dld, social)
    // Use the latest storyGameProgress data (should be refetched by the mutation)
    const assessment = storyGameProgress?.assessments?.[therapyType];
    const hasExistingAssessment = assessment && 
                                   typeof assessment.level === 'number' && 
                                   assessment.level > 0 &&
                                   assessment.level <= 20; // Valid level range
    
    console.log(`[Therapy Selection] Checking ${therapyType}:`, {
      hasProgress: !!storyGameProgress,
      hasAssessments: !!storyGameProgress?.assessments,
      hasAssessment: !!assessment,
      assessmentLevel: assessment?.level,
      assessmentTitle: assessment?.title,
      assessmentFeedback: assessment?.feedback,
      hasExistingAssessment,
      allAssessments: storyGameProgress?.assessments
    });
    
    if (hasExistingAssessment && storyGameProgress) {
      // Therapy type already assessed - skip assessment and go directly to character selection
      // This works for ALL therapy types: pronunciation, fluency, dld, social
      console.log(`[Therapy Selection] ✅ Skipping assessment for ${therapyType} - already assessed at level ${assessment.level}`);
      
      // Load the saved assessment data and levels
      dispatch({
        type: 'LOAD_SAVED_PROGRESS',
        payload: {
          levels: storyGameProgress.currentLevels || {
            pronunciation: 1,
            fluency: 1,
            dld: 1,
            social: 1
          },
          therapyType: therapyType,
          assessmentTitle: assessment?.title || null,
          assessmentFeedback: assessment?.feedback || null
        }
      } as any);
      
      // Set therapy type and skip to character selection
      dispatch({ type: 'SELECT_THERAPY_GROUP_SKIP_ASSESSMENT', payload: therapyType });
    } else {
      // First time selecting this therapy type - proceed with assessment
      // This works for ALL therapy types: pronunciation, fluency, dld, social
      console.log(`[Therapy Selection] ⚠️ Starting assessment for ${therapyType} - no existing assessment found`);
      dispatch({ type: 'SELECT_THERAPY_GROUP', payload: therapyType });
    }
  };

  const renderContent = () => {
    switch (state.phase) {
      case 'welcome':
        return <WelcomeScreen onStart={() => dispatch({ type: 'PROCEED_TO_THERAPY_SELECTION' })} />;
      case 'therapySelection':
        return <TherapySelectionScreen 
                  onSelect={handleTherapySelection} 
                  completedAssessments={storyGameProgress?.assessments || {}} 
                  currentLevels={storyGameProgress?.currentLevels || {}}
                />;
      case 'assessment':
        return <AssessmentScreen therapyType={state.therapyType} onComplete={handleAssessmentComplete} isLoading={state.isLoading} />;
      case 'socialAssessment':
        return <SocialAssessmentScreen onComplete={handleSocialAssessmentComplete} isLoading={state.isLoading} />;
      case 'analysisResult':
        return <AnalysisResultScreen 
                  title={state.assessmentTitle || ''}
                  feedback={state.assessmentFeedback || ''} 
                  therapyType={state.therapyType}
                  level={currentLevel}
                  onProceed={() => dispatch({ type: 'PROCEED_TO_CHARACTER_SELECTION' })} 
               />;
      case 'characterSelection':
        return <CharacterSelectionScreen onSelect={handleSelectCharacter} />;
      case 'start':
        return <StartScreen onStart={handleStart} isLoading={state.isLoading} character={state.character} error={state.error} />;
      case 'customizing':
        return <CustomAdventureScreen 
                    onCreateStory={handleCreateCustomStory} 
                    onAnswer={handleCustomStoryAnswer}
                    isLoading={state.isLoading} 
                    customStoryInputs={state.customStoryInputs} 
                />;
      case 'playing':
        return <StoryScreen gameState={state} onContinue={handleContinueStory} dispatch={dispatch} />;
      case 'reward':
        return <RewardScreen gameState={state} onRestart={handleRestart} />;
      default:
        return <WelcomeScreen onStart={() => dispatch({ type: 'PROCEED_TO_THERAPY_SELECTION' })} />;
    }
  };

  return (
    <div 
      className="story-game-container min-h-screen w-full max-w-full overflow-x-hidden child-friendly-theme" 
      style={{
        '--primary': '#ff6b1d',
        '--primary-light': '#ff8a4d',
        '--primary-dark': '#e6580c',
        '--primary-bg-light': '#fff0e8',
        '--secondary': '#F5B82E',
        '--secondary-light': '#fef8e9',
        '--secondary-dark': '#b8860b',
        '--text-light': 'hsl(215, 16%, 47%)',
        '--subtle-border': 'hsl(210, 15%, 90%)',    
        '--gradient-main-start': '#FEF6E4',
        '--gradient-main-end': '#FDEBD0',
        '--card-background': '#FFFFFF',
        '--background': '#FFFBF5',
        '--foreground': '#4A4A4A',
        // Force child-friendly theme even in dark mode
        '--story-bg': '#fef7ed', // orange-50 
        '--story-bg-gradient': 'linear-gradient(to bottom right, #fef7ed, #fef3c7)', // orange-50 to yellow-50
        '--story-card': '#ffffff',
        '--story-border': '#fed7aa', // orange-200
        '--story-text': '#1f2937', // gray-800
        '--story-text-muted': '#4b5563', // gray-600
      } as React.CSSProperties}
    >
      {renderContent()}
    </div>
  );
};

export default StoryGameApp;

