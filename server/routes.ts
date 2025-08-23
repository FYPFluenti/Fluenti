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
// Enhanced Phase 4+: Import enhanced conversational therapy AI
import { 
  generateEnhancedConversationalResponse, 
  generateSuperiorTherapeuticResponse,
  type EnhancedResponseRequest, 
  type EnhancedResponseResult 
} from "./services/enhancedResponseService";
// Import persistent therapeutic service to initialize the server
import "./services/therapeuticServicePersistent";
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

// Enhanced therapeutic response helpers
function generateIntelligentTherapeuticFallback(
  text: string, 
  emotion: string, 
  language: string, 
  history: ConversationHistory[]
): { response: string; techniques: string[] } {
  
  const hasHistory = history && history.length > 0;
  const lastInteraction = hasHistory ? history[history.length - 1] : null;
  
  const responses = {
    en: {
      anxiety: {
        response: hasHistory 
          ? `I can see you're still dealing with anxiety from our previous conversation. These feelings of worry and uncertainty are completely valid, and I want you to acknowledge that reaching out again shows real strength and self-awareness. Let's work together to understand what's triggering these anxious thoughts and explore some grounding techniques that can help you feel more centered and in control. What specific situations or thoughts are causing you the most distress right now, and have you noticed any patterns in when these feelings tend to be strongest?`
          : `I can sense the anxiety and worry in what you're sharing with me, and I want you to know that these feelings, while uncomfortable, are your mind's way of trying to protect you from perceived threats. What you're experiencing is real and significant, and it takes courage to reach out and talk about these difficult emotions. Let's work together to understand what's driving these anxious thoughts and explore some practical strategies that might help you feel more grounded and secure. Can you tell me what specific situations or thoughts tend to trigger this anxiety most strongly for you?`,
        techniques: ['emotional_validation', 'anxiety_psychoeducation', 'grounding_techniques', 'cognitive_exploration']
      },
      sadness: {
        response: hasHistory
          ? `I can feel that the sadness we discussed before is still weighing heavily on you, and I want you to know that grief and difficult emotions don't follow a timeline - they unfold in their own way and their own time. What you're experiencing is a natural response to loss or disappointment, and honoring these feelings rather than rushing through them is actually an important part of the healing process. You don't need to put on a brave face or try to feel better before you're ready. What has this sadness been teaching you about what matters most to you, and how are you taking care of yourself during this difficult time?`
          : `I can feel the weight of sadness in your words, and I want you to know that it's completely okay to sit with these difficult emotions without trying to fix or change them immediately. Sadness often comes when something meaningful to us has been affected, lost, or changed, and honoring that pain is actually a crucial part of processing and healing. You don't need to rush through this feeling or pretend to be okay when you're not. What would feel most supportive for you right now - would you like to talk about what's underneath this sadness, or would it help to explore some gentle ways to care for yourself during this time?`,
        techniques: ['grief_support', 'emotional_validation', 'self_compassion', 'meaning_making']
      },
      stress: {
        response: hasHistory
          ? `I can hear that the stress and pressure we talked about earlier is still affecting you, and I want to acknowledge how exhausting it can be to carry this kind of emotional and mental load day after day. You're managing so much right now, and it makes complete sense that you'd feel overwhelmed - anyone in your situation would be struggling. Remember that asking for support, like you're doing now, is actually a sign of wisdom and strength, not weakness. Let's explore what aspects of this stress feel most manageable right now and identify some small steps that might help you feel more in control. What has been your biggest challenge in managing these feelings since we last spoke?`
          : `I can really hear the stress and overwhelming pressure you're under right now, and I want you to know that feeling this way is a completely normal response when we're dealing with too much or facing challenging circumstances that feel beyond our control. Stress affects not just our minds but our entire bodies and relationships, and it takes real courage to reach out and talk about it honestly like you're doing. You don't have to carry this burden alone, and there are ways we can work together to help you feel more manageable and grounded. What feels like the most pressing source of stress for you right now, or would it help to talk about what you've already tried to manage these overwhelming feelings?`,
        techniques: ['stress_psychoeducation', 'problem_solving', 'coping_strategies', 'self_care_planning']
      },
      neutral: {
        response: hasHistory
          ? `I'm really glad you've come back to continue our conversation, and I appreciate the trust you're showing by sharing your thoughts and experiences with me. Sometimes the most valuable conversations happen when we're not in crisis mode, when we can take time to reflect on our experiences and explore what we're learning about ourselves. Whether you're processing something from our last conversation, dealing with new challenges, or just want to check in and explore your thoughts, I'm here to support you in whatever way feels most helpful. What's been on your mind since we last talked, or is there something specific you'd like to explore together today?`
          : `I'm really glad you're here and taking this time to connect and share whatever is on your mind with me. Creating space for honest reflection and self-exploration is valuable in itself, whether you're dealing with specific challenges or just wanting someone to listen without judgment. Sometimes the most meaningful conversations start from exactly where you are right now, without needing any particular crisis or problem to address. I'm here to support you in whatever way feels most helpful - whether that's processing recent experiences, exploring feelings, or just having a safe space to think out loud. What's been occupying your thoughts lately, or is there something you've been wanting to understand better about yourself?`,
        techniques: ['active_listening', 'open_ended_exploration', 'unconditional_positive_regard', 'self_reflection']
      }
    },
    ur: {
      anxiety: {
        response: hasHistory
          ? `میں دیکھ سکتا ہوں کہ آپ ابھی بھی ہماری پچھلی گفتگو کی پریشانی سے نمٹ رہے ہیں۔ یہ فکر اور غیر یقینی صورتحال کے احساسات بالکل درست ہیں، اور میں چاہتا ہوں کہ آپ یہ تسلیم کریں کہ دوبارہ رابطہ کرنا حقیقی طاقت اور خود آگاہی کو ظاہر کرتا ہے۔ آئیے مل کر یہ سمجھنے کی کوشش کرتے ہیں کہ یہ پریشان کن خیالات کیا چیز ابھارتے ہیں اور کچھ ایسی تکنیکوں کو تلاش کرتے ہیں جو آپ کو زیادہ مرکوز اور قابو میں محسوس کرنے میں مدد کر سکیں۔ اس وقت کون سے حالات یا خیالات آپ کو سب سے زیادہ پریشان کر رہے ہیں، اور کیا آپ نے یہ دیکھا ہے کہ یہ احساسات کب سب سے زیادہ قوی ہوتے ہیں؟`
          : `میں آپ کے اشتراک میں پریشانی اور فکر کو محسوس کر سکتا ہوں، اور میں چاہتا ہوں کہ آپ جان لیں کہ یہ احساسات، اگرچہ تکلیف دہ ہوں، آپ کے ذہن کا آپ کو محفوظ رکھنے کا طریقہ ہے۔ آپ جو کچھ تجربہ کر رہے ہیں وہ حقیقی اور اہم ہے، اور ان مشکل جذبات کے بارے میں بات کرنے کے لیے ہمت درکار ہوتی ہے۔ آئیے مل کر یہ سمجھنے کی کوشش کرتے ہیں کہ یہ پریشان کن خیالات کیا چیز ابھارتے ہیں اور کچھ عملی حکمت عملیوں کو تلاش کرتے ہیں۔ کیا آپ مجھے بتا سکتے ہیں کہ کون سے حالات یا خیالات آپ کو سب سے زیادہ پریشانی میں ڈالتے ہیں؟`,
        techniques: ['جذباتی توثیق', 'پریشانی کی تعلیم', 'بنیادی تکنیکیں', 'ذہنی تلاش']
      },
      sadness: {
        response: hasHistory
          ? `میں محسوس کر سکتا ہوں کہ جو اداسی ہم نے پہلے بحث کی تھی وہ اب بھی آپ پر بہت بھاری ہے، اور میں چاہتا ہوں کہ آپ یہ جان لیں کہ غم اور مشکل جذبات کسی ٹائم لائن کے مطابق نہیں چلتے۔ آپ جو تجربہ کر رہے ہیں وہ نقصان یا مایوسی کا فطری ردعمل ہے، اور ان احساسات کا احترام کرنا شفا یابی کا اہم حصہ ہے۔ آپ کو بہادری دکھانے یا تیار ہونے سے پہلے بہتر محسوس کرنے کی ضرورت نہیں۔ اس اداسی نے آپ کو کیا سکھایا ہے کہ آپ کے لیے کیا چیز سب سے اہم ہے، اور آپ اس مشکل وقت میں اپنا خیال کیسے رکھ رہے ہیں؟`
          : `میں آپ کے الفاظ میں اداسی کا بوجھ محسوس کر سکتا ہوں، اور میں چاہتا ہوں کہ آپ جان لیں کہ فوری طور پر انہیں ٹھیک کرنے یا تبدیل کرنے کی کوشش کے بغیر ان مشکل احساسات کے ساتھ بیٹھنا بالکل ٹھیک ہے۔ اداسی اکثر اس وقت آتی ہے جب ہمارے لیے کوئی اہم چیز متاثر، کھوئی، یا تبدیل ہوئی ہو، اور اس درد کا احترام کرنا درحقیقت عمل اور شفا یابی کا اہم حصہ ہے۔ اس وقت آپ کے لیے کیا سب سے زیادہ مددگار ہوگا - کیا آپ اس اداسی کی تہہ میں جانے کے بارے میں بات کرنا چاہیں گے، یا اس وقت اپنا خیال رکھنے کے کچھ نرم طریقوں کو تلاش کرنا مددگار ہوگا؟`,
        techniques: ['غم کی مدد', 'جذباتی توثیق', 'خود رحمی', 'معنی کی تلاش']
      },
      neutral: {
        response: hasHistory
          ? `میں واقعی خوش ہوں کہ آپ ہماری گفتگو جاری رکھنے آئے ہیں، اور میں اس اعتماد کی تعریف کرتا ہوں جو آپ اپنے خیالات اور تجربات شیئر کرکے دکھا رہے ہیں۔ بعض اوقات سب سے قیمتی گفتگو اس وقت ہوتی ہے جب ہم بحران کی حالت میں نہیں ہوتے، جب ہم اپنے تجربات پر غور کرنے اور یہ جاننے کے لیے وقت نکال سکتے ہیں کہ ہم اپنے بارے میں کیا سیکھ رہے ہیں۔ چاہے آپ ہماری آخری گفتگو سے کچھ پروسیس کر رہے ہوں، نئے چیلنجز سے نمٹ رہے ہوں، یا صرف چیک ان کرنا چاہتے ہوں، میں یہاں ہوں۔ آخری بار بات کرنے کے بعد سے آپ کے ذہن میں کیا ہے، یا کوئی خاص بات ہے جسے آپ آج تلاش کرنا چاہیں گے؟`
          : `میں واقعی خوش ہوں کہ آپ یہاں ہیں اور اپنے ذہن میں جو کچھ بھی ہے اسے میرے ساتھ شیئر کرنے کے لیے وقت نکال رہے ہیں۔ ایماندار غور و فکر اور خود شناسی کے لیے جگہ بنانا خود میں قیمتی ہے، چاہے آپ مخصوص چیلنجز سے نمٹ رہے ہوں یا صرف کوئی ایسا شخص چاہتے ہوں جو بغیر فیصلے کے سنے۔ بعض اوقات سب سے اہم گفتگو بالکل وہیں سے شروع ہوتی ہے جہاں آپ اب ہیں، بغیر کسی خاص بحران یا مسئلے کے۔ میں یہاں ہوں جو بھی طریقہ آپ کے لیے سب سے مددگار محسوس ہو۔ حال ہی میں آپ کے خیالات میں کیا چیز ہے، یا کوئی ایسی بات ہے جسے آپ اپنے بارے میں بہتر سمجھنا چاہتے ہیں؟`,
        techniques: ['فعال سننا', 'کھلی تلاش', 'غیر مشروط مثبت نظر', 'خود عکاسی']
      }
    }
  };
  
  const langResponses = responses[language as keyof typeof responses] || responses.en;
  const emotionResponse = langResponses[emotion as keyof typeof langResponses] || langResponses.neutral;
  
  return {
    response: emotionResponse.response,
    techniques: emotionResponse.techniques
  };
}

