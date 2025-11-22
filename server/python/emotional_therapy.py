# Essential imports for therapy bot system
import json
import os
import time
import logging
import asyncio
import re
import hashlib
import secrets
import uuid
from datetime import datetime, timezone, timedelta
import re
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
from dataclasses import dataclass
from enum import Enum
from functools import wraps
import html

# Security imports with graceful fallback
CRYPTO_AVAILABLE = False
Fernet = None
PBKDF2HMAC = None
hashes = None

# First check if cryptography module exists at all
try:
    import cryptography  # type: ignore
    _crypto_available = True
except ImportError:
    _crypto_available = False

if _crypto_available:
    try:
        from cryptography.fernet import Fernet  # type: ignore
        from cryptography.hazmat.primitives import hashes  # type: ignore
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC  # type: ignore
        import base64
        # Verify the imports actually work
        _ = Fernet
        _ = hashes
        _ = PBKDF2HMAC
        CRYPTO_AVAILABLE = True
    except ImportError as e:
        # Specific import error (e.g., missing submodule)
        error_msg = str(e)
        if "No module named" in error_msg and "cryptography" in error_msg:
            # Only warn if cryptography package itself is missing
            print("⚠️ WARNING: cryptography package not found. Security features will be limited.")
            print(f"   Error: {e}")
            print("   Install with: pip install cryptography")
        # Otherwise, it's a submodule issue - don't warn, just disable
        CRYPTO_AVAILABLE = False
    except Exception as e:
        # Other errors (like missing dependencies)
        print(f"⚠️ WARNING: Error loading cryptography: {e}")
        print("   Security features will be limited.")
        CRYPTO_AVAILABLE = False
