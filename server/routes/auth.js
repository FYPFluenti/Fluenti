const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const User = require('../models/User'); // Adjust path to your User model

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Google OAuth Signup
router.post('/google-signup', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google JWT token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const firstName = payload['given_name'];
    const lastName = payload['family_name'];
    const picture = payload['picture'];
    
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
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          language: user.language
        },
        authToken: authToken,
        message: 'Successfully signed in with Google'
      });
    }
    
    // Create new user - for social signup, we'll need to collect additional info
    user = new User({
      firstName,
      lastName,
      email,
      googleId,
      profilePicture: picture,
      emailVerified: true,
      signupMethod: 'google',
      // Default values - user will need to complete profile
      userType: 'adult', // Default, can be updated later
      language: 'english' // Default, can be updated later
    });
    
    await user.save();
    
    const authToken = generateAuthToken(user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        language: user.language,
        needsProfileCompletion: true // Flag to show profile completion modal
      },
      authToken: authToken,
      message: 'Account created successfully with Google'
    });
    
  } catch (error) {
    console.error('Google signup error:', error);
    res.status(400).json({
      success: false,
      message: 'Google signup failed. Please try again.'
    });
  }
});

// Facebook OAuth Signup
router.post('/facebook-signup', async (req, res) => {
  try {
    const { accessToken, userID, userInfo } = req.body;
    
    // Verify Facebook access token
    const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,email,first_name,last_name,picture`);
    const fbUser = await response.json();
    
    if (fbUser.error || fbUser.id !== userID) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Facebook token'
      });
    }
    
    const email = fbUser.email;
    const firstName = fbUser.first_name;
    const lastName = fbUser.last_name;
    const facebookId = fbUser.id;
    const picture = fbUser.picture?.data?.url;
    
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
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          language: user.language
        },
        authToken: authToken,
        message: 'Successfully signed in with Facebook'
      });
    }
    
    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      facebookId,
      profilePicture: picture,
      emailVerified: true,
      signupMethod: 'facebook',
      // Default values - user will need to complete profile
      userType: 'adult', // Default, can be updated later
      language: 'english' // Default, can be updated later
    });
    
    await user.save();
    
    const authToken = generateAuthToken(user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        language: user.language,
        needsProfileCompletion: true // Flag to show profile completion modal
      },
      authToken: authToken,
      message: 'Account created successfully with Facebook'
    });
    
  } catch (error) {
    console.error('Facebook signup error:', error);
    res.status(400).json({
      success: false,
      message: 'Facebook signup failed. Please try again.'
    });
  }
});

module.exports = router;