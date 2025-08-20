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
// Phase 3: Import OPTIMIZED emotion detection services
import { 
  detectEmotionFromText, 
  detectEmotionFromAudio, 
  detectCombinedEmotion 
} from "./services/emotionServiceOptimized";
// Phase 4: Import response generation functions
import { analyzeEmotion, generateEmotionalResponse } from "./services/openai";
// Phase 4: Import new conversational response service with Llama-2 and TTS
import { generateConversationalResponse, type ConversationHistory } from "./services/responseService";
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

// Phase 3: Emotional Support Response Generation
function generateEmotionalSupportResponse(
  text: string, 
  emotion: string, 
  confidence: number, 
  language: string = 'en'
): string {
  const responses = {
    en: {
      stress: [
        "I can sense you're feeling overwhelmed. Let's take this one step at a time. What's been weighing on your mind?",
        "Stress can feel overwhelming, but you're not alone. Would you like to talk about what's causing this pressure?",
        "I notice you might be feeling stressed. Taking deep breaths can help. What's been on your mind lately?"
      ],
      sadness: [
        "I can hear that you're going through a difficult time. Your feelings are valid, and I'm here to listen.",
        "It sounds like you're feeling sad. That's completely okay - would you like to share what's been bothering you?",
        "I sense some sadness in what you're sharing. Sometimes talking helps - I'm here for you."
      ],
      anger: [
        "I can feel your frustration. It's okay to feel angry - these emotions are valid. What's been upsetting you?",
        "It sounds like something has really bothered you. Would you like to talk about what's making you feel this way?",
        "I sense some anger in your message. Let's work through this together - what happened?"
      ],
      fear: [
        "I can sense some worry or fear in what you're sharing. It's brave of you to reach out. What's been frightening you?",
        "Fear can be overwhelming, but you're safe here. Would you like to talk about what's been making you anxious?",
        "I notice you might be feeling scared. That's completely understandable - what's been on your mind?"
      ],
      joy: [
        "I can hear the positivity in your message! It's wonderful that you're feeling good. What's been making you happy?",
        "It sounds like you're in a good mood - that's great to hear! Would you like to share what's been going well?",
        "I sense some happiness in what you're sharing. It's lovely to hear from someone feeling positive!"
      ],
      neutral: [
        "Thank you for reaching out. I'm here to listen and support you. How are you feeling right now?",
        "I'm glad you're here. Sometimes it helps just to talk. What's been on your mind?",
        "I'm here for you. Would you like to share what brought you here today?"
      ]
    },
    ur: {
      stress: [
        "مجھے لگ رہا ہے آپ پریشان ہیں۔ آئیے اسے آہستہ آہستہ حل کرتے ہیں۔ کیا بات آپ کو پریشان کر رہی ہے؟",
        "تناؤ مشکل ہو سکتا ہے، لیکن آپ اکیلے نہیں ہیں۔ کیا آپ بتانا چاہیں گے کہ کیا آپ کو پریشان کر رہا ہے؟"
      ],
      sadness: [
        "مجھے لگ رہا ہے آپ مشکل وقت سے گزر رہے ہیں۔ آپ کے احساسات درست ہیں، اور میں یہاں سننے کے لیے ہوں۔",
        "لگ رہا ہے آپ اداس ہیں۔ یہ بالکل ٹھیک ہے - کیا آپ بتانا چاہیں گے کہ کیا آپ کو پریشان کر رہا ہے؟"
      ],
      neutral: [
        "آپ کا یہاں آنے کا شکریہ۔ میں یہاں آپ کی بات سننے اور مدد کرنے کے لیے ہوں۔ آپ کیسا محسوس کر رہے ہیں؟",
        "میں خوش ہوں کہ آپ یہاں ہیں۔ کبھی کبھی بات کرنا مدد کرتا ہے۔ آپ کے دل میں کیا بات ہے؟"
      ]
    }
  };

  const emotionResponses = responses[language as keyof typeof responses] || responses.en;
  const responseArray = emotionResponses[emotion as keyof typeof emotionResponses] || emotionResponses.neutral;
  
  // Select response based on confidence level
  let responseIndex = 0;
  if (confidence > 0.8) {
    responseIndex = 0; // Most confident response
  } else if (confidence > 0.6) {
    responseIndex = Math.min(1, responseArray.length - 1);
  } else {
    responseIndex = Math.min(2, responseArray.length - 1);
  }
  
  return responseArray[responseIndex] || responseArray[0];
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
        content: emotionAnalysis.response || 'I understand you might be going through something difficult. Would you like to talk about it?'
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

      // Phase 3: Use the new emotion detection system
      const emotionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
      const emotion = await detectEmotionFromText(inputText, emotionLanguage);
      
      // Phase 4: Generate personalized response based on detected emotion
      let response = `I understand you're feeling ${emotion.emotion}. That's completely valid. Would you like to tell me more about what's making you feel this way?`;
      
      try {
        response = await generateEmotionalResponse(emotion.emotion, inputText, emotionLanguage);
        console.log('Phase 4: Generated personalized response for test endpoint');
      } catch (error) {
        console.log('Phase 4: Using fallback response for test endpoint');
      }
      
      res.json({ 
        transcription: inputText, 
        emotion, 
        response: response,
        detectedEmotion: emotion.emotion,
        confidence: emotion.confidence
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

  // Test endpoint for chat mode (no auth required)
  app.post('/api/test-chat', async (req: Request, res: Response) => {
    try {
      const { message, sessionId, language } = req.body;
      
      console.log('\n=== CHAT MODE TEST ===');
      console.log('Received message:', message);
      console.log('Message length:', message ? message.length : 0);
      console.log('Session ID:', sessionId);
      console.log('Language:', language || 'en');
      
      // Validate input
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          error: 'No message provided',
          received: message 
        });
      }
      
      // Process text input (no STT needed for chat mode)
      const processedMessage = message.trim();
      
      // Phase 3: Use OPTIMIZED emotion detection for chat mode
      console.log('⚡ Chat Mode: Running optimized emotion detection...');
      console.log('📝 Processing message:', processedMessage);
      console.log('🌐 Language:', language || 'en');
      
      let detectedEmotion = 'neutral';
      let confidence = 0;
      let emotionMethod = 'fallback';
      
      try {
        console.log('🔄 Calling detectEmotionFromText...');
        // Set a shorter timeout for chat mode to avoid hanging
        const emotionPromise = detectEmotionFromText(processedMessage, language || 'en');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Chat mode timeout (3s)')), 3000)
        );
        
        const emotionResult = await Promise.race([emotionPromise, timeoutPromise]) as any;
        console.log('📊 Emotion result received:', emotionResult);
        
        if (emotionResult && typeof emotionResult === 'object') {
          detectedEmotion = emotionResult.emotion || 'neutral';
          confidence = emotionResult.confidence || 0.5;
          emotionMethod = 'optimized';
          console.log(`✅ Chat Mode Emotion: ${detectedEmotion} (${confidence.toFixed(3)})`);
        } else {
          throw new Error('Invalid emotion result format');
        }
      } catch (error: any) {
        console.log('⚠️  Optimized detection failed, using fallback keyword detection');
        console.log('❌ Error details:', error?.message || 'Unknown error');
        
        
        // Fallback to enhanced keyword detection with raw emotion labels
        const lowerMessage = processedMessage.toLowerCase();
        
        // More specific emotion detection
        if (lowerMessage.includes('disappoint') || lowerMessage.includes('let down')) {
          detectedEmotion = 'disappointment';
          confidence = 0.6;
        } else if (lowerMessage.includes('grateful') || lowerMessage.includes('thankful')) {
          detectedEmotion = 'gratitude';
          confidence = 0.6;
        } else if (lowerMessage.includes('annoyed') || lowerMessage.includes('irritated')) {
          detectedEmotion = 'annoyance';
          confidence = 0.6;
        } else if (lowerMessage.includes('excited') || lowerMessage.includes('thrilled')) {
          detectedEmotion = 'excitement';
          confidence = 0.6;
        } else if (lowerMessage.includes('nervous') || lowerMessage.includes('worried')) {
          detectedEmotion = 'nervousness';
          confidence = 0.6;
        } else if (lowerMessage.includes('embarrassed') || lowerMessage.includes('ashamed')) {
          detectedEmotion = 'embarrassment';
          confidence = 0.6;
        } else if (lowerMessage.includes('curious') || lowerMessage.includes('wonder')) {
          detectedEmotion = 'curiosity';
          confidence = 0.6;
        } else if (lowerMessage.includes('approve') || lowerMessage.includes('agree')) {
          detectedEmotion = 'approval';
          confidence = 0.6;
        } else if (lowerMessage.includes('caring') || lowerMessage.includes('concern')) {
          detectedEmotion = 'caring';
          confidence = 0.6;
        } else if (lowerMessage.includes('relief') || lowerMessage.includes('relieved')) {
          detectedEmotion = 'relief';
          confidence = 0.6;
        } else if (lowerMessage.includes('sad') || lowerMessage.includes('upset') || lowerMessage.includes('depressed') || lowerMessage.includes('hopeless')) {
          detectedEmotion = 'sadness';
          confidence = 0.6;
        } else if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('frustrated')) {
          detectedEmotion = 'anger';
          confidence = 0.6;
        } else if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('fear')) {
          detectedEmotion = 'anxiety';
          confidence = 0.6;
        } else if (lowerMessage.includes('happy') || lowerMessage.includes('joy')) {
          detectedEmotion = 'joy';
          confidence = 0.6;
        }
        emotionMethod = 'keyword-fallback';
        console.log(`🔄 Fallback emotion: ${detectedEmotion} (confidence: ${confidence})`);
      }
      // Generate appropriate response based on detected emotion (using raw labels)
      let chatResponse = '';
      switch (detectedEmotion) {
        // Stress/Anxiety related
        case 'stress':
        case 'anxiety':
        case 'nervousness':
          chatResponse = "I can sense you might be feeling stressed or anxious. That's completely understandable. Take a deep breath with me. What's been weighing on your mind?";
          break;
          
        // Sadness related
        case 'sadness':
        case 'disappointment':
        case 'grief':
          chatResponse = "I hear that you're going through a difficult time. It's okay to feel sad or disappointed sometimes. Would you like to share what's been troubling you?";
          break;
          
        // Anger related
        case 'anger':
        case 'annoyance':
        case 'frustration':
          chatResponse = "I understand you're feeling frustrated or angry. Those feelings are completely valid. What's been causing these intense feelings?";
          break;
          
        // Fear related
        case 'fear':
        case 'nervousness':
          chatResponse = "I notice you might be feeling scared or worried. That can be really overwhelming. Let's take this one step at a time. What's been frightening you?";
          break;
          
        // Joy/Positive related
        case 'joy':
        case 'excitement':
        case 'amusement':
        case 'gratitude':
        case 'relief':
        case 'pride':
        case 'optimism':
          chatResponse = "It's wonderful to hear you're feeling positive! I'm glad you're having a good moment. What's been bringing you happiness?";
          break;
          
        // Social emotions
        case 'love':
        case 'caring':
        case 'admiration':
          chatResponse = "I can sense the warmth and care in your words. It's beautiful to see such positive emotions. Tell me more about what's inspiring these feelings.";
          break;
          
        // Approval/Agreement
        case 'approval':
        case 'desire':
          chatResponse = "I can hear that you're feeling positive about something. That's wonderful! What's been going well for you?";
          break;
          
        // Confusion/Curiosity
        case 'confusion':
        case 'curiosity':
        case 'realization':
          chatResponse = "It sounds like you're processing some thoughts or discoveries. I'm here to help you work through whatever you're thinking about.";
          break;
          
        // Embarrassment/Shame
        case 'embarrassment':
        case 'remorse':
          chatResponse = "I can sense you might be feeling uncomfortable about something. Those feelings are completely normal and valid. Would you like to talk about it?";
          break;
          
        // Surprise
        case 'surprise':
          chatResponse = "Something seems to have caught you off guard. Would you like to tell me more about what's been surprising you?";
          break;
          
        // Disgust
        case 'disgust':
          chatResponse = "I can sense you're feeling uncomfortable about something. Those feelings are valid. What's been bothering you?";
          break;
          
        // Disapproval
        case 'disapproval':
          chatResponse = "I can hear that you disagree with something. It's important to trust your instincts. What's been concerning you?";
          break;
          
        // Neutral/Default
        case 'neutral':
        default:
          chatResponse = "Thank you for sharing that with me. I'm here to listen and support you. How are you feeling right now?";
      }
      
      // Return chat response
      res.json({
        success: true,
        userMessage: processedMessage,
        detectedEmotion: detectedEmotion,
        confidence: confidence,
        chatResponse: chatResponse,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'test-session',
        language: language || 'en',
        mode: 'chat-text',
        sttUsed: false,  // Confirm no STT was used
        emotionMethod: emotionMethod  // Indicate which detection method was used
      });
      
    } catch (error) {
      console.error('Chat test endpoint error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        mode: 'chat-text'
      });
    }
  });

  // Simple emotional support endpoint without authentication
  app.post('/api/emotional-support', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const { mode, language, history } = req.body;
      let text = req.body.text;
      let audioPath: string | null = null;

      console.log('Processing emotional support request - Mode:', mode, 'Language:', language);

      // Phase 3: Handle voice mode with audio file processing
      if (mode === 'voice' && req.file) {
        try {
          console.log('Processing audio file, size:', req.file.size, 'bytes');
          const audioBuffer = req.file.buffer;
          
          // Validate audio buffer first
          if (!validateAudioBuffer(audioBuffer)) {
            throw new Error('Invalid audio file format or size');
          }
          
          // Save audio to temp file for emotion detection
          const tempDir = path.join(process.cwd(), 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);
          fs.writeFileSync(audioPath, audioBuffer);
          
          const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
          
          try {
            // Try the full Whisper transcription first
            text = await transcribeAudio(audioBuffer, whisperLanguage);
            console.log('Whisper transcription successful:', text?.length, 'characters');
          } catch (whisperError) {
            console.warn('Whisper failed, using simple fallback:', whisperError);
            // Fallback to simple transcription
            text = await simpleTranscribeAudio(audioBuffer, whisperLanguage);
            console.log('Fallback transcription used');
          }
        } catch (sttError) {
          console.warn('All STT methods failed, using text fallback:', sttError);
          text = req.body.text || 'Voice input received but transcription failed';
        }
      }

      // Ensure we have some text to work with
      if (!text || text.trim().length === 0) {
        text = mode === 'voice' ? 'I received your voice message' : 'Hello, how are you feeling?';
      }

      console.log('Final processed text:', text);

      // Phase 3: Advanced Emotion Detection
      let emotionResult;
      const detectionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
      
      if (mode === 'voice' && audioPath && fs.existsSync(audioPath)) {
        // Combined text + voice emotion detection
        console.log('⚡ Phase 3: Running OPTIMIZED combined emotion detection...');
        const combinedResult = await detectCombinedEmotion(text, audioPath, detectionLanguage);
        emotionResult = {
          emotion: combinedResult.combined.emotion,
          confidence: combinedResult.combined.confidence,
          text_emotion: combinedResult.text.emotion,
          voice_emotion: combinedResult.voice.emotion,
          method: 'combined'
        };
        
        // Clean up temp audio file
        try {
          fs.unlinkSync(audioPath);
        } catch (cleanupError) {
          console.warn('Failed to clean up temp audio file:', cleanupError);
        }
      } else {
        // Text-only emotion detection
        console.log('Phase 3: Running text emotion detection...');
        const textResult = await detectEmotionFromText(text, detectionLanguage);
        emotionResult = {
          emotion: textResult.emotion,
          confidence: textResult.confidence,
          method: 'text-only'
        };
      }

      console.log('Phase 3 Emotion Detection Result:', emotionResult);

      // Phase 4: Parse conversation history for context
      let conversationHistory: ConversationHistory[] = [];
      try {
        if (history) {
          const parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
          conversationHistory = Array.isArray(parsedHistory) ? parsedHistory : [];
          console.log('Phase 4: Parsed conversation history length:', conversationHistory.length);
        }
      } catch (historyError) {
        console.warn('Phase 4: Failed to parse conversation history:', historyError);
        conversationHistory = [];
      }

      // Phase 4: Generate conversational response using Llama-2 + TTS
      try {
        console.log('Phase 4: Attempting Llama-2 conversational response generation...');
        const responseResult = await generateConversationalResponse({
          text,
          emotion: emotionResult.emotion,
          language: detectionLanguage,
          history: conversationHistory,
          userContext: {
            // Add user context if available from session
            preferences: ['empathetic', 'supportive']
          }
        });

        console.log('Phase 4: Llama response generated successfully');
        console.log('Phase 4: TTS audio available:', !!responseResult.audioBase64);

        res.json({ 
          transcription: text, 
          emotion: emotionResult.emotion,
          confidence: emotionResult.confidence,
          detectedEmotion: emotionResult.emotion, // For backward compatibility
          response: responseResult.response,
          mode: mode || 'text',
          language: detectionLanguage,
          emotionDetails: emotionResult,
          // Phase 4: New fields
          audioBase64: responseResult.audioBase64, // TTS audio for avatar
          conversational: true,
          model: responseResult.metadata?.model,
          processingTime: responseResult.metadata?.processingTime,
          historyLength: responseResult.metadata?.historyLength
        });

      } catch (llamaError) {
        console.warn('Phase 4: Llama response failed, using fallback:', llamaError);
        
        // Fallback to existing response generation
        const supportResponse = generateEmotionalSupportResponse(
          text, 
          emotionResult.emotion, 
          emotionResult.confidence,
          detectionLanguage
        );

        res.json({ 
          transcription: text, 
          emotion: emotionResult.emotion,
          confidence: emotionResult.confidence,
          detectedEmotion: emotionResult.emotion, // For backward compatibility
          response: supportResponse,
          mode: mode || 'text',
          language: detectionLanguage,
          emotionDetails: emotionResult,
          // Phase 4: Indicate fallback was used
          conversational: false,
          fallbackUsed: true,
          error: llamaError instanceof Error ? llamaError.message : 'Llama response failed'
        });
      }
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

            // Process emotion detection
            let finalEmotion = { emotion: 'neutral', confidence: 0.5 };
            try {
              const emotionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
              const textEmotion = await detectEmotionFromText(inputText, emotionLanguage);
              
              if (audio) {
                try {
                  // Save audio buffer to temporary file for emotion detection
                  const audioBuffer = Buffer.from(audio, 'base64');
                  const tempDir = path.join(process.cwd(), 'temp');
                  if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                  }
                  const tempAudioPath = path.join(tempDir, `ws_audio_${Date.now()}.wav`);
                  fs.writeFileSync(tempAudioPath, audioBuffer);
                  
                  // Use OPTIMIZED combined emotion detection
                  const combinedResult = await detectCombinedEmotion(inputText, tempAudioPath, emotionLanguage);
                  finalEmotion = {
                    emotion: combinedResult.combined.emotion,
                    confidence: combinedResult.combined.confidence
                  };
                  
                  // Clean up temp file
                  try {
                    fs.unlinkSync(tempAudioPath);
                  } catch (cleanupError) {
                    console.warn('Failed to clean up temp audio file:', cleanupError);
                  }
                } catch (voiceError) {
                  finalEmotion = {
                    emotion: textEmotion.emotion,
                    confidence: textEmotion.confidence
                  };
                }
              } else {
                finalEmotion = {
                  emotion: textEmotion.emotion,
                  confidence: textEmotion.confidence
                };
              }
            } catch (emotionError) {
              console.warn('WebSocket emotion detection failed:', emotionError);
            }

            // Generate response
            let finalResponse = '';
            try {
              const emotionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
              finalResponse = await generateEmotionalResponse(finalEmotion.emotion, inputText, emotionLanguage);
            } catch (error) {
              finalResponse = 'I understand. Please tell me more about how you\'re feeling.';
            }

            // Send response via WebSocket
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'emotional-support-response',
                response: finalResponse,
                emotion: finalEmotion,
                transcription: inputText
              }));
            }
          } catch (error) {
            console.error('WebSocket emotional support error:', error);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Failed to process emotional support request' }
              }));
            }
          }
        } else if (message.type === 'emotional-support-voice') {
          // Handle emotional support VOICE mode via WebSocket
          try {
            const { text, language, audio, requestTTS, voiceSettings } = message;
            let inputText = text;

            // Handle audio if present
            if (audio) {
              try {
                const audioBuffer = Buffer.from(audio, 'base64');
                const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
                inputText = await transcribeAudio(audioBuffer, whisperLanguage);
              } catch (sttError) {
                console.warn('WebSocket Voice STT failed, using text input:', sttError);
                inputText = text || 'Could not transcribe audio';
              }
            }

            if (!inputText?.trim()) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'error',
                  data: { message: 'No voice input provided' }
                }));
              }
              return;
            }

            // Enhanced emotion detection for voice mode
            let finalEmotion = { emotion: 'neutral', confidence: 0.5 };
            try {
              const emotionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
              const textEmotion = await detectEmotionFromText(inputText, emotionLanguage);
              
              if (audio) {
                try {
                  // Save audio buffer to temporary file for emotion detection
                  const audioBuffer = Buffer.from(audio, 'base64');
                  const tempDir = path.join(process.cwd(), 'temp');
                  if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                  }
                  const tempAudioPath = path.join(tempDir, `ws_voice_audio_${Date.now()}.wav`);
                  fs.writeFileSync(tempAudioPath, audioBuffer);
                  
                  // Use OPTIMIZED combined emotion detection
                  const combinedResult = await detectCombinedEmotion(inputText, tempAudioPath, emotionLanguage);
                  finalEmotion = {
                    emotion: combinedResult.combined.emotion,
                    confidence: combinedResult.combined.confidence
                  };
                  console.log('Voice WebSocket: Combined emotion detected:', finalEmotion);
                  
                  // Clean up temp file
                  try {
                    fs.unlinkSync(tempAudioPath);
                  } catch (cleanupError) {
                    console.warn('Failed to clean up temp audio file:', cleanupError);
                  }
                } catch (voiceError) {
                  console.warn('Voice WebSocket: Audio emotion detection failed, using text-only');
                  finalEmotion = {
                    emotion: textEmotion.emotion,
                    confidence: textEmotion.confidence
                  };
                }
              } else {
                finalEmotion = {
                  emotion: textEmotion.emotion,
                  confidence: textEmotion.confidence
                };
              }
            } catch (emotionError) {
              console.warn('WebSocket voice emotion detection failed:', emotionError);
            }

            // Generate empathetic response for voice mode
            let finalResponse = '';
            try {
              const emotionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
              finalResponse = await generateEmotionalResponse(finalEmotion.emotion, inputText, emotionLanguage);
              console.log('Voice WebSocket: Generated response for', finalEmotion.emotion);
            } catch (error) {
              console.warn('Voice WebSocket: Response generation failed, using fallback');
              finalResponse = language?.startsWith('ur') 
                ? 'میں سمجھ رہا ہوں۔ براہ کرم مجھے بتائیں کہ آپ کیسا محسوس کر رہے ہیں۔' 
                : 'I understand. Please tell me more about how you\'re feeling.';
            }

            // TODO: Add Text-to-Speech (TTS) generation here
            let audioResponse = null;
            if (requestTTS) {
              try {
                // Placeholder for TTS implementation
                // audioResponse = await generateTTS(finalResponse, language, voiceSettings);
                console.log('TTS requested but not implemented yet');
              } catch (ttsError) {
                console.warn('TTS generation failed:', ttsError);
              }
            }

            // Send voice response via WebSocket
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'emotional-support-voice-response',
                response: finalResponse,
                emotion: finalEmotion,
                transcription: inputText,
                audioBlob: audioResponse, // Will be null until TTS is implemented
                voiceMode: true
              }));
            }
          } catch (error) {
            console.error('WebSocket emotional support voice error:', error);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Failed to process voice emotional support request' }
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
