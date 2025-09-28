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
import { generateTTSAudio } from "./services/ttsService";
import { fastTranscribeAudio } from "./services/fastSTTService";
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





  // Simple emotional support endpoint without authentication - STT and TTS only
  app.post('/api/emotional-support', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const { mode, language } = req.body;
      let text = req.body.text;

      console.log('Processing request - Mode:', mode, 'Language:', language);

      // Handle voice mode with audio processing (STT only)
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
            // Try fast STT first (lightweight fallback)
            console.log('Attempting fast STT...');
            text = await fastTranscribeAudio(audioBuffer, whisperLanguage);
            console.log('Fast STT successful:', text?.length, 'characters');
          } catch (fastSTTError) {
            console.warn('Fast STT failed, trying local Whisper:', fastSTTError);
            try {
              text = await transcribeAudio(audioBuffer, whisperLanguage);
              console.log('Local Whisper successful:', text?.length, 'characters');
            } catch (sttError) {
              console.warn('All STT methods failed, using fallback:', sttError);
              text = await simpleTranscribeAudio(audioBuffer, whisperLanguage);
            }
          }
        } catch (audioError) {
          console.warn('Audio processing failed:', audioError);
          text = req.body.text || 'Voice input received but transcription failed';
        }
      }

      // Ensure we have some text to work with
      if (!text || text.trim().length === 0) {
        text = mode === 'voice' ? 'No speech detected' : 'No input provided';
      }

      console.log('Final transcribed text:', text);

      // For voice mode, generate TTS for the transcribed text (echo back what was said)
      let audioBase64: string | undefined;
      const requestTTS = req.body.requestTTS === 'true' || mode === 'voice';
      
      if (requestTTS && text) {
        try {
          console.log('Generating TTS audio for transcribed text...');
          const ttsResult = await generateTTSAudio(text, language === 'ur' ? 'ur' : 'en');
          
          if (ttsResult.error) {
            console.warn('TTS generation failed:', ttsResult.error);
            audioBase64 = undefined;
          } else {
            audioBase64 = ttsResult.audioBase64;
            console.log('TTS audio generated successfully');
          }
        } catch (ttsError) {
          console.warn('TTS error:', ttsError);
          audioBase64 = undefined;
        }
      }

      res.json({ 
        success: true,
        transcription: text, 
        mode: mode || 'text',
        language: language || 'en',
        audioBase64: audioBase64,
        hasTTS: !!audioBase64
      });

    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ 
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

 
  app.post('/api/emotional-support-chat', async (req: Request, res: Response) => {
    try {
      const { message, language } = req.body;
      
      res.json({ 
        success: true,
        received_message: message,
        language: language || 'en',
        echo: `Received: ${message}`
      });
    } catch (error) {
      console.error("chat error:", error);
      res.status(500).json({ error: 'endpoint failed' });
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
