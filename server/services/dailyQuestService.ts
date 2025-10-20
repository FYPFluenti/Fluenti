/**
 * Daily Quest Generation Service
 * Uses AI to create unique, themed daily challenges with bonus rewards
 */

interface DailyQuestTheme {
  theme: string;
  emoji: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  challengeMode: string;
  targetScore: number;
  targetAccuracy: number;
  reward: {
    type: 'character' | 'badge' | 'theme' | 'minigame';
    name: string;
    rarity: 'legendary' | 'epic' | 'rare';
    icon: string;
    description: string;
  };
}

/**
 * Pre-defined quest themes pool
 * These rotate daily to ensure variety
 */
/**
 * ✅ VALID CHALLENGE MODES (from aiChallenges.ts):
 * - speed_round
 * - rhyme_time
 * - perfect_streak
 * - phoneme_focus
 * - silly_sentences
 * - memory_master
 */
const QUEST_THEMES: DailyQuestTheme[] = [
  {
    theme: "Ocean Adventure",
    emoji: "🌊",
    description: "Help marine animals find their way home!",
    difficulty: "easy",
    challengeMode: "speed_round", // ✅ Valid mode
    targetScore: 250,
    targetAccuracy: 70,
    reward: {
      type: "character",
      name: "Marina the Dolphin",
      rarity: "epic",
      icon: "🐬",
      description: "A playful dolphin who loves to sing and dance in the waves!"
    }
  },
  {
    theme: "Space Explorer",
    emoji: "🚀",
    description: "Navigate through asteroid fields and discover new planets!",
    difficulty: "medium",
    challengeMode: "perfect_streak", // ✅ Valid mode
    targetScore: 300,
    targetAccuracy: 75,
    reward: {
      type: "character",
      name: "Cosmo the Astronaut",
      rarity: "epic",
      icon: "👨‍🚀",
      description: "A brave space explorer who speaks in cosmic rhymes!"
    }
  },
  {
    theme: "Jungle Safari",
    emoji: "🌴",
    description: "Swing through the trees and help jungle friends communicate!",
    difficulty: "easy",
    challengeMode: "memory_master", //  was "memory_match"
    targetScore: 200,
    targetAccuracy: 70,
    reward: {
      type: "character",
      name: "Koko the Parrot",
      rarity: "rare",
      icon: "🦜",
      description: "A colorful parrot who repeats words with perfect pronunciation!"
    }
  },
  {
    theme: "Arctic Expedition",
    emoji: "❄️",
    description: "Help arctic animals prepare for winter!",
    difficulty: "medium",
    challengeMode: "speed_round", //  was "time_trial"
    targetScore: 280,
    targetAccuracy: 75,
    reward: {
      type: "character",
      name: "Frost the Polar Bear",
      rarity: "epic",
      icon: "🐻‍❄️",
      description: "A gentle giant who loves teaching cubs to speak clearly!"
    }
  },
  {
    theme: "Dragon Kingdom",
    emoji: "🐉",
    description: "Train baby dragons to breathe fire... I mean, speak clearly!",
    difficulty: "hard",
    challengeMode: "perfect_streak", //  was "no_mistakes"
    targetScore: 350,
    targetAccuracy: 85,
    reward: {
      type: "character",
      name: "Ember the Dragon",
      rarity: "legendary",
      icon: "🐲",
      description: "A magical dragon who grants wishes to those who speak with confidence!"
    }
  },
  {
    theme: "Fairy Garden",
    emoji: "🧚",
    description: "Help fairies practice their magical spells (words)!",
    difficulty: "easy",
    challengeMode: "rhyme_time", //  was "rhythm_match"
    targetScore: 220,
    targetAccuracy: 70,
    reward: {
      type: "character",
      name: "Sparkle the Fairy",
      rarity: "rare",
      icon: "🧚‍♀️",
      description: "A tiny fairy whose magic grows stronger with every word you say!"
    }
  },
  {
    theme: "Pirate Treasure Hunt",
    emoji: "🏴‍☠️",
    description: "Solve word riddles to unlock the treasure chest!",
    difficulty: "medium",
    challengeMode: "phoneme_focus", //  was "puzzle_solve"
    targetScore: 290,
    targetAccuracy: 80,
    reward: {
      type: "badge",
      name: "Captain's Badge",
      rarity: "epic",
      icon: "⚓",
      description: "You're now an official member of the Speaking Pirates crew!"
    }
  },
  {
    theme: "Rainbow Bridge",
    emoji: "🌈",
    description: "Cross the rainbow by mastering colorful words!",
    difficulty: "easy",
    challengeMode: "silly_sentences", //  was "color_match"
    targetScore: 240,
    targetAccuracy: 70,
    reward: {
      type: "theme",
      name: "Rainbow Theme",
      rarity: "epic",
      icon: "🎨",
      description: "Transform your game with beautiful rainbow colors!"
    }
  },
  {
    theme: "Wizard Academy",
    emoji: "🧙",
    description: "Learn magical incantations (practice words) at wizard school!",
    difficulty: "hard",
    challengeMode: "spell_casting",
    targetScore: 320,
    targetAccuracy: 85,
    reward: {
      type: "character",
      name: "Merlin the Wise",
      rarity: "legendary",
      icon: "🧙‍♂️",
      description: "The greatest wizard who teaches ancient speaking spells!"
    }
  },
  {
    theme: "Dinosaur Park",
    emoji: "🦕",
    description: "Help baby dinosaurs learn to roar (speak) properly!",
    difficulty: "medium",
    challengeMode: "roar_match",
    targetScore: 270,
    targetAccuracy: 75,
    reward: {
      type: "character",
      name: "Rex the T-Rex",
      rarity: "epic",
      icon: "🦖",
      description: "A friendly dinosaur who loves to practice pronunciation!"
    }
  },
  {
    theme: "Superhero Training",
    emoji: "🦸",
    description: "Train to become a Speech Superhero!",
    difficulty: "hard",
    challengeMode: "perfect_streak", //  was "hero_challenge"
    targetScore: 340,
    targetAccuracy: 80,
    reward: {
      type: "badge",
      name: "Speech Hero Badge",
      rarity: "legendary",
      icon: "⚡",
      description: "You've unlocked superhero speaking powers!"
    }
  },
  {
    theme: "Circus Spectacular",
    emoji: "🎪",
    description: "Perform amazing word tricks under the big top!",
    difficulty: "medium",
    challengeMode: "silly_sentences", //  was "performance"
    targetScore: 260,
    targetAccuracy: 75,
    reward: {
      type: "character",
      name: "Giggles the Clown",
      rarity: "rare",
      icon: "🤡",
      description: "A cheerful clown who makes learning fun and silly!"
    }
  },
  {
    theme: "Castle Quest",
    emoji: "🏰",
    description: "Help the royal family prepare for the grand ball!",
    difficulty: "medium",
    challengeMode: "phoneme_focus", //  was "royal_speech"
    targetScore: 285,
    targetAccuracy: 80,
    reward: {
      type: "theme",
      name: "Royal Castle Theme",
      rarity: "epic",
      icon: "👑",
      description: "Transform your game into a majestic royal castle!"
    }
  },
  {
    theme: "Music Festival",
    emoji: "🎵",
    description: "Help musicians practice their songs with perfect words!",
    difficulty: "easy",
    challengeMode: "rhyme_time", //  was "sing_along"
    targetScore: 230,
    targetAccuracy: 70,
    reward: {
      type: "character",
      name: "Melody the Songbird",
      rarity: "rare",
      icon: "🎤",
      description: "A musical bird who sings every word beautifully!"
    }
  }
];

