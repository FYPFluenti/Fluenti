/**
 * Environment Configuration
 * Centralized access to environment variables
 */

export const env = {
  // Speech Therapy & Games Configuration
  speech: {
    apiKey: import.meta.env.VITE_SPEECH_API_KEY || '',
    clinicalApiKey: import.meta.env.VITE_CLINICAL_API_KEY || '',
    articulationApiKey: import.meta.env.VITE_ARTICULATION_API_KEY || '',
    enableRecognition: import.meta.env.VITE_ENABLE_SPEECH_RECOGNITION === 'true',
  },

  // Application Environment
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
    isProduction: import.meta.env.VITE_APP_ENV === 'production',
  },

  // OAuth Configuration
  oauth: {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
  },

  // Feature Flags
  features: {
    speechRecognition: import.meta.env.VITE_ENABLE_SPEECH_RECOGNITION === 'true',
    therapeuticGames: true,
    browserGames: true,
    apiGames: import.meta.env.VITE_CLINICAL_API_KEY !== '',
  },
} as const;

// Helper function to check if speech features are available
export const isSpeechEnabled = () => {
  return env.speech.enableRecognition && 'webkitSpeechRecognition' in window;
};

// Helper function to check if running in development
export const isDev = () => env.app.isDevelopment;

// Helper function to check if running in production
export const isProd = () => env.app.isProduction;

// Export individual configs for convenience
export const speechConfig = env.speech;
export const appConfig = env.app;
export const oauthConfig = env.oauth;
export const features = env.features;
