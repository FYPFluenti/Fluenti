import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Added password field
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profileImageUrl: { type: String },
  userType: { 
    type: String, 
    enum: ['child', 'adult', 'guardian'], 
    default: 'child' 
  },
  language: { 
    type: String, 
    enum: ['english', 'urdu', 'both'], 
    default: 'english' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

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

// Emotional Support Session Schema
const EmotionalSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  sessionType: { 
    type: String, 
    enum: ['chat', 'assessment', 'crisis'], 
    required: true 
  },
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

// Create models
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
export const SpeechSession = mongoose.models.SpeechSession || mongoose.model('SpeechSession', SpeechSessionSchema);
export const SpeechRecord = mongoose.models.SpeechRecord || mongoose.model('SpeechRecord', SpeechRecordSchema);
export const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);
export const EmotionalSession = mongoose.models.EmotionalSession || mongoose.model('EmotionalSession', EmotionalSessionSchema);
