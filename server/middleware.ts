import { Request, Response, NextFunction } from 'express';
import { mongoStorage } from './mongoStorage';

// Middleware to extract token from Authorization header
export async function extractTokenFromHeader(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      
      // Try to find user by token (which is the user ID)
      if (token) {
        try {
          console.log('🔍 Looking up user by token:', token);
          const user = await mongoStorage.getUser(token);
          if (user) {
            console.log('✅ User found by token:', user.id, user.userType);
            // Attach user to request object
            (req as any).user = {
              ...user.toObject(),
              claims: { sub: user.id }
            };
          } else {
            console.log('❌ User not found for token:', token);
          }
        } catch (error) {
          // Only log error if it's not a connection issue (to avoid spam)
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log('🔴 Token validation error for token:', token, errorMessage);
          if (!errorMessage.includes('MongoDB') && !errorMessage.includes('connection')) {
            console.error('Token validation error:', error);
          }
        }
      }
    }
    
    // Continue to the next middleware regardless of token validation
    next();
  } catch (error) {
    console.error('Token extraction error:', error);
    next();
  }
}

// Alternative isAuthenticated middleware that checks for token auth as well
export function tokenBasedAuth(req: Request, res: Response, next: NextFunction) {
  console.log('🔐 tokenBasedAuth check:', {
    path: req.path,
    hasSession: !!(req as any).isAuthenticated?.(),
    hasUser: !!(req as any).user,
    userId: (req as any).user?.id,
    authHeader: req.headers.authorization ? 'present' : 'missing'
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
