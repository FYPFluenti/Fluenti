import sys
import os
import json
from typing import Dict, Any, Optional
import traceback
from datetime import datetime

# Check if running in virtual environment
def check_venv():
    """Check if we're running in a virtual environment and warn if not"""
    in_venv = (
        hasattr(sys, 'real_prefix') or 
        (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    )
    if not in_venv:
        venv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'venv')
        if os.path.exists(venv_path):
            print("⚠️ WARNING: Not running in virtual environment!")
            print(f"   Current Python: {sys.executable}")
            print(f"   Virtual environment found at: {venv_path}")
            print(f"   Activate it with: & {venv_path}\\Scripts\\Activate.ps1")
            print("   Or use: venv\\Scripts\\python.exe server\\python\\therapy_service.py")
    return in_venv

# Check virtual environment
_venv_check = check_venv()

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()  # Load variables from .env file
except ImportError:
    print("⚠️ python-dotenv not available, using system environment variables only")

# Check for Flask dependencies first
try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ImportError as e:
    print(f"❌ Flask dependencies not installed: {e}")
    print("💡 Install with: pip install flask flask-cors")
    print("🛑 Cannot start therapy service without Flask")
    sys.exit(1)

# Add the current directory to Python path to import the therapy module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the therapy bot components
try:
    from emotional_therapy import therapy_bot, interface, TherapyInterface, CrisisLevel, HarmType
    print("✅ Successfully imported therapy components")
    
    # Type checking for imported components
    if therapy_bot is None:
        print("⚠️ therapy_bot is None - limited functionality")
    if TherapyInterface is None:
        print("⚠️ TherapyInterface is None - cannot create sessions")
    if CrisisLevel is None:
        print("⚠️ CrisisLevel is None - crisis detection unavailable")
    if HarmType is None:
        print("⚠️ HarmType is None - harm type detection unavailable")
        
except ImportError as e:
    print(f"❌ Error importing therapy components: {e}")
    therapy_bot = None
    interface = None
    TherapyInterface = None
    CrisisLevel = None
    HarmType = None

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

#  Add request logging middleware to prevent duplication
import uuid
import logging
from flask import g

# Configure logging to reduce duplication
logging.getLogger('werkzeug').setLevel(logging.WARNING)
app.logger.setLevel(logging.INFO)

@app.before_request
def log_request():
    """Log incoming requests with unique ID"""
    g.request_id = str(uuid.uuid4())[:8]
    
    # Only log non-health check requests to reduce noise
    if request.endpoint != 'health_check':
        app.logger.info(f"[{g.request_id}] {request.method} {request.path}")

@app.after_request 
def log_response(response):
    """Log outgoing responses"""
    if hasattr(g, 'request_id') and request.endpoint != 'health_check':
        app.logger.info(f"[{g.request_id}] Response: {response.status_code}")
    return response

# Store active sessions
active_sessions: Dict[str, Any] = {}

def create_user_context(user_id: str) -> Dict:
    """Create user context from API request data"""
    current_time = datetime.now()
    
    # Add time_of_day classification for crisis detector compatibility
    def classify_time_of_day(hour: int) -> str:
        if 5 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 17:
            return 'afternoon'
        elif 17 <= hour < 21:
            return 'evening'
        else:
            return 'night'
    
    return {
        'login': user_id,
        'timestamp': current_time,
        'session_start': current_time.isoformat(),
        'user_agent': 'Fluenti-API',
        'environment': 'Production-API',
        'time_of_day': classify_time_of_day(current_time.hour),
        'date': current_time.strftime('%Y-%m-%d')
    }

def validate_user_id(user_id: str) -> bool:
    """Validate user ID format and authenticity"""
    if not user_id or not isinstance(user_id, str):
        return False
    
    # Basic validation - user ID should not be empty and should be reasonable length
    user_id = user_id.strip()
    if len(user_id) < 3 or len(user_id) > 100:
        return False
    
    # Check for suspicious patterns that might indicate fallback values
    suspicious_patterns = ['afaqm3121-lab', 'anonymous_user', 'user_fallback']
    if any(pattern in user_id.lower() for pattern in suspicious_patterns):
        print(f"⚠️ WARNING: Suspicious user ID detected: {user_id}")
        return True  # Still allow but warn
    
    return True

