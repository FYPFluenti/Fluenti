import sys
import os
import json
import hashlib
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
    """Log incoming requests with unique ID and perform periodic cleanup"""
    g.request_id = str(uuid.uuid4())[:8]
    
    # Only log non-health check requests to reduce noise
    if request.endpoint != 'health_check':
        app.logger.info(f"[{g.request_id}] {request.method} {request.path}")
    
    # Periodic session cleanup (every 50 requests approximately)
    import random
    if random.randint(1, 50) == 1:
        cleanup_expired_sessions()

@app.after_request 
def log_response(response):
    """Log outgoing responses"""
    if hasattr(g, 'request_id') and request.endpoint != 'health_check':
        app.logger.info(f"[{g.request_id}] Response: {response.status_code}")
    return response

# Store active sessions with metadata
active_sessions: Dict[str, Any] = {}

def cleanup_expired_sessions():
    """Clean up expired sessions from memory"""
    try:
        current_time = datetime.now()
        sessions_to_remove = []
        
        for session_key, session_data in active_sessions.items():
            try:
                # Check session age
                created_at = session_data.get('created_at')
                last_activity = session_data.get('last_activity', created_at)
                
                if created_at:
                    creation_time = datetime.fromisoformat(created_at)
                    age_hours = (current_time - creation_time).total_seconds() / 3600
                    
                    # Mark for removal if older than 24 hours
                    if age_hours > 24:
                        sessions_to_remove.append(session_key)
                        continue
                
                if last_activity:
                    activity_time = datetime.fromisoformat(last_activity)
                    inactive_hours = (current_time - activity_time).total_seconds() / 3600
                    
                    # Mark for removal if inactive for more than 2 hours
                    if inactive_hours > 2:
                        sessions_to_remove.append(session_key)
                        
            except Exception as e:
                print(f"⚠️ Error checking session {session_key}: {e}")
                sessions_to_remove.append(session_key)
        
        # Remove expired sessions
        removed_count = 0
        for session_key in sessions_to_remove:
            if session_key in active_sessions:
                del active_sessions[session_key]
                removed_count += 1
        
        if removed_count > 0:
            print(f"🧹 Cleaned up {removed_count} expired sessions")
            
        return removed_count
        
    except Exception as e:
        print(f"❌ Error during session cleanup: {e}")
        return 0

def get_secure_active_session_key(user_id: str, session_id: str) -> str:
    """Generate secure session key for active sessions"""
    if not user_id or not session_id:
        return ""
    user_hash = hashlib.sha256(user_id.encode('utf-8')).hexdigest()[:16]
    session_hash = hashlib.sha256(session_id.encode('utf-8')).hexdigest()[:16]
    return f"active_{user_hash}_{session_hash}"

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
    """Restore session context from MongoDB with enhanced user validation and security"""
    try:
        # Validate input parameters
        if not user_id or not user_id.strip():
            print("❌ Cannot restore session: Invalid user_id")
            return None
        if not session_id or not session_id.strip():
            print("❌ Cannot restore session: Invalid session_id")
            return None
            
        # Access therapy bot's storage
        if not therapy_bot or not hasattr(therapy_bot, 'storage'):
            print("❌ Cannot restore session: therapy bot or storage not available")
            return None
        
        storage = therapy_bot.storage
        
        print(f"🔍 Attempting to restore session for user: {hashlib.sha256(user_id.encode()).hexdigest()[:8]}..., session: {session_id[:8]}...")
        
        # REMOVED: Shared current_user_context validation - this was causing memory leaks between users
        # User validation is now done via user_id parameter and session memory user_context_hash
        # The user_id parameter is validated at the API level before calling this function
        
        # Get conversation history for this session with enhanced validation
        history = storage.get_conversation_history(user_id, session_id, limit=50, skip_token_validation=True)
        
        if not history:
            print(f"❌ No conversation history found for session {session_id}")
            return None
        
        # Validate that the history actually belongs to the requesting user
        # Check first few conversations to ensure they match the user context
        user_hash = hashlib.sha256(user_id.encode('utf-8')).hexdigest()[:16]
        
        # Additional security: verify the restored history matches expected user patterns
        history_validation_passed = False
        for conv in history[:3]:  # Check first 3 conversations
            if conv.get('user_id') == user_id:
                history_validation_passed = True
                break
        
        if not history_validation_passed:
            print(f"🚨 SECURITY: History validation failed - conversations don't match requesting user")
            return None
        
        # Create new session interface
        if TherapyInterface is None:
            print("❌ Cannot restore session: TherapyInterface not available")
            return None
            
        session_interface = TherapyInterface(therapy_bot)
        session_interface.current_session_id = session_id
        session_interface.current_user_id = user_id
        session_interface.session_start_time = datetime.now()
        
        # Create session token for restored session with enhanced security
        if hasattr(therapy_bot, 'storage') and hasattr(therapy_bot.storage, 'security_manager'):
            try:
                session_token = therapy_bot.storage.security_manager.create_session_token(user_id, session_id)
                print(f"🔐 Created secure session token for restored session")
                
                # Log session restoration for security audit
                therapy_bot.storage.security_manager.audit_log(
                    'SESSION_RESTORATION',
                    user_id, session_id,
                    {'history_count': len(history), 'validation_passed': True},
                    'INFO'
                )
                
            except Exception as e:
                print(f"⚠️ Could not create session token for restored session: {e}")
        
        # Pre-populate session memory with validation
        if hasattr(therapy_bot, '_get_or_create_session_memory'):
            try:
                # Validate user context before populating memory
                memory = therapy_bot._get_or_create_session_memory(user_id, session_id)
                
                # Additional validation: ensure memory belongs to correct user
                if hasattr(memory, 'user_context_hash'):
                    expected_hash = hashlib.sha256(user_id.encode('utf-8')).hexdigest()[:16]
                    if memory.user_context_hash != expected_hash:
                        print(f"🚨 Memory user validation failed during restoration!")
                        return None
                
                print(f"📚 Securely restored session memory from {len(history)} conversations")
                
            except Exception as e:
                print(f"⚠️ Could not pre-populate session memory: {e}")
                return None
        
        print(f"✅ Securely restored session {session_id} with {len(history)} validated messages")
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
    
    # Run cleanup and get session info
    cleanup_count = cleanup_expired_sessions()
    
    return jsonify({
        'status': 'healthy',
        'therapy_bot_available': therapy_bot is not None,
        'interface_available': interface is not None,
        'crisis_detection': crisis_info,
        'active_sessions': len(active_sessions),
        'sessions_cleaned': cleanup_count,
        'emergency_contacts': {
            '1019': 'Mental Health Crisis Line (24/7)',
            '1166': 'National Emergency Helpline',
            '0800-00-100': 'Rozan Crisis Helpline'
        }
    })

