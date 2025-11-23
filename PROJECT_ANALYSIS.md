 Fluenti - Complete Project Analysis

 Executive Summary

Fluenti is a comprehensive AI-powered speech therapy and emotional support platform designed for both children and adults. The platform combines interactive story-building games for speech therapy with AI-powered emotional support sessions. The system uses Google Gemini for story generation and assessments, a Python-based therapy bot for emotional support, and MongoDB for data persistence.

---

 Table of Contents

1. [Architecture Overview](architecture-overview)
2. [Frontend Architecture](frontend-architecture)
3. [Backend Architecture](backend-architecture)
4. [Authentication & Security](authentication--security)
5. [Core Features & Components](core-features--components)
6. [Data Flow & Integration](data-flow--integration)
7. [File-by-File Analysis](file-by-file-analysis)

---

 Architecture Overview

 Technology Stack

Frontend:

- React 18.3.1 with TypeScript
- Wouter for routing
- Framer Motion for animations
- Radix UI components
- Tailwind CSS for styling
- React Query for data fetching
- Vite for build tooling

Backend:

- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose
- Python Flask for therapy service
- JWT for authentication

AI/ML Services:

- Google Gemini (2.5-flash, 2.5-pro) for story generation and assessments
- Groq for LLM in therapy bot
- STT (Speech-to-Text): OpenAI Whisper API (primary)
- TTS (Text-to-Speech): OpenAI TTS (primary)

External Services:

- Google Maps API for therapist finder
- Brevo for email services

---

 Frontend Architecture

 Entry Point: `client/src/App.tsx`

The main React application file sets up:

- Routing: Uses Wouter for client-side routing
- Query Client: React Query for data fetching and caching
- Protected Routes: `ProtectedRoute` component enforces authentication and user type restrictions
- Route Structure:
  - Public: `/`, `/login`, `/signup`, `/verify-email`, `/reset-password`
  - Protected: All dashboard and feature routes
  - User-type specific: Child routes (`/child-dashboard`, `/story-game`) vs Adult routes (`/adult-dashboard`, `/emotional-support`)

 Authentication Flow

Login (`client/src/pages/login.tsx`):

1. User enters email/password
2. Frontend sends POST to `/api/auth/login`
3. Backend validates credentials, checks email verification, handles 2FA
4. On success, JWT tokens set as httpOnly cookies
5. Frontend redirects based on user type and onboarding status

Signup (`client/src/pages/signup.tsx`):

1. User provides: firstName, lastName, email, password, userType, language
2. Frontend validates input
3. POST to `/api/auth/signup` creates user, sends verification email
4. User redirected to login with verification prompt

Email Verification (`client/src/pages/verify-email.tsx`):

1. Extracts token from URL query parameter
2. GET `/api/auth/verify-email?token=...`
3. Backend validates token and marks email as verified
4. User redirected to login

Password Reset (`client/src/pages/reset-password.tsx`):

1. User requests reset via `/api/auth/forgot-password`
2. Backend sends reset email with token
3. User clicks link, enters new password
4. POST `/api/auth/reset-password` with token and new password
5. Backend validates token and updates password

Two-Factor Authentication:

- Setup: User enables 2FA, QR code generated, backup codes created
- Login: After password, user enters TOTP code or backup code
- Verification handled by `server/services/twoFactorService.ts`

 User Dashboards

 Child Dashboard (`client/src/pages/child-dashboard.tsx`)

Purpose: Entry point for child users to start story game sessions

Features:

- Displays 3D avatar (ModelViewerAvatar)
- "Start Story Game" button redirects to `/story-game`
- Sidebar navigation (SharedSidebar)
- Feedback modal
- Mobile bottom navigation

Flow:

1. User lands on dashboard after login
2. If onboarding incomplete, redirected to `/onboarding`
3. Clicking "Start Story Game" → `/story-game`

 Adult Dashboard (`client/src/pages/adult-dashboard.tsx`)

Purpose: Entry point for adult users to start emotional support sessions

Features:

- Displays professional avatar
- Two mode options:
  - Voice Mode: Redirects to `/emotional-support-voice`
  - Chat Mode: Redirects to `/emotional-support`
- Sidebar navigation (SharedSidebarEmotional)
- Feedback modal

Flow:

1. User selects mode
2. Redirects to respective emotional support page
3. Sessions can be continued from history

 Story Game (`client/src/pages/story-game.tsx` & `client/src/components/games/story-game/StoryGameApp.tsx`)

Purpose: Interactive story-building game for speech therapy

Game Phases:

1. Welcome: Initial screen
2. Therapy Selection: Choose therapy type (pronunciation, fluency, DLD, social)
3. Assessment: Initial assessment to determine skill level (skipped if already assessed)
4. Social Assessment: Special assessment for social therapy type
5. Analysis Result: Shows assessment results and starting level
6. Character Selection: Choose or create custom character
7. Start: Select theme or create custom adventure
8. Playing: Main game loop
9. Reward: End screen with badge and summary

Game State Management (`StoryGameApp.tsx`):

- Uses `useReducer` with `gameReducer` for state management
- State persisted to localStorage for recovery
- State includes:
  - `phase`: Current game phase
  - `therapyType`: Selected therapy type
  - `levels`: Current levels for each therapy type
  - `story`: Array of story chunks (user and AI)
  - `totalScore`: Creativity score
  - `speechScore`: Therapy skill score
  - `focusStars`: Focus meter (0-3)
  - `speechChallengesCompletedInLevel`: Progress toward level up
  - `latestSpeechFeedback`: Feedback from last turn
  - `latestThematicFeedback`: Story relevance feedback
  - `latestLanguageFeedback`: Language use feedback (DLD only)

Game Logic:

- Win Condition: Complete 5 challenges → Level Up → Happy ending
- Lose Condition: Focus stars drop to 0 → Sad ending
- Challenge System: AI generates challenges (pronunciation, fluency, DLD, social) during story
- Scoring:
  - Creativity score: 0-10 per turn (0 during challenges)
  - Speech score: Changes only during challenges (+5 to +15 for success, -5 for failure)
  - Focus stars: +1 for challenge success, -1 for failure

Gemini Integration (`client/src/services/geminiService.ts`):

- `startStory()`: Generates initial story chunk with suggestions
- `continueStory()`: Continues story based on user input, returns:
  - Next story chunk
  - Speech feedback (score change, mispronounced words)
  - Language feedback (sentence complexity, vocabulary, grammar)
  - Thematic feedback (relevance score)
  - Challenge (optional)
  - Creativity score
  - Emotion detected
  - Ending type (if game should end)
- `assessSpeechLevel()`: Analyzes assessment responses, returns level (1-20)
- `analyzeSocialCommunication()`: Analyzes social assessment responses
- `generateRewardContent()`: Generates personalized reward message

Progress Tracking:

- Progress saved to MongoDB via `/api/story-game/progress`
- Sessions saved to MongoDB via `/api/story-game/session`
- Progress includes: levels, assessments, badges, therapy stats

Story Game Communication Flow (`client/src/components/games/story-game/StoryScreen.tsx`):

The story game uses browser-native Web APIs for real-time voice communication between the AI narrator and the child.

AI Narration (Text-to-Speech):

1. Voice Selection System:
   - Uses browser's Web Speech API (`window.speechSynthesis`)
   - Automatic voice selection with priority scoring:
     - Highest priority: Microsoft Natural voices (Aria, Jenny) - 100 points
     - High priority: Google US English - 90 points
     - Medium priority: Samantha, Alex - 85-80 points
     - Lower priority: Microsoft Zira, Google UK English Female - 75-70 points
   - Scoring factors:
     - Base score from voice name matching
     - +50 points for "Natural" voices
     - +5 points for female voices
     - +5 points for local service voices
     - +1 point for default voice
   - Filters voices to English only (`lang.startsWith('en')`)
   - Selects highest-scored voice automatically

2. Speech Queue System:
   - Queue-based narration prevents overlapping speech
   - `utteranceQueue`: Array of `SpeechSynthesisUtterance` objects
   - `isSpeaking`: Ref tracking current speech state
   - `processSpeechQueue()`: Processes queue sequentially
   - Each utterance has `onEnd` callback to trigger next in queue
   - Automatically sets `isNarrating` state to false when queue completes

3. Automatic Narration Trigger:
   - Monitors `lastChunk` (last story chunk from AI)
   - Triggers when: `lastChunk.author === 'ai'` AND `lastChunk.text !== lastSpokenText`
   - Prevents re-narrating same text
   - Hides suggestions during narration

