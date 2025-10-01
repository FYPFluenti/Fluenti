const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not using social login
      return !this.googleId && !this.facebookId;
    }
  },
  userType: {
    type: String,
    enum: ['adult', 'child'],
    required: true
  },
  language: {
    type: String,
    enum: ['english', 'urdu'],
    required: true
  },
  // OAuth fields
  googleId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  facebookId: {
    type: String,
    sparse: true
  },
  profilePicture: {
    type: String
  },
  signupMethod: {
    type: String,
    enum: ['email', 'google', 'facebook'],
    default: 'email'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);