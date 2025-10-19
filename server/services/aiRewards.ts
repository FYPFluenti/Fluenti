import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface SurpriseReward {
  type: 'character' | 'badge' | 'animation' | 'theme' | 'game_mode' | 'power_up';
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  animationSequence: string; // Emoji sequence for celebration
  celebrationMessage: string;
  unlockCondition: string;
  nextMilestone: string;
  abilities?: string[]; // For characters/power-ups
  collectionProgress?: {
    current: number;
    total: number;
    category: string;
  };
}

/**
 * Generate a surprise reward for achievements
 * Creates excitement through unpredictable unlocks
 */
export async function generateSurpriseReward(
  achievement: string,
  childProfile: {
    childName: string;
    interests?: string[];
    childBirthYear?: number;
  },
  performanceData: {
    streak?: number;
    stars?: number;
    score?: number;
    improvement?: string;
    masteriedPhonemes?: string[];
  }
): Promise<SurpriseReward> {
  const childAge = childProfile.childBirthYear 
    ? new Date().getFullYear() - childProfile.childBirthYear 
    : 5;

  const prompt = `Generate a SURPRISE reward for exceptional achievement in a speech therapy game.

Achievement Unlocked: "${achievement}"

Child Profile:
- Name: ${childProfile.childName}
- Age: ${childAge} years old
- Interests: ${childProfile.interests?.join(', ') || 'animals, adventure'}

Performance Context:
- Current Streak: ${performanceData.streak || 0}
- Total Stars: ${performanceData.stars || 0}
- Score: ${performanceData.score || 0}
- Recent Improvement: ${performanceData.improvement || 'steady progress'}
- Mastered Phonemes: ${performanceData.masteriedPhonemes?.join(', ') || 'building skills'}

ACHIEVEMENT RARITY GUIDE:
- "perfect_first_try" → Rare (80% perfect on first attempts)
- "5_streak" → Epic (5 consecutive correct)
- "10_streak" → Legendary (10 consecutive correct)
- "mastered_weak_phoneme" → Legendary (improved weak sound from <60% to >85%)
- "completed_story" → Rare (finished full adventure)
- "speed_champion" → Epic (completed speed challenge)
- "perfect_accuracy" → Legendary (100% accuracy on session)
- "consistency_king" → Rare (5 days in a row)
- "50_words" → Epic (lifetime 50 words practiced)
- "100_words" → Legendary (lifetime 100 words)

REWARD TYPES:

1. CHARACTER (Companion/Pet):
   - Common: Basic animals (cat, dog, bird)
   - Rare: Special animals (fox, owl, rabbit)
   - Epic: Magical creatures (unicorn, dragon baby, phoenix)
   - Legendary: Mythical guardians (dragon, fairy queen, superhero)

2. BADGE:
   - Common: Beginner badges (First Try, Good Job, Keep Going)
   - Rare: Achievement badges (Forest Hero, Speed Demon, Accuracy Master)
   - Epic: Mastery badges (Phoneme Champion, Streak King, Voice Wizard)
   - Legendary: Title badges (Grand Master, Legendary Hero, Ultimate Voice Guardian)

3. THEME:
   - Common: Color variations (Blue Sky, Green Forest, Pink Clouds)
   - Rare: Environment themes (Ocean, Space, Castle, Jungle)
   - Epic: Special effects (Rainbow, Sparkle, Glow, Magic)
   - Legendary: Animated themes (Fireworks, Northern Lights, Galaxy)

4. GAME_MODE:
   - Common: Simple variations (Fast Mode, Slow Mode)
   - Rare: New challenges (Rhyme Time, Echo Challenge, Memory Match)
   - Epic: Advanced modes (Speed Tournament, Mystery Quest, Adventure Race)
   - Legendary: Special events (Dragon Battle, Treasure Hunt, Hero Mission)

5. POWER_UP:
   - Common: Hints, Skip tokens
   - Rare: Double stars, Extra attempts
   - Epic: Rainbow mode (see word breakdown), Magic helper
   - Legendary: Auto-success charm, Instant unlock pass

Generate reward that:
1. Matches achievement rarity appropriately
2. Relates to child's interests (${childProfile.interests?.join(', ')})
3. Feels EARNED and SPECIAL (not given lightly)
4. Unlocks something TANGIBLE and USEFUL
5. Creates anticipation for NEXT milestone
6. Age-appropriate excitement (${childAge} years old)
7. Culturally appropriate and positive

CRITICAL: Make it feel RARE and EXCITING! Not "here's another generic thing."

Return JSON:
{
  "type": "character",
  "name": "Sparkle the Unicorn",
  "rarity": "epic",
  "description": "A magical unicorn with shimmering rainbow mane who helps you with the trickiest sounds! She knows special magic tricks to make hard words easier.",
  "animationSequence": "✨🦄🌈⭐💫🎉✨",
  "celebrationMessage": "WOW! ${childProfile.childName}, you just unlocked SPARKLE THE UNICORN! 🦄✨ She's SUPER rare - only the best word wizards can unlock her! Sparkle has been watching you practice, and she's SO impressed with your 5-word streak! She wants to join your adventure and help you become even more amazing!",
  "unlockCondition": "Got 5 words perfect on first try in a row",
  "nextMilestone": "Keep going! Unlock the LEGENDARY DRAGON GUARDIAN at 10 streak! You're already at ${performanceData.streak}/10! 🐉",
  "abilities": [
    "Rainbow Hint: Shows you exactly how to say tricky words with colorful sound waves",
    "Magic Sparkles: Earn double stars on hard words when Sparkle is with you",
    "Unicorn Cheer: Special celebration dance when you do great",
    "Confidence Boost: Makes you feel brave when trying difficult sounds"
  ],
  "collectionProgress": {
    "current": 3,
    "total": 10,
    "category": "Magical Companions"
  }
}`;

  try {
    console.log('🎁 Generating surprise reward for achievement:', achievement);
    console.log('👤 Child interests:', childProfile.interests);

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a game designer creating exciting, meaningful rewards for children. Your rewards feel special, earned, and create genuine excitement. You understand psychology of motivation and what makes children feel accomplished."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9, // High creativity for unique rewards
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content || '{}';
    const reward: SurpriseReward = JSON.parse(response);

    console.log('🎉 Reward generated:', reward.name);
    console.log('⭐ Rarity:', reward.rarity);
    console.log('🎭 Type:', reward.type);

    return reward;

  } catch (error) {
    console.error('❌ Reward generation failed:', error);
    
    // Fallback rewards by achievement type
    const fallbackReward: SurpriseReward = {
      type: 'badge',
      name: 'Star Achiever',
      rarity: 'rare',
      description: 'You worked hard and achieved something special!',
      animationSequence: '⭐🎉🌟✨🎊',
      celebrationMessage: `Amazing work, ${childProfile.childName}! You earned the Star Achiever badge! 🌟`,
      unlockCondition: achievement,
      nextMilestone: 'Keep practicing to unlock more rewards!',
      abilities: ['Shows your amazing progress']
    };

    return fallbackReward;
  }
}

