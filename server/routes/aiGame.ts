import { Router, Request, Response } from 'express';
import { 
  generateStoryAdventure, 
  generateStoryTransition,
  generateCompanionPersonality 
} from '../services/aiStoryMode';
import { 
  detectEmotionalState, 
  generateEmpatheticResponse,
  quickEmotionalCheck 
} from '../services/aiEmotionalCoach';
import { 
  generateSurpriseReward,
  checkForAchievements,
  getCollectionProgress 
} from '../services/aiRewards';
import {
  analyzeDifficultyAdjustment,
  generateAdaptiveWords
} from '../services/aiAdaptiveDifficulty';
import {
  generateDailyChallenge,
  generateChallengeWords,
  generateConquestWords,
  generateConquestSummary,
  generateStorySummary,
  CHALLENGE_MODES
} from '../services/aiChallenges';

const router = Router();

// ============================================================================
// STORY MODE ENDPOINTS
// ============================================================================

/**
 * POST /api/ai/generate-story
 * Generate a complete story adventure for the child
 */
router.post('/generate-story', async (req: Request, res: Response) => {
  try {
    const { childProfile, wordCount, performanceAnalysis } = req.body;

    if (!childProfile || !childProfile.childName) {
      return res.status(400).json({ 
        error: 'Child profile with childName is required' 
      });
    }

    console.log('📖 Story generation request for:', childProfile.childName);

    const story = await generateStoryAdventure(
      childProfile,
      wordCount || 15,
      performanceAnalysis
    );

    res.json(story);

  } catch (error) {
    console.error('❌ Story generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate story',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/story-transition
 * Generate transition text between story beats
 */
router.post('/story-transition', async (req: Request, res: Response) => {
  try {
    const { currentContext, nextWord, childName, companionCharacter } = req.body;

    if (!currentContext || !nextWord || !childName) {
      return res.status(400).json({ 
        error: 'currentContext, nextWord, and childName are required' 
      });
    }

    const transition = await generateStoryTransition(
      currentContext,
      nextWord,
      childName,
      companionCharacter
    );

    res.send(transition);

  } catch (error) {
    console.error('❌ Story transition error:', error);
    res.status(500).send('Failed to generate transition');
  }
});

/**
 * POST /api/ai/generate-companion
 * Generate companion character based on child's interests
 */
router.post('/generate-companion', async (req: Request, res: Response) => {
  try {
    const { childProfile } = req.body;

    if (!childProfile || !childProfile.childName) {
      return res.status(400).json({ 
        error: 'Child profile with childName is required' 
      });
    }

    const companion = await generateCompanionPersonality(childProfile);
    res.json(companion);

  } catch (error) {
    console.error('❌ Companion generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate companion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// EMOTIONAL INTELLIGENCE ENDPOINTS
// ============================================================================

/**
 * POST /api/ai/detect-emotion
 * Analyze child's emotional state from recent attempts
 */
router.post('/detect-emotion', async (req: Request, res: Response) => {
  try {
    const { attempts, voiceAnalysis } = req.body;

    if (!attempts || !Array.isArray(attempts)) {
      return res.status(400).json({ 
        error: 'Attempts array is required' 
      });
    }

    // Quick check first
    const quickCheck = quickEmotionalCheck(attempts);
    
    if (!quickCheck.needsCheck) {
      console.log('✅ Quick check: No intervention needed -', quickCheck.reason);
      return res.json({
        emotion: 'confident',
        confidence: 0.7,
        triggers: [],
        recommendedAction: 'continue',
        supportMessage: 'Keep up the great work!',
        interventionNeeded: false,
        reasoning: quickCheck.reason
      });
    }

    console.log('⚠️ Quick check triggered full analysis:', quickCheck.reason);

    const emotionalState = await detectEmotionalState(attempts, voiceAnalysis);
    res.json(emotionalState);

  } catch (error) {
    console.error('❌ Emotion detection error:', error);
    res.status(500).json({ 
      error: 'Failed to detect emotional state',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/empathetic-response
 * Generate supportive message based on emotional state
 */
router.post('/empathetic-response', async (req: Request, res: Response) => {
  try {
    const { emotionalState, childName, context, companionCharacter } = req.body;

    if (!emotionalState || !childName) {
      return res.status(400).json({ 
        error: 'emotionalState and childName are required' 
      });
    }

    const message = await generateEmpatheticResponse(
      emotionalState,
      childName,
      context || {},
      companionCharacter
    );

    res.send(message);

  } catch (error) {
    console.error('❌ Empathetic response error:', error);
    res.status(500).send('Failed to generate response');
  }
});

// ============================================================================
// REWARDS ENDPOINTS
// ============================================================================

/**
 * POST /api/ai/generate-reward
 * Generate surprise reward for achievements
 */
router.post('/generate-reward', async (req: Request, res: Response) => {
  try {
    const { achievement, childProfile, performanceData } = req.body;

    if (!achievement || !childProfile) {
      return res.status(400).json({ 
        error: 'achievement and childProfile are required' 
      });
    }

    console.log('🎁 Generating reward for achievement:', achievement);

    const reward = await generateSurpriseReward(
      achievement,
      childProfile,
      performanceData || {}
    );

    res.json(reward);

  } catch (error) {
    console.error('❌ Reward generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate reward',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/check-achievements
 * Check if any achievements should be unlocked
 */
router.post('/check-achievements', async (req: Request, res: Response) => {
  try {
    const { attempts, sessionData } = req.body;

    if (!attempts || !sessionData) {
      return res.status(400).json({ 
        error: 'attempts and sessionData are required' 
      });
    }

    const achievements = checkForAchievements(attempts, sessionData);
    
    res.json({
      achievements,
      count: achievements.length,
      hasNewAchievements: achievements.length > 0
    });

  } catch (error) {
    console.error('❌ Achievement check error:', error);
    res.status(500).json({ 
      error: 'Failed to check achievements',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/collection-progress/:type
 * Get collection progress for a reward type
 */
router.get('/collection-progress/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { unlockedRewards } = req.query;

    if (!['character', 'badge', 'theme', 'game_mode'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be: character, badge, theme, or game_mode' 
      });
    }

    const unlocked = unlockedRewards 
      ? (typeof unlockedRewards === 'string' ? unlockedRewards.split(',') : [])
      : [];

    const progress = getCollectionProgress(
      unlocked,
      type as 'character' | 'badge' | 'theme' | 'game_mode'
    );

    res.json(progress);

  } catch (error) {
    console.error('❌ Collection progress error:', error);
    res.status(500).json({ 
      error: 'Failed to get collection progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ADAPTIVE DIFFICULTY ENDPOINTS
// ============================================================================

/**
 * POST /api/ai/analyze-difficulty
 * Analyze performance and recommend difficulty adjustment
 */
router.post('/analyze-difficulty', async (req: Request, res: Response) => {
  try {
    const { performanceMetrics, currentDifficulty, childAge } = req.body;

    if (!performanceMetrics) {
      return res.status(400).json({ error: 'performanceMetrics required' });
    }

    const adjustment = await analyzeDifficultyAdjustment(
      performanceMetrics,
      currentDifficulty || 5,
      childAge || 5
    );

    res.json(adjustment);

  } catch (error) {
    console.error('❌ Difficulty analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze difficulty',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/generate-adaptive-words
 * Generate words at specific difficulty level
 */
router.post('/generate-adaptive-words', async (req: Request, res: Response) => {
  try {
    const { difficulty, count, childProfile, theme } = req.body;

    const words = await generateAdaptiveWords(
      difficulty || 5,
      count || 10,
      childProfile || {},
      theme
    );

    res.json({ words });

  } catch (error) {
    console.error('❌ Adaptive word generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate adaptive words',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CHALLENGE MODES ENDPOINTS
// ============================================================================

/**
 * GET /api/ai/challenge-modes
 * Get all available challenge modes
 */
router.get('/challenge-modes', async (req: Request, res: Response) => {
  try {
    res.json({ modes: CHALLENGE_MODES });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get challenge modes' });
  }
});

/**
 * POST /api/ai/daily-challenge
 * Generate daily personalized challenge
 */
router.post('/daily-challenge', async (req: Request, res: Response) => {
  try {
    const { childProfile } = req.body;

    const challenge = await generateDailyChallenge(childProfile || {});
    res.json(challenge);

  } catch (error) {
    console.error('❌ Daily challenge error:', error);
    res.status(500).json({ 
      error: 'Failed to generate daily challenge',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/challenge-words
 * Generate words for specific challenge mode
 */
router.post('/challenge-words', async (req: Request, res: Response) => {
  try {
    const { mode, count, childProfile } = req.body;

    if (!mode) {
      return res.status(400).json({ error: 'mode is required' });
    }

    const words = await generateChallengeWords(
      mode,
      count || 10,
      childProfile || {}
    );

    res.json({ words });

  } catch (error) {
    console.error('❌ Challenge words error:', error);
    res.status(500).json({ 
      error: 'Failed to generate challenge words',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/conquest-words
 * Generate themed words for Daily Quest (Conquest Mode)
 */
router.post('/conquest-words', async (req: Request, res: Response) => {
  try {
    const { theme, emoji, difficulty, count, childProfile } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'theme is required' });
    }

    console.log('🏆 Generating conquest words:', { theme, emoji, difficulty, count });

    // Generate themed words using AI
    const words = await generateConquestWords(
      theme,
      emoji || '🏆',
      difficulty || 'medium',
      count || 12,
      childProfile || {}
    );

    res.json({ words });

  } catch (error) {
    console.error('❌ Conquest words error:', error);
    res.status(500).json({ 
      error: 'Failed to generate conquest words',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/conquest-summary
 * Generate personalized session summary for Daily Quest (Conquest Mode)
 */
router.post('/conquest-summary', async (req: Request, res: Response) => {
  try {
    const { 
      childName, 
      childAge, 
      theme, 
      emoji, 
      targetScore, 
      actualScore, 
      targetAccuracy, 
      actualAccuracy,
      wordsCompleted,
      totalWords,
      maxStreak,
      questCompleted,
      accuracyMet,
      interests
    } = req.body;

    if (!childName || !theme) {
      return res.status(400).json({ error: 'childName and theme are required' });
    }

    console.log('🏆 Generating conquest summary:', { childName, theme, questCompleted, actualScore, targetScore });

    const summary = await generateConquestSummary(
      childName,
      childAge || 5,
      theme,
      emoji || '🏆',
      targetScore,
      actualScore,
      targetAccuracy,
      actualAccuracy,
      wordsCompleted,
      totalWords,
      maxStreak,
      questCompleted,
      accuracyMet,
      interests || []
    );

    res.json(summary);

  } catch (error) {
    console.error('❌ Conquest summary error:', error);
    res.status(500).json({ 
      error: 'Failed to generate conquest summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/story-summary
 * Generate personalized session summary for Story Adventure Mode
 */
router.post('/story-summary', async (req: Request, res: Response) => {
  try {
    const {
      childName,
      childAge,
      storyTheme,
      storyTitle,
      totalWords,
      wordsCompleted,
      actualAccuracy,
      actualScore,
      maxStreak,
      interests
    } = req.body;

    if (!childName || !storyTitle) {
      return res.status(400).json({ error: 'childName and storyTitle are required' });
    }

    console.log('📖 Generating story summary:', { childName, storyTitle, wordsCompleted, totalWords });

    const summary = await generateStorySummary(
      childName,
      childAge || 5,
      storyTheme || 'Magical Adventure',
      storyTitle,
      totalWords,
      wordsCompleted,
      actualAccuracy,
      actualScore,
      maxStreak,
      interests || []
    );

    res.json(summary);

  } catch (error) {
    console.error('❌ Story summary error:', error);
    res.status(500).json({
      error: 'Failed to generate story summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/ai/health
 * Check if AI services are operational
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return res.status(503).json({
        status: 'unhealthy',
        error: 'GROQ_API_KEY not configured'
      });
    }

    res.json({
      status: 'healthy',
      services: {
        storyMode: 'operational',
        emotionalIntelligence: 'operational',
        rewards: 'operational',
        adaptiveDifficulty: 'operational',
        challengeModes: 'operational'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