4. Narration Content Structure:
   - Always speaks main story text first (removes markdown `` formatting)
   - If challenge exists: Speaks challenge prompt after story text
   - If no challenge and suggestions exist: Speaks suggestions as question ("Should [character]: [suggestion1], or [suggestion2], or [suggestion3]?")
   - If no challenge and no suggestions: Just speaks story text
   - `finalOnEnd` callback:
     - If `endingType` exists: Dispatches `FINISH_STORY_NARRATION` action
     - Otherwise: Shows suggestions (`setAreSuggestionsVisible(true)`)

5. Speech Configuration:
   - Rate: 1.0 (normal speed)
   - Pitch: 1.0 (normal pitch)
   - Voice: Selected best available voice
   - Language: English (US)

6. Repeat Functionality:
   - Repeat button re-speaks last narrated text
   - Uses same `speakFromQueue()` function
   - Disabled during active narration

Child Speech Input (Speech-to-Text):

1. Speech Recognition Setup:
   - Uses browser's Web Speech Recognition API
   - Initializes `SpeechRecognition` or `webkitSpeechRecognition` (Chrome/Safari)
   - Configuration:
     - `continuous: true` - Keeps listening until stopped
     - `lang: 'en-US'` - English (United States)
     - `interimResults: true` - Shows partial results
     - `maxAlternatives: 1` - Only best transcription

2. Recording Flow (`handleListen()`):
   - Checks if recognition is supported
   - Prevents multiple simultaneous recordings (checks `isListening`, `isLoading`, `isOnCooldown`, `isNarrating`)
   - Clears previous transcript
   - Sets up event handlers:
     - `onresult`: Accumulates transcript from all result segments
     - `onerror`: Handles recognition errors, dispatches failure action
     - `onend`: Processes final transcript, stops listening state

3. Silence Detection:
   - Uses `silenceTimerRef` to track silence duration
   - Auto-stops recognition after 2.5 seconds of silence
   - Timer resets on each new speech result
   - Prevents infinite listening

4. Transcript Processing:
   - Accumulates transcript: Loops through `event.results` array, concatenates all segments
   - Stores in `transcriptRef.current` for real-time updates
   - On recognition end:
     - Trims whitespace from final transcript
     - If transcript exists: Calls `onContinue(finalInput)` to process child's input
     - Cleans up event handlers (sets to null)

5. State Management:
   - `START_LISTENING`: Dispatched when recording starts
   - `STOP_LISTENING`: Dispatched when recording ends
   - `isListening`: Visual indicator (pulsing rings, button state)
   - `CONTINUE_STORY_FAILURE`: Dispatched on recognition errors

6. Visual Feedback:
   - Listening state: Pulsing orange rings around microphone button
   - Button glow: Orange gradient with shadow effects
   - Status text: "Listening..." during recording
   - Character portrait: Shows listening animation when `isListening && isLastChunk`

7. Error Handling:
   - Checks browser support before initializing
   - Handles recognition errors (network, no-speech, audio-capture, etc.)
   - Displays error messages to user
   - Gracefully falls back if recognition unavailable

Communication Flow Sequence:

1. AI Turn:
   - Gemini generates story chunk → Added to `story` array
   - `StoryScreen` detects new AI chunk → Triggers narration
   - Voice selected → Text queued → Speech synthesis speaks
   - Suggestions appear after narration completes
   - Character portrait shows narrating animation

2. Child Turn:
   - Child taps microphone button → `handleListen()` called
   - Speech recognition starts → Visual feedback (pulsing rings)
   - Child speaks → Transcript accumulates in real-time
   - 2.5 seconds silence → Recognition auto-stops
   - Transcript processed → `onContinue(transcript)` called
   - Transcript sent to `StoryGameApp` → Calls `continueStory()` with Gemini
   - Gemini processes input → Returns next story chunk
   - Cycle repeats

3. Challenge Mode:
   - AI generates challenge → Challenge prompt spoken after story text
   - Child must respond to challenge → Speech recognition captures response
   - Response evaluated by Gemini → Success/failure determined
   - Scores updated → Story continues with feedback

Key Features:

- No Backend STT/TTS: All speech processing happens client-side using browser APIs
- Real-time Feedback: Visual and audio cues for listening/narrating states
- Queue Management: Prevents speech overlap, ensures smooth narration
- Silence Detection: Automatic stop prevents infinite listening
- Error Resilience: Graceful handling of unsupported browsers or API failures
- State Synchronization: UI updates reflect current communication state
- Accessibility: Visual indicators complement audio for better UX

 Emotional Support Pages

 Chat Mode (`client/src/pages/emotional-support.tsx`)

Purpose: Text-based emotional support therapy

Features:

- Chat interface with message history
- Session persistence (localStorage and MongoDB)
- Crisis detection and resources
- Service health monitoring
- Typing indicators
- Sound effects (send, receive, typing)

Flow:

1. User types message
2. POST `/api/emotional-support-chat` with message and sessionId
3. Backend forwards to Python therapy service (`/api/therapy/chat`)
4. Python service returns response, crisis level, sessionId
5. Frontend displays response, updates session
6. Session saved to MongoDB (EmotionalSession collection)

Session Management:

- New sessions: No sessionId → Python service creates new session
- Continue session: sessionId in URL → Restore from MongoDB
- Session data includes: messages, risk level, duration, mode

 Voice Mode (`client/src/pages/emotional-support-voice.tsx`)

Purpose: Voice-based emotional support therapy

Features:

- Speech recognition for input (useSpeechRecognition hook)
- Text-to-speech for output (OpenAI TTS )
- Avatar animations synchronized with state (idle, listening, thinking, speaking)
- Session persistence
- Service health monitoring

Flow:

1. User clicks record button
2. Audio recorded via Web Audio API
3. Audio sent to `/api/emotional-support` (multipart/form-data)
4. Backend transcribes audio using STT chain:
   - Primary: OpenAI Whisper API (cloud-based, most reliable)
5. Transcribed text sent to Python therapy service
6. Therapy response generated
7. Response converted to speech using TTS chain:
   - Primary: OpenAI TTS (high quality neural voices, model: tts-1, voice: onyx)
  
8. Audio played, avatar animates
9. Session saved to MongoDB

STT Implementation Details (`server/services/fastSTTService.ts`):

- `fastTranscribeAudio()`:  OpenAI Whisper API

TTS Implementation Details (`server/services/enhancedTTSService.ts`):

- `generateSmartTTS()`:  OpenAI TTS first
- OpenAI TTS uses model `tts-1` with voice `onyx`

Avatar States:

- `idle`: Default state
- `listening`: User is recording
- `thinking`: Processing response
- `speaking`: Playing TTS audio

 Progress Dashboard (`client/src/pages/progress-dashboard.tsx`)

Purpose: Display child's progress in story game

Features:

- Key metrics: streak, accuracy, sessions completed
- Weekly activity chart (bar chart)
- Therapy type distribution (pie/bar chart)
- Sessions over time (area chart)
- Recent sessions list
- Story game profile:
  - Initial assessment results
  - Current levels per therapy type
  - Performance radar chart

Data Sources:

- `useStoryGameProgress()`: Fetches progress from `/api/story-game/progress`
- `useStoryGameSessions()`: Fetches sessions from `/api/story-game/sessions`

 Adult History (`client/src/pages/adult-history.tsx`)

Purpose: Display emotional therapy session history

Features:

- Filter by mode (all, voice, chat)
- Session details: date, time, duration, risk level
- Continue session button
- Pagination (load more)

Data Source:

- `useTherapyHistory()`: Fetches from `/api/therapy-history`

 Adult Settings (`client/src/pages/adult-settings.tsx`)

Purpose: Manage adult user settings and profile

Sections:

1. Profile: First name, last name, email
2. Security:
   - Two-factor authentication setup
   - Email verification status
   - Password change (email signup only)
3. Privacy & Analytics: Analytics toggle, cookie preferences
4. Notifications: Email notification preferences
5. Danger Zone: Account deletion

Data Management:

- `useUserSettings()` hook manages all settings
- Updates via `/api/settings` endpoints

 Psychological Insights (`client/src/pages/PsychologicalInsights.tsx`)

Purpose: Display long-term psychological insights and progress

Features:

