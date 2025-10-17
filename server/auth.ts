import bcrypt from 'bcryptjs';
import { mongoStorage } from './mongoStorage';
import { nanoid } from 'nanoid';
import { generateTokenPair, type JWTPayload, type TokenPair } from './services/jwtService';
import { User } from './db/schema';

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
      // Find user by email
      const user = await mongoStorage.getUserByEmail(loginData.email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(loginData.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

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
}
