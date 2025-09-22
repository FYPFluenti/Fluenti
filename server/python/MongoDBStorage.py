
import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import asyncio

# Import common utilities
from utils.env_manager import get_connection_string
from utils.user_context import get_user_context
from utils.error_handler import safe_execute, log_error

class MongoDBStorage:
    """MongoDB Atlas storage for therapy data with current user integration"""

    def __init__(self, connection_string: Optional[str] = None):
        # Use provided connection string or get from environment
        if not connection_string:
            connection_string = get_connection_string('mongodb', required=False)

        # Fallback if no connection string available
        if not connection_string:
            print("⚠️ No MongoDB connection string found, using fallback storage")
            self._fallback_to_file_storage()
            return

        self.connection_string = connection_string

        # Get current user context using utilities
        self.current_user = get_user_context()

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

            # Create indexes for better performance
            self._create_indexes()

            print("MongoDB Atlas connected successfully!")
            print(f"Current user: {self.current_user['login']}")
            print(f"Session time: {self.current_user['timestamp']}")
            print("Database: therapy_support_db")
            self.use_mongodb = True

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            log_error(e, "MongoDB connection failed")
            print("Falling back to file-based storage...")
            self._fallback_to_file_storage()

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

            print("Database indexes created successfully")

        except Exception as e:
            print(f"Warning: Error creating indexes: {e}")

    def _fallback_to_file_storage(self):
        """Fallback to file-based storage if MongoDB fails"""
        self.use_mongodb = False
        
        # Use different base directories for different environments
        if self.current_user['environment'] == 'VS-Code':
            self.base_dir = os.path.join(os.getcwd(), "therapy_data")
        else:
            self.base_dir = "/content/therapy_data"
            
        os.makedirs(self.base_dir, exist_ok=True)
        os.makedirs(f"{self.base_dir}/conversations", exist_ok=True)
        os.makedirs(f"{self.base_dir}/sessions", exist_ok=True)
        os.makedirs(f"{self.base_dir}/crisis_logs", exist_ok=True)
        print(f"File-based storage initialized as fallback at {self.base_dir}")

    def save_conversation(self, user_id: str, session_id: str, user_input: str,
                         bot_response: str, crisis_level: str,
                         mood_score: Optional[float] = None):
        """Save conversation to MongoDB or file storage"""

        conversation_doc = {
            "user_id": user_id,
            "session_id": session_id,
            "user_login": self.current_user['login'],
            "timestamp": datetime.now(timezone.utc),
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
                print(f"Conversation saved to MongoDB: {result.inserted_id}")

                # Update user profile
                self._update_user_profile(user_id, conversation_doc)

            else:
                # Fallback to file storage
                self._save_to_file(conversation_doc, f"conversations/{user_id}_{session_id}")

        except Exception as e:
            print(f"Error saving conversation: {e}")
            # Fallback to file storage
            self._save_to_file(conversation_doc, f"conversations/{user_id}_{session_id}")

        # Log crisis events
        if crisis_level != "none":
            self.log_crisis_event(user_id, session_id, crisis_level, user_input)

    def log_crisis_event(self, user_id: str, session_id: str, crisis_level: str, user_input: str):
        """Log crisis events to MongoDB or file storage"""

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
                print(f"CRISIS EVENT LOGGED to MongoDB: {crisis_level} for user {user_id}")

                # Send immediate alert for high/critical crises
                if crisis_level in ["high", "critical"]:
                    self._send_crisis_alert(crisis_doc)

            else:
                # Fallback to file storage
                self._save_to_file(crisis_doc, f"crisis_logs/crisis_{datetime.now().strftime('%Y%m%d')}")
                print(f"CRISIS EVENT LOGGED to file: {crisis_level} for user {user_id}")

        except Exception as e:
            print(f"Error logging crisis event: {e}")
            # Fallback to file storage
            self._save_to_file(crisis_doc, f"crisis_logs/crisis_{datetime.now().strftime('%Y%m%d')}")

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
            print(f"Warning: Error updating user profile: {e}")

    def _send_crisis_alert(self, crisis_doc: Dict):
        """Send crisis alert (placeholder for real implementation)"""
        try:
            # Mark alert as sent
            if hasattr(self, 'crisis_logs') and "_id" in crisis_doc:
                self.crisis_logs.update_one(
                    {"_id": crisis_doc.get("_id")},
                    {"$set": {"alert_sent": True, "alert_timestamp": datetime.now(timezone.utc)}}
                )

            print(f"CRISIS ALERT: {crisis_doc['crisis_level']} level crisis detected for {crisis_doc['user_login']}")
            print(f"   Time: {crisis_doc['timestamp']}")
            print(f"   Session: {crisis_doc['session_id']}")

        except Exception as e:
            print(f"Error sending crisis alert: {e}")

    def get_conversation_history(self, user_id: str, session_id: str, limit: int = 10) -> List[Dict]:
        """Retrieve conversation history from MongoDB or file storage"""
        try:
            if hasattr(self, 'conversations'):
                # Get from MongoDB
                conversations = list(
                    self.conversations.find(
                        {
                            "user_id": user_id,
                            "session_id": session_id,
                            "user_login": self.current_user['login']  # Ensure user isolation
                        }
                    ).sort("timestamp", 1).limit(limit)
                )

                # Convert MongoDB docs to expected format
                formatted_conversations = []
                for conv in conversations:
                    formatted_conversations.append({
                        "user_id": conv["user_id"],
                        "session_id": conv["session_id"],
                        "timestamp": conv["timestamp"].isoformat() if hasattr(conv["timestamp"], 'isoformat') else str(conv["timestamp"]),
                        "user_input": conv["user_input"],
                        "bot_response": conv["bot_response"],
                        "crisis_level": conv["crisis_level"],
                        "mood_score": conv.get("mood_score"),
                        "input_length": conv.get("input_length", 0),
                        "response_length": conv.get("response_length", 0)
                    })

                return formatted_conversations[-limit:] if formatted_conversations else []

            else:
                # Fallback to file storage
                return self._get_from_file(f"conversations/{user_id}_{session_id}", limit)

        except Exception as e:
            print(f"Error retrieving conversation history: {e}")
            return []

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
            print(f"Error getting user analytics: {e}")
            return {"error": str(e)}

    def _save_to_file(self, doc: Dict, path: str):
        """Save document to file (fallback method)"""
        try:
            # Convert datetime objects to ISO strings for JSON serialization
            doc_copy = doc.copy()
            if 'timestamp' in doc_copy and hasattr(doc_copy['timestamp'], 'isoformat'):
                doc_copy['timestamp'] = doc_copy['timestamp'].isoformat()

            filename = f"{self.base_dir}/{path}.jsonl"
            os.makedirs(os.path.dirname(filename), exist_ok=True)

            with open(filename, "a") as f:
                f.write(json.dumps(doc_copy, default=str) + "\n")

        except Exception as e:
            print(f"Error saving to file: {e}")

    def _get_from_file(self, path: str, limit: int = 10) -> List[Dict]:
        """Get documents from file (fallback method)"""
        try:
            filename = f"{self.base_dir}/{path}.jsonl"
            conversations = []

            if os.path.exists(filename):
                with open(filename, "r") as f:
                    for line in f:
                        conversations.append(json.loads(line.strip()))

            return conversations[-limit:] if conversations else []

        except Exception as e:
            print(f"Error reading from file: {e}")
            return []

    def close_connection(self):
        """Close MongoDB connection"""
        try:
            if hasattr(self, 'client'):
                self.client.close()
                print("MongoDB connection closed")
        except Exception as e:
            print(f"Warning: Error closing MongoDB connection: {e}")

    def __del__(self):
        """Cleanup when object is destroyed"""
        self.close_connection()

# Initialize enhanced storage with MongoDB
try:
    storage = MongoDBStorage()
    print("Enhanced MongoDB storage system ready!")
    print(f"Connected to: FluentiAI-cluster")
    print(f"Database: therapy_support_db")
    print(f"Collections: conversations, sessions, crisis_logs, user_profiles")

except Exception as e:
    print(f"Error initializing MongoDB storage: {e}")
    print("Creating fallback file storage...")

    # Fallback to simple file storage
    class FileBasedStorage:
        def __init__(self, base_dir: Optional[str] = None):
            if base_dir is None:
                # Detect environment and set appropriate directory
                if 'VSCODE_PID' in os.environ:
                    base_dir = os.path.join(os.getcwd(), "therapy_data")
                else:
                    base_dir = "/content/therapy_data"
                    
            self.base_dir = base_dir
            os.makedirs(base_dir, exist_ok=True)
            os.makedirs(f"{base_dir}/conversations", exist_ok=True)
            os.makedirs(f"{base_dir}/sessions", exist_ok=True)
            os.makedirs(f"{base_dir}/crisis_logs", exist_ok=True)
            
            # Get current user
            import getpass
            try:
                user_login = getpass.getuser()
            except:
                user_login = 'afaqm3121-lab'
                
            self.current_user = {'login': user_login}

        def save_conversation(self, user_id: str, session_id: str, user_input: str,
                             bot_response: str, crisis_level: str, mood_score: Optional[float] = None):
            conversation_doc = {
                "user_id": user_id, "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_input": user_input, "bot_response": bot_response,
                "crisis_level": crisis_level, "mood_score": mood_score,
                "input_length": len(user_input), "response_length": len(bot_response)
            }
            filename = f"{self.base_dir}/conversations/{user_id}_{session_id}.jsonl"
            with open(filename, "a") as f:
                f.write(json.dumps(conversation_doc) + "\n")
            if crisis_level != "none":
                self.log_crisis_event(user_id, session_id, crisis_level, user_input)

        def log_crisis_event(self, user_id: str, session_id: str, crisis_level: str, user_input: str):
            crisis_doc = {
                "user_id": user_id, "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "crisis_level": crisis_level, "user_input": user_input[:200],
                "requires_followup": crisis_level in ["high", "critical"]
            }
            filename = f"{self.base_dir}/crisis_logs/crisis_{datetime.now().strftime('%Y%m%d')}.jsonl"
            with open(filename, "a") as f:
                f.write(json.dumps(crisis_doc) + "\n")

        def get_conversation_history(self, user_id: str, session_id: str, limit: int = 10) -> List[Dict]:
            filename = f"{self.base_dir}/conversations/{user_id}_{session_id}.jsonl"
            conversations = []
            if os.path.exists(filename):
                with open(filename, "r") as f:
                    for line in f:
                        conversations.append(json.loads(line.strip()))
            return conversations[-limit:] if conversations else []

    storage = FileBasedStorage()
    print("Fallback file storage system ready!")