- Stat cards: Total sessions, average mood, crisis events, core patterns
- Mood trend chart (line chart)
- Crisis events chart (bar chart)
- Behavioral patterns list
- Effective coping strategies

Data Source:

- `/api/psychological-profile`: Fetches psychological profile
- `/api/psychological-progress`: Fetches long-term progress

 Onboarding (`client/src/pages/onboarding.tsx`)

Purpose: Collect initial information from parent/guardian users

Steps:

1. Welcome screen
2. parent/guardian Age verification
3. Child name
4. Gender selection
5. Birth date

Data Flow:

- Each step saves to `/api/onboarding` (POST)
- Progress tracked in `currentStep` field
- On completion, `isCompleted` set to true
- Data stored in `ChildOnboarding` MongoDB collection

 Landing Page (`client/src/pages/home.tsx`)

Purpose: Public landing page with therapist finder chatbot

Features:

- Feature showcase
- User type selection (children/adults)
- Statistics and testimonials
- Therapist Finder Chatbot:
  - Modal chatbot interface
  - User selects therapist type (speech, emotional/mental)
  - Requests geolocation
  - Calls `/api/therapists/find` with coordinates
  - Displays top 3 therapists with ratings, distance
  - Uses Google Maps API (Places, Geocoding, Distance Matrix)

Authentication Redirect:

- If authenticated, redirects based on user type and onboarding status

---

 Backend Architecture

 Entry Point: `server/index.ts`

Setup:

1. Express app initialization
2. Middleware:
   - Cookie parser
   - JSON body parser (10MB limit)
   - JWT validation (`extractAndValidateJWT`)
   - CORS
   - Request logging
3. MongoDB connection (`connectDB()`)
4. Route registration (`registerRoutes(app)`)
5. Static file serving (production) or Vite dev server (development)

 Main Routes: `server/routes.ts`

Authentication Routes (`/api/auth/`):

- `POST /login`: Email/password login, 2FA check
- `POST /signup`: User registration, email verification
- `POST /logout`: Clear JWT cookies
- `POST /refresh`: Refresh access token
- `GET /verify-email`: Verify email token
- `POST /resend-verification`: Resend verification email
- `POST /forgot-password`: Send password reset email
- `POST /reset-password`: Reset password with token
- `GET /user`: Get current user (token-based auth)
- 2FA routes: `/api/auth/2fa/`

Onboarding Routes (`/api/onboarding`):

- `GET /onboarding`: Fetch onboarding data
- `POST /onboarding`: Save onboarding data
- `GET /onboarding/status`: Check completion status
- Admin routes: `/api/admin/onboarding/`

Story Game Routes (`/api/story-game/`):

- `GET /progress`: Fetch user progress
- `POST /progress`: Save progress (levels, assessments)
- `POST /session`: Save game session
- `GET /sessions`: Fetch session history

Emotional Support Routes:

- `POST /emotional-support-chat`: Chat mode (text input)
- `POST /emotional-support`: Voice mode (audio input)
- `GET /therapy-history`: Fetch session history
- `GET /therapy-session/:sessionId`: Get specific session

Psychological Routes:

- `GET /psychological-profile`: Get psychological profile
- `GET /psychological-progress`: Get long-term progress

Therapist Finder (`/api/therapists/find`):

- POST with latitude, longitude, therapistType, radius
- Uses Google Maps API:
  - Geocoding API for accurate coordinates
  - Places API Text Search for therapist locations
  - Distance Matrix API for road distances
- Returns top 3 therapists sorted by reviews, rating, distance

Speech Therapy Routes (`/api/speech/`):

- `POST /session`: Create speech session
- `POST /record`: Record speech attempt
- `POST /transcribe-only`: Pure STT (no therapy processing)
- `GET /progress`: Get user progress

 Authentication Service: `server/auth.ts`

AuthService Class:

- `signup()`: Create user, hash password, send verification email, generate JWT
- `login()`: Validate credentials, check email verification, handle account lockout, generate JWT
- `logout()`: Clear refresh token
- `refreshAccessToken()`: Generate new access token from refresh token
- `verifyEmail()`: Verify email token
- `resendVerificationEmail()`: Resend verification email
- `requestPasswordReset()`: Generate reset token, send email
- `resetPassword()`: Validate token, update password
- 2FA methods: setup, verify, disable, regenerate backup codes

Password Security:

- bcryptjs for hashing (10 rounds)
- Account lockout after 5 failed attempts (30 minutes)
- Password reset tokens expire in 1 hour

 JWT Service: `server/services/jwtService.ts`

Token Types:

- Access Token: 15 minutes, used for API authentication
- Refresh Token: 7 days, used to refresh access token
- Reset Token: 1 hour, used for password reset

Functions:

- `generateAccessToken()`: Create short-lived access token
- `generateRefreshToken()`: Create long-lived refresh token
- `generateTokenPair()`: Generate both tokens
- `verifyAccessToken()`: Verify and decode access token
- `verifyRefreshToken()`: Verify and decode refresh token
- `generateResetToken()`: Create password reset token
- `verifyResetToken()`: Verify reset token

Cookie Management:

- Tokens set as httpOnly cookies (secure in production)
- `accessToken`: 15 minutes max-age
- `refreshToken`: 7 days max-age

 Email Service: `server/services/emailService.ts`

Email Providers:

1. Brevo (primary): HTTP API, 300 emails/day free

Email Types:

- Verification email: Welcome message with verification link
- Password reset email: Reset link with 1-hour expiry
- Account lockout email: Security alert
- 2FA setup email: Confirmation email
- Emergency notification: Crisis detection alerts to fluenti team

 Two-Factor Authentication: `server/services/twoFactorService.ts`

Functions:

- `generate2FASecret()`: Generate TOTP secret
- `generateQRCode()`: Generate QR code for authenticator app
- `verify2FAToken()`: Verify TOTP code (2-minute window)
- `generateBackupCodes()`: Generate 8 backup codes
- `hashBackupCode()`: Hash backup code for storage
- `verifyBackupCode()`: Verify backup code
- `removeBackupCode()`: Remove used backup code

Storage:

- Secret stored in User model (`twoFactorSecret`)
- Backup codes hashed and stored in `twoFactorBackupCodes` array

 MongoDB Models: `server/models.ts`

User Schema:

- `id`: Unique user ID (nanoid)
- `email`: Unique email
- `password`: Hashed password (bcrypt)
- `firstName`, `lastName`: User name
- `userType`: 'child' | 'adult'
- `language`: 'english'
- `signupMethod`: 'email'
- `emailVerified`: Boolean
- `emailVerificationToken`, `emailVerificationExpiry`: Verification tokens
- `passwordResetToken`, `passwordResetExpiry`: Reset tokens
- `twoFactorEnabled`: Boolean
- `twoFactorSecret`, `twoFactorBackupCodes`: 2FA data
- `refreshToken`, `refreshTokenExpiry`: JWT refresh token
- `settings`: Nested settings object
- `accountLockedUntil`, `lastFailedLoginAt`, `failedLoginAttempts`: Security fields

EmotionalSession Schema:

- `id`: Unique session ID
- `userId`: Reference to User
- `sessionType`: 'chat' | 'assessment' | 'crisis'
- `mode`: 'chat' | 'voice'
- `title`: Session title
- `messages`: Array of {role, content, timestamp}
- `emotionalState`: Detected emotion
- `riskLevel`: 'low' | 'medium' | 'high'
- `duration`: Session duration in seconds
- `completedAt`: Completion timestamp

StoryGameProgress Schema:

- `id`: Unique progress ID
- `userId`: Reference to User
- `hasCompletedInitialSetup`: Boolean
- `selectedTherapyType`: Selected therapy type
- `assessments`: Object with assessment results per therapy type
- `currentLevels`: Current levels per therapy type
- `totalGamesPlayed`, `totalStoriesCompleted`, `totalChallengesCompleted`: Statistics
- `highestScore`: Best score achieved
- `badgesEarned`: Object with badges per therapy type
- `therapyStats`: Statistics per therapy type

StoryGameSession Schema:

- `id`: Unique session ID
- `userId`: Reference to User
- `sessionId`: Game session ID
- `therapyType`: Therapy type used
- `character`, `theme`: Game settings
- `totalScore`, `speechScore`, `creativityScore`: Scores
- `endingType`: 'happy' | 'sad' | 'neutral'
- `challengesCompleted`: Number of challenges completed
- `levelAtStart`, `levelAtEnd`: Level progression
- `levelUp`: Boolean
- `storyLength`: Number of story chunks
- `wordBank`: Array of learned words
- `startTime`, `endTime`, `duration`: Timing data

