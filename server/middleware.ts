import { Request, Response, NextFunction } from 'express';
import { mongoStorage } from './mongoStorage';
import { verifyAccessToken } from './services/jwtService';

// Middleware to extract and validate JWT from cookie or Authorization header
export async function extractAndValidateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip for static files and health checks
    if (req.path.includes('.') || req.path === '/health') {
      return next();
    }

    // Try to get token from httpOnly cookie first (preferred)
    let token = req.cookies?.accessToken;
    
    // Fallback to Authorization header for API clients
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (token) {
      try {
        // Verify JWT token
        const payload = verifyAccessToken(token);
        
        // Fetch user from database only if not already cached
        if (!(req as any).user || (req as any).user.id !== payload.userId) {
          const user = await mongoStorage.getUser(payload.userId);
          if (user) {
            // Attach user to request object
            (req as any).user = {
              ...user.toObject(),
              claims: { sub: user.id }
            };
            console.log('✅ Valid JWT token for user:', payload.userId);
          } else {
            console.log('❌ User not found in database:', payload.userId);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('expired')) {
          console.log('⏰ Access token expired, client should refresh');
          // Clear any existing user attachment
          (req as any).user = null;
        } else if (!errorMessage.includes('MongoDB') && !errorMessage.includes('connection')) {
          console.log('🔴 Token validation error:', errorMessage);
          (req as any).user = null;
        }
      }
    }
    
    // Continue to the next middleware regardless of token validation
    next();
  } catch (error) {
    console.error('JWT extraction error:', error);
    next();
  }
}

// Alternative isAuthenticated middleware that checks for token auth as well
export function tokenBasedAuth(req: Request, res: Response, next: NextFunction) {
  console.log('🔐 tokenBasedAuth check:', {
    path: req.path,
    fullUrl: req.originalUrl,
    hasSession: !!(req as any).isAuthenticated?.(),
    hasUser: !!(req as any).user,
    userId: (req as any).user?.id,
    authHeader: req.headers.authorization ? 'present' : 'missing',
    hasCookie: !!req.cookies?.accessToken
  });
  
  // If user is already authenticated via session, continue
  if ((req as any).isAuthenticated?.() && (req as any).user) {
    console.log('✅ Auth via session');
    return next();
  }
  
  // If user was attached via token extraction, they're authenticated
  if ((req as any).user) {
    console.log('✅ Auth via token');
    return next();
  }
  
  // No authentication found
  console.log('❌ No auth found, returning 401');
  return res.status(401).json({ message: "Unauthorized" });
}
