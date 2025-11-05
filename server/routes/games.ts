import { Router, Request, Response } from 'express';
import { GameProgress } from '../models/GameProgress';
import { GameSession } from '../models/GameSession';
import Groq from 'groq-sdk';

// Initialize Groq client (compatible with OpenAI SDK)
// Using Groq's openai/gpt-oss-120b model for all AI operations
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

const router = Router();

// Get all game progress for a user
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const progress = await GameProgress.find({ userId }).sort({ gameId: 1 });
    
    // Initialize progress for Word Practice game if not exists
    if (progress.length === 0) {
      const gameNames = [
        'Word Practice'
      ];

      const initialProgress = await Promise.all(
        gameNames.map((name, index) =>
          GameProgress.create({
            userId,
            gameId: index + 1,
            gameName: name,
            level: 1,
            stars: 0,
            unlocked: true // Word Practice game is unlocked by default
          })
        )
      );

      return res.json(initialProgress);
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching game progress:', error);
    res.status(500).json({ error: 'Failed to fetch game progress' });
  }
});

// Get game data by game ID
router.get('/game-data/:gameId', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's progress for this game
    const progress = await GameProgress.findOne({ userId, gameId: parseInt(gameId) });
    const userLevel = progress?.level || 1;

    let gameData: any = {};

    switch (parseInt(gameId)) {
      case 1: // Word Practice
        gameData = {
          gameId: 1,
          gameName: 'Word Practice',
          currentLevel: userLevel,
          description: 'AI-powered word practice game with personalized content',
          isAIPowered: true
        };
        break;

      default:
        return res.status(404).json({ error: 'Game not found' });
    }

    res.json(gameData);
  } catch (error) {
    console.error('Error fetching game data:', error);
    res.status(500).json({ error: 'Failed to fetch game data' });
  }
});

// Start a new game session
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const { gameId, gameName } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await GameSession.create({
      userId,
      gameId,
      gameName,
      startTime: new Date(),
      score: 0,
      accuracy: 0,
      completed: false,
      gameData: {}
    });

    res.json(session);
  } catch (error) {
    console.error('Error starting game session:', error);
    res.status(500).json({ error: 'Failed to start game session' });
  }
});

// Update game session progress
router.patch('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const { sessionId } = req.params;
    const updateData = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await GameSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { $set: updateData },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error updating game session:', error);
    res.status(500).json({ error: 'Failed to update game session' });
  }
});

// Complete a game session
router.post('/session/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const { sessionId } = req.params;
    const { score, accuracy, gameData } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await GameSession.findOne({ _id: sessionId, userId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate duration
    const duration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000);
    
    // Calculate stars based on accuracy
    let starsEarned = 0;
    if (accuracy >= 90) starsEarned = 3;
    else if (accuracy >= 70) starsEarned = 2;
    else if (accuracy >= 50) starsEarned = 1;

    // Calculate XP based on performance
    const baseXP = [25, 20, 40, 35, 60, 50][session.gameId - 1];
    const xpEarned = Math.floor(baseXP * (accuracy / 100));

    // Update session
    session.endTime = new Date();
    session.duration = duration;
    session.score = score;
    session.accuracy = accuracy;
    session.completed = true;
    session.gameData = gameData;
    session.xpEarned = xpEarned;
    session.starsEarned = starsEarned;
    await session.save();

    // Update game progress
    const progress = await GameProgress.findOne({ 
      userId, 
      gameId: session.gameId 
    });

    if (progress) {
      progress.totalPlays += 1;
      progress.lastPlayedAt = new Date();
      
      if (score > progress.bestScore) {
        progress.bestScore = score;
      }

      if (starsEarned > progress.stars) {
        progress.stars = starsEarned;
      }

      // Update average accuracy
      progress.averageAccuracy = 
        (progress.averageAccuracy * (progress.totalPlays - 1) + accuracy) / progress.totalPlays;

      await progress.save();
    }

    res.json({
      session,
      progress,
      rewards: {
        xp: xpEarned,
        stars: starsEarned
      }
    });
  } catch (error) {
    console.error('Error completing game session:', error);
    res.status(500).json({ error: 'Failed to complete game session' });
  }
});

