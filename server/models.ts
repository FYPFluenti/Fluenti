import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Made optional for OAuth users
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profileImageUrl: { type: String },
  userType: { 
    type: String, 
    enum: ['child', 'adult'], 
    default: 'child' 
  },
  language: { 
    type: String, 
    enum: ['english', 'urdu', 'both'], 
    default: 'english' 
  },
  // OAuth fields
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  signupMethod: { 
    type: String, 
    enum: ['email', 'google', 'facebook'], 
    default: 'email' 
  },
  // Email verification fields
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpiry: { type: Date, select: false },
  // Password reset fields
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },
  // Two-Factor Authentication fields
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false }, // Hidden by default for security
  twoFactorBackupCodes: [{ type: String, select: false }], // Array of hashed backup codes
  
  // JWT Refresh Token fields
  refreshToken: { type: String, select: false },
  refreshTokenExpiry: { type: Date, select: false },
  
  // User Settings
  settings: {
    // Privacy Settings
    analyticsEnabled: { type: Boolean, default: true },
    necessaryCookies: { type: Boolean, default: true }, // Always true, but stored for completeness
    
    // Notification Settings
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    
    // Theme and Display Settings
    theme: { 
      type: String, 
      enum: ['light', 'dark', 'system'], 
      default: 'system' 
    },
    language: { 
      type: String, 
      enum: ['english', 'urdu'], 
      default: 'english' 
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add password hashing middleware
import bcrypt from 'bcryptjs';

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Password hashing failed'));
  }
});

// Add password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Add method to get public user data
UserSchema.methods.toPublic = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Session Schema (for express-session)
const SessionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  expires: { type: Date, required: true },
  session: { type: mongoose.Schema.Types.Mixed, required: true }
});

// Speech Session Schema
const SpeechSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  sessionType: { 
    type: String, 
    enum: ['assessment', 'exercise', 'practice'], 
    required: true 
  },
  exerciseData: { type: mongoose.Schema.Types.Mixed },
  accuracyScore: { type: Number },
  duration: { type: Number },
  wordsCompleted: { type: Number, default: 0 },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Speech Record Schema
const SpeechRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, ref: 'SpeechSession' },
  userId: { type: String, required: true, ref: 'User' },
  wordAttempted: { type: String, required: true },
  userPronunciation: { type: String },
  accuracyScore: { type: Number },
  feedback: { type: String },
  audioUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// User Progress Schema
const UserProgressSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  totalSessions: { type: Number, default: 0 },
  totalWords: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  lastSessionDate: { type: Date },
  skillLevels: { type: mongoose.Schema.Types.Mixed },
  achievements: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Child Onboarding Schema
const ChildOnboardingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  parentBirthYear: { type: Number, required: true },
  
  // Child Information
  childBirthYear: { type: Number },
  childName: { type: String },
  childGender: { 
    type: String, 
    enum: ['girl', 'boy'], 
  },
  childBirthDate: { type: Date },
  
  // Interests
  interests: [{
    type: String,
    enum: ['animals', 'nature', 'vehicles', 'books', 'dinosaurs', 'music', 'space', 'robots', 'colors', 'numbers', 'shapes', 'food', 'jobs']
  }],
  
  // Assessment Data
  vocabularyLevel: {
    type: String,
    enum: ['0-words', '1-5-words', '6-10-words', '11-50-words', '50+-words', 'cant-tell']
  },
  
  seekingSpeechTherapy: { type: Boolean },
  hasBeenEvaluated: { type: Boolean },
  
  // Assessment Responses
  assessmentResponses: {
    hearing: [{
      question: { type: String, required: true },
      answer: { type: String, enum: ['yes', 'no', 'cant-tell'], required: true }
    }],
    pragmatics: [{
      question: { type: String, required: true },
      answer: { type: String, enum: ['yes', 'no', 'cant-tell'], required: true }
    }],
    play: [{
      question: { type: String, required: true },
      answer: { type: String, enum: ['yes', 'no', 'cant-tell'], required: true }
    }],
    comprehension: [{
      question: { type: String, required: true },
      answer: { type: String, enum: ['yes', 'no', 'cant-tell'], required: true }
    }]
  },
  
  // Booking Information
  evaluationBooking: {
    selectedDate: { type: Date },
    selectedTime: { type: String },
    timezone: { type: String, default: 'Pakistan Standard Time (GMT+5)' }
  },
  
  // Completion Status
  isCompleted: { type: Boolean, default: false },
  currentStep: { type: Number, default: 1 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Emotional Support Session Schema
const EmotionalSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  sessionType: { 
    type: String, 
    enum: ['chat', 'assessment', 'crisis'], 
    required: true 
  },
  mode: {
    type: String,
    enum: ['chat', 'voice'],
    default: 'chat'
  },
  title: { type: String }, // AI-generated title for the session
  messages: [{ 
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  emotionalState: { type: String },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'low' 
  },
  duration: { type: Number },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Story Game Progress Schema - Stores therapy focus, assessment data, and game progress
const StoryGameProgressSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User', unique: true },
  
  // First-time player flag
  hasCompletedInitialSetup: { type: Boolean, default: false },
  
  // Therapy focus selection (pronunciation, fluency, dld, social)
  selectedTherapyType: {
    type: String,
    enum: ['pronunciation', 'fluency', 'dld', 'social', null],
    default: null
  },
  
  // Assessment data for each therapy type
  assessments: {
    pronunciation: {
      level: { type: Number, min: 1, max: 20 },
      title: { type: String },
      feedback: { type: String },
      completedAt: { type: Date }
    },
    fluency: {
      level: { type: Number, min: 1, max: 20 },
      title: { type: String },
      feedback: { type: String },
      completedAt: { type: Date }
    },
    dld: {
      level: { type: Number, min: 1, max: 20 },
      title: { type: String },
      feedback: { type: String },
      completedAt: { type: Date }
    },
    social: {
      level: { type: Number, min: 1, max: 20 },
      title: { type: String },
      feedback: { type: String },
      completedAt: { type: Date }
    }
  },
  
  // Current levels for each therapy type (can be updated during gameplay)
  currentLevels: {
    pronunciation: { type: Number, default: 1, min: 1, max: 20 },
    fluency: { type: Number, default: 1, min: 1, max: 20 },
    dld: { type: Number, default: 1, min: 1, max: 20 },
    social: { type: Number, default: 1, min: 1, max: 20 }
  },
  
  // Game statistics
  totalGamesPlayed: { type: Number, default: 0 },
  totalStoriesCompleted: { type: Number, default: 0 },
  totalChallengesCompleted: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  
  // Badges earned per therapy type
  badgesEarned: {
    pronunciation: [{ type: String }],
    fluency: [{ type: String }],
    dld: [{ type: String }],
    social: [{ type: String }]
  },
  
  // Scores and statistics per therapy type
  therapyStats: {
    pronunciation: {
      totalSessions: { type: Number, default: 0 },
      totalStoriesCompleted: { type: Number, default: 0 },
      totalChallengesCompleted: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    },
    fluency: {
      totalSessions: { type: Number, default: 0 },
      totalStoriesCompleted: { type: Number, default: 0 },
      totalChallengesCompleted: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    },
    dld: {
      totalSessions: { type: Number, default: 0 },
      totalStoriesCompleted: { type: Number, default: 0 },
      totalChallengesCompleted: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    },
    social: {
      totalSessions: { type: Number, default: 0 },
      totalStoriesCompleted: { type: Number, default: 0 },
      totalChallengesCompleted: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Story Game Session Schema - Stores individual game session data
const StoryGameSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  sessionId: { type: String, required: true },
  
  // Game session data
  therapyType: {
    type: String,
    enum: ['pronunciation', 'fluency', 'dld', 'social'],
    required: true
  },
  character: { type: String },
  theme: { type: String },
  
  // Scores
  totalScore: { type: Number, default: 0 },
  speechScore: { type: Number, default: 0 },
  creativityScore: { type: Number, default: 0 },
  
  // Game outcome
  endingType: {
    type: String,
    enum: ['happy', 'sad', 'neutral', null],
    default: null
  },
  
  // Progress during session
  challengesCompleted: { type: Number, default: 0 },
  levelAtStart: { type: Number },
  levelAtEnd: { type: Number },
  levelUp: { type: Boolean, default: false },
  
  // Story data (summary, not full story)
  storyLength: { type: Number, default: 0 },
  wordBank: [{ type: String }],
  
  // Timestamps
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  
  createdAt: { type: Date, default: Date.now }
});

// Create models
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
export const SpeechSession = mongoose.models.SpeechSession || mongoose.model('SpeechSession', SpeechSessionSchema);
export const SpeechRecord = mongoose.models.SpeechRecord || mongoose.model('SpeechRecord', SpeechRecordSchema);
export const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);
export const ChildOnboarding = mongoose.models.ChildOnboarding || mongoose.model('ChildOnboarding', ChildOnboardingSchema);
export const EmotionalSession = mongoose.models.EmotionalSession || mongoose.model('EmotionalSession', EmotionalSessionSchema);
export const StoryGameProgress = mongoose.models.StoryGameProgress || mongoose.model('StoryGameProgress', StoryGameProgressSchema);
export const StoryGameSession = mongoose.models.StoryGameSession || mongoose.model('StoryGameSession', StoryGameSessionSchema);
