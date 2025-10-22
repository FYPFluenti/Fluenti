import { IUser } from '../db/schema';
import { generateAccessToken, generateRefreshToken, TOKEN_EXPIRY } from './jwtService';

// Mock user data for development when MongoDB is unavailable
const MOCK_USERS: Partial<IUser>[] = [
  {
    id: 'mock-user-1',
    firstName: 'Demo',
    lastName: 'User', 
    email: 'demo@fluenti.com',
    password: '$2b$10$Eg1wgF8.5pKQP7HoD.Q9Fe5RQkjK3vr9O.cOkXrQqNF4JZHj8F6XW', // "password123"
    userType: 'parent',
    language: 'en',
    profilePicture: '',
    refreshToken: null,
    refreshTokenExpiry: null,
    isVerified: true,
    verificationToken: null,
    children: []
  },
  {
    id: 'mock-user-2',
    firstName: 'Test',
    lastName: 'Parent',
    email: 'test@example.com', 
    password: '$2b$10$Eg1wgF8.5pKQP7HoD.Q9Fe5RQkjK3vr9O.cOkXrQqNF4JZHj8F6XW', // "password123"
    userType: 'parent',
    language: 'en',
    profilePicture: '',
    refreshToken: null,
    refreshTokenExpiry: null,
    isVerified: true,
    verificationToken: null,
    children: []
  }
];

// Mock onboarding data storage
const MOCK_ONBOARDING_DATA: { [userId: string]: any } = {};

export class MockDataService {
  static isEnabled = false;

  static enable() {
    this.isEnabled = true;
    console.log('🔧 Mock data service enabled');
  }

  static disable() {
    this.isEnabled = false;
  }

  // User operations
  static async findUserByEmail(email: string): Promise<Partial<IUser> | null> {
    if (!this.isEnabled) return null;
    
    const user = MOCK_USERS.find(u => u.email === email);
    return user || null;
  }

  static async findUserById(id: string): Promise<Partial<IUser> | null> {
    if (!this.isEnabled) return null;
    
    const user = MOCK_USERS.find(u => u.id === id);
    return user || null;
  }

  static async createUser(userData: Partial<IUser>): Promise<Partial<IUser>> {
    if (!this.isEnabled) throw new Error('Mock data service not enabled');
    
    const newUser = {
      ...userData,
      id: `mock-user-${Date.now()}`,
      refreshToken: null,
      refreshTokenExpiry: null,
      isVerified: true,
      children: []
    };
    
    MOCK_USERS.push(newUser);
    return newUser;
  }

  static async updateUserRefreshToken(userId: string, refreshToken: string, expiry: Date): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      user.refreshToken = refreshToken;
      user.refreshTokenExpiry = expiry;
      return true;
    }
    return false;
  }

  static async findUserByRefreshToken(refreshToken: string): Promise<Partial<IUser> | null> {
    if (!this.isEnabled) return null;
    
    const user = MOCK_USERS.find(u => 
      u.refreshToken === refreshToken && 
      u.refreshTokenExpiry && 
      u.refreshTokenExpiry > new Date()
    );
    return user || null;
  }

  static async clearUserRefreshToken(userId: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiry = null;
      return true;
    }
    return false;
  }

  // Onboarding data operations
  static async getOnboardingData(userId: string): Promise<any> {
    if (!this.isEnabled) return null;
    
    return MOCK_ONBOARDING_DATA[userId] || null;
  }

  static async saveOnboardingData(userId: string, data: any): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    MOCK_ONBOARDING_DATA[userId] = data;
    return true;
  }

  // Helper to create mock user response
  static createUserResponse(user: Partial<IUser>) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      language: user.language,
      profilePicture: user.profilePicture
    };
  }

  // Helper to set auth cookies for mock users
  static setAuthCookies(res: any, user: Partial<IUser>) {
    const accessToken = generateAccessToken({ 
      userId: user.id!, 
      email: user.email!,
      userType: user.userType! 
    });
    const refreshToken = generateRefreshToken({ 
      userId: user.id!,
      email: user.email!, 
      userType: user.userType! 
    });
    
    // Update mock user data
    this.updateUserRefreshToken(
      user.id!, 
      refreshToken, 
      new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN_MS)
    );
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS
    });

    return { accessToken, refreshToken };
  }
}