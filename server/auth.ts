import bcrypt from 'bcryptjs';
import { mongoStorage } from './mongoStorage';
import { nanoid } from 'nanoid';

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
  static async signup(signupData: SignupData) {
    try {
      // Check if user already exists
      const existingUser = await mongoStorage.getUserByEmail(signupData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(signupData.password);

      // Create user with hashed password
      const user = await mongoStorage.upsertUser({
        id: `user-${nanoid()}`,
        email: signupData.email,
        password: hashedPassword,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        profileImageUrl: 'https://via.placeholder.com/150',
        userType: signupData.userType,
        language: signupData.language,
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error: any) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  // Login user
  static async login(loginData: LoginData) {
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

      // Return user without password
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }
}