def update_therapy_components_user_context(user_id: str):
    """Update user context for all therapy components with validation"""
    if not validate_user_id(user_id):
        print(f"❌ Invalid user ID provided: {user_id}")
        raise ValueError(f"Invalid user ID format: {user_id}")
    
    user_context = create_user_context(user_id)
    
    try:
        # Update therapy bot context
        if therapy_bot and hasattr(therapy_bot, 'update_user_context'):
            therapy_bot.update_user_context(user_context)
        
        # Update storage context
        if therapy_bot and hasattr(therapy_bot, 'storage') and hasattr(therapy_bot.storage, 'update_user_context'):
            therapy_bot.storage.update_user_context(user_context)
        
        # Update crisis detector context
        if therapy_bot and hasattr(therapy_bot, 'crisis_detector') and hasattr(therapy_bot.crisis_detector, 'update_user_context'):
            therapy_bot.crisis_detector.update_user_context(user_context)
        
        print(f"✅ Successfully updated all therapy components with user context: {user_id}")
        
    except Exception as e:
        print(f"❌ Error updating therapy components with user context: {e}")
        raise

def restore_session_from_mongodb(user_id: str, session_id: str):
    """Restore session context from MongoDB EmotionalSession collection"""
    try:
        # Access therapy bot's storage
        if not therapy_bot or not hasattr(therapy_bot, 'storage'):
            print("❌ Cannot restore session: therapy bot or storage not available")
            return None
        
        storage = therapy_bot.storage
        
        # Get conversation history for this session (skip token validation for restoration)
        history = storage.get_conversation_history(user_id, session_id, limit=50, skip_token_validation=True)
        
        print(f"🔍 Attempting to restore session for user: {user_id}, session: {session_id}")
        
        if not history:
            print(f"❌ No conversation history found for session {session_id}")
            return None
        
        # Create new session interface
        if TherapyInterface is None:
            print("❌ Cannot restore session: TherapyInterface not available")
            return None
            
        session_interface = TherapyInterface(therapy_bot)
        session_interface.current_session_id = session_id
        session_interface.current_user_id = user_id
        session_interface.session_start_time = datetime.now()
        
        # Create session token for restored session so it can be used normally
        if hasattr(therapy_bot, 'storage') and hasattr(therapy_bot.storage, 'security_manager'):
            try:
                session_token = therapy_bot.storage.security_manager.create_session_token(user_id, session_id)
                print(f"🔐 Created session token for restored session")
            except Exception as e:
                print(f"⚠️ Could not create session token for restored session: {e}")
        
        # Pre-populate session memory by calling _get_or_create_session_memory
        # This will load the history into memory
        if hasattr(therapy_bot, '_get_or_create_session_memory'):
            try:
                therapy_bot._get_or_create_session_memory(user_id, session_id)
                print(f"📚 Pre-populated session memory from {len(history)} conversations")
            except Exception as e:
                print(f"⚠️ Could not pre-populate session memory: {e}")
        
        print(f"✅ Restored session {session_id} with {len(history)} messages")
        return session_interface
        
    except Exception as e:
        print(f"❌ Error restoring session from MongoDB: {e}")
        import traceback
        traceback.print_exc()
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with AI crisis detection status"""
    crisis_info = {}
    
    # Get crisis detection information
    if therapy_bot and hasattr(therapy_bot, 'crisis_detector'):
        detector = therapy_bot.crisis_detector
        crisis_info = {
            'detection_mode': getattr(detector, 'detection_mode', 'unknown'),
            'ai_enabled': hasattr(detector, 'llm') and detector.llm is not None,
            'llm_model': 'llama-3.3-70b-versatile' if hasattr(detector, 'llm') and detector.llm else None,
            'hybrid_analysis': detector.detection_mode == 'hybrid' if hasattr(detector, 'detection_mode') else False
        }
    
    return jsonify({
        'status': 'healthy',
        'therapy_bot_available': therapy_bot is not None,
        'interface_available': interface is not None,
        'crisis_detection': crisis_info,
        'emergency_contacts': {
            '1019': 'Mental Health Crisis Line (24/7)',
            '1166': 'National Emergency Helpline',
            '0800-00-100': 'Rozan Crisis Helpline'
        }
    })

@app.route('/api/therapy/start-session', methods=['POST'])
def start_therapy_session():
    """Start a new therapy session"""
    try:
        if not therapy_bot or not TherapyInterface:
            return jsonify({
                'error': 'Therapy bot not available',
                'available_resources': {
                    '1019': 'Mental Health Crisis Line (24/7)',
                    '1166': 'National Emergency Helpline'
                }
            }), 503

        data = request.json or {}
        user_id = data.get('userId', f"user_{len(active_sessions) + 1}")
        
        # Validate and update therapy components with authenticated user context
        try:
            update_therapy_components_user_context(user_id)
        except ValueError as e:
            return jsonify({
                'error': 'Invalid user authentication',
                'details': str(e)
            }), 400
        except Exception as e:
            print(f"❌ Error updating user context: {e}")
            return jsonify({
                'error': 'Authentication system error',
                'details': 'Unable to establish user context'
            }), 500
        
        # Create new interface for this session
        session_interface = TherapyInterface(therapy_bot)
        welcome_message = session_interface.start_session(user_id)
        
        # Store session
        session_key = f"{user_id}_{session_interface.current_session_id}"
        
        # Safe handling of session_start_time
        created_at = datetime.now().isoformat()
        if session_interface.session_start_time is not None:
            created_at = session_interface.session_start_time.isoformat()
            
        active_sessions[session_key] = {
            'interface': session_interface,
            'user_id': user_id,
            'session_id': session_interface.current_session_id,
            'created_at': created_at
        }
        
        return jsonify({
            'success': True,
            'sessionId': session_interface.current_session_id,
            'userId': user_id,
            'welcomeMessage': welcome_message,
            'sessionKey': session_key
        })
        
    except Exception as e:
        print(f"❌ Error starting session: {e}")
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to start therapy session',
            'details': str(e)
        }), 500

@app.route('/api/therapy/chat', methods=['POST'])
def therapy_chat():
    """Handle therapy chat messages"""
    try:
        if not therapy_bot:
            return jsonify({
                'error': 'Therapy bot not available',
                'response': "I'm currently unavailable. If you're in crisis, please contact 1019 (Mental Health Crisis Line) or 1166 (National Emergency Helpline)."
            }), 503

        data = request.json or {}
        message = data.get('message', '').strip()
        session_key = data.get('sessionKey')
        user_id = data.get('userId')
        session_id = data.get('sessionId')

        if not message:
            return jsonify({
                'error': 'Message is required'
            }), 400

        # Validate and update therapy components with authenticated user context
        if user_id:
            try:
                update_therapy_components_user_context(user_id)
            except ValueError as e:
                return jsonify({
                    'error': 'Invalid user authentication',
                    'details': str(e)
                }), 400
            except Exception as e:
                print(f"❌ Error updating user context: {e}")
                # Continue with session but log the error
                print(f"⚠️ Continuing with session using fallback context")

        # Try to get existing session
        session_interface = None
        
        if session_key and session_key in active_sessions:
            session_interface = active_sessions[session_key]['interface']
        elif user_id and session_id:
            # Try to find session by user_id and session_id
            for key, session in active_sessions.items():
                if session['user_id'] == user_id and session['session_id'] == session_id:
                    session_interface = session['interface']
                    session_key = key
                    break
            
            # If not found in active sessions, try to restore from MongoDB
            if not session_interface:
                session_interface = restore_session_from_mongodb(user_id, session_id)
                if session_interface:
                    session_key = f"{user_id}_{session_id}"
                    created_at = datetime.now().isoformat()
                    active_sessions[session_key] = {
                        'interface': session_interface,
                        'user_id': user_id,
                        'session_id': session_id,
                        'created_at': created_at
                    }
                    print(f"🔄 Restored session from MongoDB: {session_id}")
        
        # If no session found, create a new one
        if not session_interface:
            if not user_id:
                user_id = f"user_{len(active_sessions) + 1}"
            
            # Validate and update therapy components with user context for new session
            try:
                update_therapy_components_user_context(user_id)
            except ValueError as e:
                return jsonify({
                    'error': 'Invalid user authentication for new session',
                    'details': str(e)
                }), 400
            except Exception as e:
                print(f"❌ Error updating user context for new session: {e}")
                # Continue with session but log the error
                print(f"⚠️ Continuing with new session using fallback context")
            
            # Type-safe session creation
            if TherapyInterface is None or therapy_bot is None:
                return jsonify({
                    'error': 'Therapy service not properly initialized',
                    'response': "I'm currently unavailable. If you're in crisis, please contact 1019 (Mental Health Crisis Line) or 1166 (National Emergency Helpline)."
                }), 503
            
            session_interface = TherapyInterface(therapy_bot)
            welcome_message = session_interface.start_session(user_id)
            
            session_key = f"{user_id}_{session_interface.current_session_id}"
            
            # Safe handling of session_start_time
            created_at = datetime.now().isoformat()
            if session_interface.session_start_time is not None:
                created_at = session_interface.session_start_time.isoformat()
                
            active_sessions[session_key] = {
                'interface': session_interface,
                'user_id': user_id,
                'session_id': session_interface.current_session_id,
                'created_at': created_at
            }
            
            # Return both welcome and response to user message
            response = session_interface.send_message(message)
            return jsonify({
                'success': True,
                'response': response,
                'welcomeMessage': welcome_message,
                'sessionKey': session_key,
                'sessionId': session_interface.current_session_id,
                'userId': user_id,
                'newSession': True
            })

        # Send message to existing session
        response = session_interface.send_message(message)
        
        # Check if response indicates crisis level and harm type
        crisis_level = session_interface.last_crisis_level
        harm_type = getattr(session_interface, 'last_harm_type', None)
        is_crisis = crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL] if CrisisLevel else False
        
        # Get AI crisis detection info if available
        ai_detection_info = {}
        if hasattr(session_interface.therapy_bot, 'crisis_detector'):
            detector = session_interface.therapy_bot.crisis_detector
            ai_detection_info = {
                'detection_mode': getattr(detector, 'detection_mode', 'unknown'),
                'ai_enabled': hasattr(detector, 'llm') and detector.llm is not None,
                'hybrid_analysis': detector.detection_mode == 'hybrid' if hasattr(detector, 'detection_mode') else False
            }
        
        return jsonify({
            'success': True,
            'response': response,
            'sessionKey': session_key,
            'sessionId': session_interface.current_session_id,
            'userId': user_id,
            'crisisLevel': crisis_level.value if crisis_level else 'none',
            'harmType': harm_type.value if harm_type else 'none',
            'isCrisis': is_crisis,
            'newSession': False,
            'aiDetection': ai_detection_info
        })
        
    except Exception as e:
        print(f"❌ Error in therapy chat: {e}")
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to process message',
            'response': "I encountered a technical issue. Please try again. If you're in crisis, please contact 1019 (Mental Health Crisis Line) or 1166 (National Emergency Helpline).",
            'details': str(e)
        }), 500

@app.route('/api/therapy/session-summary', methods=['POST'])
def get_session_summary():
    """Get session summary"""
    try:
        data = request.json or {}
        session_key = data.get('sessionKey')
        
        if not session_key or session_key not in active_sessions:
            return jsonify({
                'error': 'Session not found'
            }), 404
            
        session_interface = active_sessions[session_key]['interface']
        summary = session_interface.get_session_summary()
        
        return jsonify({
            'success': True,
            'summary': summary,
            'sessionKey': session_key
        })
        
    except Exception as e:
        print(f"❌ Error getting session summary: {e}")
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get session summary',
            'details': str(e)
        }), 500

@app.route('/api/therapy/sessions', methods=['GET'])
def list_active_sessions():
    """List all active sessions (for debugging)"""
    try:
        sessions_info = []
        for key, session in active_sessions.items():
            sessions_info.append({
                'sessionKey': key,
                'userId': session['user_id'],
                'sessionId': session['session_id'],
                'createdAt': session['created_at'],
                'messageCount': session['interface'].conversation_count,
                'crisisLevel': session['interface'].last_crisis_level.value if session['interface'].last_crisis_level else 'none'
            })
        
        return jsonify({
            'success': True,
            'activeSessions': len(active_sessions),
            'sessions': sessions_info
        })
        
    except Exception as e:
        print(f"❌ Error listing sessions: {e}")
        return jsonify({
            'error': 'Failed to list sessions',
            'details': str(e)
        }), 500

@app.route('/api/therapy/crisis-detection/config', methods=['GET', 'POST'])
def crisis_detection_config():
    """Get or set crisis detection configuration"""
    try:
        if not therapy_bot or not hasattr(therapy_bot, 'crisis_detector'):
            return jsonify({
                'error': 'Crisis detector not available'
            }), 503
            
        detector = therapy_bot.crisis_detector
        
        if request.method == 'GET':
            # Get current configuration
            return jsonify({
                'success': True,
                'current_mode': getattr(detector, 'detection_mode', 'unknown'),
                'ai_enabled': hasattr(detector, 'llm') and detector.llm is not None,
                'llm_model': 'llama-3.3-70b-versatile' if hasattr(detector, 'llm') and detector.llm else None,
                'available_modes': ['ai', 'pattern', 'hybrid'],
                'recommended_mode': 'hybrid'
            })
        
        elif request.method == 'POST':
            # Set new configuration
            data = request.json or {}
            new_mode = data.get('mode')
            
            if new_mode not in ['ai', 'pattern', 'hybrid']:
                return jsonify({
                    'error': 'Invalid mode. Use: ai, pattern, or hybrid'
                }), 400
            
            # Update detection mode
            old_mode = getattr(detector, 'detection_mode', 'unknown')
            detector.detection_mode = new_mode
            
            return jsonify({
                'success': True,
                'message': f'Crisis detection mode changed from {old_mode} to {new_mode}',
                'old_mode': old_mode,
                'new_mode': new_mode,
                'ai_enabled': hasattr(detector, 'llm') and detector.llm is not None
            })
        
        else:
            # Handle unsupported methods (though Flask should prevent this)
            return jsonify({
                'error': 'Method not allowed'
            }), 405
            
    except Exception as e:
        print(f"❌ Error with crisis detection config: {e}")
        return jsonify({
            'error': 'Failed to configure crisis detection',
            'details': str(e)
        }), 500

@app.route('/api/therapy/psychological-profile', methods=['GET'])
def get_psychological_profile():
    """Get psychological profile insights for a user"""
    try:
        if not therapy_bot or not hasattr(therapy_bot, 'storage'):
            return jsonify({
                'error': 'Therapy service not available',
                'available': False
            }), 503
        
        data = request.args
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({
                'error': 'User ID required',
                'required_params': ['userId']
            }), 400
        
        # Validate and update therapy components with user context
        try:
            update_therapy_components_user_context(user_id)
        except ValueError as e:
            return jsonify({
                'error': 'Invalid user ID',
                'details': str(e)
            }), 400
        except Exception as e:
            print(f"❌ Error updating user context: {e}")
            return jsonify({
                'error': 'Failed to update user context',
                'details': str(e)
            }), 500
        
        # Get psychological profile and session data
        profile = therapy_bot.storage.get_or_create_psychological_profile(user_id)
        user_hash = therapy_bot.storage.security_manager.hash_pii(user_id)
        
        # Get actual session count from conversations collection - try multiple formats
        print(f"🔍 [Profile] Looking for sessions with user_id: {user_id}")
        print(f"🔍 [Profile] Hashed user_id: {user_hash}")
        print(f"🔍 [Profile] Total documents in conversations collection: {therapy_bot.storage.conversations.count_documents({})}")
        
        # Sample some documents to see the structure
        sample_docs = list(therapy_bot.storage.conversations.find({}).limit(3))
        for i, doc in enumerate(sample_docs):
            print(f"🔍 [Profile] Sample doc {i}: {list(doc.keys())}")
            if 'user_id' in doc:
                print(f"🔍 [Profile] Sample doc {i} user_id: {doc['user_id']}")
            if 'user_context' in doc:
                print(f"🔍 [Profile] Sample doc {i} user_context: {doc['user_context']}")
            if 'userId' in doc:
                print(f"🔍 [Profile] Sample doc {i} userId: {doc['userId']}")
        
        session_queries = [
            {"user_id": user_hash},
            {"user_id": user_id}, 
            {"user_context.login": user_id},
            {"userId": user_id}
        ]
        
        total_sessions = 0
        for query in session_queries:
            count = therapy_bot.storage.conversations.count_documents(query)
            print(f"🔍 [Profile] Query {query} found {count} sessions")
            if count > 0:
                total_sessions = count
                break
        
        # Get recent progress data
        recent_progress = list(therapy_bot.storage.long_term_progress.find({
            "user_id": user_hash
        }).sort("timestamp", -1).limit(1))
        
        latest_progress = recent_progress[0] if recent_progress else {}
        
        # Format profile data for API response with actual data
        profile_data = {
            'userId': user_id,
            'profileExists': bool(profile.core_patterns or profile.cultural_context or total_sessions > 0),
            'lastUpdated': profile.last_updated or datetime.now().isoformat(),
            'insights': {
                'corePatterns': {
                    'count': len(profile.core_patterns),
                    'patterns': list(profile.core_patterns.keys())[:5] if profile.core_patterns else []
                },
                'cognitivePatterns': {
                    'count': len(profile.cognitive_patterns),
                    'patterns': list(profile.cognitive_patterns.keys())[:3] if profile.cognitive_patterns else []
                },
                'copingMechanisms': {
                    'count': len(profile.coping_mechanisms),
                    'effective': [name for name, data in profile.coping_mechanisms.items() 
                                if isinstance(data, dict) and data.get('confidence', 0) > 0.6][:3] if profile.coping_mechanisms else []
                },
                'culturalContext': {
                    'identified': bool(profile.cultural_context),
                    'aspects': list(profile.cultural_context.keys())[:4] if profile.cultural_context else []
                },
                'traumaInformed': {
                    'indicators': len([t for t in profile.trauma_indicators.values() 
                                     if isinstance(t, dict) and t.get('present')]) if profile.trauma_indicators else 0,
                    'approach_needed': bool(profile.trauma_indicators)
                },
                'progressTracking': {
                    'trend': latest_progress.get('risk_level_trend', profile.long_term_progress.get('current_risk_trend', 'unknown')),
                    'momentum': latest_progress.get('session_quality_indicators', {}).get('progress_momentum', 
                                profile.long_term_progress.get('therapeutic_momentum', 0)),
                    'resilience_factors': len(latest_progress.get('resilience_indicators', profile.resilience_factors or []))
                }
            },
            'recommendations': {
                'culturally_informed': bool(profile.cultural_context),
                'trauma_informed': bool(profile.trauma_indicators),
                'strengths_based': bool(profile.resilience_factors or latest_progress.get('resilience_indicators'))
            },
            'sessionCount': total_sessions  # Add actual session count
        }
        
        return jsonify({
            'success': True,
            'profile': profile_data,
            'capabilities': {
                'deep_understanding': True,
                'cultural_awareness': True,
                'trauma_informed': True,
                'progress_tracking': True,
                'personalized_recommendations': True
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting psychological profile: {e}")
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to retrieve psychological profile',
            'details': str(e)
        }), 500

@app.route('/api/therapy/long-term-progress', methods=['GET'])
def get_long_term_progress():
    """Get long-term therapeutic progress for a user"""
    try:
        if not therapy_bot or not hasattr(therapy_bot, 'storage'):
            return jsonify({
                'error': 'Therapy service not available'
            }), 503
        
        data = request.args
        user_id = data.get('userId')
        days = int(data.get('days', 30))  # Default to 30 days
        
        if not user_id:
            return jsonify({
                'error': 'User ID required'
            }), 400
        
        # Validate user context
        try:
            update_therapy_components_user_context(user_id)
        except Exception as e:
            return jsonify({
                'error': 'Failed to validate user context',
                'details': str(e)
            }), 400
        
        # Get progress data from database
        from datetime import timedelta
        cutoff_date = datetime.now() - timedelta(days=days)
        user_hash = therapy_bot.storage.security_manager.hash_pii(user_id)
        
        # Get actual session count from conversations - try multiple formats
        print(f"🔍 Looking for sessions with user_id: {user_id}")
        print(f"🔍 Hashed user_id: {user_hash}")
        
        # Try different user ID formats
        session_queries = [
            {"user_id": user_hash},
            {"user_id": user_id}, 
            {"user_context.login": user_id},
            {"userId": user_id}
        ]
        
        total_sessions = 0
        session_query_used = None
        for query in session_queries:
            count = therapy_bot.storage.conversations.count_documents(query)
            print(f"🔍 Query {query} found {count} sessions")
            if count > 0:
                total_sessions = count
                session_query_used = query
                break
        
        # Get progress entries using the same query format that worked for sessions
        if session_query_used:
            progress_entries = list(therapy_bot.storage.long_term_progress.find({
                'user_id': user_hash,
                'timestamp': {'$gte': cutoff_date}
            }).sort('timestamp', 1))
        else:
            progress_entries = []
        
        # If no progress entries but we have sessions, create summary from sessions
        if not progress_entries and total_sessions > 0:
            # Get recent conversations to create progress data
            recent_conversations = list(therapy_bot.storage.conversations.find({
                'user_id': user_hash,
                'timestamp': {'$gte': cutoff_date}
            }).sort('timestamp', 1))
            
            # Calculate basic stats from conversations
            crisis_events = sum(1 for conv in recent_conversations 
                              if conv.get('crisis_level') not in ['none', None, 'stable'])
            avg_mood = 5.0  # Default neutral mood if no specific data
            
            return jsonify({
                'success': True,
                'progress': {
                    'entries': [],
                    'summary': {
                        'totalSessions': total_sessions,
                        'averageMood': avg_mood,
                        'crisisEvents': crisis_events,
                        'currentTrend': 'stable',
                        'timespan': f'{days} days'
                    },
                    'insights': {
                        'improvement': False,
                        'stable': True,
                        'needsAttention': crisis_events > 0
                    }
                }
            })
        
        # If no progress entries and no sessions
        if not progress_entries and total_sessions == 0:
            return jsonify({
                'success': True,
                'progress': {
                    'entries': [],
                    'summary': {
                        'totalSessions': 0,
                        'averageMood': 0,
                        'crisisEvents': 0,
                        'currentTrend': 'unknown',
                        'timespan': f'{days} days'
                    },
                    'insights': {
                        'improvement': False,
                        'stable': False,
                        'needsAttention': False
                    }
                }
            })
        
        # Process progress data
        progress_data = []
        for entry in progress_entries:
            progress_data.append({
                'date': entry['timestamp'].strftime('%Y-%m-%d'),
                'crisisLevel': entry.get('crisis_level', 'none'),
                'moodScore': entry.get('mood_score'),
                'patternsIdentified': entry.get('patterns_identified', 0),
                'qualityIndicators': entry.get('session_quality_indicators', {}),
                'riskTrend': entry.get('risk_level_trend', 'unknown'),
                'resilienceIndicators': entry.get('resilience_indicators', [])
            })
        
        # Generate summary insights with actual session count
        mood_scores = [entry.get('mood_score') for entry in progress_entries if entry.get('mood_score')]
        avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 5.0
        
        crisis_events = sum(1 for entry in progress_entries 
                           if entry.get('crisis_level') not in ['none', None])
        
        latest_trend = progress_entries[-1].get('risk_level_trend', 'unknown') if progress_entries else 'unknown'
        
        return jsonify({
            'success': True,
            'progress': {
                'entries': progress_data,
                'summary': {
                    'totalSessions': total_sessions,  # Use actual session count from conversations
                    'averageMood': round(avg_mood, 1),
                    'crisisEvents': crisis_events,
                    'currentTrend': latest_trend,
                    'timespan': f'{days} days'
                },
                'insights': {
                    'improvement': latest_trend == 'decreasing',
                    'stable': latest_trend == 'stable',
                    'needsAttention': latest_trend == 'increasing'
                }
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting long-term progress: {e}")
        return jsonify({
            'error': 'Failed to retrieve progress data',
            'details': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'available_endpoints': [
            'GET /health',
            'POST /api/therapy/start-session',
            'POST /api/therapy/chat',
            'POST /api/therapy/session-summary',
            'GET /api/therapy/sessions',
            'GET /api/therapy/crisis-detection/config',
            'POST /api/therapy/crisis-detection/config',
            'GET /api/therapy/psychological-profile',
            'GET /api/therapy/long-term-progress'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on the server'
    }), 500

if __name__ == '__main__':
    print("🚀 Starting Emotional Therapy Service...")
    print("📋 Available endpoints:")
    print("  GET  /health                           - Health check")
    print("  POST /api/therapy/start-session        - Start new session")
    print("  POST /api/therapy/chat                 - Send message")
    print("  POST /api/therapy/session-summary      - Get session summary")
    print("  GET  /api/therapy/sessions             - List active sessions")
    print("  GET  /api/therapy/crisis-detection/config  - Get crisis detection config")
    print("  POST /api/therapy/crisis-detection/config - Set crisis detection mode")
    print()
    
    if therapy_bot:
        print("✅ Therapy bot loaded successfully")
    else:
        print("❌ Therapy bot failed to load - service will have limited functionality")
    
    # Get port from environment (for deployment platforms)
    port = int(os.environ.get('THERAPY_PORT', 5001))
    
    # Auto-detect production environment
    is_production = (
        os.getenv('RENDER') or 
        os.getenv('RAILWAY_ENVIRONMENT') or 
        os.getenv('DYNO') or 
        os.getenv('THERAPY_PRODUCTION', 'false').lower() == 'true'
    )
    
    if is_production:
        try:
            from waitress import serve
            print("🚀 Starting with Waitress production server...")
            print(f"🌟 Server running on port {port}")
            print("🔗 Production environment detected")
            print("=" * 60)
            
            serve(app, host='0.0.0.0', port=port, threads=6)
            
        except ImportError:
            print("⚠️ Waitress not available, using Flask...")
            app.run(
                host='0.0.0.0',
                port=port,
                debug=False,
                threaded=True,
                use_reloader=False
            )
    else:
        print("⚠️ Using Flask development server")
        print(f"🌟 Starting Flask server on http://localhost:{port}")
        print("🔗 Frontend can connect to this service")
        print("💡 Press Ctrl+C to stop the service")
        print("=" * 60)
        
        try:
            app.run(
                host='0.0.0.0',
                port=port,
                debug=False,
                threaded=True,
                use_reloader=False
            )
        except KeyboardInterrupt:
            print("\n🛑 Service stopped by user")
            print("👋 Thank you for using the Emotional Therapy Service!")
        except Exception as e:
            print(f"\n❌ Service error: {e}")
            print("💡 Check the error messages above for troubleshooting")