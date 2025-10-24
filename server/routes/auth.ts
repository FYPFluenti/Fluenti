import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models';
import { generateAccessToken, generateRefreshToken, TOKEN_EXPIRY } from '../services/jwtService';
import { tokenBasedAuth } from '../middleware';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType?: string;
  };
}

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to create user response
const createUserResponse = (user: any) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  userType: user.userType,
  language: user.language,
  profilePicture: user.profilePicture
});

// Helper function to set JWT cookies
const setAuthCookies = async (res: Response, user: any) => {
  const accessToken = generateAccessToken({ 
    userId: user.id, 
    email: user.email,
    userType: user.userType 
  });
  const refreshToken = generateRefreshToken({ 
    userId: user.id,
    email: user.email, 
    userType: user.userType 
  });
  
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN_MS);
  await user.save();
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS,
    path: '/'
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
    path: '/'
  });
};// Google OAuth Handler
const handleGoogleAuth = async (req: Request, res: Response) => {
  try {
    const { credential, userType, language } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }
    
    const googleId = payload.sub;
    const email = payload.email!;
    const firstName = payload.given_name || 'User';
    const lastName = payload.family_name || '';
    const picture = payload.picture;
    
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });
    
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      
      await setAuthCookies(res, user);
      
      return res.json({
        success: true,
        user: createUserResponse(user),
        message: 'Successfully signed in with Google'
      });
    }
    
    if (!userType || !language) {
      return res.status(400).json({
        success: false,
        message: 'User type and language are required for new users',
        needsProfileInfo: true,
        tempUserData: {
          email,
          firstName,
          lastName,
          picture,
          googleId
        }
      });
    }
    
    user = new User({
      firstName,
      lastName,
      email,
      googleId,
      profilePicture: picture,
      userType,
      language,
      emailVerified: true,
      signupMethod: 'google'
    });
    
    await user.save();
    await setAuthCookies(res, user);
    
    res.json({
      success: true,
      user: createUserResponse(user),
      message: 'Account created successfully with Google'
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again.'
    });
  }
};

// Facebook OAuth Handler
const handleFacebookAuth = async (req: Request, res: Response) => {
  try {
    const { accessToken, userID, userType, language } = req.body;
    
    if (!accessToken || !userID) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token and user ID are required'
      });
    }
    
    const response = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,email,first_name,last_name,picture`
    );
    const fbUser = await response.json();
    
    if (fbUser.error || fbUser.id !== userID) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Facebook token'
      });
    }
    
    const email = fbUser.email;
    const firstName = fbUser.first_name || 'User';
    const lastName = fbUser.last_name || '';
    const facebookId = fbUser.id;
    const picture = fbUser.picture?.data?.url;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email permission is required for Facebook signup'
      });
    }
    
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { facebookId: facebookId }
      ]
    });
    
    if (user) {
      if (!user.facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }
      
      await setAuthCookies(res, user);
      
      return res.json({
        success: true,
        user: createUserResponse(user),
        message: 'Successfully signed in with Facebook'
      });
    }
    
    if (!userType || !language) {
      return res.status(400).json({
        success: false,
        message: 'User type and language are required for new users',
        needsProfileInfo: true,
        tempUserData: {
          email,
          firstName,
          lastName,
          picture,
          facebookId
        }
      });
    }
    
    user = new User({
      firstName,
      lastName,
      email,
      facebookId,
      profilePicture: picture,
      userType,
      language,
      emailVerified: true,
      signupMethod: 'facebook'
    });
    
    await user.save();
    await setAuthCookies(res, user);
    
    res.json({
      success: true,
      user: createUserResponse(user),
      message: 'Account created successfully with Facebook'
    });
    
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Facebook authentication failed. Please try again.'
    });
  }
};

router.post('/google', handleGoogleAuth);
router.post('/google-signup', handleGoogleAuth);
router.post('/google-login', handleGoogleAuth);

router.post('/facebook', handleFacebookAuth);
router.post('/facebook-signup', handleFacebookAuth);
router.post('/facebook-login', handleFacebookAuth);

// Password change endpoint (requires authentication)

router.post('/change-password', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔐 Password change request for user:', req.user?.id);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      console.log('❌ Missing password fields');
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      console.log('❌ New password too short');
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({ id: req.user?.id }).select('+password');
    if (!user) {
      console.log('❌ User not found:', req.user?.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('📋 User found, signup method:', user.signupMethod);

    // Check if user has a password (not OAuth-only user)
    if (!user.password || user.signupMethod !== 'email') {
      console.log('❌ Password change not available for OAuth user');
      return res.status(400).json({
        success: false,
        message: 'Password change not available for social login accounts'
      });
    }

    // Verify current password
    console.log('🔍 Verifying current password...');
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      console.log('❌ Current password is incorrect');
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    console.log('✅ Updating password...');
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed successfully for user:', req.user?.id);
    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password. Please try again.'
    });
  }
});

// Get email verification status
router.get('/email-verification-status', tokenBasedAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findOne({ id: req.user?.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      emailVerified: user.emailVerified || false,
      email: user.email,
      signupMethod: user.signupMethod
    });

  } catch (error) {
    console.error('Email verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email verification status'
    });
  }
});



export default router;
