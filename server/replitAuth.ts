import * as client from "openid-client";
// import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { mongoStorage } from "./mongoStorage";

function getUserDashboardUrl(userType: string): string {
  switch (userType) {
    case 'child':
      return '/child-dashboard';
    case 'adult':
      return '/adult-dashboard';
    case 'guardian':
      return '/guardian-dashboard';
    default:
      return '/';
  }
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // For local development, use memory store
  if (process.env.NODE_ENV === 'development' && process.env.REPL_ID === 'local-development') {
    return session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Allow non-HTTPS for local development
        maxAge: sessionTtl,
      },
    });
  }
  
  // Production setup with PostgreSQL store
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await mongoStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // For local development, bypass Replit OIDC
  if (process.env.NODE_ENV === 'development' && process.env.REPL_ID === 'local-development') {
    // Simple local auth for development
    app.get("/api/login", async (req, res) => {
      // Default user data
      let userData = {
        id: 'local-user-123',
        email: 'developer@local.dev',
        firstName: 'Local',
        lastName: 'Developer',
        profileImageUrl: 'https://via.placeholder.com/150',
        userType: 'adult' as const,
        language: 'english' as const
      };

      // Check for signup data in query parameters (from frontend sessionStorage)
      const signupData = req.query.signupData as string;
      if (signupData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(signupData));
          userData = {
            id: `user-${Date.now()}`,
            email: parsed.email || userData.email,
            firstName: parsed.firstName || userData.firstName,
            lastName: parsed.lastName || userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            userType: parsed.userType || userData.userType,
            language: parsed.language || userData.language
          };
        } catch (error) {
          console.log('Error parsing signup data, using default user');
        }
      }
      
      try {
        // Store user in database
        await mongoStorage.upsertUser(userData);
      } catch (error) {
        console.log('Database not available, continuing with mock user');
      }
      
      // Create session
      req.login({ claims: { sub: userData.id }, ...userData }, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        // Redirect based on user type
        const redirectUrl = getUserDashboardUrl(userData.userType);
        res.redirect(redirectUrl);
      });
    });
    
    app.get("/api/callback", (req, res) => {
      res.redirect('/');
    });
    
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect('/');
      });
    });
    
    passport.serializeUser((user: any, cb) => cb(null, user));
    passport.deserializeUser((user: any, cb) => cb(null, user));
    
    return;
  }

  // Production Replit auth setup would go here
  console.log("Production Replit auth not implemented for local development");

}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For local development, check if user is logged in via session
  if (process.env.NODE_ENV === 'development' && process.env.REPL_ID === 'local-development') {
    if (req.isAuthenticated() && req.user) {
      return next();
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