/**
 * Check if an achievement should trigger a reward
 * Returns achievement name if conditions are met
 */
export function checkForAchievements(
  attempts: any[],
  sessionData: {
    streak: number;
    maxStreak: number;
    stars: number;
    score: number;
    totalWords: number;
    completedWords: number;
    sessionAccuracy: number;
  }
): string[] {
  const achievements: string[] = [];

  // Streak achievements
  if (sessionData.streak === 5) {
    achievements.push('5_streak');
  }
  if (sessionData.streak === 10) {
    achievements.push('10_streak');
  }
  if (sessionData.maxStreak >= 15) {
    achievements.push('legendary_streak');
  }

  // Perfect first try achievements
  const recentAttempts = attempts.slice(-5);
  const allFirstTryPerfect = recentAttempts.length >= 5 && 
    recentAttempts.every(a => a.attempt === 1 && a.accuracy >= 95);
  if (allFirstTryPerfect) {
    achievements.push('perfect_first_try');
  }

  // Completion achievement
  if (sessionData.completedWords === sessionData.totalWords) {
    achievements.push('completed_story');
  }

  // Perfect accuracy
  if (sessionData.sessionAccuracy === 100 && sessionData.completedWords >= 10) {
    achievements.push('perfect_accuracy');
  }

  // High score achievement
  if (sessionData.score >= 1500) {
    achievements.push('high_score_master');
  }

  // Star achievements
  if (sessionData.stars >= 30) {
    achievements.push('star_collector');
  }

  // Phoneme mastery (check if improved weak phoneme)
  const phonemeProgress = analyzePhonemeProgress(attempts);
  if (phonemeProgress.improved) {
    achievements.push('mastered_weak_phoneme');
  }

  console.log('🏆 Achievements unlocked:', achievements);
  return achievements;
}

/**
 * Analyze phoneme progress to detect mastery
 */
