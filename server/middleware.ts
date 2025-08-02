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
          console.log('Looking up user with token:', token);
          const user = await mongoStorage.getUser(token);
          if (user) {
            console.log('Found user:', user.id, user.userType);
            // Attach user to request object
            (req as any).user = {
              ...user.toObject(),
              claims: { sub: user.id }
            };
          } else {
            console.log('No user found for token:', token);
          }
        } catch (error) {
          console.error('Token validation error:', error);
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
  console.log('tokenBasedAuth: Checking authentication for', req.method, req.path);
  console.log('tokenBasedAuth: req.user exists:', !!(req as any).user);
  console.log('tokenBasedAuth: req.isAuthenticated exists:', !!(req as any).isAuthenticated);
  
  // If user is already authenticated via session, continue
  if ((req as any).isAuthenticated?.() && (req as any).user) {
    console.log('tokenBasedAuth: Authenticated via session');
    return next();
  }
  
  // If user was attached via token extraction, they're authenticated
  if ((req as any).user) {
    console.log('tokenBasedAuth: Authenticated via token');
    return next();
  }
  
  console.log('tokenBasedAuth: No authentication found - returning 401');
  // No authentication found - return 401 without logging (this is expected behavior)
  return res.status(401).json({ message: "Unauthorized" });
}