ChildOnboarding Schema:

- `id`: Unique onboarding ID
- `userId`: Reference to User
- `parentBirthYear`, `childBirthYear`: Birth years
- `childName`, `childGender`: Child info
- `childBirthDate`: Full birth date
- `assessmentResponses`: Object with assessment data
- `isCompleted`: Boolean
- `currentStep`: Current onboarding step

 MongoDB Storage: `server/mongoStorage.ts`

Purpose: Abstraction layer for MongoDB operations with error handling and fallbacks

Key Methods:

- `upsertUser()`: Create or update user
- `getUser()`, `getUserByEmail()`: Fetch users
- `createEmotionalSession()`, `findEmotionalSession()`: Emotional session management
- `addMessageToEmotionalSession()`: Add messages to session
- `createSpeechSession()`, `createSpeechRecord()`: Speech therapy data
- `updateUserProgress()`: Update user progress

Error Handling:

- Connection checking with timeout
- Fallback values in development mode
- Retry logic for connection failures

 Middleware: `server/middleware.ts`

extractAndValidateJWT:

- Extracts JWT from cookie or Authorization header
- Verifies token and fetches user from database
- Attaches user to request object
- Continues even if token invalid (for public routes)

tokenBasedAuth:

- Requires valid JWT token
- Returns 401 if not authenticated
- Used for protected routes

 Python Therapy Service: `server/python/therapy_service.py`

Flask Application:

- Runs on port 5001 (configurable)
- CORS enabled
- Health check endpoint: `/health`

Endpoints:

- `POST /api/therapy/start-session`: Start new therapy session
- `POST /api/therapy/chat`: Send message, get therapy response
- `POST /api/therapy/session-summary`: Get session summary

Session Management:

- Active sessions stored in memory (`active_sessions` dict)
- Sessions can be restored from MongoDB
- Session key format: `{userId}_{sessionId}`

Integration:

- Uses `emotional_therapy.py` module for therapy logic
- Updates user context from MongoDB
- Handles crisis detection and emergency notifications

 Python Emotional Therapy: `server/python/emotional_therapy.py`

Core Classes:

SecurityManager:

- Encryption/decryption of sensitive data (Fernet)
- Input sanitization (HTML escaping, length limits)
- Rate limiting (per user)
- Session token validation
- Audit logging

MongoDBStorage:

- MongoDB connection and collection management
- Conversation history storage
- Session metadata storage
- Crisis event logging
- Psychological profile storage
- Long-term progress tracking

CrisisDetector:

- Analyzes user input for crisis indicators
- Returns `CrisisLevel` (NONE, LOW, MEDIUM, HIGH, CRITICAL)
- Returns `HarmType` (SELF_HARM, SUICIDE, VIOLENCE, ABUSE, NONE)
- Uses keyword matching and sentiment analysis

TherapyBot:

- Main therapy bot logic
- Uses Groq LLM (ChatGroq)
- Maintains conversation context
- Detects crisis situations
- Generates empathetic responses
- Updates psychological profile

TherapyInterface:

- Interface for interacting with TherapyBot
- Manages session state
- Handles message sending
- Tracks crisis levels
- Manages session lifecycle

Psychological Profile:

- Core patterns: Behavioral patterns identified
- Trauma indicators: Trauma-related patterns
- Long-term progress: Progress over time
- Therapeutic preferences: User preferences
- Cognitive patterns: Cognitive processing patterns
- Emotional regulation: Emotional management patterns
- Coping mechanisms: Effective coping strategies

---

 Data Flow & Integration

 Story Game Flow

1. User starts game:
   - Frontend: `StoryGameApp` component loads
   - Checks localStorage for saved state
   - Fetches progress from `/api/story-game/progress`

2. Therapy selection:
   - User selects therapy type
   - If not assessed, redirects to assessment
   - Assessment results saved to progress

3. Gameplay:
   - User selects character and theme
   - `startStory()` called → Gemini generates initial chunk
   - User provides input ( voice)
   - `continueStory()` called → Gemini generates next chunk
   - Game state updated (scores, stars, challenges)
   - State saved to localStorage

4. Game end:
   - Win: 5 challenges completed → Level up → Reward screen
   - Lose: Focus stars = 0 → Sad ending → Reward screen
   - Session saved to `/api/story-game/session`
   - Progress updated via `/api/story-game/progress`

 Emotional Support Flow

1. Chat Mode:
   - User types message
   - POST `/api/emotional-support-chat`
   - Backend forwards to Python service `/api/therapy/chat`
   - Python service:
     - Loads/creates session
     - Processes message with TherapyBot
     - Detects crisis
     - Generates response
     - Updates psychological profile
   - Response returned to frontend
   - Session saved to MongoDB

2. Voice Mode:
   - User records audio
   - Audio sent to `/api/emotional-support` (multipart)
   - Backend transcribes audio using STT chain:
     - OpenAI Whisper API (primary)
   - Transcribed text sent to Python service
   - Therapy response generated
   - Response converted to speech using TTS:
     - OpenAI TTS (primary)
   - Audio returned to frontend as base64
   - Avatar animates based on state (idle → listening → thinking → speaking)

 Authentication Flow

1. Signup:
   - User submits form
   - POST `/api/auth/signup`
   - Backend: Create user, hash password, generate verification token
   - Email sent with verification link
   - User redirected to login

2. Email Verification:
   - User clicks link
   - GET `/api/auth/verify-email?token=...`
   - Backend validates token, marks email verified
   - User redirected to login

3. Login:
   - User submits credentials
   - POST `/api/auth/login`
   - Backend: Validate password, check email verification
   - If 2FA enabled, return `requires2FA: true`
   - Otherwise, generate JWT tokens, set cookies
   - Frontend redirects based on user type

4. 2FA Login:
   - After password, user enters TOTP code
   - POST `/api/auth/2fa/verify-login`
   - Backend verifies code, generates JWT
   - User logged in

5. Token Refresh:
   - Access token expires (15 minutes)
   - Frontend calls POST `/api/auth/refresh`
   - Backend validates refresh token, generates new access token
   - New token set as cookie

---

 File-by-File Analysis

 Frontend Files

 `client/src/App.tsx`

- Purpose: Main application entry point
- Key Features: Routing, protected routes, query client setup
- Dependencies: Wouter, React Query, ProtectedRoute component

 `client/src/pages/home.tsx`

- Purpose: Landing page with therapist finder
- Key Features: Therapist finder chatbot, geolocation, Google Maps integration
- Dependencies: useAuth, useOnboardingStatus, Google Maps API

 `client/src/pages/login.tsx`

- Purpose: User login page
- Key Features: Email/password login, 2FA modal, forgot password, email verification prompt
- Dependencies: useAuth, TwoFactorModal, apiRequest

 `client/src/pages/signup.tsx`

- Purpose: User registration page
- Key Features: Form validation, user type selection, language selection
- Dependencies: useAuth, apiRequest

 `client/src/pages/verify-email.tsx`

- Purpose: Email verification page
- Key Features: Token validation, resend verification email
- Dependencies: apiRequest, useLocation

 `client/src/pages/reset-password.tsx`

- Purpose: Password reset page
- Key Features: Token validation, new password form
- Dependencies: apiRequest, useLocation

 `client/src/pages/child-dashboard.tsx`

- Purpose: Child user dashboard
- Key Features: Story game entry point, avatar display
- Dependencies: useAuth, SharedSidebar, ModelViewerAvatar

 `client/src/pages/adult-dashboard.tsx`

- Purpose: Adult user dashboard
- Key Features: Voice/chat mode selection
- Dependencies: useAuth, SharedSidebarEmotional, ModelViewerAvatar

 `client/src/pages/story-game.tsx`

- Purpose: Story game page wrapper
- Key Features: Authentication check, layout
- Dependencies: useAuth, StoryGameApp, SharedSidebar

 `client/src/components/games/story-game/StoryGameApp.tsx`

- Purpose: Main story game component
- Key Features: Game state management, phase transitions, Gemini integration
- Dependencies: useReducer, geminiService, useStoryGameProgress

 `client/src/pages/emotional-support.tsx`

