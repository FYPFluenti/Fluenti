import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { mongoStorage } from "./mongoStorage";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { extractAndValidateJWT, tokenBasedAuth } from "./middleware";
import { authRateLimiter, refreshTokenRateLimiter, passwordResetRateLimiter } from "./middleware/rateLimiter";
import { verifyRefreshToken, TOKEN_EXPIRY } from "./services/jwtService";
import * as speechServiceModule from "./services/speechService";
const { SpeechService, transcribeAudio } = speechServiceModule;
import { simpleTranscribeAudio, validateAudioBuffer } from "./services/simpleSpeechService";
import { generateSmartTTS } from "./services/enhancedTTSService";



import { fastTranscribeAudio } from "./services/fastSTTService";
import Groq from 'groq-sdk';

// Initialize Groq client for AI title generation
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

import { AuthService } from "./auth";


// Interface for therapy session history
interface TherapySession {
  id: string;
  type: 'support' | 'therapy';
  title: string;
  date: Date | string;
  duration: string;
  mood: string;
  notes: string;
  messages?: any[];
  riskLevel?: string;
  score?: number;
  accuracy?: number;
}

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
  
  // Add JWT validation middleware for all routes
  app.use(extractAndValidateJWT);

  // ✅ Health check endpoint (no auth required)
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: Date.now(),
      uptime: process.uptime(),
      message: 'Server is running'
    });
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
          userType: 'child', // Can be 'adult', 'child', 
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
    // User login endpoint with rate limiting
    app.post('/api/auth/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }
        
        // Authenticate user and get JWT tokens
        const authResponse = await AuthService.login({ email, password });
        
        console.log('User logged in:', authResponse.user.id, authResponse.user.userType);
        
        // Set httpOnly cookies for tokens
        res.cookie('accessToken', authResponse.tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS,
        });
        
        res.cookie('refreshToken', authResponse.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
        });
        
        // Return user data (tokens are in httpOnly cookies)
        res.json({ 
          success: true, 
          user: authResponse.user
        });
      } catch (error: any) {
        console.error("Login error:", error.message);
        res.status(401).json({ message: error.message });
      }
    });
    
    // User signup endpoint with rate limiting
    app.post('/api/auth/signup', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
      try {
        console.log('Signup request received:', req.body);
        const { firstName, lastName, email, password, userType, language } = req.body;
        
        if (!firstName || !lastName || !email || !password || !userType || !language) {
          console.log('Missing required fields');
          return res.status(400).json({ success: false, message: "All fields are required" });
        }
        
        // Create new user and get JWT tokens
        console.log('Creating user with AuthService...');
        const authResponse = await AuthService.signup({
          firstName,
          lastName,
          email,
          password,
          userType,
          language
        });
        
        console.log('User created successfully:', authResponse.user.id, authResponse.user.userType);
        
        // Set httpOnly cookies for tokens
        res.cookie('accessToken', authResponse.tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS,
        });
        
        res.cookie('refreshToken', authResponse.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
        });
        
        console.log('Sending success response');
        // Return user data (tokens are in httpOnly cookies)
        res.json({ 
          success: true, 
          user: authResponse.user
        });
      } catch (error: any) {
        console.error("Signup error:", error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Logout endpoint
    app.post('/api/auth/logout', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        
        if (userId) {
          // Invalidate refresh token in database
          await AuthService.logout(userId);
        }
        
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        res.json({ success: true, message: 'Logged out successfully' });
      } catch (error: any) {
        console.error("Logout error:", error.message);
        res.status(500).json({ message: 'Logout failed' });
      }
    });

    // Refresh token endpoint
    app.post('/api/auth/refresh', refreshTokenRateLimiter, async (req: Request, res: Response) => {
      try {
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
          return res.status(401).json({ message: 'Refresh token not found' });
        }
        
        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        
        // Get new token pair
        const tokens = await AuthService.refreshAccessToken(payload.userId, refreshToken);
        
        // Set new cookies
        res.cookie('accessToken', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS,
        });
        
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
        });
        
        res.json({ success: true, message: 'Token refreshed successfully' });
      } catch (error: any) {
        console.error("Token refresh error:", error.message);
        // Clear invalid cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(401).json({ message: 'Token refresh failed' });
      }
    });

    // Email verification endpoint
    app.get('/api/auth/verify-email', async (req: Request, res: Response) => {
      try {
        const { token } = req.query;
        
        if (!token || typeof token !== 'string') {
          return res.status(400).json({ message: 'Verification token is required' });
        }
        
        const result = await AuthService.verifyEmail(token);
        res.json(result);
      } catch (error: any) {
        console.error('Email verification error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Resend verification email endpoint
    app.post('/api/auth/resend-verification', authRateLimiter, async (req: Request, res: Response) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ message: 'Email is required' });
        }
        
        const result = await AuthService.resendVerificationEmail(email);
        res.json(result);
      } catch (error: any) {
        console.error('Resend verification error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Request password reset endpoint
    app.post('/api/auth/forgot-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ message: 'Email is required' });
        }
        
        const result = await AuthService.requestPasswordReset(email);
        res.json(result);
      } catch (error: any) {
        console.error('Password reset request error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to process password reset request' });
      }
    });

    // Reset password with token endpoint
    app.post('/api/auth/reset-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
      try {
        const { token, password } = req.body;
        
        if (!token || !password) {
          return res.status(400).json({ message: 'Token and new password are required' });
        }
        
        if (password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        const result = await AuthService.resetPassword(token, password);
        res.json(result);
      } catch (error: any) {
        console.error('Password reset error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // ===== 2FA Endpoints =====

    // Setup 2FA
    app.post('/api/auth/2fa/setup', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const result = await AuthService.setup2FA(userId);
        res.json(result);
      } catch (error: any) {
        console.error('2FA setup error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Verify and enable 2FA
    app.post('/api/auth/2fa/verify', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const { token } = req.body;
        if (!token) {
          return res.status(400).json({ message: 'Verification code is required' });
        }
        
        const result = await AuthService.verify2FA(userId, token);
        res.json(result);
      } catch (error: any) {
        console.error('2FA verification error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Disable 2FA
    app.post('/api/auth/2fa/disable', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const { password } = req.body;
        if (!password) {
          return res.status(400).json({ message: 'Password is required to disable 2FA' });
        }
        
        const result = await AuthService.disable2FA(userId, password);
        res.json(result);
      } catch (error: any) {
        console.error('2FA disable error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Verify 2FA code during login
    app.post('/api/auth/2fa/verify-login', authRateLimiter, async (req: Request, res: Response) => {
      try {
        const { userId, token, isBackupCode } = req.body;
        
        if (!userId || !token) {
          return res.status(400).json({ message: 'User ID and token are required' });
        }
        
        const isValid = await AuthService.verify2FALogin(userId, token, isBackupCode);
        
        if (!isValid) {
          return res.status(401).json({ success: false, message: 'Invalid verification code' });
        }
        
        res.json({ success: true, message: 'Verification successful' });
      } catch (error: any) {
        console.error('2FA login verification error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Check 2FA status
    app.get('/api/auth/2fa/status', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const enabled = await AuthService.has2FAEnabled(userId);
        res.json({ enabled });
      } catch (error: any) {
        console.error('2FA status error:', error.message);
        res.status(500).json({ message: 'Failed to check 2FA status' });
      }
    });

    // Regenerate backup codes
    app.post('/api/auth/2fa/regenerate-backup-codes', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const { password } = req.body;
        if (!password) {
          return res.status(400).json({ message: 'Password is required' });
        }
        
        const result = await AuthService.regenerateBackupCodes(userId, password);
        res.json(result);
      } catch (error: any) {
        console.error('Backup codes regeneration error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Onboarding endpoints
    app.get('/api/onboarding', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        // Import ChildOnboarding model
        const { ChildOnboarding } = await import('./models');
        
        const onboardingData = await ChildOnboarding.findOne({ userId });
        
        if (!onboardingData) {
          return res.json(null);
        }
        
        res.json(onboardingData.toObject());
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
        res.status(500).json({ message: "Failed to fetch onboarding data" });
      }
    });

    app.post('/api/onboarding', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const { 
          parentBirthYear,
          childBirthYear,
          childName,
          childGender,
          childBirthDate,
          interests,
          vocabularyLevel,
          seekingSpeechTherapy,
          hasBeenEvaluated,
          assessmentResponses,
          evaluationBooking,
          isCompleted,
          currentStep
        } = req.body;

        // Import models
        const { ChildOnboarding } = await import('./models');
        const { v4: uuidv4 } = await import('uuid');
        
        // Find existing or create new onboarding record
        let onboardingRecord = await ChildOnboarding.findOne({ userId });
        
        if (!onboardingRecord) {
          onboardingRecord = new ChildOnboarding({
            id: uuidv4(),
            userId
          });
        }

        // Update fields that are provided
        if (parentBirthYear !== undefined) onboardingRecord.parentBirthYear = parentBirthYear;
        if (childBirthYear !== undefined) onboardingRecord.childBirthYear = childBirthYear;
        if (childName !== undefined) onboardingRecord.childName = childName;
        if (childGender !== undefined) onboardingRecord.childGender = childGender;
        if (childBirthDate !== undefined) {
          onboardingRecord.childBirthDate = new Date(childBirthDate);
          // Automatically extract and save birth year from date if not already set
          if (!childBirthYear) {
            onboardingRecord.childBirthYear = new Date(childBirthDate).getFullYear();
          }
        }
        if (interests !== undefined) onboardingRecord.interests = interests;
        if (vocabularyLevel !== undefined) onboardingRecord.vocabularyLevel = vocabularyLevel;
        if (seekingSpeechTherapy !== undefined) onboardingRecord.seekingSpeechTherapy = seekingSpeechTherapy;
        if (hasBeenEvaluated !== undefined) onboardingRecord.hasBeenEvaluated = hasBeenEvaluated;
        if (isCompleted !== undefined) onboardingRecord.isCompleted = isCompleted;
        if (currentStep !== undefined) onboardingRecord.currentStep = currentStep;
        
        // Handle assessment responses
        if (assessmentResponses) {
          if (!onboardingRecord.assessmentResponses) {
            onboardingRecord.assessmentResponses = {};
          }
          
          if (assessmentResponses.hearing) {
            onboardingRecord.assessmentResponses.hearing = assessmentResponses.hearing;
          }
          if (assessmentResponses.pragmatics) {
            onboardingRecord.assessmentResponses.pragmatics = assessmentResponses.pragmatics;
          }
          if (assessmentResponses.play) {
            onboardingRecord.assessmentResponses.play = assessmentResponses.play;
          }
          if (assessmentResponses.comprehension) {
            onboardingRecord.assessmentResponses.comprehension = assessmentResponses.comprehension;
          }
        }
        
        // Handle evaluation booking
        if (evaluationBooking) {
          onboardingRecord.evaluationBooking = {
            selectedDate: evaluationBooking.selectedDate ? new Date(evaluationBooking.selectedDate) : undefined,
            selectedTime: evaluationBooking.selectedTime,
            timezone: evaluationBooking.timezone || 'Pakistan Standard Time (GMT+5)'
          };
        }
        
        onboardingRecord.updatedAt = new Date();
        
        await onboardingRecord.save();
        
        res.json({ success: true, data: onboardingRecord.toObject() });
      } catch (error) {
        console.error("Error saving onboarding data:", error);
        res.status(500).json({ message: "Failed to save onboarding data" });
      }
    });

    // Check if user has completed onboarding
    app.get('/api/onboarding/status', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const { ChildOnboarding } = await import('./models');
        
        const onboardingData = await ChildOnboarding.findOne({ userId });
        
        const isCompleted = onboardingData ? onboardingData.isCompleted : false;
        const currentStep = onboardingData ? onboardingData.currentStep : 1;
        
        res.json({ 
          isCompleted, 
          currentStep,
          hasStarted: !!onboardingData
        });
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        res.status(500).json({ message: "Failed to check onboarding status" });
      }
    });

    // Get all onboarding data (admin endpoint)
    app.get('/api/admin/onboarding/all', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { ChildOnboarding } = await import('./models');
        
        const allOnboarding = await ChildOnboarding.find({})
          .sort({ createdAt: -1 })
          .lean();
        
        res.json({ success: true, data: allOnboarding, count: allOnboarding.length });
      } catch (error) {
        console.error("Error fetching all onboarding data:", error);
        res.status(500).json({ message: "Failed to fetch onboarding data" });
      }
    });

    // Get onboarding statistics (admin endpoint)
    app.get('/api/admin/onboarding/statistics', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { ChildOnboarding } = await import('./models');
        
        const allOnboarding = await ChildOnboarding.find({}).lean();
        
        // Calculate statistics
        const totalOnboardings = allOnboarding.length;
        const completedOnboardings = allOnboarding.filter(o => o.isCompleted).length;
        const inProgressOnboardings = totalOnboardings - completedOnboardings;
        const completionRate = totalOnboardings > 0 ? (completedOnboardings / totalOnboardings) * 100 : 0;
        
        // Calculate average step progress
        const avgStep = totalOnboardings > 0 
          ? allOnboarding.reduce((sum, o) => sum + (o.currentStep || 1), 0) / totalOnboardings 
          : 0;
        
        // Interest distribution
        const interestCounts: Record<string, number> = {};
        allOnboarding.forEach(o => {
          if (o.interests && Array.isArray(o.interests)) {
            o.interests.forEach((interest: string) => {
              interestCounts[interest] = (interestCounts[interest] || 0) + 1;
            });
          }
        });
        
        // Gender distribution
        const genderCounts = {
          girl: allOnboarding.filter(o => o.childGender === 'girl').length,
          boy: allOnboarding.filter(o => o.childGender === 'boy').length,
          unspecified: allOnboarding.filter(o => !o.childGender).length
        };
        
        // Vocabulary level distribution
        const vocabularyCounts: Record<string, number> = {};
        allOnboarding.forEach(o => {
          if (o.vocabularyLevel) {
            vocabularyCounts[o.vocabularyLevel] = (vocabularyCounts[o.vocabularyLevel] || 0) + 1;
          }
        });
        
        // Speech therapy interest
        const seekingTherapy = allOnboarding.filter(o => o.seekingSpeechTherapy === true).length;
        const notSeekingTherapy = allOnboarding.filter(o => o.seekingSpeechTherapy === false).length;
        
        // Assessment completion by category
        const assessmentStats = {
          hearing: allOnboarding.filter(o => o.assessmentResponses?.hearing?.length > 0).length,
          pragmatics: allOnboarding.filter(o => o.assessmentResponses?.pragmatics?.length > 0).length,
          play: allOnboarding.filter(o => o.assessmentResponses?.play?.length > 0).length,
          comprehension: allOnboarding.filter(o => o.assessmentResponses?.comprehension?.length > 0).length
        };
        
        res.json({
          success: true,
          statistics: {
            overview: {
              total: totalOnboardings,
              completed: completedOnboardings,
              inProgress: inProgressOnboardings,
              completionRate: Math.round(completionRate * 10) / 10,
              averageStep: Math.round(avgStep * 10) / 10
            },
            demographics: {
              gender: genderCounts,
              interests: interestCounts,
              vocabularyLevels: vocabularyCounts
            },
            therapy: {
              seekingTherapy,
              notSeekingTherapy,
              percentage: totalOnboardings > 0 ? Math.round((seekingTherapy / totalOnboardings) * 100) : 0
            },
            assessments: assessmentStats
          }
        });
      } catch (error) {
        console.error("Error fetching onboarding statistics:", error);
        res.status(500).json({ message: "Failed to fetch statistics" });
      }
    });

    // Export onboarding data as CSV
    app.get('/api/admin/onboarding/export', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { ChildOnboarding } = await import('./models');
        
        const allOnboarding = await ChildOnboarding.find({}).lean();
        
        // Create CSV header
        const csvHeader = [
          'User ID',
          'Child Name',
          'Child Gender',
          'Parent Birth Year',
          'Child Birth Year',
          'Interests',
          'Vocabulary Level',
          'Seeking Therapy',
          'Has Been Evaluated',
          'Is Completed',
          'Current Step',
          'Created At',
          'Updated At'
        ].join(',');
        
        // Create CSV rows
        const csvRows = allOnboarding.map(o => [
          o.userId,
          o.childName || '',
          o.childGender || '',
          o.parentBirthYear || '',
          o.childBirthYear || '',
          (o.interests || []).join(';'),
          o.vocabularyLevel || '',
          o.seekingSpeechTherapy ? 'Yes' : 'No',
          o.hasBeenEvaluated ? 'Yes' : 'No',
          o.isCompleted ? 'Yes' : 'No',
          o.currentStep || 1,
          o.createdAt,
          o.updatedAt
        ].map(field => `"${field}"`).join(','));
        
        const csv = [csvHeader, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=onboarding-data.csv');
        res.send(csv);
      } catch (error) {
        console.error("Error exporting onboarding data:", error);
        res.status(500).json({ message: "Failed to export data" });
      }
    });

  }

  // OpenAI Assessment Routes
  const { OpenAIAssessmentService } = await import('./services/openaiAssessment');

  // Health check for assessment service
  app.get('/api/assessment/health', (req: Request, res: Response) => {
    const isAvailable = OpenAIAssessmentService.isAvailable();
    res.json({ 
      status: isAvailable ? 'available' : 'unavailable',
      hasOpenAIKey: !!process.env.OPENAI_API_KEY 
    });
  });

  // Analyze individual category
  app.post('/api/assessment/analyze-category', async (req: Request, res: Response) => {
    try {
      const { categoryName, responses, childAge, childName } = req.body;

      if (!categoryName || !responses || !childAge) {
        return res.status(400).json({ 
          error: 'Missing required fields: categoryName, responses, and childAge are required' 
        });
      }

      if (!OpenAIAssessmentService.isAvailable()) {
        return res.status(503).json({ 
          error: 'OpenAI service is not available. Please check API key configuration.' 
        });
      }

      const analysis = await OpenAIAssessmentService.analyzeCategoryWithAI(
        categoryName,
        responses,
        childAge,
        childName
      );

      res.json({ success: true, analysis });

    } catch (error) {
      console.error('Error in analyze-category endpoint:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to analyze category' 
      });
    }
  });

  // Generate overall assessment
  app.post('/api/assessment/overall-assessment', async (req: Request, res: Response) => {
    try {
      const { categoryAnalyses, childAge, childName, totalQuestions } = req.body;

      if (!categoryAnalyses || !childAge) {
        return res.status(400).json({ 
          error: 'Missing required fields: categoryAnalyses and childAge are required' 
        });
      }

      if (!OpenAIAssessmentService.isAvailable()) {
        return res.status(503).json({ 
          error: 'OpenAI service is not available. Please check API key configuration.' 
        });
      }

      const assessment = await OpenAIAssessmentService.generateOverallAssessment(
        categoryAnalyses,
        childAge,
        childName,
        totalQuestions
      );

      res.json({ success: true, assessment });

    } catch (error) {
      console.error('Error in overall-assessment endpoint:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate overall assessment' 
      });
    }
  });

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

  // Groq Speech Recognition Routes removed - unused endpoints



  // Pure STT endpoint (NO therapy processing - just transcription)
  app.post('/api/speech/transcribe-only', tokenBasedAuth, upload.single('audio'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetWord, language = 'en' } = req.body;

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No audio file provided' 
        });
      }

      console.log('🎤 Pure STT request - Target word:', targetWord);
      console.log('📁 Audio file size:', req.file.size, 'bytes');
      
      const audioBuffer = req.file.buffer;
      
      // Validate audio buffer first
      if (!validateAudioBuffer(audioBuffer)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid audio file format or size' 
        });
      }
      
      const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
      let transcribedText = '';
      let method = '';
      
      try {
        // Use the same reliable STT chain as emotional support (but WITHOUT therapy)
        console.log('🔄 Attempting fast STT...');
        transcribedText = await fastTranscribeAudio(audioBuffer, whisperLanguage);
        method = 'fast_stt';
        console.log('✅ Fast STT successful:', transcribedText);
      } catch (fastSTTError) {
        console.warn('⚠️ Fast STT failed, trying local Whisper:', fastSTTError);
        try {
          transcribedText = await transcribeAudio(audioBuffer, whisperLanguage);
          method = 'local_whisper';
          console.log('✅ Local Whisper successful:', transcribedText);
        } catch (sttError) {
          console.warn('⚠️ Local Whisper failed, using simple STT:', sttError);
          try {
            transcribedText = await simpleTranscribeAudio(audioBuffer, whisperLanguage);
            method = 'simple_stt';
            console.log('✅ Simple STT successful:', transcribedText);
          } catch (finalError) {
            console.error('❌ All STT methods failed:', finalError);
            return res.status(500).json({ 
              success: false,
              error: 'All transcription methods failed',
              details: finalError instanceof Error ? finalError.message : 'Unknown error'
            });
          }
        }
      }

      // Return ONLY transcription data (no therapy processing)
      res.json({ 
        success: true,
        transcription: transcribedText || '',
        method: method,
        targetWord: targetWord,
        language: language,
        confidence: 0.9 // Server-side STT is generally reliable
      });

    } catch (error) {
      console.error("❌ Pure STT error:", error);
      res.status(500).json({ 
        success: false,
        error: 'STT processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Story Game Progress Routes
  app.get('/api/story-game/progress', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { StoryGameProgress } = await import('./models');
      const { v4: uuidv4 } = await import('uuid');
      
      let progress = await StoryGameProgress.findOne({ userId });
      
      // If no progress exists, create a new one
      if (!progress) {
        progress = new StoryGameProgress({
          id: uuidv4(),
          userId,
          hasCompletedInitialSetup: false,
          selectedTherapyType: null,
          assessments: {},
          currentLevels: {
            pronunciation: 1,
            fluency: 1,
            dld: 1,
            social: 1
          },
          totalGamesPlayed: 0,
          totalStoriesCompleted: 0,
          totalChallengesCompleted: 0,
          highestScore: 0,
          badgesEarned: {
            pronunciation: [],
            fluency: [],
            dld: [],
            social: []
          },
          therapyStats: {
            pronunciation: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
            fluency: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
            dld: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
            social: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 }
          }
        });
        await progress.save();
      }
      
      // Ensure currentLevels exists (for legacy records that might not have it)
      const progressObj = progress.toObject();
      if (!progressObj.currentLevels) {
        progressObj.currentLevels = {
          pronunciation: 1,
          fluency: 1,
          dld: 1,
          social: 1
        };
      }
      
      // Ensure assessments exists
      if (!progressObj.assessments) {
        progressObj.assessments = {};
      }
      
      // Ensure badgesEarned structure exists (migrate legacy format)
      if (!progressObj.badgesEarned || Array.isArray(progressObj.badgesEarned)) {
        progressObj.badgesEarned = {
          pronunciation: Array.isArray(progressObj.badgesEarned) ? progressObj.badgesEarned : [],
          fluency: [],
          dld: [],
          social: []
        };
      }
      
      // Ensure therapyStats exists
      if (!progressObj.therapyStats) {
        progressObj.therapyStats = {
          pronunciation: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
          fluency: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
          dld: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
          social: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 }
        };
      }
      
      res.json(progressObj);
    } catch (error) {
      console.error("Error fetching story game progress:", error);
      res.status(500).json({ message: "Failed to fetch story game progress" });
    }
  });

  app.post('/api/story-game/progress', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { StoryGameProgress } = await import('./models');
      const { v4: uuidv4 } = await import('uuid');
      
      const {
        hasCompletedInitialSetup,
        selectedTherapyType,
        assessment,
        currentLevels,
        totalGamesPlayed,
        totalStoriesCompleted,
        totalChallengesCompleted,
        highestScore,
        badgesEarned
      } = req.body;

      let progress = await StoryGameProgress.findOne({ userId });
      
      if (!progress) {
        progress = new StoryGameProgress({
          id: uuidv4(),
          userId
        });
      }

      // CRITICAL: Migrate badgesEarned from legacy array format FIRST
      // Check the raw MongoDB document to see if badgesEarned is actually an array
      // Mongoose might convert it to an object when reading, but MongoDB still has it as an array
      const rawProgressDoc = await StoryGameProgress.findOne({ userId }).lean();
      const rawProgress = rawProgressDoc as any;
      const needsMigration = rawProgress && rawProgress.badgesEarned && Array.isArray(rawProgress.badgesEarned);
      
      if (needsMigration) {
        const legacyBadges = rawProgress.badgesEarned as any[];
        const migratedBadges = {
          pronunciation: selectedTherapyType === 'pronunciation' ? [...legacyBadges] : [],
          fluency: selectedTherapyType === 'fluency' ? [...legacyBadges] : [],
          dld: selectedTherapyType === 'dld' ? [...legacyBadges] : [],
          social: selectedTherapyType === 'social' ? [...legacyBadges] : []
        };
        
        // Use $set alone - it will replace the field regardless of its current type (array or object)
        // Cannot use $unset and $set together on the same field - MongoDB rejects this
        await StoryGameProgress.updateOne(
          { userId },
          { $set: { badgesEarned: migratedBadges } }
        );
        
        // Reload the document to get the updated structure
        progress = await StoryGameProgress.findOne({ userId });
        if (!progress) {
          return res.status(404).json({ message: "Progress not found after migration" });
        }
      }
      
      // Ensure badgesEarned structure exists (initialize if missing)
      if (!progress.badgesEarned || typeof progress.badgesEarned !== 'object' || Array.isArray(progress.badgesEarned)) {
        progress.badgesEarned = {
          pronunciation: [],
          fluency: [],
          dld: [],
          social: []
        };
        progress.markModified('badgesEarned');
      }

      // Update fields
      if (hasCompletedInitialSetup !== undefined) {
        progress.hasCompletedInitialSetup = hasCompletedInitialSetup;
      }
      if (selectedTherapyType !== undefined) {
        progress.selectedTherapyType = selectedTherapyType;
      }
      if (assessment) {
        // assessment should be: { therapyType: 'pronunciation', level: 5, title: '...', feedback: '...' }
        const { therapyType, level, title, feedback } = assessment;
        if (therapyType && ['pronunciation', 'fluency', 'dld', 'social'].includes(therapyType)) {
          progress.assessments[therapyType] = {
            level,
            title,
            feedback,
            completedAt: new Date()
          };
          // Also update current level
          if (level) {
            progress.currentLevels[therapyType] = level;
          }
        }
      }
      if (currentLevels) {
        // Ensure current level never goes below initial assessment level
        const updatedLevels = { ...progress.currentLevels, ...currentLevels };
        (['pronunciation', 'fluency', 'dld', 'social'] as const).forEach((therapyType) => {
          const initialLevel = progress.assessments?.[therapyType]?.level;
          if (initialLevel && updatedLevels[therapyType] < initialLevel) {
            // If current level is below initial assessment level, keep it at initial level
            updatedLevels[therapyType] = initialLevel;
          }
        });
        progress.currentLevels = updatedLevels;
      }
      if (totalGamesPlayed !== undefined) progress.totalGamesPlayed = totalGamesPlayed;
      if (totalStoriesCompleted !== undefined) progress.totalStoriesCompleted = totalStoriesCompleted;
      if (totalChallengesCompleted !== undefined) progress.totalChallengesCompleted = totalChallengesCompleted;
      if (highestScore !== undefined) progress.highestScore = Math.max(progress.highestScore || 0, highestScore);
      
      // Handle badges per therapy type (now safe because badgesEarned is guaranteed to be an object)
      // Use direct MongoDB update to avoid Mongoose trying to do nested updates that might fail
      if (badgesEarned && typeof badgesEarned === 'object' && !Array.isArray(badgesEarned)) {
        // New format: { pronunciation: ['badge1'], fluency: ['badge2'] }
        const badgesUpdate: Record<string, string[]> = {};
        Object.keys(badgesEarned).forEach((therapyType) => {
          if (['pronunciation', 'fluency', 'dld', 'social'].includes(therapyType)) {
            const existingBadges = progress.badgesEarned[therapyType] || [];
            const newBadges = badgesEarned[therapyType] || [];
            badgesUpdate[`badgesEarned.${therapyType}`] = Array.from(new Set([...existingBadges, ...newBadges]));
          }
        });
        if (Object.keys(badgesUpdate).length > 0) {
          await StoryGameProgress.updateOne({ userId }, { $set: badgesUpdate });
          // Reload to get updated badges
          progress = await StoryGameProgress.findOne({ userId });
          if (!progress) {
            return res.status(404).json({ message: "Progress not found after badge update" });
          }
        }
      } else if (Array.isArray(badgesEarned)) {
        // Legacy format in request: ['badge1', 'badge2'] - assign to selected therapy type
        if (selectedTherapyType && ['pronunciation', 'fluency', 'dld', 'social'].includes(selectedTherapyType)) {
          const existingBadges = progress.badgesEarned[selectedTherapyType] || [];
          const updatedBadges = Array.from(new Set([...existingBadges, ...badgesEarned]));
          await StoryGameProgress.updateOne(
            { userId },
            { $set: { [`badgesEarned.${selectedTherapyType}`]: updatedBadges } }
          );
          // Reload to get updated badges
          progress = await StoryGameProgress.findOne({ userId });
          if (!progress) {
            return res.status(404).json({ message: "Progress not found after badge update" });
          }
        }
      }
      
      // Ensure therapyStats structure exists
      if (!progress.therapyStats) {
        progress.therapyStats = {
          pronunciation: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
          fluency: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
          dld: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
          social: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 }
        };
      }

      progress.updatedAt = new Date();
      await progress.save();
      
      res.json(progress.toObject());
    } catch (error) {
      console.error("Error saving story game progress:", error);
      res.status(500).json({ message: "Failed to save story game progress" });
    }
  });

  app.post('/api/story-game/session', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { StoryGameSession, StoryGameProgress } = await import('./models');
      const { v4: uuidv4 } = await import('uuid');
      
      const {
        sessionId,
        therapyType,
        character,
        theme,
        totalScore,
        speechScore,
        creativityScore,
        endingType,
        challengesCompleted,
        levelAtStart,
        levelAtEnd,
        levelUp,
        storyLength,
        wordBank,
        startTime,
        endTime
      } = req.body;

      if (!sessionId || !therapyType) {
        return res.status(400).json({ message: "Missing required fields: sessionId, therapyType" });
      }

      // IMPORTANT: Check if this session was already saved to prevent duplicate counting
      // This can happen if the save was called multiple times before the fix
      const existingSession = await StoryGameSession.findOne({ sessionId });
      if (existingSession) {
        console.log(`⚠️ Session ${sessionId} already exists, skipping duplicate save`);
        return res.json({ success: true, sessionId: existingSession.id, message: 'Session already exists' });
      }

      const duration = endTime && startTime 
        ? Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
        : undefined;

      const session = new StoryGameSession({
        id: uuidv4(),
        userId,
        sessionId,
        therapyType,
        character,
        theme,
        totalScore: totalScore || 0,
        speechScore: speechScore || 0,
        creativityScore: creativityScore || 0,
        endingType,
        challengesCompleted: challengesCompleted || 0,
        levelAtStart,
        levelAtEnd,
        levelUp: levelUp || false,
        storyLength: storyLength || 0,
        wordBank: wordBank || [],
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : new Date(),
        duration
      });

      await session.save();

      // Update progress statistics

      let progress = await StoryGameProgress.findOne({ userId });
      if (progress) {
        progress.totalGamesPlayed = (progress.totalGamesPlayed || 0) + 1;
        if (endingType === 'happy') {
          progress.totalStoriesCompleted = (progress.totalStoriesCompleted || 0) + 1;
        }
        progress.totalChallengesCompleted = (progress.totalChallengesCompleted || 0) + (challengesCompleted || 0);
        if (totalScore) {
          progress.highestScore = Math.max(progress.highestScore || 0, totalScore);
        }
        if (levelAtEnd && therapyType) {
          progress.currentLevels[therapyType] = levelAtEnd;
        }
        
        // Update therapy-specific statistics
        if (therapyType && ['pronunciation', 'fluency', 'dld', 'social'].includes(therapyType)) {
          // Ensure therapyStats structure exists
          if (!progress.therapyStats) {
            progress.therapyStats = {
              pronunciation: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
              fluency: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
              dld: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 },
              social: { totalSessions: 0, totalStoriesCompleted: 0, totalChallengesCompleted: 0, highestScore: 0, averageScore: 0 }
            };
          }
          
          const stats = progress.therapyStats[therapyType];
          stats.totalSessions = (stats.totalSessions || 0) + 1;
          if (endingType === 'happy') {
            stats.totalStoriesCompleted = (stats.totalStoriesCompleted || 0) + 1;
          }
          stats.totalChallengesCompleted = (stats.totalChallengesCompleted || 0) + (challengesCompleted || 0);
          if (totalScore) {
            stats.highestScore = Math.max(stats.highestScore || 0, totalScore);
            // Update average score
            const currentTotal = (stats.averageScore || 0) * (stats.totalSessions - 1);
            stats.averageScore = Math.round((currentTotal + totalScore) / stats.totalSessions);
          }
        }
        
        progress.updatedAt = new Date();
        await progress.save();
      }

      res.json({ success: true, sessionId: session.id });
    } catch (error) {
      console.error("Error saving story game session:", error);
      res.status(500).json({ message: "Failed to save story game session" });
    }
  });

  app.get('/api/story-game/sessions', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { StoryGameSession } = await import('./models');
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const sessions = await StoryGameSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await StoryGameSession.countDocuments({ userId });

      res.json({
        sessions,
        total,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching story game sessions:", error);
      res.status(500).json({ message: "Failed to fetch story game sessions" });
    }
  });

  // Emergency notification endpoint for crisis situations
  app.post('/api/emergency-notification', async (req: Request, res: Response) => {
    try {
      const { 
        user_id, 
        session_id, 
        crisis_level, 
        harm_type, 
        trigger_message, 
        bot_response, 
        conversation_history, 
        timestamp 
      } = req.body;

      console.log(`🚨 EMERGENCY NOTIFICATION - User: ${user_id}, Crisis: ${crisis_level}, Harm: ${harm_type}`);

      // Import nodemailer dynamically
      const nodemailer = await import('nodemailer');

      // Configure email transporter (you'll need to set these environment variables)
      const transporter = nodemailer.default.createTransport({
        service: 'gmail', // or your email service
        auth: {
          user: process.env.EMERGENCY_EMAIL_USER,
          pass: process.env.EMERGENCY_EMAIL_PASS
        }
      });

      // Create email content
      const emailSubject = `🚨 URGENT: Crisis Detection - ${harm_type} (${crisis_level})`;
      const emailBody = `
EMERGENCY ALERT: Crisis Detection System

User ID: ${user_id}
Session ID: ${session_id}
Crisis Level: ${crisis_level}
Harm Type: ${harm_type}
Timestamp: ${timestamp}

TRIGGER MESSAGE:
"${trigger_message}"

BOT RESPONSE:
"${bot_response}"

CONVERSATION HISTORY:
${conversation_history}

Please review this case immediately and take appropriate action.

This is an automated alert from the Fluenti Crisis Detection System.
      `;

      // Send email notification
      const mailOptions = {
        from: process.env.EMERGENCY_EMAIL_USER,
        to: process.env.EMERGENCY_NOTIFICATION_EMAIL || 'admin@fluenti.com',
        subject: emailSubject,
        text: emailBody
      };

      await transporter.sendMail(mailOptions);

      console.log('✅ Emergency notification email sent successfully');

      // Store emergency event in database
      await mongoStorage.saveEmergencyEvent({
        userId: user_id,
        sessionId: session_id,
        crisisLevel: crisis_level,
        harmType: harm_type,
        triggerMessage: trigger_message,
        botResponse: bot_response,
        conversationHistory: conversation_history,
        timestamp: new Date(timestamp),
        notificationSent: true
      });

      res.status(200).json({ success: true, message: 'Emergency notification sent' });

    } catch (error) {
      console.error('❌ Emergency notification error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send emergency notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced emotional support endpoint with therapy service integration
  app.post('/api/emotional-support', tokenBasedAuth, upload.single('audio'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { mode, language, sessionId, userId, history } = req.body;
      let text = req.body.text;

      // Get authenticated user ID
      const authenticatedUserId = req.user?.claims?.sub || req.user?.id;
      const finalUserId = userId || authenticatedUserId || `user_${Date.now()}`;

      console.log('🎙️ Processing emotional support request - Mode:', mode, 'Language:', language, 'SessionId:', sessionId, 'AuthUserId:', authenticatedUserId, 'FinalUserId:', finalUserId);

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
      let sessionObjectId: string | undefined;

      if (text && text.trim() !== 'No speech detected' && text.trim() !== 'No input provided') {
        try {
          console.log('🤖 Sending to therapy service:', text.substring(0, 50) + '...');

          // ** Use consistent session/user management like chat mode**
          // Handle empty strings from FormData and convert to null/undefined
          const cleanSessionId = sessionId && sessionId.trim() !== '' ? sessionId : null;
          const cleanUserId = userId && userId.trim() !== '' ? userId : null;
          
          // Don't generate new random userId - use provided one or create stable fallback
          // Use authenticated user ID for consistency
          const stableUserId = finalUserId; // Use the authenticated user ID
          const stableSessionId = cleanSessionId; // Use provided sessionId as-is (may be null for new sessions)

          console.log('📝 Session context - AuthUserId:', finalUserId, 'SessionId:', stableSessionId, 'Original sessionId:', sessionId, 'Original userId:', userId);

          // Call Python therapy service (same as emotional-support-chat)
          const THERAPY_SERVICE_URL = process.env.THERAPY_SERVICE_URL || 'http://localhost:5001';
          const pythonServiceResponse = await fetch(`${THERAPY_SERVICE_URL}/api/therapy/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: text.trim(),
              sessionId: stableSessionId, // Will be null for new sessions - therapy service handles this
              userId: stableUserId, // Now using authenticated user ID
              language: language || 'en'
            })
          });

          if (pythonServiceResponse.ok) {
            therapyResponse = await pythonServiceResponse.json();
            finalResponse = therapyResponse.response;
            crisisLevel = therapyResponse.crisisLevel || 'none';
            const harmType = therapyResponse.harmType || 'none';
            isCrisis = therapyResponse.isCrisis || false;
            
            // Log crisis and harm type information
            if (crisisLevel !== 'none' || harmType !== 'none') {
              console.log(`🚨 Crisis Detection - Level: ${crisisLevel}, Harm Type: ${harmType}`);
            }
            console.log('✅ Therapy service response received');
            console.log('🔍 Python service returned sessionId:', therapyResponse.sessionId);

            // Save to EmotionalSession collection for history tracking
            try {
              
              // If sessionId provided, try to continue existing session
              if (stableSessionId) {
                console.log('🔄 Attempting to continue existing voice session:', stableSessionId);
                
                // Check if session exists in EmotionalSession collection
                try {
                  const existingSession = await mongoStorage.findEmotionalSession(stableSessionId, finalUserId);
                  
                  if (existingSession) {
                    console.log('✅ Found existing voice session to continue');
                    sessionObjectId = stableSessionId;
                  } else {
                    console.log('❌ Voice session not found, will create new session');
                  }
                } catch (findError) {
                  console.log('⚠️ Error finding voice session, will create new session:', findError);
                }
              }
              
              // Create new session only if not continuing existing one
              if (!sessionObjectId) {
                // Use the sessionId from Python service if available, otherwise create new one
                const pythonSessionId = therapyResponse.sessionId;
                
                if (pythonSessionId) {
                  // Create session with the ID from Python service
                  const sessionData = await mongoStorage.createEmotionalSessionWithId({
                    id: pythonSessionId,
                    userId: finalUserId,
                    sessionType: isCrisis ? 'crisis' : 'chat',
                    mode: 'voice',
                    emotion: crisisLevel
                  });
                  sessionObjectId = pythonSessionId;
                } else {
                  // Fallback to creating new session with generated ID
                  const sessionData = await mongoStorage.createEmotionalSession({
                    userId: finalUserId,
                    sessionType: isCrisis ? 'crisis' : 'chat',
                    mode: 'voice',
                    emotion: crisisLevel
                  });
                  sessionObjectId = sessionData?.id;
                }
              }

              // Add the conversation messages to the session
              if (sessionObjectId) {
                await mongoStorage.addMessageToEmotionalSession(sessionObjectId, {
                  role: 'user',
                  content: text.trim()
                });

                await mongoStorage.addMessageToEmotionalSession(sessionObjectId, {
                  role: 'assistant', 
                  content: finalResponse
                });
              }
            } catch (sessionSaveError) {
              console.error('⚠️ Failed to save session to EmotionalSession:', sessionSaveError);
              // Continue processing - don't fail the request due to history save issues
            }
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
        sessionId: therapyResponse?.sessionId || sessionObjectId,
        userId: therapyResponse?.userId || finalUserId,
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
• 988 - Suicide & Crisis Lifeline (call or text, 24/7)
• 911 - Emergency Services

Your wellbeing is important. Please don't hesitate to reach out for professional help if needed.`,
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      });
    }
  });

 
  app.post('/api/emotional-support-chat', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message, language, sessionId, userId } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ 
          error: 'Message is required',
          success: false 
        });
      }

      // Get authenticated user ID
      const authenticatedUserId = req.user?.claims?.sub || req.user?.id;
      const finalUserId = userId || authenticatedUserId || `user_${Date.now()}`;

      console.log('🤖 Processing emotional support chat request:', {
        message: message.substring(0, 50) + '...',
        language: language || 'en',
        sessionId: sessionId || 'new',
        authenticatedUserId: authenticatedUserId,
        finalUserId: finalUserId
      });

      // Call Python therapy service with authenticated user ID
      const THERAPY_SERVICE_URL = process.env.THERAPY_SERVICE_URL || 'http://localhost:5001';
      const pythonServiceResponse = await fetch(`${THERAPY_SERVICE_URL}/api/therapy/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          sessionId: sessionId,
          userId: finalUserId,
          language: language || 'en'
        })
      });

      if (!pythonServiceResponse.ok) {
        throw new Error(`Python service error: ${pythonServiceResponse.status}`);
      }

      const therapyResponse = await pythonServiceResponse.json();
      console.log('🔍 Python service returned sessionId:', therapyResponse.sessionId);
      
      // Save to EmotionalSession collection for history tracking
      let sessionObjectId: string | undefined;
      try {
        
        // If sessionId provided, try to continue existing session
        if (sessionId) {
          console.log('🔄 Attempting to continue existing session:', sessionId);
          
          // Check if session exists in EmotionalSession collection
          try {
            const existingSession = await mongoStorage.findEmotionalSession(sessionId, finalUserId);
            
            if (existingSession) {
              console.log('✅ Found existing session to continue');
              sessionObjectId = sessionId;
            } else {
              console.log('❌ Session not found, will create new session');
            }
          } catch (findError) {
            console.log('⚠️ Error finding session, will create new session:', findError);
          }
        }
        
        // Create new session only if not continuing existing one
        if (!sessionObjectId) {
          // Use the sessionId from Python service if available, otherwise create new one
          const pythonSessionId = therapyResponse.sessionId;
          
          if (pythonSessionId) {
            // Create session with the ID from Python service
            const sessionData = await mongoStorage.createEmotionalSessionWithId({
              id: pythonSessionId,
              userId: finalUserId,
              sessionType: therapyResponse.isCrisis ? 'crisis' : 'chat',
              mode: 'chat',
              emotion: therapyResponse.crisisLevel || 'neutral'
            });
            sessionObjectId = pythonSessionId;
          } else {
            // Fallback to creating new session with generated ID
            const sessionData = await mongoStorage.createEmotionalSession({
              userId: finalUserId,
              sessionType: therapyResponse.isCrisis ? 'crisis' : 'chat',
              mode: 'chat',
              emotion: therapyResponse.crisisLevel || 'neutral'
            });
            sessionObjectId = sessionData?.id;
          }
        }

        // Add the conversation messages to the session
        if (sessionObjectId) {
          await mongoStorage.addMessageToEmotionalSession(sessionObjectId, {
            role: 'user',
            content: message.trim()
          });

          await mongoStorage.addMessageToEmotionalSession(sessionObjectId, {
            role: 'assistant', 
            content: therapyResponse.response
          });
        }
      } catch (sessionSaveError) {
        console.error('⚠️ Failed to save session to EmotionalSession:', sessionSaveError);
        // Continue processing - don't fail the request due to history save issues
      }
      
      // Return response in format expected by frontend
      res.json({ 
        success: true,
        chatResponse: therapyResponse.response,
        sessionId: therapyResponse.sessionId || sessionObjectId,
        userId: therapyResponse.userId || finalUserId,
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
• 988 - Suicide & Crisis Lifeline (call or text, 24/7)
• 911 - Emergency Services

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

      const THERAPY_SERVICE_URL = process.env.THERAPY_SERVICE_URL || 'http://localhost:5001';
      const pythonServiceResponse = await fetch(`${THERAPY_SERVICE_URL}/api/therapy/start-session`, {
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

  // Find nearby therapists endpoint
  app.post('/api/therapists/find', async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, therapistType, radius = 5000 } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false,
          error: 'Latitude and longitude are required' 
        });
      }

      if (!therapistType || !['speech', 'emotional', 'mental'].includes(therapistType)) {
        return res.status(400).json({ 
          success: false,
          error: 'Therapist type must be "speech", "emotional", or "mental"' 
        });
      }

      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!googleMapsApiKey) {
        return res.status(500).json({ 
          success: false,
          error: 'Google Maps API key not configured' 
        });
      }

      // Use reverse geocoding to get accurate location coordinates
      let accurateLatitude = latitude;
      let accurateLongitude = longitude;
      
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}`;
        const geocodeResponse = await fetch(geocodeUrl);
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
            // Get the most accurate location from geocoding
            const location = geocodeData.results[0].geometry.location;
            accurateLatitude = location.lat;
            accurateLongitude = location.lng;
            console.log('📍 Geocoded location:', { 
              original: { lat: latitude, lng: longitude },
              geocoded: { lat: accurateLatitude, lng: accurateLongitude }
            });
          }
        }
      } catch (geocodeError) {
        console.warn('⚠️ Geocoding failed, using original coordinates:', geocodeError);
        // Continue with original coordinates if geocoding fails
      }

      // Determine search query based on therapist type
      let searchQuery = '';
      if (therapistType === 'speech') {
        searchQuery = 'speech therapist|speech-language pathologist|speech therapy';
      } else if (therapistType === 'emotional' || therapistType === 'mental') {
        searchQuery = 'mental health therapist|psychologist|psychiatrist|emotional therapist|counselor';
      }

      // Use Google Places API Text Search to find nearby therapists with geocoded location
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${accurateLatitude},${accurateLongitude}&radius=${radius}&key=${googleMapsApiKey}`;
      
      console.log('🔍 Searching for therapists:', { 
        latitude: accurateLatitude, 
        longitude: accurateLongitude, 
        therapistType, 
        radius 
      });

      const placesResponse = await fetch(placesUrl);
      if (!placesResponse.ok) {
        throw new Error(`Google Places API error: ${placesResponse.status}`);
      }

      const placesData = await placesResponse.json();

      if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${placesData.status} - ${placesData.error_message || 'Unknown error'}`);
      }

      // Process results
      const therapists = (placesData.results || []).map((place: any) => {
        // Get place details for more information
        return {
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          rating: place.rating || null,
          userRatingsTotal: place.user_ratings_total || 0,
          types: place.types || [],
          photos: place.photos ? place.photos.map((photo: any) => ({
            reference: photo.photo_reference,
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${googleMapsApiKey}`
          })) : [],
          distance: null // Will calculate if needed
        };
      });

      // Calculate road distances using Google Distance Matrix API for accuracy
      // Use geocoded coordinates for accurate distance calculation
      // Batch process therapists in groups of 25 (API limit)
      const batchSize = 25;
      const therapistBatches = [];
      for (let i = 0; i < therapists.length; i += batchSize) {
        therapistBatches.push(therapists.slice(i, i + batchSize));
      }

      // Process each batch
      for (const batch of therapistBatches) {
        // Build destinations string for Distance Matrix API
        const destinations = batch.map((t: any) => `${t.location.lat},${t.location.lng}`).join('|');
        
        // Call Google Distance Matrix API with geocoded origin coordinates
        const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${accurateLatitude},${accurateLongitude}&destinations=${destinations}&units=metric&key=${googleMapsApiKey}`;
        
        try {
          const distanceResponse = await fetch(distanceMatrixUrl);
          if (!distanceResponse.ok) {
            console.warn('Distance Matrix API error, falling back to straight-line distance');
            // Fallback to straight-line distance if API fails (using geocoded coordinates)
            batch.forEach((therapist: any) => {
              const R = 6371; // Radius of the Earth in km
              const dLat = (therapist.location.lat - accurateLatitude) * Math.PI / 180;
              const dLon = (therapist.location.lng - accurateLongitude) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(accurateLatitude * Math.PI / 180) * Math.cos(therapist.location.lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              therapist.distance = R * c;
            });
            continue;
          }

          const distanceData = await distanceResponse.json();
          
          if (distanceData.status === 'OK' && distanceData.rows && distanceData.rows[0] && distanceData.rows[0].elements) {
            batch.forEach((therapist: any, index: number) => {
              const element = distanceData.rows[0].elements[index];
              if (element.status === 'OK' && element.distance) {
                // Convert meters to kilometers
                therapist.distance = element.distance.value / 1000;
              } else {
                // Fallback to straight-line distance if route not found (using geocoded coordinates)
                const R = 6371;
                const dLat = (therapist.location.lat - accurateLatitude) * Math.PI / 180;
                const dLon = (therapist.location.lng - accurateLongitude) * Math.PI / 180;
                const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(accurateLatitude * Math.PI / 180) * Math.cos(therapist.location.lat * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                therapist.distance = R * c;
              }
            });
          } else {
            // Fallback to straight-line distance (using geocoded coordinates)
            batch.forEach((therapist: any) => {
              const R = 6371;
              const dLat = (therapist.location.lat - accurateLatitude) * Math.PI / 180;
              const dLon = (therapist.location.lng - accurateLongitude) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(accurateLatitude * Math.PI / 180) * Math.cos(therapist.location.lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              therapist.distance = R * c;
            });
          }
        } catch (error) {
          console.warn('Distance Matrix API error:', error);
          // Fallback to straight-line distance (using geocoded coordinates)
          batch.forEach((therapist: any) => {
            const R = 6371;
            const dLat = (therapist.location.lat - accurateLatitude) * Math.PI / 180;
            const dLon = (therapist.location.lng - accurateLongitude) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(accurateLatitude * Math.PI / 180) * Math.cos(therapist.location.lat * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            therapist.distance = R * c;
          });
        }
      }

      // Analyze and sort therapists by quality metrics
      // Priority: 1) Review count (highest first), 2) Rating (highest first), 3) Distance (closest first)
      therapists.sort((a: any, b: any) => {
        const reviewsA = a.userRatingsTotal || 0;
        const reviewsB = b.userRatingsTotal || 0;
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        const distanceA = a.distance || Infinity;
        const distanceB = b.distance || Infinity;
        
        // Primary sort: by review count (highest first)
        if (reviewsA !== reviewsB) {
          return reviewsB - reviewsA;
        }
        
        // Secondary sort: by rating (highest first)
        if (Math.abs(ratingA - ratingB) > 0.1) {
          return ratingB - ratingA;
        }
        
        // Tertiary sort: by distance (closest first) - tiebreaker
        return distanceA - distanceB;
      });

      // Return only top 3 best matching therapists (prioritized by reviews, then rating, then distance)
      const topTherapists = therapists.slice(0, 3);

      // Fetch complete detailed information for each therapist using Google Places API Place Details
      const therapistsWithDetails = await Promise.all(
        topTherapists.map(async (therapist: any) => {
          try {
            // Fetch comprehensive place details from Google Maps
            const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${therapist.id}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,rating,user_ratings_total,photos,geometry,types,business_status,vicinity,plus_code,editorial_summary,reviews,price_level,url&key=${googleMapsApiKey}`;
            
            const detailsResponse = await fetch(placeDetailsUrl);
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              
              if (detailsData.status === 'OK' && detailsData.result) {
                const place = detailsData.result;
                
                // Return complete therapist information
                return {
                  ...therapist,
                  // Basic Information
                  name: place.name || therapist.name,
                  address: place.formatted_address || therapist.address,
                  vicinity: place.vicinity || null,
                  
                  // Contact Information
                  phone: place.formatted_phone_number || null,
                  internationalPhone: place.international_phone_number || null,
                  website: place.website || null,
                  googleMapsUrl: place.url || null,
                  
                  // Location Details
                  location: {
                    lat: place.geometry?.location?.lat || therapist.location.lat,
                    lng: place.geometry?.location?.lng || therapist.location.lng
                  },
                  plusCode: place.plus_code ? {
                    globalCode: place.plus_code.global_code,
                    compoundCode: place.plus_code.compound_code
                  } : null,
                  
                  // Ratings & Reviews
                  rating: place.rating || therapist.rating,
                  userRatingsTotal: place.user_ratings_total || therapist.userRatingsTotal,
                  priceLevel: place.price_level || null,
                  reviews: place.reviews ? place.reviews.slice(0, 5).map((review: any) => ({
                    authorName: review.author_name,
                    rating: review.rating,
                    text: review.text,
                    time: review.time,
                    relativeTimeDescription: review.relative_time_description
                  })) : [],
                  
                  // Business Information
                  openingHours: place.opening_hours ? {
                    openNow: place.opening_hours.open_now,
                    weekdayText: place.opening_hours.weekday_text || [],
                    periods: place.opening_hours.periods || [],
                    // Parse periods to get opening/closing times for each day
                    schedule: place.opening_hours.periods ? place.opening_hours.periods.map((period: any) => {
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const formatTime = (time: string) => {
                        if (!time) return null;
                        const hour = parseInt(time.substring(0, 2));
                        const minute = time.substring(2, 4);
                        const period = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                        return `${displayHour}:${minute} ${period}`;
                      };
                      return {
                        day: dayNames[period.open.day],
                        dayIndex: period.open.day,
                        open: formatTime(period.open.time),
                        close: period.close ? formatTime(period.close.time) : null,
                        isClosed: !period.close
                      };
                    }).sort((a: any, b: any) => a.dayIndex - b.dayIndex) : []
                  } : null,
                  businessStatus: place.business_status || 'OPERATIONAL',
                  
                  // Media
                  photos: place.photos ? place.photos.map((photo: any) => ({
                    reference: photo.photo_reference,
                    url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${googleMapsApiKey}`,
                    width: photo.width,
                    height: photo.height
                  })) : therapist.photos || [],
                  
                  // Categories & Types
                  types: place.types || therapist.types,
                  
                  // Description
                  editorialSummary: place.editorial_summary ? place.editorial_summary.overview : null,
                  
                  // Distance (already calculated - road distance from user location)
                  distance: therapist.distance,
                  distanceText: therapist.distance ? `${therapist.distance.toFixed(1)} km` : null
                };
              }
            }
          } catch (detailsError) {
            console.warn(`⚠️ Failed to fetch details for ${therapist.name}:`, detailsError);
          }
          
          // Fallback: return therapist with existing data if details fetch fails
          return {
            ...therapist,
            distanceText: therapist.distance ? `${therapist.distance.toFixed(1)} km` : null
          };
        })
      );

      res.json({
        success: true,
        therapists: therapistsWithDetails, // Return top 3 with complete Google Maps details
        count: therapistsWithDetails.length,
        totalFound: therapists.length,
        searchLocation: { 
          latitude: accurateLatitude, 
          longitude: accurateLongitude,
          originalLatitude: latitude,
          originalLongitude: longitude,
          geocoded: accurateLatitude !== latitude || accurateLongitude !== longitude
        },
        therapistType
      });

    } catch (error) {
      console.error("❌ Error finding therapists:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to find therapists',
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

      const THERAPY_SERVICE_URL = process.env.THERAPY_SERVICE_URL || 'http://localhost:5001';
      const pythonServiceResponse = await fetch(`${THERAPY_SERVICE_URL}/api/therapy/session-summary`, {
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
      const THERAPY_SERVICE_URL = process.env.THERAPY_SERVICE_URL || 'http://localhost:5001';
      const pythonServiceResponse = await fetch(`${THERAPY_SERVICE_URL}/health`);
      
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

  // Psychological Profile endpoint
  app.get('/api/therapy/psychological-profile', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }
      console.log(`🧠 Fetching psychological profile for user: ${userId}`);

      const THERAPY_SERVICE_URL = process.env.THERAPY_SERVICE_URL || 'http://localhost:5001';
      const pythonServiceResponse = await fetch(`${THERAPY_SERVICE_URL}/api/therapy/psychological-profile?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!pythonServiceResponse.ok) {
        throw new Error(`Python service psychological profile failed: ${pythonServiceResponse.status}`);
      }

      const profileData = await pythonServiceResponse.json();
      res.json(profileData);
      
    } catch (error) {
      console.error("❌ Failed to get psychological profile:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get psychological profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Long-term Progress endpoint
  app.get('/api/therapy/long-term-progress', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }
      const days = req.query.days || '30';
      console.log(`📊 Fetching long-term progress for user: ${userId}, days: ${days}`);

      const THERAPY_SERVICE_URL = process.env.THERAPY_SERVICE_URL || 'http://localhost:5001';
      const pythonServiceResponse = await fetch(`${THERAPY_SERVICE_URL}/api/therapy/long-term-progress?userId=${encodeURIComponent(userId)}&days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!pythonServiceResponse.ok) {
        throw new Error(`Python service long-term progress failed: ${pythonServiceResponse.status}`);
      }

      const progressData = await pythonServiceResponse.json();
      res.json(progressData);
      
    } catch (error) {
      console.error("❌ Failed to get long-term progress:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get long-term progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Session History endpoint for psychological insights
  app.get('/api/therapy/sessions', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }
      console.log(`📝 Fetching session history for user: ${userId}`);

      // Get sessions from MongoDB
      const sessions = await mongoStorage.getUserEmotionalSessions(userId);
      
      res.json({
        success: true,
        sessions: sessions || []
      });
      
    } catch (error) {
      console.error("❌ Failed to get session history:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get session history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI-powered session title generation with database persistence
  async function generateAndSaveAISessionTitle(session: any): Promise<string> {
    try {
      // If session already has a title saved in the database, use it
      if (session.title && session.title.trim() !== '') {
        return session.title;
      }

      // If it's a crisis session, set and save that title
      if (session.sessionType === 'crisis') {
        const title = 'Crisis Support Session';
        await mongoStorage.updateEmotionalSessionTitle(session.id || session._id, title);
        return title;
      }

      // If we have messages, use AI to generate a meaningful title
      if (session.messages && session.messages.length > 0) {
        const conversationContent = session.messages
          .slice(0, 6) // Take first 6 messages for context
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n');

        console.log(`🤖 Generating AI title for session ${session.id}...`);

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that creates short, meaningful titles for therapy and emotional support sessions. 
              Generate a 2-5 word title that captures the main topic or emotional theme of the conversation. 
              The title should be empathetic, professional, and specific to the conversation content.
              
              Examples:
              - "Dealing with Work Stress"
              - "Relationship Concerns"
              - "Anxiety Management"
              - "Self-Confidence Building"
              - "Processing Grief"
              - "Sleep Difficulties"
              
              Return only the title, nothing else.`
            },
            {
              role: "user",
              content: `Generate a title for this emotional support session:\n\n${conversationContent}`
            }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
          max_tokens: 20
        });

        const aiTitle = completion.choices[0]?.message?.content?.trim();
        if (aiTitle && aiTitle.length > 0 && aiTitle.length <= 50) {
          const cleanTitle = aiTitle.replace(/['"]/g, ''); // Remove quotes if any
          
          // Save the generated title to the database
          await mongoStorage.updateEmotionalSessionTitle(session.id || session._id, cleanTitle);
          console.log(`✅ AI title saved for session ${session.id}: "${cleanTitle}"`);
          
          return cleanTitle;
        }
      }

      // Fallback based on session type and mode
      const fallbackTitle = session.mode === 'voice' ? 'Voice Support Session' : 'Chat Support Session';
      
      // Save the fallback title to the database
      await mongoStorage.updateEmotionalSessionTitle(session.id || session._id, fallbackTitle);
      
      return fallbackTitle;
    } catch (error) {
      console.error('Error generating AI session title:', error);
      // Fallback to basic title without saving (to avoid overwriting potential existing titles)
      return session.mode === 'voice' ? 'Voice Support Session' : 'Chat Support Session';
    }
  }

  // Bulk update titles for existing sessions (migration utility)
  app.post('/api/therapy/generate-missing-titles', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      console.log('🔄 Starting bulk title generation for user:', userId);

      // Get all emotional sessions without titles
      const sessions = await mongoStorage.getUserEmotionalSessions(userId, 100);
      const sessionsWithoutTitles = sessions.filter((session: any) => !session.title || session.title.trim() === '');

      console.log(`📋 Found ${sessionsWithoutTitles.length} sessions without titles`);

      let updatedCount = 0;
      for (const session of sessionsWithoutTitles) {
        try {
          await generateAndSaveAISessionTitle(session);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to generate title for session ${session.id}:`, error);
        }
      }

      console.log(`✅ Successfully generated titles for ${updatedCount} sessions`);

      res.json({
        success: true,
        message: `Generated titles for ${updatedCount} sessions`,
        totalProcessed: sessionsWithoutTitles.length,
        updated: updatedCount
      });

    } catch (error) {
      console.error("❌ Error in bulk title generation:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate titles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get specific therapy session by ID
  app.get('/api/therapy/session/:sessionId', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { sessionId } = req.params;
      
      console.log('📋 Fetching session details for user:', userId, 'Session ID:', sessionId);

      // Try to find the session in EmotionalSession collection first
      const emotionalSession = await mongoStorage.findEmotionalSession(sessionId, userId);
      
      if (emotionalSession) {
        const sessionData = {
          id: emotionalSession.id || emotionalSession._id,
          sessionId: emotionalSession.id || emotionalSession._id,
          userId: emotionalSession.userId,
          type: 'support' as const,
          mode: emotionalSession.mode || 'chat',
          title: emotionalSession.title || 'Emotional Support Session',
          date: emotionalSession.createdAt || emotionalSession.timestamp || new Date(),
          duration: emotionalSession.duration ? `${Math.round(emotionalSession.duration / 1000 / 60)} min` : 'N/A',
          mood: emotionalSession.emotionalState || 'neutral',
          messages: emotionalSession.messages || [],
          riskLevel: emotionalSession.riskLevel || 'low',
          notes: emotionalSession.messages && emotionalSession.messages.length > 0 
            ? emotionalSession.messages[0].content.substring(0, 100) + '...'
            : 'No messages recorded'
        };

        return res.json({
          success: true,
          session: sessionData
        });
      }

      // If not found in emotional sessions, try therapeutic sessions
      // TODO: Add therapeutic session retrieval if needed
      
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found or access denied' 
      });

    } catch (error) {
      console.error("❌ Error fetching session details:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch session details',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get user's therapy session history
  app.get('/api/therapy/history', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { limit = 20, offset = 0, type } = req.query;
      
      console.log('📋 Fetching therapy history for user:', userId, 'Type:', type);

      let sessions: TherapySession[] = [];
      let total = 0;

      // Get different types of sessions based on filter
      if (!type || type === 'all') {
        // Get both emotional sessions and therapeutic sessions
        try {
          const emotionalSessions = await mongoStorage.getUserEmotionalSessions(userId, Number(limit));
          const therapeuticSessions = await mongoStorage.getUserTherapeuticSessions(userId, Number(limit), Number(offset));
          
          // Combine and format sessions with AI-generated titles
          const formattedEmotional = await Promise.all(emotionalSessions.map(async (session: any) => ({
            id: session.id || session._id, // Use the nanoid 'id' field first, fallback to _id
            sessionId: session.id || session._id, // Explicit sessionId for continuation
            userId: session.userId, // Include userId for session continuation
            type: 'support' as const,
            mode: session.mode || 'chat', // Add mode information
            title: await generateAndSaveAISessionTitle(session), // Use AI-generated title with DB persistence
            date: session.createdAt || session.timestamp || new Date(),
            duration: session.duration ? `${Math.round(session.duration / 1000 / 60)} min` : 'N/A',
            mood: session.emotionalState || 'neutral',
            messages: session.messages || [],
            riskLevel: session.riskLevel || 'low',
            notes: session.messages && session.messages.length > 0 
              ? session.messages[0].content.substring(0, 100) + '...'
              : 'No messages recorded'
          })));

          const formattedTherapeutic = therapeuticSessions.sessions.map((session: any) => ({
            id: session._id || session.id,
            type: 'therapy' as const,
            title: 'Therapeutic Session',
            date: session.timestamp || session.createdAt || new Date(),
            duration: session.duration ? `${Math.round(session.duration / 1000 / 60)} min` : 'N/A',
            mood: session.therapeutic_data?.mood || 'neutral',
            notes: session.therapeutic_data?.notes || 'Therapeutic session completed',
            score: session.score || 0,
            accuracy: session.accuracy || 0
          }));

          // Combine and sort by date (newest first)
          sessions = [...formattedEmotional, ...formattedTherapeutic]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(Number(offset), Number(offset) + Number(limit));

          total = emotionalSessions.length + therapeuticSessions.total;
        } catch (error) {
          console.error('❌ Error fetching sessions:', error);
          sessions = [];
          total = 0;
        }
      } else if (type === 'support') {
        // Get only emotional support sessions
        try {
          const emotionalSessions = await mongoStorage.getUserEmotionalSessions(userId, Number(limit));
          sessions = await Promise.all(emotionalSessions.map(async (session: any) => ({
            id: session.id || session._id, // Use the nanoid 'id' field first, fallback to _id
            sessionId: session.id || session._id, // Explicit sessionId for continuation
            userId: session.userId, // Include userId for session continuation
            type: 'support' as const,
            mode: session.mode || 'chat', // Add mode information
            title: await generateAndSaveAISessionTitle(session), // Use AI-generated title with DB persistence
            date: session.createdAt || session.timestamp || new Date(),
            duration: session.duration ? `${Math.round(session.duration / 1000 / 60)} min` : 'N/A',
            mood: session.emotionalState || 'neutral',
            messages: session.messages || [],
            riskLevel: session.riskLevel || 'low',
            notes: session.messages && session.messages.length > 0 
              ? session.messages[0].content.substring(0, 100) + '...'
              : 'No messages recorded'
          })));
          total = emotionalSessions.length;
        } catch (error) {
          console.error('❌ Error fetching emotional sessions:', error);
          sessions = [];
          total = 0;
        }
      } else if (type === 'therapy') {
        // Get only therapeutic sessions
        try {
          const therapeuticSessions = await mongoStorage.getUserTherapeuticSessions(userId, Number(limit), Number(offset));
          sessions = therapeuticSessions.sessions.map((session: any) => ({
            id: session._id || session.id,
            type: 'therapy' as const,
            title: 'Therapeutic Session',
            date: session.timestamp || session.createdAt || new Date(),
            duration: session.duration ? `${Math.round(session.duration / 1000 / 60)} min` : 'N/A',
            mood: session.therapeutic_data?.mood || 'neutral',
            notes: session.therapeutic_data?.notes || 'Therapeutic session completed',
            score: session.score || 0,
            accuracy: session.accuracy || 0
          }));
          total = therapeuticSessions.total;
        } catch (error) {
          console.error('❌ Error fetching therapeutic sessions:', error);
          sessions = [];
          total = 0;
        }
      }

      console.log(`✅ Found ${sessions.length} sessions for user ${userId}`);

      res.json({
        success: true,
        sessions: sessions,
        total: total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + sessions.length < total
      });

    } catch (error) {
      console.error("❌ Error fetching therapy history:", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch therapy history',
        details: error instanceof Error ? error.message : 'Unknown error'
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