/**
 * Get quest theme for specific date
 * Uses date as seed to ensure same quest for all users on same day
 * Now with better randomization to avoid predictable patterns
 */
export function getQuestThemeForDate(date: Date): DailyQuestTheme {
  // Create a deterministic but more random-looking seed from the date
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Generate a pseudo-random but deterministic index
  // This ensures same date = same theme, but themes appear in random order
  const seed = (year * 10000) + (month * 100) + day;
  const pseudoRandom = Math.abs(Math.sin(seed) * 10000);
  const themeIndex = Math.floor(pseudoRandom) % QUEST_THEMES.length;
  
  const selectedTheme = QUEST_THEMES[themeIndex];
  
  console.log('🎲 Daily Quest Theme Selection:', {
    date: date.toDateString(),
    seed,
    themeIndex,
    theme: selectedTheme.theme,
    emoji: selectedTheme.emoji,
    totalThemes: QUEST_THEMES.length
  });
  
  return selectedTheme;
}

/**
 * Generate daily quest for user
 * If child profile exists, can personalize difficulty
 */
export function generateDailyQuest(userId: string, childProfile?: any): any {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const theme = getQuestThemeForDate(today);
  
  // Adjust difficulty based on child's level (if profile exists)
  let adjustedTheme = { ...theme };
  if (childProfile?.level) {
    if (childProfile.level < 5) {
      adjustedTheme.difficulty = 'easy';
      adjustedTheme.targetScore = Math.max(200, theme.targetScore - 50);
      adjustedTheme.targetAccuracy = Math.max(65, theme.targetAccuracy - 10);
    } else if (childProfile.level >= 10) {
      adjustedTheme.difficulty = 'hard';
      adjustedTheme.targetScore = theme.targetScore + 50;
      adjustedTheme.targetAccuracy = Math.min(90, theme.targetAccuracy + 5);
    }
  }
  
  // ✅ FIX: Rename 'reward' to 'bonusReward' to match schema
  return {
    userId,
    questDate: today,
    theme: adjustedTheme.theme,
    emoji: adjustedTheme.emoji,
    description: adjustedTheme.description,
    difficulty: adjustedTheme.difficulty,
    challengeMode: adjustedTheme.challengeMode,
    targetScore: adjustedTheme.targetScore,
    targetAccuracy: adjustedTheme.targetAccuracy,
    bonusReward: adjustedTheme.reward, // ✅ Changed from 'reward' to 'bonusReward'
    isCompleted: false,
    createdAt: new Date()
  };
}

/**
 * Calculate streak bonus points
 */
export function calculateStreakBonus(streak: number): number {
  if (streak <= 0) return 0;
  
  // Bonus increases with streak
  if (streak >= 30) return 500;  // 1 month streak!
  if (streak >= 14) return 300;  // 2 week streak
  if (streak >= 7) return 150;   // 1 week streak
  if (streak >= 3) return 50;    // 3 day streak
  
  return 25 * streak; // Base: 25 points per day
}

export default {
  getQuestThemeForDate,
  generateDailyQuest,
  calculateStreakBonus,
  QUEST_THEMES
};
