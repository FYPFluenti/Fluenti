import { Router, Request, Response } from 'express';
import { GameProgress } from '../models/GameProgress';
import { GameSession } from '../models/GameSession';
import { 
  wordPracticeData, 
  soundRecognitionData, 
  sentenceBuildingData,
  rhythmPatternsData,
  storyReadingData,
  quickSoundsData
} from '../data/speechTherapyData';

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
          levels: wordPracticeData,
          words: userLevel === 1 ? wordPracticeData.level1.words :
                 userLevel === 2 ? wordPracticeData.level2.words :
                 wordPracticeData.level3.words
        };
        break;

      case 2: // Sound Recognition
        gameData = {
          gameId: 2,
          gameName: 'Sound Recognition',
          phonemes: soundRecognitionData.phonemes,
          vowels: soundRecognitionData.vowels,
          totalSounds: soundRecognitionData.phonemes.length + soundRecognitionData.vowels.length
        };
        break;

      case 3: // Sentence Building
        gameData = {
          gameId: 3,
          gameName: 'Sentence Building',
          currentLevel: userLevel,
          templates: userLevel === 1 ? sentenceBuildingData.level1.templates :
                     sentenceBuildingData.level2.templates
        };
        break;

      case 4: // Rhythm Training
        gameData = {
          gameId: 4,
          gameName: 'Rhythm Training',
          currentLevel: userLevel,
          patterns: userLevel === 1 ? rhythmPatternsData.basic :
                   userLevel === 2 ? rhythmPatternsData.intermediate :
                   rhythmPatternsData.advanced
        };
        break;

      case 5: // Story Reading
        gameData = {
          gameId: 5,
          gameName: 'Story Reading',
          currentLevel: userLevel,
          story: userLevel === 1 ? storyReadingData.level1 :
                 userLevel === 2 ? storyReadingData.level2 :
                 storyReadingData.level3
        };
        break;

      case 6: // Quick Sounds
        gameData = {
          gameId: 6,
          gameName: 'Quick Sounds',
          currentLevel: userLevel,
          sounds: userLevel === 1 ? quickSoundsData.easy :
                 userLevel === 2 ? quickSoundsData.medium :
                 quickSoundsData.hard
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

export default router;