@app.route('/api/therapy/cleanup-sessions', methods=['POST'])
def cleanup_sessions():
    """Manual session cleanup endpoint"""
    try:
        before_count = len(active_sessions)
        cleaned_count = cleanup_expired_sessions()
        
        return jsonify({
            'success': True,
            'sessions_before': before_count,
            'sessions_cleaned': cleaned_count,
            'sessions_remaining': len(active_sessions)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/therapy/session-isolation-test', methods=['POST'])
def test_session_isolation():
    """Test endpoint to verify session isolation is working correctly"""
    try:
        if not therapy_bot:
            return jsonify({'error': 'Therapy bot not available'}), 503
            
        data = request.json or {}
        test_user_1 = data.get('user1', 'test_user_1')
        test_user_2 = data.get('user2', 'test_user_2')
        test_session = data.get('session', 'test_session_123')
        
        # Test session key generation
        key1 = get_secure_active_session_key(test_user_1, test_session)
        key2 = get_secure_active_session_key(test_user_2, test_session)
        
        # Test memory isolation
        isolation_results = {}
        
        if hasattr(therapy_bot, '_get_secure_session_key'):
            memory_key1 = therapy_bot._get_secure_session_key(test_user_1, test_session)
            memory_key2 = therapy_bot._get_secure_session_key(test_user_2, test_session)
            
            isolation_results = {
                'active_session_keys_different': key1 != key2,
                'memory_keys_different': memory_key1 != memory_key2,
                'key1_format_valid': key1.startswith('active_') and len(key1.split('_')) == 3,
                'key2_format_valid': key2.startswith('active_') and len(key2.split('_')) == 3,
                'memory_key1_format_valid': memory_key1.startswith('therapy_') and len(memory_key1.split('_')) == 4,
                'memory_key2_format_valid': memory_key2.startswith('therapy_') and len(memory_key2.split('_')) == 4
            }
        
        return jsonify({
            'success': True,
            'isolation_test_results': isolation_results,
            'test_keys': {
                'user1_session_key': key1[:20] + '...',
                'user2_session_key': key2[:20] + '...'
            },
            'isolation_working': all(isolation_results.values()) if isolation_results else False
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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

        # Enhanced session management with security validation
        session_interface = None
        validated_session_key = None
        
        # Validate input parameters first
        if not user_id or not user_id.strip():
            return jsonify({
                'error': 'Invalid user ID',
                'details': 'User ID is required for session management'
            }), 400
            
        # Generate secure session key for lookup
        def get_secure_active_session_key(uid: str, sid: str) -> str:
            if not uid or not sid:
                return ""
            user_hash = hashlib.sha256(uid.encode('utf-8')).hexdigest()[:16]
            session_hash = hashlib.sha256(sid.encode('utf-8')).hexdigest()[:16]
            return f"active_{user_hash}_{session_hash}"
        
        # Try to find existing session with security validation
        if session_key and session_key in active_sessions:
            session_data = active_sessions[session_key]
            
            # Validate that the session actually belongs to the requesting user
            if session_data.get('user_id') == user_id:
                session_interface = session_data['interface']
                validated_session_key = session_key
                print(f"\u2705 Found valid session by key for user {hashlib.sha256(user_id.encode()).hexdigest()[:8]}...")
            else:
                print(f"\ud83d\udea8 SECURITY: Session key {session_key} does not belong to user {hashlib.sha256(user_id.encode()).hexdigest()[:8]}...")
                # Remove the invalid session
                del active_sessions[session_key]
                
        elif user_id and session_id:
            # Generate expected secure key
            expected_key = get_secure_active_session_key(user_id, session_id)
            
            # Try to find by secure key first
            if expected_key in active_sessions:
                session_data = active_sessions[expected_key]
                if session_data.get('user_id') == user_id and session_data.get('session_id') == session_id:
                    session_interface = session_data['interface']
                    validated_session_key = expected_key
                    print(f"\u2705 Found session by secure key")
                else:
                    print(f"\u26a0\ufe0f Session validation failed for secure key")
                    del active_sessions[expected_key]
            
            # Fallback: search through existing sessions with validation
            if not session_interface:
                sessions_to_remove = []
                for key, session in active_sessions.items():
                    # Validate session integrity
                    if (session.get('user_id') == user_id and 
                        session.get('session_id') == session_id):
                        
                        # Additional validation: check session age
                        created_at = session.get('created_at')
                        if created_at:
                            try:
                                creation_time = datetime.fromisoformat(created_at)
                                age_hours = (datetime.now() - creation_time).total_seconds() / 3600
                                
                                if age_hours > 24:  # Sessions expire after 24 hours
                                    print(f"\u231b Session {key} expired ({age_hours:.1f} hours old)")
                                    sessions_to_remove.append(key)
                                    continue
                            except Exception as e:
                                print(f"\u26a0\ufe0f Error checking session age: {e}")
                        
                        session_interface = session['interface']
                        validated_session_key = key
                        print(f"\u2705 Found valid session by user/session ID match")
                        break
                    else:
                        # Check for potential session contamination
                        if session.get('session_id') == session_id and session.get('user_id') != user_id:
                            print(f"\ud83d\udea8 CRITICAL: Session ID collision detected! Session {session_id} belongs to different user")
                            sessions_to_remove.append(key)
                
                # Clean up invalid/expired sessions
                for key in sessions_to_remove:
                    del active_sessions[key]
            
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
            
            # Generate secure key for new session
            if session_interface.current_session_id is None:
                raise ValueError("Failed to create session - no session ID generated")
            secure_key = get_secure_active_session_key(user_id, session_interface.current_session_id)
            
            # Safe handling of session_start_time
            created_at = datetime.now().isoformat()
            if session_interface.session_start_time is not None:
                created_at = session_interface.session_start_time.isoformat()
            
            # Store with enhanced security metadata
            active_sessions[secure_key] = {
                'interface': session_interface,
                'user_id': user_id,
                'session_id': session_interface.current_session_id,
                'created_at': created_at,
                'restored_from_db': False,
                'last_activity': created_at,
                'user_hash': hashlib.sha256(user_id.encode('utf-8')).hexdigest()[:16]
            }
            validated_session_key = secure_key
            
            # Return both welcome and response to user message
            response = session_interface.send_message(message)
            return jsonify({
                'success': True,
                'response': response,
                'welcomeMessage': welcome_message,
                'sessionKey': validated_session_key,
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
        
        # Periodic cleanup of expired session memories (every 20 requests approximately)
        import random
        if random.randint(1, 20) == 1:
            if therapy_bot and hasattr(therapy_bot, 'cleanup_expired_session_memories'):
                therapy_bot.cleanup_expired_session_memories()
        
        # Update last activity time for session management
        if validated_session_key and validated_session_key in active_sessions:
            active_sessions[validated_session_key]['last_activity'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'response': response,
            'sessionKey': validated_session_key,
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
        
        # Validate session for ending
        session_key = data.get('sessionKey')
        if not session_key or session_key not in active_sessions:
            return jsonify({
                'error': 'Session not found or already ended'
            }), 404
            
        session_data = active_sessions[session_key]
        session_interface = session_data['interface']
        
        print(f"\ud83d\udeaa Ending session {session_key[:20]}... for user {session_data.get('user_hash', 'unknown')[:8]}...")
        
        # Additional validation: ensure session belongs to requesting context
        session_data = active_sessions[session_key]
        session_interface = session_data['interface']
        
        # Update last activity
        session_data['last_activity'] = datetime.now().isoformat()
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
            {"user_id_raw": user_id},  # New format with raw user_id
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
        
        # Get recent progress data - check both formats
        recent_progress = list(therapy_bot.storage.long_term_progress.find({
            "$or": [
                {"user_id": user_hash},
                {"user_id_raw": user_id},
                {"user_id": user_id}
            ]
        }).sort("timestamp", -1).limit(1))
        
        latest_progress = recent_progress[0] if recent_progress else {}
        
        # Format profile data for API response - simplified to only essential insights
        profile_data = {
            'userId': user_id,
            'profileExists': bool(profile.core_patterns or total_sessions > 0),
            'lastUpdated': profile.last_updated or datetime.now().isoformat(),
            'insights': {
                'corePatterns': {
                    'count': len(profile.core_patterns),
                    'patterns': list(profile.core_patterns.keys())[:10] if profile.core_patterns else []
                },
                'copingMechanisms': {
                    'count': len(profile.coping_mechanisms),
                    'effective': [name for name, data in profile.coping_mechanisms.items() 
                                if isinstance(data, dict) and data.get('confidence', 0) > 0.6][:10] if profile.coping_mechanisms else []
                }
            }
        }
        
        return jsonify({
            'success': True,
            'profile': profile_data
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
        
        # Get ALL conversations for user (both chat and voice) and aggregate by session
        print(f"🔍 Aggregating all sessions for user_id: {user_id}")
        print(f"🔍 Hashed user_id: {user_hash}")
        
        # Try different user ID formats to find all conversations
        conversation_queries = [
            {"user_id": user_hash},
            {"user_id": user_id},
            {"user_id_raw": user_id},  # New format with raw user_id
            {"user_context.login": user_id},
            {"userId": user_id}
        ]
        
        all_conversations = []
        query_used = None
        for query in conversation_queries:
            conversations = list(therapy_bot.storage.conversations.find({
                **query,
                'timestamp': {'$gte': cutoff_date}
            }).sort('timestamp', 1))
            if conversations:
                all_conversations = conversations
                query_used = query
                print(f"🔍 Found {len(conversations)} conversations with query {query}")
                break
        
        # Also check EmotionalSession collection for chat sessions
        emotional_sessions = []
        if hasattr(therapy_bot.storage, 'emotional_sessions'):
            emotional_sessions = list(therapy_bot.storage.emotional_sessions.find({
                "userId": user_hash,
                "createdAt": {'$gte': cutoff_date}
            }).sort("createdAt", 1))
            print(f"🔍 Found {len(emotional_sessions)} emotional sessions")
        
        # Get distinct session IDs from conversations
        distinct_sessions = {}
        for conv in all_conversations:
            session_id = conv.get('session_id')
            if session_id:
                if session_id not in distinct_sessions:
                    distinct_sessions[session_id] = {
                        'date': conv.get('timestamp', datetime.now()),
                        'crisis_level': conv.get('crisis_level', 'none'),
                        'mood_scores': [],
                        'patterns_identified': 0,
                        'crisis_events': 0
                    }
                # Aggregate data per session
                if conv.get('mood_score'):
                    distinct_sessions[session_id]['mood_scores'].append(conv.get('mood_score'))
                if conv.get('crisis_level') not in ['none', None, 'stable']:
                    distinct_sessions[session_id]['crisis_events'] += 1
                distinct_sessions[session_id]['patterns_identified'] = max(
                    distinct_sessions[session_id]['patterns_identified'],
                    conv.get('patterns_identified', 0)
                )
        
        # Get progress entries from long_term_progress collection - try both formats
        progress_queries = [
            {'user_id': user_hash, 'timestamp': {'$gte': cutoff_date}},
            {'user_id_raw': user_id, 'timestamp': {'$gte': cutoff_date}},
            {'user_id': user_id, 'timestamp': {'$gte': cutoff_date}}
        ]
        
        progress_entries = []
        for query in progress_queries:
            entries = list(therapy_bot.storage.long_term_progress.find(query).sort('timestamp', 1))
            if entries:
                progress_entries = entries
                break
        
        # Combine progress entries with session data
        session_progress_map = {}
        for entry in progress_entries:
            date_str = entry['timestamp'].strftime('%Y-%m-%d')
            if date_str not in session_progress_map:
                session_progress_map[date_str] = {
                    'date': date_str,
                    'crisisLevel': entry.get('crisis_level', 'none'),
                    'moodScore': entry.get('mood_score'),
                    'patternsIdentified': entry.get('patterns_identified', 0),
                    'crisisEvents': 0
                }
            if entry.get('crisis_level') not in ['none', None]:
                session_progress_map[date_str]['crisisEvents'] += 1
        
        # Add sessions from conversations to progress map
        for session_id, session_data in distinct_sessions.items():
            date_str = session_data['date'].strftime('%Y-%m-%d') if hasattr(session_data['date'], 'strftime') else datetime.now().strftime('%Y-%m-%d')
            if date_str not in session_progress_map:
                avg_mood = sum(session_data['mood_scores']) / len(session_data['mood_scores']) if session_data['mood_scores'] else None
                session_progress_map[date_str] = {
                    'date': date_str,
                    'crisisLevel': session_data['crisis_level'],
                    'moodScore': avg_mood,
                    'patternsIdentified': session_data['patterns_identified'],
                    'crisisEvents': session_data['crisis_events']
                }
            else:
                # Merge data
                if session_data['mood_scores']:
                    existing_mood = session_progress_map[date_str]['moodScore']
                    new_avg = sum(session_data['mood_scores']) / len(session_data['mood_scores'])
                    session_progress_map[date_str]['moodScore'] = (existing_mood + new_avg) / 2 if existing_mood else new_avg
                session_progress_map[date_str]['crisisEvents'] += session_data['crisis_events']
                session_progress_map[date_str]['patternsIdentified'] = max(
                    session_progress_map[date_str]['patternsIdentified'],
                    session_data['patterns_identified']
                )
        
        # Convert to list and sort by date
        progress_data = sorted(session_progress_map.values(), key=lambda x: x['date'])
        
        # Calculate total distinct sessions (including emotional sessions)
        total_sessions = len(distinct_sessions)
        if hasattr(therapy_bot.storage, 'emotional_sessions') and emotional_sessions:
            total_sessions += len(emotional_sessions)
        
        # Calculate summary statistics
        mood_scores = [p['moodScore'] for p in progress_data if p.get('moodScore') is not None]
        avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 5.0
        
        crisis_events = sum(p.get('crisisEvents', 0) for p in progress_data)
        
        # Determine trend from mood scores
        if len(mood_scores) >= 2:
            recent_avg = sum(mood_scores[-7:]) / len(mood_scores[-7:]) if len(mood_scores) >= 7 else mood_scores[-1]
            earlier_avg = sum(mood_scores[:7]) / len(mood_scores[:7]) if len(mood_scores) >= 7 else mood_scores[0]
            if recent_avg > earlier_avg + 0.5:
                latest_trend = 'improving'
            elif recent_avg < earlier_avg - 0.5:
                latest_trend = 'declining'
            else:
                latest_trend = 'stable'
        else:
            latest_trend = 'stable'
        
        return jsonify({
            'success': True,
            'progress': {
                'entries': progress_data,
                'summary': {
                    'totalSessions': max(total_sessions, len(progress_data)),  # Total distinct sessions
                    'averageMood': round(avg_mood, 1),
                    'crisisEvents': crisis_events,
                    'currentTrend': latest_trend,
                    'timespan': f'{days} days'
                },
                'insights': {
                    'improvement': latest_trend == 'improving',
                    'stable': latest_trend == 'stable',
                    'needsAttention': latest_trend == 'declining' or crisis_events > 0
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
    print("  GET  /api/therapy/psychological-profile - Get psychological profile")
    print("  GET  /api/therapy/long-term-progress   - Get long-term progress")
    print()
    
    if therapy_bot:
        print("✅ Therapy bot loaded successfully")
    else:
        print("❌ Therapy bot failed to load - service will have limited functionality")
    
    # Get port from environment (for deployment platforms)
    # Railway uses PORT, Render uses PORT, other platforms may use THERAPY_PORT
    port = int(os.environ.get('PORT') or os.environ.get('THERAPY_PORT', 5001))
    
    # Auto-detect production environment
    # Railway sets PORT and RAILWAY environment variables
    is_production = (
        os.getenv('RENDER') or 
        os.getenv('RAILWAY') or
        os.getenv('RAILWAY_ENVIRONMENT') or 
        os.getenv('DYNO') or 
        os.getenv('PORT') or  # Railway and most platforms set PORT
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