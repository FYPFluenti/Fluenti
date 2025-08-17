import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { mongoStorage } from "./mongoStorage";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { extractTokenFromHeader, tokenBasedAuth } from "./middleware";
import * as speechServiceModule from "./services/speechService";
const { SpeechService, transcribeAudio, detectEmotion } = speechServiceModule;
// Phase 3: Import emotion detection services
import { 
  detectEmotionFromText, 
  detectEmotionFromAudio, 
  combineEmotions 
} from "./services/emotionService";
import { analyzeEmotion } from "./services/openai";
import { AuthService } from "./auth";
import multer from 'multer';

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

  // Temporary test endpoint for Phase 1 testing (no auth required)
  app.post('/api/test-emotional-support', async (req: Request, res: Response) => {
    try {
      const { audio, text, language } = req.body;
      let inputText = text;

      if (audio) {
        try {
          const audioBuffer = Buffer.from(audio, 'base64');
          const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
          inputText = await transcribeAudio(audioBuffer, whisperLanguage);
        } catch (sttError) {
          console.warn('STT failed, using text input:', sttError);
          inputText = text || 'Could not transcribe audio';
        }
      }

      if (!inputText) {
        return res.status(400).json({ error: 'No input provided' });
      }

      const emotion = await detectEmotion(inputText);
      
      // Mock response for testing (since we don't want to require OpenAI for testing)
      const mockResponse = `I understand you're feeling ${emotion.emotion}. That's completely valid. Would you like to tell me more about what's making you feel this way?`;
      
      res.json({ 
        transcription: inputText, 
        emotion, 
        response: mockResponse,
        detectedEmotion: emotion.emotion,
        confidence: emotion.score
      });
    } catch (error) {
      console.error("Error processing test emotional support request:", error);
      res.status(500).json({ 
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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

  // New endpoint for emotional support with Hugging Face Whisper STT integration
  app.post('/api/emotional-support', upload.single('audio'), tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      let { text, language } = req.body;
      let inputText = text;

      console.log('Received text:', text);
      console.log('Text length:', text ? text.length : 0);
      console.log('Language:', language);

      // Handle audio file if present (from FormData)
      if (req.file) {
        try {
          const audioBuffer = req.file.buffer;
          const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
          inputText = await transcribeAudio(audioBuffer, whisperLanguage);
        } catch (sttError) {
          console.warn('STT failed, using text input:', sttError);
          inputText = text || 'Could not transcribe audio';
        }
      }
      // Handle base64 audio (from JSON)
      else if (req.body.audio) {
        try {
          const audioBuffer = Buffer.from(req.body.audio, 'base64');
          const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
          inputText = await transcribeAudio(audioBuffer, whisperLanguage);
        } catch (sttError) {
          console.warn('STT failed, using text input:', sttError);
          inputText = text || 'Could not transcribe audio';
        }
      }

      console.log('Input text for processing:', inputText);
      console.log('Input text length:', inputText ? inputText.length : 0);

      if (!inputText?.trim()) {
        return res.status(400).json({ error: 'No input provided' });
      }

      // Phase 3: Enhanced emotion detection system
      let finalEmotion = { emotion: 'neutral', score: 0.5 };
      let voiceEmotion = null; // Declare in proper scope for use later
      
      try {
        // Extract language code for emotion detection
        const emotionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
        
        // Detect emotion from text (transcribed speech)
        const textEmotion = await detectEmotionFromText(inputText, emotionLanguage);
        console.log('Text emotion detected:', textEmotion);
        
        // If we have audio, also detect emotion from voice tone
        if (req.file) {
          try {
            voiceEmotion = await detectEmotionFromAudio(req.file.buffer, emotionLanguage);
            console.log('Voice emotion detected:', voiceEmotion);
          } catch (voiceError) {
            console.warn('Voice emotion detection failed:', voiceError);
          }
        } else if (req.body.audio) {
          try {
            const audioBuffer = Buffer.from(req.body.audio, 'base64');
            voiceEmotion = await detectEmotionFromAudio(audioBuffer, emotionLanguage);
            console.log('Voice emotion detected:', voiceEmotion);
          } catch (voiceError) {
            console.warn('Voice emotion detection failed:', voiceError);
          }
        }
        
        // Combine text and voice emotions if both available
        if (voiceEmotion) {
          finalEmotion = combineEmotions(textEmotion, voiceEmotion);
          console.log('Combined emotion result:', finalEmotion);
        } else {
          finalEmotion = textEmotion;
          console.log('Using text-only emotion:', finalEmotion);
        }
        
      } catch (emotionError) {
        console.warn('Phase 3 emotion detection failed, using fallback:', emotionError);
        // Fallback to old system if Phase 3 fails
        try {
          finalEmotion = await detectEmotion(inputText);
        } catch (fallbackError) {
          console.warn('All emotion detection methods failed:', fallbackError);
          finalEmotion = { emotion: 'neutral', score: 0.5 };
        }
      }

      console.log('Final detected emotion:', finalEmotion);
      
      // Generate context-aware response based on detected emotion
      let supportiveResponse = '';
      switch (finalEmotion.emotion.toLowerCase()) {
        case 'anxious':
        case 'anxiety':
        case 'fearful':
        case 'fear':
          supportiveResponse = `I can sense you're feeling ${finalEmotion.emotion}. Anxiety can feel overwhelming, but you're not alone. Let's take a deep breath together - inhale for 4 counts, hold for 4, exhale for 6. Can you tell me what's been causing these feelings? Remember, anxiety is treatable and you can get through this.`;
          break;
        case 'sad':
        case 'sadness':
        case 'depressed':
        case 'depression':
          supportiveResponse = `I understand you're feeling ${finalEmotion.emotion}. It's okay to feel this way, and your feelings are completely valid. Sometimes talking about what's bothering you can help lighten the load. What's been weighing on your mind? Remember, you don't have to carry this alone.`;
          break;
        case 'angry':
        case 'anger':
        case 'frustrated':
        case 'frustration':
          supportiveResponse = `I can hear that you're feeling ${finalEmotion.emotion}. These are natural emotions, and it's important to acknowledge them rather than suppress them. What situation has been causing you to feel this way? Let's explore some healthy ways to process these feelings.`;
          break;
        case 'happy':
        case 'happiness':
        case 'excited':
        case 'excitement':
        case 'joyful':
        case 'joy':
          supportiveResponse = `It's wonderful to hear that you're feeling ${finalEmotion.emotion}! I'm genuinely glad you're experiencing positive emotions. What's been bringing you joy lately? It's important to celebrate and appreciate these good moments.`;
          break;
        case 'overwhelmed':
        case 'overwhelming':
          supportiveResponse = `Feeling overwhelmed is very common, especially in today's fast-paced world, and you're brave for recognizing it. Let's break things down into manageable pieces. What feels like the most pressing issue right now? We can tackle this one step at a time.`;
          break;
        case 'stressed':
        case 'stress':
          supportiveResponse = `I can hear the stress in your words. Stress can be really challenging to manage. Let's identify what's causing this stress and explore some coping strategies. Have you tried any relaxation techniques? Remember to be kind to yourself during stressful times.`;
          break;
        case 'lonely':
        case 'loneliness':
          supportiveResponse = `I hear that you're feeling lonely. That's a difficult and very human emotion to experience. Remember that reaching out, like you're doing now, is a positive and brave step. You're not as alone as you might feel - you've reached out to me, and that connection matters.`;
          break;
        case 'confused':
        case 'confusion':
          supportiveResponse = `It sounds like you're feeling confused right now. That's completely understandable - life can present us with complex situations. Sometimes talking through our thoughts can help bring clarity. What's been puzzling or troubling you? Let's work through it together.`;
          break;
        case 'disappointed':
        case 'disappointment':
          supportiveResponse = `I can sense your disappointment, and I'm sorry you're going through this. Disappointment can be particularly hard because it often involves unmet expectations. What happened that led to these feelings? Your disappointment is valid, and it's okay to feel this way.`;
          break;
        case 'surprised':
        case 'surprise':
          supportiveResponse = `I notice you might be feeling surprised or caught off guard by something. Life can certainly throw unexpected things our way. How are you processing this surprise? Whether it's good or challenging news, I'm here to listen and support you.`;
          break;
        case 'neutral':
          supportiveResponse = `Thank you for sharing with me. I'm here to listen and support you through whatever you're experiencing. Your feelings are valid and important. How are you feeling right now, and what would be most helpful for you? I'm here to provide a safe space for you to express yourself.`;
          break;
        default:
          supportiveResponse = `Thank you for sharing with me. I'm here to listen and support you through whatever you're experiencing. Your feelings are valid and important. How are you feeling right now, and what would be most helpful for you? I'm here to provide a safe space for you to express yourself.`;
      }
      
      // Use enhanced Hugging Face responses (OpenAI disabled)
      let finalResponse = supportiveResponse;
      console.log('Using enhanced Hugging Face response system');
      
      /* OpenAI integration disabled - uncomment to re-enable:
      try {
        const emotionAnalysis = await analyzeEmotion(inputText);
        finalResponse = emotionAnalysis.response;
        console.log('OpenAI analysis successful');
      } catch (error) {
        console.log('Using Hugging Face fallback response (OpenAI unavailable)');
      }
      */
      
      res.json({ 
        transcription: inputText, 
        emotion: finalEmotion,  // Phase 3: Return the enhanced emotion detection result
        response: finalResponse,
        detectedEmotion: finalEmotion.emotion,
        confidence: finalEmotion.score,
        // Phase 3: Additional metadata for debugging/monitoring
        emotionSource: voiceEmotion ? 'combined' : 'text-only',
        language: language || 'en'
      });
    } catch (error) {
      console.error("Error processing emotional support request:", error);
      res.status(500).json({ error: 'Processing failed' });
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
    console.log('New WebSocket connection');
    
    // Handle authentication
    let userId = null;
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
      
      if (token) {
        // Verify the token (user ID)
        const user = await mongoStorage.getUser(token);
        if (user) {
          userId = user.id;
          console.log(`WebSocket authenticated for user: ${userId}`);
          
          // Attach user to WebSocket object for future reference
          (ws as any).user = user;
        } else {
          console.warn('Invalid WebSocket token, user not found');
          ws.close(1008, 'Authentication failed');
          return;
        }
      } else {
        console.warn('No token provided for WebSocket connection');
        // Still allow connection for non-authenticated features
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