// Get user's game statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [progress, sessions] = await Promise.all([
      GameProgress.find({ userId }),
      GameSession.find({ userId, completed: true }).sort({ createdAt: -1 }).limit(10)
    ]);

    const totalXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const totalStars = progress.reduce((sum, p) => sum + p.stars, 0);
    const totalSessions = sessions.length;
    const averageAccuracy = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
      : 0;

    // Calculate level based on XP
    const level = Math.floor(totalXP / 100) + 1;

    // Calculate streak (consecutive days)
    let streak = 0;
    if (sessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(sessions[0].createdAt);
      currentDate.setHours(0, 0, 0, 0);
      
      for (const session of sessions) {
        const sessionDate = new Date(session.createdAt);
        sessionDate.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff <= 1) {
          if (sessionDate.getTime() !== currentDate.getTime()) {
            streak++;
            currentDate = sessionDate;
          }
        } else {
          break;
        }
      }
      streak++; // Include current day
    }

    res.json({
      level,
      xp: totalXP,
      stars: totalStars,
      streak,
      totalSessions,
      averageAccuracy: Math.round(averageAccuracy),
      progress,
      recentSessions: sessions.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// AI-powered word generation endpoint
router.post('/generate-words', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { childProfile, sessionType = 'practice' } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.' 
      });
    }

    // Generate AI-powered personalized words using Groq openai/gpt-oss-120b
    const personalizedWords = await generateAIPersonalizedWords(childProfile, sessionType);
    
    if (!personalizedWords || personalizedWords.length === 0) {
      return res.status(500).json({ 
        error: 'Unable to generate personalized words at this time. Please try again.' 
      });
    }
    
    res.json({ words: personalizedWords });
  } catch (error) {
    console.error('Error generating personalized words:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again in a moment.' 
    });
  }
});

// AI feedback generation endpoint
router.post('/generate-feedback', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.' 
      });
    }

    const { 
      childName, 
      targetWord, 
      userAttempt, 
      accuracy, 
      attemptNumber, 
      childAge, 
      interests 
    } = req.body;

    // Generate AI-powered encouraging feedback
    const feedback = await generateAIEncouragingFeedback(
      childName,
      targetWord,
      userAttempt,
      accuracy,
      attemptNumber,
      childAge,
      interests
    );
    
    if (!feedback) {
      return res.status(500).json({ 
        error: 'Unable to generate feedback at this time. Please try again.' 
      });
    }
    
    res.json(feedback);
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again in a moment.' 
    });
  }
});

// AI session summary generation endpoint
router.post('/generate-session-summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.' 
      });
    }

    const { 
      childName,
      wordsAttempted,
      wordsCompleted,
      averageAccuracy,
      totalScore,
      childAge,
      interests
    } = req.body;

    // Generate AI-powered session summary
    const summary = await generateAISessionSummary(
      childName,
      wordsAttempted,
      wordsCompleted,
      averageAccuracy,
      totalScore,
      childAge,
      interests
    );
    
    if (!summary) {
      return res.status(500).json({ 
        error: 'Unable to generate session summary at this time. Please try again.' 
      });
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error generating session summary:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again in a moment.' 
    });
  }
});

// AI pronunciation validation endpoint - Uses phonetic analysis
router.post('/validate-pronunciation', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.' 
      });
    }

    const { targetWord, spokenWord, confidence } = req.body;

    if (!targetWord || !spokenWord) {
      return res.status(400).json({ 
        error: 'Missing required fields: targetWord and spokenWord' 
      });
    }

    // Use AI to validate pronunciation with phonetic analysis
    const validation = await validatePronunciationWithAI(targetWord, spokenWord, confidence);
    
    if (!validation) {
      return res.status(500).json({ 
        error: 'Unable to validate pronunciation at this time. Please try again.' 
      });
    }
    
    res.json(validation);
  } catch (error) {
    console.error('Error validating pronunciation:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again in a moment.' 
    });
  }
});

