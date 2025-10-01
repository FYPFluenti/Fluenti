import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fluenti';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, isConnected: false };
}

// Enhanced connection options with timeout and retry settings
const connectionOptions = {
  bufferCommands: true, // Enable buffering to prevent premature queries
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // 45 second socket timeout
  connectTimeoutMS: 10000, // 10 second connection timeout
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  retryWrites: true,
  retryReads: true,
  // Add connection string options that might help with DNS issues
  family: 4, // Force IPv4 to avoid DNS issues
};

async function connectDB() {
  // Return existing connection if available and connected
  if (cached.conn && cached.isConnected) {
    return cached.conn;
  }

  // Check if mongoose is already connected
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    cached.isConnected = true;
    console.log('✅ Using existing MongoDB connection');
    return mongoose;
  }

  if (!cached.promise) {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', MONGODB_URI.replace(/:[^:]*@/, ':***@')); // Hide password in logs
    
    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        console.log('📊 Connection state:', mongoose.connection.readyState);
        cached.isConnected = true;
        
        // Set up connection event listeners
        mongoose.connection.on('connected', () => {
          console.log('🟢 MongoDB connection established');
          cached.isConnected = true;
        });
        
        mongoose.connection.on('disconnected', () => {
          console.log('🔴 MongoDB disconnected');
          cached.isConnected = false;
        });
        
        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
          cached.isConnected = false;
        });
        
        return mongoose;
      })
      .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        cached.promise = null; // Reset promise so we can try again
        cached.isConnected = false;
        
        // For development, allow the app to continue without MongoDB
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️  Using mock data for development (MongoDB unavailable)');
          // Don't throw error in development, return a mock connection
          return mongoose;
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.isConnected = false;
    
    // In development, don't crash the app if MongoDB is unavailable
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  MongoDB connection failed, continuing with local fallback');
      return mongoose; // Return mongoose even if not connected
    }
    
    throw e;
  }
}

// Function to check if MongoDB is actually connected
export function isMongoConnected(): boolean {
  return cached?.isConnected && mongoose.connection.readyState === 1;
}

// Function to wait for connection with timeout
export async function waitForConnection(timeoutMs = 15000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (isMongoConnected()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

export default connectDB;
