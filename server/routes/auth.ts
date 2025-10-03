import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../db/schema';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateAuthToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback-secret', 
    { expiresIn: '7d' }
  );
};

// Helper function to create user response
const createUserResponse = (user: IUser) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  userType: user.userType,
  language: user.language,
  profilePicture: user.profilePicture
});

// Google OAuth Signup/Login
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, userType, language } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }
    
    // Verify Google JWT token
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
    
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });
    
    if (user) {
      // Update existing user with Google ID if not present
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      
      const authToken = generateAuthToken(user._id);
      return res.json({
        success: true,
        user: createUserResponse(user),
        authToken: authToken,
        message: 'Successfully signed in with Google'
      });
    }
    
    // For new users, require userType and language
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
    
    // Create new user
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
    
    const authToken = generateAuthToken(user._id);
    
    res.json({
      success: true,
      user: createUserResponse(user),
      authToken: authToken,
      message: 'Account created successfully with Google'
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again.'
    });
  }
});

// Facebook OAuth Signup/Login
router.post('/facebook', async (req: Request, res: Response) => {
  try {
    const { accessToken, userID, userType, language } = req.body;
    
    if (!accessToken || !userID) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token and user ID are required'
      });
    }
    
    // Verify Facebook access token
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
    
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { facebookId: facebookId }
      ]
    });
    
    if (user) {
      // Update existing user with Facebook ID if not present
      if (!user.facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }
      
      const authToken = generateAuthToken(user._id);
      return res.json({
        success: true,
        user: createUserResponse(user),
        authToken: authToken,
        message: 'Successfully signed in with Facebook'
      });
    }
    
    // For new users, require userType and language
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
    
    // Create new user
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
    
    const authToken = generateAuthToken(user._id);
    
    res.json({
      success: true,
      user: createUserResponse(user),
      authToken: authToken,
      message: 'Account created successfully with Facebook'
    });
    
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Facebook authentication failed. Please try again.'
    });
  }
});

export default router;