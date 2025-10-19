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


import { generateTTSAudio } from "./services/ttsService";
import { fastTranscribeAudio } from "./services/fastSTTService";
import { processChildSpeechAudio } from "./services/childSpeechSTT";
import { transcribeAudioWithGroq, assessPronunciationWithGroq } from "./services/groqSpeechService";

import { AuthService } from "./auth";
import gamesRouter from "./routes/games";
import aiGameRouter from "./routes/aiGame";


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

  // Register games routes
  app.use('/api/games', tokenBasedAuth, gamesRouter);
  app.use('/api/ai', tokenBasedAuth, aiGameRouter);

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
          userType: 'child', // Can be 'adult', 'child', or 'guardian'
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

  // Groq Speech Recognition Routes
  app.post('/api/speech/groq/transcribe', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await transcribeAudioWithGroq(req, res);
    } catch (error) {
      console.error("Error in Groq transcription route:", error);
      res.status(500).json({ 
        error: "Groq transcription failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post('/api/speech/groq/assess', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await assessPronunciationWithGroq(req, res);
    } catch (error) {
      console.error("Error in Groq pronunciation assessment route:", error);
      res.status(500).json({ 
        error: "Groq pronunciation assessment failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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

  // Dedicated Child Speech STT endpoint for Word Practice Game
  app.post('/api/speech/child-transcribe', tokenBasedAuth, upload.single('audio'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetWord, language = 'en' } = req.body;

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No audio file provided' 
        });
      }

      console.log('🎤 Child Speech STT request - Target word:', targetWord);
      console.log('📁 Audio file size:', req.file.size, 'bytes');
      
      const audioBuffer = req.file.buffer;
      
      // Validate audio buffer first
      if (!validateAudioBuffer(audioBuffer)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid audio file format or size' 
        });
      }
      
      // Use the same proven STT chain as emotional support (works perfectly)
      const whisperLanguage = language?.startsWith('ur') ? 'ur' : 'en';
      let transcribedText = '';
      let method = '';
      
      try {
        // Try fast STT first (same as emotional support)
        console.log('🔄 Child Speech - Attempting fast STT...');
        transcribedText = await fastTranscribeAudio(audioBuffer, whisperLanguage);
        method = 'fast_stt';
        console.log('✅ Child Speech - Fast STT successful:', transcribedText);
      } catch (fastSTTError) {
        console.warn('⚠️ Child Speech - Fast STT failed, trying local Whisper:', fastSTTError);
        try {
          transcribedText = await transcribeAudio(audioBuffer, whisperLanguage);
          method = 'local_whisper';
          console.log('✅ Child Speech - Local Whisper successful:', transcribedText);
        } catch (sttError) {
          console.warn('⚠️ Child Speech - Local Whisper failed, using simple STT:', sttError);
          try {
            transcribedText = await simpleTranscribeAudio(audioBuffer, whisperLanguage);
            method = 'simple_stt';
            console.log('✅ Child Speech - Simple STT successful:', transcribedText);
          } catch (finalError) {
            console.error('❌ Child Speech - All STT methods failed:', finalError);
            return res.status(500).json({ 
              success: false,
              error: 'All transcription methods failed',
              details: finalError instanceof Error ? finalError.message : 'Unknown error'
            });
          }
        }
      }

      // Return transcription result (same format as emotional support STT)
      res.json({ 
        success: true,
        transcription: transcribedText || '',
        confidence: 0.9, // Server-side STT is generally reliable
        targetWord: targetWord,
        language: language,
        method: method
      });

    } catch (error) {
      console.error("❌ Child Speech STT error:", error);
      res.status(500).json({ 
        success: false,
        error: 'Child speech STT processing failed',
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


  // Enhanced emotional support endpoint with therapy service integration
  app.post('/api/emotional-support', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const { mode, language, sessionId, userId, history } = req.body;
      let text = req.body.text;

      console.log('🎙️ Processing emotional support request - Mode:', mode, 'Language:', language, 'SessionId:', sessionId, 'UserId:', userId);

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

          // **FIXED: Use consistent session/user management like chat mode**
          // Handle empty strings from FormData and convert to null/undefined
          const cleanSessionId = sessionId && sessionId.trim() !== '' ? sessionId : null;
          const cleanUserId = userId && userId.trim() !== '' ? userId : null;
          
          // Don't generate new random userId - use provided one or create stable fallback
          const stableUserId = cleanUserId || `voice_user_${cleanSessionId || 'default'}`;
          const stableSessionId = cleanSessionId; // Use provided sessionId as-is (may be null for new sessions)

          console.log('📝 Session context - UserId:', stableUserId, 'SessionId:', stableSessionId, 'Original sessionId:', sessionId, 'Original userId:', userId);

          // Call Python therapy service (same as emotional-support-chat)
          const pythonServiceResponse = await fetch('http://localhost:5001/api/therapy/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: text.trim(),
              sessionId: stableSessionId, // Will be null for new sessions - therapy service handles this
              userId: stableUserId, // Now consistent across voice messages
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
