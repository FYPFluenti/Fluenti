import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import fetch from 'node-fetch';
import { User } from './models.js';
import { nanoid } from 'nanoid';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateAuthToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Google OAuth Signup/Login
router.post('/google-signup', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify the Google token
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

    const { sub: googleId, email, name, given_name: firstName, family_name: lastName, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        id: `user-${nanoid()}`,
        email,
        name: name || `${firstName} ${lastName}`.trim(),
        firstName: firstName || name?.split(' ')[0] || 'User',
        lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
        googleId,
        profilePicture: picture,
        signupMethod: 'google',
        isVerified: true, // Google accounts are pre-verified
        emailVerified: true,
      });
      await user.save();
    }

    // Generate auth token
    const authToken = generateAuthToken(user.id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      user: user.toPublic(),
      authToken
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Facebook OAuth Signup/Login
router.post('/facebook-signup', async (req, res) => {
  try {
    const { accessToken, userID, userInfo } = req.body;

    if (!accessToken || !userID) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token and user ID are required'
      });
    }

    // Verify the Facebook token
    const fbResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,first_name,last_name,picture`
    );

    if (!fbResponse.ok) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Facebook token'
      });
    }

    const fbUserData = await fbResponse.json() as any;

    if (fbUserData.id !== userID) {
      return res.status(400).json({
        success: false,
        message: 'Facebook user ID mismatch'
      });
    }

    const { id: facebookId, email, name, first_name: firstName, last_name: lastName, picture } = fbUserData;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [{ email }, { facebookId }] 
    });

    if (user) {
      // Update existing user with Facebook ID if not set
      if (!user.facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        id: `user-${nanoid()}`,
        email,
        name: name || `${firstName} ${lastName}`.trim(),
        firstName: firstName || name?.split(' ')[0] || 'User',
        lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
        facebookId,
        profilePicture: picture?.data?.url || undefined,
        signupMethod: 'facebook',
        isVerified: true, // Facebook accounts are pre-verified
        emailVerified: true,
      });
      await user.save();
    }

    // Generate auth token
    const authToken = generateAuthToken(user.id);

    res.json({
      success: true,
      message: 'Facebook authentication successful',
      user: user.toPublic(),
      authToken
    });
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Facebook authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Regular login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate auth token
    const authToken = generateAuthToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toPublic(),
      authToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
