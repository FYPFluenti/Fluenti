export type GamePhase = 'welcome' | 'therapySelection' | 'assessment' | 'socialAssessment' | 'analysisResult' | 'characterSelection' | 'start' | 'customizing' | 'playing' | 'reward';

export type TherapyType = 'pronunciation' | 'fluency' | 'dld' | 'social' | 'none';

export type Theme = 'Fantasy Forest' | 'Jungle Adventure' | 'Space Quest' | 'Magical School' | 'Custom Adventure';
export const THEMES: Theme[] = ['Fantasy Forest', 'Jungle Adventure', 'Space Quest', 'Magical School'];

export type Emotion = 'happy' | 'sad' | 'angry' | 'calm' | 'curious' | 'brave';
export type EndingType = 'happy' | 'neutral' | 'sad';

export const MAX_SCORE = 100;
export const CHALLENGES_PER_LEVEL = 5; // Number of challenges required to complete a level (applies to all therapy types)
export const INITIAL_FOCUS_STARS = 3; // Initial number of focus stars (applies to all therapy types)
export const MAX_FOCUS_STARS = 3; // Maximum number of focus stars (applies to all therapy types)

export interface AudioFeatures {
  pitch: number;      // Average pitch in Hz
  volume: number;     // Average volume (RMS)
  jitter: number;     // Pitch variation
  shimmer: number;    // Amplitude variation
  speakingRate: number; // Words per minute
}

export interface AssessmentResult {
  sentence: string; // The full phrase the user was asked to say
  targetWord?: string; // The specific word to focus on for pronunciation
  transcript: string;
  audioFeatures?: AudioFeatures;
}

export interface SocialAssessmentResult {
    scenario: string;
    question: string;
    transcript: string;
}

export interface StoryChunk {
    id: number;
    author: 'ai' | 'user';
    text: string;
    emotion?: Emotion;
    suggestions?: string[];
    challenge?: {
        type: 'pronunciation' | 'fluency' | 'dld' | 'social';
        word?: string; // For pronunciation/fluency
        prompt: string; // For ALL challenge types
        target?: string; // Target word/concept for DLD
    };
}

export type CustomStoryStep = 'characterName' | 'setting' | 'interest' | 'done';

export interface CustomStoryInputs {
    characterName: string;
    setting: string;
    interest: string;
    currentStep: CustomStoryStep;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  // Use a generic function type for the icon to avoid importing React in this file.
  // This resolves module loading issues in non-UI services.
  icon: (props: { className?: string }) => any;
}

export interface SpeechFeedback {
    scoreChange: number;
    mispronouncedWords: string[];
}

export interface LanguageFeedback {
    sentenceComplexityScore: number; // 1-10
    newVocabularyIntroduced: string[];
    grammarFeedback: string; // Gentle correction or praise
    storytellingScore: number; // 1-10
}

export interface ThematicFeedback {
    relevanceScore: number; // Score from 0-10
    feedbackText: string;   // Non-empty if score is low
}

export interface PronunciationBadge {
    level: number;
    title: string;
    emoji: string;
}

export type BadgeInfo = Omit<PronunciationBadge, 'level'>;

// A larger, more diverse pool of badges. 10 will be chosen randomly for each game session.
export const ALL_BADGES: BadgeInfo[] = [
    { title: "Word Sprouter", emoji: "🌱" },
    { title: "Echoing Explorer", emoji: "🗺️" },
    { title: "Sound Scout", emoji: "🔎" },
    { title: "Vowel Voyager", emoji: "🚀" },
    { title: "Syllable Star", emoji: "🌟" },
    { title: "Phrase Phanom", emoji: "👻" },
    { title: "Rhythm Rider", emoji: "🏄" },
    { title: "Tone Titan", emoji: "💪" },
    { title: "Chatter Champion", emoji: "🏆" },
    { title: "Articulation Ace", emoji: "🅰️" },
    { title: "Diction Duke", emoji: "👑" },
    { title: "Enunciation Earl", emoji: "📜" },
    { title: "Fluency Baron", emoji: "🌊" },
    { title: "Lexicon Lord", emoji: "📚" },
    { title: "Orator Oracle", emoji: "🔮" },
    { title: "Speech Sovereign", emoji: "🎤" },
    { title: "Voice Virtuoso", emoji: "🎶" },
    { title: "Tale Teller", emoji: "📖" },
    { title: "Giggle Guru", emoji: "😂" },
    { title: "Fable Finder", emoji: "🧭" },
    { title: "Narrative Knight", emoji: "🛡️" },
    { title: "Story Sculptor", emoji: "🗿" }
];