- Purpose: Chat-based emotional support
- Key Features: Chat interface, session management, crisis detection
- Dependencies: useAuth, useSession, SharedSidebarEmotional

 `client/src/pages/emotional-support-voice.tsx`

- Purpose: Voice-based emotional support
- Key Features: Speech recognition, TTS, avatar animations
- Dependencies: useSpeechRecognition, useAuth, ModelViewerAvatar

 `client/src/pages/progress-dashboard.tsx`

- Purpose: Child progress display
- Key Features: Charts, metrics, session history
- Dependencies: useStoryGameProgress, useStoryGameSessions, Recharts

 `client/src/pages/adult-history.tsx`

- Purpose: Emotional therapy session history
- Key Features: Session list, filtering, continue session
- Dependencies: useTherapyHistory, useAuth

 `client/src/pages/adult-settings.tsx`

- Purpose: Adult user settings
- Key Features: Profile, security, privacy, notifications
- Dependencies: useUserSettings, TwoFactorSetup

 `client/src/pages/PsychologicalInsights.tsx`

- Purpose: Psychological insights and progress
- Key Features: Charts, patterns, coping strategies
- Dependencies: useAuth, Recharts

 `client/src/pages/onboarding.tsx`

- Purpose: Child onboarding flow
- Key Features: Multi-step form, progress tracking
- Dependencies: useAuth, useOnboardingData

 `client/src/services/geminiService.ts`

Purpose: Client-side service for Google Gemini API integration, handling story game generation, speech therapy assessments, and reward content creation.

Dependencies:

- `@google/genai` (GoogleGenAI client)
- Story game types from `@/types/games/story-game`

Model Configuration:

- `TEXT_GENERATION_MODEL`: "gemini-2.5-flash" (for story generation, faster responses)
- `ASSESSMENT_MODEL`: "gemini-2.5-pro" (for assessments, more accurate analysis)

API Key Management:

- Reads from `VITE_GEMINI_API_KEY` or `VITE_API_KEY` environment variable
- Client re-initialized before each API call to ensure latest API key
- Error handling for missing/invalid API keys

Core Components:

1. Onboarding Data Utilities
   - `ChildAge` Interface: `{ years: number, months: number }`
   - `OnboardingData` Interface: `{ childBirthDate?, childBirthYear?, childName?, childGender? }`
   - `calculateChildAge()`:
     - Calculates child age from birth date or birth year
     - Handles full birth date (preferred) or birth year (fallback)
     - Accounts for birthday not yet occurred this year
     - Default: 6 years, 0 months if no data
   - `fetchOnboardingData()`:
     - Fetches onboarding data from `/api/onboarding`
     - Uses httpOnly cookies for authentication (credentials: 'include')
     - Returns null if not authenticated or fetch fails
   - `getChildAgeFromOnboarding()`:
     - Fetches onboarding data and calculates age
     - Returns default age (6 years) if fetch fails

2. Error Handling & Retry Logic:
   - `extractRetryDelay()`:
     - Extracts retry delay from error messages
     - Parses "Please retry in Xs" format
     - Checks for Google RPC RetryInfo in error details
     - Returns delay in milliseconds or null
   - `retryApiCall()`:
     - Retry logic with exponential backoff
     - Max retries: 3 (default)
     - Initial delay: 1000ms
     - Handles specific error codes:
       - 401/403: API key authentication errors (no retry, throw immediately)
       - 404: Invalid model name (no retry, throw immediately)
       - 429: Rate limit/quota exceeded (extracts retry delay, waits before retry)
       - 503: Service unavailable (longer delays, retries)
       - 408: Timeout (retries)
       - 5xx: Server errors (retries)
     - Exponential backoff: delay = baseDelay  2^attempt
     - Re-initializes GoogleGenAI client for each attempt

3. Schema Definitions:
   - `stringSuggestionsSchema`: Array of 3 unique strings
   - `pronunciationPromptsSchema`: Array of 3 prompts with scenario, action, targetWord
   - `fluencyPromptsSchema`: Array of 3 prompts with scenario, action, targetPhrase
   - `dldPromptsSchema`: Array of 3 prompts with scenario, action, targetConcept
   - `socialScenariosSchema`: Array of 3 scenarios with scenario and question
   - `assessmentSchema`: level (1-20), analysisReasoning, title, feedbackText
   - `storyStartSchema`: storyChunk (string), suggestions (array of 3 strings)
   - `storyContinuationSchema`: Complex schema with:
     - speechFeedback: { scoreChange, mispronouncedWords }
     - languageFeedback: { sentenceComplexityScore, newVocabularyIntroduced, grammarFeedback, storytellingScore } (DLD only)
     - creativityScore: 0-10
     - emotion: 'happy' | 'sad' | 'angry' | 'calm' | 'curious' | 'brave'
     - storyChunk: string
     - suggestions: array of 3 strings (empty if challenge/ending)
     - challengeSuccess: boolean | null (true/false for challenge responses, null for regular turns)
     - thematicFeedback: { relevanceScore, feedbackText }
     - challenge: { type, word, prompt, target } (optional)
     - endingType: 'happy' | 'sad' | null
   - `rewardSchema`: title, message, badgeText

4. Assessment Functions:

   `assessSpeechLevel()`:
   - Assesses child's speech level for pronunciation, fluency, or DLD
   - Takes: `results` (AssessmentResult[]), `therapyType`, `childAge?`
   - Returns: `{ level: 1-20, title: string, feedbackText: string }`
   - Uses ASSESSMENT_MODEL (gemini-2.5-pro)
   - Clinical Assessment Criteria:
     - Pronunciation: Assesses articulation disorders (substitutions, omissions, distortions)
       - Level 1-5: Consistent errors, unclear speech
       - Level 6-10: Some consistent errors on specific sounds
       - Level 11-15: Mostly clear with minor errors
       - Level 16-19: Consistently clear and accurate
       - Level 20: Exceptional, age-advanced pronunciation
     - Fluency: Assesses stuttering behaviors (repetitions, prolongations, blocks)
       - Level 1-5: Frequent stuttering, severely disrupted flow
       - Level 6-10: Noticeable disfluencies in certain situations
       - Level 11-15: Mostly fluent with occasional minor disfluencies
       - Level 16-20: Consistently smooth, effortless speech
     - DLD: Assesses language delay/disorder (grammar, vocabulary, sentence complexity)
       - Level 1-5: Single words or very short phrases, incorrect grammar
       - Level 6-10: Basic sentences with grammar errors
       - Level 11-15: Grammatically correct but simple sentences
       - Level 16-20: Complex sentences with good vocabulary
   - Validates response: level must be 1-20 integer
   - Provides clinical reasoning and child-friendly feedback

   `analyzeSocialCommunication()`:
   - Analyzes social communication skills for social therapy type
   - Takes: `results` (SocialAssessmentResult[]), `childAge?`
   - Returns: `{ level: 1-20, title: string, feedbackText: string }`
   - Uses ASSESSMENT_MODEL (gemini-2.5-pro)
   - Clinical Assessment Criteria:
     - Level 1-5: Limited social communication, inappropriate responses, limited empathy
     - Level 6-10: Developing skills, basic empathy, inconsistent responses
     - Level 11-15: Good skills, appropriate responses, consistent empathy
     - Level 16-20: Advanced skills, sophisticated problem-solving, nuanced responses
   - Evaluation Focus:
     - Perspective-taking: Understanding others' feelings
     - Social reciprocity: Appropriate conversational responses
     - Problem-solving: Helpful solutions
     - Language use: Appropriate for social context
   - Validates response and provides feedback

