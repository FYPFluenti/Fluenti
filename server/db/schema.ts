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
  userType: 'child' | 'adult';
  language: 'english' | 'urdu';
  signupMethod: 'email' | 'google' | 'facebook';
  emailVerified: boolean;
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
    enum: ['child', 'adult'],
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
  }
}, {
  timestamps: true
});

// Note: Indexes are automatically created by the 'unique: true' field option
// No need for explicit index definitions to avoid duplicate warnings

// Prevent model overwrite error
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);