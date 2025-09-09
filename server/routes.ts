import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { mongoStorage } from "./mongoStorage";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { extractTokenFromHeader, tokenBasedAuth } from "./middleware";
import * as speechServiceModule from "./services/speechService";
const { SpeechService, transcribeAudio } = speechServiceModule;
import { simpleTranscribeAudio, validateAudioBuffer } from "./services/simpleSpeechService";
import { AuthService } from "./auth";


// Configure multer for handling form data
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Extend Express Request type to include session and user properties
interface AuthenticatedRequest extends Request {
  session?: any;
  user?: {
    id: string;
    claims: { sub: string };
    email?: string;
    firstName?: string;
    lastName?: string;
    userType?: string;
  };
  isAuthenticated?: () => boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Add token extraction middleware for all routes
  app.use(extractTokenFromHeader);

  // MongoDB health check endpoint
  app.get('/api/health/mongodb', async (req: Request, res: Response) => {
    try {
      const status = await mongoStorage.getConnectionStatus();
      res.json({
        status: status.connected ? 'connected' : 'disconnected',
        details: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
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
  
  // Authentication endpoints (available in all environments)
  if (mongoStorage) {
    // User login endpoint
    app.post('/api/auth/login', async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }
        
        // Authenticate user
        const user = await AuthService.login({ email, password });
        
        // Set user in session
        if (req.session) {
          req.session.user = {
            id: user.id,
            claims: { sub: user.id }
          };
          console.log('User logged in via session:', user.id, user.userType);
        }
        
        // Return user with auth token (user ID can serve as token)
        res.json({ success: true, user, authToken: user.id });
      } catch (error: any) {
        console.error("Login error:", error.message);
        res.status(401).json({ message: error.message });
      }
    });
    
    // User signup endpoint
    app.post('/api/auth/signup', async (req: AuthenticatedRequest, res: Response) => {
      try {
        console.log('Signup request received:', req.body);
        const { firstName, lastName, email, password, userType, language } = req.body;
        
        if (!firstName || !lastName || !email || !password || !userType || !language) {
          console.log('Missing required fields');
          return res.status(400).json({ success: false, message: "All fields are required" });
        }
        
        // Create new user
        console.log('Creating user with AuthService...');
        const user = await AuthService.signup({
          firstName,
          lastName,
          email,
          password,
          userType,
          language
        });
        
        console.log('User created successfully:', user.id, user.userType);
        
        // Set user in session
        if (req.session) {
          req.session.user = {
            id: user.id,
            claims: { sub: user.id }
          };
          console.log('Session set for user:', user.id);
        }
        
        console.log('Sending success response');
        // Return user with auth token (user ID can serve as token)
        res.json({ success: true, user, authToken: user.id });
      } catch (error: any) {
        console.error("Signup error:", error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });
    
    // Session information endpoint
    app.get('/api/auth/session', (req: AuthenticatedRequest, res: Response) => {
      res.json({
        session: req.session,
        user: req.user,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
      });
    });
    
    // Logout endpoint
    app.get('/api/logout', (req: AuthenticatedRequest, res: Response) => {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error('Session destruction error:', err);
          }
        });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }

  // Speech therapy routes
  app.post('/api/speech/session', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { sessionType } = req.body;
      
      const session = await mongoStorage.createSpeechSession({ userId, sessionType });
      res.json(session);
    } catch (error) {
      console.error("Error creating speech session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.post('/api/speech/record', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
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

  app.post('/api/speech/assessment', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { assessmentResults } = req.body;
      
      const result = await SpeechService.conductAssessment(userId, assessmentResults);
      res.json(result);
    } catch (error) {
      console.error("Error conducting assessment:", error);
      res.status(500).json({ message: "Failed to conduct assessment" });
    }
  });

  app.get('/api/speech/progress', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const progress = await SpeechService.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Emotional support routes
  app.post('/api/chat/session', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
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

  app.post('/api/chat/message', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, message } = req.body;
      
      // Save user message
      await mongoStorage.addMessageToEmotionalSession(sessionId, {
        role: 'user',
        content: message
      });
      
      // Simple response without emotion analysis
      const simpleResponse = 'I understand you might be going through something difficult. Would you like to talk about it?';
      
      // Save AI response
      await mongoStorage.addMessageToEmotionalSession(sessionId, {
        role: 'assistant',
        content: simpleResponse
      });
      
      res.json({
        response: simpleResponse,
        status: 'success'
      });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.get('/api/chat/messages/:sessionId', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const session = await mongoStorage.getEmotionalSessions(userId, 1);
      const messages = session.length > 0 ? session[0].messages : [];
      res.json(messages); // Return in chronological order
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // NEW: Superior Therapeutic Chat Endpoint with Advanced Quality Metrics
  // Test endpoint for Urdu text transmission
  app.post('/api/test-urdu', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      console.log('\n=== URDU TEST ENDPOINT ===');
      console.log('Received text:', text);
      console.log('Text length:', text ? text.length : 0);
      console.log('Has Urdu regex test:', text ? /[\u0600-\u06FF\u0750-\u077F]/.test(text) : false);
      console.log('Contains پریشان:', text ? text.includes('پریشان') : false);
      console.log('Contains اداس:', text ? text.includes('اداس') : false);
      console.log('Character codes:', text ? [...text].map(c => c.charCodeAt(0)).slice(0, 10) : []);
      
      res.json({
        received: text,
        length: text ? text.length : 0,
        hasUrdu: text ? /[\u0600-\u06FF\u0750-\u077F]/.test(text) : false,
        keywords: {
          pareshan: text ? text.includes('پریشان') : false,
          udas: text ? text.includes('اداس') : false
        }
      });
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    }
  });

  // Simple emotional support endpoint without authentication
  app.post('/api/emotional-support', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const { mode, language } = req.body;
      let text = req.body.text;

      console.log('Processing emotional support request - Mode:', mode, 'Language:', language);

      // Handle voice mode with basic audio processing
      if (mode === 'voice' && req.file) {
        try {
          console.log('Processing audio file, size:', req.file.size, 'bytes');
          const audioBuffer = req.file.buffer;
          
          // Validate audio buffer first
          if (!validateAudioBuffer(audioBuffer)) {
            throw new Error('Invalid audio file format or size');
          }
          
          const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
          
          try {
            text = await transcribeAudio(audioBuffer, whisperLanguage);
            console.log('Transcription successful:', text?.length, 'characters');
          } catch (sttError) {
            console.warn('Primary STT failed, using fallback:', sttError);
            text = await simpleTranscribeAudio(audioBuffer, whisperLanguage);
          }
        } catch (audioError) {
          console.warn('Audio processing failed:', audioError);
          text = req.body.text || 'Voice input received but transcription failed';
        }
      }

      // Ensure we have some text to work with
      if (!text || text.trim().length === 0) {
        text = mode === 'voice' ? 'I received your voice message' : 'Hello, how are you feeling?';
      }

      console.log('Final processed text:', text);

      // Simple response without emotion detection
      const supportResponse = language === 'ur' 
        ? 'میں یہاں آپ کی بات سننے اور مدد کرنے کے لیے ہوں۔ آپ کیسا محسوس کر رہے ہیں؟'
        : 'Thank you for sharing with me. I\'m here to listen and support you. How can I help you today?';

      res.json({ 
        success: true,
        transcription: text, 
        response: supportResponse,
        mode: mode || 'text',
        language: language || 'en'
      });

    } catch (error) {
      console.error("Error processing emotional support request:", error);
      res.status(500).json({ 
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Guardian dashboard routes (TODO: Implement with MongoDB)
  app.get('/api/guardian/children', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // const guardianId = req.user?.claims?.sub;
      // const children = await mongoStorage.getGuardianChildren(guardianId);
      res.json([]); // Temporary: return empty array
    } catch (error) {
      console.error("Error fetching guardian children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post('/api/guardian/add-child', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // const guardianId = req.user?.claims?.sub;
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

  wss.on('connection', async (ws: WebSocket, req) => {
    console.log('🔗 New WebSocket connection from:', req.headers['user-agent']?.substring(0, 50));
    
    // Handle authentication
    let userId = null;
    let authAttempted = false;
    try {
      // Check query params for token
      const url = new URL(req.url || '', 'http://localhost');
      let token = url.searchParams.get('token');
      
      // Also check for Authorization header
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7); // Remove "Bearer " prefix
        }
      }
      
      if (token && token.length > 0 && token !== 'null' && token !== 'undefined') {
        authAttempted = true;
        console.log('🔑 Attempting WebSocket authentication with token:', token.substring(0, 8) + '...');
        
        // Verify the token (user ID)
        const user = await mongoStorage.getUser(token);
        if (user) {
          userId = user.id;
          console.log(`✅ WebSocket authenticated for user: ${userId}`);
          
          // Attach user to WebSocket object for future reference
          (ws as any).user = user;
        } else {
          console.warn('❌ Invalid WebSocket token, user not found');
          ws.close(1008, 'Authentication failed - user not found');
          return;
        }
      } else {
        console.warn('⚠️ No valid token provided for WebSocket connection');
        // Still allow connection for non-authenticated features but log it
        console.log('🔓 Allowing unauthenticated WebSocket connection');
      }
    } catch (error) {
      console.error('WebSocket authentication error:', error);
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle auth messages
        if (message.type === 'auth') {
          const token = message.data?.token;
          if (token) {
            try {
              const user = await mongoStorage.getUser(token);
              if (user) {
                userId = user.id;
                (ws as any).user = user;
                console.log(`WebSocket authenticated via message for user: ${userId}`);
                
                // Send confirmation
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'auth_success',
                    data: { userId }
                  }));
                }
              }
            } catch (error) {
              console.error('WebSocket auth message error:', error);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'auth_error',
                  data: { message: 'Authentication failed' }
                }));
              }
            }
          }
          return; // Don't process further for auth messages
        }
        else if (message.type === 'speech_practice') {
          // Handle real-time speech practice feedback
          ws.send(JSON.stringify({
            type: 'speech_feedback',
            data: { status: 'processing' }
          }));
        } else if (message.type === 'chat_message') {
          // Handle real-time chat with simple response
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ai_response',
              data: {
                response: 'I\'m here to listen and support you. How are you feeling?',
                emotion: 'neutral',
                supportType: 'general'
              }
            }));
          }
        } else if (message.type === 'emotional-support') {
          // Handle emotional support chat via WebSocket
          try {
            const { text, language, audio } = message;
            let inputText = text;

            // Handle audio if present
            if (audio) {
              try {
                const audioBuffer = Buffer.from(audio, 'base64');
                const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
                inputText = await transcribeAudio(audioBuffer, whisperLanguage);
              } catch (sttError) {
                console.warn('WebSocket STT failed, using text input:', sttError);
                inputText = text || 'Could not transcribe audio';
              }
            }

            if (!inputText?.trim()) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'error',
                  data: { message: 'No input provided' }
                }));
              }
              return;
            }

            // Simple response without emotion detection
            const simpleResponse = language === 'ur' 
              ? 'میں یہاں آپ کی بات سننے اور مدد کرنے کے لیے ہوں۔'
              : 'I\'m here to listen and support you.';

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'emotional-support-response',
                data: {
                  transcription: inputText,
                  response: simpleResponse,
                  emotion: 'neutral',
                  confidence: 0.5
                }
              }));
            }
          } catch (error) {
            console.error('WebSocket emotional support error:', error);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Processing failed' }
              }));
            }
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
