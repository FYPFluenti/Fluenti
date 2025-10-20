import Groq from "groq-sdk";

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

export interface ChallengeMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  rules: string[];
  timeLimit?: number; // seconds
  pointMultiplier: number;
  difficulty: 'easy' | 'medium' | 'hard';
  unlockRequirement?: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  mode: string;
  targetScore: number;
  reward: {
    type: string;
    name: string;
    description: string;
  };
  expiresAt: Date;
}

/**
 * Available challenge modes
 */
export const CHALLENGE_MODES: ChallengeMode[] = [
  {
    id: 'speed_round',
    name: 'Speed Round',
    description: 'Say words as fast as you can! Time is ticking!',
    icon: '⚡',
    rules: [
      'You have 60 seconds total',
      'Get bonus points for being fast',
      'One attempt per word only'
    ],
    timeLimit: 60, // ✅ 60 second challenge
    pointMultiplier: 1.5,
    difficulty: 'medium'
  },
  {
    id: 'rhyme_time',
    name: 'Rhyme Time',
    description: 'Say words that rhyme together!',
    icon: '🎵',
    rules: [
      'Words will rhyme with each other',
      'Notice the similar sounds',
      'Great for ear training'
    ],
    timeLimit: 90, // ✅ 90 seconds for rhyme practice
    pointMultiplier: 1.3,
    difficulty: 'easy'
  },
  {
    id: 'perfect_streak',
    name: 'Perfect Streak',
    description: 'Can you get 10 words perfect on first try?',
    icon: '🔥',
    rules: [
      'Must get each word perfect (90%+)',
      'On the first attempt only',
      'Break the streak and start over'
    ],
    timeLimit: 120, // ✅ 2 minutes for perfect streak
    pointMultiplier: 2.0,
    difficulty: 'hard'
  },
  {
    id: 'phoneme_focus',
    name: 'Phoneme Focus',
    description: 'Practice specific sounds you need to work on',
    icon: '🎯',
    rules: [
      'All words have your tricky sounds',
      'Focused practice helps you improve',
      'Master those challenging phonemes'
    ],
    timeLimit: 90, // ✅ 90 seconds for focused practice
    pointMultiplier: 1.2,
    difficulty: 'medium'
  },
  {
    id: 'silly_sentences',
    name: 'Silly Sentences',
    description: 'Say words in funny sentences!',
    icon: '😄',
    rules: [
      'Words are part of silly stories',
      'Extra fun and engaging',
      'Great for context learning'
    ],
    timeLimit: 120, // ✅ 2 minutes for silly fun
    pointMultiplier: 1.4,
    difficulty: 'easy'
  },
  {
    id: 'memory_master',
    name: 'Memory Master',
    description: 'Remember and repeat word sequences',
    icon: '🧠',
    rules: [
      'Say a sequence of 2-3 words',
      'Each round adds more words',
      'Tests memory and pronunciation'
    ],
    timeLimit: 150, // ✅ 2.5 minutes for memory challenge
    pointMultiplier: 1.8,
    difficulty: 'hard'
  }
];

/**
 * Generate daily personalized challenge
 */
