import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { mongoStorage } from "./mongoStorage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as speechServiceModule from "./services/speechService";
const { SpeechService } = speechServiceModule;
import { analyzeEmotion } from "./services/openai";
import { AuthService } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // For local development
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: 'local-user-123',
          email: 'developer@local.dev',
          firstName: 'Local',
          lastName: 'Developer',
          profileImageUrl: 'https://via.placeholder.com/150',
          userType: 'adult', // Can be 'adult', 'child', or 'guardian'
          language: 'english',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Try to get from database first, if that fails use mock user
        try {
          const userId = req.user?.claims?.sub || req.user?.id;
          if (userId) {
            const user = await mongoStorage.getUser(userId);
            if (user) {
              return res.json(user);
            }
          }
          
          console.log('Using mock user for development');
          return res.json(mockUser);
        } catch (error) {
          console.log('Database not available, returning mock user');
          return res.json(mockUser);
        }
      }
      
      // Production flow
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User ID not found in session" });
        }
        
        const user = await mongoStorage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found in database" });
        }
        
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    } catch (error) {
      console.error("Error in auth route:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Development-only login and signup endpoints
  if (process.env.NODE_ENV === 'development') {
    // Real login endpoint
    app.post('/api/dev/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }
        
        // Authenticate user
        const user = await AuthService.login({ email, password });
        
        // Set user in session
        if (req.session) {
          (req.session as any).user = {
            id: user.id,
            claims: { sub: user.id }
          };
          console.log('User logged in via session:', user.id, user.userType);
        }
        
        res.json({ success: true, user });
      } catch (error: any) {
        console.error("Login error:", error.message);
        res.status(401).json({ message: error.message });
      }
    });
    
    // Real signup endpoint
    app.post('/api/dev/signup', async (req, res) => {
      try {
        const { firstName, lastName, email, password, userType, language } = req.body;
        
        if (!firstName || !lastName || !email || !password || !userType || !language) {
          return res.status(400).json({ message: "All fields are required" });
        }
        
        // Create new user
        const user = await AuthService.signup({
          firstName,
          lastName,
          email,
          password,
          userType,
          language
        });
        
        // Set user in session
        if (req.session) {
          (req.session as any).user = {
            id: user.id,
            claims: { sub: user.id }
          };
        }
        
        res.json({ success: true, user });
      } catch (error: any) {
        console.error("Signup error:", error.message);
        res.status(400).json({ message: error.message });
      }
    });
    
    // Session check endpoint for debugging
    app.get('/api/dev/session', (req, res) => {
      res.json({
        session: req.session,
        user: req.user,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
      });
    });
  }

  // Speech therapy routes
  app.post('/api/speech/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionType } = req.body;
      
      const session = await mongoStorage.createSpeechSession({ userId, sessionType });
      res.json(session);
    } catch (error) {
      console.error("Error creating speech session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.post('/api/speech/record', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, word, phonetic, userTranscription, language, userAudio } = req.body;
      
      const result = await SpeechService.recordSpeechAttempt(
        sessionId,
        word,
        phonetic || '',
        userTranscription,
        language,
        userAudio
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error recording speech attempt:", error);
      res.status(500).json({ message: "Failed to record speech attempt" });
    }
  });

  app.post('/api/speech/assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { assessmentResults } = req.body;
      
      const result = await SpeechService.conductAssessment(userId, assessmentResults);
      res.json(result);
    } catch (error) {
      console.error("Error conducting assessment:", error);
      res.status(500).json({ message: "Failed to conduct assessment" });
    }
  });

  app.get('/api/speech/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await SpeechService.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Emotional support routes
  app.post('/api/chat/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await mongoStorage.createEmotionalSession({ 
        userId, 
        sessionType: 'chat' 
      });
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.post('/api/chat/message', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, message, voiceTone } = req.body;
      
      // Analyze emotion and generate AI response
      const emotionAnalysis = await analyzeEmotion(message, voiceTone);
      
      // Save user message
      await mongoStorage.addMessageToEmotionalSession(sessionId, {
        role: 'user',
        content: message
      });
      
      // Save AI response
      await mongoStorage.addMessageToEmotionalSession(sessionId, {
        role: 'assistant',
        content: emotionAnalysis.response
      });
      
      res.json({
        response: emotionAnalysis.response,
        emotion: emotionAnalysis.emotion,
        confidence: emotionAnalysis.confidence,
      });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.get('/api/chat/messages/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const session = await mongoStorage.getEmotionalSessions(req.user.claims.sub, 1);
      const messages = session.length > 0 ? session[0].messages : [];
      res.json(messages); // Return in chronological order
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Guardian dashboard routes (TODO: Implement with MongoDB)
  app.get('/api/guardian/children', isAuthenticated, async (req: any, res) => {
    try {
      // const guardianId = req.user.claims.sub;
      // const children = await mongoStorage.getGuardianChildren(guardianId);
      res.json([]); // Temporary: return empty array
    } catch (error) {
      console.error("Error fetching guardian children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post('/api/guardian/add-child', isAuthenticated, async (req: any, res) => {
    try {
      // const guardianId = req.user.claims.sub;
      // const { childId, relationship } = req.body;
      // const guardianship = await mongoStorage.createGuardianship(guardianId, childId, relationship);
      res.json({ message: "Guardian functionality coming soon" }); // Temporary
    } catch (error) {
      console.error("Error adding child:", error);
      res.status(500).json({ message: "Failed to add child" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'speech_practice') {
          // Handle real-time speech practice feedback
          ws.send(JSON.stringify({
            type: 'speech_feedback',
            data: { status: 'processing' }
          }));
        } else if (message.type === 'chat_message') {
          // Handle real-time chat
          const emotionAnalysis = await analyzeEmotion(message.content);
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ai_response',
              data: {
                response: emotionAnalysis.response,
                emotion: emotionAnalysis.emotion,
                supportType: emotionAnalysis.supportType
              }
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Failed to process message' }
          }));
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
