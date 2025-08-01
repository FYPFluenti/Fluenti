import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration for production
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://fluentiai.netlify.app'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Logging middleware
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

      console.log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

(async () => {
  // Debug all environment variables
  console.log('=== ALL ENVIRONMENT VARIABLES ===');
  Object.keys(process.env).forEach(key => {
    if (key.includes('PORT') || key.includes('port')) {
      console.log(`${key}:`, process.env[key]);
    }
  });
  console.log('=====================================');
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Render provides PORT automatically, fallback to 10000 for local development
  const portEnv = process.env.PORT;
  console.log('Environment PORT value:', portEnv);
  
  let port;
  if (portEnv && /^\d+$/.test(portEnv)) {
    // PORT is a valid number
    port = parseInt(portEnv, 10);
  } else {
    // PORT is not a valid number, use default
    console.log('PORT is not a valid number, using default 10000');
    port = 10000;
  }
  
  console.log('Using port:', port);
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`Backend API serving on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log('Environment variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- PORT (raw):', process.env.PORT);
    console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
  });
})();
