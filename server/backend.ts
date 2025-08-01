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

  // Handle Render's unusual PORT environment variable
  // Render sometimes provides PORT as a hash instead of a number
  const portEnv = process.env.PORT;
  console.log('Environment PORT value:', portEnv);
  console.log('PORT type:', typeof portEnv);
  console.log('PORT is numeric:', /^\d+$/.test(portEnv || ''));
  
  // For Render, just use 10000 regardless of what they provide in PORT
  // This is a workaround for Render's hash-based PORT variable
  const port = 10000;
  console.log('Using hardcoded port 10000 for Render compatibility');
  console.log('Final port decision:', port);
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Backend API serving on port ${port} (0.0.0.0:${port})`);
    console.log(`🌐 External URL: https://fluenti.onrender.com`);
    console.log(`🏥 Health check: https://fluenti.onrender.com/health`);
    console.log('📊 Server Status: READY FOR REQUESTS');
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- PORT (raw):', process.env.PORT);
    console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    console.log('='.repeat(50));
  });
  
  server.on('error', (err: any) => {
    console.error('❌ Server failed to start:', err.message);
    console.error('Error code:', err.code);
    console.error('Port attempted:', port);
    
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      // Try alternative ports for Render
      const altPorts = [3000, 8080, 5000, 8000];
      console.log('Trying alternative ports:', altPorts);
    }
    process.exit(1);
  });
})();
