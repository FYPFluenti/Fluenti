import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Get JWT secrets from environment or generate secure defaults for development
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || crypto.randomBytes(64).toString('hex');

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const RESET_TOKEN_EXPIRY = '1h'; // 1 hour

// Warn in production if using generated secrets
if (process.env.NODE_ENV === 'production' && !process.env.JWT_ACCESS_SECRET) {
  console.warn('⚠️ WARNING: Using generated JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production!');
}

export interface JWTPayload {
  userId: string;
  email: string;
  userType: 'child' | 'adult' | 'guardian';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token (short-lived, 15 minutes)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'fluenti-ai',
    audience: 'fluenti-client',
  });
}

/**
 * Generate refresh token (long-lived, 7 days)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'fluenti-ai',
    audience: 'fluenti-client',
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'fluenti-ai',
      audience: 'fluenti-client',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'fluenti-ai',
      audience: 'fluenti-client',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Generate password reset token
 */
export function generateResetToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: 'password-reset' },
    JWT_RESET_SECRET,
    {
      expiresIn: RESET_TOKEN_EXPIRY,
      issuer: 'fluenti-ai',
      audience: 'fluenti-client',
    }
  );
}

/**
 * Verify password reset token
 */
export function verifyResetToken(token: string): { userId: string; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_RESET_SECRET, {
      issuer: 'fluenti-ai',
      audience: 'fluenti-client',
    }) as any;

    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Reset token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid reset token');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Get token expiration times (for cookie max-age)
 */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN_MS: 15 * 60 * 1000, // 15 minutes in milliseconds
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};
