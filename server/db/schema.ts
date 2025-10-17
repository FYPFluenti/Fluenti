import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  googleId?: string;
  facebookId?: string;
  profilePicture?: string;
  userType: 'child' | 'adult' | 'guardian';
  language: 'english' | 'urdu';
  signupMethod: 'email' | 'google' | 'facebook';
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  refreshToken?: string;
  refreshTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  // Account lockout fields
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  lastFailedLoginAt?: Date;
  // 2FA fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
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
      return this.signupMethod === 'email';
    }
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  facebookId: {
    type: String,
    sparse: true,
    unique: true
  },
  profilePicture: {
    type: String
  },
  userType: {
    type: String,
    enum: ['child', 'adult', 'guardian'],
    required: true
  },
  language: {
    type: String,
    enum: ['english', 'urdu'],
    required: true
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
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpiry: {
    type: Date,
    select: false
  },
  refreshToken: {
    type: String,
    select: false // Don't return in queries by default
  },
  refreshTokenExpiry: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpiry: {
    type: Date,
    select: false
  },
  // Account lockout fields
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date,
    select: false
  },
  lastFailedLoginAt: {
    type: Date,
    select: false
  },
  // 2FA fields
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorBackupCodes: {
    type: [String],
    select: false
  }
}, {
  timestamps: true
});

// Note: Indexes are already created via unique: true in field definitions above
// No need for separate index() calls to avoid duplication warnings

// Prevent model overwrite error
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);