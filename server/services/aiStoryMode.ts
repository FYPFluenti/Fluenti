import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface StoryWord {
  word: string;
  phonetic: string;
  difficulty: number;
  category: string;
  therapyFocus?: string;
  visualCue: string;
  storyContext: string;
  characterDialogue: string;
  successNarrative: string;
  failureEncouragement: string;
  visualScene: string;
  nextBeat: string;
}

export interface StoryMode {
  theme: string;
  title: string;
  mainCharacter: string;
  companionCharacter: string;
  companionEmoji: string;
  plot: string;
  introduction: string;
  words: StoryWord[];
  conclusion: string;
}

/**
 * Generate a complete story-based adventure for speech therapy
 * Each word is a story beat in a continuous narrative
 */
export async function generateStoryAdventure(
  childProfile: {
    childName: string;
    childBirthYear?: number;
    interests?: string[];
  },
  wordCount: number = 15,
  performanceAnalysis?: {
    skillLevel?: number;
    weakPhonemes?: string[];
    strongPhonemes?: string[];
  }
): Promise<StoryMode> {
  const childAge = childProfile.childBirthYear 
    ? new Date().getFullYear() - childProfile.childBirthYear 
    : 5;

  const prompt = `Create an ENGAGING story-based speech therapy adventure for a child.

Child Profile:
- Name: ${childProfile.childName}
- Age: ${childAge} years old
- Interests: ${childProfile.interests?.join(', ') || 'animals, nature, adventure'}

${performanceAnalysis ? `
Performance Context:
- Skill Level: ${performanceAnalysis.skillLevel || 5}/10
- Weak Phonemes to Practice: ${performanceAnalysis.weakPhonemes?.join(', ') || 'various'}
- Strong Phonemes: ${performanceAnalysis.strongPhonemes?.join(', ') || 'building'}
- Recommended: Start easy → gradually increase difficulty
` : ''}

Create a ${wordCount}-word adventure story with these requirements:

STORY STRUCTURE:
1. ONE continuous narrative (not separate word lists)
2. Each word is a story beat (character, object, or action)
3. Progressive difficulty curve (start easy → build to challenging)
4. Age-appropriate vocabulary (${childAge} years old)
5. Incorporates child's interests throughout
6. Motivating plot (save friends, find treasure, solve mystery, become hero)
7. Celebration and sense of accomplishment at the end

THEME SELECTION (choose best match for interests):
- Forest Adventure: Perfect for children who love animals, nature, outdoors
- Castle Quest: Great for fantasy, magic, princesses, knights
- Space Explorer: Ideal for science, planets, aliens, rockets
- Ocean Treasure: Best for sea creatures, pirates, beaches, water
- Superhero Mission: Perfect for action, heroes, saving the day

For EACH of the ${wordCount} words, provide:

1. word: The target pronunciation word (age-appropriate)
2. phonetic: IPA pronunciation guide
3. difficulty: 1-10 scale (start at 2-3, end at 6-7)
4. category: Word category (animal, object, action, character, place)
5. therapyFocus: Target phoneme or sound pattern
6. visualCue: Single emoji representing the word
7. storyContext: 2-3 sentence scene description that introduces this word naturally in the story
8. characterDialogue: What an NPC says (make it fun and engaging!)
9. successNarrative: 2-3 sentences describing the reward and moving story forward
10. failureEncouragement: Supportive hint (never negative, always encouraging)
11. visualScene: 3-5 emojis showing the scene
12. nextBeat: 1-2 sentence cliffhanger leading to next word

STORY FLOW EXAMPLE:
"You enter the enchanted forest and hear a rustling sound. A small RABBIT hops out from behind a tree! 
→ [Child says RABBIT] 
→ 'Thank you for helping me find my voice!' says the rabbit. 'My friend the SQUIRREL needs help too! Follow me!'"

CRITICAL REQUIREMENTS:
- Make it feel like ONE adventure, not 15 separate tasks
- Build emotional connection (child cares about helping characters)
- Include ${childProfile.childName}'s name in dialogue
- Use interests: ${childProfile.interests?.join(', ')}
- Create anticipation for next word (cliffhangers)
- End with heroic celebration

Return COMPLETE JSON structure:
{
  "theme": "Forest Adventure",
  "title": "The Magical Forest Quest",
  "mainCharacter": "${childProfile.childName} the Brave Explorer",
  "companionCharacter": "Finn the Wise Fox",
  "companionEmoji": "🦊",
  "plot": "Help forest animals find their lost magic voices and save the enchanted forest!",
  "introduction": "Welcome to the enchanted forest, ${childProfile.childName}! I'm Finn the Fox, and something terrible has happened - all the forest animals have lost their voices! Only YOU have the magic power to help them speak again. Are you ready for this important quest?",
  "words": [
    {
      "word": "rabbit",
      "phonetic": "/ˈræb.ɪt/",
      "difficulty": 2,
      "category": "animal",
      "therapyFocus": "r sound",
      "visualCue": "🐰",
      "storyContext": "As you walk deeper into the forest, you hear a rustling behind a big oak tree. A small, fluffy rabbit appears, looking sad because it can't make a sound!",
      "characterDialogue": "The rabbit looks at you with hopeful eyes. Can you help it say its name? Try saying 'RABBIT'!",
      "successNarrative": "The rabbit jumps with joy! 'RABBIT! RABBIT!' it says happily. 'Thank you so much, ${childProfile.childName}! You gave me back my voice!' The rabbit gives you a magical golden carrot. ✨",
      "failureEncouragement": "Almost there! Try saying RAB-bit slowly. Break it into two parts: RAB... bit. You're doing great!",
      "visualScene": "🌲🐰✨🌳🥕",
      "nextBeat": "The grateful rabbit tells you about its friend the squirrel who also lost its voice. 'Follow me to the big tree!' it says, hopping ahead."
    }
    // ... continue with ${wordCount - 1} more words following the story progression
  ],
  "conclusion": "🎉 Congratulations, ${childProfile.childName}! You saved ALL the forest animals! Their voices are back, and the enchanted forest is filled with happy sounds again. You're a TRUE HERO! All the animals gather to thank you with a grand celebration. You've earned the title of 'Forest Voice Guardian!' 🌟"
}

IMPORTANT: Generate EXACTLY ${wordCount} complete word objects in the words array, each advancing the story naturally.`;

  try {
    console.log('🎨 Generating story adventure for:', childProfile.childName);
    console.log('📚 Theme preferences based on interests:', childProfile.interests);

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a creative children's storyteller and expert speech therapist. You create engaging, therapeutic adventures that make children EXCITED to practice pronunciation. Your stories are emotionally engaging, age-appropriate, and educationally effective."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.85, // High creativity for story, but not too random
      max_completion_tokens: 10000, // Large for full story with all words
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    console.log('✅ Story generation response received');
    console.log('📝 Response length:', response.length);
    console.log('🔍 Finish reason:', completion.choices[0]?.finish_reason);

    if (completion.choices[0]?.finish_reason === 'length') {
      console.error('⚠️ WARNING: Story response was truncated due to token limit!');
    }

    const story: StoryMode = JSON.parse(response);

    // Validation
    if (!story.words || story.words.length < wordCount) {
      console.warn(`⚠️ Story only generated ${story.words?.length || 0} words, expected ${wordCount}`);
    }

    console.log('🎉 Story generated successfully:', story.title);
    console.log('📖 Theme:', story.theme);
    console.log('🎭 Words count:', story.words?.length);

    return story;

  } catch (error) {
    console.error('❌ Story generation failed:', error);
    throw new Error(`Failed to generate story adventure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a story transition between words
 * Creates seamless narrative flow
 */
export async function generateStoryTransition(
  currentContext: string,
  nextWord: string,
  childName: string,
  companionCharacter: string = "your guide"
): Promise<string> {
  const prompt = `Generate an exciting story transition in a speech therapy adventure.

Current Story Context: "${currentContext}"
Next Word Target: "${nextWord}"
Child's Name: ${childName}
Companion: ${companionCharacter}

Create a 1-2 sentence transition that:
1. Builds anticipation for the next word
2. Makes logical story sense (flows naturally from previous scene)
3. Feels like ONE continuous adventure (not separate tasks)
4. Age-appropriate excitement (for 4-7 year olds)
5. Uses the child's name for personalization
6. Creates a mini-cliffhanger

Example: "As the dragon flies away, ${childName} spots a mysterious CASTLE in the distance! ${companionCharacter} says, 'I wonder who lives there... let's find out!'"

Return ONLY the transition text (no JSON, no quotation marks).`;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a children's storyteller creating seamless narrative transitions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_completion_tokens: 300
    });

    return completion.choices[0]?.message?.content?.trim() || '';

  } catch (error) {
    console.error('❌ Story transition generation failed:', error);
    // Fallback generic transition
    return `Great job, ${childName}! Now let's find out what happens with ${nextWord}...`;
  }
}

/**
 * Get companion personality and greeting based on child's interests
 */
export async function generateCompanionPersonality(
  childProfile: {
    childName: string;
    interests?: string[];
  }
): Promise<{
  name: string;
  emoji: string;
  personality: string;
  greeting: string;
  catchphrase: string;
}> {
  const prompt = `Create a companion character for a speech therapy adventure.

Child: ${childProfile.childName}
Interests: ${childProfile.interests?.join(', ') || 'animals, nature'}

Generate a companion character that:
1. Matches the child's interests (e.g., Fox for animals, Robot for tech)
2. Has warm, supportive personality
3. Age-appropriate (for 4-7 year olds)
4. Memorable and likeable
5. Encourages without being pushy

Return JSON:
{
  "name": "Finn the Wise Fox",
  "emoji": "🦊",
  "personality": "Warm, patient, loves puns, always encouraging, slightly silly",
  "greeting": "Hi ${childProfile.childName}! I'm Finn, and I'm SO excited for our adventure together!",
  "catchphrase": "You got this, friend! 🦊"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a character designer creating supportive companions for children."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_completion_tokens: 800,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(response);

  } catch (error) {
    console.error('❌ Companion generation failed:', error);
    // Fallback companion
    return {
      name: "Sparkle",
      emoji: "✨",
      personality: "Cheerful, supportive, magical",
      greeting: `Hi ${childProfile.childName}! Let's have fun together!`,
      catchphrase: "You're amazing! ✨"
    };
  }
}