5. Story Generation Functions:

   `getCustomStorySuggestions()`:
   - Generates suggestions for custom story creation
   - Takes: `step` (CustomStoryStep: 'characterName' | 'setting' | 'interest'), `inputs` (CustomStoryInputs)
   - Returns: Array of 3 string suggestions
   - Uses TEXT_GENERATION_MODEL
   - Generates context-aware suggestions based on previous inputs

   `createCustomStory()`:
   - Creates opening scene for custom story
   - Takes: `inputs` (CustomStoryInputs: characterName, setting, interest)
   - Returns: `{ storyChunk: string, suggestions: string[] }`
   - Uses TEXT_GENERATION_MODEL with storyStartSchema
   - Validates response: storyChunk must be non-empty string
   - Handles JSON parsing errors with helpful messages

   `startStory()`:
   - Starts a story with theme and character
   - Takes: `theme` (Theme), `characterName` (string), `childAge?`
   - Returns: `{ storyChunk: string, suggestions: string[] }`
   - Uses TEXT_GENERATION_MODEL with storyStartSchema
   - Age-appropriate language and concepts
   - Story chunk ends with open-ended question
   - Provides 3 creative action suggestions (2-4 words each)
   - Validates response format and content

   `continueStory()`:
   - Continues story based on user input and game state
   - Takes: `story` (StoryChunk[]), `userInput` (string), `therapyType`, `level`, `currentScore`, `currentSpeechScore`, `isOriginalIdea`, `focusStars`, `speechChallengesCompleted`, `childAge?`
   - Returns: Complex object with storyChunk, emotion, suggestions, creativityScore, speechFeedback, thematicFeedback, languageFeedback?, challengeSuccess?, challenge?, endingType?
   - Uses TEXT_GENERATION_MODEL with storyContinuationSchema
   - Critical Game Logic:
     - Two Modes:
       - MODE 1 (Challenge Evaluation): When previous turn was a challenge
         - Evaluates child's challenge response
         - Sets challengeSuccess to true/false (never null)
         - Sets creativityScore to 0
         - Sets speechFeedback.scoreChange: +5 to +15 (success) or -5 (failure)
         - challenge field MUST be null (no new challenge)
         - Story chunk provides feedback then continues with question
       - MODE 2 (Regular Story): When previous turn was not a challenge
         - Continues story creatively
         - Sets challengeSuccess to null
         - Sets speechFeedback.scoreChange to 0
         - Sets creativityScore: 8-10 (original), 4-6 (used suggestions), 0-2 (off-topic)
         - May create new challenge based on timing rules
     - Challenge Timing Rules:
       - If `regularTurnsSinceLastChallenge` is 0: FORBIDDEN to create challenge
       - If `regularTurnsSinceLastChallenge` is 1: MAY create challenge
       - If `regularTurnsSinceLastChallenge` is 2+: MUST create challenge
       - First challenge: Must be introduced if none exists yet
     - Story End Conditions (ONLY TWO):
       - WIN: Completes 5 challenges → Level Up → endingType: 'happy'
       - LOSE: Focus stars drop to 0 → endingType: 'sad'
     - Score Rules:
       - Focus Stars: +1 (challenge success), -1 (challenge failure), no change (regular turns)
       - Creativity Score: 0 (challenges), 1-10 (regular turns)
       - Therapy Score: +5 to +15 (challenge success), -5 (challenge failure), 0 (regular turns)
   - Challenge Evaluation:
     - Pronunciation: Success = exact target word in text (case-insensitive, complete match)
     - Fluency: Success = smooth text without visible repetitions/prolongations/blocks
     - DLD: Success = complete sentences with proper grammar and vocabulary
     - Social: Success = appropriate social response with empathy and perspective-taking
   - Challenge Creation:
     - Must be NEW and UNIQUE every time
     - Pronunciation/Fluency: Statements (not questions)
     - DLD/Social: Questions
     - storyChunk when creating challenge: MUST NOT end with question mark
     - storyChunk when continuing story: MUST end with question mark
   - Post-Processing Fixes:
     - Removes trailing question marks from storyChunk when creating challenges
     - Converts string 'null' to actual null for endingType/challengeSuccess
     - Removes challenge if endingType is set
     - Prevents challenges during challenge evaluation mode
     - Validates and fixes scoring inconsistencies
     - Adds question marks to regular story turns if missing

   `generateRewardContent()`:
   - Generates personalized reward message for game end
   - Takes: `endingType`, `totalScore`, `level`, `character`, `theme`, `therapyType`, `childAge?`
   - Returns: `RewardContent` (title, message, badgeText)
   - Uses TEXT_GENERATION_MODEL with rewardSchema
   - Age-appropriate celebratory message
   - Mentions character and theme
   - Congratulates on leveling up if level > 1

6. Assessment Prompt Generation Functions:

   `generatePronunciationAssessmentPrompts()`:
   - Generates 3 pronunciation assessment prompts with increasing difficulty
   - Returns: Array of `{ scenario: string, action: string, targetWord: string }`
   - Uses ASSESSMENT_MODEL
   - Difficulty Ramp:
     - Round 1: Medium (single/two-syllable words with common error sounds)
     - Round 2: Difficult (consonant blends, less common sounds)
     - Round 3: Extremely Difficult (multi-syllabic words with multiple tricky sounds)
   - Clinical Purpose: Tests articulation disorders (substitutions, omissions, distortions)
   - Critical Rules: Must generate COMPLETELY NEW words (forbidden words: rabbit, ladder, dragon, treasure, sparkle, castle, etc.)
   - Each prompt has magical story context with clear instruction to repeat target word

   `generateFluencyAssessmentSentences()`:
   - Generates 3 fluency assessment sentences with increasing difficulty
   - Returns: Array of `{ scenario: string, action: string, targetPhrase: string }`
   - Uses ASSESSMENT_MODEL
   - Difficulty Ramp:
     - Round 1: Medium (8-10 words, some alliteration, few plosives)
     - Round 2: Difficult (10-12 words, multiple plosives and blends)
     - Round 3: Extremely Difficult (12-15 words, complex tongue-twister)
   - Clinical Purpose: Tests stuttering behaviors (repetitions, prolongations, blocks)
   - Each prompt has engaging story context encouraging smooth speech

   `generateDldAssessmentSentences()`:
   - Generates 3 DLD assessment prompts with increasing linguistic complexity
   - Returns: Array of `{ scenario: string, action: string, targetConcept: string }`
   - Uses ASSESSMENT_MODEL
   - Difficulty Ramp:
     - Round 1: Medium (simple descriptive sentences with 'and')
     - Round 2: Difficult (cause-and-effect with 'because' or 'so')
     - Round 3: Extremely Difficult (multi-sentence narrative or conditional statements)
   - Clinical Purpose: Tests language delay/disorder (grammar, vocabulary, sentence complexity)
   - Each prompt has engaging story context requiring language use

   `generateSocialAssessmentScenarios()`:
   - Generates 3 social assessment scenarios with increasing social complexity
   - Returns: Array of `{ scenario: string, question: string }`
   - Uses ASSESSMENT_MODEL
   - Difficulty Ramp:
     - Round 1: Medium (simple scenario with clear emotion)
     - Round 2: Difficult (conflict/disagreement requiring problem-solving)
     - Round 3: Extremely Difficult (complex scenario with indirect cues or moral dilemma)
   - Clinical Purpose: Tests Social (Pragmatic) Communication Disorder (perspective-taking, empathy, social appropriateness)
   - Each scenario is relatable for 5-7 year olds with open-ended question

Key Features:

- Age-Aware: All functions fetch child age from onboarding and adapt language/concepts
- Error Handling: Comprehensive retry logic with exponential backoff and rate limit handling
- Validation: Extensive response validation and post-processing fixes
- Clinical Accuracy: Detailed assessment criteria based on speech-language pathology standards
- Game Logic Enforcement: Strict rules for challenge timing, scoring, and story flow
- Text-Only Evaluation: All assessments evaluate TEXT TRANSCRIPTIONS
- Schema Validation: Uses JSON schemas to ensure structured AI responses
- Mode Detection: Automatically detects challenge evaluation vs. regular story mode
- Post-Processing: Fixes common AI errors (question marks, null strings, scoring inconsistencies)

 `client/src/hooks/useAuth.ts`

- Purpose: Authentication hook
- Key Features: User state, login/logout, authentication status
- Dependencies: React Query, getQueryFn

 `client/src/hooks/useStoryGameProgress.ts`

- Purpose: Story game progress management
- Key Features: Fetch progress, save progress, fetch sessions
- Dependencies: React Query, useAuth

 Backend Files

 `server/index.ts`

- Purpose: Express server entry point
- Key Features: Server setup, middleware, route registration
- Dependencies: Express, MongoDB, routes

 `server/routes.ts`

- Purpose: Main API routes
- Key Features: All API endpoints, WebSocket setup
- Dependencies: Express, MongoDB, services

 `server/routes/auth.ts`

- Purpose: OAuth routes
- Key Features: password change
- Dependencies: User model

 `server/routes/feedback.ts`

- Purpose: Feedback submission
- Key Features: Email feedback to fluenti team
- Dependencies: emailService

 `server/routes/settings.ts`

- Purpose: User settings management
- Key Features: Get/update settings, profile, account deletion
- Dependencies: User model, tokenBasedAuth

 `server/auth.ts`