export interface RewardContent {
    title: string;
    message: string;
    badgeText: string;
}

export interface GameState {
    phase: GamePhase;
    therapyType: TherapyType;
    assessmentFeedback: string | null;
    assessmentTitle: string | null;
    sessionBadges: PronunciationBadge[];
    character: Character | null;
    theme: Theme | null;
    story: StoryChunk[];
    totalScore: number;
    speechScore: number;
    levels: {
        pronunciation: number;
        fluency: number;
        dld: number;
        social: number;
    };
    speechChallengesCompletedInLevel: number;
    focusStars: number;
    latestSpeechFeedback: SpeechFeedback | null;
    latestThematicFeedback: ThematicFeedback | null;
    latestLanguageFeedback: LanguageFeedback | null;
    wordBank: string[];
    latestBadgeEarned: PronunciationBadge | null;
    endingType: EndingType | null;
    rewardContent: RewardContent | null;
    isLoading: boolean;
    error: string | null;
    isListening: boolean;
    isOnCooldown: boolean;
    customStoryInputs: CustomStoryInputs;
}

export type GameAction =
  | { type: 'PROCEED_TO_THERAPY_SELECTION' }
  | { type: 'SELECT_THERAPY_GROUP'; payload: 'pronunciation' | 'fluency' | 'dld' | 'social' }
  | { type: 'SELECT_THERAPY_GROUP_SKIP_ASSESSMENT'; payload: 'pronunciation' | 'fluency' | 'dld' | 'social' }
  | { type: 'START_ASSESSMENT_ANALYSIS' }
  | { type: 'ASSESSMENT_ANALYSIS_SUCCESS'; payload: { level: number; title: string; feedback: string } }
  | { type: 'ASSESSMENT_ANALYSIS_FAILURE'; payload: string }
  | { type: 'START_SOCIAL_ASSESSMENT_ANALYSIS' }
  | { type: 'SOCIAL_ASSESSMENT_SUCCESS'; payload: { therapyType: 'social'; title: string; feedback: string } }
  | { type: 'SOCIAL_ASSESSMENT_FAILURE'; payload: string }
  | { type: 'PROCEED_TO_CHARACTER_SELECTION' }
  | { type: 'SELECT_CHARACTER'; payload: Character }
  | { type: 'START_GAME'; payload: Theme }
  | { type: 'START_CUSTOM_ADVENTURE' }
  | { type: 'CUSTOM_STORY_STEP_SUCCESS'; payload: { step: 'characterName' | 'setting' | 'interest'; value: string } }
  | { type: 'CREATE_CUSTOM_STORY_START'; payload: { theme: 'Custom Adventure', customInputs: CustomStoryInputs } }
  | { type: 'START_STORY_SUCCESS'; payload: { storyChunk: string; suggestions: string[] } }
  | { type: 'START_STORY_FAILURE'; payload: string }
  | { type: 'START_LISTENING' }
  | { type: 'STOP_LISTENING' }
  | { type: 'CONTINUE_STORY_START'; payload: string }
  | { type: 'CONTINUE_STORY_SUCCESS'; payload: { storyChunk: string; emotion: Emotion; suggestions: string[]; creativityScore: number; speechFeedback: SpeechFeedback; thematicFeedback: ThematicFeedback; languageFeedback?: LanguageFeedback; challengeSuccess?: boolean; challenge?: StoryChunk['challenge']; endingType?: EndingType } }
  | { type: 'CONTINUE_STORY_FAILURE'; payload: string }
  | { type: 'FETCH_REWARD_CONTENT_START' }
  | { type: 'FETCH_REWARD_CONTENT_SUCCESS'; payload: RewardContent }
  | { type: 'FETCH_REWARD_CONTENT_FAILURE'; payload: string }
  | { type: 'FINISH_STORY_NARRATION' }
  | { type: 'RESTART_GAME' }
  | { type: 'QUIT_GAME' }
  | { type: 'GO_BACK' }
  | { type: 'START_COOLDOWN' }
  | { type: 'END_COOLDOWN' }
  | { type: 'LOAD_SAVED_PROGRESS'; payload: { levels: { pronunciation: number; fluency: number; dld: number; social: number }; therapyType: TherapyType; assessmentTitle?: string | null; assessmentFeedback?: string | null } }
  | { type: 'RESTORE_STATE'; payload: Partial<GameState> };

