import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import type { Express } from "express";
import connectDB from "./mongodb";
import authRoutes from "./routes/auth";
import feedbackRoutes from "./routes/feedback";
import settingsRoutes from "./routes/settings";
import { extractAndValidateJWT } from "./middleware";
import path from "path";


const app = express();

connectDB();
  
// Add cookie parser middleware
app.use(cookieParser());

// Explicit UTF-8 support for Urdu text
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  if (req.url.includes('/api/settings/profile')) {
    console.log(`🌐 Incoming ${req.method} request to: ${req.url}`);
    console.log(`🌐 Content-Type: ${req.headers['content-type']}`);
    console.log(`🌐 Has Cookie: ${!!req.headers.cookie}`);
  }
  next();
});

// Add JWT extraction middleware globally
app.use(extractAndValidateJWT);

// Register auth routes (after JSON parsing middleware)
app.use("/api/auth", authRoutes);

// Register feedback routes (after JSON parsing middleware)
app.use("/api/feedback", feedbackRoutes);

// Register settings routes (after JSON parsing middleware)
app.use("/api/settings", settingsRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ensure UTF-8 encoding
app.use((req, res, next) => {
  req.setEncoding = req.setEncoding || (() => {});
  next();
});

// CORS configuration for production
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fluentiai.netlify.app',
    'https://fluenti.netlify.app', // Alternative domain
    'https://fluenti-backend.onrender.com',
    'https://web-production-7c65.up.railway.app',
    process.env.FRONTEND_URL || 'https://fluentiai.netlify.app'
  ];
  
  const origin = req.headers.origin;
  
  // Check if origin is in allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // For deployment troubleshooting, allow any origin in development
    // In production, log but still allow for debugging (remove in final version)
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // In production, only allow if it matches a pattern
      const isNetlifyApp = origin.includes('.netlify.app');
      const isLocalhost = origin.includes('localhost');
      if (isNetlifyApp || isLocalhost) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        console.log(`Allowing access from origin: ${origin}`);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
        return res.status(403).json({ message: 'CORS policy violation' });
      }
    }
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // In production, only serve static files if frontend is built and present
    // If frontend is deployed separately (e.g., Vercel), this will gracefully skip
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