- Purpose: Authentication service
- Key Features: Signup, login, email verification, password reset, 2FA
- Dependencies: mongoStorage, jwtService, emailService, twoFactorService

 `server/models.ts`

- Purpose: MongoDB schemas
- Key Features: User, Session, EmotionalSession, StoryGameProgress, etc.
- Dependencies: Mongoose

 `server/mongodb.ts`

- Purpose: MongoDB connection
- Key Features: Connection management, connection state checking
- Dependencies: Mongoose

 `server/mongoStorage.ts`

- Purpose: MongoDB operations abstraction
- Key Features: User operations, session operations, progress operations
- Dependencies: MongoDB models, mongodb connection

 `server/middleware.ts`

- Purpose: Express middleware
- Key Features: JWT extraction/validation, token-based auth
- Dependencies: jwtService, mongoStorage

 `server/services/jwtService.ts`

- Purpose: JWT token management
- Key Features: Generate/verify tokens, token pairs
- Dependencies: jsonwebtoken

 `server/services/emailService.ts`

- Purpose: Email sending
- Key Features: email templates
- Dependencies: Brevo

 `server/services/twoFactorService.ts`

- Purpose: 2FA management
- Key Features: TOTP generation/verification, QR codes, backup codes
- Dependencies: speakeasy, qrcode

 `server/python/therapy_service.py`

- Purpose: Flask therapy service
- Key Features: Therapy session management, chat endpoint
- Dependencies: Flask, emotional_therapy module

 `server/python/emotional_therapy.py`

Purpose: Core Python module for AI-powered emotional therapy bot with comprehensive security, crisis detection, psychological profiling, and therapeutic response generation.

Dependencies:

- `cryptography` (Fernet encryption, PBKDF2 key derivation)
- `pymongo` (MongoDB operations)
- `langchain_groq` (ChatGroq LLM integration)
- `langchain_openai` (OpenAI embeddings for knowledge base)
- `langchain_community` (Chroma vector store)
- `nltk` (Natural language processing, sentiment analysis)
- `datasets` (Hugging Face dataset loading)
- `vaderSentiment` (Sentiment analysis)
- `python-dotenv` (Environment variable management)

Core Architecture:

1. SecurityManager Class:
   - Encryption System:
     - Uses Fernet symmetric encryption with PBKDF2 key derivation (100,000 iterations)
     - Encrypts/decrypts sensitive conversation data
     - Key stored in environment variable `ENCRYPTION_KEY`
     - Salt stored in `ENCRYPTION_SALT` (default: 'therapy_bot_salt')
   - Input Sanitization:
     - HTML escaping to prevent XSS attacks
     - Removes dangerous SQL injection patterns
     - Limits input length to 5000 characters (configurable)
     - Strips script tags and dangerous JavaScript patterns
   - Rate Limiting:
     - Per-user rate limiting (100 requests per hour default)
     - Sliding window implementation
     - Tracks request timestamps per user hash
   - Session Token Management:
     - Creates secure session tokens (32-byte URL-safe tokens)
     - Validates session tokens with expiration (24 hours max duration)
     - Tracks session creation and last access times
   - Audit Logging:
     - Secure audit logging without PII (Personally Identifiable Information)
     - Hashes user IDs and session IDs before logging
     - Logs to file: `therapy_audit.log`
     - Logs events: SESSION_CREATED, RESPONSE_GENERATION_REQUEST, HIGH_CRISIS_DETECTED, etc.
     - Removes content from logs, only logs content length

2. MongoDBStorage Class:
   - Database Connections:
     - Connects to MongoDB Atlas using connection string from `MONGODB_URI`
     - Uses two databases: `therapy_support_db` and `fluenti`
     - Collections: `conversations`, `sessions`, `crisis_logs`, `user_profiles`, `psychological_profiles`, `long_term_progress`, `emotionalsessions`
   - User Context Management:
     - Dynamic user context updates per request
     - Tracks: login, timestamp, session_start, user_agent, environment, time_of_day
     - Default context fallback for anonymous users
   - Conversation Storage (`save_conversation`):
     - Encrypts user input and bot responses before storage
     - Stores hashed user IDs for privacy
     - Tracks: input length, response length, crisis level, mood score
     - Updates user profile with conversation statistics
     - Logs crisis events automatically
   - Conversation History Retrieval (`get_conversation_history`):
     - Retrieves from `EmotionalSession` collection (Node.js service) first
     - Falls back to `conversations` collection (Python service)
     - Decrypts encrypted data on retrieval
     - Supports session restoration with `skip_token_validation` flag
     - Limits results (default: 10 conversations)
   - Crisis Event Logging (`log_crisis_event`):
     - Logs crisis events to `crisis_logs` collection
     - Marks high/critical crises for follow-up
     - Sends immediate alerts for high/critical crises
     - Tracks alert status and follow-up completion
   - Psychological Profile Management:
     - `get_or_create_psychological_profile`: Creates or retrieves user's psychological profile
     - `update_psychological_profile`: Updates profile with AI-powered pattern analysis
     - `_analyze_psychological_patterns`: Uses LLM to identify core patterns, cognitive patterns, emotional patterns, coping mechanisms
     - `_detect_trauma_indicators`: AI-powered trauma indicator detection with sensitivity
     - `_update_long_term_progress`: Tracks progress over time with risk trends
   - Data Management:
     - `cleanup_expired_data`: Removes data older than retention period (30 days default)
     - `anonymize_user_data`: Anonymizes user data for privacy compliance
     - Creates database indexes for performance optimization

3. DataLoader Class:
   - Dataset Loading:
     - Loads mental health datasets from Hugging Face using streaming mode
     - Datasets: `Amod/mental_health_counseling_conversations`, `heliosbrahma/mental_health_chatbot_dataset`, `nbertagnolli/counsel-chat`, `nvidia/HelpSteer`
     - Streaming mode for faster loading (processes examples on-the-fly)
     - Fallback to traditional loading if streaming fails
   - Text Processing:
     - `normalize_text`: Removes HTML/XML tags, normalizes quotes, cleans whitespace
     - `count_words`: Word counting for quality validation
     - `is_mental_health_relevant`: Filters for mental health relevance using keyword matching
     - `validate_text_quality`: Validates text meets quality standards (20-2000 words, 3+ unique words)
   - Field Extraction:
     - `extract_dataset_fields`: Extracts text from different dataset formats (Context/Response, question/answer, prompt/response)
     - Handles multiple dataset structures automatically

4. CrisisDetector Class:
   - Detection Modes: "ai", "pattern", or "hybrid" (default: hybrid)
   - Crisis Levels: NONE, LOW, MEDIUM, HIGH, CRITICAL
   - Harm Types: NONE, SELF_HARM, HARM_TO_OTHERS, BOTH
   - AI-Powered Detection (`_ai_powered_crisis_detection`):
     - Uses LLM to analyze text for crisis indicators
     - Considers context, intent, and emotional state
     - Distinguishes between general sadness and actual harm ideation
     - Returns both crisis level and harm type
   - Pattern-Based Detection (`_pattern_based_crisis_detection`):
     - Extracts linguistic features (word count, sentence count, question marks, first/second person usage, negation words, intensity words, temporal words, social words)
     - Learns contexts dynamically from text
     - Detects critical patterns (suicide, self-harm, method-specific, immediate intent)
     - Uses flexible regex patterns for variations
     - Analyzes help-seeking behavior
     - Checks for negation patterns that reduce crisis severity
     - Calculates final crisis level using weighted scoring
   - Hybrid Detection:
     - Combines AI and pattern-based detection
     - Intelligently reconciles discrepancies using AI analysis
     - Safety-first approach: prioritizes higher risk assessment
     - `_reconcile_crisis_detection_intelligently`: Uses AI to resolve conflicts between detection methods
   - Complexity Analysis (`_analyze_interaction_complexity`):
     - AI-powered analysis to determine interaction complexity
     - Classifies interactions as: minimal, simple, moderate, complex
     - Optimizes processing: simple interactions skip heavy analysis
     - Uses AI to understand expressions (greeting, acknowledgment, laughter, exclamation, casual, closing, question, emotional, complex, unclear)
   - Safety Features:
     - Critical safety patterns have hardcoded backup (minimal, only for safety)
     - Context analysis prevents false positives (e.g., "feeling down today" vs "want to die today")
     - Help-seeking behavior reduces crisis score
     - Negation patterns reduce crisis severity
     - Time-of-day considerations (higher concern during vulnerable hours)
   - Harm Type Detection:
     - AI-powered harm type analysis
     - Distinguishes between self-harm and harm to others
     - Safety check: prevents general emotional distress from being classified as self-harm
     - Pattern-based backup for critical safety

