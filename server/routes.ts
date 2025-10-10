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
import { generateSmartTTS } from "./services/enhancedTTSService";

// Future service imports - commented out until implemented
// import { 
//   detectEmotionFromText, 
//   detectEmotionFromAudio, 
//   detectCombinedEmotion 
// } from "./services/emotionServiceOptimized";
// import { analyzeEmotion, generateEmotionalResponse } from "./services/openai";
// import { generateConversationalResponse, type ConversationHistory } from "./services/responseService";
// import { 
//   generateEnhancedConversationalResponse, 
//   generateSuperiorTherapeuticResponse,
//   type EnhancedResponseRequest, 
//   type EnhancedResponseResult 
// } from "./services/enhancedResponseService";
// import "./services/therapeuticServicePersistent"; // Temporarily disabled - Python env not ready

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


  // Therapeutic game session routes
  app.post('/api/therapeutic/session', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, gameId, sessionData } = req.body;

      if (!userId || !gameId || !sessionData) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, gameId, sessionData' 
        });
      }

      // Save therapeutic session data
      const session = await mongoStorage.saveTherapeuticSession({
        userId,
        gameId,
        ...sessionData,
        timestamp: new Date(),
        evidenceLevel: 'clinical-grade'
      });

      // Update user progress if therapeutic data is provided
      if (sessionData.therapeutic_data) {
        await mongoStorage.updateUserTherapeuticProgress(userId, sessionData.therapeutic_data);
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
  });

  app.get('/api/therapeutic/progress/:userId', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }

      const progress = await mongoStorage.getUserTherapeuticProgress(userId);

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
  });

  app.get('/api/therapeutic/sessions/:userId', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }

      const result = await mongoStorage.getUserTherapeuticSessions(
        userId, 
        Number(limit), 
        Number(offset)
      );

      return res.status(200).json({ 
        success: true, 
        ...result
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });


  // Enhanced emotional support endpoint with therapy service integration
  app.post('/api/emotional-support', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const { mode, language, sessionId, userId, history } = req.body;
      let text = req.body.text;

      console.log('🎙️ Processing emotional support request - Mode:', mode, 'Language:', language);

      // Handle voice mode with audio processing (STT)
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

      // **NEW: Get therapy response from Python service (same as chat integration)**
      let therapyResponse = null;
      let finalResponse = text; // fallback to transcribed text
      let crisisLevel = 'none';
      let isCrisis = false;

      if (text && text.trim() !== 'No speech detected' && text.trim() !== 'No input provided') {
        try {
          console.log('🤖 Sending to therapy service:', text.substring(0, 50) + '...');

          // Call Python therapy service (same as emotional-support-chat)
          const pythonServiceResponse = await fetch('http://localhost:5001/api/therapy/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: text.trim(),
              sessionId: sessionId,
              userId: userId || `voice_user_${Date.now()}`,
              language: language || 'en'
            })
          });

          if (pythonServiceResponse.ok) {
            therapyResponse = await pythonServiceResponse.json();
            finalResponse = therapyResponse.response;
            crisisLevel = therapyResponse.crisisLevel || 'none';
            isCrisis = therapyResponse.isCrisis || false;
            console.log('✅ Therapy service response received');
          } else {
            console.warn('⚠️ Therapy service unavailable, using fallback');
            finalResponse = "I'm here to listen and support you. How are you feeling today?";
          }
        } catch (therapyError) {
          console.error('❌ Therapy service error:', therapyError);
          finalResponse = "I'm here to support you. Please tell me how you're feeling.";
        }
      }

      // Generate TTS for the therapy response (not just transcription echo)
      let audioBase64: string | undefined;
      const requestTTS = req.body.requestTTS === 'true' || mode === 'voice';
      
      if (requestTTS && finalResponse) {
        try {
          console.log('🔊 Generating enhanced human-like TTS audio for therapy response...');
          
          // Use Smart TTS with fallback chain: Edge TTS (free) -> ElevenLabs -> OpenAI -> Windows SAPI
          const ttsResult = await generateSmartTTS(
            finalResponse, 
            language === 'ur' ? 'ur' : 'en',
            'edge_tts' // Prefer Edge TTS for free high-quality neural voices
          );
          
          if (ttsResult.error) {
            console.warn(`TTS generation failed with ${ttsResult.model}:`, ttsResult.error);
            audioBase64 = undefined;
          } else {
            audioBase64 = ttsResult.audioBase64;
            console.log(`🎉 Human-like TTS audio generated successfully using ${ttsResult.model} (${ttsResult.quality} quality, ${ttsResult.processing_time}ms)`);
          }
        } catch (ttsError) {
          console.warn('Enhanced TTS error:', ttsError);
          audioBase64 = undefined;
        }
      }

      // Return enhanced response with therapy integration
      res.json({ 
        success: true,
        transcription: text, 
        response: finalResponse, // Therapy response instead of echo
        emotion: therapyResponse?.emotion || 'neutral',
        mode: mode || 'text',
        language: language || 'en',
        audioBase64: audioBase64,
        hasTTS: !!audioBase64,
        // **NEW: Add therapy service fields (same as chat)**
        sessionId: therapyResponse?.sessionId,
        userId: therapyResponse?.userId,
        sessionKey: therapyResponse?.sessionKey,
        crisisLevel: crisisLevel,
        isCrisis: isCrisis,
        newSession: therapyResponse?.newSession || false
      });

    } catch (error) {
      console.error("❌ Error processing emotional support request:", error);
      
      // Enhanced error response with crisis resources (same as chat)
      res.status(500).json({ 
        success: false,
        error: 'Processing failed',
        response: `I apologize, but I'm having technical difficulties right now. Please try again in a moment.

If you're in immediate crisis, please contact:
• **988** - Suicide & Crisis Lifeline (call or text, 24/7)
• **911** - Emergency Services

Your wellbeing is important. Please don't hesitate to reach out for professional help if needed.`,
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      });
    }
  });

 
  app.post('/api/emotional-support-chat', async (req: Request, res: Response) => {
    try {
      const { message, language, sessionId, userId } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ 
          error: 'Message is required',
          success: false 
        });
      }

      console.log('🤖 Processing emotional support chat request:', {
        message: message.substring(0, 50) + '...',
        language: language || 'en',
        sessionId: sessionId || 'new',
        userId: userId || 'anonymous'
      });

      // Call Python therapy service
      const pythonServiceResponse = await fetch('http://localhost:5001/api/therapy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          sessionId: sessionId,
          userId: userId || `user_${Date.now()}`,
          language: language || 'en'
        })
      });

      if (!pythonServiceResponse.ok) {
        throw new Error(`Python service error: ${pythonServiceResponse.status}`);
      }

      const therapyResponse = await pythonServiceResponse.json();
      
      // Return response in format expected by frontend
      res.json({ 
        success: true,
        chatResponse: therapyResponse.response,
        sessionId: therapyResponse.sessionId,
        userId: therapyResponse.userId,
        sessionKey: therapyResponse.sessionKey,
        crisisLevel: therapyResponse.crisisLevel,
        isCrisis: therapyResponse.isCrisis,
        newSession: therapyResponse.newSession,
        language: language || 'en'
      });
      
    } catch (error) {
      console.error("❌ Emotional support chat error:", error);
      
      // Provide fallback response with crisis resources
      res.status(500).json({ 
        success: false,
        error: 'Therapy service temporarily unavailable',
        chatResponse: `I apologize, but I'm having technical difficulties right now. Please try again in a moment.

If you're in immediate crisis, please contact:
• **988** - Suicide & Crisis Lifeline (call or text, 24/7)
• **911** - Emergency Services

Your wellbeing is important. Please don't hesitate to reach out for professional help if needed.`,
        fallback: true
      });
    }
  });

  // Start therapy session endpoint
  app.post('/api/therapy/start-session', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      console.log('🆕 Starting new therapy session for user:', userId);

      const pythonServiceResponse = await fetch('http://localhost:5001/api/therapy/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || `user_${Date.now()}`
        })
      });

      if (!pythonServiceResponse.ok) {
        throw new Error(`Python service error: ${pythonServiceResponse.status}`);
      }

      const sessionData = await pythonServiceResponse.json();
      
      res.json({
        success: true,
        ...sessionData
      });
      
    } catch (error) {
      console.error("❌ Error starting therapy session:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to start therapy session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get session summary endpoint  
  app.post('/api/therapy/session-summary', async (req: Request, res: Response) => {
    try {
      const { sessionKey } = req.body;

      if (!sessionKey) {
        return res.status(400).json({ 
          error: 'Session key is required',
          success: false 
        });
      }

      console.log('📋 Getting session summary for:', sessionKey);

      const pythonServiceResponse = await fetch('http://localhost:5001/api/therapy/session-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionKey: sessionKey
        })
      });

      if (!pythonServiceResponse.ok) {
        throw new Error(`Python service error: ${pythonServiceResponse.status}`);
      }

      const summaryData = await pythonServiceResponse.json();
      
      res.json({
        success: true,
        ...summaryData
      });
      
    } catch (error) {
      console.error("❌ Error getting session summary:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get session summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Therapy service health check
  app.get('/api/therapy/health', async (req: Request, res: Response) => {
    try {
      const pythonServiceResponse = await fetch('http://localhost:5001/health');
      
      if (!pythonServiceResponse.ok) {
        throw new Error(`Python service health check failed: ${pythonServiceResponse.status}`);
      }

      const healthData = await pythonServiceResponse.json();
      
      res.json({
        success: true,
        nodejs_service: 'healthy',
        python_service: healthData,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("❌ Therapy service health check failed:", error);
      res.status(503).json({ 
        success: false,
        nodejs_service: 'healthy',
        python_service: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
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
