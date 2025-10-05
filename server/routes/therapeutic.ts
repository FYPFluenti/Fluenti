/**
 * Therapeutic Session API Route
 * 
 * Handles saving therapeutic game session data and updating user progress
 */

import { Request, Response } from 'express';

export interface TherapeuticSessionData {
  userId: string;
  gameId: number;
  sessionData: {
    gameId: number;
    startTime: Date;
    endTime?: Date;
    currentLevel: number;
    score: number;
    wordsCompleted: string[];
    accuracy: number;
    responses?: any[];
    therapeutic_data?: any;
    completed?: boolean;
  };
}

/**
 * Save a therapeutic session
 * POST /api/therapeutic/session
 */
export async function saveTherapeuticSession(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { userId, gameId, sessionData }: TherapeuticSessionData = req.body;

    if (!userId || !gameId || !sessionData) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, gameId, sessionData' 
      });
    }

    // Save therapeutic session data to database
    const session = await saveSessionToDatabase({
      userId,
      ...sessionData,
      timestamp: new Date(),
      evidenceLevel: 'clinical-grade'
    });

    // Update user progress
    if (sessionData.therapeutic_data) {
      await updateUserTherapeuticProgress(userId, sessionData.therapeutic_data);
    }

    return res.status(200).json({ 
      success: true, 
      sessionId: session.id,
      message: 'Session saved successfully'
    });
  } catch (error) {
    console.error('Therapeutic session save error:', error);
    return res.status(500).json({ 
      error: 'Failed to save session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Save session data to database
 * This should integrate with your existing database structure (MongoDB, PostgreSQL, etc.)
 */
async function saveSessionToDatabase(sessionData: any) {
  // TODO: Implement actual database save logic
  // Example using MongoDB:
  /*
  const db = await connectToDatabase();
  const result = await db.collection('therapeutic_sessions').insertOne({
    ...sessionData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: result.insertedId.toString() };
  */
  
  // Placeholder implementation
  console.log('Saving session to database:', {
    userId: sessionData.userId,
    gameId: sessionData.gameId,
    accuracy: sessionData.accuracy,
    timestamp: sessionData.timestamp
  });
  
  return { 
    id: `session_${Date.now()}`,
    ...sessionData
  };
}

/**
 * Update user's therapeutic progress metrics
 * Updates phonological_awareness, social_communication, articulation_score, etc.
 */
async function updateUserTherapeuticProgress(userId: string, therapeuticData: any) {
  // TODO: Implement actual database update logic
  // Example using MongoDB:
  /*
  const db = await connectToDatabase();
  
  const updateFields: any = {};
  
  if (therapeuticData.phonemeAwareness !== undefined) {
    updateFields.phonological_awareness = therapeuticData.phonemeAwareness;
  }
  
  if (therapeuticData.socialAccuracy !== undefined) {
    updateFields.social_communication = therapeuticData.socialAccuracy;
  }
  
  if (therapeuticData.articulationScore !== undefined) {
    updateFields.articulation_score = therapeuticData.articulationScore;
  }
  
  await db.collection('users').updateOne(
    { _id: userId },
    { 
      $set: updateFields,
      $inc: { sessions_completed: 1 },
      $currentDate: { lastSession: true }
    }
  );
  */
  
  // Placeholder implementation
  console.log('Updating user progress:', {
    userId,
    therapeuticData
  });
  
  return { success: true };
}

/**
 * Get user's therapeutic progress
 * GET /api/therapeutic/progress/:userId
 */
export async function getUserTherapeuticProgress(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // TODO: Implement actual database query
    // Example placeholder data
    const progress = {
      userId,
      articulation_score: 75,
      phonological_awareness: 68,
      language_comprehension: 82,
      social_communication: 70,
      sessions_completed: 15,
      level: 5,
      lastSession: new Date(),
      totalPracticeTime: 180
    };

    return res.status(200).json({ 
      success: true, 
      progress 
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get user's session history
 * GET /api/therapeutic/sessions/:userId
 */
export async function getUserSessions(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // TODO: Implement actual database query
    // Example placeholder data
    const sessions: any[] = [];

    return res.status(200).json({ 
      success: true, 
      sessions,
      total: sessions.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default {
  saveTherapeuticSession,
  getUserTherapeuticProgress,
  getUserSessions
};
