import Groq from 'groq-sdk';

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

export interface EmotionalState {
  emotion: 'excited' | 'frustrated' | 'bored' | 'confident' | 'tired' | 'anxious';
  confidence: number; // 0-1
  triggers: string[];
  recommendedAction: 'continue' | 'offer_break' | 'easier_challenge' | 'celebrate' | 'vary_activity';
  supportMessage: string;
  interventionNeeded: boolean;
  reasoning: string;
}

/**
 * Detect child's emotional state from recent performance patterns
 * Analyzes attempts, accuracy trends, and timing to identify emotions
 */
export async function detectEmotionalState(
  recentAttempts: Array<{
    word: string;
    accuracy: number;
    attempt: number;
    correct: boolean;
    confidence?: number;
    timestamp?: Date;
  }>,
  voiceAnalysis?: {
    energy?: number;
    clarity?: number;
    speed?: number;
  }
): Promise<EmotionalState> {
  if (!recentAttempts || recentAttempts.length === 0) {
    return {
      emotion: 'confident',
      confidence: 0.5,
      triggers: [],
      recommendedAction: 'continue',
      supportMessage: 'Keep up the great work!',
      interventionNeeded: false,
      reasoning: 'No attempts to analyze'
    };
  }

  const prompt = `Analyze a child's emotional state during a speech therapy game.

Recent Attempt Pattern (last ${recentAttempts.length} attempts):
${recentAttempts.map((a, i) => `
  ${i + 1}. Word: "${a.word}"
     - Accuracy: ${a.accuracy}%
     - Attempt: ${a.attempt}/3
     - Result: ${a.correct ? '✅ SUCCESS' : '❌ FAILED'}
     - Confidence: ${a.confidence || 'N/A'}
     ${a.timestamp ? `- Time: ${a.timestamp}` : ''}
`).join('\n')}

${voiceAnalysis ? `
Voice Tone Analysis:
- Energy Level: ${voiceAnalysis.energy}/1.0 (${voiceAnalysis.energy! > 0.7 ? 'high' : voiceAnalysis.energy! > 0.4 ? 'medium' : 'low'})
- Clarity: ${voiceAnalysis.clarity}/1.0
- Speech Speed: ${voiceAnalysis.speed || 'normal'} words/min
` : 'Voice analysis not available'}

BEHAVIORAL PATTERNS TO DETECT:

1. FRUSTRATED Signs:
   - Multiple failures in a row (2-3+)
   - Declining accuracy trend
   - Longer pauses between attempts
   - Low voice confidence scores
   - Multiple attempts needed per word

2. BORED Signs:
   - Consistent mediocre scores (~60-75%)
   - Fast attempts (rushing through)
   - No improvement over time
   - Plateau in performance

3. EXCITED Signs:
   - High accuracy (85%+)
   - Quick successful attempts
   - Improving trend
   - High voice confidence
   - First-try successes

4. TIRED/FATIGUED Signs:
   - Declining performance over time
   - Slow speech
   - Low energy in voice
   - Increasing errors as session progresses

5. ANXIOUS Signs:
   - Very long pauses before attempting
   - Multiple false starts
   - Low confidence scores
   - Avoiding attempts

6. CONFIDENT Signs:
   - Consistent success
   - Quick attempts
   - High accuracy
   - Steady performance

Analyze the pattern and return JSON:
{
  "emotion": "frustrated" | "bored" | "excited" | "confident" | "tired" | "anxious",
  "confidence": 0.85,
  "triggers": ["specific observations that led to this conclusion"],
  "recommendedAction": "offer_break" | "easier_challenge" | "continue" | "celebrate" | "vary_activity",
  "supportMessage": "Brief empathetic message (will be enhanced later)",
  "interventionNeeded": true,
  "reasoning": "Detailed explanation of emotional state analysis"
}

Be SPECIFIC in triggers and reasoning. This helps therapists understand the child.`;

  try {
    console.log('😊 Analyzing emotional state from', recentAttempts.length, 'attempts');

    const completion = await getGroqClient().chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a child psychologist and speech therapist expert at reading emotional states from behavioral patterns. You're analyzing data to help support children during learning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Low temperature for analytical tasks
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content || '{}';
    const emotionalState: EmotionalState = JSON.parse(response);

    console.log('💭 Emotional state detected:', emotionalState.emotion, `(${Math.round(emotionalState.confidence * 100)}% confident)`);
    console.log('🎯 Recommended action:', emotionalState.recommendedAction);
    
    if (emotionalState.interventionNeeded) {
      console.log('⚠️ Intervention needed! Triggers:', emotionalState.triggers);
    }

    return emotionalState;

  } catch (error) {
    console.error('❌ Emotion detection failed:', error);
    // Fallback to neutral state
    return {
      emotion: 'confident',
      confidence: 0.5,
      triggers: ['Analysis failed'],
      recommendedAction: 'continue',
      supportMessage: 'Keep doing your best!',
      interventionNeeded: false,
      reasoning: 'Error in analysis, defaulting to neutral state'
    };
  }
}