// AI Helper Functions
async function generateAIPersonalizedWords(childProfile: any, sessionType: string) {
  const childAge = childProfile?.childBirthYear ? 
    new Date().getFullYear() - childProfile.childBirthYear : 5;
  
  // Analyze child's specific speech challenges from assessment
  const speechChallenges = analyzeSpeechChallenges(childProfile);
  
  const prompt = buildWordGenerationPrompt(childProfile, childAge, speechChallenges, sessionType);

  try {
    console.log('🤖 Calling Groq API for word generation...');
    console.log('📊 Model: openai/gpt-oss-120b');
    console.log('👤 Child Profile:', JSON.stringify(childProfile, null, 2));
    
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a certified speech-language pathologist specializing in pediatric speech therapy. Generate personalized, developmentally appropriate words for children with speech difficulties. Always return valid JSON format. IMPORTANT: Keep responses concise to fit within token limits."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 8000, // Increased from 2000 to handle 15-20 words with details
      response_format: { type: "json_object" }
    });

    console.log('✅ Groq API response received');
    const response = completion.choices[0]?.message?.content;
    console.log('📝 Response content length:', response?.length || 0);
    console.log('🔍 Finish reason:', completion.choices[0]?.finish_reason);
    
    if (completion.choices[0]?.finish_reason === 'length') {
      console.error('⚠️ WARNING: Response was truncated due to token limit!');
      console.error('💡 Consider reducing word count or simplifying word details');
    }
    
    if (response) {
      try {
        const parsedResponse = JSON.parse(response);
        console.log('✅ JSON parsed successfully');
        console.log('📊 Words generated:', parsedResponse.words?.length || 0);
        return parsedResponse.words || [];
      } catch (parseError) {
        console.error('❌ JSON parse failed:', parseError);
        console.error('📄 Raw response (first 500 chars):', response.substring(0, 500));
        console.error('📄 Raw response (last 500 chars):', response.substring(Math.max(0, response.length - 500)));
        throw parseError;
      }
    }
    
    console.log('⚠️ No response content from Groq API');
    return [];
  } catch (error) {
    console.error('❌ Error calling Groq (openai/gpt-oss-120b) for word generation:');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    throw error;
  }
}

async function generateAIEncouragingFeedback(
  childName: string,
  targetWord: string,
  userAttempt: string,
  accuracy: number,
  attemptNumber: number,
  childAge: number,
  interests: string[]
) {
  const prompt = `
Generate encouraging, positive feedback for ${childName || 'the child'}, a ${childAge}-year-old working on pronunciation.

Target word: "${targetWord}"
Child's attempt: "${userAttempt}"
Accuracy: ${accuracy}%
Attempt number: ${attemptNumber}/3
Child's interests: ${interests?.join(', ') || 'general'}

Requirements:
- Always be positive and encouraging
- Use child-friendly language appropriate for age ${childAge}
- If accuracy is high (70%+), celebrate success
- If accuracy is low, focus on effort and provide gentle guidance
- Include the child's name when possible
- Reference their interests if relevant
- Keep technical tips simple and actionable
- Make it feel like a fun game, not a clinical assessment

Return JSON with:
{
  "message": "main encouraging message",
  "encouragement": "additional motivational text",
  "technicalTip": "simple pronunciation guidance if needed",
  "emotionalTone": "excited|encouraging|supportive|proud",
  "nextSteps": "what to try next (optional)"
}`;

  try {
    console.log('🤖 Generating feedback for:', { targetWord, userAttempt, accuracy });
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // ✅ SWITCH TO FASTER MODEL (less tokens)
      messages: [
        {
          role: "system",
          content: "You are a warm, encouraging speech therapist who makes children feel confident and excited about learning. Always maintain a positive, supportive tone. Always return valid JSON format. Keep responses concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_completion_tokens: 600, // ✅ REDUCED from 1500 to save tokens
      response_format: { type: "json_object" }
    });

    console.log('✅ Feedback response received');
    const response = completion.choices[0]?.message?.content;
    console.log('📝 Response length:', response?.length || 0);
    console.log('🔍 Finish reason:', completion.choices[0]?.finish_reason);
    
    if (completion.choices[0]?.finish_reason === 'length') {
      console.error('⚠️ WARNING: Feedback response was truncated!');
    }
    
    if (response) {
      try {
        const parsedFeedback = JSON.parse(response);
        console.log('✅ Feedback JSON parsed successfully');
        return parsedFeedback;
      } catch (parseError) {
        console.error('❌ Feedback JSON parse failed:', parseError);
        console.error('📄 Raw response:', response);
        throw parseError;
      }
    }

    return null;
  } catch (error) {
    // ✅ ENHANCED ERROR HANDLING FOR RATE LIMITS
    console.error('❌ Error calling Groq (llama-3.3-70b-versatile) for feedback generation:');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('rate_limit_exceeded')) {
      console.error('⚠️ RATE LIMIT EXCEEDED - Using fallback feedback');
      // Return fallback feedback instead of throwing
      return {
        message: accuracy >= 70 
          ? 'Great job! Keep practicing!' 
          : 'Nice try! You\'re improving!',
        encouragement: 'You\'re doing amazing work!',
        technicalTip: 'Listen carefully and try again',
        emotionalTone: 'supportive',
        nextSteps: 'Keep going!'
      };
    }
    
    throw error;
  }
}