export async function generateDailyChallenge(
  childProfile: {
    childName?: string;
    interests?: string[];
    skillLevel?: number;
    strugglingPhonemes?: string[];
  }
): Promise<DailyChallenge> {
  
  try {
    const prompt = `Create a daily challenge for ${childProfile.childName || 'a child'}.

CHILD PROFILE:
- Interests: ${childProfile.interests?.join(', ') || 'general'}
- Skill Level: ${childProfile.skillLevel || 5}/10
- Struggling With: ${childProfile.strugglingPhonemes?.join(', ') || 'none'}

CREATE A CHALLENGE:
1. Should be achievable but motivating
2. Related to their interests if possible
3. Appropriate difficulty for their level
4. Fun reward that they'll want to earn

Return JSON:
{
  "title": "Challenge name",
  "description": "What to do (child-friendly)",
  "emoji": "single emoji",
  "mode": "one of: speed_round, rhyme_time, perfect_streak, phoneme_focus, silly_sentences, memory_master",
  "targetScore": number,
  "reward": {
    "type": "character|badge|theme|power_up",
    "name": "reward name",
    "description": "what they get"
  }
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // ✅ SWITCHED to cheaper model (was openai/gpt-oss-120b)
      messages: [
        {
          role: "system",
          content: "You are a creative speech therapist designing fun daily challenges for children."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_completion_tokens: 600, // ✅ REDUCED from 800
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Set expiration to end of day
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    return {
      id: `daily_${Date.now()}`,
      title: result.title || "Daily Word Challenge",
      description: result.description || "Complete today's special challenge!",
      emoji: result.emoji || "🎯",
      mode: result.mode || "speed_round",
      targetScore: result.targetScore || 500,
      reward: result.reward || {
        type: "badge",
        name: "Daily Champion",
        description: "You completed today's challenge!"
      },
      expiresAt
    };

  } catch (error) {
    console.error('❌ Daily challenge generation error:', error);
    
    // ✅ CHECK FOR RATE LIMIT
    if (error instanceof Error && error.message.includes('rate_limit')) {
      console.error('⚠️ RATE LIMIT HIT - Using fallback challenge');
    }
    
    // Fallback challenge
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    return {
      id: `daily_${Date.now()}`,
      title: "Speed Star Challenge",
      description: "Say 10 words correctly in Speed Round mode!",
      emoji: "⚡",
      mode: "speed_round",
      targetScore: 300,
      reward: {
        type: "badge",
        name: "Speed Star",
        description: "You're lightning fast!"
      },
      expiresAt
    };
  }
}

/**
 * Generate words for specific challenge mode
 */
export async function generateChallengeWords(
  mode: string,
  count: number,
  childProfile: any
): Promise<any[]> {
  
  const modeInfo = CHALLENGE_MODES.find(m => m.id === mode);
  
  try {
    let prompt = `Generate ${count} words for the "${modeInfo?.name || mode}" challenge mode.

MODE DESCRIPTION: ${modeInfo?.description || ''}
CHILD INTERESTS: ${childProfile.interests?.join(', ') || 'general'}

SPECIAL REQUIREMENTS:`;

    switch (mode) {
      case 'rhyme_time':
        prompt += `\n- All words should rhyme with each other\n- Example: cat, hat, bat, mat`;
        break;
      case 'speed_round':
        prompt += `\n- Short, quick words (3-4 letters)\n- Easy to say fast`;
        break;
      case 'phoneme_focus':
        prompt += `\n- Focus on these sounds: ${childProfile.strugglingPhonemes?.join(', ') || 'common consonants'}\n- All words should have these sounds`;
        break;
      case 'silly_sentences':
        prompt += `\n- Each word should fit in a silly sentence\n- Fun and memorable`;
        break;
      case 'memory_master':
        prompt += `\n- Words that go together (categories)\n- Example: apple, orange, banana`;
        break;
      default:
        prompt += `\n- Age-appropriate words\n- Mixed difficulty`;
    }

    prompt += `\n\nReturn JSON array:\n[{"word": "word", "phonetic": "/phonetic/", "context": "how it fits the challenge"}]`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // ✅ SWITCHED to cheaper model (was openai/gpt-oss-120b)
      messages: [
        {
          role: "system",
          content: "You are a speech therapy AI creating challenge-specific practice words."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.75,
      max_completion_tokens: 1000, // ✅ REDUCED from 1500
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result.words || [];

  } catch (error) {
    console.error('❌ Challenge word generation error:', error);
    
    // ✅ CHECK FOR RATE LIMIT
    if (error instanceof Error && error.message.includes('rate_limit')) {
      console.error('⚠️ RATE LIMIT HIT - Using fallback words for', mode);
    }
    
    // Fallback words by mode
    const fallbackWords: Record<string, string[]> = {
      rhyme_time: ["cat", "hat", "bat", "mat", "sat"],
      speed_round: ["go", "run", "hop", "jump", "clap"],
      phoneme_focus: ["sun", "sat", "sit", "sip", "sock"],
      silly_sentences: ["silly", "funny", "happy", "crazy", "wacky"],
      memory_master: ["red", "blue", "green", "yellow", "pink"],
      default: ["dog", "cat", "bird", "fish", "frog"]
    };

    const words = fallbackWords[mode] || fallbackWords.default;
    return words.slice(0, count).map(word => ({
      word,
      phonetic: `/${word}/`,
      context: `${modeInfo?.name || mode} word`
    }));
  }
}

/**
 * Generate themed words for Daily Quest (Conquest Mode)
 * Creates immersive, story-driven word practice
 */
export async function generateConquestWords(
  theme: string,
  emoji: string,
  difficulty: string,
  count: number,
  childProfile: any
): Promise<any[]> {
  try {
    console.log('🏆 Generating conquest words for theme:', theme);

    const childAge = childProfile.childBirthYear ? 
      new Date().getFullYear() - childProfile.childBirthYear : 5;

    const prompt = `
You are creating themed practice words for a Daily Quest (Conquest Mode) in a speech therapy game.

Theme: ${theme}
Emoji: ${emoji}
Difficulty: ${difficulty}
Child's age: ${childAge}
Child's interests: ${childProfile.interests?.join(', ') || 'general'}

Create ${count} words that:
1. FIT THE THEME perfectly (e.g., for "Ocean Adventure": whale, fish, coral, wave)
2. Are age-appropriate for a ${childAge}-year-old
3. Match the ${difficulty} difficulty level
4. Create an immersive thematic experience
5. Progress from easier to harder within the theme
6. Include interesting context that builds the quest story

Difficulty guidelines:
- easy: 3-5 letter words, common sounds
- medium: 5-7 letter words, some complex sounds
- hard: 7+ letter words, challenging phonemes

Return JSON:
{
  "words": [
    {
      "word": "the word",
      "phonetic": "/phonetic notation/",
      "difficulty": 1-10,
      "context": "How this word fits in the ${theme} quest story"
    }
  ]
}

Make the quest feel like an adventure! Example for Ocean Adventure:
- "whale" - "You spot a friendly whale breaching the surface!"
- "coral" - "Discover a beautiful coral reef teeming with life!"
- "treasure" - "Find the hidden treasure chest on the ocean floor!"`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a creative speech therapy AI creating immersive themed word experiences for children."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8, // Higher for more creative themed content
      max_completion_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    console.log('✅ Generated', result.words?.length || 0, 'conquest words for', theme);
    return result.words || [];

  } catch (error) {
    console.error('❌ Conquest word generation error:', error);
    
    // Fallback themed words
    const fallbackWords: Record<string, string[]> = {
      'Ocean Adventure': ["fish", "whale", "coral", "wave", "ship", "treasure", "dolphin", "pearl", "shell", "ocean", "beach", "sailor"],
      'Space Explorer': ["star", "planet", "rocket", "moon", "galaxy", "comet", "space", "alien", "orbit", "cosmos", "nebula", "astronaut"],
      'Jungle Safari': ["lion", "monkey", "tree", "vine", "parrot", "tiger", "jungle", "banana", "elephant", "snake", "river", "rainforest"],
      'Castle Quest': ["king", "queen", "crown", "throne", "knight", "castle", "dragon", "sword", "royal", "prince", "tower", "kingdom"],
      'default': ["quest", "hero", "adventure", "brave", "magic", "explore", "discover", "journey", "treasure", "courage", "wonder", "victory"]
    };

    const words = fallbackWords[theme] || fallbackWords['default'];
    return words.slice(0, count).map((word, index) => ({
      word,
      phonetic: `/${word}/`,
      difficulty: 3 + Math.floor(index / 3), // Gradually increase difficulty
      context: `Part of your ${theme} adventure!`
    }));
  }
}

/**
 * Generate personalized session summary for Daily Quest (Conquest Mode)
 * Creates encouraging, quest-themed feedback based on performance
 */
export async function generateConquestSummary(
  childName: string,
  childAge: number,
  theme: string,
  emoji: string,
  targetScore: number,
  actualScore: number,
  targetAccuracy: number,
  actualAccuracy: number,
  wordsCompleted: number,
  totalWords: number,
  maxStreak: number,
  questCompleted: boolean,
  accuracyMet: boolean,
  interests: string[]
): Promise<any> {
  try {
    console.log('🏆 Generating conquest summary for:', { childName, theme, questCompleted });

    const prompt = `
You are a warm, encouraging speech therapy AI companion celebrating a child's Daily Quest completion.

Quest Details:
- Theme: ${theme} ${emoji}
- Child: ${childName} (age ${childAge})
- Interests: ${interests.join(', ') || 'general'}

Performance:
- Quest Goal: ${targetScore} points → Achieved: ${actualScore} points (${questCompleted ? '✅ COMPLETED!' : '❌ Not yet'})
- Accuracy Goal: ${targetAccuracy}% → Achieved: ${Math.round(actualAccuracy)}% (${accuracyMet ? '✅ MET!' : '❌ Not yet'})
- Words: ${wordsCompleted}/${totalWords} completed
- Best Streak: ${maxStreak} words in a row

Create an encouraging, personalized message that:
1. References the ${theme} theme creatively
2. Celebrates specific achievements (score, accuracy, streak)
3. Is warm and supportive (even if quest not completed)
4. Uses age-appropriate language for ${childAge}-year-old
5. Feels personal to ${childName}
6. Mentions their interests if relevant
7. Encourages continued practice

Tone Guidelines:
- If quest completed: Celebrate enthusiastically! Make them feel like a hero!
- If not completed: Still praise effort, highlight what they DID accomplish, encourage next time
- Always end on a positive, motivating note

Return JSON:
{
  "title": "Quest completion status title (e.g., 'Quest Complete!' or 'Brave Attempt!')",
  "message": "Personal, encouraging message (3-4 sentences max, warm and specific)",
  "achievements": ["Specific achievement 1", "Specific achievement 2"],
  "celebrationMessage": "Short celebration (e.g., 'Quest Victory!' or 'Great Effort!')"
}

Example (Ocean Adventure, quest completed):
{
  "title": "🌊 Ocean Adventure Complete! 🌊",
  "message": "Wow, ${childName}! You sailed through the Ocean Adventure like a true captain! You scored ${actualScore} points and helped ${wordsCompleted} sea creatures—that's incredible! Your ${maxStreak}-word streak shows you're becoming a master of the waves!",
  "achievements": ["Completed the Ocean Adventure quest!", "Helped ${wordsCompleted} sea creatures", "Sailed with ${maxStreak}-word streak"],
  "celebrationMessage": "Champion of the Seas!"
}

Example (Castle Quest, not completed):
{
  "title": "💪 Brave Knight Attempt! 💪",
  "message": "Great job, ${childName}! You showed real courage in the Castle Quest! Even though you reached ${actualScore} points (goal was ${targetScore}), you still helped ${wordsCompleted} words—that's amazing progress! Your ${maxStreak}-word streak proves you're getting stronger every day!",
  "achievements": ["Showed brave effort in Castle Quest", "Practiced ${wordsCompleted} royal words", "Built a ${maxStreak}-word streak"],
  "celebrationMessage": "Keep Training, Brave Knight!"
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a warm, encouraging speech therapy companion who celebrates children's achievements and motivates them to keep practicing. You create personalized, quest-themed feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.85, // Higher for more creative, personal messages
      max_completion_tokens: 800,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    console.log('✅ Conquest summary generated:', result.title);
    return result;

  } catch (error) {
    console.error('❌ Conquest summary generation error:', error);
    
    // Fallback summary
    return {
      title: questCompleted ? `${emoji} Quest Complete!` : `💪 Great Effort!`,
      message: questCompleted
        ? `Amazing work, ${childName}! You conquered the ${theme} and scored ${actualScore} points! You completed ${wordsCompleted} words with a ${maxStreak}-word streak. You're becoming a true champion!`
        : `Great job, ${childName}! You gave the ${theme} your best effort and scored ${actualScore} points! You practiced ${wordsCompleted} words and built a ${maxStreak}-word streak. Keep practicing and you'll conquer it next time!`,
      achievements: [
        questCompleted ? `Completed ${theme} quest!` : `Attempted ${theme} quest`,
        `Practiced ${wordsCompleted} words`,
        `Built a ${maxStreak}-word streak`
      ],
      celebrationMessage: questCompleted ? "Quest Victory!" : "Keep Going, Hero!"
    };
  }
}

/**
 * Generate AI-powered story mode summary based on adventure and performance
 */
export async function generateStorySummary(
  childName: string,
  childAge: number,
  storyTheme: string,
  storyTitle: string,
  totalWords: number,
  wordsCompleted: number,
  actualAccuracy: number,
  actualScore: number,
  maxStreak: number,
  interests: string[]
): Promise<any> {
  
  const completionRate = Math.round((wordsCompleted / totalWords) * 100);
  const storyCompleted = wordsCompleted === totalWords;
  
  const prompt = `
You are a warm, encouraging storytelling companion for a ${childAge}-year-old speech therapy student.

STORY ADVENTURE: ${storyTitle}
Theme: ${storyTheme}
Child: ${childName} (age ${childAge})
Interests: ${interests.join(', ') || 'exploring and learning'}

PERFORMANCE RESULTS:
✅ Words Completed: ${wordsCompleted} out of ${totalWords} (${completionRate}%)
📊 Accuracy: ${actualAccuracy}%
⭐ Score: ${actualScore} points
🔥 Longest Streak: ${maxStreak} words in a row
${storyCompleted ? '🎉 STORY COMPLETED!' : '📖 Story in progress...'}

Create an encouraging, story-themed session summary that:
1. Continues the narrative of their adventure
2. References the ${storyTheme} creatively
3. Celebrates specific achievements (accuracy, streak, completion)
4. Uses age-appropriate language for a ${childAge}-year-old
5. Makes ${childName} feel like the hero of the story
6. Acknowledges their effort and progress
7. Encourages them to continue their adventure

Return JSON format:
{
  "title": "Story adventure title (e.g., 'The Forest Hero Returns!')",
  "message": "Main narrative message about their journey and achievements (2-3 sentences)",
  "achievements": ["specific accomplishment 1", "specific accomplishment 2", "specific accomplishment 3"],
  "encouragement": "Motivational message for their next adventure",
  "celebrationMessage": "Short exciting phrase (e.g., 'Adventure Complete!' or 'Hero in Training!')"
}

Be creative, warm, and make them excited to continue their story!`;

  try {
    console.log('📖 Generating story mode summary...');
    console.log(`Story: "${storyTitle}" | Words: ${wordsCompleted}/${totalWords} | Accuracy: ${actualAccuracy}%`);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a magical storytelling companion who celebrates children's achievements through narrative adventures. Always return valid JSON. Be warm, encouraging, and age-appropriate."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.85,
      max_completion_tokens: 800,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    console.log('✅ Story summary generated:', result.title);
    return result;

  } catch (error) {
    console.error('❌ Story summary generation error:', error);
    
    // Fallback summary
    return {
      title: storyCompleted ? `🎉 ${storyTitle} - Complete!` : `📖 ${storyTitle} - Chapter ${Math.ceil(wordsCompleted / 3)}`,
      message: storyCompleted
        ? `What an amazing adventure, ${childName}! You completed the entire story of ${storyTitle}! You practiced ${wordsCompleted} words with ${actualAccuracy}% accuracy and scored ${actualScore} points. You're a true story hero!`
        : `Great work, ${childName}! You're making wonderful progress in ${storyTitle}! You've completed ${wordsCompleted} out of ${totalWords} words with ${actualAccuracy}% accuracy. Your ${maxStreak}-word streak shows you're getting stronger!`,
      achievements: [
        storyCompleted ? `Completed the entire ${storyTheme} adventure!` : `Explored ${completionRate}% of ${storyTheme}`,
        `Practiced ${wordsCompleted} words clearly`,
        `Built a ${maxStreak}-word streak`,
        `Achieved ${actualAccuracy}% accuracy`
      ],
      encouragement: storyCompleted 
        ? `You finished the whole adventure! Ready for a new story?`
        : `Your story continues! Come back to discover what happens next!`,
      celebrationMessage: storyCompleted ? "Story Complete! 🎉" : "Adventure Continues! 📖"
    };
  }
}