function generateBasicTherapeuticResponse(language: string): string {
  return language === 'ur' 
    ? 'میں یہاں آپ کی بات سننے اور مدد کرنے کے لیے ہوں۔ آپ کیسا محسوس کر رہے ہیں؟'
    : 'I\'m here to listen and support you. How are you feeling right now?';
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

  // NEW: Superior Therapeutic Chat Endpoint with Advanced Quality Metrics
  app.post('/api/chat/therapeutic-superior', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, message, emotions = [], context = [], language = 'en', sessionContext = {} } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and sessionId are required" });
      }

      console.log('[Superior Therapeutic API] Processing request for user:', userId);
      console.log('[Superior Therapeutic API] Message:', message);
      console.log('[Superior Therapeutic API] Emotions detected:', emotions);

      // Generate superior therapeutic response with quality metrics
      const therapeuticResult = await generateSuperiorTherapeuticResponse(
        message,
        context,
        emotions,
        sessionContext,
        userId
      );

      // Save user message to session
      await mongoStorage.addMessageToEmotionalSession(sessionId, {
        role: 'user',
        content: message,
        emotions: emotions,
        timestamp: new Date().toISOString(),
        language: language
      } as any);

      // Save AI response with quality metrics
      await mongoStorage.addMessageToEmotionalSession(sessionId, {
        role: 'assistant',
        content: therapeuticResult.response,
        model_used: therapeuticResult.model_used,
        quality: therapeuticResult.quality,
        confidence: therapeuticResult.confidence,
        empathy_score: therapeuticResult.empathy_score,
        therapeutic_level: therapeuticResult.therapeutic_level,
        emotion_alignment: therapeuticResult.emotion_alignment,
        context_relevance: therapeuticResult.context_relevance,
        fallback_used: therapeuticResult.fallback_used,
        session_insights: therapeuticResult.session_insights,
        timestamp: therapeuticResult.timestamp
      } as any);

      console.log('[Superior Therapeutic API] Response generated with quality:', therapeuticResult.quality);
      console.log('[Superior Therapeutic API] Empathy score:', therapeuticResult.empathy_score);

      // Return comprehensive response with quality indicators
      res.json({
        response: therapeuticResult.response,
        quality_metrics: {
          overall_quality: therapeuticResult.quality,
          confidence: therapeuticResult.confidence,
          empathy_score: therapeuticResult.empathy_score,
          therapeutic_level: therapeuticResult.therapeutic_level,
          emotion_alignment: therapeuticResult.emotion_alignment,
          context_relevance: therapeuticResult.context_relevance
        },
        model_info: {
          model_used: therapeuticResult.model_used,
          fallback_used: therapeuticResult.fallback_used,
          timestamp: therapeuticResult.timestamp
        },
        session_insights: therapeuticResult.session_insights,
        status: 'success'
      });

    } catch (error) {
      console.error('[Superior Therapeutic API] Error:', error);
      res.status(500).json({ 
        message: "Failed to generate superior therapeutic response",
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
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
          setTimeout(() => reject(new Error('Chat mode timeout (18s)')), 18000)
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
      
      // **UPDATED**: Use Superior Therapeutic Model for response generation
      console.log('🧠 Generating response using Superior Therapeutic Model...');
      
      let chatResponse = '';
      let qualityMetrics = {};
      let modelInfo = {};
      let sessionInsights = {};
      
      try {
        // Generate superior therapeutic response
        const therapeuticResult = await generateSuperiorTherapeuticResponse(
          processedMessage,
          [], // context (empty for new sessions)
          [detectedEmotion], // emotions detected
          { sessionId: sessionId || 'test-session', mode: 'chat-text' },
          'test-user'
        );
        
        chatResponse = therapeuticResult.response;
        qualityMetrics = {
          overall_quality: therapeuticResult.quality,
          confidence: therapeuticResult.confidence,
          empathy_score: therapeuticResult.empathy_score,
          therapeutic_level: therapeuticResult.therapeutic_level,
          emotion_alignment: therapeuticResult.emotion_alignment,
          context_relevance: therapeuticResult.context_relevance
        };
        modelInfo = {
          model_used: therapeuticResult.model_used,
          fallback_used: therapeuticResult.fallback_used,
          timestamp: therapeuticResult.timestamp
        };
        sessionInsights = therapeuticResult.session_insights;
        
        console.log('✅ Superior therapeutic response generated successfully');
        console.log('🎯 Quality score:', therapeuticResult.quality);
        console.log('❤️ Empathy score:', therapeuticResult.empathy_score);
        
      } catch (error) {
        console.error('❌ Superior therapeutic model failed, using fallback:', error);
        
        // Fallback to basic emotion-based responses (original logic)
        switch (detectedEmotion) {
          case 'stress':
          case 'anxiety':
          case 'nervousness':
            chatResponse = "I can sense you might be feeling stressed or anxious. That's completely understandable. Take a deep breath with me. What's been weighing on your mind?";
            break;
          case 'sadness':
          case 'disappointment':
          case 'grief':
            chatResponse = "I hear that you're going through a difficult time. It's okay to feel sad or disappointed sometimes. Would you like to share what's been troubling you?";
            break;
          case 'anger':
          case 'annoyance':
          case 'frustration':
            chatResponse = "I understand you're feeling frustrated or angry. Those feelings are completely valid. What's been causing these intense feelings?";
            break;
          default:
            chatResponse = "Thank you for sharing that with me. I'm here to listen and support you. How are you feeling right now?";
        }
        
        modelInfo = { model_used: 'basic-fallback', fallback_used: true };
      }
      
      // Return enhanced chat response with therapeutic model data
      res.json({
        success: true,
        userMessage: processedMessage,
        detectedEmotion: detectedEmotion,
        confidence: confidence,
        chatResponse: chatResponse,
        
        // **NEW**: Superior therapeutic model information
        quality_metrics: qualityMetrics,
        model_info: modelInfo,
        session_insights: sessionInsights,
        
        // Original fields
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'test-session',
        language: language || 'en',
        mode: 'chat-text-therapeutic', // Updated mode name
        sttUsed: false,
        emotionMethod: emotionMethod
      });
      
    } catch (error) {
      console.error('Chat test endpoint error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        mode: 'chat-text'
      });
    }
  });

  // Test endpoint for Superior Therapeutic Model (no auth required)
  app.post('/api/test-superior-therapeutic', async (req: Request, res: Response) => {
    try {
      const { message, emotions = [], context = [], language = 'en', sessionContext = {} } = req.body;
      
      console.log('\n=== SUPERIOR THERAPEUTIC TEST ===');
      console.log('Received message:', message);
      console.log('Emotions:', emotions);
      console.log('Context length:', context.length);
      console.log('Language:', language);
      
      // Validate input
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          error: 'No message provided',
          received: message 
        });
      }

      // Generate superior therapeutic response
      const therapeuticResult = await generateSuperiorTherapeuticResponse(
        message,
        context,
        emotions,
        sessionContext,
        'test-user'
      );

      console.log('✅ Superior therapeutic response generated');
      console.log('Response preview:', therapeuticResult.response.substring(0, 100) + '...');
      console.log('Quality metrics:', {
        quality: therapeuticResult.quality,
        empathy_score: therapeuticResult.empathy_score,
        therapeutic_level: therapeuticResult.therapeutic_level
      });

      // Return comprehensive test response
      res.json({
        message: 'Superior therapeutic response generated successfully',
        response: therapeuticResult.response,
        quality_metrics: {
          overall_quality: therapeuticResult.quality,
          confidence: therapeuticResult.confidence,
          empathy_score: therapeuticResult.empathy_score,
          therapeutic_level: therapeuticResult.therapeutic_level,
          emotion_alignment: therapeuticResult.emotion_alignment,
          context_relevance: therapeuticResult.context_relevance
        },
        model_info: {
          model_used: therapeuticResult.model_used,
          fallback_used: therapeuticResult.fallback_used,
          timestamp: therapeuticResult.timestamp
        },
        session_insights: therapeuticResult.session_insights,
        test_info: {
          endpoint: 'test-superior-therapeutic',
          input_message_length: message.length,
          emotions_detected: emotions,
          context_items: context.length,
          language: language
        },
        status: 'success'
      });

    } catch (error) {
      console.error('Superior therapeutic test endpoint error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        mode: 'superior-therapeutic-test',
        details: {
          stack: error instanceof Error ? error.stack : undefined,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // Enhanced Emotional Support Endpoint with Advanced Conversational Therapy AI
  app.post('/api/emotional-support-enhanced', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const { 
        mode, 
        language, 
        history, 
        sessionId, 
        userContext,
        enableAvatar = true,
        enableTTS = true 
      } = req.body;
      
      let text = req.body.text;
      let audioPath: string | null = null;
      
      console.log('🧠 Enhanced Therapy AI: Processing request');
      console.log('📊 Mode:', mode, 'Language:', language, 'Avatar:', enableAvatar);

      // Handle voice mode with advanced audio processing
      if (mode === 'voice' && req.file) {
        try {
          console.log('🎙️ Processing audio file:', req.file.size, 'bytes');
          const audioBuffer = req.file.buffer;
          
          if (!validateAudioBuffer(audioBuffer)) {
            throw new Error('Invalid audio file format or size');
          }
          
          // Save audio for emotion analysis
          const tempDir = path.join(process.cwd(), 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);
          fs.writeFileSync(audioPath, audioBuffer);
          
          const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
          
          try {
            text = await transcribeAudio(audioBuffer, whisperLanguage);
            console.log('✅ Speech-to-text successful:', text?.length, 'characters');
          } catch (sttError) {
            console.warn('⚠️ Primary STT failed, using fallback:', sttError);
            text = await simpleTranscribeAudio(audioBuffer, whisperLanguage);
          }
        } catch (audioError) {
          console.warn('❌ Audio processing failed:', audioError);
          text = req.body.text || 'Voice input received but processing failed';
        }
      }

      // Ensure we have text to work with
      if (!text || text.trim().length === 0) {
        text = mode === 'voice' 
          ? 'I received your voice message and I\'m here to listen.' 
          : 'Hello, I\'m here to support you. How are you feeling today?';
      }

      console.log('📝 Processed text:', text.substring(0, 100) + '...');

      // Enhanced emotion detection with therapeutic context
      let emotionResult;
      const detectionLanguage = language?.startsWith('ur') ? 'ur' : 'en';
      
      if (mode === 'voice' && audioPath && fs.existsSync(audioPath)) {
        console.log('🎯 Running combined emotion detection (text + voice)...');
        try {
          const combinedResult = await detectCombinedEmotion(text, audioPath, detectionLanguage);
          emotionResult = {
            emotion: combinedResult.combined.emotion,
            confidence: combinedResult.combined.confidence,
            textEmotion: combinedResult.text.emotion,
            voiceEmotion: combinedResult.voice.emotion,
            method: 'combined',
            rawData: combinedResult
          };
        } catch (emotionError) {
          console.warn('⚠️ Combined emotion detection failed, using text-only:', emotionError);
          const textResult = await detectEmotionFromText(text, detectionLanguage);
          emotionResult = {
            emotion: textResult.emotion,
            confidence: textResult.confidence,
            method: 'text-fallback'
          };
        }
        
        // Clean up temp audio file
        try {
          fs.unlinkSync(audioPath);
        } catch (cleanupError) {
          console.warn('⚠️ Failed to clean up temp audio file:', cleanupError);
        }
      } else {
        console.log('📊 Running text emotion detection...');
        const textResult = await detectEmotionFromText(text, detectionLanguage);
        emotionResult = {
          emotion: textResult.emotion,
          confidence: textResult.confidence,
          method: 'text-only'
        };
      }

      console.log('🎭 Emotion detected:', emotionResult.emotion, 'confidence:', emotionResult.confidence);

      // Parse conversation history for context
      let conversationHistory: ConversationHistory[] = [];
      try {
        if (history) {
          const parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
          conversationHistory = Array.isArray(parsedHistory) ? parsedHistory.slice(-10) : []; // Keep last 10 exchanges
          console.log('💭 Conversation history loaded:', conversationHistory.length, 'items');
        }
      } catch (historyError) {
        console.warn('⚠️ Failed to parse conversation history:', historyError);
        conversationHistory = [];
      }

      // Parse user context
      let parsedUserContext = {};
      try {
        if (userContext) {
          parsedUserContext = typeof userContext === 'string' ? JSON.parse(userContext) : userContext;
        }
      } catch (contextError) {
        console.warn('⚠️ Failed to parse user context:', contextError);
      }

      // Create enhanced request
      const enhancedRequest: EnhancedResponseRequest = {
        text,
        emotion: emotionResult.emotion,
        language: detectionLanguage,
        history: conversationHistory,
        userContext: parsedUserContext,
        sessionContext: {
          sessionId: sessionId || `session_${Date.now()}`,
          sessionStart: Date.now(),
          mode: mode || 'text',
          avatar: enableAvatar
        }
      };

      // Generate enhanced therapeutic response
      try {
        console.log('🚀 Generating enhanced therapeutic response...');
        const responseResult: EnhancedResponseResult = await generateEnhancedConversationalResponse(enhancedRequest);
        
        console.log('✅ Enhanced response generated successfully');
        console.log('🎵 TTS available:', !!responseResult.audioBase64);
        console.log('🧠 Therapeutic techniques:', responseResult.therapeuticTechniques?.join(', '));

        // Prepare response with all enhanced features
        const fullResponse = {
          // Core response data
          transcription: text,
          response: responseResult.response,
          emotion: responseResult.emotion,
          confidence: responseResult.confidence,
          
          // Enhanced features
          contextAnalysis: responseResult.contextAnalysis,
          therapeuticTechniques: responseResult.therapeuticTechniques,
          conversationFlow: responseResult.conversationFlow,
          
          // Audio/Avatar support
          audioBase64: enableTTS ? responseResult.audioBase64 : undefined,
          avatarSupported: enableAvatar,
          
          // Metadata
          mode: mode || 'text',
          language: detectionLanguage,
          sessionId: enhancedRequest.sessionContext?.sessionId,
          emotionDetails: emotionResult,
          
          // Processing information
          processingTime: responseResult.metadata?.processingTime,
          model: responseResult.metadata?.model,
          features: responseResult.metadata?.features,
          historyLength: conversationHistory.length,
          
          // Success indicators
          enhanced: true,
          conversational: true,
          therapeutic: true
        };

        res.json(fullResponse);

      } catch (enhancedError) {
        console.warn('❌ Enhanced response failed, using intelligent fallback:', enhancedError);
        
        // Intelligent fallback with therapeutic principles
        const fallbackResponse = generateIntelligentTherapeuticFallback(
          text, 
          emotionResult.emotion, 
          detectionLanguage,
          conversationHistory
        );

        res.json({
          transcription: text,
          response: fallbackResponse.response,
          emotion: emotionResult.emotion,
          confidence: emotionResult.confidence,
          mode: mode || 'text',
          language: detectionLanguage,
          emotionDetails: emotionResult,
          therapeuticTechniques: fallbackResponse.techniques,
          enhanced: false,
          conversational: true,
          therapeutic: true,
          fallbackUsed: true,
          fallbackReason: enhancedError instanceof Error ? enhancedError.message : 'Enhanced processing failed'
        });
      }

    } catch (error) {
      console.error("❌ Enhanced emotional support processing failed:", error);
      res.status(500).json({ 
        error: 'Enhanced processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: generateBasicTherapeuticResponse('en') // Always provide some therapeutic response
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
        
        // Also get text emotion with context for voice mode
        console.log('🔄 Calling detectEmotionFromText for context extraction...');
        const textWithContext = await detectEmotionFromText(text, detectionLanguage);
        
        emotionResult = {
          emotion: combinedResult.combined.emotion,
          confidence: combinedResult.combined.confidence,
          text_emotion: combinedResult.text.emotion,
          voice_emotion: combinedResult.voice.emotion,
          context: textWithContext.context || [],
          method: 'combined'
        };
        
        console.log(`📊 Combined emotion with context: ${emotionResult.emotion} (${emotionResult.confidence.toFixed(3)}) - Context: [${emotionResult.context.join(', ') || 'no context'}]`);
        
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
          context: textResult.context || [],
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
