import sys
import os
import json
from typing import Dict, Any, Optional
import traceback
from datetime import datetime

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
    from emotional_therapy import therapy_bot, interface, TherapyInterface, CrisisLevel
    print("✅ Successfully imported therapy components")
    
    # Type checking for imported components
    if therapy_bot is None:
        print("⚠️ therapy_bot is None - limited functionality")
    if TherapyInterface is None:
        print("⚠️ TherapyInterface is None - cannot create sessions")
    if CrisisLevel is None:
        print("⚠️ CrisisLevel is None - crisis detection unavailable")
        
except ImportError as e:
    print(f"❌ Error importing therapy components: {e}")
    therapy_bot = None
    interface = None
    TherapyInterface = None
    CrisisLevel = None

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

def restore_session_from_mongodb(user_id: str, session_id: str):
    """Restore session context from MongoDB EmotionalSession collection"""
    try:
        # Access therapy bot's storage
        if not therapy_bot or not hasattr(therapy_bot, 'storage'):
            print("❌ Cannot restore session: therapy bot or storage not available")
            return None
        
        storage = therapy_bot.storage
        
        # Get conversation history for this session
        history = storage.get_conversation_history(user_id, session_id, limit=50)
        
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
        
        print(f"✅ Restored session {session_id} with {len(history)} messages")
        return session_interface
        
    except Exception as e:
        print(f"❌ Error restoring session from MongoDB: {e}")
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
        
        # Check if response indicates crisis level
        crisis_level = session_interface.last_crisis_level
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
            'POST /api/therapy/crisis-detection/config'
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
    
    #  Add production server option
    use_production = os.getenv('THERAPY_PRODUCTION', 'false').lower() == 'true'
    
    if use_production:
        try:
            from waitress import serve
            print("🚀 Starting with Waitress production server...")
            print("🌟 Server running on http://localhost:5001")
            print("🔗 Frontend can now connect to this service")
            print("💡 Press Ctrl+C to stop the service")
            print("=" * 60)
            
            serve(app, host='0.0.0.0', port=5001, threads=6)
            
        except ImportError:
            print("⚠️ Waitress not installed. Install with: pip install waitress")
            print("🔄 Falling back to Flask development server...")
            use_production = False
    
    if not use_production:
        print("⚠️ Using Flask development server (not for production)")
        print("🌟 Starting Flask server on http://localhost:5001")
        print("🔗 Frontend can now connect to this service")
        print("💡 Press Ctrl+C to stop the service")
        print("=" * 60)
        
        try:
            # Run Flask app -  Better configuration
            app.run(
                host='0.0.0.0',
                port=5001,
                debug=False,  # Disabled to prevent auto-restarts and improve performance
                threaded=True,
                use_reloader=False  # Explicitly disable the reloader
            )
        except KeyboardInterrupt:
            print("\n🛑 Service stopped by user")
            print("👋 Thank you for using the Emotional Therapy Service!")
        except Exception as e:
            print(f"\n❌ Service error: {e}")
            print("💡 Check the error messages above for troubleshooting")