/**
 * Generate empathetic, personalized response based on emotional state
 * Creates supportive messages that validate feelings and offer help
 */
export async function generateEmpatheticResponse(
  emotionalState: EmotionalState,
  childName: string,
  context: {
    currentWord?: string;
    wordNumber?: number;
    totalWords?: number;
    recentProgress?: string;
  },
  companionCharacter: string = "your friend"
): Promise<string> {
  const prompt = `Generate a warm, empathetic response for a child during speech therapy.

Child's Name: ${childName}
Detected Emotion: ${emotionalState.emotion}
Confidence: ${Math.round(emotionalState.confidence * 100)}%
Context: ${context.currentWord ? `Working on word "${context.currentWord}"` : 'In progress'} (${context.wordNumber || 0}/${context.totalWords || 15})
Companion: ${companionCharacter}
Recent Progress: ${context.recentProgress || 'Just started'}

Emotional State Details:
- Triggers: ${emotionalState.triggers.join(', ')}
- Recommended Action: ${emotionalState.recommendedAction}
- Intervention Needed: ${emotionalState.interventionNeeded ? 'YES' : 'No'}
- Reasoning: ${emotionalState.reasoning}

Generate a response that:
1. VALIDATES their feelings (never dismiss or minimize emotions)
2. Relates SPECIFICALLY to their situation (not generic)
3. Offers GENUINE encouragement (not fake positivity)
4. Suggests a CONCRETE next step
5. Uses WARM, age-appropriate language (4-7 years old)
6. Includes their NAME for personalization
7. Shows the companion cares (empathy, not just instruction)
8. Ends with HOPE and excitement (but realistic)

EMOTION-SPECIFIC GUIDANCE:

FRUSTRATED Response:
- Acknowledge the hard work: "I can see you're working really hard..."
- Normalize the difficulty: "This sound is tricky for lots of people..."
- Celebrate what they DID achieve: "You've already helped X animals!"
- Offer choices (empowerment): "Would you like to... or ...?"
- Show belief in them: "I know you can do this!"

Example: "Hey ${childName}, I can see you're working SO hard on this 'r' sound! It's one of the trickiest sounds - even grown-ups find it challenging sometimes. 🤗 You know what though? You've already helped 8 animals today! That's AMAZING! 🌟 What would you like to do - try an easier word first to feel successful, or take a quick dance break? I believe in you, friend! 💪"

BORED Response:
- Acknowledge their skill: "You're doing great, but..."
- Offer new challenge: "I think you're ready for..."
- Add excitement: "I have a SURPRISE for you..."
- Change it up: "Let's try something different..."

Example: "Wow ${childName}, you're doing SO well! I can tell these words are getting easier for you. 🌟 You know what? I think you're ready for a NEW challenge! How about we try a SPEED ROUND where you race against the clock? Or maybe a mystery word game? You're becoming a real word expert! 🏆"

TIRED Response:
- Acknowledge their effort: "You've worked so hard today..."
- Validate fatigue: "Your brain is tired - that's good!"
- Offer gentle close: "Just a little bit more..."
- Celebrate progress: "Look how far you've come..."

Example: "${childName}, your brain has been working SO hard today - and that's wonderful! That means you're learning and growing. 🌱 You've already done amazing work on ${context.wordNumber || 5} words! How about we do just ONE more fun word together, then you can rest? You've earned it, superstar! ⭐"

ANXIOUS Response:
- Create safety: "It's okay to feel nervous..."
- Remove pressure: "No rush, take your time..."
- Offer support: "I'm right here with you..."
- Start small: "Let's try something super easy first..."

Example: "Hey ${childName}, I notice you're taking your time - and that's totally okay! 🤗 There's no rush at all. ${companionCharacter} is right here with you, and we can go as slowly as you need. How about we start with a word I KNOW you can say? Let's build up that confidence together! You're brave for trying! 💙"

EXCITED Response:
- Match energy: "YES! You're on fire!"
- Celebrate specifically: "That 'r' sound was PERFECT!"
- Channel momentum: "Let's keep this going!"
- Challenge appropriately: "Ready for something even cooler?"

Example: "WOAH ${childName}! You're absolutely CRUSHING it! 🎉 That 'r' sound in '${context.currentWord}' was spot-on perfect! You're like a pronunciation superhero! 🦸 ${companionCharacter} is SO proud! Want to keep this amazing streak going? I've got an extra fun challenge waiting for you! 🚀"

CONFIDENT Response:
- Acknowledge skill: "You're really getting good at this!"
- Appropriate challenge: "Ready for the next level?"
- Maintain engagement: "Let's see what you can do..."
- Show progress: "Look how much you've improved!"

Example: "Look at you go, ${childName}! You're becoming a real word master! 🌟 You've gotten ${context.wordNumber} words already, and your 'r' sound has improved SO much! ${companionCharacter} thinks you're ready for something a bit more challenging. Want to try? I bet you'll do great! 💪"

Return ONLY the empathetic message (no JSON, no labels).`;

  try {
    console.log('💬 Generating empathetic response for emotion:', emotionalState.emotion);

    const completion = await getGroqClient().chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a compassionate speech therapist who truly cares about children. You speak warmly, validate feelings genuinely, and always find the right words to support and encourage. You're not just instructing - you're connecting emotionally."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8, // Warm and personalized, but not random
      max_completion_tokens: 600
    });

    const message = completion.choices[0]?.message?.content?.trim() || '';
    
    console.log('✅ Empathetic response generated');
    console.log('📝 Message length:', message.length);

    return message;

  } catch (error) {
    console.error('❌ Empathetic response generation failed:', error);
    
    // Fallback responses by emotion
    const fallbackMessages: Record<EmotionalState['emotion'], string> = {
      frustrated: `Hey ${childName}, I can see you're working really hard! This is tricky, but you're doing great. Want to try something easier first? 💪`,
      bored: `${childName}, you're doing so well! I think you're ready for a new challenge. Want to try something different? 🎯`,
      excited: `Amazing work, ${childName}! You're on fire! 🎉 Keep going, superstar!`,
      confident: `You're doing fantastic, ${childName}! Ready for the next word? 🌟`,
      tired: `${childName}, you've worked so hard today! Just a little more, then you can rest. You're doing great! 💙`,
      anxious: `It's okay, ${childName}. Take your time - there's no rush. I'm here with you! 🤗`
    };

    return fallbackMessages[emotionalState.emotion] || `Great effort, ${childName}! Keep going! 🌟`;
  }
}

