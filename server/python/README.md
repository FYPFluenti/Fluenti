# Emotional Therapy Service Integration

This directory contains the emotional therapy service that provides AI-powered mental health support through HTTP endpoints.

## 🚀 Quick Start

### 1. Test Your Installation (Recommended)

```bash
cd server/python
python test_installation.py
```

This will check if everything is properly set up.

### 2. Install Python Dependencies

Choose one of these methods:

```bash
# Option 1: Auto-install with startup script
python start_therapy_service.py

# Option 2: Manual install
pip install flask flask-cors pymongo nltk

# Option 3: From requirements file (if all deps available)
pip install -r requirements.txt

# Option 4: Windows batch file (double-click)
start_service.bat

# Option 5: Windows PowerShell
.\start_service.ps1
```

### 3. Start the Python Therapy Service

```bash
# Option 1: Direct service start (recommended)
python therapy_service.py

# Option 2: Using the startup script (auto-installs deps)
python start_therapy_service.py

# Option 3: Windows users - double click start_service.bat
```

The Python service will start on `http://localhost:5001`

### 4. Start the Node.js Server

In a separate terminal:

```bash
# From the main project directory
npm run dev
```

The Node.js server will start on `http://localhost:3000`

### 5. Access the Frontend

Open your browser and navigate to the emotional support page in your React application.

## 📡 API Endpoints

### Python Service (Port 5001)
- `GET /health` - Health check
- `POST /api/therapy/start-session` - Start new therapy session
- `POST /api/therapy/chat` - Send message to therapy bot
- `POST /api/therapy/session-summary` - Get session summary
- `GET /api/therapy/sessions` - List active sessions

### Node.js Server (Port 3000)  
- `POST /api/emotional-support-chat` - Main chat endpoint (proxies to Python service)
- `POST /api/therapy/start-session` - Start session (proxies to Python service)
- `POST /api/therapy/session-summary` - Get summary (proxies to Python service)
- `GET /api/therapy/health` - Combined health check

## 🔧 Configuration

### Environment Variables

The therapy service uses these environment variables (optional):

```bash
# MongoDB connection (already configured in emotional_therapy.py)
MONGODB_URI=mongodb+srv://...

# Groq API Key (already configured in emotional_therapy.py)
GROQ_API_KEY=gsk_...
```

### Service Configuration

- **Python Service Port**: 5001 (configurable in `therapy_service.py`)
- **Crisis Detection**: Fully dynamic AI-powered crisis detection
- **Session Management**: Isolated user sessions with memory
- **Database**: MongoDB Atlas for conversation storage

## 🧠 Features

### AI Capabilities
- **Crisis Detection**: 5-level crisis assessment (none, low, medium, high, critical)
- **Session Memory**: Maintains context within conversations
- **Therapeutic Techniques**: CBT, DBT, and mindfulness approaches
- **Vector Knowledge Base**: Enhanced with mental health datasets
- **Sentiment Analysis**: Real-time mood assessment

### Safety Features
- **Crisis Resources**: Automatic provision of emergency contacts
- **Session Isolation**: Strict user data separation
- **Fallback Responses**: Graceful error handling
- **Professional Boundaries**: Appropriate therapeutic responses

## 🔍 Troubleshooting

### Python Service Won't Start
1. Check Python version (3.8+ required): `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check port availability: `netstat -an | findstr :5001`

### Node.js Can't Connect to Python Service
1. Verify Python service is running on port 5001
2. Check firewall settings
3. Test health endpoint: `curl http://localhost:5001/health`

### Frontend Shows "Service Offline"
1. Check both Python (5001) and Node.js (3000) services are running
2. Test the health endpoint: `http://localhost:3000/api/therapy/health`
3. Check browser console for errors

### MongoDB Connection Issues
- The service uses a pre-configured MongoDB Atlas connection
- If needed, update the connection string in `emotional_therapy.py`

## 📊 Monitoring

### Health Checks
- **Python Service**: `GET http://localhost:5001/health`
- **Combined Health**: `GET http://localhost:3000/api/therapy/health`

### Active Sessions
- **View Sessions**: `GET http://localhost:5001/api/therapy/sessions`

### Logs
- Python service logs appear in the terminal where you started `therapy_service.py`
- Node.js logs appear in the terminal where you ran `npm run dev`

## 🔒 Security Notes

- The service includes crisis intervention protocols
- All conversations are stored with user isolation
- API endpoints include appropriate error handling
- Crisis resources are prominently displayed when needed

## 📞 Crisis Resources

The service automatically provides these resources when crisis levels are detected:

- **988** - Suicide & Crisis Lifeline (call or text, 24/7)
- **911** - Emergency Services
- **Text HOME to 741741** - Crisis Text Line

## 🎯 Development

### File Structure
```
server/python/
├── emotional_therapy.py      # Core therapy bot logic
├── therapy_service.py        # Flask HTTP service
├── start_therapy_service.py  # Startup script
├── requirements.txt          # Python dependencies
└── README.md                # This file
```

### Testing
1. Start both services
2. Open browser developer tools
3. Navigate to emotional support chat
4. Send test messages and verify responses
5. Check Python service logs for detailed information

For additional support or issues, check the service logs and health endpoints.