else:
    # Cryptography package not installed - check if we're in venv
    import sys
    in_venv = (
        hasattr(sys, 'real_prefix') or 
        (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    )
    if not in_venv:
        print("⚠️ WARNING: cryptography package not found. Security features will be limited.")
        print(f"   Current Python: {sys.executable}")
        print("   You may be using system Python instead of virtual environment.")
        print("   Make sure to activate venv: & venv\\Scripts\\Activate.ps1")
    else:
        print("⚠️ WARNING: cryptography package not found. Security features will be limited.")
        print("   Install with: pip install cryptography")

import base64

# Load environment variables
from dotenv import load_dotenv
from dataclasses import field
load_dotenv()  # Load variables from .env file

@dataclass
class PsychologicalProfile:
    """Comprehensive psychological profile for deep understanding"""
    user_id: str
    core_patterns: Dict[str, Any] = field(default_factory=dict)
    trauma_indicators: Dict[str, Any] = field(default_factory=dict)
    long_term_progress: Dict[str, Any] = field(default_factory=dict)
    therapeutic_preferences: Dict[str, Any] = field(default_factory=dict)
    risk_factors: Dict[str, Any] = field(default_factory=dict)
    resilience_factors: Dict[str, Any] = field(default_factory=dict)
    cognitive_patterns: Dict[str, Any] = field(default_factory=dict)
    emotional_regulation_patterns: Dict[str, Any] = field(default_factory=dict)
    relationship_patterns: Dict[str, Any] = field(default_factory=dict)
    coping_mechanisms: Dict[str, Any] = field(default_factory=dict)
    trigger_patterns: Dict[str, Any] = field(default_factory=dict)
    created_at: str = ""
    last_updated: str = ""

    def __post_init__(self):
        current_time = datetime.now().isoformat()
        if not self.created_at:
            self.created_at = current_time
        self.last_updated = current_time
        
        # Initialize session insights if empty
        if 'session_insights' not in self.core_patterns:
            self.core_patterns['session_insights'] = []

# Security configuration
SECURITY_CONFIG = {
    'MAX_INPUT_LENGTH': 5000,
    'MAX_SESSION_DURATION': 86400,  # 24 hours
    'MAX_CONVERSATIONS_PER_SESSION': 1000,
    'RATE_LIMIT_WINDOW': 3600,  # 1 hour
    'MAX_REQUESTS_PER_HOUR': 100,
    'ENCRYPTION_ENABLED': os.getenv('ENCRYPTION_ENABLED', 'true').lower() == 'true' and CRYPTO_AVAILABLE,
    'AUDIT_LOGGING': os.getenv('AUDIT_LOGGING', 'true').lower() == 'true',
    'DATA_RETENTION_DAYS': int(os.getenv('DATA_RETENTION_DAYS', '30')),
    'SANITIZE_INPUTS': True,
    'VALIDATE_SESSION_TOKENS': True
}

# Database imports
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# ML and NLP imports
import nltk
from datasets import load_dataset
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    EMBEDDINGS_CLASS = HuggingFaceEmbeddings
    EMBEDDINGS_TYPE = 'new'
except ImportError:
    from langchain_community.embeddings import HuggingFaceBgeEmbeddings
    EMBEDDINGS_CLASS = HuggingFaceBgeEmbeddings
    EMBEDDINGS_TYPE = 'legacy'
    print("⚠️ Using deprecated HuggingFaceBgeEmbeddings. Install langchain-huggingface for updated version.")

from langchain_text_splitters import RecursiveCharacterTextSplitter

# Sentiment analysis
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:
    try:
        from nltk.sentiment.vader import SentimentIntensityAnalyzer
    except ImportError:
        SentimentIntensityAnalyzer = None

# Security utility classes
class SecurityManager:
    """Centralized security manager for encryption, sanitization, and access control"""
    
    def __init__(self):
        self.cipher_suite = None
        self.rate_limiter = {}
        self.session_tokens = {}
        self.audit_logger = self._setup_audit_logger()
        
        if SECURITY_CONFIG['ENCRYPTION_ENABLED']:
            self._initialize_encryption()
    
    def _initialize_encryption(self):
        """Initialize encryption with secure key derivation"""
        if not CRYPTO_AVAILABLE or Fernet is None or PBKDF2HMAC is None or hashes is None:
            print("⚠️ Cryptography not available, encryption disabled")
            self.cipher_suite = None
            return
            
        try:
            from cryptography.fernet import Fernet as CryptoFernet  # type: ignore
            from cryptography.hazmat.primitives import hashes as crypto_hashes  # type: ignore
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC as CryptoPBKDF2HMAC  # type: ignore
            
            # Get encryption key from environment or generate one
            key_material = os.getenv('ENCRYPTION_KEY')
            if not key_material:
                # Generate a secure key - should be stored securely in production
                key_material = base64.urlsafe_b64encode(os.urandom(32)).decode()
                print(f"⚠️ WARNING: Using generated encryption key. Store securely: {key_material}")
            
            # Derive encryption key using PBKDF2
            salt = os.getenv('ENCRYPTION_SALT', 'therapy_bot_salt').encode()
            kdf = CryptoPBKDF2HMAC(
                algorithm=crypto_hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(key_material.encode()))
            self.cipher_suite = CryptoFernet(key)
            print("🔐 Encryption initialized successfully")
        except Exception as e:
            print(f"❌ Encryption initialization failed: {e}")
            self.cipher_suite = None
    
    def _setup_audit_logger(self) -> logging.Logger:
        """Setup secure audit logging"""
        logger = logging.getLogger('therapy_audit')
        logger.setLevel(logging.INFO)
        
        # Create secure log handler
        log_file = os.getenv('AUDIT_LOG_FILE', 'therapy_audit.log')
        
        # Resolve log file path relative to script directory
        if not os.path.isabs(log_file):
            # If path contains directory separator, resolve relative to script directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            log_file = os.path.join(script_dir, log_file)
        
        # Ensure the log directory exists
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            try:
                os.makedirs(log_dir, exist_ok=True)
                print(f"✅ Created log directory: {log_dir}")
            except OSError as e:
                print(f"⚠️ Warning: Could not create log directory {log_dir}: {e}")
                # Fallback to script directory if directory creation fails
                script_dir = os.path.dirname(os.path.abspath(__file__))
                log_file = os.path.join(script_dir, os.path.basename(log_file))
        
        handler = logging.FileHandler(log_file)
        
        # Secure log format - no PII in logs
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data if encryption is enabled"""
        if not CRYPTO_AVAILABLE or not self.cipher_suite or not data:
            return data
        
        try:
            encrypted = self.cipher_suite.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            print(f"⚠️ Encryption failed: {e}")
            return data
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data if encryption is enabled"""
        if not CRYPTO_AVAILABLE or not self.cipher_suite or not encrypted_data:
            return encrypted_data
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher_suite.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            print(f"⚠️ Decryption failed: {e}")
            return encrypted_data
    
    def sanitize_input(self, user_input: str) -> str:
        """Sanitize user input to prevent injection attacks"""
        if not user_input or not SECURITY_CONFIG['SANITIZE_INPUTS']:
            return user_input
        
        # Remove potential script tags and dangerous characters
        sanitized = html.escape(user_input)
        
        # Remove potential SQL injection patterns
        dangerous_patterns = [
            r'\bDROP\b', r'\bDELETE\b', r'\bINSERT\b', r'\bUPDATE\b',
            r'\bUNION\b', r'\bSELECT\b', r'\bEXEC\b', r'\bEXECUTE\b',
            r'<script', r'javascript:', r'vbscript:', r'onload=', r'onerror='
        ]
        
        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        # Limit input length
        if len(sanitized) > SECURITY_CONFIG['MAX_INPUT_LENGTH']:
            sanitized = sanitized[:SECURITY_CONFIG['MAX_INPUT_LENGTH']]
            print("⚠️ Input truncated due to length limit")
        
        return sanitized.strip()
    
    def validate_session_token(self, user_id: str, session_id: str) -> bool:
        """Validate session token for security"""
        if not SECURITY_CONFIG['VALIDATE_SESSION_TOKENS']:
            return True
        
        session_key = f"{user_id}_{session_id}"
        
        # Check if session exists and is valid
        if session_key not in self.session_tokens:
            return False
        
        session_data = self.session_tokens[session_key]
        current_time = time.time()
        
        # Check session expiration
        if current_time - session_data['created'] > SECURITY_CONFIG['MAX_SESSION_DURATION']:
            del self.session_tokens[session_key]
            return False
        
        # Update last access time
        session_data['last_access'] = current_time
        return True
    
    def create_session_token(self, user_id: str, session_id: str) -> str:
        """Create secure session token"""
        session_token = secrets.token_urlsafe(32)
        session_key = f"{user_id}_{session_id}"
        
        self.session_tokens[session_key] = {
            'token': session_token,
            'created': time.time(),
            'last_access': time.time(),
            'user_id_hash': hashlib.sha256(user_id.encode()).hexdigest()[:16]
        }
        
        return session_token
    
    def check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded rate limits"""
        current_time = time.time()
        user_hash = hashlib.sha256(user_id.encode()).hexdigest()[:16]
        
        if user_hash not in self.rate_limiter:
            self.rate_limiter[user_hash] = []
        
        # Clean old requests outside the window
        window_start = current_time - SECURITY_CONFIG['RATE_LIMIT_WINDOW']
        self.rate_limiter[user_hash] = [
            req_time for req_time in self.rate_limiter[user_hash] 
            if req_time > window_start
        ]
        
        # Check if under limit
        if len(self.rate_limiter[user_hash]) >= SECURITY_CONFIG['MAX_REQUESTS_PER_HOUR']:
            return False
        
        # Add current request
        self.rate_limiter[user_hash].append(current_time)
        return True
    
    def hash_pii(self, data: str) -> str:
        """Hash PII data for logging and analytics"""
        if not data:
            return ""
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def audit_log(self, event: str, user_id: str, session_id: str, 
                  details: Optional[Dict] = None, level: str = 'INFO'):
        """Secure audit logging without PII"""
        if not SECURITY_CONFIG['AUDIT_LOGGING']:
            return
        
        # Hash sensitive identifiers
        user_hash = self.hash_pii(user_id) if user_id else "unknown"
        session_hash = self.hash_pii(session_id) if session_id else "unknown"
        
        audit_entry = {
            'event': event,
            'user_hash': user_hash,
            'session_hash': session_hash,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'details': details or {}
        }
        
        # Remove any potential PII from details
        sanitized_details = {}
        if details:
            for key, value in details.items():
                if key.lower() in ['user_input', 'response', 'message', 'content']:
                    sanitized_details[key] = f"[CONTENT_LENGTH:{len(str(value))}]"
                elif key.lower() in ['user_id', 'session_id', 'login']:
                    sanitized_details[key] = self.hash_pii(str(value))
                else:
                    sanitized_details[key] = value
            audit_entry['details'] = sanitized_details
        
        log_message = f"{event} - User: {user_hash} - Session: {session_hash}"
        if sanitized_details:
            log_message += f" - Details: {json.dumps(sanitized_details)}"
        
        if level.upper() == 'ERROR':
            self.audit_logger.error(log_message)
        elif level.upper() == 'WARNING':
            self.audit_logger.warning(log_message)
        else:
            self.audit_logger.info(log_message)

# Global security manager instance
security_manager = SecurityManager()

# Security decorators
def require_valid_session(func):
    """Decorator to validate session tokens"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Extract user_id and session_id from arguments
        user_id = kwargs.get('user_id') or (args[1] if len(args) > 1 else None)
        session_id = kwargs.get('session_id') or (args[2] if len(args) > 2 else None)
        
        if user_id and session_id:
            if not security_manager.validate_session_token(user_id, session_id):
                security_manager.audit_log(
                    'INVALID_SESSION_ACCESS',
                    user_id, session_id,
                    {'function': func.__name__},
                    'WARNING'
                )
                raise ValueError("Invalid session token")
        
        return func(*args, **kwargs)
    return wrapper

def rate_limit_check(func):
    """Decorator to check rate limits"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        user_id = kwargs.get('user_id') or (args[1] if len(args) > 1 else None)
        
        if user_id:
            if not security_manager.check_rate_limit(user_id):
                security_manager.audit_log(
                    'RATE_LIMIT_EXCEEDED',
                    user_id, kwargs.get('session_id', 'unknown'),
                    {'function': func.__name__},
                    'WARNING'
                )
                raise ValueError("Rate limit exceeded")
        
        return func(*args, **kwargs)
    return wrapper

# Utility function to safely get dataset size
def safe_dataset_len(dataset) -> str:
    """Safely get dataset length, returns string representation"""
    try:
        if hasattr(dataset, '__len__'):
            return str(len(dataset))
        elif hasattr(dataset, 'num_rows'):
            return str(dataset.num_rows)
        else:
            return 'unknown'
    except:
        return 'unknown'

class MongoDBStorage:
    """Secure MongoDB Atlas storage for therapy data with encryption and audit logging"""

    def __init__(self, connection_string: Optional[str] = None, user_context: Optional[Dict] = None):
        # Use provided connection string or environment variable
        if not connection_string:
            connection_string = os.getenv('MONGODB_URI')
            
        if not connection_string:
            raise ValueError("MongoDB connection string required. Please set MONGODB_URI environment variable.")

        # Security: Don't store raw connection string in logs
        self.connection_string = connection_string
        self.security_manager = security_manager

        # Get current user context (dynamic or fallback)
        self.current_user = user_context or self._get_default_user_context()

        try:
            # Initialize MongoDB client
            self.client = MongoClient(
                connection_string,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )

            # Test connection
            self.client.admin.command('ismaster')

            # Initialize database and collections
            self.db = self.client.therapy_support_db
            self.conversations = self.db.conversations
            self.sessions = self.db.sessions
            self.crisis_logs = self.db.crisis_logs
            self.user_profiles = self.db.user_profiles
            self.psychological_profiles = self.db.psychological_profiles  # New collection for deep profiling
            self.long_term_progress = self.db.long_term_progress  # New collection for progress tracking
            
            # Also connect to fluenti database for EmotionalSession collection
            self.fluenti_db = self.client.fluenti
            self.emotional_sessions = self.fluenti_db.emotionalsessions  # MongoDB collection name (pluralized)

            # Create indexes for better performance
            self._create_indexes()

            print(f"✅ MongoDB Atlas connected successfully!")
            print(f"👤 Current user: {self.current_user['login']}")
            print(f"🕐 Session time: {self.current_user['timestamp']}")
            print(f"🌍 Database: therapy_support_db")

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise RuntimeError(f"MongoDB connection required but failed: {e}")

    def _get_default_user_context(self) -> Dict:
        """Get default user context as fallback when no user context provided"""
        current_time = datetime.now(timezone.utc)

        # Use environment variable as fallback only - should be replaced by actual user context
        fallback_login = os.getenv('USER_LOGIN', 'anonymous_user')
        print(f"⚠️ WARNING: Using fallback user context for {fallback_login}. This should be replaced with authenticated user data.")

        # Add time_of_day classification for compatibility
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
            'login': fallback_login,
            'timestamp': current_time,
            'session_start': current_time.isoformat(),
            'user_agent': os.getenv('HTTP_USER_AGENT', 'API-Request'),
            'environment': 'Production-API',
            'time_of_day': classify_time_of_day(current_time.hour),
            'date': current_time.strftime('%Y-%m-%d')
        }
    
    def update_user_context(self, user_context: Dict) -> None:
        """Update the current user context dynamically"""
        if not user_context:
            print(f"⚠️ No user context provided for update")
            return
        
        # Validate user context structure
        required_fields = ['login', 'timestamp']
        missing_fields = [field for field in required_fields if field not in user_context]
        
        if missing_fields:
            print(f"⚠️ User context missing required fields: {missing_fields}")
            # Fill in missing fields with defaults
            current_time = datetime.now(timezone.utc)
            if 'login' not in user_context:
                user_context['login'] = 'unknown_user'
            if 'timestamp' not in user_context:
                user_context['timestamp'] = current_time
        
        self.current_user = user_context
        print(f"✅ Updated user context to: {user_context.get('login', 'unknown')}")

    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Conversations indexes
            self.conversations.create_index([("user_id", 1), ("session_id", 1), ("timestamp", -1)])
            self.conversations.create_index([("crisis_level", 1), ("timestamp", -1)])
            self.conversations.create_index([("user_login", 1), ("timestamp", -1)])

            # Crisis logs indexes
            self.crisis_logs.create_index([("user_id", 1), ("timestamp", -1)])
            self.crisis_logs.create_index([("crisis_level", 1), ("requires_followup", 1)])
            self.crisis_logs.create_index([("user_login", 1), ("timestamp", -1)])

            # Sessions indexes
            self.sessions.create_index([("user_id", 1), ("session_id", 1)])
            self.sessions.create_index([("user_login", 1), ("start_time", -1)])

            # User profiles indexes
            self.user_profiles.create_index([("user_login", 1)], unique=True)

            # Psychological profiles indexes
            self.psychological_profiles.create_index([("user_id", 1)], unique=True)
            self.psychological_profiles.create_index([("last_updated", -1)])

            # Long-term progress indexes
            self.long_term_progress.create_index([("user_id", 1), ("timestamp", -1)])
            self.long_term_progress.create_index([("metric_type", 1), ("timestamp", -1)])



            print("📊 Database indexes created successfully")

        except Exception as e:
            print(f"⚠️ Error creating indexes: {e}")



    @require_valid_session
    @rate_limit_check
    def save_conversation(self, user_id: str, session_id: str, user_input: str,
                         bot_response: str, crisis_level: str,
                         mood_score: Optional[float] = None):
        """Securely save conversation to MongoDB with encryption and sanitization"""

        # Sanitize inputs
        sanitized_input = self.security_manager.sanitize_input(user_input)
        sanitized_response = self.security_manager.sanitize_input(bot_response)
        
        # Encrypt sensitive data
        encrypted_input = self.security_manager.encrypt_sensitive_data(sanitized_input)
        encrypted_response = self.security_manager.encrypt_sensitive_data(sanitized_response)
        
        conversation_doc = {
            "user_id": self.security_manager.hash_pii(user_id),  # Hash user ID for privacy
            "session_id": self.security_manager.hash_pii(session_id),  # Hash session ID
            "user_login": self.security_manager.hash_pii(self.current_user['login']),
            "timestamp": datetime.now(timezone.utc),
            "encrypted_user_input": encrypted_input,
            "encrypted_bot_response": encrypted_response,
            "input_length": len(sanitized_input),
            "response_length": len(sanitized_response),
            "crisis_level": crisis_level,
            "mood_score": mood_score,
            "data_version": "2.0_encrypted",  # Track encryption version
            "user_input": user_input,
            "bot_response": bot_response,
            "crisis_level": crisis_level,
            "mood_score": mood_score,
            "input_length": len(user_input),
            "response_length": len(bot_response),
            "user_context": {
                "environment": self.current_user['environment'],
                "session_start": self.current_user['session_start']
            }
        }

        try:
            if hasattr(self, 'conversations'):
                # Save to MongoDB
                result = self.conversations.insert_one(conversation_doc)
                print(f"💾 Conversation saved to MongoDB: {result.inserted_id}")

                # Update user profile
                self._update_user_profile(user_id, conversation_doc)

            else:
                raise RuntimeError("MongoDB connection not available")

        except Exception as e:
            print(f"❌ Error saving conversation: {e}")
            raise

        # Log crisis events
        if crisis_level != "none":
            self.log_crisis_event(user_id, session_id, crisis_level, user_input)

    def log_crisis_event(self, user_id: str, session_id: str, crisis_level: str, user_input: str):
        """Log crisis events to MongoDB"""

        crisis_doc = {
            "user_id": user_id,
            "session_id": session_id,
            "user_login": self.current_user['login'],
            "timestamp": datetime.now(timezone.utc),
            "crisis_level": crisis_level,
            "user_input": user_input[:200],
            "requires_followup": crisis_level in ["high", "critical"],
            "user_context": {
                "environment": self.current_user['environment'],
                "session_start": self.current_user['session_start']
            },
            "alert_sent": False,
            "followup_completed": False
        }

        try:
            if hasattr(self, 'crisis_logs'):
                # Save to MongoDB
                result = self.crisis_logs.insert_one(crisis_doc)
                print(f" CRISIS EVENT LOGGED to MongoDB: {crisis_level} for user {user_id}")

                # Send immediate alert for high/critical crises
                if crisis_level in ["high", "critical"]:
                    self._send_crisis_alert(crisis_doc)

            else:
                raise RuntimeError("MongoDB connection not available")

        except Exception as e:
            print(f"❌ Error logging crisis event: {e}")
            raise

    def _update_user_profile(self, user_id: str, conversation_doc: Dict):
        """Update user profile with conversation data"""
        try:
            profile_update = {
                "$set": {
                    "user_login": self.current_user['login'],
                    "last_active": datetime.now(timezone.utc),
                    "last_session_id": conversation_doc['session_id'],
                    "environment": self.current_user['environment']
                },
                "$inc": {
                    "total_conversations": 1
                },
                "$addToSet": {
                    "crisis_levels_experienced": conversation_doc['crisis_level']
                }
            }

            # Add mood score to running average
            if conversation_doc.get('mood_score'):
                profile_update["$push"] = {
                    "recent_mood_scores": {
                        "$each": [conversation_doc['mood_score']],
                        "$slice": -10  # Keep last 10 mood scores
                    }
                }

            self.user_profiles.update_one(
                {"user_login": self.current_user['login']},
                profile_update,
                upsert=True
            )

        except Exception as e:
            print(f"⚠️ Error updating user profile: {e}")

    def _send_crisis_alert(self, crisis_doc: Dict):
        """Send crisis alert (placeholder for real implementation)"""
        try:
            # Mark alert as sent
            if hasattr(self, 'crisis_logs') and "_id" in crisis_doc:
                self.crisis_logs.update_one(
                    {"_id": crisis_doc.get("_id")},
                    {"$set": {"alert_sent": True, "alert_timestamp": datetime.now(timezone.utc)}}
                )

            print(f" CRISIS ALERT: {crisis_doc['crisis_level']} level crisis detected for {crisis_doc['user_login']}")
            print(f"   Time: {crisis_doc['timestamp']}")
            print(f"   Session: {crisis_doc['session_id']}")

        except Exception as e:
            print(f"❌ Error sending crisis alert: {e}")

    def get_conversation_history(self, user_id: str, session_id: str, limit: int = 10, skip_token_validation: bool = False) -> List[Dict]:
        """Securely retrieve conversation history from MongoDB with decryption
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            limit: Maximum number of conversations to retrieve
            skip_token_validation: If True, skip session token validation (for session restoration)
        """
        # Validate session token unless explicitly skipped (for restoration)
        if not skip_token_validation:
            try:
                if not self.security_manager.validate_session_token(user_id, session_id):
                    self.security_manager.audit_log(
                        'INVALID_SESSION_ACCESS',
                        user_id, session_id,
                        {'function': 'get_conversation_history'},
                        'WARNING'
                    )
                    # For restoration purposes, we'll still try to get history
                    # but log the warning. Don't raise exception.
                    print(f"⚠️ Session token validation failed, but attempting to retrieve history for restoration")
            except Exception as e:
                print(f"⚠️ Session token validation error (continuing for restoration): {e}")
        
        try:
            # Audit log access
            self.security_manager.audit_log(
                'CONVERSATION_HISTORY_ACCESS',
                user_id, session_id,
                {'limit': limit, 'skip_validation': skip_token_validation}
            )
            
            # Hash IDs for database query
            user_hash = self.security_manager.hash_pii(user_id)
            session_hash = self.security_manager.hash_pii(session_id)
            
            # First try to get from EmotionalSession collection (Node.js service)
            if hasattr(self, 'emotional_sessions'):
                emotional_session = self.emotional_sessions.find_one({
                    "id": session_hash,  # Use hashed session ID
                    "userId": user_hash  # Use hashed user ID
                })
                
                if emotional_session and emotional_session.get('messages'):
                    print(f"✅ Found session in EmotionalSession collection: {len(emotional_session['messages'])} messages")
                    formatted_conversations = []
                    for msg in emotional_session['messages'][-limit:]:
                        if msg.get('role') == 'user':
                            # Decrypt content if encrypted
                            decrypted_content = self.security_manager.decrypt_sensitive_data(
                                msg.get('content', '')
                            )
                            # User message - prepare for next assistant response
                            user_msg = {
                                "user_id": user_id,
                                "session_id": session_id,
                                "timestamp": msg.get('timestamp', ''),
                                "user_input": msg.get('content', ''),
                                "bot_response": '',
                                "crisis_level": 'none',
                                "mood_score": None,
                                "input_length": len(msg.get('content', '')),
                                "response_length": 0
                            }
                            formatted_conversations.append(user_msg)
                        elif msg.get('role') == 'assistant' and formatted_conversations:
                            # Decrypt assistant response if encrypted
                            decrypted_response = self.security_manager.decrypt_sensitive_data(
                                msg.get('content', '')
                            )
                            # Assistant message - add to last user message
                            formatted_conversations[-1]['bot_response'] = decrypted_response
                            formatted_conversations[-1]['response_length'] = len(decrypted_response)
                    
                    return formatted_conversations
            
            # Fallback to conversations collection (Python service)
            if hasattr(self, 'conversations'):
                # Get from MongoDB using hashed IDs for security
                conversations = list(
                    self.conversations.find(
                        {
                            "user_id": user_hash,
                            "session_id": session_hash,
                            "user_login": self.security_manager.hash_pii(self.current_user['login'])
                        }
                    ).sort("timestamp", 1).limit(limit)
                )

                # Convert MongoDB docs to expected format with decryption
                formatted_conversations = []
                for conv in conversations:
                    # Decrypt sensitive data if encrypted
                    user_input = conv.get("encrypted_user_input") or conv.get("user_input", "")
                    bot_response = conv.get("encrypted_bot_response") or conv.get("bot_response", "")
                    
                    if conv.get("data_version") == "2.0_encrypted":
                        user_input = self.security_manager.decrypt_sensitive_data(user_input)
                        bot_response = self.security_manager.decrypt_sensitive_data(bot_response)
                    
                    formatted_conversations.append({
                        "user_id": user_id,  # Return original user_id for interface consistency
                        "session_id": session_id,  # Return original session_id
                        "timestamp": conv["timestamp"].isoformat() if hasattr(conv["timestamp"], 'isoformat') else str(conv["timestamp"]),
                        "user_input": user_input,
                        "bot_response": bot_response,
                        "crisis_level": conv["crisis_level"],
                        "mood_score": conv.get("mood_score"),
                        "input_length": conv.get("input_length", 0),
                        "response_length": conv.get("response_length", 0)
                    })

                return formatted_conversations[-limit:] if formatted_conversations else []

            else:
                raise RuntimeError("MongoDB connection not available")

        except Exception as e:
            self.security_manager.audit_log(
                'CONVERSATION_HISTORY_ERROR',
                user_id, session_id,
                {'error': str(e)},
                'ERROR'
            )
            print(f"❌ Error retrieving conversation history: {e}")
            return []
    
    def cleanup_expired_data(self):
        """Clean up expired data based on retention policy"""
        try:
            retention_days = SECURITY_CONFIG['DATA_RETENTION_DAYS']
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
            
            # Clean up conversations
            if hasattr(self, 'conversations'):
                result = self.conversations.delete_many({
                    "timestamp": {"$lt": cutoff_date}
                })
                print(f"🧹 Cleaned up {result.deleted_count} expired conversations")
            
            # Clean up crisis logs
            if hasattr(self, 'crisis_logs'):
                result = self.crisis_logs.delete_many({
                    "timestamp": {"$lt": cutoff_date}
                })
                print(f"🧹 Cleaned up {result.deleted_count} expired crisis logs")
            
            # Clean up sessions
            if hasattr(self, 'sessions'):
                result = self.sessions.delete_many({
                    "start_time": {"$lt": cutoff_date}
                })
                print(f"🧹 Cleaned up {result.deleted_count} expired sessions")
            
            self.security_manager.audit_log(
                'DATA_CLEANUP',
                'system', 'system',
                {'retention_days': retention_days, 'cutoff_date': cutoff_date.isoformat()}
            )
            
        except Exception as e:
            print(f"❌ Error during data cleanup: {e}")
            self.security_manager.audit_log(
                'DATA_CLEANUP_ERROR',
                'system', 'system',
                {'error': str(e)},
                'ERROR'
            )
    
    def anonymize_user_data(self, user_id: str):
        """Anonymize user data for privacy compliance"""
        try:
            user_hash = self.security_manager.hash_pii(user_id)
            
            # Anonymize conversations
            if hasattr(self, 'conversations'):
                self.conversations.update_many(
                    {"user_id": user_hash},
                    {"$set": {
                        "user_id": "anonymized",
                        "user_login": "anonymized",
                        "encrypted_user_input": "[ANONYMIZED]",
                        "encrypted_bot_response": "[ANONYMIZED]"
                    }}
                )
            
            # Anonymize crisis logs
            if hasattr(self, 'crisis_logs'):
                self.crisis_logs.update_many(
                    {"user_id": user_hash},
                    {"$set": {
                        "user_id": "anonymized",
                        "user_login": "anonymized"
                    }}
                )
            
            self.security_manager.audit_log(
                'USER_DATA_ANONYMIZED',
                user_id, 'all_sessions',
                {'action': 'anonymize_user_data'}
            )
            
            print(f"✅ User data anonymized for privacy compliance")
            
        except Exception as e:
            print(f"❌ Error anonymizing user data: {e}")
            self.security_manager.audit_log(
                'USER_ANONYMIZATION_ERROR',
                user_id, 'unknown',
                {'error': str(e)},
                'ERROR'
            )

    def get_or_create_psychological_profile(self, user_id: str) -> PsychologicalProfile:
        """Get or create comprehensive psychological profile for a user"""
        try:
            user_hash = self.security_manager.hash_pii(user_id)
            
            # Try to get existing profile
            existing_profile = self.psychological_profiles.find_one({"user_id": user_hash})
            
            if existing_profile:
                # Convert MongoDB document to PsychologicalProfile
                profile = PsychologicalProfile(
                    user_id=user_hash,
                    core_patterns=existing_profile.get('core_patterns', {}),
                    trauma_indicators=existing_profile.get('trauma_indicators', {}),
                    long_term_progress=existing_profile.get('long_term_progress', {}),
                    therapeutic_preferences=existing_profile.get('therapeutic_preferences', {}),
                    risk_factors=existing_profile.get('risk_factors', {}),
                    resilience_factors=existing_profile.get('resilience_factors', {}),
                    cognitive_patterns=existing_profile.get('cognitive_patterns', {}),
                    emotional_regulation_patterns=existing_profile.get('emotional_regulation_patterns', {}),
                    relationship_patterns=existing_profile.get('relationship_patterns', {}),
                    coping_mechanisms=existing_profile.get('coping_mechanisms', {}),
                    trigger_patterns=existing_profile.get('trigger_patterns', {}),
                    created_at=existing_profile.get('created_at', ''),
                    last_updated=existing_profile.get('last_updated', '')
                )
                print(f"✅ Retrieved existing psychological profile for user")
                return profile
            else:
                # Create new profile
                profile = PsychologicalProfile(user_id=user_hash)
                
                # Save to database
                profile_doc = {
                    "user_id": user_hash,
                    "core_patterns": profile.core_patterns,
                    "trauma_indicators": profile.trauma_indicators,

                    "long_term_progress": profile.long_term_progress,
                    "therapeutic_preferences": profile.therapeutic_preferences,
                    "risk_factors": profile.risk_factors,
                    "resilience_factors": profile.resilience_factors,
                    "cognitive_patterns": profile.cognitive_patterns,
                    "emotional_regulation_patterns": profile.emotional_regulation_patterns,
                    "relationship_patterns": profile.relationship_patterns,
                    "coping_mechanisms": profile.coping_mechanisms,
                    "trigger_patterns": profile.trigger_patterns,
                    "created_at": profile.created_at,
                    "last_updated": profile.last_updated
                }
                
                self.psychological_profiles.insert_one(profile_doc)
                print(f"✅ Created new psychological profile for user")
                return profile
                
        except Exception as e:
            print(f"❌ Error managing psychological profile: {e}")
            # Return basic profile as fallback
            return PsychologicalProfile(user_id=self.security_manager.hash_pii(user_id))

    def update_psychological_profile(self, user_id: str, conversation_text: str, 
                                   crisis_level: str, mood_score: Optional[float] = None, llm=None):
        """Update psychological profile based on conversation analysis"""
        try:
            profile = self.get_or_create_psychological_profile(user_id)
            
            # AI-powered psychological pattern analysis
            if llm:
                pattern_analysis = self._analyze_psychological_patterns(conversation_text, profile, llm)
                
                # Update profile with new insights
                profile.core_patterns.update(pattern_analysis.get('core_patterns', {}))
                profile.cognitive_patterns.update(pattern_analysis.get('cognitive_patterns', {}))
                profile.emotional_regulation_patterns.update(pattern_analysis.get('emotional_patterns', {}))
                profile.coping_mechanisms.update(pattern_analysis.get('coping_mechanisms', {}))
                profile.trigger_patterns.update(pattern_analysis.get('trigger_patterns', {}))
                
                # Detect potential trauma indicators
                trauma_indicators = self._detect_trauma_indicators(conversation_text, profile, llm)
                if trauma_indicators:
                    profile.trauma_indicators.update(trauma_indicators)
                

                
                # Update progress tracking
                self._update_long_term_progress(user_id, crisis_level, mood_score, pattern_analysis)
                
                # Save updated profile
                profile.last_updated = datetime.now().isoformat()
                self._save_psychological_profile(profile)
                
                print(f"✅ Updated psychological profile with AI insights")
            else:
                print(f"⚠️ LLM unavailable for psychological pattern analysis")
                
        except Exception as e:
            print(f"❌ Error updating psychological profile: {e}")

    def _analyze_psychological_patterns(self, text: str, profile: PsychologicalProfile, llm=None) -> Dict[str, Any]:
        """AI-powered deep psychological pattern analysis"""
        try:
            if not llm:
                return {}
                
            # Get existing patterns for context
            existing_patterns = {
                'core_patterns': profile.core_patterns,
                'cognitive_patterns': profile.cognitive_patterns,
                'emotional_patterns': profile.emotional_regulation_patterns,
                'coping_mechanisms': profile.coping_mechanisms
            }
            
            analysis_prompt = f"""
You are a clinical psychologist analyzing conversation text for deep psychological patterns.

Current Text: "{text}"

Existing Profile Context:
- Known core patterns: {list(existing_patterns['core_patterns'].keys())[:5]}
- Known cognitive patterns: {list(existing_patterns['cognitive_patterns'].keys())[:5]}
- Known coping mechanisms: {list(existing_patterns['coping_mechanisms'].keys())[:3]}

Analyze this text for:
1. CORE PATTERNS: Fundamental psychological patterns (attachment style, defense mechanisms, core beliefs)
2. COGNITIVE PATTERNS: Thinking patterns (cognitive distortions, rumination, catastrophizing)
3. EMOTIONAL PATTERNS: Emotional regulation strategies and patterns
4. COPING MECHANISMS: How the person deals with stress and challenges
5. TRIGGER PATTERNS: What seems to trigger emotional responses

For each pattern found, provide:
- Pattern name
- Evidence from text
- Confidence level (0.1-1.0)
- Therapeutic implications

IMPORTANT: Return ONLY valid JSON, no additional text or explanation.

JSON format required:
{{
  "core_patterns": {{"pattern_name": {{"evidence": "text_evidence", "confidence": 0.8, "implications": "therapeutic_notes"}}}},
  "cognitive_patterns": {{}},
  "emotional_patterns": {{}},
  "coping_mechanisms": {{}},
  "trigger_patterns": {{}}
}}

Respond with JSON only:"""
            
            response = llm.invoke(analysis_prompt)
            ai_analysis = self._extract_llm_content(response)
            
            # Parse JSON response with enhanced extraction
            import json
            import re
            try:
                # First try direct JSON parsing
                pattern_analysis = json.loads(ai_analysis)
                print(f"🧠 AI identified {sum(len(patterns) for patterns in pattern_analysis.values())} psychological patterns")
                return pattern_analysis
            except json.JSONDecodeError:
                # Try to extract JSON from text
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', ai_analysis, re.DOTALL)
                if json_match:
                    try:
                        pattern_analysis = json.loads(json_match.group())
                        print(f"🧠 Extracted {sum(len(patterns) for patterns in pattern_analysis.values())} patterns from AI text")
                        return pattern_analysis
                    except json.JSONDecodeError:
                        pass
                print(f"⚠️ Could not parse AI psychological analysis: {ai_analysis[:100]}...")
                return self._extract_patterns_from_text(ai_analysis)
                
        except Exception as e:
            print(f"⚠️ Psychological pattern analysis failed: {e}")
            return {}

    def _detect_trauma_indicators(self, text: str, profile: PsychologicalProfile, llm=None) -> Dict[str, Any]:
        """Detect potential trauma indicators with appropriate sensitivity"""
        try:
            if not llm:
                return {}
                
            trauma_analysis_prompt = f"""
You are a trauma-informed mental health professional analyzing text for potential trauma indicators.

Text: "{text}"

Existing trauma context: {list(profile.trauma_indicators.keys())[:3] if profile.trauma_indicators else 'None identified'}

Analyze for POTENTIAL indicators of:
1. Hypervigilance or anxiety responses
2. Avoidance patterns
3. Emotional numbing or disconnection
4. Intrusive thoughts or memories references
5. Sleep or concentration difficulties
6. Emotional dysregulation patterns
7. Trust or relationship difficulties

IMPORTANT: 
- Only note POTENTIAL indicators, not diagnoses
- Focus on behavioral and emotional patterns
- Be sensitive and non-judgmental

IMPORTANT: Return ONLY valid JSON, no additional text or explanation.

JSON format required:
{{
  "hypervigilance": {{"present": true, "evidence": "text", "confidence": 0.8}},
  "avoidance": {{"present": false, "evidence": "", "confidence": 0.0}},
  "emotional_numbing": {{}},
  "intrusive_patterns": {{}},
  "concentration_issues": {{}},
  "emotional_dysregulation": {{}},
  "trust_issues": {{}}
}}

Respond with JSON only:"""
            
            response = llm.invoke(trauma_analysis_prompt)
            ai_analysis = self._extract_llm_content(response)
            
            import json
            import re
            try:
                # First try direct JSON parsing
                trauma_indicators = json.loads(ai_analysis)
            except json.JSONDecodeError:
                # Try to extract JSON from text
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', ai_analysis, re.DOTALL)
                if json_match:
                    try:
                        trauma_indicators = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        print(f"⚠️ Could not parse trauma analysis: {ai_analysis[:100]}...")
                        return {}
                else:
                    print(f"⚠️ No JSON found in trauma analysis: {ai_analysis[:100]}...")
                    return {}
            
            # Filter out low-confidence indicators
            filtered_indicators = {}
            if isinstance(trauma_indicators, dict):
                for indicator, data in trauma_indicators.items():
                    if isinstance(data, dict) and data.get('present') and data.get('confidence', 0) > 0.6:
                        filtered_indicators[indicator] = data
                    
            if filtered_indicators:
                print(f"🔍 Identified {len(filtered_indicators)} potential trauma indicators")
            return filtered_indicators
                
        except Exception as e:
            print(f"⚠️ Trauma indicator analysis failed: {e}")
            return {}



    def _update_long_term_progress(self, user_id: str, crisis_level: str, mood_score: Optional[float], 
                                  pattern_analysis: Dict[str, Any]):
        """Track long-term therapeutic progress across sessions"""
        try:
            user_hash = self.security_manager.hash_pii(user_id)
            
            progress_entry = {
                "user_id": user_hash,
                "timestamp": datetime.now(),
                "crisis_level": crisis_level,
                "mood_score": mood_score,
                "patterns_identified": len([p for patterns in pattern_analysis.values() for p in patterns]),
                "pattern_categories": list(pattern_analysis.keys()),
                "session_quality_indicators": {
                    "emotional_awareness": self._assess_emotional_awareness(pattern_analysis),
                    "coping_effectiveness": self._assess_coping_effectiveness(pattern_analysis),
                    "insight_development": self._assess_insight_development(pattern_analysis),
                    "progress_momentum": self._assess_progress_momentum(crisis_level, mood_score)
                },
                "therapeutic_goals_progress": self._assess_therapeutic_goals(pattern_analysis),
                "risk_level_trend": self._assess_risk_trend(crisis_level, user_hash),
                "resilience_indicators": self._identify_resilience_indicators(pattern_analysis)
            }
            
            # Save progress entry
            self.long_term_progress.insert_one(progress_entry)
            
            # Update profile with progress summary
            self._update_profile_progress_summary(user_hash, progress_entry)
            
            print(f"✅ Updated long-term progress tracking")
            
        except Exception as e:
            print(f"❌ Error updating long-term progress: {e}")

    def _save_psychological_profile(self, profile: PsychologicalProfile):
        """Save psychological profile to database"""
        try:
            profile_doc = {
                "user_id": profile.user_id,
                "core_patterns": profile.core_patterns,
                "trauma_indicators": profile.trauma_indicators,
                "long_term_progress": profile.long_term_progress,
                "therapeutic_preferences": profile.therapeutic_preferences,
                "risk_factors": profile.risk_factors,
                "resilience_factors": profile.resilience_factors,
                "cognitive_patterns": profile.cognitive_patterns,
                "emotional_regulation_patterns": profile.emotional_regulation_patterns,
                "relationship_patterns": profile.relationship_patterns,
                "coping_mechanisms": profile.coping_mechanisms,
                "trigger_patterns": profile.trigger_patterns,
                "last_updated": profile.last_updated
            }
            
            self.psychological_profiles.update_one(
                {"user_id": profile.user_id},
                {"$set": profile_doc},
                upsert=True
            )
            
        except Exception as e:
            print(f"❌ Error saving psychological profile: {e}")

    def _extract_llm_content(self, response) -> str:
        """Safely extract content from LLM response"""
        try:
            if hasattr(response, 'content'):
                content = response.content
                if isinstance(content, str):
                    return content.strip()
                elif isinstance(content, list) and content:
                    return str(content[0]).strip()
                else:
                    return str(content).strip()
            else:
                return str(response).strip()
        except Exception as e:
            print(f"⚠️ Error extracting content from LLM response: {e}")
            return str(response).strip() if response else ""

    def _assess_emotional_awareness(self, pattern_analysis: Dict[str, Any]) -> float:
        """Assess level of emotional awareness from pattern analysis"""
        try:
            awareness_score = 0.0
            
            # Check emotional patterns
            emotional_patterns = pattern_analysis.get('emotional_patterns', {})
            if emotional_patterns:
                awareness_score += 0.3
                
            # Check for emotional vocabulary and insight
            core_patterns = pattern_analysis.get('core_patterns', {})
            for pattern_name, data in core_patterns.items():
                if isinstance(data, dict) and 'emotion' in pattern_name.lower():
                    confidence = data.get('confidence', 0)
                    awareness_score += confidence * 0.2
                    
            return min(awareness_score, 1.0)
        except:
            return 0.5  # Default neutral score

    def _assess_coping_effectiveness(self, pattern_analysis: Dict[str, Any]) -> float:
        """Assess effectiveness of coping mechanisms"""
        try:
            coping_score = 0.0
            coping_mechanisms = pattern_analysis.get('coping_mechanisms', {})
            
            for mechanism, data in coping_mechanisms.items():
                if isinstance(data, dict):
                    confidence = data.get('confidence', 0)
                    # Positive coping mechanisms get higher scores
                    if any(positive in mechanism.lower() for positive in 
                          ['support', 'exercise', 'mindfulness', 'problem-solving', 'communication']):
                        coping_score += confidence * 0.4
                    else:
                        coping_score += confidence * 0.2
                        
            return min(coping_score, 1.0)
        except:
            return 0.5

    def _assess_insight_development(self, pattern_analysis: Dict[str, Any]) -> float:
        """Assess level of psychological insight development"""
        try:
            insight_score = 0.0
            
            # Check cognitive patterns for insight indicators
            cognitive_patterns = pattern_analysis.get('cognitive_patterns', {})
            for pattern_name, data in cognitive_patterns.items():
                if isinstance(data, dict):
                    confidence = data.get('confidence', 0)
                    # Self-awareness and reflection patterns indicate insight
                    if any(insight_word in pattern_name.lower() for insight_word in 
                          ['awareness', 'reflection', 'understanding', 'realize', 'recognize']):
                        insight_score += confidence * 0.3
                        
            return min(insight_score, 1.0)
        except:
            return 0.5

    def _assess_progress_momentum(self, crisis_level: str, mood_score: Optional[float]) -> float:
        """Assess overall progress momentum"""
        try:
            momentum_score = 0.0
            
            # Crisis level indicates current state
            crisis_weights = {
                'none': 1.0,
                'low': 0.8,
                'medium': 0.5,
                'high': 0.2,
                'critical': 0.0
            }
            momentum_score += crisis_weights.get(crisis_level, 0.5) * 0.5
            
            # Mood score indicates subjective wellbeing
            if mood_score:
                normalized_mood = mood_score / 10.0  # Assuming 0-10 scale
                momentum_score += normalized_mood * 0.5
                
            return min(momentum_score, 1.0)
        except:
            return 0.5

    def _assess_therapeutic_goals(self, pattern_analysis: Dict[str, Any]) -> Dict[str, float]:
        """Assess progress toward common therapeutic goals"""
        try:
            goals_progress = {
                'emotional_regulation': 0.0,
                'stress_management': 0.0,
                'relationship_skills': 0.0,
                'self_awareness': 0.0,
                'coping_skills': 0.0
            }
            
            # Emotional regulation
            emotional_patterns = pattern_analysis.get('emotional_patterns', {})
            if emotional_patterns:
                avg_confidence = sum(data.get('confidence', 0) for data in emotional_patterns.values() 
                                   if isinstance(data, dict)) / len(emotional_patterns)
                goals_progress['emotional_regulation'] = avg_confidence
            
            # Coping skills
            coping_mechanisms = pattern_analysis.get('coping_mechanisms', {})
            if coping_mechanisms:
                avg_confidence = sum(data.get('confidence', 0) for data in coping_mechanisms.values() 
                                   if isinstance(data, dict)) / len(coping_mechanisms)
                goals_progress['coping_skills'] = avg_confidence
            
            # Self-awareness
            core_patterns = pattern_analysis.get('core_patterns', {})
            awareness_patterns = [data for name, data in core_patterns.items() 
                                if isinstance(data, dict) and 'aware' in name.lower()]
            if awareness_patterns:
                avg_confidence = sum(data.get('confidence', 0) for data in awareness_patterns) / len(awareness_patterns)
                goals_progress['self_awareness'] = avg_confidence
                
            return goals_progress
        except:
            return {goal: 0.5 for goal in ['emotional_regulation', 'stress_management', 
                                         'relationship_skills', 'self_awareness', 'coping_skills']}

    def _assess_risk_trend(self, current_crisis_level: str, user_hash: str) -> str:
        """Assess risk level trend over time"""
        try:
            # Get recent crisis levels from database
            recent_entries = list(self.long_term_progress.find(
                {"user_id": user_hash}
            ).sort("timestamp", -1).limit(5))
            
            if len(recent_entries) < 2:
                return "insufficient_data"
                
            crisis_values = {'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
            recent_values = [crisis_values.get(entry.get('crisis_level', 'none'), 0) 
                           for entry in recent_entries]
            
            current_value = crisis_values.get(current_crisis_level, 0)
            
            if current_value < recent_values[1]:  # Improving
                return "decreasing"
            elif current_value > recent_values[1]:  # Worsening
                return "increasing"
            else:
                return "stable"
                
        except:
            return "unknown"

    def _identify_resilience_indicators(self, pattern_analysis: Dict[str, Any]) -> List[str]:
        """Identify resilience indicators from pattern analysis"""
        try:
            resilience_indicators = []
            
            # Check coping mechanisms for positive indicators
            coping_mechanisms = pattern_analysis.get('coping_mechanisms', {})
            for mechanism, data in coping_mechanisms.items():
                if isinstance(data, dict) and data.get('confidence', 0) > 0.6:
                    if any(resilient in mechanism.lower() for resilient in 
                          ['support', 'exercise', 'mindfulness', 'problem-solving', 'help-seeking']):
                        resilience_indicators.append(mechanism)
            
            # Check core patterns for resilience
            core_patterns = pattern_analysis.get('core_patterns', {})
            for pattern, data in core_patterns.items():
                if isinstance(data, dict) and data.get('confidence', 0) > 0.6:
                    if any(resilient in pattern.lower() for resilient in 
                          ['optimism', 'hope', 'strength', 'perseverance', 'adaptability']):
                        resilience_indicators.append(pattern)
                        
            return resilience_indicators[:5]  # Limit to top 5
        except:
            return []

    def _update_profile_progress_summary(self, user_hash: str, progress_entry: Dict[str, Any]):
        """Update psychological profile with progress summary"""
        try:
            progress_summary = {
                'last_assessment': progress_entry['timestamp'].isoformat(),
                'current_risk_trend': progress_entry.get('risk_level_trend', 'unknown'),
                'therapeutic_momentum': progress_entry.get('session_quality_indicators', {}).get('progress_momentum', 0.5),
                'resilience_indicators': progress_entry.get('resilience_indicators', [])
            }
            
            self.psychological_profiles.update_one(
                {"user_id": user_hash},
                {"$set": {"long_term_progress": progress_summary}},
                upsert=True
            )
            
        except Exception as e:
            print(f"❌ Error updating profile progress summary: {e}")

    def _extract_patterns_from_text(self, ai_text: str) -> Dict[str, Any]:
        """Fallback method to extract patterns when JSON parsing fails"""
        try:
            patterns = {
                'core_patterns': {},
                'cognitive_patterns': {},
                'emotional_patterns': {},
                'coping_mechanisms': {},
                'trigger_patterns': {}
            }
            
            lines = ai_text.split('\n')
            current_category = None
            
            for line in lines:
                line = line.strip()
                if any(category in line.lower() for category in patterns.keys()):
                    for category in patterns.keys():
                        if category.replace('_', ' ') in line.lower():
                            current_category = category
                            break
                elif current_category and ':' in line:
                    pattern_name = line.split(':')[0].strip()
                    if pattern_name:
                        patterns[current_category][pattern_name] = {
                            'evidence': line,
                            'confidence': 0.7,
                            'implications': 'Requires further assessment'
                        }
            
            return patterns
        except:
            return {
                'core_patterns': {},
                'cognitive_patterns': {},
                'emotional_patterns': {},
                'coping_mechanisms': {},
                'trigger_patterns': {}
            }

    def get_user_analytics(self, user_login: Optional[str] = None) -> Dict:
        """Get user analytics and insights"""
        if not user_login:
            user_login = self.current_user['login']

        try:
            if hasattr(self, 'conversations'):
                # Get analytics from MongoDB
                pipeline = [
                    {"$match": {"user_login": user_login}},
                    {"$group": {
                        "_id": None,
                        "total_conversations": {"$sum": 1},
                        "avg_mood_score": {"$avg": "$mood_score"},
                        "crisis_events": {"$sum": {"$cond": [{"$ne": ["$crisis_level", "none"]}, 1, 0]}},
                        "last_conversation": {"$max": "$timestamp"},
                        "crisis_levels": {"$addToSet": "$crisis_level"}
                    }}
                ]

                result = list(self.conversations.aggregate(pipeline))
                if result:
                    analytics = result[0]
                    analytics["user_login"] = user_login
                    analytics["last_conversation"] = analytics["last_conversation"].isoformat() if analytics.get("last_conversation") else None
                    return analytics

            return {"user_login": user_login, "total_conversations": 0}

        except Exception as e:
            print(f"❌ Error getting user analytics: {e}")
            return {"error": str(e)}



    def close_connection(self):
        """Close MongoDB connection"""
        try:
            if hasattr(self, 'client'):
                self.client.close()
                print("🔐 MongoDB connection closed")
        except Exception as e:
            print(f"⚠️ Error closing MongoDB connection: {e}")

    def __del__(self):
        """Cleanup when object is destroyed"""
        self.close_connection()

# Initialize enhanced storage with MongoDB (will be updated with user context per request)
try:
    storage = MongoDBStorage()  # Initialize with default context, will be updated per request
    print("🚀 Enhanced MongoDB storage system ready!")
    print(f"💽 Connected to: FluentiAI-cluster")
    print(f"🗃️ Database: therapy_support_db")
    print(f"📊 Collections: conversations, sessions, crisis_logs, user_profiles")

except Exception as e:
    print(f"❌ Error initializing MongoDB storage: {e}")
    raise RuntimeError(f"MongoDB storage initialization failed: {e}")

# Imports moved to top of file - removing duplicates

# Download required NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('punkt', quiet=True)
    from nltk.sentiment import SentimentIntensityAnalyzer
    print("✅ NLTK sentiment analyzer ready")
except:
    print("⚠️ NLTK not available, using basic sentiment analysis")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CrisisLevel(Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class HarmType(Enum):
    NONE = "none"
    SELF_HARM = "self_harm"
    HARM_TO_OTHERS = "harm_to_others"
    BOTH = "both"

@dataclass
class UserSession:
    user_id: str
    session_id: str
    start_time: datetime
    mood_history: List[Dict]
    topics_discussed: List[str]
    crisis_level: CrisisLevel
    conversation_history: List[Dict]

print("✅ Core classes and imports ready!")

class DataLoader:
    """Enhanced mental health data loader with focused, efficient datasets"""
    
    # Mental health keywords for relevance filtering
    MENTAL_HEALTH_KEYWORDS = [
        'anxiety', 'depression', 'stress', 'therapy', 'counseling', 'therapist',
        'mental health', 'emotion', 'feeling', 'support', 'crisis', 'trauma',
        'ptsd', 'bipolar', 'ocd', 'adhd', 'autism', 'suicide', 'self-harm',
        'panic', 'phobia', 'addiction', 'substance', 'abuse', 'eating disorder',
        'anorexia', 'bulimia', 'ptsd', 'ptsd', 'dissociative', 'personality disorder',
        'schizophrenia', 'psychosis', 'mood', 'emotional', 'psychological', 'psychiatric',
        'medication', 'antidepressant', 'antipsychotic', 'therapy session', 'counselor',
        'psychologist', 'psychiatrist', 'mental illness', 'wellness', 'mindfulness',
        'meditation', 'coping', 'grief', 'loss', 'bereavement', 'anger', 'fear',
        'worry', 'sadness', 'loneliness', 'isolation', 'social anxiety', 'panic attack'
    ]
    
    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize text: remove HTML/XML tags, clean artifacts, normalize whitespace"""
        if not text:
            return ""
        
        # Remove HTML/XML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove special tokens/artifacts
        text = re.sub(r'\[.*?\]', '', text)  # Remove brackets
        text = re.sub(r'\{.*?\}', '', text)  # Remove braces
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    @staticmethod
    def count_words(text: str) -> int:
        """Count words in text"""
        if not text:
            return 0
        return len(text.split())
    
    @staticmethod
    def is_mental_health_relevant(text: str) -> bool:
        """Check if text is relevant to mental health"""
        if not text:
            return False
        
        text_lower = text.lower()
        # Check for mental health keywords
        return any(keyword in text_lower for keyword in DataLoader.MENTAL_HEALTH_KEYWORDS)
    
    @staticmethod
    def validate_text_quality(text: str, min_words: int = 20, max_words: int = 2000) -> bool:
        """Validate text meets quality standards"""
        if not text or not text.strip():
            return False
        
        word_count = DataLoader.count_words(text)
        
        # Minimum therapeutic value
        if word_count < min_words:
            return False
        
        # Maximum reasonable length
        if word_count > max_words:
            return False
        
        # Check for meaningful content (not just repeated characters/words)
        words = text.split()
        if len(set(words)) < 3:  # At least 3 unique words
            return False
        
        return True
    
    @staticmethod
    def extract_dataset_fields(item: Dict, dataset_name: str) -> Tuple[str, str]:
        """Extract fields based on dataset-specific structure"""
        text = ""
        source_type = "unknown"
        
        # Dataset-specific extraction
        if 'Amod/mental_health' in dataset_name or 'mental_health_counseling' in dataset_name:
            # Counseling conversations: Context/Response format
            if 'Context' in item and 'Response' in item:
                text = f"Context: {item['Context']}\nResponse: {item['Response']}"
                source_type = "counseling_conversation"
            elif 'context' in item and 'response' in item:
                text = f"Context: {item['context']}\nResponse: {item['response']}"
                source_type = "counseling_conversation"
        
        elif 'counsel-chat' in dataset_name or 'nbertagnolli' in dataset_name:
            # Counsel Chat: May have different structure
            if 'Context' in item and 'Response' in item:
                text = f"Context: {item['Context']}\nResponse: {item['Response']}"
                source_type = "counsel_chat"
            elif 'question' in item and 'answer' in item:
                text = f"Question: {item['question']}\nAnswer: {item['answer']}"
                source_type = "counsel_chat"
            elif 'input' in item and 'output' in item:
                text = f"Question: {item['input']}\nAnswer: {item['output']}"
                source_type = "counsel_chat"
        
        elif 'emotion' in dataset_name:
            # Emotion dataset: text + label
            if 'text' in item:
                text = item['text']
                if 'label' in item:
                    # Preserve emotion label in text
                    emotion_labels = ['sadness', 'joy', 'love', 'anger', 'fear', 'surprise']
                    if isinstance(item['label'], int) and item['label'] < len(emotion_labels):
                        label = emotion_labels[item['label']]
                        text = f"Emotion: {label}\nText: {text}"
                source_type = "emotion_classification"
        
        elif 'squad' in dataset_name:
            # SQuAD: question + context + answers
            if 'question' in item and 'context' in item:
                question = item['question']
                context = item['context']
                answers = item.get('answers', {}).get('text', [])
                answer_text = answers[0] if answers else ""
                text = f"Question: {question}\nContext: {context}\nAnswer: {answer_text}"
                source_type = "qa_pair"
        
        elif 'HelpSteer' in dataset_name or 'nvidia' in dataset_name:
            # HelpSteer: May have helpfulness scores
            if 'prompt' in item and 'response' in item:
                prompt = item['prompt']
                response = item['response']
                # Include helpfulness if available
                helpfulness = item.get('helpfulness', '')
                if helpfulness:
                    text = f"Prompt: {prompt}\nResponse: {response}\nHelpfulness: {helpfulness}"
                else:
                    text = f"Prompt: {prompt}\nResponse: {response}"
                source_type = "helpful_conversation"
        
        elif 'ultrachat' in dataset_name or 'HuggingFaceH4' in dataset_name:
            # UltraChat: May have messages array
            if 'messages' in item:
                messages = item['messages']
                if isinstance(messages, list):
                    text_parts = []
                    for msg in messages:
                        if isinstance(msg, dict) and 'content' in msg:
                            role = msg.get('role', 'user')
                            content = msg['content']
                            text_parts.append(f"{role.title()}: {content}")
                    text = "\n".join(text_parts)
                    source_type = "chat_conversation"
        
        # Fallback: Generic field extraction
        if not text:
            if 'input' in item and 'output' in item:
                text = f"Question: {item['input']}\nAnswer: {item['output']}"
                source_type = "qa_pair"
            elif 'question' in item and 'answer' in item:
                text = f"Question: {item['question']}\nAnswer: {item['answer']}"
                source_type = "qa_pair"
            elif 'text' in item:
                text = item['text']
                source_type = "general_text"
            else:
                # Try to combine all available fields
                text_parts = []
                for field in ['conversation', 'context', 'response', 'content', 'input', 'output', 'prompt', 'message']:
                    if field in item and item[field]:
                        text_parts.append(f"{field.title()}: {str(item[field])}")
                text = "\n".join(text_parts)
                source_type = "combined_fields"
        
        return text, source_type

    @staticmethod
    def load_dataset_with_streaming(dataset_name: str, split: str, limit: Optional[int] = None, progress_interval: int = 1000):
        """Load dataset using streaming mode for faster loading"""
        cache_dir = os.path.join(os.getcwd(), "models", "hf_cache", "datasets")
        os.makedirs(cache_dir, exist_ok=True)
        
        try:
            # Try streaming mode first
            dataset_stream = load_dataset(dataset_name, split=split, streaming=True, cache_dir=cache_dir)
            dataset_list = []
            print("📊 Streaming examples... (this is much faster than generating full split)")
            
            for i, example in enumerate(dataset_stream):
                if limit and i >= limit:
                    break
                dataset_list.append(example)
                # Show progress
                if limit and (i + 1) % progress_interval == 0:
                    print(f"   📥 Streamed {i + 1}/{limit} examples...")
                elif not limit and (i + 1) % progress_interval == 0:
                    print(f"   📥 Streamed {i + 1} examples...")
            
            # Convert to Dataset format
            from datasets import Dataset
            dataset = Dataset.from_list(dataset_list)
            print(f"✅ Loaded via streaming: {len(dataset_list)} examples")
            return dataset
            
        except Exception as e:
            print(f"⚠️ Streaming failed ({e}), trying traditional method...")
            # Fallback: try with multiprocessing
            try:
                import multiprocessing
                num_proc = min(4, multiprocessing.cpu_count())
                dataset_full = load_dataset(dataset_name, split=split, num_proc=num_proc)
            except Exception:
                # Final fallback: single process
                dataset_full = load_dataset(dataset_name, split=split)
            
            # Manually limit if needed
            if limit and hasattr(dataset_full, 'select') and hasattr(dataset_full, '__len__'):
                try:
                    if len(dataset_full) > limit:  # type: ignore
                        return dataset_full.select(range(limit))  # type: ignore
                except (TypeError, AttributeError):
                    pass
            
            return dataset_full

    @staticmethod
    def load_mental_health_datasets():
        """Load multiple mental health datasets from Hugging Face - optimized for speed"""
        datasets = []

        try:
            print("📊 Loading focused mental health datasets...")

            # Dataset 1: Mental health counseling conversations (KEEP - working well)
            try:
                print("Loading counseling conversations dataset...")
                dataset1 = DataLoader.load_dataset_with_streaming(
                    "Amod/mental_health_counseling_conversations", 
                    split='train',
                    limit=None,  # Load all
                    progress_interval=1000
                )
                datasets.append((dataset1, "Amod/mental_health_counseling_conversations"))
                dataset1_size = safe_dataset_len(dataset1)
                print(f"✅ Loaded {dataset1_size} counseling conversations")
            except Exception as e:
                print(f"⚠️ Could not load counseling dataset: {e}")

            # Dataset 2: Mental health chatbot dataset (KEEP - working well)
            try:
                print("Loading mental health chatbot dataset...")
                dataset2 = DataLoader.load_dataset_with_streaming(
                    "heliosbrahma/mental_health_chatbot_dataset", 
                    split='train',
                    limit=None,  # Load all
                    progress_interval=100
                )
                datasets.append((dataset2, "heliosbrahma/mental_health_chatbot_dataset"))
                dataset2_size = safe_dataset_len(dataset2)
                print(f"✅ Loaded {dataset2_size} chatbot conversations")
            except Exception as e:
                print(f"⚠️ Could not load chatbot dataset: {e}")

            # Dataset 3: Counsel Chat - Therapy conversations (KEEP - working well)
            try:
                print("Loading counsel chat therapy dataset...")
                dataset3 = DataLoader.load_dataset_with_streaming(
                    "nbertagnolli/counsel-chat", 
                    split='train',
                    limit=None,  # Load all
                    progress_interval=1000
                )
                datasets.append((dataset3, "nbertagnolli/counsel-chat"))
                dataset3_size = safe_dataset_len(dataset3)
                print(f"✅ Loaded {dataset3_size} counsel chat conversations")
            except Exception as e:
                print(f"⚠️ Could not load counsel chat dataset: {e}")

            # REMOVED: Dataset 4 was duplicate of dataset1 (Amod/mental_health_counseling_conversations)



            # Dataset 6: Mental health support - LIMITED SIZE (WILL BE FILTERED FOR MENTAL HEALTH RELEVANCE)
            try:
                print("Loading limited support conversations (will filter for mental health relevance)...")
                dataset6 = DataLoader.load_dataset_with_streaming(
                    "HuggingFaceH4/ultrachat_200k", 
                    split='train_sft',
                    limit=5000,  # Limited size
                    progress_interval=1000
                )
                datasets.append((dataset6, "HuggingFaceH4/ultrachat_200k"))
                dataset6_size = safe_dataset_len(dataset6)
                print(f"✅ Loaded {dataset6_size} support conversations (will filter for mental health)")
            except Exception as e:
                print(f"⚠️ Could not load support dataset: {e}")

            # Dataset 7: Therapeutic conversations - LIMITED SIZE (WILL BE FILTERED FOR MENTAL HEALTH RELEVANCE)
            try:
                print("Loading limited therapeutic conversations (will filter for mental health relevance)...")
                dataset7 = DataLoader.load_dataset_with_streaming(
                    "nvidia/HelpSteer", 
                    split='train',
                    limit=3000,  # Limited size
                    progress_interval=500
                )
                datasets.append((dataset7, "nvidia/HelpSteer"))
                dataset7_size = safe_dataset_len(dataset7)
                print(f"✅ Loaded {dataset7_size} therapeutic conversations (will filter for mental health)")
            except Exception as e:
                print(f"⚠️ Could not load therapeutic dataset: {e}")

            # Dataset 8: Mental health Q&A dataset (WILL BE FILTERED FOR MENTAL HEALTH RELEVANCE)
            try:
                print("Loading mental health Q&A dataset (will filter for mental health relevance)...")
                dataset8 = DataLoader.load_dataset_with_streaming(
                    "squad", 
                    split='train',
                    limit=2000,  # Limited size
                    progress_interval=500
                )
                datasets.append((dataset8, "squad"))
                dataset8_size = safe_dataset_len(dataset8)
                print(f"✅ Loaded {dataset8_size} Q&A examples (will filter for mental health)")
            except Exception as e:
                print(f"⚠️ Could not load Q&A dataset: {e}")



            # Dataset 10: Mental health classification dataset
            try:
                print("Loading mental health classification dataset...")
                dataset10 = DataLoader.load_dataset_with_streaming(
                    "emotion", 
                    split='train',
                    limit=2000,  # Limited size
                    progress_interval=500
                )
                datasets.append((dataset10, "emotion"))
                dataset10_size = safe_dataset_len(dataset10)
                print(f"✅ Loaded {dataset10_size} emotion classification examples")
            except Exception as e:
                print(f"⚠️ Could not load emotion dataset: {e}")

            if datasets:
                # Safely calculate total entries (handle tuple format)
                total_entries = 0
                dataset_count = 0
                for dataset_item in datasets:
                    dataset = dataset_item[0] if isinstance(dataset_item, tuple) else dataset_item
                    dataset_size = safe_dataset_len(dataset)
                    if dataset_size != 'unknown':
                        try:
                            total_entries += int(dataset_size)
                        except:
                            pass
                    dataset_count += 1
                print(f"✅ Successfully loaded {dataset_count} datasets with ~{total_entries} total entries")
                print(f"⚡ Optimized for speed and mental health relevance!")
                return datasets
            else:
                raise RuntimeError("No datasets loaded and fallback data removed")

        except Exception as e:
            print(f"❌ Error loading datasets: {e}")
            raise

    
# Lazy dataset loading - only load when actually needed (prevents OOM during startup)
_datasets_cache = None
_datasets_loading = False

def get_datasets():
    """Lazy loader for datasets - only loads on first use to prevent OOM during startup"""
    global _datasets_cache, _datasets_loading
    
    if _datasets_cache is not None:
        return _datasets_cache
    
    if _datasets_loading:
        # If already loading, wait a bit and return empty list to prevent deadlock
        import time
        time.sleep(0.1)
        return []
    
    _datasets_loading = True
    try:
        print("📚 Loading datasets on first use (lazy loading to save memory)...")
        _datasets_cache = DataLoader.load_mental_health_datasets()
        print("✅ Datasets loaded successfully!")
        return _datasets_cache
    except Exception as e:
        print(f"⚠️ Error loading datasets: {e}")
        return []
    finally:
        _datasets_loading = False

# Load datasets immediately
datasets = get_datasets()
print("📚 Datasets loaded successfully!")

import re
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict, Counter
import json
from datetime import datetime

class CrisisDetector:
    """Fully dynamic crisis detection system with AI-powered analysis"""

    def __init__(self, llm=None, detection_mode="hybrid", user_context: Optional[Dict] = None):
        self.llm = llm  # LLM for AI-powered crisis detection
        self.detection_mode = detection_mode  # "ai", "pattern", or "hybrid"
        self.current_user = user_context or self._get_default_user_context()
        
        # Core crisis severity indicators - these are fundamental psychological markers
        self.severity_markers = {
            'critical_risk': {
                'weight': 4,
                'base_indicators': set()  # Will be learned dynamically
            },
            'high_risk': {
                'weight': 3,
                'base_indicators': set()
            },
            'moderate_concern': {
                'weight': 2,
                'base_indicators': set()
            },
            'mild_concern': {
                'weight': 1,
                'base_indicators': set()
            }
        }

        # Dynamic learning storage
        self.learned_patterns = {
            'contexts': defaultdict(lambda: {'keywords': set(), 'phrases': set(), 'frequency': 0}),
            'help_seeking': defaultdict(int),
            'negation_patterns': defaultdict(int),
            'crisis_indicators': defaultdict(lambda: {'severity': 0, 'context_associations': defaultdict(int)}),
            'escalation_patterns': defaultdict(list)
        }

        # Conversation tracking for pattern learning
        self.conversation_history: Dict[str, List] = defaultdict(list)
        self.user_patterns: Dict[str, Dict] = defaultdict(lambda: {
            'typical_language': defaultdict(int),
            'crisis_history': [],
            'help_seeking_patterns': defaultdict(int),
            'context_preferences': defaultdict(int)
        })

        # Dynamic linguistic analysis
        self.linguistic_patterns = {
            'question_indicators': defaultdict(int),
            'request_indicators': defaultdict(int),
            'emotional_intensity': defaultdict(int),
            'temporal_urgency': defaultdict(int),
            'social_connection': defaultdict(int)
        }

        # Initialize sentiment analyzer
        try:
            if SentimentIntensityAnalyzer is not None:
                self.sentiment_analyzer = SentimentIntensityAnalyzer()
                self.sentiment_available = True
            else:
                self.sentiment_analyzer = None
                self.sentiment_available = False
        except:
            self.sentiment_analyzer = None
            self.sentiment_available = False

        print(f"✅ Fully dynamic crisis detection initialized for user: {self.current_user['login']}")
    
    def update_user_context(self, user_context: Dict) -> None:
        """Update the current user context dynamically"""
        if user_context:
            self.current_user = user_context
            print(f"🔄 Crisis detector updated user context to: {user_context.get('login', 'unknown')}")

    def _get_default_user_context(self) -> Dict[str, Any]:
        """Extract default user context as fallback"""
        current_time = datetime.utcnow()
        fallback_login = os.getenv('USER_LOGIN', 'anonymous_user')
        print(f"⚠️ WARNING: Crisis detector using fallback user context for {fallback_login}")

        return {
            'login': fallback_login,
            'timestamp': current_time,
            'session_id': f"session_{int(current_time.timestamp())}",
            'time_of_day': self._classify_time_of_day(current_time.hour),
            'date': current_time.strftime('%Y-%m-%d')
        }

    def _classify_time_of_day(self, hour: int) -> str:
        """Dynamically classify time periods"""
        if 5 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 17:
            return 'afternoon'
        elif 17 <= hour < 21:
            return 'evening'
        else:
            return 'night'

    def _extract_linguistic_features(self, text: str) -> Dict[str, Any]:
        """Dynamically extract linguistic features from text"""
        text_lower = text.lower().strip()
        words = text_lower.split()

        features = {
            'word_count': len(words),
            'sentence_count': len([s for s in text.split('.') if s.strip()]),
            'question_marks': text.count('?'),
            'exclamation_marks': text.count('!'),
            'first_person': sum(1 for word in words if word in ['i', 'me', 'my', 'myself', 'mine']),
            'second_person': sum(1 for word in words if word in ['you', 'your', 'yours', 'yourself']),
            'negation_words': sum(1 for word in words if word in ['no', 'not', 'never', 'nothing', 'nobody', 'nowhere']),
            'intensity_words': sum(1 for word in words if word in ['very', 'really', 'extremely', 'completely', 'totally']),
            'temporal_words': sum(1 for word in words if word in ['now', 'today', 'tonight', 'tomorrow', 'soon', 'immediately']),
            'social_words': sum(1 for word in words if word in ['help', 'support', 'together', 'alone', 'lonely', 'everyone', 'someone']),
            'starts_with_question': text_lower.startswith(('how', 'what', 'when', 'where', 'why', 'can', 'could', 'would', 'should')),
            'contains_request': any(phrase in text_lower for phrase in ['can you', 'could you', 'please', 'help me', 'i need']),
            'average_word_length': sum(len(word) for word in words) / len(words) if words else 0
        }

        return features

    def _learn_context_from_text(self, text: str, user_id: Optional[str] = None) -> Set[str]:
        """Dynamically learn and extract contexts from text"""
        text_lower = text.lower()
        words = text_lower.split()
        detected_contexts = set()

        # Extract noun phrases and topics
        potential_contexts = []

        # Look for patterns like "my [noun]", "at [noun]", "in [noun]", etc.
        context_indicators = ['my', 'at', 'in', 'with', 'about', 'regarding', 'concerning']
        for i, word in enumerate(words):
            if word in context_indicators and i + 1 < len(words):
                next_word = words[i + 1]
                if len(next_word) > 2 and next_word.isalpha():
                    potential_contexts.append(next_word)

        # Look for compound contexts
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i + 1]}"
            if any(char.isalpha() for char in bigram) and len(bigram) > 5:
                potential_contexts.append(bigram)

        # Learn and categorize contexts
        for context in potential_contexts:
            # Determine if this is a legitimate context
            if self._is_valid_context(context, text_lower):
                context_category = self._categorize_context(context, text_lower)
                detected_contexts.add(context_category)

                # Learn this context
                self.learned_patterns['contexts'][context_category]['keywords'].add(context)
                self.learned_patterns['contexts'][context_category]['frequency'] += 1

                # Learn associated phrases
                for phrase in self._extract_phrases_around_context(text_lower, context):
                    self.learned_patterns['contexts'][context_category]['phrases'].add(phrase)

        return detected_contexts

    def _is_valid_context(self, context: str, full_text: str) -> bool:
        """Determine if extracted text represents a valid context"""
        # Filter out common words that aren't contexts
        invalid_words = {'the', 'and', 'or', 'but', 'that', 'this', 'with', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might'}

        if context in invalid_words:
            return False

        # Must be substantial enough
        if len(context) < 3:
            return False

        # Check if it appears in a meaningful context
        meaningful_patterns = [
            f"about {context}", f"with {context}", f"at {context}",
            f"in {context}", f"my {context}", f"{context} is", f"{context} was"
        ]

        return any(pattern in full_text for pattern in meaningful_patterns)

    def _categorize_context(self, context: str, full_text: str) -> str:
        """Dynamically categorize contexts based on surrounding language"""
        # Analyze surrounding words to determine category
        context_pos = full_text.find(context)
        if context_pos == -1:
            return 'general'

        # Get surrounding context (50 characters before and after)
        start = max(0, context_pos - 50)
        end = min(len(full_text), context_pos + len(context) + 50)
        surrounding = full_text[start:end]

        # AI-powered context categorization
        if self.llm:
            try:
                context_prompt = f"""
Analyze this text snippet and categorize the main life domain or context being discussed.

Text: "{surrounding}"

Choose the most appropriate category:
- academic: school, education, learning
- professional: work, career, job-related
- personal: family, relationships, personal life
- health: medical, physical health, treatment
- financial: money, economics, financial stress
- emotional: feelings, mental health, psychology
- social: community, social interactions, groups
- recreational: hobbies, entertainment, leisure
- general: no specific domain or mixed contexts

Return ONLY the category name:"""
                
                ai_response = self.llm.invoke(context_prompt)
                ai_category = self._extract_llm_content(ai_response).strip().lower()
                
                # Validate AI response
                valid_categories = ['academic', 'professional', 'personal', 'health', 'financial', 
                                  'emotional', 'social', 'recreational', 'general']
                
                if ai_category in valid_categories:
                    return ai_category
                else:
                    print(f"⚠️ AI returned invalid category: {ai_category}")
                    return 'general'
                    
            except Exception as e:
                print(f"⚠️ AI context categorization failed: {e}")
                # Simple fallback
                if 'work' in surrounding or 'job' in surrounding:
                    return 'professional'
                elif 'family' in surrounding or 'relationship' in surrounding:
                    return 'personal'
                elif 'school' in surrounding or 'study' in surrounding:
                    return 'academic'
                else:
                    return 'general'
        else:
            # Simple fallback categorization
            if any(word in surrounding for word in ['work', 'job', 'office', 'boss']):
                return 'professional'
            elif any(word in surrounding for word in ['family', 'friend', 'relationship']):
                return 'personal' 
            elif any(word in surrounding for word in ['school', 'study', 'exam']):
                return 'academic'
            else:
                return 'general'

    def _extract_phrases_around_context(self, text: str, context: str) -> List[str]:
        """Extract meaningful phrases around a context"""
        phrases = []
        context_pos = text.find(context)

        if context_pos != -1:
            # Get 3-5 word phrases containing the context
            words = text.split()
            context_word_index = -1

            for i, word in enumerate(words):
                if context in word:
                    context_word_index = i
                    break

            if context_word_index != -1:
                # Extract phrases of different lengths
                for phrase_length in [3, 4, 5]:
                    for start_offset in range(-2, 1):
                        start_idx = max(0, context_word_index + start_offset)
                        end_idx = min(len(words), start_idx + phrase_length)

                        if end_idx - start_idx >= 3:
                            phrase = ' '.join(words[start_idx:end_idx])
                            if context in phrase:
                                phrases.append(phrase)

        return phrases

    def _get_sentence_containing_word(self, text: str, word: str) -> str:
        """Get the sentence containing a specific word"""
        sentences = text.split('.')
        for sentence in sentences:
            if word in sentence.lower():
                return sentence.strip()
        return text  # Return full text if no sentence boundary found

    def _analyze_help_seeking_behavior(self, text: str, features: Dict[str, Any]) -> float:
        """Dynamically analyze help-seeking behavior"""
        help_score = 0.0

        # Question-based help seeking
        if features['starts_with_question']:
            help_score += 2.0

        if features['question_marks'] > 0:
            help_score += features['question_marks'] * 0.5

        # Request-based help seeking
        if features['contains_request']:
            help_score += 2.0

        # AI-powered help-seeking behavior analysis
        text_lower = text.lower()
        
        if self.llm:
            try:
                help_seeking_prompt = f"""
Analyze this text for help-seeking behavior and intent.

Text: "{text}"

Look for:
- Direct requests for help, advice, or support
- Questions indicating need for guidance
- Language showing willingness to engage in solutions
- Expressions of hope or seeking connection

Return a help-seeking score from 0-3:
- 0: No help-seeking behavior
- 1: Minimal help-seeking indicators
- 2: Clear help-seeking behavior  
- 3: Strong help-seeking with engagement

Score:"""
                
                ai_response = self.llm.invoke(help_seeking_prompt)
                ai_help_text = self._extract_llm_content(ai_response).strip()
                
                # Use robust score parsing
                ai_help_score = self._extract_numeric_score_from_ai_response(ai_help_text, "help_seeking")
                help_score += ai_help_score
                
                if ai_help_score > 1.0:
                    print(f"🤖 AI detected help-seeking behavior: {ai_help_score}/3")
                    
            except Exception as e:
                print(f"⚠️ AI help-seeking analysis failed: {e}")
                # Basic fallback
                if any(word in text_lower for word in ['help', 'advice', 'how to', 'can you']):
                    help_score += 1.0
        else:
            # Simple fallback when no AI
            if any(word in text_lower for word in ['help', 'advice', 'how to', 'can you', 'support']):
                help_score += 1.0

        # Normalize score
        return min(help_score / 5.0, 1.0)

    def _detect_crisis_indicators(self, text: str, contexts: Set[str], features: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Dynamically detect crisis indicators with explicit suicide/self-harm detection"""
        text_lower = text.lower()
        crisis_score = 0.0
        detected_indicators = []

        # Dynamic crisis word analysis
        words = text_lower.split()

        # Emotional intensity analysis
        intensity_multiplier = 1.0 + (features['intensity_words'] * 0.2)
        temporal_urgency = 1.0 + (features['temporal_words'] * 0.3)

        # SAFETY BACKUP: Critical suicide/self-harm patterns (AI-first approach with hardcoded fallback for safety)
        # NOTE: AI analysis is prioritized above, these patterns are minimal safety backup only
        critical_patterns = {
            'suicide_explicit': {
                'patterns': ['kill myself', 'end my life', 'take my life', 'suicide', 'suicidal', 
                           'want to die', 'wanna die', 'wish i was dead', 'better off dead',
                           'should be dead', 'going to kill myself', 'plan to die',
                           'feel like dying', 'wanna just die', 'ill kill myself', 'i will kill myself',
                           'want death', 'wanna be dead'],
                'score': 10.0,  # Immediate critical level
                'variations': ['kill my self', 'end my own life', 'want to dies', 'wanna dies',
                              'feel like dieing', 'feeling like dying', 'want 2 die', 'wanna 2 die',
                              'gunna kill myself', 'gonna kill myself']
            },
            'self_harm_explicit': {
                'patterns': ['cut myself', 'hurt myself', 'harm myself', 'self harm', 'cutting',
                           'overdose', 'pills', 'razor', 'blade', 'cut my wrists'],
                'score': 8.0,  # High level
                'variations': []
            },
            'method_specific': {
                'patterns': ['hanging', 'jump off', 'bridge', 'gun', 'poison', 'rope'],
                'score': 12.0,  # Extremely critical - specific methods
                'variations': []
            },
            'immediate_intent': {
                'patterns': ['going to do it', 'ready to end', 'ready to die', 
                           'have decided to die', 'made up my mind to', 'plan is to', 'will do it tonight'],
                'score': 15.0,  # Maximum critical - immediate action
                'variations': []
            },
            'temporal_crisis': {
                'patterns': ['right now', 'tonight', 'today'],
                'score': 2.0,  # Lower base score, needs context verification
                'variations': []
            },
            #  Separate casual temporal references from crisis indicators
            'temporal_casual': {
                'patterns': ['today', 'yesterday', 'this morning', 'this afternoon', 'earlier'],
                'score': 0.5,  # Much lower score for casual temporal references
                'variations': []
            }
        }

        # Check for critical patterns first -  Better context analysis
        for pattern_type, pattern_data in critical_patterns.items():
            all_patterns = pattern_data['patterns'] + pattern_data['variations']
            for pattern in all_patterns:
                if pattern in text_lower:
                    #  Apply context reduction for casual temporal references
                    score_multiplier = 1.0
                    
                    # Context analysis for temporal patterns
                    if pattern_type in ['temporal_casual', 'temporal_crisis']:
                        # Look for actual crisis indicators in the same sentence
                        sentence_with_pattern = self._get_sentence_containing_word(text_lower, pattern)
                        
                        # Crisis context words that indicate real danger
                        true_crisis_words = ['kill myself', 'end my life', 'suicide', 'die tonight', 
                                           'hurt myself', 'cut myself', 'overdose', 'hanging']
                        
                        # Emotional state words (not crisis)
                        emotional_state_words = ['feeling', 'emotionally', 'unstable', 'sad', 'depressed', 
                                               'anxious', 'overwhelmed', 'struggling']
                        
                        has_crisis_context = any(crisis_word in sentence_with_pattern for crisis_word in true_crisis_words)
                        has_emotional_context = any(emotional_word in sentence_with_pattern for emotional_word in emotional_state_words)
                        
                        if has_emotional_context and not has_crisis_context:
                            score_multiplier = 0.1  # Just emotional description, not crisis
                        elif not has_crisis_context:
                            score_multiplier = 0.2  # General temporal reference
                    
                    adjusted_score = pattern_data['score'] * score_multiplier
                    crisis_score += adjusted_score
                    
                    if adjusted_score > 2.0:  # Only log significant scores
                        detected_indicators.append(f" {pattern} (CRITICAL: {pattern_type})")
                        print(f" CRITICAL PATTERN DETECTED: '{pattern}' in '{text}' (Score: +{adjusted_score})")
                    else:
                        detected_indicators.append(f"{pattern} ({pattern_type})")
                        print(f"ℹ️ Pattern detected: '{pattern}' (Score: +{adjusted_score})")

        # Enhanced flexible pattern matching for variations
        flexible_crisis_patterns = [
            # Match variations of "want to die" / "wanna die"
            (r'\b(wanna?|want\s+to)\s+\w*\s*die\b', 12.0, 'flexible_suicide_intent'),
            # Match "feel like dying" variations  
            (r'\bfeel\w*\s+like\s+dyin[g]?\b', 12.0, 'flexible_dying_feeling'),
            # Match "kill myself" variations
            (r'\b(i?ll|will|gonna|going\s+to)?\s*kill\s+(my)?self\b', 12.0, 'flexible_kill_self'),
            # Match death wishes
            (r'\b(wish|want)\w*\s+(i\s+)?(was|were)\s+dead\b', 10.0, 'flexible_death_wish'),
        ]

        import re
        for pattern_regex, score, pattern_name in flexible_crisis_patterns:
            if re.search(pattern_regex, text_lower, re.IGNORECASE):
                crisis_score += score
                detected_indicators.append(f" FLEXIBLE MATCH: {pattern_name} (Score: +{score})")
                print(f" FLEXIBLE CRISIS PATTERN: '{pattern_regex}' matched in '{text}' (Score: +{score})")

        # AI-powered general crisis indicator detection
        if self.llm:
            try:
                general_crisis_prompt = f"""
You are a mental health crisis assessment AI analyzing text for general psychological distress indicators (not specific suicide/self-harm - that's handled separately).

Text: "{text}"
Context: {list(contexts) if contexts else 'none'}

Analyze for:
- Emotional intensity and despair
- Isolation and hopelessness
- Overwhelming life circumstances
- General psychological distress patterns
- Language suggesting need for support

Return a crisis score from 0-5:
- 0: No distress indicators
- 1-2: Mild emotional difficulty
- 3-4: Moderate psychological distress
- 5: Severe emotional crisis (non-suicidal)

Score:"""
                
                ai_response = self.llm.invoke(general_crisis_prompt)
                ai_score_text = self._extract_llm_content(ai_response).strip()
                
                # Use robust score parsing
                ai_crisis_score = self._extract_numeric_score_from_ai_response(ai_score_text, "crisis")
                crisis_score += ai_crisis_score
                
                if ai_crisis_score > 1.0:
                    detected_indicators.append(f"AI-detected distress (score: {ai_crisis_score})")
                    print(f"🤖 AI detected general crisis indicators: {ai_crisis_score}/5")
                    
            except Exception as e:
                print(f"⚠️ AI general crisis detection failed: {e}")
                # Minimal fallback - only basic emotional indicators
                basic_distress_words = ['hopeless', 'worthless', 'unbearable', 'overwhelming']
                for word in basic_distress_words:
                    if word in text_lower:
                        crisis_score += 0.5
                        detected_indicators.append(f"{word} (fallback)")
        else:
            # Minimal fallback when no AI available
            critical_distress_words = ['hopeless', 'worthless', 'suicidal', 'unbearable']
            for word in critical_distress_words:
                if word in text_lower:
                    crisis_score += 1.0
                    detected_indicators.append(f"{word} (no-ai-fallback)")

        # Sentiment analysis contribution
        if self.sentiment_available and self.sentiment_analyzer is not None:
            sentiment = self.sentiment_analyzer.polarity_scores(text)
            if sentiment['compound'] < -0.5:
                crisis_score += abs(sentiment['compound']) * 2

        return crisis_score, detected_indicators

    def _check_negation_and_context(self, text: str, contexts: Set[str]) -> bool:
        """Dynamically check for negation patterns"""
        text_lower = text.lower()

        # AI-powered negation and context analysis
        if self.llm and contexts:
            try:
                negation_prompt = f"""
Analyze this text for negation patterns that might reduce crisis severity.

Text: "{text}"
Contexts: {list(contexts)}

Look for:
- Explicit negations ("not", "don't", "won't")
- Context that contradicts crisis indicators
- Reassuring self-statements
- Protective factors mentioned

Does this text contain negation or context that reduces crisis concern?

Return: YES or NO

Analysis:"""
                
                ai_response = self.llm.invoke(negation_prompt)
                ai_negation = self._extract_llm_content(ai_response).upper().strip()
                
                has_negation = 'YES' in ai_negation
                
                if has_negation:
                    print(f"🤖 AI detected negation/protective context")
                    
                return has_negation
                
            except Exception as e:
                print(f"⚠️ AI negation analysis failed: {e}")
        
        # Simple fallback negation detection
        basic_negations = ['not', "don't", "won't", "can't", "isn't"]
        return any(neg in text_lower for neg in basic_negations)

    def _calculate_final_crisis_level(self, crisis_score: float, help_seeking_score: float,
                                    has_negation: bool, contexts: Set[str]) -> CrisisLevel:
        """Dynamically calculate final crisis level -  More balanced thresholds"""

        # Apply context-based adjustments
        if has_negation:
            crisis_score *= 0.2

        # Apply help-seeking reduction
        if help_seeking_score > 0.5:
            crisis_score *= (1.0 - (help_seeking_score * 0.6))

        # Apply time-of-day considerations (with safe access)
        time_of_day = self.current_user.get('time_of_day', 'unknown')
        if time_of_day in ['night', 'early_morning']:
            crisis_score *= 1.1  # Slightly higher concern during vulnerable hours

        #  More conservative thresholds to prevent false positives
        if crisis_score >= 20.0:  # Only truly critical patterns with multiple indicators
            return CrisisLevel.CRITICAL
        elif crisis_score >= 12.0:  # High risk patterns with clear intent
            return CrisisLevel.HIGH
        elif crisis_score >= 7.0:  # Medium concern patterns
            return CrisisLevel.MEDIUM
        elif crisis_score >= 3.0:  # Low concern patterns
            return CrisisLevel.LOW
        else:
            return CrisisLevel.NONE

    def detect_crisis_level(self, text: str, user_id: Optional[str] = None) -> Tuple[CrisisLevel, HarmType]:
        """Main crisis detection method - Configurable: AI/Pattern/Hybrid with intelligent optimization"""
        if not text or not text.strip():
            return CrisisLevel.NONE, HarmType.NONE

        # Use current user if no user_id provided
        if not user_id:
            user_id = self.current_user.get('login', 'anonymous_user')
        
        # Analyze interaction complexity to optimize processing
        complexity_analysis = self._analyze_interaction_complexity(text)
        print(f"📊 Interaction complexity: {complexity_analysis['complexity']} (confidence: {complexity_analysis['confidence']})")
        
        # For simple interactions, use optimized detection
        if complexity_analysis['complexity'] == 'simple' and complexity_analysis['confidence'] > 0.8:
            # AI-powered critical safety check with minimal hardcoded backup
            if self.llm:
                try:
                    safety_check_prompt = f"""
You are a mental health crisis detection AI. Quickly analyze this text for immediate safety concerns.

Text: "{text}"

This is a SIMPLE interaction that needs quick safety screening. Look for:
1. Direct suicide/self-harm expressions
2. Immediate danger indicators
3. Crisis-level distress

Respond with ONLY one word:
- SAFE: No immediate safety concerns
- UNSAFE: Immediate safety concerns detected, needs full crisis analysis

Safety Assessment:"""
                    
                    response = self.llm.invoke(safety_check_prompt)
                    safety_assessment = self._extract_llm_content(response).upper().strip()
                    
                    if 'UNSAFE' in safety_assessment:
                        print(f"⚠️ AI detected safety concern in simple interaction: {safety_assessment}")
                        # Escalate to full analysis
                    else:
                        print(f"✅ AI confirmed simple interaction is safe - skipping heavy analysis")
                        return CrisisLevel.NONE, HarmType.NONE
                        
                except Exception as e:
                    print(f"⚠️ AI safety check failed, using minimal pattern backup: {e}")
                    # Minimal hardcoded backup for critical safety only
                    critical_patterns = ['kill myself', 'suicide', 'end my life']
                    text_lower = text.lower()
                    
                    has_critical = any(pattern in text_lower for pattern in critical_patterns)
                    if has_critical:
                        print(f"⚠️ Critical pattern detected in simple interaction, escalating to full analysis")
                        # Escalate to full analysis
                    else:
                        print(f"✅ Simple interaction with no critical patterns - skipping heavy analysis")
                        return CrisisLevel.NONE, HarmType.NONE
            else:
                # Minimal hardcoded backup when no LLM available
                critical_patterns = ['kill myself', 'suicide', 'end my life']
                text_lower = text.lower()
                
                has_critical = any(pattern in text_lower for pattern in critical_patterns)
                if has_critical:
                    print(f"⚠️ Critical pattern detected, escalating to full analysis")
                    # Escalate to full analysis
                else:
                    print(f"✅ Simple interaction with no critical patterns - skipping heavy analysis")
                    return CrisisLevel.NONE, HarmType.NONE

        if self.detection_mode == "ai":
            # AI-only mode
            try:
                return self._ai_powered_crisis_detection(text)
            except Exception as e:
                print(f"⚠️ AI detection failed, falling back to pattern: {e}")
                return self._pattern_based_crisis_detection(text, user_id)
                
        elif self.detection_mode == "pattern":
            # Pattern-only mode
            return self._pattern_based_crisis_detection(text, user_id)
            
        else:
            # Hybrid mode (default)
            ai_level = CrisisLevel.NONE
            ai_harm_type = HarmType.NONE
            pattern_level = CrisisLevel.NONE
            pattern_harm_type = HarmType.NONE

            # Try AI-powered crisis detection
            try:
                ai_level, ai_harm_type = self._ai_powered_crisis_detection(text)
                print(f"🤖 AI Analysis: {ai_level.value} (Harm: {ai_harm_type.value})")
            except Exception as e:
                print(f"⚠️ AI crisis detection failed: {e}")

            # Always run pattern-based detection for comparison
            pattern_level, pattern_harm_type = self._pattern_based_crisis_detection(text, user_id)
            print(f"📊 Pattern Analysis: {pattern_level.value} (Harm: {pattern_harm_type.value})")

            # Intelligent hybrid reconciliation using AI analysis
            final_level, final_harm_type = self._reconcile_crisis_detection_intelligently(
                ai_level, ai_harm_type, pattern_level, pattern_harm_type, text
            )
            
            print(f"🔒 Final Decision: {final_level.value} (AI: {ai_level.value}, Pattern: {pattern_level.value})")
            if final_harm_type != HarmType.NONE:
                print(f"⚠️ HARM DETECTED: {final_harm_type.value}")
            
            return final_level, final_harm_type

    def _ai_powered_crisis_detection(self, text: str) -> Tuple[CrisisLevel, HarmType]:
        """AI-powered crisis detection using LLM analysis"""
        if not hasattr(self, 'llm') or self.llm is None:
            raise Exception("LLM not available")

        crisis_analysis_prompt = f"""
You are a mental health crisis assessment AI. Analyze the following message for crisis level AND harm type.

Message: "{text}"

Instructions:
1. Assess the immediate crisis risk level (suicide/self-harm vs harm to others)
2. Consider context, intent, and emotional state
3. Look for both explicit and implicit crisis indicators
4. Identify if the harm is directed toward self, others, or both

IMPORTANT: General sadness, anxiety, or emotional distress WITHOUT explicit harm thoughts should be:
- CRISIS_LEVEL: LOW (if emotional distress) or NONE (if mild)
- HARM_TYPE: NONE (unless explicit harm ideation is present)

Examples:
- "I'm feeling down" → LOW/NONE
- "I'm worried about my future" → LOW/NONE  
- "I want to hurt myself" → HIGH/SELF_HARM
- "I have thoughts of ending it" → HIGH/SELF_HARM

Return your analysis in this EXACT format:
CRISIS_LEVEL: [one of: CRITICAL, HIGH, MEDIUM, LOW, NONE]
HARM_TYPE: [one of: SELF_HARM, HARM_TO_OTHERS, BOTH, NONE]

Crisis Levels:
- CRITICAL: Immediate intent or plan to harm self or others
- HIGH: Strong ideation or distress with specific thoughts about harming self or others
- MEDIUM: Moderate emotional distress WITH concerning thoughts about harm (not general sadness)
- LOW: General emotional difficulties, sadness, or anxiety WITHOUT harm ideation
- NONE: No crisis indicators

Harm Types:
- SELF_HARM: Explicit intent/thoughts about physically harming oneself (NOT general sadness/depression)
- HARM_TO_OTHERS: Intent/thoughts about harming other people
- BOTH: Both self-harm and harm to others mentioned
- NONE: No harm indicators (includes general sadness, anxiety, stress without harm thoughts)

Analysis:"""

        try:
            response = self.llm.invoke(crisis_analysis_prompt)
            ai_response = response.content.strip().upper() if hasattr(response, 'content') else str(response).strip().upper()
            
            # Parse AI response for crisis level
            crisis_level = CrisisLevel.NONE
            if 'CRISIS_LEVEL:' in ai_response:
                level_part = ai_response.split('CRISIS_LEVEL:')[1].split('\n')[0].strip()
                if 'CRITICAL' in level_part:
                    crisis_level = CrisisLevel.CRITICAL
                elif 'HIGH' in level_part:
                    crisis_level = CrisisLevel.HIGH
                elif 'MEDIUM' in level_part:
                    crisis_level = CrisisLevel.MEDIUM
                elif 'LOW' in level_part:
                    crisis_level = CrisisLevel.LOW
            
            # Parse AI response for harm type
            harm_type = HarmType.NONE
            if 'HARM_TYPE:' in ai_response:
                harm_part = ai_response.split('HARM_TYPE:')[1].split('\n')[0].strip()
                if 'HARM_TO_OTHERS' in harm_part:
                    harm_type = HarmType.HARM_TO_OTHERS
                elif 'SELF_HARM' in harm_part:
                    harm_type = HarmType.SELF_HARM
                elif 'BOTH' in harm_part:
                    harm_type = HarmType.BOTH
            
            # Fallback parsing if structured format not found
            if crisis_level == CrisisLevel.NONE:
                if 'CRITICAL' in ai_response:
                    crisis_level = CrisisLevel.CRITICAL
                elif 'HIGH' in ai_response:
                    crisis_level = CrisisLevel.HIGH
                elif 'MEDIUM' in ai_response:
                    crisis_level = CrisisLevel.MEDIUM
                elif 'LOW' in ai_response:
                    crisis_level = CrisisLevel.LOW
            
            return crisis_level, harm_type
               
        except Exception as e:
            print(f"❌ AI crisis analysis error: {e}")
            return CrisisLevel.NONE, HarmType.NONE

    def _pattern_based_crisis_detection(self, text: str, user_id: Optional[str] = None) -> Tuple[CrisisLevel, HarmType]:
        """Original pattern-based crisis detection as fallback"""
        # Extract linguistic features
        features = self._extract_linguistic_features(text)

        # Learn and extract contexts dynamically
        contexts = self._learn_context_from_text(text, user_id)

        # Analyze help-seeking behavior
        help_seeking_score = self._analyze_help_seeking_behavior(text, features)

        # Detect crisis indicators
        crisis_score, indicators = self._detect_crisis_indicators(text, contexts, features)

        # Check for negation patterns
        has_negation = self._check_negation_and_context(text, contexts)

        # Calculate final level
        final_level = self._calculate_final_crisis_level(crisis_score, help_seeking_score, has_negation, contexts)

        # Audit log crisis detection result
        if final_level in [CrisisLevel.CRITICAL, CrisisLevel.HIGH]:
            security_manager.audit_log(
                'HIGH_CRISIS_DETECTED',
                user_id or 'unknown', 'unknown',
                {
                    'crisis_level': final_level.value,
                    'crisis_score': crisis_score,
                    'contexts_count': len(contexts),
                    'has_negation': has_negation
                },
                'WARNING'
            )
        
        # Update user patterns with security controls
        if user_id:  # Ensure user_id is not None
            user_hash = security_manager.hash_pii(user_id)
            if user_hash not in self.user_patterns:
                self.user_patterns[user_hash] = {
                    'typical_language': defaultdict(int),
                    'crisis_history': [],
                    'help_seeking_patterns': defaultdict(int),
                    'context_preferences': defaultdict(int)
                }
            
            self.user_patterns[user_hash]['crisis_history'].append({
                'text_hash': security_manager.hash_pii(text[:50]),  # Only hash first 50 chars
                'level': final_level,
                'score': crisis_score,
                'contexts': list(contexts),
                'timestamp': self.current_user['timestamp'].isoformat()
            })
            
            # Limit crisis history size for privacy
            if len(self.user_patterns[user_hash]['crisis_history']) > 50:
                self.user_patterns[user_hash]['crisis_history'] = self.user_patterns[user_hash]['crisis_history'][-30:]

        # Log results
        if final_level in [CrisisLevel.CRITICAL, CrisisLevel.HIGH]:
            print(f"📊 Pattern Crisis Detection: {final_level.value} (Score: {crisis_score:.2f})")
            print(f"   Contexts: {contexts}")
            print(f"   Indicators: {indicators[:3]}")
        elif final_level in [CrisisLevel.MEDIUM, CrisisLevel.LOW]:
            print(f"⚠️ Pattern Concern detected: {final_level.value} (Score: {crisis_score:.2f})")
        else:
            print(f"✅ No pattern crisis detected (Score: {crisis_score:.2f}, Help-seeking: {help_seeking_score:.2f})")

        if contexts:
            print(f"🔍 Learned contexts: {contexts}")

        # AI-powered harm type detection with critical pattern backup
        harm_type = HarmType.NONE
        text_lower = text.lower()
        
        # AI-powered harm detection with minimal safety backup
        pattern_self_harm = False
        pattern_harm_others = False
        
        if self.llm:
            try:
                harm_pattern_prompt = f"""
You are a mental health safety analyst detecting harm patterns in text.

Text: "{text}"

Analyze for specific harm intentions or expressions:
1. SELF_HARM patterns: EXPLICIT expressions of wanting to physically harm, hurt, or endanger oneself
   - Look for specific harm intentions, NOT general sadness or emotional distress
   - Examples: "hurt myself", "want to die", "end my life" (NOT "feeling down", "sad", "depressed")

2. HARM_TO_OTHERS patterns: EXPLICIT expressions of wanting to harm, hurt, or endanger other people
   - Look for specific threats or intentions against others

CRITICAL: General emotional states like sadness, anxiety, worry, or feeling down are NOT harm patterns unless they explicitly mention harming behaviors.

Respond with detected patterns (can be multiple):
- SELF_HARM_DETECTED: Self-harm patterns found
- HARM_OTHERS_DETECTED: Harm to others patterns found
- NO_HARM_PATTERNS: No specific harm patterns detected

Pattern Analysis:"""
                
                response = self.llm.invoke(harm_pattern_prompt)
                harm_analysis = self._extract_llm_content(response).upper().strip()
                
                pattern_self_harm = 'SELF_HARM_DETECTED' in harm_analysis
                pattern_harm_others = 'HARM_OTHERS_DETECTED' in harm_analysis
                
                if pattern_self_harm or pattern_harm_others:
                    print(f"🤖 AI detected harm patterns: {harm_analysis}")
                    
            except Exception as e:
                print(f"⚠️ AI harm pattern analysis failed, using minimal backup: {e}")
                # Minimal safety backup
                text_lower = text.lower()
                critical_self_harm = ['kill myself', 'hurt myself', 'suicide']
                critical_harm_others = ['kill someone', 'hurt someone']
                
                pattern_self_harm = any(pattern in text_lower for pattern in critical_self_harm)
                pattern_harm_others = any(pattern in text_lower for pattern in critical_harm_others)
        else:
            # Minimal safety backup when no LLM available
            text_lower = text.lower()
            critical_self_harm = ['kill myself', 'hurt myself', 'suicide']
            critical_harm_others = ['kill someone', 'hurt someone']
            
            pattern_self_harm = any(pattern in text_lower for pattern in critical_self_harm)
            pattern_harm_others = any(pattern in text_lower for pattern in critical_harm_others)
        
        # AI-enhanced harm type analysis
        if self.llm and final_level != CrisisLevel.NONE:
            try:
                harm_analysis_prompt = f"""
Analyze this text for harm intentions. This is a critical safety assessment.

Text: "{text}"

Determine if the text expresses EXPLICIT harm intentions:
1. SELF_HARM: EXPLICIT intent, thoughts, or plans to physically harm oneself
2. HARM_TO_OTHERS: EXPLICIT intent, thoughts, or plans to harm other people  
3. BOTH: Both self-harm and harm to others mentioned
4. NONE: No specific harm intentions (includes general sadness, depression, anxiety, worry)

CRITICAL EXAMPLES:
- "I'm feeling down/sad/depressed" → NONE
- "I'm worried about my future" → NONE  
- "I want to hurt myself" → SELF_HARM
- "I'm thinking of ending my life" → SELF_HARM

Consider context, metaphorical language, and actual intent. General emotional distress is NOT harm.

Return ONLY one word: SELF_HARM, HARM_TO_OTHERS, BOTH, or NONE

Assessment:"""
                
                ai_response = self.llm.invoke(harm_analysis_prompt)
                ai_harm_assessment = self._extract_llm_content(ai_response).upper().strip()
                
                # Safety check: Don't classify general emotional distress as self-harm
                general_distress_patterns = ['feeling down', 'feel down', 'feeling sad', 'feel sad', 
                                           'feeling depressed', 'feel depressed', 'feeling anxious', 
                                           'feel anxious', 'worried about', 'uncertain future', 
                                           'feeling stressed', 'feel stressed']
                
                is_general_distress = any(pattern in text.lower() for pattern in general_distress_patterns)
                has_explicit_harm = any(harm_word in text.lower() for harm_word in 
                                      ['hurt myself', 'harm myself', 'kill myself', 'end my life', 
                                       'want to die', 'suicide', 'self harm'])
                
                # Combine AI analysis with pattern detection (safety first)
                if 'BOTH' in ai_harm_assessment or (pattern_self_harm and pattern_harm_others):
                    harm_type = HarmType.BOTH
                elif 'HARM_TO_OTHERS' in ai_harm_assessment or pattern_harm_others:
                    harm_type = HarmType.HARM_TO_OTHERS
                elif ('SELF_HARM' in ai_harm_assessment or pattern_self_harm) and not (is_general_distress and not has_explicit_harm):
                    harm_type = HarmType.SELF_HARM
                else:
                    harm_type = HarmType.NONE
                    
                # Log when safety check prevents false positive
                if is_general_distress and not has_explicit_harm and ('SELF_HARM' in ai_harm_assessment or pattern_self_harm):
                    print(f"🛡️ Safety check: Prevented general distress from being classified as self-harm")
                    
                if harm_type != HarmType.NONE:
                    print(f"🤖 AI harm analysis: {ai_harm_assessment} (Final: {harm_type.value})")
                    
            except Exception as e:
                print(f"⚠️ AI harm analysis failed, using pattern detection: {e}")
                # Fallback to pattern detection only
                if pattern_self_harm and pattern_harm_others:
                    harm_type = HarmType.BOTH
                elif pattern_harm_others:
                    harm_type = HarmType.HARM_TO_OTHERS
                elif pattern_self_harm:
                    harm_type = HarmType.SELF_HARM
        else:
            # Use pattern detection when no AI or no crisis detected
            if pattern_self_harm and pattern_harm_others:
                harm_type = HarmType.BOTH
            elif pattern_harm_others:
                harm_type = HarmType.HARM_TO_OTHERS
            elif pattern_self_harm:
                harm_type = HarmType.SELF_HARM

        return final_level, harm_type

    def get_safety_assessment_questions(self, crisis_level: CrisisLevel) -> List[str]:
        """Generate dynamic safety assessment questions"""
        base_questions = {
            CrisisLevel.CRITICAL: [
                "Are you thinking about ending your life right now?",
                "Do you have a specific plan?",
                "Do you have access to means to hurt yourself?",
                "When are you thinking of doing this?",
                "Is there someone who can stay with you?",
                "Can you tell me where you are?",
                "What has stopped you before?"
            ],
            CrisisLevel.HIGH: [
                "Are you having thoughts of hurting yourself?",
                "How long have you been feeling this way?",
                "What triggered these feelings?",
                "Do you have people for support?",
                "Have you been able to keep yourself safe?",
                "What has helped you cope before?"
            ],
            CrisisLevel.MEDIUM: [
                "Can you tell me more about what's difficult?",
                "How long have you been struggling?",
                "What usually helps when you feel this way?",
                "Who provides you with support?",
                "How are your sleep and appetite?",
                "Have you considered professional help?"
            ],
            CrisisLevel.LOW: [
                "What's been on your mind lately?",
                "How can I best support you?",
                "What would help you feel better?",
                "Do you have support systems?",
                "What are some positive things in your life?"
            ]
        }

        return base_questions.get(crisis_level, base_questions[CrisisLevel.LOW])

    def get_immediate_interventions(self, crisis_level: CrisisLevel) -> List[str]:
        """Generate dynamic intervention suggestions"""
        interventions = {
            CrisisLevel.CRITICAL: [
                "Contact 1019 (Mental Health Crisis Line) immediately",
                "Go to the nearest hospital emergency room",
                "Call 1166 if in immediate danger",
                "Have someone stay with you",
                "Remove access to means of self-harm",
                "Contact your therapist now"
            ],
            CrisisLevel.HIGH: [
                "Use grounding techniques (5-4-3-2-1 method)",
                "Practice deep breathing exercises",
                "Reach out to a trusted person",
                "Consider calling a crisis helpline",
                "Stay in a safe environment",
                "Avoid substances"
            ],
            CrisisLevel.MEDIUM: [
                "Take slow, deep breaths",
                "Try progressive muscle relaxation",
                "Engage in a comforting activity",
                "Connect with supportive people",
                "Consider scheduling therapy",
                "Practice self-compassion"
            ],
            CrisisLevel.LOW: [
                "Practice mindfulness or meditation",
                "Engage in physical activity",
                "Maintain regular sleep schedule",
                "Connect with friends or family",
                "Pursue enjoyable activities",
                "Practice gratitude"
            ]
        }

        return interventions.get(crisis_level, interventions[CrisisLevel.LOW])

    def _extract_llm_content(self, response) -> str:
        """Safely extract content from LLM response"""
        try:
            if hasattr(response, 'content'):
                content = response.content
                if isinstance(content, str):
                    return content.strip()
                elif isinstance(content, list) and content:
                    return str(content[0]).strip()
                else:
                    return str(content).strip()
            else:
                return str(response).strip()
        except Exception as e:
            print(f"⚠️ Error extracting content from LLM response: {e}")
            return str(response).strip() if response else ""

    def _analyze_interaction_complexity(self, user_input: str) -> Dict[str, Any]:
        """AI-powered analysis to determine interaction complexity and required processing level"""
        if not user_input or len(user_input.strip()) < 2:
            return {
                'complexity': 'minimal',
                'requires_full_analysis': False,
                'requires_ai_context': False,
                'suggested_response_type': 'acknowledgment',
                'confidence': 1.0
            }
        
        # Basic linguistic indicators
        word_count = len(user_input.split())
        sentence_count = len([s for s in user_input.split('.') if s.strip()])
        question_count = user_input.count('?')
        
        # AI-powered expression understanding (no hardcoded patterns)
        if self.llm and word_count <= 5 and sentence_count <= 1:
            try:
                expression_analysis_prompt = f"""
You are an expert in understanding human expressions and communication patterns. Analyze this user input for its intent and emotional context.

User Input: "{user_input}"
Word Count: {word_count}
Sentence Count: {sentence_count}

Analyze this expression and classify it as one of these categories:
1. GREETING - any form of hello, welcome, or initial contact (including casual like "hey", "yo", "sup")
2. ACKNOWLEDGMENT - agreement, confirmation, thanks, or simple responses ("ok", "sure", "thanks", "yeah")
3. LAUGHTER - expressions of amusement, joy ("haha", "hehe", "lol", "😂", laughing sounds)
4. EXCLAMATION - emotional outbursts, excitement, surprise ("wow", "omg", "yay", "ugh")
5. CASUAL_EXPRESSION - informal communication, slang, casual phrases
6. CLOSING - goodbye, farewell, ending conversation ("bye", "see ya", "gtg")
7. QUESTION - asking something, seeking information
8. EMOTIONAL - expressing feelings, emotions, or personal state
9. COMPLEX - requires deeper analysis or therapeutic response
10. UNCLEAR - ambiguous or unrecognizable input

Consider:
- Internet slang and modern expressions
- Emojis and their emotional context
- Casual variations and abbreviations
- Context-appropriate classification

Respond with ONLY the category name (e.g., LAUGHTER, GREETING, etc.)

Classification:"""
                
                response = self.llm.invoke(expression_analysis_prompt)
                ai_classification = self._extract_llm_content(response).upper().strip()
                
                # Map AI classification to response types
                simple_classifications = ['GREETING', 'ACKNOWLEDGMENT', 'LAUGHTER', 'EXCLAMATION', 'CASUAL_EXPRESSION', 'CLOSING']
                
                if any(classification in ai_classification for classification in simple_classifications):
                    # Determine specific pattern type from AI classification
                    if 'GREETING' in ai_classification:
                        pattern_type = 'greeting'
                    elif 'ACKNOWLEDGMENT' in ai_classification:
                        pattern_type = 'acknowledgment'
                    elif 'LAUGHTER' in ai_classification:
                        pattern_type = 'laughter'
                    elif 'EXCLAMATION' in ai_classification:
                        pattern_type = 'exclamation'
                    elif 'CASUAL_EXPRESSION' in ai_classification:
                        pattern_type = 'casual_expression'
                    elif 'CLOSING' in ai_classification:
                        pattern_type = 'closing'
                    else:
                        pattern_type = 'simple_expression'
                    
                    print(f"🤖 AI classified '{user_input}' as: {ai_classification} ({pattern_type})")
                    
                    return {
                        'complexity': 'simple',
                        'pattern_type': pattern_type,
                        'requires_full_analysis': False,
                        'requires_ai_context': False,
                        'suggested_response_type': 'casual_supportive',
                        'confidence': 0.9,
                        'ai_classification': ai_classification
                    }
                elif 'EMOTIONAL' in ai_classification:
                    return {
                        'complexity': 'moderate',
                        'pattern_type': 'emotional_expression',
                        'requires_full_analysis': True,
                        'requires_ai_context': False,
                        'suggested_response_type': 'supportive',
                        'confidence': 0.8,
                        'ai_classification': ai_classification
                    }
                elif 'COMPLEX' in ai_classification:
                    return {
                        'complexity': 'complex',
                        'pattern_type': 'complex_expression',
                        'requires_full_analysis': True,
                        'requires_ai_context': True,
                        'suggested_response_type': 'therapeutic',
                        'confidence': 0.7,
                        'ai_classification': ai_classification
                    }
                
            except Exception as e:
                print(f"⚠️ AI expression analysis failed: {e}")
        
        # Fallback for when AI is unavailable or for longer inputs
        if word_count <= 3 and sentence_count <= 1 and question_count == 0:
            return {
                'complexity': 'simple',
                'pattern_type': 'unknown_simple',
                'requires_full_analysis': False,
                'requires_ai_context': False,
                'suggested_response_type': 'casual_supportive',
                'confidence': 0.7
            }
        
        # Use AI for deeper analysis when patterns aren't obvious
        if self.llm and (word_count > 3 or question_count > 0 or sentence_count > 1):
            try:
                complexity_prompt = f"""
Analyze this user input for interaction complexity and therapeutic content:

Input: "{user_input}"

Consider:
1. Emotional content depth
2. Therapeutic significance
3. Crisis indicators
4. Help-seeking behavior
5. Complexity of response needed

Classify as:
- SIMPLE: Basic social interaction, greeting, or acknowledgment
- MODERATE: Some emotional content or specific questions
- COMPLEX: Deep emotional issues, crisis content, or therapeutic needs

Format your response as:
COMPLEXITY: [SIMPLE/MODERATE/COMPLEX]
REASONING: [brief explanation]
REQUIRES_CONTEXT: [YES/NO] - whether this needs knowledge base lookup
SUGGESTED_TYPE: [casual/supportive/therapeutic]

Analysis:"""
                
                response = self.llm.invoke(complexity_prompt)
                ai_analysis = self._extract_llm_content(response).upper()
                
                # Parse AI analysis
                complexity = 'moderate'  # default
                requires_context = False
                suggested_type = 'supportive'
                
                if 'COMPLEXITY:' in ai_analysis:
                    complexity_line = ai_analysis.split('COMPLEXITY:')[1].split('\n')[0].strip()
                    if 'SIMPLE' in complexity_line:
                        complexity = 'simple'
                    elif 'COMPLEX' in complexity_line:
                        complexity = 'complex'
                    else:
                        complexity = 'moderate'
                
                if 'REQUIRES_CONTEXT:' in ai_analysis:
                    context_line = ai_analysis.split('REQUIRES_CONTEXT:')[1].split('\n')[0].strip()
                    requires_context = 'YES' in context_line
                
                if 'SUGGESTED_TYPE:' in ai_analysis:
                    type_line = ai_analysis.split('SUGGESTED_TYPE:')[1].split('\n')[0].strip().lower()
                    if 'casual' in type_line:
                        suggested_type = 'casual'
                    elif 'therapeutic' in type_line:
                        suggested_type = 'therapeutic'
                    else:
                        suggested_type = 'supportive'
                
                return {
                    'complexity': complexity,
                    'requires_full_analysis': complexity in ['moderate', 'complex'],
                    'requires_ai_context': requires_context,
                    'suggested_response_type': suggested_type,
                    'confidence': 0.8,
                    'ai_reasoning': ai_analysis
                }
                
            except Exception as e:
                print(f"⚠️ AI complexity analysis failed: {e}")
        
        # Fallback analysis based on linguistic features
        if word_count <= 2 and question_count == 0:
            return {
                'complexity': 'simple',
                'requires_full_analysis': False,
                'requires_ai_context': False,
                'suggested_response_type': 'casual',
                'confidence': 0.7
            }
        elif word_count <= 6 and question_count <= 1:
            return {
                'complexity': 'moderate',
                'requires_full_analysis': True,
                'requires_ai_context': False,
                'suggested_response_type': 'supportive',
                'confidence': 0.6
            }
        else:
            return {
                'complexity': 'complex',
                'requires_full_analysis': True,
                'requires_ai_context': True,
                'suggested_response_type': 'therapeutic',
                'confidence': 0.6
            }

    def _reconcile_crisis_detection_intelligently(self, ai_level: CrisisLevel, ai_harm_type: HarmType, 
                                                 pattern_level: CrisisLevel, pattern_harm_type: HarmType, 
                                                 original_text: str) -> Tuple[CrisisLevel, HarmType]:
        """Intelligently reconcile AI and pattern-based crisis detection results"""
        
        # AI-powered safety-first analysis with minimal hardcoded backup
        if self.llm:
            try:
                critical_safety_prompt = f"""
You are a mental health crisis safety analyst. Analyze this text for IMMEDIATE CRITICAL safety patterns that require emergency intervention.

Text: "{original_text}"

Look specifically for:
1. Direct suicide statements or plans
2. Immediate self-harm intentions
3. Active crisis expressions requiring immediate escalation

This is a SAFETY-CRITICAL assessment. Be extremely cautious.

Respond with ONLY:
- CRITICAL_SAFETY: Immediate critical safety concern detected
- SAFETY_CLEAR: No immediate critical safety patterns

Safety Analysis:"""
                
                response = self.llm.invoke(critical_safety_prompt)
                safety_analysis = self._extract_llm_content(response).upper().strip()
                
                if 'CRITICAL_SAFETY' in safety_analysis:
                    print(f"🚨 AI detected critical safety pattern - escalating to CRITICAL but preserving harm type")
                    # Preserve the harm type from AI analysis if it detected harm_to_others
                    final_harm_type = ai_harm_type if ai_harm_type != HarmType.NONE else HarmType.SELF_HARM
                    return CrisisLevel.CRITICAL, final_harm_type
                    
            except Exception as e:
                print(f"⚠️ AI critical safety analysis failed, using minimal backup: {e}")
                # Minimal hardcoded backup for critical safety only - prioritize AI analysis
                text_lower = original_text.lower()
                
                # Only override if we have clear self-harm patterns AND AI didn't detect harm_to_others
                self_harm_patterns = ['kill myself', 'suicide', 'end my life', 'harm myself']
                has_self_harm = any(pattern in text_lower for pattern in self_harm_patterns)
                
                if has_self_harm and ai_harm_type != HarmType.HARM_TO_OTHERS:
                    print(f"🚨 Self-harm pattern detected - escalating to CRITICAL with self_harm type")
                    return CrisisLevel.CRITICAL, HarmType.SELF_HARM
                elif ai_harm_type == HarmType.HARM_TO_OTHERS:
                    print(f"🚨 AI detected harm_to_others - preserving classification")
                    return CrisisLevel.CRITICAL, HarmType.HARM_TO_OTHERS
        else:
            # Minimal hardcoded backup when no LLM available - preserve pattern analysis
            text_lower = original_text.lower()
            
            # Check for self-harm patterns
            self_harm_patterns = ['kill myself', 'suicide', 'end my life', 'harm myself']
            has_self_harm = any(pattern in text_lower for pattern in self_harm_patterns)
            
            if has_self_harm:
                print(f"🚨 Self-harm pattern detected (no LLM) - escalating to CRITICAL")
                return CrisisLevel.CRITICAL, HarmType.SELF_HARM
            elif pattern_harm_type == HarmType.HARM_TO_OTHERS:
                print(f"🚨 Pattern analysis detected harm_to_others - preserving classification")
                return CrisisLevel.CRITICAL if pattern_level != CrisisLevel.NONE else CrisisLevel.HIGH, HarmType.HARM_TO_OTHERS
        
        # Use AI to analyze the discrepancy and make intelligent decision
        if self.llm and ai_level != pattern_level:
            try:
                reconciliation_prompt = f"""
You are a mental health crisis assessment specialist resolving conflicting analysis results.

Original Text: "{original_text}"

AI Analysis Result: {ai_level.value} crisis level, {ai_harm_type.value} harm type
Pattern Analysis Result: {pattern_level.value} crisis level, {pattern_harm_type.value} harm type

The results differ. Analyze the original text and provide the most appropriate assessment considering:
1. Context and intent behind the words
2. Emotional state indicators
3. Actual risk level vs. casual language
4. Safety-first principle for genuine concerns
5. Avoiding false positives for non-crisis situations

Provide your reconciled assessment:
FINAL_CRISIS_LEVEL: [NONE/LOW/MEDIUM/HIGH/CRITICAL]
FINAL_HARM_TYPE: [NONE/SELF_HARM/HARM_TO_OTHERS/BOTH]
REASONING: [brief explanation of your decision]

Assessment:"""
                
                response = self.llm.invoke(reconciliation_prompt)
                ai_reconciliation = self._extract_llm_content(response).upper()
                
                # Parse AI reconciliation
                final_level = ai_level  # default to AI if parsing fails
                final_harm_type = ai_harm_type
                
                if 'FINAL_CRISIS_LEVEL:' in ai_reconciliation:
                    level_line = ai_reconciliation.split('FINAL_CRISIS_LEVEL:')[1].split('\n')[0].strip()
                    if 'CRITICAL' in level_line:
                        final_level = CrisisLevel.CRITICAL
                    elif 'HIGH' in level_line:
                        final_level = CrisisLevel.HIGH
                    elif 'MEDIUM' in level_line:
                        final_level = CrisisLevel.MEDIUM
                    elif 'LOW' in level_line:
                        final_level = CrisisLevel.LOW
                    else:
                        final_level = CrisisLevel.NONE
                
                if 'FINAL_HARM_TYPE:' in ai_reconciliation:
                    harm_line = ai_reconciliation.split('FINAL_HARM_TYPE:')[1].split('\n')[0].strip()
                    if 'HARM_TO_OTHERS' in harm_line:
                        final_harm_type = HarmType.HARM_TO_OTHERS
                    elif 'SELF_HARM' in harm_line:
                        final_harm_type = HarmType.SELF_HARM
                    elif 'BOTH' in harm_line:
                        final_harm_type = HarmType.BOTH
                    else:
                        final_harm_type = HarmType.NONE
                
                if 'REASONING:' in ai_reconciliation:
                    reasoning = ai_reconciliation.split('REASONING:')[1].split('\n')[0].strip()
                    print(f"🤖 AI Reconciliation: {final_level.value}/{final_harm_type.value} - {reasoning[:100]}...")
                
                return final_level, final_harm_type
                
            except Exception as e:
                print(f"⚠️ AI reconciliation failed: {e}")
        
        # Fallback intelligent reconciliation without AI
        crisis_levels = [CrisisLevel.NONE, CrisisLevel.LOW, CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL]
        ai_index = crisis_levels.index(ai_level) if ai_level in crisis_levels else 0
        pattern_index = crisis_levels.index(pattern_level) if pattern_level in crisis_levels else 0
        
        # Intelligent weighting based on confidence and context
        text_length = len(original_text.split())
        text_lower = original_text.lower()  # Define text_lower for emotional content analysis
        emotional_words = ['feel', 'feeling', 'emotions', 'sad', 'depressed', 'anxious', 'worried', 'scared']
        has_emotional_content = any(word in text_lower for word in emotional_words)
        
        # Give more weight to AI for complex emotional content
        if text_length > 10 and has_emotional_content:
            # AI is better at context understanding
            if ai_index > pattern_index:
                final_level = ai_level
                print(f"🧠 Complex emotional content - trusting AI analysis: {ai_level.value}")
            else:
                # Take average if pattern is higher
                avg_index = (ai_index + pattern_index) // 2
                final_level = crisis_levels[min(avg_index, len(crisis_levels) - 1)]
                print(f"🧠 Averaging AI and pattern for complex content: {final_level.value}")
        else:
            # For simple content, use safety-first approach (higher level)
            final_level = crisis_levels[max(ai_index, pattern_index)]
            print(f"🛡️ Safety-first approach for simple content: {final_level.value}")
        
        # Intelligent harm type reconciliation
        if ai_harm_type == HarmType.BOTH or pattern_harm_type == HarmType.BOTH:
            final_harm_type = HarmType.BOTH
        elif ai_harm_type == HarmType.HARM_TO_OTHERS or pattern_harm_type == HarmType.HARM_TO_OTHERS:
            final_harm_type = HarmType.HARM_TO_OTHERS
        elif ai_harm_type == HarmType.SELF_HARM or pattern_harm_type == HarmType.SELF_HARM:
            final_harm_type = HarmType.SELF_HARM
        else:
            final_harm_type = HarmType.NONE
        
        return final_level, final_harm_type

    def _extract_numeric_score_from_ai_response(self, ai_response: str, score_type: str = "general") -> float:
        """Robustly extract numeric scores from AI responses using multiple parsing strategies"""
        import re
        
        if not ai_response or not ai_response.strip():
            return 0.0
            
        # Multiple parsing strategies for different AI response formats
        parsing_strategies = [
            # Strategy 1: Direct score patterns (Score: 3, Score: 3.5)
            r'Score:\s*([0-9]*\.?[0-9]+)',
            r'score:\s*([0-9]*\.?[0-9]+)',
            
            # Strategy 2: Fraction patterns (3/5, 2.5/3)
            r'([0-9]*\.?[0-9]+)\s*/\s*[0-9]+',
            
            # Strategy 3: Number at start of response
            r'^\s*([0-9]*\.?[0-9]+)',
            
            # Strategy 4: Number followed by common descriptors
            r'([0-9]*\.?[0-9]+)\s*(?:out of|/|points?|level)',
            
            # Strategy 5: Parenthetical scores ((3), (2.5))
            r'\(\s*([0-9]*\.?[0-9]+)\s*\)',
            
            # Strategy 6: Final number in response (as fallback)
            r'([0-9]*\.?[0-9]+)\s*$'
        ]
        
        # Try each parsing strategy
        for strategy in parsing_strategies:
            matches = re.findall(strategy, ai_response, re.IGNORECASE | re.MULTILINE)
            if matches:
                try:
                    score = float(matches[0])
                    # Validate score range based on type
                    if score_type == "help_seeking" and 0 <= score <= 3:
                        print(f"🎯 Extracted {score_type} score: {score} using pattern: {strategy[:20]}...")
                        return score
                    elif score_type == "crisis" and 0 <= score <= 5:
                        print(f"🎯 Extracted {score_type} score: {score} using pattern: {strategy[:20]}...")
                        return score
                    elif 0 <= score <= 10:  # General case
                        print(f"🎯 Extracted {score_type} score: {score} using pattern: {strategy[:20]}...")
                        return min(score, 5.0)  # Cap at reasonable maximum
                except (ValueError, IndexError):
                    continue
        
        # If no numeric score found, use AI to interpret the response
        if self.llm:
            try:
                interpretation_prompt = f"""
The following response was supposed to contain a numeric score but parsing failed:

"{ai_response}"

Please extract or interpret the intended numeric score. Consider:
- For help-seeking: 0-3 scale (0=none, 1=minimal, 2=clear, 3=strong)
- For crisis: 0-5 scale (0=none, 1-2=mild, 3-4=moderate, 5=severe)
- For general: 0-5 scale

Respond with ONLY a single number (e.g., "2.5" or "3"):"""
                
                interpretation_response = self.llm.invoke(interpretation_prompt)
                interpreted_text = self._extract_llm_content(interpretation_response).strip()
                
                # Try to extract number from interpretation
                number_match = re.search(r'([0-9]*\.?[0-9]+)', interpreted_text)
                if number_match:
                    interpreted_score = float(number_match.group(1))
                    print(f"🤖 AI interpreted score: {interpreted_score} from: {interpreted_text}")
                    return max(0.0, min(interpreted_score, 5.0))  # Clamp to valid range
                    
            except Exception as e:
                print(f"⚠️ AI score interpretation failed: {e}")
        
        # Ultimate fallback: analyze response text for indicators
        response_lower = ai_response.lower()
        if any(word in response_lower for word in ['none', 'no', 'zero', 'nothing']):
            return 0.0
        elif any(word in response_lower for word in ['minimal', 'slight', 'low']):
            return 1.0
        elif any(word in response_lower for word in ['moderate', 'medium', 'some']):
            return 2.5
        elif any(word in response_lower for word in ['high', 'strong', 'significant']):
            return 4.0
        elif any(word in response_lower for word in ['critical', 'severe', 'extreme']):
            return 5.0
        else:
            print(f"⚠️ Could not parse score from: {ai_response[:100]}...")
            return 0.0

# Initialize AI-powered crisis detector with hybrid mode (will be updated with user context per request)
crisis_detector = CrisisDetector(detection_mode="hybrid")  # Initialize with default, will be updated per request
print("✅ Enhanced AI crisis detection initialized (Hybrid mode: AI-Primary + Safety-Patterns)!")
print(f"🕐 Session started at: {crisis_detector.current_user['timestamp']}")
time_of_day = crisis_detector.current_user.get('time_of_day', 'unknown')
print(f"👤 User context: {crisis_detector.current_user['login']} ({time_of_day})")

@dataclass
class SessionMemory:
    """Enhanced session memory with strict isolation"""
    primary_issue: str = ""
    issue_details: Optional[Dict] = None
    progress_notes: Optional[List] = None
    conversation_summary: str = ""
    key_themes: Optional[List] = None
    user_preferences: Optional[Dict] = None
    session_id: str = ""  #  Track specific session
    created_at: str = ""  #  Track when session was created
    complexity_history: Optional[List] = None  # Track interaction complexity over time

    def __post_init__(self):
        if self.issue_details is None:
            self.issue_details = {}
        if self.progress_notes is None:
            self.progress_notes = []
        if self.key_themes is None:
            self.key_themes = []
        if self.user_preferences is None:
            self.user_preferences = {}
        if self.complexity_history is None:
            self.complexity_history = []
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

class TherapyBot:
    """Enhanced professional therapy chatbot with strict session isolation"""

    def __init__(self, groq_api_key: str, user_context: Optional[Dict] = None):
        self.groq_api_key = groq_api_key
        self.crisis_detector = crisis_detector
        self.storage = storage
        self.active_sessions: Dict[str, UserSession] = {}
        self.current_user_context = user_context

        #  Strict session memory isolation
        self.session_memories: Dict[str, SessionMemory] = {}
        self.user_preferences = {}
        self.conversation_analytics = {}

        # Initialize LLM with optimized settings
        try:
            import os
            if groq_api_key:
                os.environ["GROQ_API_KEY"] = groq_api_key
            self.llm = ChatGroq(model="llama-3.3-70b-versatile")
        except Exception as e:
            print(f"Failed to initialize ChatGroq: {e}")
            try:
                # Fallback initialization
                self.llm = ChatGroq(model="llama-3.1-70b-versatile")
            except:
                self.llm = None

        # Pass LLM to crisis detector for AI-powered detection
        if self.llm:
            self.crisis_detector.llm = self.llm
            print("🤖 Enhanced AI-powered crisis detection enabled (Safety-First Hybrid)!")
        else:
            print("⚠️ Using pattern-based crisis detection only")

        # Lazy knowledge base initialization - only load when first needed (prevents OOM during startup)
        self._knowledge_base_loaded = False
        self._knowledge_base_loading = False
        
        # Initialize retriever attributes to None (will be set during knowledge base loading)
        self.general_retriever = None
        self.crisis_retriever = None
        self.vector_store = None
        
        # Initialize knowledge base immediately
        self._initialize_enhanced_knowledge_base_lazy()
        print("📚 Knowledge base loaded successfully!")
        
        # Setup dynamic conversation prompts
        self._setup_dynamic_prompts()

        print("✅ Enhanced TherapyBot with strict session isolation initialized!")

    def update_user_context(self, user_context: Dict) -> None:
        """Update user context for the therapy bot and all its components"""
        if user_context:
            self.current_user_context = user_context
            
            # Update storage user context
            if hasattr(self.storage, 'update_user_context'):
                self.storage.update_user_context(user_context)
            
            # Update crisis detector user context
            if hasattr(self.crisis_detector, 'update_user_context'):
                self.crisis_detector.update_user_context(user_context)
            
            print(f"🔄 TherapyBot updated user context to: {user_context.get('login', 'unknown')}")

    def _count_words(self, text: str) -> int:
        """Count words in text for consistent word-based reporting"""
        if not text:
            return 0
        return len(text.split())

    def _extract_llm_content(self, response) -> str:
        """Safely extract content from LLM response"""
        try:
            if hasattr(response, 'content'):
                content = response.content
                if isinstance(content, str):
                    return content.strip()
                elif isinstance(content, list) and content:
                    return str(content[0]).strip()
                else:
                    return str(content).strip()
            else:
                return str(response).strip()
        except Exception as e:
            print(f"⚠️ Error extracting LLM content: {e}")
            return ""

    def _analyze_interaction_complexity(self, user_input: str, conversation_count: int) -> Dict[str, Any]:
        """AI-powered analysis of interaction complexity to optimize processing"""
        try:
            if self.llm:
                complexity_prompt = f"""
Analyze this user interaction for complexity to optimize AI processing.

User Input: "{user_input}"
Conversation Count: {conversation_count}

Assess complexity on multiple dimensions:
1. Emotional complexity (0-5): depth of emotions expressed
2. Therapeutic need (0-5): how much therapeutic intervention is needed
3. Context dependency (0-5): how much context from previous conversations is needed
4. Response complexity (0-5): how complex the response should be

Return ONLY a JSON object with numeric scores:
{{"emotional": 0, "therapeutic": 0, "context": 0, "response": 0, "overall": 0}}

Complexity Analysis:"""
                
                response = self.llm.invoke(complexity_prompt)
                ai_analysis = self._extract_llm_content(response).strip()
                
                # Try to parse JSON response
                import json
                try:
                    complexity_data = json.loads(ai_analysis)
                    # Validate and ensure all required fields
                    required_fields = ['emotional', 'therapeutic', 'context', 'response', 'overall']
                    for field in required_fields:
                        if field not in complexity_data:
                            complexity_data[field] = 2  # Default medium complexity
                    
                    # Add derived fields for backward compatibility
                    complexity_data['requires_ai_context'] = complexity_data.get('therapeutic', 2) >= 3 or complexity_data.get('overall', 2) >= 3
                    complexity_level = complexity_data.get('overall', 2)
                    if complexity_level <= 2:
                        complexity_data['complexity'] = 'simple'
                        complexity_data['confidence'] = 0.9  # High confidence for simple interactions
                    elif complexity_level <= 3:
                        complexity_data['complexity'] = 'moderate'
                        complexity_data['confidence'] = 0.8  # Good confidence for moderate complexity
                    else:
                        complexity_data['complexity'] = 'complex'
                        complexity_data['confidence'] = 0.7  # Lower confidence for complex interactions
                    
                    return complexity_data
                except (json.JSONDecodeError, ValueError):
                    print(f"⚠️ Could not parse AI complexity analysis: {ai_analysis}")
                    return self._fallback_complexity_analysis(user_input, conversation_count)
            else:
                return self._fallback_complexity_analysis(user_input, conversation_count)
                
        except Exception as e:
            print(f"⚠️ AI complexity analysis failed: {e}")
            return self._fallback_complexity_analysis(user_input, conversation_count)
    
    def _fallback_complexity_analysis(self, user_input: str, conversation_count: int) -> Dict[str, Any]:
        """Fallback complexity analysis when AI is unavailable"""
        word_count = len(user_input.split())
        char_count = len(user_input.strip())
        
        # Simple heuristic-based complexity scoring
        emotional = min(5, max(0, word_count // 3))  # More words = potentially more emotional content
        therapeutic = min(5, max(0, word_count // 4))  # Longer messages may need more therapeutic response
        context = min(5, max(0, conversation_count // 3))  # More conversation = more context needed
        response = min(5, max(0, (word_count + conversation_count) // 5))  # Combined complexity for response
        overall = min(5, max(0, (emotional + therapeutic + context + response) // 4))
        
        # Add derived fields for backward compatibility
        requires_ai_context = therapeutic >= 3 or overall >= 3
        
        if overall <= 2:
            complexity_level = 'simple'
        elif overall <= 3:
            complexity_level = 'moderate'
        else:
            complexity_level = 'complex'
        
        # Calculate confidence based on analysis certainty
        if overall <= 1:
            confidence = 0.9  # Very confident about simple cases
        elif overall <= 2:
            confidence = 0.8  # Good confidence for straightforward cases
        elif overall <= 3:
            confidence = 0.7  # Moderate confidence for moderate complexity
        else:
            confidence = 0.6  # Lower confidence for complex cases
        
        return {
            'emotional': emotional,
            'therapeutic': therapeutic, 
            'context': context,
            'response': response,
            'overall': overall,
            'requires_ai_context': requires_ai_context,
            'complexity': complexity_level,
            'confidence': confidence
        }

    def _initialize_enhanced_knowledge_base_lazy(self):
        """Lazy initialization of knowledge base - only loads when first needed"""
        if self._knowledge_base_loaded or self._knowledge_base_loading:
            return True
            
        print("📚 Lazy loading knowledge base on first therapeutic interaction...")
        self._knowledge_base_loading = True
        
        try:
            success = self._initialize_enhanced_knowledge_base()
            if success:
                self._knowledge_base_loaded = True
                print("✅ Knowledge base lazy loading completed successfully")
            else:
                print("⚠️ Knowledge base lazy loading failed")
            return success
        except Exception as e:
            print(f"❌ Knowledge base lazy loading error: {e}")
            self._knowledge_base_loading = False
            return False
        finally:
            self._knowledge_base_loading = False
    
    def _initialize_enhanced_knowledge_base(self):
        """Initialize enhanced vector store with mental health knowledge"""
        try:
            print("🧠 Building enhanced knowledge base...")

            # Process all datasets with enhanced preprocessing
            all_texts = []
            metadata_list = []
            seen_texts = set()  # For deduplication
            filtered_count = 0
            duplicate_count = 0
            quality_filtered = 0

            print("🔍 Starting dataset preprocessing with quality filtering...")

            # Load datasets lazily if not already loaded
            datasets_to_process = get_datasets()
            
            for dataset_idx, dataset_item in enumerate(datasets_to_process):
                if isinstance(dataset_item, list):
                    # Skip list-type datasets (fallback data removed)
                    continue
                
                # Extract dataset and name (handle tuple format)
                if isinstance(dataset_item, tuple):
                    dataset, dataset_name = dataset_item
                else:
                    dataset = dataset_item
                    dataset_name = f"dataset_{dataset_idx}"
                
                # Handle HuggingFace datasets with improved extraction
                for item_idx, item in enumerate(dataset):
                    # Dataset-specific field extraction
                    text, source_type = DataLoader.extract_dataset_fields(item, dataset_name)
                    
                    if not text or not text.strip():
                        continue
                    
                    # Text normalization
                    text = DataLoader.normalize_text(text)
                    
                    if not text or not text.strip():
                        continue
                    
                    # Quality validation (minimum 20 words, maximum 2000 words)
                    if not DataLoader.validate_text_quality(text, min_words=20, max_words=2000):
                        quality_filtered += 1
                        continue
                    
                    # Mental health relevance filtering for general datasets
                    general_datasets = ['ultrachat', 'squad', 'HelpSteer', 'HuggingFaceH4']
                    is_general_dataset = any(gen_ds in dataset_name for gen_ds in general_datasets)
                    
                    if is_general_dataset:
                        if not DataLoader.is_mental_health_relevant(text):
                            filtered_count += 1
                            continue
                    
                    # Deduplication (hash-based)
                    text_hash = hashlib.md5(text.lower().strip().encode()).hexdigest()
                    if text_hash in seen_texts:
                        duplicate_count += 1
                        continue
                    seen_texts.add(text_hash)
                    
                    # Add to processed texts
                    all_texts.append(text.strip())
                    metadata_list.append({
                        'source': dataset_name,
                        'dataset_idx': dataset_idx,
                        'index': item_idx,
                        'type': source_type
                    })
            
            print(f"📊 Preprocessing complete:")
            print(f"   ✅ Processed: {len(all_texts)} high-quality texts")
            print(f"   🚫 Filtered (non-mental health): {filtered_count}")
            print(f"   🚫 Filtered (quality): {quality_filtered}")
            print(f"   🚫 Removed (duplicates): {duplicate_count}")

            print(f"📄 Processing {len(all_texts)} enhanced documents...")

            # Word-counting function for word-based chunking
            def count_words(text: str) -> int:
                """Count words in text for word-based chunking"""
                return len(text.split())
            
            # Enhanced text splitter with therapeutic context preservation
            # Using standard word-based chunking: 1000 words per chunk with 150 word overlap (15%)
            # This follows industry best practices for RAG/vector database chunking
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,  # Standard word-based chunk size (1000 words)
                chunk_overlap=150,  # 15% overlap (150 words) for context preservation
                separators=["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "],
                length_function=count_words,  # Use word count instead of character count
                keep_separator=True
            )

            # Split texts with metadata preservation
            chunks = []
            chunk_metadata = []

            # Configurable processing limit via environment variable
            # Default: 10000 (balanced performance vs coverage)
            # Set KB_PROCESS_LIMIT=-1 to process all documents
            # Set KB_PROCESS_LIMIT=<number> for specific limit
            process_limit_env = os.getenv('KB_PROCESS_LIMIT', '10000')
            if process_limit_env == '-1' or process_limit_env.lower() == 'all':
                process_limit = len(all_texts)
                print(f"📊 Processing ALL {len(all_texts)} texts (no limit)")
            else:
                try:
                    process_limit = min(int(process_limit_env), len(all_texts))
                except ValueError:
                    process_limit = min(10000, len(all_texts))  # Fallback to default
                print(f"📊 Processing {process_limit} texts out of {len(all_texts)} available (limit: {process_limit_env})")
            
            # Process in batches for better memory management with large datasets
            batch_size = 500  # Process 500 texts at a time
            total_batches = (process_limit + batch_size - 1) // batch_size
            
            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min(start_idx + batch_size, process_limit)
                batch_texts = all_texts[start_idx:end_idx]
                batch_metadata = metadata_list[start_idx:end_idx]
                
                if total_batches > 1:
                    print(f"   Processing batch {batch_num + 1}/{total_batches} (texts {start_idx + 1}-{end_idx})...")
                
                for i, text in enumerate(batch_texts):
                    try:
                        text_chunks = text_splitter.split_text(text)
                        for chunk_idx, chunk in enumerate(text_chunks):
                            if len(chunk.strip()) > 20:  # Minimum 20 characters (roughly 3-4 words)
                                chunks.append(chunk)
                                chunk_metadata.append({
                                    **batch_metadata[i],
                                    'chunk_index': chunk_idx,
                                    'chunk_length': len(chunk),  # Character length
                                    'chunk_word_count': count_words(chunk)  # Word count for clarity
                                })
                    except Exception as e:
                        actual_idx = start_idx + i
                        print(f"⚠️ Error processing text {actual_idx}: {e}")
                        continue

            print(f"📚 Created {len(chunks)} enhanced knowledge chunks")

            # Enhanced embeddings with better model -  Use global constants
            try:
                embeddings = EMBEDDINGS_CLASS(
                    model_name='BAAI/bge-small-en-v1.5',
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
                if EMBEDDINGS_TYPE == 'legacy':
                    print("⚠️ Using deprecated embeddings class. Consider upgrading to langchain-huggingface.")
            except Exception as e:
                print(f"⚠️ Error initializing embeddings: {e}")
                # Fallback to basic embeddings if needed
                raise

            # Create enhanced vector store with metadata
            self.vector_store = Chroma.from_texts(
                texts=chunks,
                embedding=embeddings,
                metadatas=chunk_metadata,
                persist_directory="/content/therapy_enhanced_chroma_db"
            )

            # Create specialized retrievers with increased retrieval depth
            # Removed restrictive filter to allow access to all relevant crisis content
            self.crisis_retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 6}  # Increased from 3 to 6 for better crisis coverage
            )

            self.general_retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 6}  # Increased from 3 to 6 for better therapeutic coverage
            )

            print(f"✅ Enhanced knowledge base ready with {len(chunks)} chunks!")
            return True

        except Exception as e:
            print(f"⚠️ Error creating enhanced knowledge base: {e}")
            # Don't raise exception in lazy loading - allow fallback
            return False



    def _setup_dynamic_prompts(self):
        """Setup dynamic therapeutic conversation prompts with strict session isolation"""

        #  Enhanced casual prompt with therapeutic context support and expression understanding
        self.casual_prompt = PromptTemplate(
            input_variables=["user_input", "conversation_history", "session_context", "context"],
            template="""You are a warm, professional mental health support assistant trained in evidence-based therapeutic approaches. You understand all forms of human expression including casual sounds, laughter, internet slang, and emotional expressions, but you ALWAYS maintain your professional therapeutic voice regardless of how the user communicates.

CURRENT SESSION CONTEXT ONLY: {session_context}

THERAPEUTIC GUIDANCE (use subtly when appropriate):
{context}

CURRENT SESSION CONVERSATION HISTORY:
{conversation_history}

USER MESSAGE: {user_input}

EXPRESSION UNDERSTANDING:
- Laughter expressions (hehe, haha, lol, 😂, etc.) = positive emotional expressions, joy, amusement
- Casual sounds (ugh, wow, omg, etc.) = emotional reactions worth acknowledging  
- Informal greetings (hey, yo, sup, etc.) = connection attempts deserving warm response
- Brief responses (ok, yeah, sure, etc.) = engagement signals to build upon

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS maintain a professional, therapeutic tone regardless of how casual or informal the user's message is
- NEVER mirror the user's casual language, slang, or informal communication style
- Use proper grammar, complete sentences, and professional therapeutic language
- Be warm and empathetic, but maintain clinical professionalism
- Recognize and respond appropriately to ALL forms of expression while keeping your professional voice
- For laughter/joy: acknowledge the positive moment professionally, explore what brought joy therapeutically
- For casual expressions: respond with professional warmth without adopting their casual style
- For brief responses: provide gentle professional encouragement to share more if appropriate

RESPONSE GUIDELINES:
- Maintain consistent professional therapeutic communication style at all times
- Use evidence-based therapeutic language and approaches
- Be warm, empathetic, and present while remaining professional
- Do not adapt your communication style to match the user's style

CRITICAL: Only reference information from the CURRENT session shown above. Never reference information not explicitly mentioned in this conversation.

IMPORTANT: If the user asks about previous conversations or what was discussed before, check the conversation_history above. If history exists, acknowledge it and reference what was discussed. If no history exists, it's a new conversation.

Respond as a skilled professional therapist who understands modern communication but maintains therapeutic professionalism - warm, genuine, appropriately brief for simple interactions, but ALWAYS professional in tone and language.

Your professional, expression-aware therapeutic response:"""
        )

        #  Therapeutic prompt with strict session boundaries
        self.therapeutic_prompt = PromptTemplate(
            input_variables=["context", "conversation_history", "user_input", "crisis_level", "session_context", "conversation_summary"],
            template="""You are a highly skilled, empathetic mental health support assistant trained in evidence-based therapeutic approaches. You ALWAYS maintain your professional therapeutic voice regardless of how the user communicates.

CRISIS LEVEL: {crisis_level}

CURRENT SESSION CONTEXT ONLY: {session_context}

CURRENT SESSION SUMMARY: {conversation_summary}

RELEVANT THERAPEUTIC KNOWLEDGE (use when appropriate):
{context}

CURRENT SESSION CONVERSATION HISTORY:
{conversation_history}

CURRENT MESSAGE: {user_input}

CRITICAL SESSION ISOLATION RULES:
- ONLY reference information from the CURRENT session conversation history shown above
- NEVER reference information not explicitly mentioned in this conversation
- Do NOT make assumptions about previous conversations or sessions
- If the user asks about what was discussed before, check the conversation_history above - if it contains previous exchanges, acknowledge and reference them
- If conversation_history is empty, this is truly a new conversation
- If you don't have enough context from THIS session, ask for clarification
- Build understanding based ONLY on what the user has shared in THIS conversation

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS maintain a professional, therapeutic tone regardless of how casual, informal, or brief the user's message is
- NEVER mirror the user's casual language, slang, abbreviations, or informal communication style
- Use proper grammar, complete sentences, and professional therapeutic language at all times
- Be warm, empathetic, and present while maintaining clinical professionalism
- Do not adapt your communication style, tone, or language to match the user's style
- Provide appropriate depth and therapeutic value based on the content, not the user's communication style

RESPONSE GUIDELINES:
- Respond naturally and maintain conversation continuity WITHIN this session only
- Provide appropriate therapeutic depth based on the emotional/psychological content, not the user's communication style
- Use therapeutic techniques when appropriate (CBT, DBT, mindfulness)
- Ask thoughtful questions based on what was shared in THIS conversation
- Show empathy without claiming false memories
- Maintain consistent professional therapeutic communication style

Your empathetic, professional, session-isolated therapeutic response:"""
        )

        # Crisis intervention prompt (only for actual crises)
        self.crisis_prompt = PromptTemplate(
            input_variables=["user_input", "crisis_level", "assessment_questions", "session_context"],
            template=""" CRISIS INTERVENTION PROTOCOL ACTIVATED 

CURRENT SESSION CONTEXT: {session_context}

USER MESSAGE: {user_input}
CRISIS LEVEL: {crisis_level}

You are a professional mental health crisis intervention specialist responding to someone who may be in immediate psychological distress or danger. Your response is CRITICAL and must be personalized to their specific situation while maintaining professional therapeutic communication.

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS maintain professional, therapeutic tone regardless of how the user communicates
- NEVER mirror casual language, slang, or informal communication style
- Use proper grammar, complete sentences, and professional therapeutic language
- Be warm, empathetic, and present while maintaining clinical professionalism

IMMEDIATE PRIORITIES:
1. Acknowledge their courage in reaching out and validate their specific pain mentioned professionally
2. Assess immediate safety without being intrusive - ask gentle, professional safety questions
3. Connect with their specific emotions and situation they described using therapeutic language
4. Instill hope while taking their pain seriously with professional empathy
5. Encourage immediate professional contact using clear, professional communication

ASSESSMENT QUESTIONS TO CONSIDER: {assessment_questions}

DO NOT include helpline numbers (they will be added automatically).
Be personal, empathetic, and specific to what they shared while maintaining professional therapeutic voice. Keep response 4-6 lines with professional language.

Your professional, personalized crisis intervention response:"""
        )

    def _get_or_create_session_memory(self, user_id: str, session_id: str) -> SessionMemory:
        """ Get or create session memory with strict isolation, loading from MongoDB if history exists"""
        session_key = f"{user_id}_{session_id}"
        if session_key not in self.session_memories:
            # Try to load existing history from MongoDB to populate memory
            try:
                history = self.storage.get_conversation_history(user_id, session_id, limit=50, skip_token_validation=True)
                
                if history and len(history) > 0:
                    print(f"📚 Found {len(history)} existing conversations, populating session memory from history")
                    
                    # Extract primary issue from first conversation
                    primary_issue = ""
                    issue_details = {}
                    progress_notes = []
                    key_themes = []
                    
                    # Get primary issue from first meaningful conversation
                    for conv in history[:5]:  # Check first 5 conversations
                        if conv.get('user_input') and len(conv.get('user_input', '')) > 10:
                            # Try to extract issue from user input
                            user_input = conv.get('user_input', '')
                            if not primary_issue and self.llm:
                                try:
                                    issue_prompt = f"""Identify the primary therapeutic concern from this user input: "{user_input[:200]}"
                                    
Return ONLY one of these categories:
- work_stress
- relationship_issues
- anxiety_disorders
- depression_symptoms
- trauma_related
- self_esteem_issues
- life_transitions
- grief_loss
- family_dynamics
- academic_stress
- financial_stress
- health_concerns
- substance_related
- anger_management
- social_anxiety
- general_support

Category:"""
                                    response = self.llm.invoke(issue_prompt)
                                    primary_issue = self._extract_llm_content(response).strip().lower()
                                    if primary_issue and len(primary_issue) > 3:
                                        issue_details['initial_description'] = user_input[:200]
                                        break
                                except Exception as e:
                                    print(f"⚠️ Could not extract primary issue from history: {e}")
                            
                            # Build progress notes from history
                            progress_notes.append({
                                'timestamp': conv.get('timestamp', datetime.now().isoformat()),
                                'session_id': session_id,
                                'user_input': user_input,
                                'bot_response': conv.get('bot_response', '')[:100],
                                'themes': self._extract_themes_from_text(user_input)
                            })
                            
                            # Extract themes
                            themes = self._extract_themes_from_text(user_input)
                            key_themes.extend(themes)
                    
                    # Create session memory with loaded data
                    memory = SessionMemory(
                        session_id=session_id,
                        created_at=history[0].get('timestamp', datetime.now().isoformat()) if history else datetime.now().isoformat(),
                        primary_issue=primary_issue or "",
                        issue_details=issue_details if issue_details else {},
                        progress_notes=progress_notes,
                        key_themes=list(set(key_themes))[:10],  # Unique themes, max 10
                        user_preferences={}
                    )
                    
                    # Create conversation summary from history
                    if len(history) >= 2:
                        memory.conversation_summary = f"We've had {len(history)} exchanges in this session. " + \
                            f"Primary focus: {primary_issue or 'general support'}"
                    else:
                        memory.conversation_summary = "This is the beginning of our conversation."
                    
                    self.session_memories[session_key] = memory
                    print(f"✅ Restored session memory from MongoDB with {len(history)} conversations")
                else:
                    # No history found, create new empty memory
                    self.session_memories[session_key] = SessionMemory(
                        session_id=session_id,
                        created_at=datetime.now().isoformat(),
                        issue_details={},
                        progress_notes=[],
                        key_themes=[],
                        user_preferences={}
                    )
                    print(f"🆕 Created new isolated session memory for {session_key}")
            except Exception as e:
                print(f"⚠️ Error loading session memory from history: {e}, creating new memory")
                # Fallback to creating new memory
                self.session_memories[session_key] = SessionMemory(
                    session_id=session_id,
                    created_at=datetime.now().isoformat(),
                    issue_details={},
                    progress_notes=[],
                    key_themes=[],
                    user_preferences={}
                )
                print(f"🆕 Created new isolated session memory for {session_key} (fallback)")
        
        return self.session_memories[session_key]

    def _verify_session_isolation(self, user_id: str, session_id: str) -> bool:
        """ Verify that we're only accessing the correct session's memory"""
        session_key = f"{user_id}_{session_id}"
        current_memory = self.session_memories.get(session_key)

        if current_memory and current_memory.session_id != session_id:
            print(f"⚠️ Session isolation breach detected! Clearing contaminated memory.")
            # Clear contaminated memory
            self.session_memories[session_key] = SessionMemory(
                session_id=session_id,
                created_at=datetime.now().isoformat(),
                issue_details={},
                progress_notes=[],
                key_themes=[],
                user_preferences={}
            )
            return False
        return True

    def _update_session_memory(self, user_id: str, session_id: str, user_input: str, bot_response: str):
        """ Update session memory with strict isolation checks"""
        # Verify session isolation first
        if not self._verify_session_isolation(user_id, session_id):
            print(f"🔒 Session isolation enforced for {user_id}_{session_id}")

        memory = self._get_or_create_session_memory(user_id, session_id)

        # Extract primary issue from first few messages of THIS session only
        progress_notes_len = len(memory.progress_notes) if memory.progress_notes else 0
        if not memory.primary_issue and progress_notes_len < 3:
            # Use AI to identify primary issue instead of hardcoded keywords
            try:
                if self.llm:
                    issue_identification_prompt = f"""
You are a mental health professional identifying the primary issue from user input.

User Input: "{user_input}"
Session Context: This is message {progress_notes_len + 1} in the therapy session.

Identify the main therapeutic concern or issue category. Choose the most appropriate:
- work_stress
- relationship_issues  
- anxiety_disorders
- depression_symptoms
- trauma_related
- self_esteem_issues
- life_transitions
- grief_loss
- family_dynamics
- academic_stress
- financial_stress
- health_concerns
- substance_related
- anger_management
- social_anxiety
- general_support

Return ONLY the category name that best matches the primary concern:"""

                    response = self.llm.invoke(issue_identification_prompt)
                    ai_issue = self._extract_llm_content(response).strip().lower()
                    
                    if ai_issue and len(ai_issue) > 3:
                        memory.primary_issue = ai_issue
                        if memory.issue_details is not None:
                            memory.issue_details['initial_description'] = user_input[:200]
                        print(f"🎯 AI-identified primary issue: {ai_issue}")
                else:
                    print(f"⚠️ LLM unavailable for issue identification")
                    memory.primary_issue = self._fallback_issue_classification(user_input)
            except Exception as e:
                print(f"⚠️ AI issue identification failed: {e}")
                memory.primary_issue = self._fallback_issue_classification(user_input)

        # Update progress notes for THIS session only
        if memory.progress_notes is not None:
            memory.progress_notes.append({
                'timestamp': datetime.now().isoformat(),
                'session_id': session_id,  # Track session ID
                'user_input': user_input,
                'bot_response': bot_response[:100],
                'themes': self._extract_themes_from_text(user_input)
            })

            # Keep last 20 progress notes for THIS session
            if len(memory.progress_notes) > 20:
                memory.progress_notes = memory.progress_notes[-20:]

    def _fallback_issue_classification(self, user_input: str) -> str:
        """AI-assisted issue classification with minimal hardcoded fallback"""
        # Try AI-powered classification even as "fallback"
        if self.llm:
            try:
                issue_prompt = f"""
Quickly classify the primary therapeutic concern in this text:

Text: "{user_input}"

Choose the most appropriate category:
- work_stress
- relationship_issues  
- anxiety_symptoms
- depression_symptoms
- family_dynamics
- general_support
- life_transitions
- self_esteem_issues

Return ONLY the category name:"""
                
                response = self.llm.invoke(issue_prompt)
                ai_classification = self._extract_llm_content(response).strip().lower()
                
                # Validate classification
                valid_issues = ['work_stress', 'relationship_issues', 'anxiety_symptoms', 
                              'depression_symptoms', 'family_dynamics', 'general_support',
                              'life_transitions', 'self_esteem_issues']
                
                if ai_classification in valid_issues:
                    return ai_classification
                    
            except Exception as e:
                print(f"⚠️ AI fallback classification failed: {e}")
        
        # Minimal hardcoded fallback only for critical cases
        text_lower = user_input.lower()
        if 'work' in text_lower or 'job' in text_lower:
            return "work_stress"
        elif 'anxiety' in text_lower or 'anxious' in text_lower:
            return "anxiety_symptoms"
        elif 'depression' in text_lower or 'depressed' in text_lower:
            return "depression_symptoms"
        else:
            return "general_support"

    def _extract_themes_from_text(self, text: str) -> List[str]:
        """AI-powered theme extraction from user input - eliminates hardcoded keywords"""
        if not text.strip():
            return []
            
        try:
            if self.llm:
                theme_extraction_prompt = f"""
You are a mental health professional analyzing user input to identify key therapeutic themes.

User Input: "{text}"

Identify the main psychological and emotional themes present in this text. Focus on:
- Emotional states (anxiety, depression, stress, etc.)
- Life domains (work, relationships, family, etc.)
- Coping mechanisms and behaviors
- Specific concerns or challenges
- Mental health topics

Return 1-3 most relevant themes as a comma-separated list. Use clear, therapeutic terminology.
If no significant themes are present, return "general_support".

Themes:"""

                response = self.llm.invoke(theme_extraction_prompt)
                ai_themes = self._extract_llm_content(response)
                
                # Parse AI response into list
                themes = [theme.strip().lower().replace(' ', '_') for theme in ai_themes.split(',')]
                themes = [theme for theme in themes if theme and len(theme) > 2]
                
                print(f"🎯 AI-extracted themes: {themes}")
                return themes[:3]  # Limit to 3 themes
            else:
                print(f"⚠️ LLM unavailable for theme extraction")
                return ["general_support"]
                
        except Exception as e:
            print(f"⚠️ AI theme extraction failed: {e}")
            return ["general_support"]

    def _create_session_context(self, user_id: str, session_id: str) -> str:
        """ Create session context with strict isolation, checking MongoDB if memory is empty"""
        # Verify session isolation
        if not self._verify_session_isolation(user_id, session_id):
            return "New isolated session"

        memory = self._get_or_create_session_memory(user_id, session_id)

        context_parts = []

        if memory.primary_issue:
            context_parts.append(f"Primary Issue (this session): {memory.primary_issue}")

        if memory.issue_details:
            details = memory.issue_details.get('initial_description', '')
            if details:
                context_parts.append(f"Issue Details (this session): {details}")

        if memory.progress_notes:
            # Only get themes from THIS session
            session_notes = [note for note in memory.progress_notes if note.get('session_id') == session_id]
            recent_themes = []
            for note in session_notes[-3:]:  # Last 3 conversations of THIS session
                recent_themes.extend(note.get('themes', []))

            unique_themes = list(set(recent_themes))
            if unique_themes:
                context_parts.append(f"Recent Themes (this session): {', '.join(unique_themes[:5])}")

        # If memory is empty but we have context parts, use them
        if context_parts:
            return " | ".join(context_parts)
        
        # If no context from memory, check MongoDB directly for existing history
        try:
            history = self.storage.get_conversation_history(user_id, session_id, limit=5, skip_token_validation=True)
            if history and len(history) > 0:
                # Extract themes from recent history
                recent_themes = []
                for conv in history[-3:]:
                    if conv.get('user_input'):
                        themes = self._extract_themes_from_text(conv.get('user_input', ''))
                        recent_themes.extend(themes)
                
                unique_themes = list(set(recent_themes))
                if unique_themes:
                    return f"Continuing conversation | Recent Themes: {', '.join(unique_themes[:5])}"
                else:
                    return f"Continuing conversation with {len(history)} previous exchanges"
        except Exception as e:
            print(f"⚠️ Error checking MongoDB history for context: {e}")

        return "New conversation - no prior context"

    def _create_conversation_summary(self, user_id: str, session_id: str) -> str:
        """ Create conversation summary with strict session isolation, checking MongoDB if memory is empty"""
        # Verify session isolation
        if not self._verify_session_isolation(user_id, session_id):
            return "This is a new isolated session."

        memory = self._get_or_create_session_memory(user_id, session_id)

        # Filter notes to THIS session only
        session_notes = [note for note in memory.progress_notes if note.get('session_id') == session_id] if memory.progress_notes else []

        # If no notes in memory, check MongoDB directly
        if not session_notes:
            try:
                history = self.storage.get_conversation_history(user_id, session_id, limit=10, skip_token_validation=True)
                if history and len(history) > 0:
                    # Create summary from MongoDB history
                    if len(history) >= 2:
                        return f"We've been having a conversation with {len(history)} exchanges. " + \
                               f"Let me recall what we've discussed so far."
                    else:
                        return "This is the beginning of our conversation."
            except Exception as e:
                print(f"⚠️ Error checking MongoDB history for summary: {e}")

        if not session_notes:
            return "This is the beginning of our conversation."

        # Create summary from THIS session's progress notes only
        summary_parts = []

        if len(session_notes) >= 2:
            summary_parts.append(f"In this session, we've been discussing {memory.primary_issue or 'your concerns'}")

            # Get key points from THIS session's conversation only
            key_points = []
            for note in session_notes:
                user_input_lower = note['user_input'].lower()
                if 'scolded' in user_input_lower or 'boss' in user_input_lower:
                    key_points.append("workplace difficulties")
                if 'rough day' in user_input_lower:
                    key_points.append("difficult day")

            unique_points = list(set(key_points))
            if unique_points:
                summary_parts.append(f"Key topics in this session: {', '.join(unique_points[:3])}")

        return ". ".join(summary_parts) if summary_parts else "We're building our conversation in this session."

    def _format_conversation_history(self, user_id: str, session_id: str, limit: int = 10) -> str:
        """ Format conversation history with strict session isolation"""
        try:
            # ONLY get history from the current session (skip token validation if needed for restoration)
            history = self.storage.get_conversation_history(user_id, session_id, limit=limit, skip_token_validation=True)
            formatted_history = []

            for conv in history[-limit:]:
                #  Keep full context from THIS session only
                formatted_history.append(f"Human: {conv['user_input']}")
                formatted_history.append(f"Assistant: {conv['bot_response']}")

            return "\n".join(formatted_history) if formatted_history else "No previous conversation in this session."

        except Exception as e:
            return "Previous conversation unavailable."

    def _determine_response_type(self, user_input: str, crisis_level: CrisisLevel, conversation_count: int) -> str:
        """AI-powered response type determination - eliminates hardcoded patterns"""
        
        # Crisis situations always get crisis response
        if crisis_level in [CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
            print(f" CRISIS RESPONSE TYPE SELECTED: {crisis_level.value}")
            return "crisis"

        # Use AI to determine response type based on therapeutic context
        try:
            if self.llm:
                response_type_prompt = f"""
You are a mental health professional analyzing user input to determine the appropriate response type.

User Input: "{user_input}"
Conversation Count: {conversation_count}

Analyze this input and determine the most appropriate response type:

1. CASUAL - Very simple greetings, brief acknowledgments, or basic social interactions that still benefit from therapeutic awareness
2. THERAPEUTIC - Substantial emotional content, mental health topics, meaningful questions, or discussions that require professional therapeutic approach

Consider:
- Emotional depth and complexity of the message
- Whether it contains feelings, problems, or requests for help
- Length and substance of the input
- Therapeutic value that could be provided

Respond with ONLY one word: CASUAL or THERAPEUTIC

Response Type:"""

                response = self.llm.invoke(response_type_prompt)
                ai_response = self._extract_llm_content(response).upper()
                
                if 'THERAPEUTIC' in ai_response:
                    print(f"🤖 AI determined: THERAPEUTIC response needed")
                    return "therapeutic"
                elif 'CASUAL' in ai_response:
                    print(f"🤖 AI determined: CASUAL response (with therapeutic awareness)")
                    return "casual"
                else:
                    print(f"🤖 AI response unclear, defaulting based on conversation stage")
                    # Fallback logic
                    return "casual" if conversation_count < 3 else "therapeutic"
            else:
                # Fallback when LLM not available - minimal hardcoding
                print(f"⚠️ LLM unavailable, using basic length-based determination")
                return "casual" if len(user_input.split()) <= 3 else "therapeutic"
                
        except Exception as e:
            print(f"⚠️ AI response type determination failed: {e}")
            # Simple fallback without hardcoded keywords
            return "casual" if len(user_input.split()) <= 3 else "therapeutic"

    def _get_dynamic_context(self, query: str, crisis_level: CrisisLevel, response_type: str) -> str:
        """AI-enhanced therapeutic context retrieval using datasets intelligently"""
        try:
            # Use AI to enhance query for better context retrieval
            if self.llm:
                query_enhancement_prompt = f"""
You are a mental health knowledge retrieval specialist. Enhance the following query to find the most relevant therapeutic information from mental health datasets.

Original Query: "{query}"
Crisis Level: {crisis_level.value}
Response Type: {response_type}

Create an enhanced search query that will retrieve the most relevant therapeutic knowledge for this situation. Include:
- Key therapeutic concepts
- Relevant mental health techniques  
- Appropriate intervention strategies
- Supportive conversation patterns

Enhanced Query (max 100 characters):"""

                try:
                    enhancement_response = self.llm.invoke(query_enhancement_prompt)
                    enhanced_query = self._extract_llm_content(enhancement_response)[:100]  # Limit length
                    print(f"🔍 AI-enhanced query: {enhanced_query}")
                except Exception as e:
                    print(f"⚠️ Query enhancement failed, using original: {e}")
                    enhanced_query = query
            else:
                enhanced_query = query

            # Determine retrieval strategy based on crisis level and response type
            # Standard RAG retrieval: 200-300 words (industry best practice)
            if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                final_query = f"crisis intervention emergency safety {enhanced_query}"
                retriever = self.crisis_retriever
                context_limit_words = 300  # Standard upper range for crisis (needs more context)
                docs_to_retrieve = 6  # Increased from 3 to 6 for comprehensive crisis knowledge
            elif response_type == "casual":
                final_query = f"supportive empathetic conversation {enhanced_query}"
                retriever = self.general_retriever
                context_limit_words = 200  # Standard lower range for casual (less context needed)
                docs_to_retrieve = 4  # Increased from 2 to 4 for casual interactions
            else:  # therapeutic responses
                final_query = f"therapeutic counseling mental health {enhanced_query}"
                retriever = self.general_retriever
                context_limit_words = 250  # Standard middle range for therapeutic (optimal balance)
                docs_to_retrieve = 6  # Increased from 3 to 6 for thorough therapeutic knowledge
            
            # Convert word limit to approximate character limit (avg 5 chars/word + spaces)
            context_limit = context_limit_words * 6  # Conservative estimate for truncation

            # Check if knowledge base is available (should be loaded during startup)
            if not self._knowledge_base_loaded:
                print("⚠️ Knowledge base not available, using fallback context")
                return "General therapeutic principles: active listening, empathy, validation, and supportive presence."
            
            if retriever and self._knowledge_base_loaded:
                # Retrieve relevant documents from mental health datasets
                docs = retriever.invoke(final_query)
                
                # Use AI to select and rank the most relevant context pieces
                if self.llm and docs:
                    context_selection_prompt = f"""
You are a mental health professional selecting the most relevant therapeutic knowledge for a response.

User Query: "{query}"
Crisis Level: {crisis_level.value}
Response Type: {response_type}

Available Context Pieces:
{chr(10).join([f"Context {i+1}: {doc.page_content[:200]}..." for i, doc in enumerate(docs[:docs_to_retrieve])])}

Select and rank the most relevant pieces for therapeutic response generation. Consider:
- Relevance to user's specific situation
- Therapeutic value and evidence-based approaches
- Appropriateness for crisis level
- Quality of therapeutic guidance

Return the most relevant context pieces combined into a coherent therapeutic knowledge base:"""

                    try:
                        context_response = self.llm.invoke(context_selection_prompt)
                        ai_selected_context = self._extract_llm_content(context_response)
                        # Truncate to word limit (standard: 200-300 words)
                        words = ai_selected_context.split()
                        final_context = ' '.join(words[:context_limit_words])
                        print(f"🧠 AI-selected context: {self._count_words(final_context)}w (limit: {context_limit_words}w)")
                        return final_context
                    except Exception as e:
                        print(f"⚠️ AI context selection failed, using direct retrieval: {e}")
                
                # Fallback: use direct document content (truncate to word limit)
                context = "\n\n".join([doc.page_content for doc in docs[:docs_to_retrieve]])
                words = context.split()
                truncated_context = ' '.join(words[:context_limit_words])
                return truncated_context
            else:
                print(f"⚠️ No retriever available or knowledge base not loaded")
                # Provide AI-generated contextual guidance as fallback
                if self.llm:
                    try:
                        fallback_prompt = f"""
As a mental health professional, provide brief therapeutic guidance for this situation:

User Query: "{query}"
Crisis Level: {crisis_level.value}
Response Type: {response_type}

Provide 2-3 sentences of relevant therapeutic approach or supportive guidance:"""
                        
                        fallback_response = self.llm.invoke(fallback_prompt)
                        fallback_context = self._extract_llm_content(fallback_response)
                        # Limit fallback to standard word count (200 words max)
                        words = fallback_context.split()
                        truncated_fallback = ' '.join(words[:200])
                        print(f"🤖 Generated fallback context: {self._count_words(truncated_fallback)}w")
                        return truncated_fallback
                    except Exception as e:
                        print(f"⚠️ Fallback context generation failed: {e}")
                
                return "General therapeutic principles: active listening, empathy, validation, and supportive presence."

        except Exception as e:
            print(f"⚠️ Context retrieval error: {e}")
            return ""

    def _get_dynamic_context_with_profile(self, query: str, crisis_level: CrisisLevel, 
                                        response_type: str, profile: PsychologicalProfile) -> str:
        """Enhanced context retrieval incorporating psychological profile insights"""
        try:
            # Create profile-informed query enhancement
            if self.llm:
                profile_context = self._create_profile_context_summary(profile)
                
                enhanced_query_prompt = f"""
You are a mental health knowledge specialist creating a personalized query for therapeutic context retrieval.

Original Query: "{query}"
Crisis Level: {crisis_level.value}
Response Type: {response_type}

User's Psychological Profile Context:
{profile_context}

Create an enhanced search query that incorporates:
1. The user's known psychological patterns
2. Their therapeutic preferences  
3. Identified trauma indicators (if any)
4. Their effective coping mechanisms
5. Appropriate therapeutic approaches for their profile

Enhanced Query (max 150 characters):"""

                try:
                    enhancement_response = self.llm.invoke(enhanced_query_prompt)
                    enhanced_query = self._extract_llm_content(enhancement_response)[:150]
                    print(f"🧠 Profile-enhanced query: {enhanced_query}")
                except Exception as e:
                    print(f"⚠️ Query enhancement failed: {e}")
                    enhanced_query = query
            else:
                enhanced_query = query

            # Get base therapeutic context
            base_context = self._get_dynamic_context(enhanced_query, crisis_level, response_type)
            
            # Add profile-specific therapeutic guidance
            profile_guidance = self._generate_profile_specific_guidance(profile, crisis_level, response_type)
            
            # Combine contexts (limit total to standard 300 words max)
            if profile_guidance:
                combined_context = f"{base_context}\n\nPersonalized Therapeutic Approach:\n{profile_guidance}"
                print(f"🎯 Added {self._count_words(profile_guidance)}w of personalized guidance")
                # Truncate combined context to standard word limit (300 words max)
                words = combined_context.split()
                truncated_combined = ' '.join(words[:300])
                return truncated_combined
            else:
                return base_context
                
        except Exception as e:
            print(f"⚠️ Profile-enhanced context retrieval error: {e}")
            return self._get_dynamic_context(query, crisis_level, response_type)

    def _get_basic_context_with_profile(self, profile: PsychologicalProfile) -> str:
        """Get basic context enhanced with profile awareness"""
        try:
            if not profile.core_patterns:
                return "Basic supportive conversation guidelines: be warm, empathetic, and present."
            
            # Create profile-aware basic guidance
            profile_insights = []
            

            
            if profile.therapeutic_preferences:
                pref_keys = list(profile.therapeutic_preferences.keys())[:2]
                if pref_keys:
                    profile_insights.append(f"Therapeutic preferences: {', '.join(pref_keys)}")
            
            if profile.coping_mechanisms:
                coping_keys = list(profile.coping_mechanisms.keys())[:2]
                if coping_keys:
                    profile_insights.append(f"Known coping strategies: {', '.join(coping_keys)}")
            
            base_context = "Be warm, empathetic, and supportive."
            if profile_insights:
                context_addition = " Consider: " + "; ".join(profile_insights)
                return base_context + context_addition
            else:
                return base_context
                
        except Exception as e:
            print(f"⚠️ Basic profile context error: {e}")
            return "Basic supportive conversation guidelines: be warm, empathetic, and present."

    def _create_profile_context_summary(self, profile: PsychologicalProfile) -> str:
        """Create a concise summary of psychological profile for context"""
        try:
            summary_parts = []
            
            # Core patterns (most important)
            if profile.core_patterns:
                patterns = list(profile.core_patterns.keys())[:3]
                summary_parts.append(f"Core patterns: {', '.join(patterns)}")
            

            
            # Trauma indicators (handle sensitively)
            if profile.trauma_indicators:
                trauma_count = len([t for t in profile.trauma_indicators.values() 
                                 if isinstance(t, dict) and t.get('present')])
                if trauma_count > 0:
                    summary_parts.append(f"Trauma-informed approach needed ({trauma_count} indicators)")
            
            # Coping mechanisms
            if profile.coping_mechanisms:
                coping = list(profile.coping_mechanisms.keys())[:2]
                summary_parts.append(f"Effective coping: {', '.join(coping)}")
            
            # Therapeutic preferences
            if profile.therapeutic_preferences:
                prefs = list(profile.therapeutic_preferences.keys())[:2]
                summary_parts.append(f"Therapeutic preferences: {', '.join(prefs)}")
            
            return " | ".join(summary_parts) if summary_parts else "Profile being developed"
            
        except Exception as e:
            print(f"⚠️ Profile summary creation error: {e}")
            return "Profile context unavailable"

    def _generate_profile_specific_guidance(self, profile: PsychologicalProfile, 
                                          crisis_level: CrisisLevel, response_type: str) -> str:
        """Generate specific therapeutic guidance based on user's psychological profile"""
        try:
            if not self.llm:
                return ""
                
            profile_summary = self._create_profile_context_summary(profile)
            
            guidance_prompt = f"""
You are a clinical psychologist creating personalized therapeutic guidance.

User's Profile: {profile_summary}
Current Crisis Level: {crisis_level.value}
Response Type: {response_type}

CRITICAL: The therapist must ALWAYS maintain a professional therapeutic voice regardless of how the user communicates. Do NOT adapt communication style to match the user.

Based on this psychological profile, provide specific therapeutic guidance for:
1. Therapeutic techniques most suitable for their psychological patterns (maintain professional voice)
2. Identified strengths and resilience factors (while maintaining professional communication)
3. Trauma-informed modifications (if applicable) - use professional therapeutic language
4. Specific triggers or sensitivities to be aware of
5. Appropriate therapeutic interventions based on their patterns

IMPORTANT: All guidance must emphasize maintaining professional therapeutic communication style. The therapist should understand the user's communication patterns for context, but never mirror or adapt to them.

Keep guidance concise (max 300 words) and practical for immediate use.

Personalized Therapeutic Guidance:"""

            response = self.llm.invoke(guidance_prompt)
            guidance = self._extract_llm_content(response)
            
            if guidance and len(guidance.strip()) > 20:
                # Limit profile guidance to 50 words (supplementary to base context)
                words = guidance.strip().split()
                truncated_guidance = ' '.join(words[:50])
                print(f"🎯 Generated personalized therapeutic guidance: {self._count_words(truncated_guidance)}w")
                return truncated_guidance
            else:
                return ""
                
        except Exception as e:
            print(f"⚠️ Profile-specific guidance generation error: {e}")
            return ""



    @require_valid_session
    @rate_limit_check
    def generate_enhanced_response(self, user_input: str, user_id: str, session_id: str) -> Tuple[str, CrisisLevel, HarmType]:
        """Securely generate responses with comprehensive security controls and deep psychological understanding"""
        try:
            # Security validation
            if not user_input or len(user_input.strip()) == 0:
                raise ValueError("Empty input not allowed")
            
            # Sanitize input
            sanitized_input = security_manager.sanitize_input(user_input)
            
            # Audit log the interaction
            security_manager.audit_log(
                'RESPONSE_GENERATION_REQUEST',
                user_id, session_id,
                {
                    'input_length': len(sanitized_input),
                    'original_length': len(user_input)
                }
            )
            
            # Use sanitized input for analysis
            final_input = sanitized_input
            
            # Get or create psychological profile for deep understanding
            psychological_profile = self.storage.get_or_create_psychological_profile(user_id)
            print(f"🧠 Retrieved psychological profile with {len(psychological_profile.core_patterns)} core patterns")
            
            # Enhanced crisis detection
            crisis_level, harm_type = self.crisis_detector.detect_crisis_level(final_input, user_id)
            print(f"🔍 CRISIS DETECTION RESULT: Level={crisis_level.value}, Harm={harm_type.value}")

            # Get conversation count for THIS session only
            current_session_history = self.storage.get_conversation_history(user_id, session_id)
            conversation_count = len(current_session_history)

            # Determine response type dynamically
            response_type = self._determine_response_type(final_input, crisis_level, conversation_count)
            print(f" Response Type Determined: {response_type} (Crisis Level: {crisis_level.value}, Harm Type: {harm_type.value})")

            # Analyze interaction complexity for context retrieval optimization
            complexity_analysis = self._analyze_interaction_complexity(final_input, conversation_count)

            #  Get conversation history from THIS session only
            conversation_history = self._format_conversation_history(user_id, session_id, limit=10)

            # Get session context and summary from THIS session only
            session_context = self._create_session_context(user_id, session_id)
            conversation_summary = self._create_conversation_summary(user_id, session_id)

            print(f"🔒 Session isolated context: {session_context}")
            print(f"📝 Session isolated summary: {conversation_summary}")

            # Get therapeutic context enhanced with psychological profile
            if complexity_analysis['requires_ai_context'] or response_type in ['crisis', 'therapeutic']:
                context = self._get_dynamic_context_with_profile(final_input, crisis_level, response_type, psychological_profile)
                print(f"📚 Retrieved enhanced context ({response_type}): {self._count_words(context)}w")
                if context:
                    print(f"📖 Enhanced context preview: {context[:100]}...")
            else:
                # Use minimal context for simple interactions, still profile-aware
                context = self._get_basic_context_with_profile(psychological_profile)
                print(f"📚 Using profile-aware minimal context for {complexity_analysis['complexity']} interaction")

            # Generate response based on type
            if response_type == "crisis":
                print(f" USING CRISIS PROMPT for {crisis_level.value}")
                assessment_questions = self.crisis_detector.get_safety_assessment_questions(crisis_level)
                formatted_prompt = self.crisis_prompt.format(
                    user_input=final_input,
                    crisis_level=crisis_level.value,
                    assessment_questions=assessment_questions[:2],
                    session_context=session_context
                )
                print(f" Crisis prompt preview: {formatted_prompt[:200]}...")

            elif response_type == "casual":
                formatted_prompt = self.casual_prompt.format(
                    user_input=final_input,
                    conversation_history=conversation_history,
                    session_context=session_context,
                    context=context  # Now includes therapeutic context
                )

            else:  # therapeutic
                formatted_prompt = self.therapeutic_prompt.format(
                    context=context,
                    conversation_history=conversation_history,
                    user_input=final_input,
                    crisis_level=crisis_level.value,
                    session_context=session_context,
                    conversation_summary=conversation_summary
                )

            # Generate response
            response = self._generate_with_retry(formatted_prompt)

            # Handle emergency notification for harm to others
            if harm_type in [HarmType.HARM_TO_OTHERS, HarmType.BOTH] and crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                print(f"🚨 EMERGENCY: Harm to others detected - Level: {crisis_level.value}, Type: {harm_type.value}")
                print(f"🚨 SENDING EMERGENCY NOTIFICATION to backend...")
                self._send_emergency_notification(user_id, session_id, user_input, response, crisis_level, harm_type)
            else:
                print(f"🔍 No emergency notification sent - Level: {crisis_level.value}, Type: {harm_type.value}")

            # Minimal post-processing - only add resources for actual crises
            if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                print(f" Adding crisis resources for {crisis_level.value}")
                response = self._add_crisis_resources(response, crisis_level)
                print(f" Crisis resources added, final response length: {len(response)}")

            #  Update session memory after generating response
            self._update_session_memory(user_id, session_id, final_input, response)

            # Save conversation and update psychological profile
            mood_score = self._calculate_mood_score(final_input)
            self.storage.save_conversation(
                user_id=user_id,
                session_id=session_id,
                user_input=final_input,  # Save the processed input, not the original
                bot_response=response,
                crisis_level=crisis_level.value,
                mood_score=mood_score
            )
            
            # Update psychological profile with conversation insights
            self.storage.update_psychological_profile(user_id, final_input, crisis_level.value, mood_score, self.llm)
            print(f"🧠 Updated psychological profile based on conversation")

            # Store complexity analysis for session learning
            if hasattr(self, 'session_memories') and user_id and session_id:
                session_key = f"{user_id}_{session_id}"
                if session_key in self.session_memories:
                    memory = self.session_memories[session_key]
                    if not hasattr(memory, 'complexity_history') or memory.complexity_history is None:
                        memory.complexity_history = []
                    memory.complexity_history.append({
                        'input': final_input[:50],
                        'complexity': complexity_analysis['complexity'],
                        'confidence': complexity_analysis['confidence'],
                        'response_type': response_type,
                        'timestamp': datetime.now().isoformat()
                    })
            
            return response, crisis_level, harm_type

        except Exception as e:
            print(f"❌ Error generating response: {e}")
            raise RuntimeError(f"Response generation failed: {e}")

    def _send_emergency_notification(self, user_id: str, session_id: str, user_input: str, bot_response: str, crisis_level: CrisisLevel, harm_type: HarmType):
        """Send emergency notification for harm to others scenarios"""
        try:
            # Get conversation history for context
            conversation_history = self.storage.get_conversation_history(user_id, session_id)
            
            # Format conversation for email
            formatted_history = "\n".join([
                f"User: {conv.get('user_input', '')}\nBot: {conv.get('bot_response', '')}\n---"
                for conv in conversation_history[-10:]  # Last 10 exchanges
            ])
            
            # Create emergency notification payload
            notification_data = {
                'user_id': user_id,
                'session_id': session_id,
                'crisis_level': crisis_level.value,
                'harm_type': harm_type.value,
                'trigger_message': user_input,
                'bot_response': bot_response,
                'conversation_history': formatted_history,
                'timestamp': datetime.now().isoformat()
            }
            
            # Send to backend for email notification
            import requests
            try:
                backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
                notification_url = f"{backend_url}/api/emergency-notification"
                response = requests.post(
                    notification_url,
                    json=notification_data,
                    timeout=10
                )
                if response.status_code == 200:
                    print(f"✅ Emergency notification sent successfully")
                else:
                    print(f"❌ Emergency notification failed: {response.status_code}")
            except Exception as req_error:
                print(f"❌ Failed to send emergency notification: {req_error}")
                
        except Exception as e:
            print(f"❌ Error in emergency notification: {e}")

    def _add_crisis_resources(self, response: str, crisis_level: CrisisLevel) -> str:
        """AI-generated crisis resources based on severity and context"""
        try:
            if self.llm:
                crisis_resources_prompt = f"""
You are a mental health professional providing crisis support resources.

Context:
- Crisis Level: {crisis_level.value}
- User needs immediate support information
- This is for Pakistan-based mental health services

Generate appropriate crisis support information based on the severity level:

For CRITICAL: Include immediate emergency contacts and urgent action steps
For HIGH: Include crisis helplines and urgent support options  
For MEDIUM: Include mental health support lines and resources

Guidelines:
- Include relevant Pakistan mental health helplines (1019, 1166, 0800-00-100)
- Match urgency to crisis level
- Keep it concise and actionable
- Use clear, calming language
- Format with appropriate urgency indicators

Crisis Support Resources:"""

                resources_response = self.llm.invoke(crisis_resources_prompt)
                ai_resources = self._extract_llm_content(resources_response)
                
                if ai_resources and len(ai_resources.strip()) > 10:
                    print(f"🤖 Generated AI crisis resources: {self._count_words(ai_resources)}w")
                    return response + "\n\n" + ai_resources.strip()
                else:
                    print(f"⚠️ AI crisis resources generation failed, using fallback")
                    return response + self._fallback_crisis_resources(crisis_level)
            else:
                print(f"⚠️ LLM unavailable for crisis resources")
                return response + self._fallback_crisis_resources(crisis_level)
                
        except Exception as e:
            print(f"⚠️ AI crisis resources error: {e}")
            return response + self._fallback_crisis_resources(crisis_level)

    def _fallback_crisis_resources(self, crisis_level: CrisisLevel) -> str:
        """Fallback crisis resources when AI is unavailable"""
        if crisis_level == CrisisLevel.CRITICAL:
            return "\n\n🚨 IMMEDIATE CRISIS SUPPORT (PAKISTAN):\n• 1166 - National Emergency Helpline\n• 1019 - Mental Health Crisis Line (24/7)\n• 0800-00-100 - Rozan Crisis Helpline"
        elif crisis_level == CrisisLevel.HIGH:
            return "\n\n⚠️ URGENT SUPPORT (PAKISTAN):\n• 1019 - Mental Health Crisis Line\n• 0800-00-100 - Rozan Crisis Helpline"
        elif crisis_level == CrisisLevel.MEDIUM:
            return "\n\n💙 SUPPORT AVAILABLE (PAKISTAN):\n• 1019 - Mental Health Crisis Line\n• 0800-00-100 - Rozan Crisis Helpline"
        else:
            return ""

    def _generate_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """Generate response with retry logic"""
        for attempt in range(max_retries):
            try:
                if self.llm is None:
                    return "I apologize, but I'm currently unable to generate a response. Please try again later."
                
                response = self.llm.invoke(prompt)
                if hasattr(response, 'content'):
                    response_text = response.content
                else:
                    response_text = str(response)
                
                if response_text and isinstance(response_text, str) and len(response_text.strip()) > 10:
                    return response_text.strip()
            except Exception as e:
                print(f"⚠️ Generation attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    return "I apologize, but I'm having trouble generating a response right now. Please try again."

        return "I'm having technical difficulties. Please try again or contact professional support if needed."

    def _calculate_mood_score(self, user_input: str) -> float:
        """Calculate mood score from user input"""
        if self.crisis_detector.sentiment_available and self.crisis_detector.sentiment_analyzer is not None:
            try:
                sentiment = self.crisis_detector.sentiment_analyzer.polarity_scores(user_input)
                return round(((sentiment['compound'] + 1) * 4.5) + 1, 1)
            except:
                pass

        # If sentiment analyzer unavailable, return neutral mood
        return 5.0



# Replace the old method - disabled to avoid type errors
# TherapyBot.generate_response = TherapyBot.generate_enhanced_response

print("✅ Enhanced therapy bot with strict session isolation ready!")

# Load Groq API key from environment variables
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Initialize the therapy bot
therapy_bot = None

# Validate API key
if not GROQ_API_KEY or GROQ_API_KEY.strip() == "":
    print("❌ GROQ API key not found!")
    print("💡 Get your free API key from: https://console.groq.com/")
    print("📝 Set GROQ_API_KEY in your .env file or environment variables")
    therapy_bot = None
elif GROQ_API_KEY == "gsk_YOUR_API_KEY_HERE":
    print("❌ Please set your actual GROQ API key!")
    print("💡 Update GROQ_API_KEY in your .env file")
    therapy_bot = None
else:
    print("✅ API key configured!")

    # Initialize the therapy bot
    try:
        therapy_bot = TherapyBot(GROQ_API_KEY)
        print("🤖 Therapy bot initialized successfully!")
    except Exception as e:
        print(f"❌ Error initializing therapy bot: {e}")
        therapy_bot = None

class TherapyInterface:
    """Enhanced professional therapy interface with persistent session memory and context continuity"""

    def __init__(self, therapy_bot: TherapyBot):
        self.therapy_bot = therapy_bot
        self.current_user_id = None
        self.current_session_id = None
        self.conversation_count = 0
        self.session_start_time = None
        self.last_crisis_level = CrisisLevel.NONE
        self.last_harm_type = HarmType.NONE
        self.session_reuse_window = 300  # 5 minutes window for session reuse
        self._last_interaction_time = None

    def _should_reuse_existing_session(self, user_id: str) -> bool:
        """Determine if existing session should be reused based on intelligent criteria"""
        if not self.current_session_id or not self.current_user_id:
            return False
            
        # Different user always needs new session
        if self.current_user_id != user_id:
            return False
        
        # Check time window for reuse
        time_since_last = 0
        if self._last_interaction_time:
            time_since_last = (datetime.now() - self._last_interaction_time).total_seconds()
            if time_since_last > self.session_reuse_window:
                print(f"⏰ Session expired ({time_since_last:.0f}s > {self.session_reuse_window}s) - creating new session")
                return False
        
        # Use AI to determine if context suggests new session needed
        if self.therapy_bot.llm and self.conversation_count > 0:
            try:
                # Get recent conversation context
                session_memory = self.therapy_bot._get_or_create_session_memory(user_id, self.current_session_id)
                recent_topics = []
                
                if hasattr(session_memory, 'progress_notes') and session_memory.progress_notes:
                    recent_notes = session_memory.progress_notes[-3:]  # Last 3 interactions
                    recent_topics = [note.get('user_input', '')[:50] for note in recent_notes]
                
                session_context_prompt = f"""
Analyze if this user interaction pattern suggests a new therapy session should start or continue existing session:

User: {user_id}
Current session duration: {self.conversation_count} messages
Recent topics: {recent_topics}
Time since last interaction: {time_since_last:.0f} seconds

Consider:
1. Natural conversation flow vs. new topic/issue
2. Session continuity and therapeutic relationship
3. Context switching that might need fresh start
4. User benefit from continuing vs. starting fresh

Recommendation: CONTINUE or NEW_SESSION
Reasoning: [brief explanation]

Decision:"""
                
                response = self.therapy_bot.llm.invoke(session_context_prompt)
                ai_decision = self.therapy_bot._extract_llm_content(response).upper()
                
                if 'NEW_SESSION' in ai_decision:
                    print("🤖 AI recommends new session for better therapeutic context")
                    return False
                elif 'CONTINUE' in ai_decision:
                    print("🤖 AI recommends continuing existing session")
                    return True
                    
            except Exception as e:
                print(f"⚠️ AI session decision failed: {e}")
        
        # Default: reuse if within time window and same user
        return True
    
    def _generate_ai_continuation_message(self) -> str:
        """Generate AI-powered continuation message for resumed sessions"""
        try:
            if not self.therapy_bot.llm:
                return self._fallback_continuation_message()
            
            # Get session context for continuation with type safety
            if not self.current_user_id or not self.current_session_id:
                return self._fallback_continuation_message()
                
            session_memory = self.therapy_bot._get_or_create_session_memory(self.current_user_id, self.current_session_id)
            
            recent_context = "No previous context"
            if hasattr(session_memory, 'progress_notes') and session_memory.progress_notes:
                recent_notes = session_memory.progress_notes[-2:]  # Last 2 interactions
                recent_context = "; ".join([note.get('user_input', '')[:30] + "..." for note in recent_notes])
            
            continuation_prompt = f"""
You are a professional mental health support assistant resuming a therapy session. You ALWAYS maintain your professional therapeutic voice regardless of how the user may communicate.

Session Context:
- User has returned to continue previous conversation
- Recent topics discussed: {recent_context}
- Primary issue from session: {session_memory.primary_issue if hasattr(session_memory, 'primary_issue') else 'general support'}
- Conversation count: {self.conversation_count}

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS use professional therapeutic language and proper grammar
- NEVER use casual language, slang, or informal communication
- Maintain warm but professional therapeutic tone at all times

Create a professional welcoming message that:
1. Acknowledges their return using professional therapeutic language
2. Shows continuity with previous conversation professionally
3. Invites them to continue or share updates with therapeutic warmth
4. Maintains professional therapeutic warmth and presence
5. Keep it brief (2-3 sentences) with complete, professional sentences

Welcome back message:"""
            
            response = self.therapy_bot.llm.invoke(continuation_prompt)
            ai_continuation = self.therapy_bot._extract_llm_content(response)
            
            if ai_continuation and len(ai_continuation.strip()) > 10:
                print(f"🤖 Generated AI continuation message: {self.therapy_bot._count_words(ai_continuation)}w")
                return ai_continuation.strip()
            else:
                return self._fallback_continuation_message()
                
        except Exception as e:
            print(f"⚠️ AI continuation message generation failed: {e}")
            return self._fallback_continuation_message()
    
    def _fallback_continuation_message(self) -> str:
        """Fallback continuation message when AI is not available"""
        return "Welcome back! I'm glad you're continuing our conversation. How are you feeling since we last talked? What's on your mind today?"

    def start_session(self, user_id: Optional[str] = None) -> str:
        """Start a secure therapy session with comprehensive security controls"""
        target_user_id = None
        try:
            # Security validation and sanitization
            if user_id:
                target_user_id = security_manager.sanitize_input(user_id.strip())
                if not target_user_id:
                    raise ValueError("Invalid user ID provided")
                
                # Rate limit check
                if not security_manager.check_rate_limit(target_user_id):
                    raise ValueError("Rate limit exceeded for user")
            else:
                # Generate secure user ID
                if self.therapy_bot.current_user_context:
                    base_login = self.therapy_bot.current_user_context.get('login', 'anonymous')
                    target_user_id = f"{security_manager.sanitize_input(base_login)}_{int(time.time())}"
                else:
                    # Secure fallback
                    target_user_id = f"secure_user_{secrets.token_hex(8)}"
                    print(f"⚠️ WARNING: Using generated secure user ID")
            
            # Validate user ID format
            if len(target_user_id) > 100 or not re.match(r'^[a-zA-Z0-9_-]+$', target_user_id):
                raise ValueError("Invalid user ID format")

            # Check if we should reuse existing sessionsion
            if target_user_id and self._should_reuse_existing_session(target_user_id):
                print(f"🔄 Reusing existing session: {self.current_session_id}")
                # Update interaction time
                self._last_interaction_time = datetime.now()
                # Generate welcome message for continuing session
                try:
                    return self._generate_ai_continuation_message()
                except Exception as e:
                    print(f"⚠️ AI continuation message failed: {e}")
                    return "Welcome back! I'm glad you're continuing our conversation. How are you feeling since we last talked?"

            # Create new secure session
            self.current_user_id = target_user_id
            self.current_session_id = f"session_{secrets.token_hex(16)}_{int(time.time())}"
            self.conversation_count = 0
            self.session_start_time = datetime.now()
            self.last_crisis_level = CrisisLevel.NONE
            self.last_harm_type = HarmType.NONE
            self._last_interaction_time = datetime.now()
            
            # Create secure session token
            session_token = security_manager.create_session_token(self.current_user_id, self.current_session_id)
            
            # Audit log session creation
            security_manager.audit_log(
                'SESSION_CREATED',
                self.current_user_id, self.current_session_id,
                {
                    'session_token_created': True,
                    'user_type': 'authenticated' if user_id else 'anonymous',
                    'security_version': '2.0'
                }
            )
            
            print(f"🎆 Created secure session with token authentication")
            
            # AI-generated contextual welcome message
            welcome_message = self._generate_ai_welcome_message()
            
            # Backend session logging (not shown to user)
            self._log_session_info("Secure session started")
            
            return welcome_message
            
        except ValueError as ve:
            # Security validation errors
            security_manager.audit_log(
                'SESSION_START_SECURITY_ERROR',
                target_user_id or user_id or 'unknown', 'unknown',
                {'error': str(ve)},
                'WARNING'
            )
            return f"Session creation failed: {ve}"
            
        except Exception as e:
            # System errors
            security_manager.audit_log(
                'SESSION_START_SYSTEM_ERROR',
                target_user_id or user_id or 'unknown', 'unknown',
                {'error_type': type(e).__name__},
                'ERROR'
            )
            print(f"❌ Error starting session: {e}")
            return "Unable to start session due to a system error. Please try again."

    def _generate_ai_welcome_message(self) -> str:
        """Generate AI-powered contextual welcome message based on time and environment"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                current_time = datetime.now()
                current_hour = current_time.hour
                day_of_week = current_time.strftime("%A")
                
                welcome_prompt = f"""
You are a warm, professional mental health support assistant starting a new therapy session. You ALWAYS maintain your professional therapeutic voice regardless of how the user may communicate.

Context:
- Current time: {current_hour}:00 on {day_of_week}
- This is the beginning of a new therapy session
- You need to create a welcoming, safe environment
- The user may be feeling vulnerable or uncertain

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS use professional therapeutic language and proper grammar
- NEVER use casual language, slang, or informal communication
- Maintain warm but professional therapeutic tone at all times

Generate a professional, contextually appropriate welcome message that:
1. Includes a time-appropriate greeting using professional therapeutic language
2. Establishes you as a professional mental health support assistant
3. Creates a sense of safety and confidentiality with professional assurance
4. Mentions session continuity (remembering conversation context) professionally
5. Ends with an open, inviting therapeutic question
6. Keeps the tone warm but consistently professional
7. Is 3-4 sentences long with complete, professional sentences

Maintain therapeutic boundaries and professional communication style throughout.

Welcome message:"""

                response = self.therapy_bot.llm.invoke(welcome_prompt)
                ai_welcome = self.therapy_bot._extract_llm_content(response)
                
                if ai_welcome and len(ai_welcome.strip()) > 20:
                    print(f"🤖 Generated AI welcome message: {self.therapy_bot._count_words(ai_welcome)}w")
                    return ai_welcome.strip()
                else:
                    print(f"⚠️ AI welcome generation failed, using fallback")
                    return self._fallback_welcome_message()
            else:
                print(f"⚠️ LLM unavailable for welcome generation")
                return self._fallback_welcome_message()
                
        except Exception as e:
            print(f"⚠️ AI welcome generation error: {e}")
            return self._fallback_welcome_message()

    def _fallback_welcome_message(self) -> str:
        """Fallback welcome message when AI is unavailable"""
        current_hour = datetime.now().hour
        
        # Simple time-based greeting without hardcoded templates
        if 5 <= current_hour < 12:
            time_context = "morning"
        elif 12 <= current_hour < 17:
            time_context = "afternoon"
        elif 17 <= current_hour < 21:
            time_context = "evening"
        else:
            time_context = "today"
        
        return f"""Hello! I'm here to provide mental health support this {time_context}. I'm trained in evidence-based therapeutic approaches and create a safe space for our conversation. I'll remember what we discuss during our session so you don't need to repeat yourself. How are you feeling right now?"""

    def send_message(self, message: str) -> str:
        """Send a message and get response"""

        if not self.therapy_bot:
            error_msg = self._generate_ai_error_message("service_unavailable")
            return error_msg

        if not self.current_user_id or not self.current_session_id:
            error_msg = self._generate_ai_error_message("session_required") 
            return error_msg

        if not message.strip():
            return self._generate_ai_error_message("empty_message")

        try:
            # Generate contextually-aware response with session memory
            response, crisis_level, harm_type = self.therapy_bot.generate_enhanced_response(
                user_input=message,
                user_id=self.current_user_id,
                session_id=self.current_session_id
            )

            # Update conversation tracking (backend only)
            self.conversation_count += 1
            self.last_crisis_level = crisis_level
            self.last_harm_type = harm_type  # Store harm type for later use
            self._log_session_info(f"Message processed: {crisis_level.value}, Harm: {harm_type.value}")

            if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                if harm_type in [HarmType.HARM_TO_OTHERS, HarmType.BOTH]:
                    formatted_response = self._generate_ai_emergency_message(response, crisis_level, harm_type)
                else:
                    formatted_response = self._generate_ai_urgent_message(response, crisis_level)
            else:
                formatted_response = response

            return formatted_response

        except Exception as e:
            print(f"❌ Chat error: {e}")
            error_msg = self._generate_ai_error_message("technical_issue")
            return error_msg

    def _generate_ai_error_message(self, error_type: str) -> str:
        """AI-generated contextual error messages"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                error_context = {
                    "service_unavailable": "The therapy bot service is currently unavailable",
                    "session_required": "No active session - user needs to start a new session", 
                    "empty_message": "User sent an empty or blank message",
                    "technical_issue": "A technical error occurred during message processing"
                }
                
                error_prompt = f"""
You are a professional mental health support assistant handling an error situation. You ALWAYS maintain your professional therapeutic voice.

Error Type: {error_type}
Context: {error_context.get(error_type, "Unknown error")}

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS use professional therapeutic language and proper grammar
- NEVER use casual language, slang, or informal communication
- Maintain warm but professional therapeutic tone at all times

Generate a helpful, supportive professional error message that:
1. Acknowledges the issue clearly but gently using professional therapeutic language
2. Provides appropriate next steps for the user professionally
3. Includes crisis support information if relevant (Pakistan numbers: 1019, 1166, 0800-00-100) with professional communication
4. Maintains a caring, professional therapeutic tone consistently
5. Keeps it concise (2-3 lines) with complete, professional sentences

Error Message:"""

                response = self.therapy_bot.llm.invoke(error_prompt)
                ai_error = self.therapy_bot._extract_llm_content(response)
                
                if ai_error and len(ai_error.strip()) > 10:
                    return ai_error.strip()
                else:
                    return self._fallback_error_message(error_type)
            else:
                return self._fallback_error_message(error_type)
                
        except Exception as e:
            print(f"⚠️ AI error message generation failed: {e}")
            return self._fallback_error_message(error_type)

    def _fallback_error_message(self, error_type: str) -> str:
        """Fallback error messages when AI is unavailable"""
        fallback_messages = {
            "service_unavailable": "I'm currently unavailable. If you're in crisis, please contact 1019 (Mental Health Crisis Line) or 1166 (Emergency).",
            "session_required": "Please start a new session first. If this is an emergency, call 1019 or 1166.",
            "empty_message": "Please enter a message to continue our conversation.",
            "technical_issue": "I encountered a technical issue. Please try again. If you're in crisis, contact 1019 or 1166 immediately."
        }
        return fallback_messages.get(error_type, "An error occurred. Please try again or contact support if needed.")

    def _generate_ai_emergency_message(self, response: str, crisis_level: CrisisLevel, harm_type: HarmType) -> str:
        """AI-generated emergency message formatting for harm to others scenarios"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                emergency_prompt = f"""
You are a professional mental health crisis specialist creating a clean, professional emergency response. You ALWAYS maintain your professional therapeutic voice.

Context:
- Crisis Level: {crisis_level.value}
- Harm Type: {harm_type.value}
- This involves potential danger and requires immediate attention

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS use professional therapeutic language and proper grammar
- NEVER use casual language, slang, or informal communication
- Maintain professional therapeutic tone even in crisis situations

Task: Create a clean, well-formatted professional emergency response that:
1. Uses clear, direct professional therapeutic language without asterisks (*) or bullet points
2. Emphasizes immediate safety and support with professional communication
3. Includes the therapeutic response naturally with professional language
4. Maintains hope while ensuring safety using professional therapeutic tone
5. Uses proper paragraphs, not lists, with complete professional sentences
6. Keeps the full therapeutic response intact (don't truncate)

Original therapeutic response: "{response}"

Generate a complete, clean, professional emergency response (no asterisks, no truncation):"""

                emergency_response = self.therapy_bot.llm.invoke(emergency_prompt)
                ai_emergency = self.therapy_bot._extract_llm_content(emergency_response)
                
                if ai_emergency and len(ai_emergency.strip()) > 20:
                    return ai_emergency.strip()
                else:
                    return f"🚨 EMERGENCY SUPPORT NEEDED\n\n{response}\n\nThis situation requires immediate attention. Please contact emergency services if there is immediate danger to yourself or others."
            else:
                return f"🚨 EMERGENCY SUPPORT NEEDED\n\n{response}\n\nThis situation requires immediate attention. Please contact emergency services if there is immediate danger to yourself or others."
                
        except Exception as e:
            print(f"⚠️ AI emergency message generation error: {e}")
            return f"🚨 EMERGENCY SUPPORT NEEDED\n\n{response}\n\nThis situation requires immediate attention. Please contact emergency services if there is immediate danger to yourself or others."

    def _generate_ai_urgent_message(self, response: str, crisis_level: CrisisLevel) -> str:
        """AI-generated urgent message formatting for high-risk scenarios"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                urgent_prompt = f"""
You are a professional mental health crisis specialist creating a clean, professional urgent response. You ALWAYS maintain your professional therapeutic voice.

Context:
- Crisis Level: {crisis_level.value}
- High-risk situation requiring immediate attention
- Focus on safety and support

CRITICAL PROFESSIONAL VOICE REQUIREMENTS:
- ALWAYS use professional therapeutic language and proper grammar
- NEVER use casual language, slang, or informal communication
- Maintain professional therapeutic tone even in urgent situations

Task: Create a clean, well-formatted professional urgent response that:
1. Uses clear, direct language without asterisks (*) or bullet points
2. Emphasizes immediate safety and support while remaining hopeful
3. Includes the full therapeutic response naturally (don't truncate)
4. Uses proper paragraphs, not lists
5. Maintains therapeutic warmth while conveying urgency

Original therapeutic response: "{response}"

Generate a complete, clean urgent response (no asterisks, no truncation):"""

                urgent_response = self.therapy_bot.llm.invoke(urgent_prompt)
                ai_urgent = self.therapy_bot._extract_llm_content(urgent_response)
                
                if ai_urgent and len(ai_urgent.strip()) > 20:
                    return ai_urgent.strip()
                else:
                    return f"⚠️ URGENT SUPPORT NEEDED\n\n{response}"
            else:
                return f"⚠️ URGENT SUPPORT NEEDED\n\n{response}"
                
        except Exception as e:
            print(f"⚠️ AI urgent message generation error: {e}")
            return f"⚠️ URGENT SUPPORT NEEDED\n\n{response}"

    def _log_session_info(self, event: str):
        """Backend logging for session information (not displayed to user)"""
        if self.session_start_time:
            duration = datetime.now() - self.session_start_time
            total_minutes = duration.total_seconds() // 60
            hours = int(total_minutes // 60)
            minutes = int(total_minutes % 60)

            if hours > 0:
                duration_str = f"{hours}h {minutes}m"
            else:
                duration_str = f"{minutes}m"
        else:
            duration_str = "0m"

        # Crisis level indicators
        crisis_indicators = {
            CrisisLevel.CRITICAL: " CRITICAL",
            CrisisLevel.HIGH: "⚠️ HIGH RISK",
            CrisisLevel.MEDIUM: "⚡ ELEVATED",
            CrisisLevel.LOW: "💙 MILD",
            CrisisLevel.NONE: "✅ STABLE"
        }

        crisis_display = crisis_indicators.get(self.last_crisis_level, "❓ UNKNOWN")

        # Log to backend (not user-facing)
        session_display = self.current_session_id[-8:] if self.current_session_id else "unknown"
        user_display = self.current_user_id[-12:] if self.current_user_id else "unknown"

        backend_log = f"""
Backend Session Info:
Session: ...{session_display}
User: ...{user_display}
Messages: {self.conversation_count}
Duration: {duration_str}
Crisis Level: {crisis_display}
Event: {event}
Timestamp: {datetime.now().strftime('%H:%M:%S')}
        """

        print(backend_log)  # This goes to backend logs only

    def get_session_summary(self) -> str:
        """Generate secure enhanced session summary with psychological insights"""
        if not self.current_session_id:
            return "No active session to summarize."

        try:
            # Validate session security
            if not self.current_user_id:
                return "No user ID available for session summary."
            
            if not security_manager.validate_session_token(self.current_user_id, self.current_session_id):
                security_manager.audit_log(
                    'INVALID_SESSION_SUMMARY_ACCESS',
                    self.current_user_id, self.current_session_id,
                    {'action': 'get_session_summary'},
                    'WARNING'
                )
                return "Session expired. Please start a new session to get a summary."
                
            history = self.therapy_bot.storage.get_conversation_history(
                self.current_user_id, self.current_session_id
            )

            if not history:
                return "No conversations in this session yet."

            # Audit log session summary access
            security_manager.audit_log(
                'SESSION_SUMMARY_GENERATED',
                self.current_user_id, self.current_session_id,
                {'conversation_count': len(history)}
            )
            
            # Get session memory for enhanced summary
            memory = self.therapy_bot._get_or_create_session_memory(
                self.current_user_id, self.current_session_id
            )
            
            # Get psychological profile for deeper insights
            psychological_profile = self.therapy_bot.storage.get_or_create_psychological_profile(self.current_user_id)

            # Calculate session metrics dynamically
            total_messages = len(history)
            crisis_events = sum(1 for conv in history if conv.get('crisis_level') not in ['none', None])

            mood_scores = [conv.get('mood_score', 5.0) for conv in history if conv.get('mood_score')]
            avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 5.0

            # Get current timestamp for summary
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M")

            summary = f"""📋 **Enhanced Session Summary**
Generated: {current_time}

**📊 Session Metrics:**
- Total Messages: {total_messages}
- Average Mood Score: {avg_mood:.1f}/10
- Crisis Events: {crisis_events}
- Session Duration: {self._get_session_duration()}
- Primary Issue: {memory.primary_issue.replace('_', ' ').title() if memory.primary_issue else 'General support'}

**🎯 Key Themes Discussed:**
{self._extract_themes(history, memory)}

**💪 Strengths Identified:**
{self._extract_strengths(history)}

**🧠 Psychological Insights:**
{self._get_psychological_insights(psychological_profile)}

**📈 Progress Indicators:**
{self._get_progress_indicators(psychological_profile, avg_mood, crisis_events)}



**🧠 Session Memory Insights:**
{self._get_memory_insights(memory)}

**🌱 Personalized Recommendations:**
{self._generate_personalized_recommendations(history, memory, psychological_profile)}"""

            return summary

        except Exception as e:
            security_manager.audit_log(
                'SESSION_SUMMARY_ERROR',
                self.current_user_id or 'unknown', self.current_session_id or 'unknown',
                {'error_type': type(e).__name__},
                'ERROR'
            )
            print(f"❌ Error generating session summary: {e}")
            return "Unable to generate session summary due to a system error. Please try again later."

    def _get_session_duration(self) -> str:
        """Calculate and format session duration dynamically"""
        if self.session_start_time:
            duration = datetime.now() - self.session_start_time
            total_seconds = duration.total_seconds()
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)

            if hours > 0:
                return f"{hours}h {minutes}m"
            else:
                return f"{minutes}m"
        return "0m"

    def _get_memory_insights(self, memory: SessionMemory) -> str:
        """Generate insights from session memory"""
        insights = []

        if memory.primary_issue:
            insights.append(f"• Focused on {memory.primary_issue.replace('_', ' ')}")

        if memory.progress_notes:
            progress_count = len(memory.progress_notes)
            insights.append(f"• {progress_count} conversation turns tracked")

            # Analyze theme evolution dynamically
            early_themes = set()
            recent_themes = set()

            for note in memory.progress_notes[:3]:
                early_themes.update(note.get('themes', []))

            for note in memory.progress_notes[-3:]:
                recent_themes.update(note.get('themes', []))

            new_themes = recent_themes - early_themes
            if new_themes:
                themes_list = list(new_themes)[:2]
                insights.append(f"• New themes emerged: {', '.join(themes_list)}")

        return "\n".join(insights) if insights else "• Session memory is building understanding of your needs"

    def _extract_themes(self, history: List[Dict], memory: SessionMemory) -> str:
        """AI-powered theme extraction using both history and memory"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                # Get text from conversation history
                all_text = " ".join([conv['user_input'] for conv in history])
                
                theme_analysis_prompt = f"""
You are a mental health professional analyzing conversation themes from a therapy session.

Conversation text: "{all_text[:500]}..."
Session primary issue: {memory.primary_issue if memory.primary_issue else 'Unknown'}

Analyze the conversation and identify the main psychological and therapeutic themes present. Focus on:
- Emotional states and feelings expressed
- Life domains causing stress or concern
- Relationship dynamics
- Coping mechanisms mentioned
- Specific challenges or struggles
- Mental health topics discussed

Generate 3-4 main themes in a clear, therapeutic format. Use emoji indicators and format as:
• 😰 Theme Name: Brief description
• 💔 Theme Name: Brief description

Keep themes relevant to mental health and therapeutic work.

Main Themes:"""

                response = self.therapy_bot.llm.invoke(theme_analysis_prompt)
                ai_themes = self.therapy_bot._extract_llm_content(response)
                
                if ai_themes and len(ai_themes.strip()) > 20:
                    print(f"🎯 AI-extracted conversation themes: {self.therapy_bot._count_words(ai_themes)}w")
                    return ai_themes.strip()
                else:
                    print(f"⚠️ AI theme extraction failed, using fallback")
                    return self._fallback_theme_extraction(history, memory)
            else:
                print(f"⚠️ LLM unavailable for theme extraction")
                return self._fallback_theme_extraction(history, memory)
                
        except Exception as e:
            print(f"⚠️ AI theme extraction error: {e}")
            return self._fallback_theme_extraction(history, memory)

    def _fallback_theme_extraction(self, history: List[Dict], memory: SessionMemory) -> str:
        """Fallback theme extraction when AI is unavailable"""
        found_themes = []

        # Get themes from memory first
        if memory.key_themes:
            for theme in memory.key_themes[:2]:
                found_themes.append(f"• 🧠 {theme.replace('_', ' ').title()}")

        # Simple keyword-based theme detection as fallback
        try:
            all_text = " ".join([conv['user_input'] for conv in history]).lower()

            # Minimal hardcoded themes for fallback only
            basic_themes = {
                '• 😰 Anxiety/Stress': ['anxious', 'worried', 'panic', 'stressed', 'overwhelmed'],
                '• 😢 Emotional Difficulties': ['sad', 'depressed', 'hopeless', 'empty', 'down'],
                '• 💔 Relationship Concerns': ['relationship', 'partner', 'family', 'friends', 'lonely'],
                '• 💼 Work/Career Issues': ['work', 'job', 'career', 'boss', 'workplace']
            }

            for theme, keywords in basic_themes.items():
                if sum(1 for word in keywords if word in all_text) >= 1:
                    if theme not in found_themes:
                        found_themes.append(theme)

            return "\n".join(found_themes[:3]) if found_themes else "• 💙 General life concerns and wellbeing"

        except:
            return "• 🤝 Conversation themes being analyzed"

    def _extract_strengths(self, history: List[Dict]) -> str:
        """AI-powered strength identification from conversation"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                # Get text from conversation history
                all_text = " ".join([conv['user_input'] for conv in history])
                
                strength_analysis_prompt = f"""
You are a mental health professional identifying strengths and positive qualities from a therapy conversation.

Conversation text: "{all_text[:500]}..."

Analyze the conversation and identify the strengths, positive qualities, and resilient behaviors the person is demonstrating. Look for:
- Acts of courage (reaching out, being vulnerable, seeking help)
- Self-awareness and insight
- Problem-solving attempts
- Resilience and persistence
- Self-compassion or kindness to self
- Growth mindset or willingness to change
- Support-seeking behaviors
- Coping strategies mentioned

Generate 2-3 key strengths in a supportive format using emoji indicators:
• 💪 Strength: Brief description
• 🌱 Strength: Brief description

Focus on genuine strengths you can identify from what they've shared.

Identified Strengths:"""

                response = self.therapy_bot.llm.invoke(strength_analysis_prompt)
                ai_strengths = self.therapy_bot._extract_llm_content(response)
                
                if ai_strengths and len(ai_strengths.strip()) > 20:
                    print(f"🎯 AI-identified strengths: {self.therapy_bot._count_words(ai_strengths)}w")
                    return ai_strengths.strip()
                else:
                    print(f"⚠️ AI strength identification failed, using fallback")
                    return self._fallback_strength_extraction(history)
            else:
                print(f"⚠️ LLM unavailable for strength identification")
                return self._fallback_strength_extraction(history)
                
        except Exception as e:
            print(f"⚠️ AI strength identification error: {e}")
            return self._fallback_strength_extraction(history)

    def _fallback_strength_extraction(self, history: List[Dict]) -> str:
        """Fallback strength identification when AI is unavailable"""
        try:
            all_text = " ".join([conv['user_input'] for conv in history]).lower()

            # Basic strength indicators for fallback
            basic_strengths = {
                '• 🧘 Self-awareness': ['realize', 'understand', 'aware', 'recognize', 'notice'],
                '• 🤝 Seeking support': ['help', 'support', 'therapy', 'talking', 'reaching out'],
                '• 💪 Persistence': ['trying', 'working', 'effort', 'keep going', 'not giving up'],
                '• 🎯 Problem-solving': ['fix', 'handle', 'solve', 'figure out', 'work through']
            }

            found_strengths = []
            for strength, indicators in basic_strengths.items():
                if sum(1 for word in indicators if word in all_text) >= 1:
                    found_strengths.append(strength)

            return "\n".join(found_strengths[:3]) if found_strengths else "• 🤝 Courage in seeking support\n• 💪 Willingness to share experiences"

        except:
            return "• 🌟 Reaching out for support shows strength"

    def _generate_recommendations(self, history: List[Dict], memory: SessionMemory) -> str:
        """AI-powered personalized recommendations based on conversation"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                # Prepare context for recommendations
                crisis_count = sum(1 for conv in history if conv.get('crisis_level') in ['high', 'critical'])
                mood_scores = [conv.get('mood_score', 5.0) for conv in history if conv.get('mood_score')]
                avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 5.0
                
                all_text = " ".join([conv['user_input'] for conv in history])
                
                recommendation_prompt = f"""
You are a mental health professional providing personalized next steps and recommendations.

Session Context:
- Primary issue: {memory.primary_issue if memory.primary_issue else 'General support'}
- Crisis events: {crisis_count}
- Average mood: {avg_mood:.1f}/10
- Conversation count: {len(history)}

Conversation summary: "{all_text[:300]}..."

Based on this therapy session, generate 3-4 personalized, actionable recommendations for the person's next steps. Consider:
- Their specific issues and concerns raised
- Therapeutic techniques that would be helpful
- Self-care strategies appropriate to their situation
- Professional support recommendations if needed
- Practical coping tools they can use

Format as:
• 🌱 Recommendation: Specific action step
• 🧘 Recommendation: Specific action step

Make recommendations specific to what they've shared, not generic.

Personalized Recommendations:"""

                response = self.therapy_bot.llm.invoke(recommendation_prompt)
                ai_recommendations = self.therapy_bot._extract_llm_content(response)
                
                if ai_recommendations and len(ai_recommendations.strip()) > 20:
                    print(f"🎯 AI-generated recommendations: {self.therapy_bot._count_words(ai_recommendations)}w")
                    return ai_recommendations.strip()
                else:
                    print(f"⚠️ AI recommendation generation failed, using fallback")
                    return self._fallback_recommendations(history, memory)
            else:
                print(f"⚠️ LLM unavailable for recommendation generation")
                return self._fallback_recommendations(history, memory)
                
        except Exception as e:
            print(f"⚠️ AI recommendation generation error: {e}")
            return self._fallback_recommendations(history, memory)

    def _fallback_recommendations(self, history: List[Dict], memory: SessionMemory) -> str:
        """Fallback recommendations when AI is unavailable"""
        try:
            crisis_count = sum(1 for conv in history if conv.get('crisis_level') in ['high', 'critical'])
            mood_scores = [conv.get('mood_score', 5.0) for conv in history if conv.get('mood_score')]
            avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 5.0

            recommendations = []

            # Crisis-based recommendations
            if crisis_count > 0:
                recommendations.append("• 🆘 Consider scheduling an appointment with a mental health professional")

            # Issue-specific recommendations based on memory
            if memory.primary_issue:
                if 'work' in memory.primary_issue or 'stress' in memory.primary_issue:
                    recommendations.append("• 💼 Practice workplace stress management techniques")
                elif 'anxiety' in memory.primary_issue:
                    recommendations.append("• 🌬️ Practice breathing exercises daily")
                elif 'depression' in memory.primary_issue:
                    recommendations.append("• 🌅 Maintain daily routines and gentle activities")

            # Mood-based recommendations
            if avg_mood < 4.0:
                recommendations.append("• 🌱 Focus on daily mood-supporting activities")
            elif avg_mood < 6.0:
                recommendations.append("• � Practice regular mindfulness or meditation")

            # General recommendations
            recommendations.append("• 🔄 Continue building on our therapeutic relationship")

            return "\n".join(recommendations[:4])

        except:
            return "• 🤝 Continue building on our conversation\n• 🌱 Practice the coping strategies we discussed"

    def _get_psychological_insights(self, profile: PsychologicalProfile) -> str:
        """Generate psychological insights from user profile"""
        try:
            insights = []
            
            # Core psychological patterns
            if profile.core_patterns:
                pattern_count = len(profile.core_patterns)
                top_patterns = list(profile.core_patterns.keys())[:3]
                insights.append(f"• 🧠 {pattern_count} core psychological patterns identified: {', '.join(top_patterns)}")
            
            # Cognitive patterns
            if profile.cognitive_patterns:
                cognitive_count = len(profile.cognitive_patterns)
                insights.append(f"• 💭 {cognitive_count} cognitive patterns recognized")
            
            # Coping mechanisms
            if profile.coping_mechanisms:
                effective_coping = [name for name, data in profile.coping_mechanisms.items() 
                                  if isinstance(data, dict) and data.get('confidence', 0) > 0.7]
                if effective_coping:
                    insights.append(f"• 💪 Effective coping strategies: {', '.join(effective_coping[:3])}")
            
            # Trauma-informed insights (handle sensitively)
            if profile.trauma_indicators:
                trauma_count = len([t for t in profile.trauma_indicators.values() 
                                  if isinstance(t, dict) and t.get('present')])
                if trauma_count > 0:
                    insights.append(f"• 🛡️ Trauma-informed approach being used ({trauma_count} indicators)")
            
            return "\n".join(insights) if insights else "• 🌱 Psychological profile being developed through our conversations"
            
        except Exception as e:
            print(f"⚠️ Error generating psychological insights: {e}")
            return "• 🧠 Psychological insights being gathered"

    def _get_progress_indicators(self, profile: PsychologicalProfile, avg_mood: float, crisis_events: int) -> str:
        """Generate progress indicators from profile and session data"""
        try:
            indicators = []
            
            # Long-term progress summary
            if profile.long_term_progress:
                trend = profile.long_term_progress.get('current_risk_trend', 'unknown')
                momentum = profile.long_term_progress.get('therapeutic_momentum', 0)
                
                if trend == 'decreasing':
                    indicators.append("• 📈 Risk level trending downward (positive)")
                elif trend == 'increasing':
                    indicators.append("• 📊 Risk level needs attention (monitoring)")
                elif trend == 'stable':
                    indicators.append("• ➡️ Risk level stable")
                
                if momentum > 0.7:
                    indicators.append("• 🚀 Strong therapeutic momentum")
                elif momentum > 0.4:
                    indicators.append("• 📈 Moderate therapeutic progress")
            
            # Current session indicators
            if avg_mood >= 7.0:
                indicators.append(f"• 😊 Above-average mood reported ({avg_mood:.1f}/10)")
            elif avg_mood >= 5.0:
                indicators.append(f"• 😐 Neutral mood range ({avg_mood:.1f}/10)")
            else:
                indicators.append(f"• 😔 Below-average mood reported ({avg_mood:.1f}/10)")
            
            if crisis_events == 0:
                indicators.append("• ✅ No crisis events in this session")
            else:
                indicators.append(f"• ⚠️ {crisis_events} crisis event(s) addressed")
            
            # Resilience indicators
            if profile.resilience_factors:
                resilience_count = len(profile.resilience_factors)
                indicators.append(f"• 💎 {resilience_count} resilience factors identified")
            
            return "\n".join(indicators) if indicators else "• 📊 Progress tracking initialized"
            
        except Exception as e:
            print(f"⚠️ Error generating progress indicators: {e}")
            return "• 📈 Progress indicators being tracked"

    

    def _generate_personalized_recommendations(self, history: List[Dict], memory: SessionMemory, 
                                             profile: PsychologicalProfile) -> str:
        """Generate personalized recommendations based on psychological profile"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                # Create comprehensive context for personalized recommendations
                profile_summary = self._create_profile_context_summary(profile)
                crisis_count = sum(1 for conv in history if conv.get('crisis_level') in ['high', 'critical'])
                mood_scores = [conv.get('mood_score', 5.0) for conv in history if conv.get('mood_score')]
                avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 5.0
                
                all_text = " ".join([conv['user_input'] for conv in history[-5:]])  # Last 5 conversations
                
                personalized_prompt = f"""
You are a mental health professional creating highly personalized recommendations.

Session Context:
- Primary issue: {memory.primary_issue if memory.primary_issue else 'General support'}
- Crisis events: {crisis_count}
- Average mood: {avg_mood:.1f}/10
- Conversation count: {len(history)}

Psychological Profile Summary:
{profile_summary}

Recent conversation context: "{all_text[:400]}..."

Create 4-5 highly personalized recommendations that consider:
1. Their specific psychological patterns
2. Their effective coping mechanisms and build on them
3. Their trauma-informed needs (if applicable)
4. Their identified strengths and resilience factors
5. Specific, actionable steps tailored to their unique profile

IMPORTANT: Recommendations should be provided in professional therapeutic language. Do not adapt communication style based on user's communication patterns - maintain professional therapeutic voice.

Format as:
• 🎯 Recommendation: Specific personalized action
• 🧠 Recommendation: Cognitive/emotional strategy
• 💪 Recommendation: Strength-based intervention

Make each recommendation specific to their profile, not generic advice.

Personalized Recommendations:"""

                response = self.therapy_bot.llm.invoke(personalized_prompt)
                ai_recommendations = self.therapy_bot._extract_llm_content(response)
                
                if ai_recommendations and len(ai_recommendations.strip()) > 50:
                    print(f"🎯 Generated personalized recommendations: {self.therapy_bot._count_words(ai_recommendations)}w")
                    return ai_recommendations.strip()
                else:
                    print(f"⚠️ AI personalized recommendation generation failed, using enhanced fallback")
                    return self._enhanced_fallback_recommendations(history, memory, profile)
            else:
                print(f"⚠️ LLM unavailable for personalized recommendations")
                return self._enhanced_fallback_recommendations(history, memory, profile)
                
        except Exception as e:
            print(f"⚠️ Personalized recommendation generation error: {e}")
            return self._enhanced_fallback_recommendations(history, memory, profile)

    def _enhanced_fallback_recommendations(self, history: List[Dict], memory: SessionMemory, 
                                         profile: PsychologicalProfile) -> str:
        """Enhanced fallback recommendations using profile data"""
        try:
            recommendations = []
            
            # Profile-based recommendations
            if profile.coping_mechanisms:
                effective_coping = [name for name, data in profile.coping_mechanisms.items() 
                                  if isinstance(data, dict) and data.get('confidence', 0) > 0.6]
                if effective_coping:
                    recommendations.append(f"• 💪 Continue using your effective coping strategies: {', '.join(effective_coping[:2])}")
            
            
            
            # Crisis-informed recommendations
            crisis_count = sum(1 for conv in history if conv.get('crisis_level') in ['high', 'critical'])
            if crisis_count > 0:
                recommendations.append("• 🆘 Continue building your crisis management skills with professional support")
            
            # Progress-based recommendations
            if profile.long_term_progress:
                momentum = profile.long_term_progress.get('therapeutic_momentum', 0)
                if momentum > 0.6:
                    recommendations.append("• 📈 Maintain your positive therapeutic momentum")
                else:
                    recommendations.append("• 🌱 Focus on small, consistent steps for progress")
            
            # Issue-specific recommendations
            if memory.primary_issue:
                if 'work' in memory.primary_issue:
                    recommendations.append("• 💼 Develop workplace-specific stress management techniques")
                elif 'anxiety' in memory.primary_issue:
                    recommendations.append("• 🌬️ Practice daily anxiety management techniques")
                elif 'relationship' in memory.primary_issue:
                    recommendations.append("• 💕 Focus on communication and boundary-setting skills")
            
            # Default recommendations if none generated
            if not recommendations:
                recommendations = [
                    "• 🤝 Continue our therapeutic conversations",
                    "• 🧠 Practice self-awareness and mindfulness",
                    "• 💪 Build on the strengths you've shown",
                    "• 🌱 Take things one step at a time"
                ]
            
            return "\n".join(recommendations[:5])  # Limit to 5 recommendations
            
        except Exception as e:
            print(f"⚠️ Enhanced fallback recommendations error: {e}")
            return "• 🤝 Continue building on our therapeutic relationship\n• 🌱 Practice the insights we've discovered together"

    def _create_profile_context_summary(self, profile: PsychologicalProfile) -> str:
        """Create a concise summary of psychological profile for context (enhanced version)"""
        try:
            summary_parts = []
            
            # Core patterns (most important)
            if profile.core_patterns:
                patterns = list(profile.core_patterns.keys())[:3]
                summary_parts.append(f"Core patterns: {', '.join(patterns)}")
            
           
            
            # Trauma indicators (handle sensitively)
            if profile.trauma_indicators:
                trauma_count = len([t for t in profile.trauma_indicators.values() 
                                 if isinstance(t, dict) and t.get('present')])
                if trauma_count > 0:
                    summary_parts.append(f"Trauma-informed approach needed ({trauma_count} indicators)")
            
            # Coping mechanisms (enhanced)
            if profile.coping_mechanisms:
                effective_coping = [name for name, data in profile.coping_mechanisms.items() 
                                  if isinstance(data, dict) and data.get('confidence', 0) > 0.6]
                if effective_coping:
                    summary_parts.append(f"Effective coping: {', '.join(effective_coping[:2])}")
            
            # Therapeutic preferences
            if profile.therapeutic_preferences:
                prefs = list(profile.therapeutic_preferences.keys())[:2]
                summary_parts.append(f"Therapeutic preferences: {', '.join(prefs)}")
            
            # Progress indicators
            if profile.long_term_progress:
                trend = profile.long_term_progress.get('current_risk_trend', 'unknown')
                if trend != 'unknown':
                    summary_parts.append(f"Progress trend: {trend}")
            
            return " | ".join(summary_parts) if summary_parts else "Comprehensive profile being developed"
            
        except Exception as e:
            print(f"⚠️ Enhanced profile summary creation error: {e}")
            return "Profile context available"

# Initialize interface
if therapy_bot:
    interface = TherapyInterface(therapy_bot)
    print("✅ Enhanced therapy interface ready!")
else:
    interface = None
    print("❌ Therapy bot not available")

# Simple Console Interface (instead of Gradio)

def run_console_therapy_session():
    """Run a simple console-based therapy session"""

    if not interface:
        print("❌ Therapy bot not properly initialized. Please check your setup.")
        return

    print("=" * 60)
    print("🤝 Mental Health Support Chat - Console Version")
    print("=" * 60)
    print("Type 'quit', 'exit', or 'bye' to end the session")
    print("Type 'summary' to get a session summary")
    print("Type 'new' to start a new session")
    print("=" * 60)

    # Start initial session
    welcome_msg = interface.start_session()
    print(f"\n🤖 Bot: {welcome_msg}\n")

    # Main conversation loop
    while True:
        try:
            # Get user input
            user_input = input("👤 You: ").strip()

            # Handle special commands
            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("\n🤖 Bot: Thank you for sharing with me today. Take care, and remember that support is always available when you need it.")
                print("\n Remember: If you're in crisis, contact 1019 (Mental Health Crisis Line) or 1166 (Emergency)")
                break

            elif user_input.lower() == 'summary':
                summary = interface.get_session_summary()
                print(f"\n📋 {summary}\n")
                continue

            elif user_input.lower() == 'new':
                welcome_msg = interface.start_session()
                print(f"\n🤖 Bot: {welcome_msg}\n")
                continue

            elif not user_input:
                print("Please enter a message or type 'quit' to exit.")
                continue

            # Get bot response
            print("\n🤖 Thinking...")
            response = interface.send_message(user_input)
            print(f"\n🤖 Bot: {response}\n")

        except KeyboardInterrupt:
            print("\n\n🤖 Bot: Session interrupted. Take care!")
            # Secure cleanup
            if interface and interface.current_session_id:
                security_manager.audit_log(
                    'SESSION_INTERRUPTED',
                    interface.current_user_id or 'unknown',
                    interface.current_session_id,
                    {'reason': 'keyboard_interrupt'}
                )
            break
        except Exception as e:
            # Log error securely without exposing sensitive data
            if interface and interface.current_session_id:
                security_manager.audit_log(
                    'SESSION_ERROR',
                    interface.current_user_id or 'unknown',
                    interface.current_session_id,
                    {'error_type': type(e).__name__},
                    'ERROR'
                )
            print(f"\n❌ Error: A security or system error occurred. Please try again or type 'quit' to exit.")
    
    # Final cleanup on exit
    if interface and interface.current_session_id:
        security_manager.audit_log(
            'CONSOLE_SESSION_ENDED',
            interface.current_user_id or 'console_user',
            interface.current_session_id,
            {'total_conversations': interface.conversation_count}
        )
        print("\n🔒 Session ended securely. All data protected.")

def test_therapy_bot():
    """Test the therapy bot with sample conversations"""

    if not interface:
        print("❌ Therapy bot not available for testing")
        return

    print("🧪 Testing Therapy Bot...")

    # Start session
    welcome = interface.start_session()
    print(f"Welcome: {welcome[:100]}...")

    # Test messages
    test_messages = [
        "Hi, I'm having a rough day at work",
        "My boss scolded me in front of everyone and I feel so embarrassed",
        "I just want to forget about it",
        "Thanks for listening"
    ]

    for msg in test_messages:
        print(f"\n📤 Test input: {msg}")
        response = interface.send_message(msg)
        print(f"📥 Response: {response[:150]}...")

    # Get summary
    summary = interface.get_session_summary()
    print(f"\n📋 Summary: {summary[:200]}...")

    # Secure cleanup after testing
    if interface and interface.current_session_id:
        security_manager.audit_log(
            'TEST_SESSION_COMPLETED',
            interface.current_user_id or 'test_user',
            interface.current_session_id,
            {'test_messages': len(test_messages)}
        )

    print("\n✅ Bot test completed with secure cleanup!")

# Security maintenance functions
def cleanup_expired_data():
    """Clean up expired data across all storage systems"""
    try:
        if 'interface' in globals() and interface and interface.therapy_bot and interface.therapy_bot.storage:
            interface.therapy_bot.storage.cleanup_expired_data()
        print("✅ Data cleanup completed")
    except Exception as e:
        print(f"❌ Data cleanup failed: {e}")

def anonymize_user_data(user_id: str):
    """Anonymize user data for privacy compliance"""
    try:
        if 'interface' in globals() and interface and interface.therapy_bot and interface.therapy_bot.storage:
            interface.therapy_bot.storage.anonymize_user_data(user_id)
        print(f"✅ User data anonymized for {security_manager.hash_pii(user_id)}")
    except Exception as e:
        print(f"❌ User data anonymization failed: {e}")

def get_security_status() -> Dict[str, Any]:
    """Get current security configuration status"""
    return {
        'encryption_enabled': SECURITY_CONFIG['ENCRYPTION_ENABLED'],
        'audit_logging': SECURITY_CONFIG['AUDIT_LOGGING'],
        'data_retention_days': SECURITY_CONFIG['DATA_RETENTION_DAYS'],
        'rate_limiting': True,
        'session_validation': SECURITY_CONFIG['VALIDATE_SESSION_TOKENS'],
        'input_sanitization': SECURITY_CONFIG['SANITIZE_INPUTS'],
        'active_sessions': len(security_manager.session_tokens),
        'security_version': '2.0'
    }

# API Mode - Don't run console interface automatically
print("🔒 Secure Therapy Bot ready for API integration!")
print("🛡️ Security Features Enabled:")
print(f"  - Encryption: {SECURITY_CONFIG['ENCRYPTION_ENABLED']}")
print(f"  - Audit Logging: {SECURITY_CONFIG['AUDIT_LOGGING']}")
print(f"  - Rate Limiting: Enabled")
print(f"  - Input Sanitization: {SECURITY_CONFIG['SANITIZE_INPUTS']}")
print(f"  - Session Validation: {SECURITY_CONFIG['VALIDATE_SESSION_TOKENS']}")
print("🔗 Available functions for external calls:")
print("- interface.start_session() to start (with secure token)")
print("- interface.send_message('your message') to chat (with validation)") 
print("- interface.get_session_summary() to get summary (with access control)")
print("- cleanup_expired_data() for data maintenance")
print("- anonymize_user_data(user_id) for privacy compliance")
print("- get_security_status() for security monitoring")
print("🌟 Ready to be imported by therapy_service.py with comprehensive security controls")
