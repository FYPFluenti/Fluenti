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
          const user = await mongoStorage.getUser(token);
          if (user) {
            // Attach user to request object
            (req as any).user = {
              ...user,
              claims: { sub: user.id }
            };
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
  // If user is already authenticated via session, continue
  if ((req as any).isAuthenticated?.() && (req as any).user) {
    return next();
  }
  
  // If user was attached via token extraction, they're authenticated
  if ((req as any).user) {
    return next();
  }
  
  // No authentication found - return 401 without logging (this is expected behavior)
  return res.status(401).json({ message: "Unauthorized" });
}