/**
 * Quick check if intervention is needed based on simple heuristics
 * Used as fast check before full AI analysis
 */
export function quickEmotionalCheck(attempts: Array<{ correct: boolean; accuracy: number }>): {
  needsCheck: boolean;
  reason: string;
} {
  if (attempts.length < 3) {
    return { needsCheck: false, reason: 'Not enough attempts yet' };
  }

  const recent = attempts.slice(-3);
  
  // Check for multiple failures
  const failureCount = recent.filter(a => !a.correct).length;
  if (failureCount >= 3) {
    return { needsCheck: true, reason: 'Three consecutive failures detected' };
  }

  // Check for declining accuracy
  const accuracies = recent.map(a => a.accuracy);
  const isDecline = accuracies[0] > accuracies[1] && accuracies[1] > accuracies[2];
  if (isDecline && accuracies[2] < 60) {
    return { needsCheck: true, reason: 'Declining accuracy trend' };
  }

  // Check for plateau (boredom)
  const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - avgAccuracy, 2), 0) / accuracies.length;
  if (variance < 25 && avgAccuracy >= 65 && avgAccuracy <= 75) {
    return { needsCheck: true, reason: 'Performance plateau - possible boredom' };
  }

  return { needsCheck: false, reason: 'Performance within normal range' };
}
