import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export interface PerformanceMetrics {
  recentAccuracy: number;
  streak: number;
  averageAttempts: number;
  timePerWord: number;
  strugglingPhonemes: string[];
  masteredPhonemes: string[];
  emotionalState?: 'confident' | 'frustrated' | 'bored';
}

export interface DifficultyAdjustment {
  currentDifficulty: number; // 1-10 scale
  recommendedDifficulty: number;
  adjustmentReason: string;
  nextWordGuidance: string;
  shouldOfferBreak: boolean;
  shouldCelebrate: boolean;
  motivationalMessage: string;
}

/**
 * Analyzes performance and adjusts difficulty in real-time
 */
export async function analyzeDifficultyAdjustment(
  performanceMetrics: PerformanceMetrics,
  currentDifficulty: number,
  childAge: number = 5
): Promise<DifficultyAdjustment> {
  
  try {
    const prompt = `You are an expert speech therapist adjusting difficulty for a ${childAge}-year-old child.

CURRENT PERFORMANCE:
- Recent Accuracy: ${performanceMetrics.recentAccuracy}%
- Current Streak: ${performanceMetrics.streak} words
- Average Attempts per Word: ${performanceMetrics.averageAttempts}
- Time per Word: ${performanceMetrics.timePerWord}s
- Struggling With: ${performanceMetrics.strugglingPhonemes.join(', ') || 'None'}
- Mastered: ${performanceMetrics.masteredPhonemes.join(', ') || 'None'}
- Emotional State: ${performanceMetrics.emotionalState || 'neutral'}
- Current Difficulty: ${currentDifficulty}/10

ANALYZE AND ADJUST:
1. Should difficulty increase, decrease, or stay the same?
2. What is the optimal difficulty level (1-10)?
3. Why this adjustment?
4. Should we offer a break?
5. Should we celebrate progress?
6. What motivational message fits this moment?

Return JSON:
{
  "recommendedDifficulty": number (1-10),
  "adjustmentReason": "brief explanation",
  "nextWordGuidance": "what type of word to present next",
  "shouldOfferBreak": boolean,
  "shouldCelebrate": boolean,
  "motivationalMessage": "age-appropriate message"
}`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a speech therapy AI that adjusts difficulty to keep children in their 'flow state' - challenged but not frustrated."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4, // Moderate creativity for balanced decisions
      max_completion_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      currentDifficulty,
      recommendedDifficulty: result.recommendedDifficulty || currentDifficulty,
      adjustmentReason: result.adjustmentReason || "Maintaining current pace",
      nextWordGuidance: result.nextWordGuidance || "Continue with similar difficulty",
      shouldOfferBreak: result.shouldOfferBreak || false,
      shouldCelebrate: result.shouldCelebrate || false,
      motivationalMessage: result.motivationalMessage || "You're doing great! Keep it up!"
    };

  } catch (error) {
    console.error('❌ Adaptive difficulty error:', error);
    
    // Fallback: Simple heuristic
    let recommendedDifficulty = currentDifficulty;
    let adjustmentReason = "Maintaining current level";
    let shouldCelebrate = false;
    let shouldOfferBreak = false;

    // If accuracy is very high and fast - increase difficulty
    if (performanceMetrics.recentAccuracy > 90 && performanceMetrics.averageAttempts < 1.5) {
      recommendedDifficulty = Math.min(10, currentDifficulty + 1);
      adjustmentReason = "Excellent performance! Ready for more challenge";
      shouldCelebrate = true;
    }
    // If accuracy is low or taking many attempts - decrease difficulty
    else if (performanceMetrics.recentAccuracy < 50 || performanceMetrics.averageAttempts > 2.5) {
      recommendedDifficulty = Math.max(1, currentDifficulty - 1);
      adjustmentReason = "Let's try some easier words to build confidence";
      shouldOfferBreak = performanceMetrics.emotionalState === 'frustrated';
    }
    // If bored (too easy) - increase slightly
    else if (performanceMetrics.emotionalState === 'bored') {
      recommendedDifficulty = Math.min(10, currentDifficulty + 1);
      adjustmentReason = "Adding some variety to keep it interesting";
    }

    return {
      currentDifficulty,
      recommendedDifficulty,
      adjustmentReason,
      nextWordGuidance: "Continue with similar words",
      shouldOfferBreak,
      shouldCelebrate,
      motivationalMessage: "You're doing wonderfully! Keep practicing!"
    };
  }
}

/**
 * Generate words at specific difficulty level
 */
export async function generateAdaptiveWords(
  difficulty: number,
  count: number,
  childProfile: { interests?: string[], strugglingPhonemes?: string[] },
  theme?: string
): Promise<any[]> {
  
  const difficultyDescriptions = {
    1: "Very simple 3-letter CVC words (cat, dog, sun)",
    2: "Simple 3-4 letter words with common sounds",
    3: "Common 4-letter words with blends (stop, flag)",
    4: "Words with digraphs (shop, chat, when)",
    5: "Moderate difficulty with varied patterns",
    6: "Words with consonant clusters",
    7: "More complex phonetic patterns",
    8: "Multi-syllable words (2 syllables)",
    9: "Advanced phonetic patterns",
    10: "Challenging multi-syllable words"
  };

  const difficultyLevel = Math.min(10, Math.max(1, difficulty));
  const description = difficultyDescriptions[difficultyLevel as keyof typeof difficultyDescriptions];

  try {
    const prompt = `Generate ${count} speech therapy practice words for a child.

DIFFICULTY LEVEL: ${difficultyLevel}/10
DESCRIPTION: ${description}
INTERESTS: ${childProfile.interests?.join(', ') || 'general'}
STRUGGLING WITH: ${childProfile.strugglingPhonemes?.join(', ') || 'none'}
THEME: ${theme || 'mixed'}

REQUIREMENTS:
1. Words at exactly this difficulty level
2. Include phonetic spelling
3. If child struggles with specific phonemes, include some practice (but not all)
4. Mix familiar and new words
5. Age-appropriate meanings

Return JSON array:
[
  {
    "word": "word",
    "phonetic": "/phonetic/",
    "difficulty": ${difficultyLevel},
    "category": "category",
    "reasoning": "why this word at this difficulty"
  }
]`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a speech therapy AI generating perfectly calibrated practice words."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result.words || [];

  } catch (error) {
    console.error('❌ Adaptive word generation error:', error);
    
    // Fallback words by difficulty
    const fallbackWords = {
      1: ["cat", "dog", "sun", "hat", "pen"],
      2: ["fish", "milk", "jump", "play", "tree"],
      3: ["stop", "flag", "drum", "frog", "grass"],
      4: ["shop", "chat", "when", "chop", "then"],
      5: ["plant", "swing", "bring", "clock", "black"],
      6: ["spring", "street", "strong", "splash", "throw"],
      7: ["dragon", "flower", "kitchen", "brother", "basket"],
      8: ["dinosaur", "elephant", "beautiful", "butterfly", "adventure"],
      9: ["interesting", "comfortable", "delicious", "wonderful", "important"],
      10: ["extraordinary", "imagination", "celebration", "communication", "understanding"]
    };

    const level = Math.min(10, Math.max(1, difficultyLevel)) as keyof typeof fallbackWords;
    const words = fallbackWords[level] || fallbackWords[5];
    
    return words.slice(0, count).map(word => ({
      word,
      phonetic: `/${word}/`,
      difficulty: difficultyLevel,
      category: "practice",
      reasoning: `Difficulty ${difficultyLevel} word`
    }));
  }
}
