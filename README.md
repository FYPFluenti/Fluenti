# Fluenti

> AI-Powered Speech Therapy and Emotional Support Platform

Fluenti is a comprehensive platform that combines interactive story-building games for speech therapy with AI-powered emotional support sessions. Designed for both children and adults, it uses cutting-edge AI technology to provide personalized therapeutic experiences.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
  - [Story Game (Children)](#story-game-children)
  - [Emotional Support (Adults)](#emotional-support-adults)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### For Children

- **Interactive Story Game**: Speech therapy through engaging story-building adventures
- **Multiple Therapy Types**: Pronunciation, Fluency, DLD (Developmental Language Disorder), and Social Communication
- **Progress Tracking**: Detailed analytics and progress dashboards
- **Gamification**: Badges, levels, and rewards to motivate children
- **Voice Interaction**: Real-time speech recognition and text-to-speech narration
- **Adaptive Learning**: AI-powered assessments determine starting levels

### For Adults

- **Chat & Voice Therapy**: Text-based and voice-based emotional support sessions
- **AI-Powered Therapy Bot**: Professional therapeutic responses using advanced LLMs
- **Psychological Insights**: Long-term pattern analysis and progress tracking
- **Crisis Detection**: Automated detection of crisis situations with immediate support resources
- **Session History**: Access and continue previous therapy sessions
- **Privacy-First**: Encrypted conversations and secure data handling

---

## Architecture

Fluenti follows a modern full-stack architecture:

```
┌─────────────────┐
│   React Client  │  (Frontend - Port 5173)
│   (TypeScript)  │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│  Express Server │  (Backend - Port 3000)
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │        │
┌───▼───┐ ┌──▼────────┐
│MongoDB│ │Python Flask│  (Therapy Service - Port 5001)
│       │ │  Service   │
└───────┘ └────────────┘
```

### Component Overview

- **Frontend**: React 18 with TypeScript, Wouter routing, Framer Motion animations
- **Backend**: Node.js/Express API server with MongoDB
- **Therapy Service**: Python Flask service for emotional support
- **AI Services**: Google Gemini (story generation), Groq (therapy responses), OpenAI (STT/TTS)

---

## Technology Stack

### Frontend

- **Framework**: React 18.3.1 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS, Radix UI components
- **Animations**: Framer Motion
- **State Management**: React Query (TanStack Query)
- **Build Tool**: Vite
- **Charts**: Recharts

### Backend

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (httpOnly cookies)
- **Email**: Brevo (Sendinblue)

### AI/ML Services

- **Story Generation**: Google Gemini 2.5-flash & 2.5-pro
- **Therapy Bot**: Groq (Llama 3.3 70B)
- **Speech-to-Text**: OpenAI Whisper API
- **Text-to-Speech**: OpenAI TTS API
- **Embeddings**: OpenAI text-embedding-3-small

### Python Therapy Service

- **Framework**: Flask
- **LLM**: LangChain with ChatGroq
- **Vector Store**: ChromaDB
- **NLP**: NLTK, VADER Sentiment
- **Security**: Cryptography (Fernet encryption)

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ (for therapy service)
- **MongoDB** (local or Atlas connection string)
- **API Keys**:
  - Google Gemini API key
  - OpenAI API key
  - Groq API key
  - Brevo API key (for emails)
  - Google Maps API key (optional, for therapist finder)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Fluenti
   ```
2. **Install Node.js dependencies**

   ```bash
   npm install
   ```
3. **Set up Python virtual environment**

   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```
4. **Install Python dependencies**

   ```bash
   cd server/python
   pip install -r requirements.txt
   cd ../..
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/fluenti
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fluenti

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret

# AI Services
VITE_GEMINI_API_KEY=your-google-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@fluenti.com
BREVO_SENDER_NAME=Fluenti

# Google Maps (Optional - for therapist finder)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Python Therapy Service
THERAPY_SERVICE_URL=http://localhost:5001
ENCRYPTION_KEY=your-32-byte-encryption-key-base64-encoded
ENCRYPTION_SALT=therapy_bot_salt

# Emergency Notifications (Optional)
EMERGENCY_NOTIFICATION_EMAIL=emergency@fluenti.com
EMERGENCY_EMAIL_USER=your-email@example.com
EMERGENCY_EMAIL_PASS=your-email-password
```

**Important Security Notes:**

- Never commit `.env` files to version control
- Use strong, randomly generated secrets for production
- Rotate API keys regularly
- Use environment-specific configurations

### Running the Application

#### Development Mode

1. **Start MongoDB** (if running locally)

   ```bash
   mongod
   ```
2. **Start the Python Therapy Service**

   ```bash
   # Windows (PowerShell)
   cd server/python
   .\start_therapy_service.ps1

   # Linux/Mac
   cd server/python
   python therapy_service.py
   ```

   The service will run on `http://localhost:5001`
3. **Start the Backend Server**

   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3000`
4. **Start the Frontend Development Server** (in a new terminal)

   ```bash
   npm run dev:frontend
   ```

   The frontend will run on `http://localhost:5173`

#### Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

---

## Project Structure

```
Fluenti/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── games/      # Story game components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── ui/         # UI components (Radix UI)
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   │   └── geminiService.ts  # Gemini AI integration
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   └── public/             # Static assets
│
├── server/                 # Node.js backend
│   ├── index.ts           # Express server entry point
│   ├── routes.ts          # Main route registration
│   ├── routes/            # Route handlers
│   │   ├── auth.ts        # Authentication routes
│   │   ├── feedback.ts   # Feedback routes
│   │   └── settings.ts   # Settings routes
│   ├── services/          # Backend services
│   │   ├── jwtService.ts         # JWT token management
│   │   ├── emailService.ts       # Email sending (Brevo)
│   │   ├── twoFactorService.ts   # 2FA management
│   │   ├── fastSTTService.ts     # Speech-to-text
│   │   └── enhancedTTSService.ts # Text-to-speech
│   ├── models.ts          # MongoDB schemas
│   ├── mongodb.ts         # MongoDB connection
│   ├── mongoStorage.ts    # Database operations
│   ├── middleware.ts      # Express middleware
│   └── python/            # Python therapy service
│       ├── therapy_service.py    # Flask app
│       ├── emotional_therapy.py  # Core therapy logic
│       └── requirements.txt      # Python dependencies
│
├── dist/                  # Build output
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── .env                   # Environment variables (not in git)
```

---

## Key Features

### Story Game (Children)

The story game is an interactive speech therapy tool that adapts to each child's needs.

#### Game Flow

1. **Therapy Selection**: Choose therapy type (Pronunciation, Fluency, DLD, Social)
2. **Assessment**: Initial assessment to determine skill level (1-20)
3. **Character Selection**: Choose or create custom character
4. **Theme Selection**: Select adventure theme or create custom story
5. **Gameplay**:
   - AI narrates story using text-to-speech
   - Child responds via voice (speech-to-text)
   - AI generates next story chunk with feedback
   - Challenges appear periodically to test skills
6. **Progress**: Track scores, levels, and earn badges

#### Therapy Types

- **Pronunciation**: Articulation practice with target words
- **Fluency**: Smooth speech practice to reduce stuttering
- **DLD**: Language development (grammar, vocabulary, sentence complexity)
- **Social**: Social communication skills (empathy, perspective-taking)

#### Scoring System

- **Creativity Score**: 0-10 per turn (based on originality)
- **Speech Score**: Changes during challenges (+5 to +15 success, -5 failure)
- **Focus Stars**: 0-3 (increases with success, decreases with failure)
- **Win Condition**: Complete 5 challenges → Level Up
- **Lose Condition**: Focus stars drop to 0

### Emotional Support (Adults)

AI-powered emotional support with crisis detection and psychological profiling.

#### Modes

1. **Chat Mode**: Text-based conversations
2. **Voice Mode**: Voice input/output with avatar animations

#### Features

- **Session Management**: Continue previous sessions
- **Crisis Detection**: Automated detection with immediate resources
- **Psychological Profiling**: Long-term pattern analysis
- **Progress Tracking**: Mood trends, behavioral patterns, coping strategies
- **Privacy**: Encrypted conversations, secure storage

#### Crisis Detection

Multi-layered detection system:

- **AI-Powered**: LLM analysis of emotional state
- **Pattern-Based**: Keyword and linguistic feature analysis
- **Hybrid**: Combines both approaches for accuracy

Crisis levels: NONE, LOW, MEDIUM, HIGH, CRITICAL

---

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify-email` - Verify email token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/user` - Get current user

### Story Game Endpoints

- `GET /api/story-game/progress` - Get user progress
- `POST /api/story-game/progress` - Save progress
- `POST /api/story-game/session` - Save game session
- `GET /api/story-game/sessions` - Get session history

### Emotional Support Endpoints

- `POST /api/emotional-support-chat` - Chat mode (text)
- `POST /api/emotional-support` - Voice mode (audio)
- `GET /api/therapy-history` - Get session history
- `GET /api/therapy-session/:sessionId` - Get specific session

### Psychological Insights

- `GET /api/psychological-profile` - Get psychological profile
- `GET /api/psychological-progress` - Get long-term progress

### Other Endpoints

- `POST /api/onboarding` - Save onboarding data
- `GET /api/onboarding` - Get onboarding data
- `POST /api/therapists/find` - Find therapists (Google Maps)
- `POST /api/feedback` - Submit feedback

---

## Security Features

### Authentication & Authorization

- **JWT Tokens**: httpOnly cookies for secure token storage
- **Password Hashing**: bcrypt with 10 rounds
- **Email Verification**: Required for account activation
- **Two-Factor Authentication**: TOTP with backup codes
- **Account Lockout**: 5 failed attempts → 30-minute lockout
- **Token Refresh**: 15-minute access tokens, 7-day refresh tokens

### Data Security

- **Input Sanitization**: HTML escaping, SQL injection prevention
- **Encryption**: Fernet encryption for sensitive conversation data
- **Rate Limiting**: 100 requests per hour per user
- **Audit Logging**: Secure logging without PII
- **Session Isolation**: Strict session boundaries

### Crisis Safety

- **Automated Detection**: Multi-layered crisis detection
- **Emergency Notifications**: Alerts for high-risk situations
- **Crisis Resources**: Immediate support information
- **Privacy Compliance**: Anonymized data for analysis

---

## Deployment

### Environment Setup

The application can be deployed to various platforms:

- **Render**: See `render.yaml` for configuration
- **Railway**: See `railway.json` for configuration
- **Netlify**: See `netlify.toml` for frontend deployment
- **Vercel**: Compatible with Vercel deployment

### Production Checklist

- [ ] Set all environment variables
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up MongoDB Atlas (or secure MongoDB instance)
- [ ] Configure email service (Brevo)
- [ ] Set up monitoring and logging
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up error tracking (e.g., Sentry)

### Python Service Deployment

The Python therapy service can be deployed separately:

```bash
cd server/python
pip install -r requirements.prod.txt
python therapy_service.py
```

Or use the provided Dockerfile:

```bash
docker build -t fluenti-therapy-service ./server/python
docker run -p 5001:5001 fluenti-therapy-service
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For support, email fluenitai@gmail.com or open an issue in the repository.

---

## Acknowledgments

- Google Gemini for story generation
- Groq for LLM inference
- OpenAI for speech services
- Brevo for email services
- All open-source contributors

---

**Built with love for speech therapy and emotional support**