5. TherapyBot Class:
   - Initialization:
     - Uses Groq LLM (ChatGroq) with model "llama-3.3-70b-versatile"
     - Initializes knowledge base with mental health datasets
     - Sets up dynamic conversation prompts (casual, therapeutic, crisis)
     - Maintains strict session isolation
   - Knowledge Base (`_initialize_enhanced_knowledge_base`):
     - Processes mental health datasets into vector store
     - Uses OpenAI embeddings (text-embedding-3-small model, $0.02/1M tokens)
     - Creates Chroma vector store with metadata
     - Text chunking: 1000 words per chunk with 150 word overlap (15%)
     - Quality filtering: 20-2000 words, mental health relevance, deduplication
     - Creates specialized retrievers: `crisis_retriever` (6 docs) and `general_retriever` (6 docs)
   - Session Memory (`SessionMemory` dataclass):
     - Strict session isolation: each session has isolated memory
     - Tracks: primary_issue, issue_details, progress_notes, conversation_summary, key_themes, user_preferences, complexity_history
     - Loads existing history from MongoDB on session restoration
     - Verifies session isolation to prevent cross-session contamination
   - Response Generation (`generate_enhanced_response`):
     - Security validation and input sanitization
     - Retrieves/creates psychological profile
     - Crisis detection
     - Determines response type (casual, therapeutic, crisis)
     - Analyzes interaction complexity
     - Retrieves conversation history (session-isolated)
     - Gets session context and summary
     - Retrieves therapeutic context from knowledge base (enhanced with psychological profile)
     - Generates response using appropriate prompt template
     - Handles emergency notifications for harm to others
     - Adds crisis resources for high/critical crises
     - Updates session memory
     - Saves conversation and updates psychological profile
   - Response Type Determination (`_determine_response_type`):
     - AI-powered determination based on therapeutic context
     - Considers: emotional depth, mental health topics, help-seeking behavior, conversation stage
     - Crisis situations always get crisis response
   - Context Retrieval (`_get_dynamic_context`):
     - AI-enhanced query for better context retrieval
     - Retrieves from knowledge base using RAG (Retrieval-Augmented Generation)
     - Word limits: 200 words (casual), 250 words (therapeutic), 300 words (crisis)
     - AI selects and ranks most relevant context pieces
     - Profile-enhanced context (`_get_dynamic_context_with_profile`): Incorporates psychological profile insights
   - Prompt Templates:
     - Casual Prompt: For simple interactions, maintains professional therapeutic voice regardless of user's communication style
     - Therapeutic Prompt: For substantial emotional content, includes session context, conversation history, crisis level
     - Crisis Prompt: For crisis situations, includes assessment questions, crisis intervention knowledge
     - All prompts emphasize maintaining professional therapeutic voice
   - Psychological Profile Integration:
     - `_create_profile_context_summary`: Creates concise profile summary
     - `_generate_profile_specific_guidance`: Generates personalized therapeutic guidance based on profile
     - Profile-aware context retrieval for personalized responses
   - Crisis Resources (`_add_crisis_resources`):
     - AI-generated crisis resources based on severity
     - Includes Pakistan mental health helplines (1019, 1166, 0800-00-100)
     - Matches urgency to crisis level
     - Fallback to hardcoded resources if AI unavailable
   - Emergency Notifications (`_send_emergency_notification`):
     - Sends notifications for harm to others scenarios
     - Includes conversation history, crisis level, harm type
     - Sends to backend `/api/emergency-notification` endpoint

6. TherapyInterface Class:
   - Session Management:
     - `start_session`: Creates secure therapy session with token authentication
     - `_should_reuse_existing_session`: AI-powered decision to reuse or create new session
     - Session reuse window: 5 minutes
     - AI-generated contextual welcome messages based on time of day
     - AI-generated continuation messages for resumed sessions
   - Message Handling (`send_message`):
     - Validates session and message
     - Generates response using TherapyBot
     - Tracks conversation count and crisis levels
     - Formats emergency/urgent messages for high-risk scenarios
   - Error Handling (`_generate_ai_error_message`):
     - AI-generated contextual error messages
     - Maintains professional therapeutic voice
     - Includes crisis support information when relevant
   - Session Summary (`get_session_summary`):
     - Comprehensive session summary with psychological insights
     - Includes: session metrics, key themes, strengths, psychological insights, progress indicators, memory insights, personalized recommendations
     - AI-powered theme extraction, strength identification, recommendation generation
     - Uses psychological profile for deeper insights
   - Helper Methods:
     - `_get_session_duration`: Calculates session duration
     - `_get_memory_insights`: Generates insights from session memory
     - `_extract_themes`: AI-powered theme extraction from conversation
     - `_extract_strengths`: AI-powered strength identification
     - `_get_psychological_insights`: Generates insights from psychological profile
     - `_get_progress_indicators`: Tracks progress over time
     - `_generate_personalized_recommendations`: AI-generated personalized recommendations based on profile and conversation

Security Configuration:

- `MAX_INPUT_LENGTH`: 5000 characters
- `MAX_SESSION_DURATION`: 86400 seconds (24 hours)
- `MAX_CONVERSATIONS_PER_SESSION`: 1000
- `RATE_LIMIT_WINDOW`: 3600 seconds (1 hour)
- `MAX_REQUESTS_PER_HOUR`: 100
- `ENCRYPTION_ENABLED`: true (if cryptography available)
- `AUDIT_LOGGING`: true
- `DATA_RETENTION_DAYS`: 30
- `SANITIZE_INPUTS`: true
- `VALIDATE_SESSION_TOKENS`: true

Security Decorators:

- `@require_valid_session`: Validates session tokens before function execution
- `@rate_limit_check`: Checks rate limits before function execution

Dataset Configuration:

- Deployment mode detection (Railway, Vercel, Render)
- Dataset limits for deployment (optimized for memory)
- Streaming mode for faster dataset loading
- Quality filtering and mental health relevance filtering

Initialization Flow:

1. Load environment variables
2. Initialize SecurityManager (encryption, audit logging)
3. Initialize MongoDBStorage (database connection, indexes)
4. Load mental health datasets (streaming mode)
5. Initialize CrisisDetector (hybrid mode)
6. Initialize TherapyBot (LLM, knowledge base, prompts)
7. Initialize TherapyInterface
8. Validate API keys (GROQ_API_KEY, OPENAI_API_KEY)

Key Features:

- AI-First Approach: Uses LLM for most analysis, with minimal hardcoded patterns only for critical safety
- Professional Therapeutic Voice: All responses maintain professional therapeutic language regardless of user's communication style
- Strict Session Isolation: Each session has isolated memory, preventing cross-session contamination
- Comprehensive Security: Encryption, sanitization, rate limiting, audit logging, session token validation
- Psychological Profiling: Deep psychological pattern analysis, trauma detection, long-term progress tracking
- Crisis Detection: Multi-layered crisis detection (AI + pattern-based) with safety-first approach
- Knowledge Base: RAG system with mental health datasets for evidence-based responses
- Personalization: Profile-enhanced responses, personalized recommendations, adaptive context retrieval

---

 Security Features

1. Authentication:
   - JWT tokens (httpOnly cookies)
   - Password hashing (bcrypt)
   - Email verification
   - Two-factor authentication (TOTP)
   - Account lockout after failed attempts

2. Authorization:
   - Token-based route protection
   - User type restrictions
   - Session validation

3. Data Security:
   - Input sanitization
   - Encryption for sensitive data (Python)
   - Rate limiting
   - Audit logging

4. Crisis Detection:
   - Automated crisis detection
   - Emergency notifications
   - Crisis resources display

---

 Conclusion

Fluenti is a comprehensive platform that combines speech therapy games with AI-powered emotional support. The architecture is well-structured with clear separation between frontend (React) and backend (Node.js + Python). The system uses modern technologies and follows best practices for security, authentication, and data management.

The platform successfully integrates multiple AI services (Gemini, Groq) and provides a seamless user experience for both children (story game) and adults (emotional support). The codebase is modular and maintainable, with clear data flows and well-defined APIs.