function analyzePhonemeProgress(attempts: any[]): {
  improved: boolean;
  phoneme?: string;
  before?: number;
  after?: number;
} {
  // Group attempts by phoneme (simplified - would need more sophisticated analysis)
  const phonemeGroups: Record<string, number[]> = {};

  attempts.forEach(attempt => {
    const phoneme = attempt.therapyFocus || 'general';
    if (!phonemeGroups[phoneme]) {
      phonemeGroups[phoneme] = [];
    }
    phonemeGroups[phoneme].push(attempt.accuracy);
  });

  // Check for improvement (early attempts vs later attempts)
  for (const [phoneme, accuracies] of Object.entries(phonemeGroups)) {
    if (accuracies.length >= 5) {
      const early = accuracies.slice(0, Math.floor(accuracies.length / 2));
      const late = accuracies.slice(Math.floor(accuracies.length / 2));

      const earlyAvg = early.reduce((sum, acc) => sum + acc, 0) / early.length;
      const lateAvg = late.reduce((sum, acc) => sum + acc, 0) / late.length;

      if (earlyAvg < 65 && lateAvg >= 85) {
        return {
          improved: true,
          phoneme,
          before: Math.round(earlyAvg),
          after: Math.round(lateAvg)
        };
      }
    }
  }

  return { improved: false };
}

/**
 * Get collection progress for a reward type
 */
export function getCollectionProgress(
  unlockedRewards: string[],
  rewardType: 'character' | 'badge' | 'theme' | 'game_mode'
): {
  current: number;
  total: number;
  category: string;
  unlocked: string[];
  locked: string[];
} {
  // Define total collectibles per category
  const collections = {
    character: {
      total: 20,
      category: 'Magical Companions',
      items: [
        '🦊 Finn the Fox', '🐰 Bunny Belle', '🦉 Wise Owl', '🐻 Teddy Guardian',
        '🦄 Sparkle Unicorn', '🐉 Baby Dragon', '🦋 Flutter Fairy', '🐸 Ribbit Prince',
        '🦁 Leo the Lion', '🐯 Tiger Warrior', '🐺 Wolf Sage', '🦅 Eagle Scout',
        '🦖 Dino Friend', '🐙 Octavia', '🦈 Finn the Shark', '🐋 Wally Whale',
        '🦌 Deer Spirit', '🦚 Phoenix', '🐉 Dragon Guardian', '👑 Fairy Queen'
      ]
    },
    badge: {
      total: 15,
      category: 'Achievement Badges',
      items: [
        '🌟 First Try Hero', '🏆 Completion Master', '🎯 Accuracy Expert',
        '🔥 Streak Champion', '⚡ Speed Demon', '💎 Perfect Score',
        '🎨 Creative Thinker', '📚 Story Champion', '🦸 Voice Hero',
        '👑 Grand Master', '🌈 Rainbow Achiever', '✨ Magic Maker',
        '🎭 Challenge Crusher', '🎪 Game Master', '🏅 Legendary Warrior'
      ]
    },
    theme: {
      total: 12,
      category: 'Visual Themes',
      items: [
        '🌳 Forest', '🏰 Castle', '🚀 Space', '🌊 Ocean',
        '🌈 Rainbow', '✨ Sparkle', '🌙 Moonlight', '☀️ Sunshine',
        '🎨 Art Studio', '🎪 Carnival', '🏔️ Mountain', '🌸 Garden'
      ]
    },
    game_mode: {
      total: 10,
      category: 'Game Modes',
      items: [
        '⚡ Speed Round', '🎵 Rhyme Time', '🤖 Echo Challenge', '🧠 Memory Match',
        '🔄 Opposite Game', '📝 Sentence Builder', '🏃 Sprint Mode',
        '🎭 Drama Quest', '🎪 Mystery Game', '🏆 Tournament'
      ]
    }
  };

  const collection = collections[rewardType];
  const unlocked = unlockedRewards.filter(r => collection.items.some(item => item.includes(r)));

  return {
    current: unlocked.length,
    total: collection.total,
    category: collection.category,
    unlocked,
    locked: collection.items.filter(item => !unlocked.some(u => item.includes(u)))
  };
}

/**
 * Generate celebration animation sequence
 */
export function generateCelebrationAnimation(rarity: SurpriseReward['rarity']): string {
  const animations = {
    common: '⭐🎉✨',
    rare: '🌟✨🎊🎉⭐',
    epic: '✨🌟💫⭐🎆🎉✨',
    legendary: '🎇✨🌟💫⭐🎆🎊🎉🏆👑✨🎇'
  };

  return animations[rarity];
}
