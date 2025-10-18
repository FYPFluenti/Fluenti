import { Router, Request, Response } from 'express';
import { GameProgress } from '../models/GameProgress';
import { GameSession } from '../models/GameSession';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
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
    
    // Initialize progress for all 6 games if not exists
    if (progress.length === 0) {
      const gameNames = [
        'Word Practice',
        'Sound Recognition', 
        'Sentence Building',
        'Rhythm Training',
        'Story Reading',
        'Quick Sounds'
      ];

      const initialProgress = await Promise.all(
        gameNames.map((name, index) =>
          GameProgress.create({
            userId,
            gameId: index + 1,
            gameName: name,
            level: 1,
            stars: 0,
            unlocked: index < 2 // First 2 games unlocked by default
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

      case 2: // Sound Recognition
        gameData = {
          gameId: 2,
          gameName: 'Sound Recognition',
          currentLevel: userLevel,
          description: 'Interactive sound recognition and phoneme practice',
          isAIPowered: false // Will be enhanced later
        };
        break;

      case 3: // Sentence Building
        gameData = {
          gameId: 3,
          gameName: 'Sentence Building',
          currentLevel: userLevel,
          description: 'Build sentences with guided practice',
          isAIPowered: false // Will be enhanced later
        };
        break;

      case 4: // Rhythm Training
        gameData = {
          gameId: 4,
          gameName: 'Rhythm Training',
          currentLevel: userLevel,
          description: 'Practice speech rhythm and timing',
          isAIPowered: false // Will be enhanced later
        };
        break;

      case 5: // Story Reading
        gameData = {
          gameId: 5,
          gameName: 'Story Reading',
          currentLevel: userLevel,
          description: 'Interactive story reading with speech practice',
          isAIPowered: false // Will be enhanced later
        };
        break;

      case 6: // Quick Sounds
        gameData = {
          gameId: 6,
          gameName: 'Quick Sounds',
          currentLevel: userLevel,
          description: 'Fast-paced sound recognition game',
          isAIPowered: false // Will be enhanced later
        };
        break;

      case 7: // Phonological Awareness
        gameData = {
          gameId: 7,
          gameName: 'Phonological Awareness',
          currentLevel: userLevel,
          description: 'Develop awareness of speech sounds and patterns',
          isAIPowered: false // Will be enhanced later
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.' 
      });
    }

    // Generate AI-powered personalized words
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

    if (!process.env.OPENAI_API_KEY) {
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

    if (!process.env.OPENAI_API_KEY) {
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

    if (!process.env.OPENAI_API_KEY) {
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a certified speech-language pathologist specializing in pediatric speech therapy. Generate personalized, developmentally appropriate words for children with speech difficulties. Always return valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      const parsedResponse = JSON.parse(response);
      return parsedResponse.words || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error calling OpenAI for word generation:', error);
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a warm, encouraging speech therapist who makes children feel confident and excited about learning. Always maintain a positive, supportive tone. Always return valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      return JSON.parse(response);
    }

    return null;
  } catch (error) {
    console.error('Error calling OpenAI for feedback generation:', error);
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a celebration specialist who makes children feel proud of their accomplishments and excited to continue learning. Always return valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      return JSON.parse(response);
    }

    return null;
  } catch (error) {
    console.error('Error calling OpenAI for session summary:', error);
    throw error;
  }
}

function buildWordGenerationPrompt(
  childProfile: any,
  childAge: number,
  speechChallenges: string[],
  sessionType: string
): string {
  return `
Generate 15-20 personalized practice words for speech therapy.

Child Profile:
- Name: ${childProfile.childName || 'Child'}
- Age: ${childAge} years old
- Gender: ${childProfile.childGender || 'not specified'}
- Vocabulary Level: ${childProfile.vocabularyLevel || 'unknown'}
- Interests: ${childProfile.interests?.join(', ') || 'general interests'}
- Speech Therapy Status: ${childProfile.seekingSpeechTherapy ? 'Currently seeking therapy' : 'Not currently in therapy'}
- Previously Evaluated: ${childProfile.hasBeenEvaluated ? 'Yes' : 'No'}

Identified Speech Challenges: ${speechChallenges.join(', ') || 'General pronunciation practice'}

Requirements:
- Words must be age-appropriate for a ${childAge}-year-old
- Include words related to their interests: ${childProfile.interests?.join(', ') || 'general'}
- Focus on identified speech challenges
- Mix difficulty levels (60% easy, 30% medium, 10% challenging)
- Include phonetic transcriptions (IPA)
- Specify target sounds being practiced
- Add visual cues or emojis where helpful
- Each word should have a clear therapeutic purpose

Return JSON format:
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
      "therapyFocus": "final consonant practice"
    }
  ]
}`;
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      const result = JSON.parse(response);
      console.log(`🔍 AI Pronunciation Validation: "${targetWord}" vs "${spokenWord}" → ${result.isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'} (${result.accuracy}%)`);
      return result;
    }

    // Fallback if no response
    return {
      isCorrect: false,
      accuracy: 0,
      feedback: 'Unable to analyze pronunciation. Please try again.',
      phonemeErrors: [],
      suggestions: []
    };
  } catch (error) {
    console.error('Error calling OpenAI for pronunciation validation:', error);
    throw error;
  }
}

export default router;