async function generateAISessionSummary(
  childName: string,
  wordsAttempted: number,
  wordsCompleted: number,
  averageAccuracy: number,
  totalScore: number,
  childAge: number,
  interests: string[]
) {
  const prompt = `
Generate a celebratory session summary for ${childName || 'the child'}, age ${childAge}.

Session Stats:
- Words attempted: ${wordsAttempted}
- Words completed: ${wordsCompleted}
- Average accuracy: ${averageAccuracy}%
- Total score: ${totalScore}
- Child's interests: ${interests?.join(', ') || 'general'}

Create an encouraging, celebration-focused summary that:
- Celebrates effort and progress
- Highlights specific achievements
- Uses child-friendly language
- References their interests when possible
- Encourages continued practice
- Feels rewarding and motivating

Return JSON with:
{
  "title": "celebratory title",
  "message": "main congratulatory message",
  "achievements": ["list of specific things they did well"],
  "encouragement": "motivational message for future sessions",
  "nextGoals": ["simple goals for next time"]
}`;

  try {
    console.log('🎉 Generating session summary...');
    
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a celebration specialist who makes children feel proud of their accomplishments and excited to continue learning. Always return valid JSON format. Keep responses concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_completion_tokens: 2000, // Increased from 800 to prevent truncation
      response_format: { type: "json_object" }
    });

    console.log('✅ Summary response received');
    const response = completion.choices[0]?.message?.content;
    console.log('📝 Response length:', response?.length || 0);
    console.log('🔍 Finish reason:', completion.choices[0]?.finish_reason);
    
    if (completion.choices[0]?.finish_reason === 'length') {
      console.error('⚠️ WARNING: Summary response was truncated!');
    }
    
    if (response) {
      try {
        const parsedSummary = JSON.parse(response);
        console.log('✅ Summary JSON parsed successfully');
        return parsedSummary;
      } catch (parseError) {
        console.error('❌ Summary JSON parse failed:', parseError);
        console.error('📄 Raw response:', response);
        throw parseError;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error calling Groq (openai/gpt-oss-120b) for session summary:');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

function buildWordGenerationPrompt(
  childProfile: any,
  childAge: number,
  speechChallenges: string[],
  sessionType: string
): string {
  return `Generate exactly 15 speech therapy practice words for a ${childAge}-year-old named ${childProfile.childName || 'Child'}.

Child Info:
- Interests: ${childProfile.interests?.join(', ') || 'general'}
- Vocabulary: ${childProfile.vocabularyLevel || 'beginner'}
- Challenges: ${speechChallenges.join(', ') || 'general pronunciation'}

Requirements:
1. Age-appropriate for ${childAge} years
2. Related to: ${childProfile.interests?.join(', ') || 'general topics'}
3. Mix difficulty: 60% easy, 30% medium, 10% hard
4. Include phonetic (IPA) and emoji

Return ONLY valid JSON with this EXACT structure:
{
  "words": [
    {
      "word": "cat",
      "phonetic": "/kæt/",
      "phonemes": ["k", "æ", "t"],
      "difficulty": 1,
      "category": "animals",
      "targetSounds": ["k", "t"],
      "visualCue": "🐱",
      "therapyFocus": "consonants"
    }
  ]
}

Generate ALL 15 words now. Keep responses concise.`;
}

function analyzeSpeechChallenges(childProfile: any): string[] {
  const challenges: string[] = [];
  
  // Analyze assessment responses for speech patterns
  if (childProfile.assessmentResponses?.hearing) {
    const hearingIssues = childProfile.assessmentResponses.hearing
      .filter((response: any) => response.answer === 'yes' || response.answer === 'cant-tell')
      .map((response: any) => response.question.toLowerCase());
    
    if (hearingIssues.length > 0) {
      challenges.push('auditory processing');
    }
  }
  
  if (childProfile.assessmentResponses?.pragmatics) {
    const pragmaticIssues = childProfile.assessmentResponses.pragmatics
      .filter((response: any) => response.answer === 'no' || response.answer === 'cant-tell');
      
    if (pragmaticIssues.length > 2) {
      challenges.push('social communication');
    }
  }
  
  // Analyze vocabulary level
  if (childProfile.vocabularyLevel) {
    if (childProfile.vocabularyLevel.includes('0-words') || childProfile.vocabularyLevel.includes('1-5-words')) {
      challenges.push('vocabulary building', 'basic phoneme production');
    } else if (childProfile.vocabularyLevel.includes('6-10-words')) {
      challenges.push('consonant combinations', 'word endings');
    }
  }
  
  return challenges;
}

// AI-powered pronunciation validation using phonetic analysis
async function validatePronunciationWithAI(
  targetWord: string,
  spokenWord: string,
  confidence: number
): Promise<{
  isCorrect: boolean;
  accuracy: number;
  feedback: string;
  phonemeErrors: string[];
  suggestions: string[];
}> {
  const prompt = `
You are an expert speech-language pathologist specializing in pronunciation analysis. 
Analyze whether a child's pronunciation is EXACTLY correct or contains errors.

Target word: "${targetWord}"
Child said: "${spokenWord}"
Speech recognition confidence: ${confidence}

Your task:
1. Compare the PHONETIC pronunciation of both words
2. Determine if they are THE SAME WORD (exact pronunciation)
3. Identify if the child added extra sounds, syllables, or morphemes
4. Be STRICT: "sun" is NOT the same as "sunny" (added /i/ sound)
5. Be STRICT: "dog" is NOT the same as "doggie" (added /i/ sound)
6. Accept minor phonetic variations that don't change the word (e.g., "ket" for "cat" due to accent)
7. Reject any additions like diminutives, plurals, or different words

Phonetic Analysis Rules:
- "sun" /sʌn/ vs "sunny" /ˈsʌni/ → DIFFERENT (extra syllable)
- "dog" /dɔg/ vs "doggie" /ˈdɔgi/ → DIFFERENT (extra syllable)
- "cat" /kæt/ vs "kat" /kæt/ → SAME (phonetically identical)
- "tree" /tri/ vs "three" /θri/ → DIFFERENT (different phonemes)
- "sun" /sʌn/ vs "son" /sʌn/ → SAME (homophones, same pronunciation)

Return JSON:
{
  "isCorrect": boolean (true only if EXACTLY the same word phonetically),
  "accuracy": number (0-100, how close the pronunciation is),
  "feedback": "Explain why it's correct or incorrect in child-friendly terms",
  "phonemeErrors": ["list specific sound errors"],
  "suggestions": ["simple tips for improvement"]
}

Be STRICT: If the child added extra sounds or syllables, mark as incorrect.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // ✅ SWITCH TO FASTER MODEL (less tokens)
      messages: [
        {
          role: "system",
          content: "You are an expert speech-language pathologist with deep knowledge of phonetics and pronunciation analysis. You use strict criteria to evaluate if pronunciations match exactly. Always return valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Low temperature for consistent, strict analysis
      max_completion_tokens: 800, // ✅ REDUCED from 1500 to save tokens
      response_format: { type: "json_object" }
    });

    console.log('✅ Validation response received');
    const response = completion.choices[0]?.message?.content;
    console.log('📝 Response length:', response?.length || 0);
    console.log('🔍 Finish reason:', completion.choices[0]?.finish_reason);
    
    if (completion.choices[0]?.finish_reason === 'length') {
      console.error('⚠️ WARNING: Validation response was truncated!');
    }
    
    if (response) {
      try {
        const result = JSON.parse(response);
        console.log(`🔍 AI Pronunciation Validation: "${targetWord}" vs "${spokenWord}" → ${result.isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'} (${result.accuracy}%)`);
        return result;
      } catch (parseError) {
        console.error('❌ Validation JSON parse failed:', parseError);
        console.error('📄 Raw response:', response);
        throw parseError;
      }
    }

    // Fallback if no response
    console.log('⚠️ No validation response from API');
    return {
      isCorrect: false,
      accuracy: 0,
      feedback: 'Unable to analyze pronunciation. Please try again.',
      phonemeErrors: [],
      suggestions: []
    };
  } catch (error) {
    // ✅ ENHANCED ERROR HANDLING FOR RATE LIMITS
    console.error('❌ Error calling Groq (llama-3.3-70b-versatile) for pronunciation validation:');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('rate_limit_exceeded')) {
      console.error('⚠️ RATE LIMIT EXCEEDED - Using fallback validation');
      // Return fallback validation instead of throwing
      return {
        isCorrect: false,
        accuracy: 50, // Moderate score for fallback
        feedback: 'Keep practicing! Our AI is resting, but you\'re doing great!',
        phonemeErrors: [],
        suggestions: ['Try again', 'Speak clearly', 'Take your time']
      };
    }
    
    throw error;
  }
}

