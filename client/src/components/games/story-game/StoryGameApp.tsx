import React, { useReducer, useEffect } from 'react';
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
    case 'PROCEED_TO_THERAPY_SELECTION':
        return { ...state, phase: 'therapySelection' };
    case 'SELECT_THERAPY_GROUP': {
        const therapyType = action.payload;
        if (therapyType === 'social') {
            return { ...state, therapyType, phase: 'socialAssessment' };
        }
        return { ...state, therapyType, phase: 'assessment' };
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
            newBadge = state.sessionBadges.find(b => b.level === currentLevel) || null;
            newWordsCorrect = 0; // Reset for next level
        } 
        // Check for LOSE condition (Focus Stars) - only if not already won
        // Applies to ALL therapy types: pronunciation, fluency, DLD, social
        else if (newFocusStars <= 0) {
            finalEndingType = 'sad';
        }
        // Story continues if neither win nor lose condition is met
        // NO natural conclusions - story ONLY ends on win/lose
        
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
  
  // Fetch onboarding data to get child age
  const { onboardingData } = useOnboardingData();
  
  // Calculate child age from onboarding data
  const childAge: ChildAge = React.useMemo(() => {
    if (onboardingData) {
      // calculateChildAge handles both Date and string types for childBirthDate
      return calculateChildAge(onboardingData.childBirthDate, onboardingData.childBirthYear);
    }
    // Return default age if onboarding data not available
    return { years: 6, months: 0 };
  }, [onboardingData]);

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
    } catch (e: any) {
      dispatch({ type: 'ASSESSMENT_ANALYSIS_FAILURE', payload: e.message });
    }
  };

  const handleSocialAssessmentComplete = async (results: SocialAssessmentResult[]) => {
    dispatch({ type: 'START_SOCIAL_ASSESSMENT_ANALYSIS' });
    try {
      const { level, title, feedbackText } = await analyzeSocialCommunication(results, childAge);
      dispatch({ type: 'ASSESSMENT_ANALYSIS_SUCCESS', payload: { level, title, feedback: feedbackText } });
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
    dispatch({ type: 'RESTART_GAME' });
  };
  
  const renderContent = () => {
    switch (state.phase) {
      case 'welcome':
        return <WelcomeScreen onStart={() => dispatch({ type: 'PROCEED_TO_THERAPY_SELECTION' })} />;
      case 'therapySelection':
        return <TherapySelectionScreen onSelect={(group) => dispatch({ type: 'SELECT_THERAPY_GROUP', payload: group })} />;
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
      className="story-game-container min-h-screen w-full max-w-full overflow-x-hidden" 
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
      } as React.CSSProperties}
    >
      {renderContent()}
    </div>
  );
};

export default StoryGameApp;

