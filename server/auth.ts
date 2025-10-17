import bcrypt from 'bcryptjs';
import { mongoStorage } from './mongoStorage';
import { nanoid } from 'nanoid';
import { generateTokenPair, type JWTPayload, type TokenPair } from './services/jwtService';
import { User } from './db/schema';
import { 
  generateVerificationToken, 
  sendVerificationEmail, 
  sendPasswordResetEmail,
  sendAccountLockoutEmail,
  send2FASetupEmail 
} from './services/emailService';
import {
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  removeBackupCode
} from './services/twoFactorService';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'child' | 'adult' | 'guardian';
  language: 'english' | 'urdu' | 'both';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    language: string;
    profileImageUrl?: string;
  };
  tokens: TokenPair;
}

export class AuthService {
  // Hash password before storing
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Register new user
  static async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await mongoStorage.getUserByEmail(signupData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(signupData.password);

      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with hashed password
      const userId = `user-${nanoid()}`;
      const user = await mongoStorage.upsertUser({
        id: userId,
        email: signupData.email,
        password: hashedPassword,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        profileImageUrl: 'https://via.placeholder.com/150',
        userType: signupData.userType,
        language: signupData.language,
      });

      // Store verification token using MongoDB collection directly to bypass Mongoose schema restrictions
      const collection = User.collection;
      const updateResult = await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
          }
        }
      );

      console.log('✅ Email verification token save result:', updateResult);
      console.log('  User:', user.email);
      console.log('  Token:', verificationToken);
      console.log('  Expiry:', verificationExpiry);
      console.log('  Modified count:', updateResult.modifiedCount);
      
      // Verify the token was actually saved by querying the collection directly
      const verifyDoc = await collection.findOne({ _id: user._id });
      console.log('  Verification - Token in DB:', verifyDoc?.emailVerificationToken);
      console.log('  Verification - Tokens match:', verifyDoc?.emailVerificationToken === verificationToken);

      // Send verification email (non-blocking)
      sendVerificationEmail(user.email, user.firstName, verificationToken)
        .catch(err => console.error('Failed to send verification email:', err));

      // Generate JWT tokens
      const jwtPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        userType: user.userType as 'child' | 'adult' | 'guardian',
      };
      const tokens = generateTokenPair(jwtPayload);

      // Store refresh token in database
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          refreshToken: tokens.refreshToken,
          refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      );

      // Return user without sensitive data
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          language: user.language,
          profileImageUrl: user.profileImageUrl,
        },
        tokens,
      };
    } catch (error: any) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  // Login user
  static async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      // Find user by email (include locked fields)
      const user = await User.findOne({ email: loginData.email })
        .select('+accountLockedUntil +lastFailedLoginAt +password');
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      console.log('🔐 Login attempt for:', loginData.email);
      console.log('  emailVerified from Mongoose:', user.emailVerified);
      console.log('  signupMethod:', user.signupMethod);
      
      // Check directly in MongoDB to see actual value
      const dbUser = await User.collection.findOne({ email: loginData.email });
      console.log('  emailVerified from MongoDB:', dbUser?.emailVerified);

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const minutesRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
        throw new Error(`Account is locked. Please try again in ${minutesRemaining} minutes.`);
      }

      // Check if email is verified (allow social logins to skip)
      // Use MongoDB value since Mongoose might be stale
      if (!dbUser?.emailVerified && user.signupMethod === 'email') {
        throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(loginData.password, user.password!);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const MAX_FAILED_ATTEMPTS = 5;
        const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
        
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          // Lock the account
          const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          await User.findOneAndUpdate(
            { _id: user._id },
            {
              failedLoginAttempts: failedAttempts,
              accountLockedUntil: lockoutUntil,
              lastFailedLoginAt: new Date(),
            }
          );
          
          // Send lockout notification email (non-blocking)
          sendAccountLockoutEmail(user.email, user.firstName, lockoutUntil)
            .catch(err => console.error('Failed to send lockout email:', err));
          
          throw new Error('Too many failed login attempts. Your account has been locked for 30 minutes.');
        } else {
          // Update failed attempts
          await User.findOneAndUpdate(
            { _id: user._id },
            {
              failedLoginAttempts: failedAttempts,
              lastFailedLoginAt: new Date(),
            }
          );
          
          const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedAttempts;
          throw new Error(`Invalid email or password. ${attemptsRemaining} attempts remaining before account lockout.`);
        }
      }

      // Successful login - reset failed attempts and clear lockout
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          failedLoginAttempts: 0,
          $unset: { accountLockedUntil: '', lastFailedLoginAt: '' },
        }
      );

      // Generate JWT tokens
      const jwtPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        userType: user.userType as 'child' | 'adult' | 'guardian',
      };
      const tokens = generateTokenPair(jwtPayload);

      // Store refresh token in database
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          refreshToken: tokens.refreshToken,
          refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      );

      // Return user without sensitive data
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          language: user.language,
          profileImageUrl: user.profileImageUrl,
        },
        tokens,
      };
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Logout user - invalidate refresh token
  static async logout(userId: string): Promise<void> {
    try {
      await User.findOneAndUpdate(
        { id: userId },
        {
          $unset: { refreshToken: '', refreshTokenExpiry: '' }
        }
      );
    } catch (error: any) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Refresh access token using refresh token
  static async refreshAccessToken(userId: string, oldRefreshToken: string): Promise<TokenPair> {
    try {
      // Find user and check if refresh token matches
      const user = await User.findOne({ id: userId }).select('+refreshToken +refreshTokenExpiry');
      
      if (!user || !user.refreshToken || user.refreshToken !== oldRefreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
        throw new Error('Refresh token expired');
      }

      // Generate new token pair
      const jwtPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        userType: user.userType as 'child' | 'adult' | 'guardian',
      };
      const tokens = generateTokenPair(jwtPayload);

      // Update refresh token in database
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          refreshToken: tokens.refreshToken,
          refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      );

      return tokens;
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Verify email with token
  static async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Email verification attempt:');
      console.log('  Token received:', token);
      console.log('  Token length:', token.length);
      console.log('  Current time:', new Date());
      
      // Check how many users have verification tokens
      const allUsersWithTokens = await User.find({}).select('+emailVerificationToken +emailVerificationExpiry +email');
      console.log('  Total users in database:', allUsersWithTokens.length);
      console.log('  Users with verification tokens:', allUsersWithTokens.filter(u => u.emailVerificationToken).length);
      
      // Log first few characters of each token (for debugging)
      allUsersWithTokens.forEach(u => {
        if (u.emailVerificationToken) {
          console.log(`  - User ${u.email}: token=${u.emailVerificationToken?.substring(0, 8)}..., expiry=${u.emailVerificationExpiry}`);
        }
      });
      
      // Find user with this verification token
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpiry: { $gt: new Date() }, // Token must not be expired
      }).select('+emailVerificationToken +emailVerificationExpiry');

      console.log('  User found with token:', !!user);
      
      if (!user) {
        // Try without expiry check to see if token exists but is expired
        const expiredUser = await User.findOne({
          emailVerificationToken: token,
        }).select('+emailVerificationToken +emailVerificationExpiry');
        
        if (expiredUser) {
          console.log('  Token found but expired:', expiredUser.emailVerificationExpiry);
          throw new Error('Verification token has expired. Please request a new one.');
        }
        
        throw new Error('Invalid or expired verification token');
      }

      // Mark email as verified and clear verification token using MongoDB collection
      const collection = User.collection;
      const updateResult = await collection.updateOne(
        { _id: user._id },
        {
          $set: { emailVerified: true },
          $unset: { emailVerificationToken: '', emailVerificationExpiry: '' },
        }
      );

      console.log('✅ Email verified successfully for user:', user.email);
      console.log('  Modified count:', updateResult.modifiedCount);
      
      // Verify the update
      const verifyDoc = await collection.findOne({ _id: user._id });
      console.log('  emailVerified in DB:', verifyDoc?.emailVerified);
      console.log('  Token cleared:', !verifyDoc?.emailVerificationToken);

      return {
        success: true,
        message: 'Email verified successfully! You can now log in.',
      };
    } catch (error: any) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  // Resend verification email
  static async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update verification token using MongoDB collection directly
      const collection = User.collection;
      const updateResult = await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
          }
        }
      );

      console.log('✅ New verification token saved for user:', user.email);
      console.log('  Modified count:', updateResult.modifiedCount);
      
      // Verify it was saved
      const verifyDoc = await collection.findOne({ _id: user._id });
      console.log('  Token in DB:', verifyDoc?.emailVerificationToken ? 'YES' : 'NO');

      // Send verification email
      await sendVerificationEmail(user.email, user.firstName, verificationToken);

      return {
        success: true,
        message: 'Verification email sent successfully',
      };
    } catch (error: any) {
      throw new Error(`Failed to resend verification email: ${error.message}`);
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpiry');

      if (!user) {
        // Don't reveal if user exists - return success anyway
        return {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      }

      // Generate password reset token
      const resetToken = generateVerificationToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      console.log('🔐 Generating password reset token:');
      console.log('  Email:', user.email);
      console.log('  User ID:', user._id);
      console.log('  Token:', resetToken);
      console.log('  Expiry:', resetExpiry);

      // Store reset token using MongoDB collection directly
      const collection = User.collection;
      const updateResult = await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetToken: resetToken,
            passwordResetExpiry: resetExpiry,
          }
        }
      );

      console.log('✅ Token update result:', updateResult);
      console.log('  Modified count:', updateResult.modifiedCount);
      
      // Verify the token was saved by querying collection directly
      const verifyDoc = await collection.findOne({ _id: user._id });
      console.log('  Verification - Token in DB:', verifyDoc?.passwordResetToken);
      console.log('  Verification - Expiry in DB:', verifyDoc?.passwordResetExpiry);
      console.log('  Tokens match:', verifyDoc?.passwordResetToken === resetToken);

      // Send password reset email (non-blocking)
      sendPasswordResetEmail(user.email, user.firstName, resetToken)
        .catch(err => console.error('Failed to send password reset email:', err));

      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    } catch (error: any) {
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Password reset attempt:');
      console.log('  Token:', token);
      console.log('  Current time:', new Date());
      
      // First, find all users and check their tokens (for debugging)
      const allUsersWithTokens = await User.find({}).select('+passwordResetToken +passwordResetExpiry');
      console.log('  Total users with reset tokens:', allUsersWithTokens.filter(u => u.passwordResetToken).length);
      
      // Find user with this reset token - need to select the field first
      const user = await User.findOne({
        passwordResetToken: token,
      }).select('+passwordResetToken +passwordResetExpiry +password');

      console.log('  User found:', !!user);
      if (user) {
        console.log('  Token matches:', user.passwordResetToken === token);
        console.log('  Token expiry:', user.passwordResetExpiry);
        console.log('  Token expired:', user.passwordResetExpiry ? user.passwordResetExpiry < new Date() : 'N/A');
        console.log('  Is token still valid:', user.passwordResetExpiry ? user.passwordResetExpiry > new Date() : false);
      }

      if (!user) {
        throw new Error('Invalid or expired password reset token');
      }
      
      // Check if token is expired
      if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
        throw new Error('Password reset token has expired');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password and clear reset token using MongoDB collection directly
      const collection = User.collection;
      await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            failedLoginAttempts: 0,
          },
          $unset: {
            passwordResetToken: '',
            passwordResetExpiry: '',
            accountLockedUntil: '',
            lastFailedLoginAt: '',
          }
        }
      );

      console.log('✅ Password updated successfully');

      return {
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      };
    } catch (error: any) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // ===== 2FA Methods =====

  /**
   * Setup 2FA for user
   * Returns secret and QR code
   */
  static async setup2FA(userId: string): Promise<{
    success: boolean;
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    try {
      const user = await User.findOne({ id: userId });
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.twoFactorEnabled) {
        throw new Error('2FA is already enabled for this account');
      }

      // Generate 2FA secret
      const { secret, otpauth_url } = generate2FASecret(user.email);
      
      // Generate QR code
      const qrCode = await generateQRCode(otpauth_url);
      
      // Generate backup codes
      const backupCodes = generateBackupCodes(8);
      const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

      // Store secret and backup codes (but don't enable 2FA yet)
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          twoFactorSecret: secret,
          twoFactorBackupCodes: hashedBackupCodes,
          // Don't enable 2FA until user verifies it works
        }
      );

      return {
        success: true,
        secret,
        qrCode,
        backupCodes, // Return unhashed codes for user to save
      };
    } catch (error: any) {
      throw new Error(`2FA setup failed: ${error.message}`);
    }
  }

  /**
   * Verify and enable 2FA
   */
  static async verify2FA(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({ id: userId }).select('+twoFactorSecret');
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorSecret) {
        throw new Error('2FA setup not initiated. Please setup 2FA first.');
      }

      // Verify token
      const isValid = verify2FAToken(token, user.twoFactorSecret);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          twoFactorEnabled: true,
        }
      );

      // Send confirmation email (non-blocking)
      send2FASetupEmail(user.email, user.firstName)
        .catch(err => console.error('Failed to send 2FA setup email:', err));

      return {
        success: true,
        message: '2FA enabled successfully',
      };
    } catch (error: any) {
      throw new Error(`2FA verification failed: ${error.message}`);
    }
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({ id: userId }).select('+password +twoFactorSecret +twoFactorBackupCodes');
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorEnabled) {
        throw new Error('2FA is not enabled for this account');
      }

      // Verify password for security
      const isPasswordValid = await this.verifyPassword(password, user.password!);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Disable 2FA and clear secrets
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          twoFactorEnabled: false,
          $unset: { twoFactorSecret: '', twoFactorBackupCodes: '' },
        }
      );

      return {
        success: true,
        message: '2FA disabled successfully',
      };
    } catch (error: any) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Verify 2FA token during login
   */
  static async verify2FALogin(userId: string, token: string, isBackupCode: boolean = false): Promise<boolean> {
    try {
      const user = await User.findOne({ id: userId })
        .select('+twoFactorSecret +twoFactorBackupCodes');
      
      if (!user || !user.twoFactorEnabled) {
        throw new Error('2FA not enabled');
      }

      if (isBackupCode) {
        // Verify backup code
        if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
          throw new Error('No backup codes available');
        }

        const isValid = verifyBackupCode(token, user.twoFactorBackupCodes);
        
        if (isValid) {
          // Remove used backup code
          const updatedCodes = removeBackupCode(token, user.twoFactorBackupCodes);
          await User.findOneAndUpdate(
            { _id: user._id },
            { twoFactorBackupCodes: updatedCodes }
          );
          return true;
        }
        
        return false;
      } else {
        // Verify TOTP token
        if (!user.twoFactorSecret) {
          throw new Error('2FA secret not found');
        }

        return verify2FAToken(token, user.twoFactorSecret);
      }
    } catch (error: any) {
      console.error('2FA login verification error:', error.message);
      return false;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  static async has2FAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ id: userId });
      return user?.twoFactorEnabled || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate new backup codes
   */
  static async regenerateBackupCodes(userId: string, password: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    message: string;
  }> {
    try {
      const user = await User.findOne({ id: userId }).select('+password');
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorEnabled) {
        throw new Error('2FA is not enabled for this account');
      }

      // Verify password for security
      const isPasswordValid = await this.verifyPassword(password, user.password!);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes(8);
      const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

      // Update backup codes
      await User.findOneAndUpdate(
        { _id: user._id },
        { twoFactorBackupCodes: hashedBackupCodes }
      );

      return {
        success: true,
        backupCodes,
        message: 'Backup codes regenerated successfully',
      };
    } catch (error: any) {
      throw new Error(`Failed to regenerate backup codes: ${error.message}`);
    }
  }
}