// ============================================================================
// SAVE PROGRESS, REWARDS, AND SESSION SUMMARIES
// ============================================================================

/**
 * POST /api/games/save-progress
 * Save child's gameplay progress to database
 */
router.post('/save-progress', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionData } = req.body;

    if (!sessionData) {
      return res.status(400).json({ error: 'Session data required' });
    }

    // Import ChildProgress model
    const { ChildProgress } = await import('../models/ChildProgress');

    // Find or create child progress document
    let progress = await ChildProgress.findOne({ userId });

    if (!progress) {
      progress = new ChildProgress({
        userId,
        childName: sessionData.childName || 'Child'
      });
    }

    // Update progress using the model method (if available)
    if (typeof (progress as any).updateAfterSession === 'function') {
      await (progress as any).updateAfterSession(sessionData);
    }

    console.log('💾 Progress saved for user:', userId);

    res.json({
      success: true,
      progress: {
        totalSessions: progress.overallStats?.totalSessions || 0,
        totalScore: progress.overallStats?.totalScore || 0,
        currentLevel: progress.overallStats?.currentLevel || 1,
        consecutiveDays: progress.dailyEngagement?.consecutiveDays || 0
      }
    });

  } catch (error) {
    console.error('❌ Error saving progress:', error);
    res.status(500).json({ 
      error: 'Failed to save progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/games/save-reward
 * Save unlocked reward to database
 */
router.post('/save-reward', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rewardData } = req.body;

    if (!rewardData) {
      return res.status(400).json({ error: 'Reward data required' });
    }

    // Import Reward model
    const { Reward } = await import('../models/Reward');

    // Create new reward document
    const reward = new Reward({
      userId,
      ...rewardData
    });

    await reward.save();

    // Also update ChildProgress collections
    const { ChildProgress } = await import('../models/ChildProgress');
    const progress = await ChildProgress.findOne({ userId });

    if (progress && progress.collections) {
      // Add to appropriate collection
      if (rewardData.rewardType === 'character' && progress.collections.companions) {
        progress.collections.companions.push({
          id: reward._id.toString(),
          name: rewardData.rewardName,
          emoji: rewardData.icon,
          rarity: rewardData.rarity,
          unlockedAt: new Date(),
          timesUsed: 0
        });
      } else if (rewardData.rewardType === 'badge' && progress.collections.badges) {
        progress.collections.badges.push({
          id: reward._id.toString(),
          name: rewardData.rewardName,
          icon: rewardData.icon,
          description: rewardData.description,
          rarity: rewardData.rarity,
          unlockedAt: new Date()
        });
      }

      await progress.save();
    }

    console.log('🎁 Reward saved:', rewardData.rewardName);

    res.json({
      success: true,
      reward: {
        id: reward._id,
        name: rewardData.rewardName,
        rarity: rewardData.rarity
      }
    });

  } catch (error) {
    console.error('❌ Error saving reward:', error);
    res.status(500).json({ 
      error: 'Failed to save reward',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/games/save-session-summary
 * Save complete session summary to database
 */
router.post('/save-session-summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { summaryData } = req.body;

    if (!summaryData) {
      return res.status(400).json({ error: 'Summary data required' });
    }

    // Import SessionSummary model
    const { SessionSummary } = await import('../models/SessionSummary');

    // Create new session summary document
    const summary = new SessionSummary({
      userId,
      ...summaryData
    });

    await summary.save();

    console.log('📊 Session summary saved:', summaryData.sessionId);

    res.json({
      success: true,
      summary: {
        id: summary._id,
        sessionId: summaryData.sessionId,
        score: summaryData.stats.totalScore,
        accuracy: summaryData.stats.accuracy
      }
    });

  } catch (error) {
    console.error('❌ Error saving session summary:', error);
    res.status(500).json({ 
      error: 'Failed to save session summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/games/child-progress
 * Get complete child progress data
 */
router.get('/child-progress', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ChildProgress } = await import('../models/ChildProgress');
    const progress = await ChildProgress.findOne({ userId });

    if (!progress) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      progress: progress.toObject()
    });

  } catch (error) {
    console.error('❌ Error fetching child progress:', error);
    res.status(500).json({ 
      error: 'Failed to fetch progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/games/rewards-collection
 * Get all unlocked rewards for the child
 */
router.get('/rewards-collection', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { Reward } = await import('../models/Reward');
    const rewards = await Reward.find({ userId }).sort({ unlockedAt: -1 });

    res.json({
      rewards,
      count: rewards.length
    });

  } catch (error) {
    console.error('❌ Error fetching rewards:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rewards',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/games/session-history
 * Get session history for the child
 */
router.get('/session-history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 10 } = req.query;

    const { SessionSummary } = await import('../models/SessionSummary');
    const sessions = await SessionSummary
      .find({ userId })
      .sort({ completedAt: -1 })
      .limit(Number(limit));

    res.json({
      sessions,
      count: sessions.length
    });

  } catch (error) {
    console.error('❌ Error fetching session history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 🏆 DAILY QUEST ROUTES
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/games/daily-quest
 * Get or create today's daily quest for the user
 */
router.get('/daily-quest', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🏆 Fetching daily quest for user:', userId);

    const DailyQuest = (await import('../models/DailyQuest')).default;
    const { generateDailyQuest, getQuestThemeForDate } = await import('../services/dailyQuestService');

    // Check if force refresh is requested (for testing/debugging)
    const forceRefresh = req.query.refresh === 'true';
    
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - deleting old quest');
      await DailyQuest.deleteMany({ 
        userId,
        questDate: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      });
    }

    // Try to get today's quest
    let todayQuest = await DailyQuest.getTodayQuest(userId);

    // If no quest exists, create one
    if (!todayQuest) {
      console.log('📝 Creating new daily quest for user:', userId);
      
      // Optional: Get child profile for difficulty adjustment
      let childProfile = null;
      try {
        const ChildProgress = (await import('../models/ChildProgress')).ChildProgress;
        const progress = await ChildProgress.findOne({ userId });
        if (progress) {
          childProfile = {
            level: progress.overallStats?.currentLevel || 1
          };
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch child profile for difficulty adjustment');
      }

      // Generate quest data
      const questData = generateDailyQuest(userId, childProfile);
      
      // Create in database
      todayQuest = await DailyQuest.create(questData);
      console.log('✅ Daily quest created:', {
        theme: todayQuest.theme,
        emoji: todayQuest.emoji,
        targetScore: todayQuest.targetScore,
        difficulty: todayQuest.difficulty
      });
    } else {
      console.log('✅ Found existing daily quest:', {
        theme: todayQuest.theme,
        emoji: todayQuest.emoji,
        cached: true,
        questDate: todayQuest.questDate
      });
    }

    // Get current streak
    const streak = await DailyQuest.getStreak(userId);

    res.json({
      quest: todayQuest,
      streak,
      hasQuest: true
    });

  } catch (error) {
    console.error('❌ Error fetching daily quest:', error);
    res.status(500).json({ 
      error: 'Failed to fetch daily quest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/games/daily-quest/complete
 * Mark daily quest as completed
 */
router.post('/daily-quest/complete', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId, score, accuracy } = req.body;

    if (!sessionId || score === undefined || accuracy === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, score, accuracy' 
      });
    }

    console.log('🏆 Completing daily quest for user:', userId, { sessionId, score, accuracy });

    const DailyQuest = (await import('../models/DailyQuest')).default;
    const { calculateStreakBonus } = await import('../services/dailyQuestService');

    // Get today's quest
    const todayQuest = await DailyQuest.getTodayQuest(userId);

    if (!todayQuest) {
      return res.status(404).json({ error: 'No daily quest found for today' });
    }

    if (todayQuest.isCompleted) {
      return res.status(400).json({ 
        error: 'Quest already completed today',
        quest: todayQuest
      });
    }

    // Check if requirements met
    const meetsRequirements = todayQuest.checkCompletion(score, accuracy);

    if (!meetsRequirements) {
      return res.status(400).json({ 
        error: 'Quest requirements not met',
        required: {
          score: todayQuest.targetScore,
          accuracy: todayQuest.targetAccuracy
        },
        achieved: {
          score,
          accuracy
        }
      });
    }

    // Get current streak before completion
    const currentStreak = await DailyQuest.getStreak(userId);
    const newStreak = currentStreak + 1;
    const streakBonus = calculateStreakBonus(newStreak);

    // Complete the quest
    await todayQuest.complete(sessionId, score, accuracy, streakBonus);

    console.log('✅ Daily quest completed! Streak:', newStreak, 'Bonus:', streakBonus);

    // Save bonus reward to rewards collection
    try {
      const Reward = (await import('../models/Reward')).Reward;
      await Reward.create({
        userId,
        sessionId,
        rewardType: todayQuest.bonusReward.type,
        rewardName: todayQuest.bonusReward.name,
        rarity: todayQuest.bonusReward.rarity,
        icon: todayQuest.bonusReward.icon,
        description: todayQuest.bonusReward.description,
        achievement: `Daily Quest Completed: ${todayQuest.theme}`,
        gameMode: 'daily_quest',
        metadata: {
          questTheme: todayQuest.theme,
          score,
          accuracy,
          streak: newStreak,
          streakBonus
        }
      });
      console.log('✅ Bonus reward saved to database');
    } catch (err) {
      console.error('⚠️ Error saving bonus reward:', err);
    }

    res.json({
      success: true,
      quest: todayQuest,
      newStreak,
      streakBonus,
      bonusReward: todayQuest.bonusReward
    });

  } catch (error) {
    console.error('❌ Error completing daily quest:', error);
    res.status(500).json({ 
      error: 'Failed to complete daily quest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/games/daily-quest/streak
 * Get user's current daily quest streak
 */
router.get('/daily-quest/streak', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const DailyQuest = (await import('../models/DailyQuest')).default;
    const { calculateStreakBonus } = await import('../services/dailyQuestService');

    const streak = await DailyQuest.getStreak(userId);
    const bonusPoints = calculateStreakBonus(streak);

    // Get total completed quests
    const totalCompleted = await DailyQuest.countDocuments({ 
      userId, 
      isCompleted: true 
    });

    res.json({
      streak,
      bonusPoints,
      totalCompleted
    });

  } catch (error) {
    console.error('❌ Error fetching streak:', error);
    res.status(500).json({ 
      error: 'Failed to fetch streak',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/games/daily-quest/history
 * Get user's daily quest completion history
 */
router.get('/daily-quest/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 30 } = req.query;

    const DailyQuest = (await import('../models/DailyQuest')).default;
    
    const history = await DailyQuest
      .find({ userId })
      .sort({ questDate: -1 })
      .limit(Number(limit));

    const completedCount = await DailyQuest.countDocuments({ 
      userId, 
      isCompleted: true 
    });

    const totalCount = await DailyQuest.countDocuments({ userId });

    res.json({
      history,
      stats: {
        completed: completedCount,
        total: totalCount,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching quest history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quest history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

