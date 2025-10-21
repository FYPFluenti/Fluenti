# Essential imports for therapy bot system
import json
import os
import time
import logging
import asyncio
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
from dataclasses import dataclass
from enum import Enum

# Load environment variables
from dotenv import load_dotenv
load_dotenv()  # Load variables from .env file

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
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Sentiment analysis
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:
    try:
        from nltk.sentiment.vader import SentimentIntensityAnalyzer
    except ImportError:
        SentimentIntensityAnalyzer = None

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
    """MongoDB Atlas storage for therapy data with current user integration"""

    def __init__(self, connection_string: Optional[str] = None):
        # Use provided connection string or environment variable
        if not connection_string:
            connection_string = os.getenv('MONGODB_URI')
            
        if not connection_string:
            raise ValueError("MongoDB connection string required. Please set MONGODB_URI environment variable.")

        self.connection_string = connection_string

        # Get current user context
        self.current_user = self._get_current_user_context()

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

    def _get_current_user_context(self) -> Dict:
        """Get current user context from environment"""
        current_time = datetime.now(timezone.utc)

        # Use environment variable or default user login
        user_login = os.getenv('USER_LOGIN', 'afaqm3121-lab')

        return {
            'login': user_login,
            'timestamp': current_time,
            'session_start': current_time.isoformat(),
            'user_agent': os.getenv('HTTP_USER_AGENT', 'Colab-Environment'),
            'environment': 'Google-Colab'
        }

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

            print("📊 Database indexes created successfully")

        except Exception as e:
            print(f"⚠️ Error creating indexes: {e}")



    def save_conversation(self, user_id: str, session_id: str, user_input: str,
                         bot_response: str, crisis_level: str,
                         mood_score: Optional[float] = None):
        """Save conversation to MongoDB"""

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

    def get_conversation_history(self, user_id: str, session_id: str, limit: int = 10) -> List[Dict]:
        """Retrieve conversation history from MongoDB"""
        try:
            # First try to get from EmotionalSession collection (Node.js service)
            if hasattr(self, 'emotional_sessions'):
                emotional_session = self.emotional_sessions.find_one({
                    "id": session_id,
                    "userId": user_id
                })
                
                if emotional_session and emotional_session.get('messages'):
                    print(f"✅ Found session in EmotionalSession collection: {len(emotional_session['messages'])} messages")
                    formatted_conversations = []
                    for msg in emotional_session['messages'][-limit:]:
                        if msg.get('role') == 'user':
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
                            # Assistant message - add to last user message
                            formatted_conversations[-1]['bot_response'] = msg.get('content', '')
                            formatted_conversations[-1]['response_length'] = len(msg.get('content', ''))
                    
                    return formatted_conversations
            
            # Fallback to conversations collection (Python service)
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
                raise RuntimeError("MongoDB connection not available")

        except Exception as e:
            print(f"❌ Error retrieving conversation history: {e}")
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

# Initialize enhanced storage with MongoDB
try:
    storage = MongoDBStorage()
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

    @staticmethod
    def load_mental_health_datasets():
        """Load multiple mental health datasets from Hugging Face - optimized for speed"""
        datasets = []

        try:
            print("📊 Loading focused mental health datasets...")

            # Dataset 1: Mental health counseling conversations (KEEP - working well)
            try:
                print("Loading counseling conversations dataset...")
                dataset1 = load_dataset("Amod/mental_health_counseling_conversations", split='train')
                datasets.append(dataset1)
                print(f"✅ Loaded {safe_dataset_len(dataset1)} counseling conversations")
            except Exception as e:
                print(f"⚠️ Could not load counseling dataset: {e}")

            # Dataset 2: Mental health chatbot dataset (KEEP - working well)
            try:
                print("Loading mental health chatbot dataset...")
                dataset2 = load_dataset("heliosbrahma/mental_health_chatbot_dataset", split='train')
                datasets.append(dataset2)
                print(f"✅ Loaded {safe_dataset_len(dataset2)} chatbot conversations")
            except Exception as e:
                print(f"⚠️ Could not load chatbot dataset: {e}")

            # Dataset 3: Counsel Chat - Therapy conversations (KEEP - working well)
            try:
                print("Loading counsel chat therapy dataset...")
                dataset3 = load_dataset("nbertagnolli/counsel-chat", split='train')
                datasets.append(dataset3)
                print(f"✅ Loaded {safe_dataset_len(dataset3)} counsel chat conversations")
            except Exception as e:
                print(f"⚠️ Could not load counsel chat dataset: {e}")

            # Dataset 4: Mental health conversations - Alternative smaller dataset
            try:
                print("Loading focused mental health conversations...")
                dataset4 = load_dataset("Amod/mental_health_counseling_conversations", split='train[:1000]')  # Limit to 1000
                datasets.append(dataset4)
                print(f"✅ Loaded {safe_dataset_len(dataset4)} additional conversations")
            except Exception as e:
                print(f"⚠️ Could not load additional conversations: {e}")

            # Dataset 5: Mental health support conversations
            try:
                print("Loading mental health support conversations...")
                dataset5 = load_dataset("mental_health_dataset", split='train[:5000]')  # Limit to 5000
                datasets.append(dataset5)
                print(f"✅ Loaded {safe_dataset_len(dataset5)} mental health support conversations")
            except Exception as e:
                print(f"⚠️ Could not load mental health support dataset: {e}")

            # Dataset 6: Mental health support - LIMITED SIZE
            try:
                print("Loading limited support conversations...")
                dataset6 = load_dataset("HuggingFaceH4/ultrachat_200k", split='train_sft[:10000]')  # Only 10k instead of 200k
                datasets.append(dataset6)
                print(f"✅ Loaded {safe_dataset_len(dataset6)} support conversations")
            except Exception as e:
                print(f"⚠️ Could not load support dataset: {e}")

            # Dataset 7: Therapeutic conversations - LIMITED SIZE
            try:
                print("Loading limited therapeutic conversations...")
                dataset7 = load_dataset("nvidia/HelpSteer", split='train[:5000]')  # Only 5k instead of 35k
                datasets.append(dataset7)
                print(f"✅ Loaded {safe_dataset_len(dataset7)} therapeutic conversations")
            except Exception as e:
                print(f"⚠️ Could not load therapeutic dataset: {e}")

            # Dataset 8: Mental health Q&A dataset
            try:
                print("Loading mental health Q&A dataset...")
                dataset8 = load_dataset("squad", split='train[:5000]')  # Limited size
                datasets.append(dataset8)
                print(f"✅ Loaded {safe_dataset_len(dataset8)} Q&A examples")
            except Exception as e:
                print(f"⚠️ Could not load Q&A dataset: {e}")

            # Dataset 9: Conversational AI dataset
            try:
                print("Loading conversational AI dataset...")
                dataset9 = load_dataset("daily_dialog", split='train[:3000]')  # Limited size
                datasets.append(dataset9)
                print(f"✅ Loaded {safe_dataset_len(dataset9)} conversational examples")
            except Exception as e:
                print(f"⚠️ Could not load conversational dataset: {e}")

            # Dataset 10: Mental health classification dataset
            try:
                print("Loading mental health classification dataset...")
                dataset10 = load_dataset("emotion", split='train[:2000]')  # Limited size
                datasets.append(dataset10)
                print(f"✅ Loaded {safe_dataset_len(dataset10)} emotion classification examples")
            except Exception as e:
                print(f"⚠️ Could not load emotion dataset: {e}")

            if datasets:
                # Safely calculate total entries
                total_entries = 0
                dataset_count = 0
                for dataset in datasets:
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

    
# Load the enhanced datasets
datasets = DataLoader.load_mental_health_datasets()
print("📚 Enhanced mental health knowledge base ready!")

import re
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict, Counter
import json
from datetime import datetime

class CrisisDetector:
    """Fully dynamic crisis detection system with AI-powered analysis"""

    def __init__(self, llm=None, detection_mode="hybrid"):
        self.llm = llm  # LLM for AI-powered crisis detection
        self.detection_mode = detection_mode  # "ai", "pattern", or "hybrid"
        
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

        # Get current user context
        self.current_user = self._get_current_user_context()

        print(f"✅ Fully dynamic crisis detection initialized for user: {self.current_user['login']}")

    def _get_current_user_context(self) -> Dict[str, Any]:
        """Extract current user context dynamically"""
        current_time = datetime.utcnow()

        return {
            'login': os.getenv('USER_LOGIN', 'anonymous_user'),
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

        # Define dynamic categorization rules
        categorization_clues = {
            'academic': ['school', 'study', 'exam', 'class', 'grade', 'homework', 'college', 'university', 'learn', 'education'],
            'professional': ['work', 'job', 'office', 'boss', 'career', 'salary', 'meeting', 'colleague', 'company'],
            'personal': ['family', 'friend', 'relationship', 'partner', 'parent', 'child', 'sibling'],
            'health': ['doctor', 'hospital', 'medicine', 'illness', 'pain', 'treatment', 'therapy', 'medical'],
            'financial': ['money', 'budget', 'debt', 'bill', 'income', 'expense', 'saving', 'cost'],
            'emotional': ['feel', 'emotion', 'mood', 'mental', 'psychological', 'stress', 'anxiety', 'depression'],
            'social': ['people', 'social', 'community', 'group', 'team', 'club', 'organization'],
            'recreational': ['hobby', 'game', 'sport', 'music', 'art', 'entertainment', 'fun', 'leisure']
        }

        # Score each category
        category_scores = defaultdict(int)
        for category, clues in categorization_clues.items():
            for clue in clues:
                if clue in surrounding:
                    category_scores[category] += 1

        # Return highest scoring category or 'general' if no clear winner
        if category_scores:
            return max(category_scores.items(), key=lambda x: x[1])[0]
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

        # Language patterns that indicate help seeking
        text_lower = text.lower()

        # Learn new help-seeking patterns dynamically
        help_patterns = [
            'help', 'advice', 'suggest', 'recommend', 'guide', 'assist', 'support',
            'how to', 'what should', 'can you', 'could you', 'would you',
            'i need', 'looking for', 'trying to', 'want to learn'
        ]

        for pattern in help_patterns:
            if pattern in text_lower:
                help_score += 1.0
                self.learned_patterns['help_seeking'][pattern] += 1

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

        # CRITICAL: Explicit suicide/self-harm detection patterns -  More nuanced scoring
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

        # Learn crisis patterns dynamically
        crisis_patterns = {
            'self_reference_negative': ['i am', 'i feel', 'i can\'t', 'i don\'t', 'i won\'t'],
            'absolute_language': ['never', 'always', 'nothing', 'everything', 'everyone', 'nobody'],
            'despair_language': ['hopeless', 'pointless', 'useless', 'worthless', 'meaningless'],
            'isolation_language': ['alone', 'lonely', 'isolated', 'abandoned', 'rejected'],
            'pain_language': ['hurt', 'pain', 'suffering', 'agony', 'unbearable'],
            'escape_language': ['escape', 'get away', 'run away', 'disappear', 'vanish'],
            'finality_language': ['end', 'over', 'finished', 'done', 'final', 'last']
        }

        for pattern_type, patterns in crisis_patterns.items():
            for pattern in patterns:
                if pattern in text_lower:
                    # Base score for pattern -  Lower scores for common words
                    if pattern_type in ['absolute_language', 'self_reference_negative']:
                        pattern_score = 0.3  # Very common words, low crisis weight
                    elif pattern_type in ['isolation_language', 'pain_language']:
                        pattern_score = 0.5  # Moderate weight
                    else:
                        pattern_score = 1.0  # Higher weight for more specific crisis language

                    # Adjust based on context
                    if contexts:
                        # Reduce score if in specific non-life contexts
                        non_critical_contexts = {'academic', 'professional', 'recreational', 'financial'}
                        if any(ctx in non_critical_contexts for ctx in contexts):
                            pattern_score *= 0.4

                    # Apply multipliers
                    pattern_score *= intensity_multiplier * temporal_urgency

                    crisis_score += pattern_score
                    
                    if pattern_score > 0.5:  # Only log significant scores
                        detected_indicators.append(f"{pattern} ({pattern_type})")

                    # Learn this pattern
                    self.learned_patterns['crisis_indicators'][pattern]['severity'] = pattern_score
                    for context in contexts:
                        self.learned_patterns['crisis_indicators'][pattern]['context_associations'][context] += 1

        # Sentiment analysis contribution
        if self.sentiment_available and self.sentiment_analyzer is not None:
            sentiment = self.sentiment_analyzer.polarity_scores(text)
            if sentiment['compound'] < -0.5:
                crisis_score += abs(sentiment['compound']) * 2

        return crisis_score, detected_indicators

    def _check_negation_and_context(self, text: str, contexts: Set[str]) -> bool:
        """Dynamically check for negation patterns"""
        text_lower = text.lower()

        # Learn negation patterns dynamically
        negation_indicators = ['not', 'don\'t', 'doesn\'t', 'isn\'t', 'aren\'t', 'won\'t', 'wouldn\'t', 'can\'t', 'couldn\'t']

        for negation in negation_indicators:
            if negation in text_lower:
                negation_pos = text_lower.find(negation)

                # Check if negation is near context words
                for context in contexts:
                    # Find all context-related words in the text
                    context_keywords = self.learned_patterns['contexts'][context]['keywords']
                    for keyword in context_keywords:
                        keyword_pos = text_lower.find(keyword)
                        if keyword_pos != -1 and abs(keyword_pos - negation_pos) < 30:
                            # Learn this negation pattern
                            pattern = f"{negation}...{keyword}"
                            self.learned_patterns['negation_patterns'][pattern] += 1
                            return True

        return False

    def _calculate_final_crisis_level(self, crisis_score: float, help_seeking_score: float,
                                    has_negation: bool, contexts: Set[str]) -> CrisisLevel:
        """Dynamically calculate final crisis level -  More balanced thresholds"""

        # Apply context-based adjustments
        if has_negation:
            crisis_score *= 0.2

        # Apply help-seeking reduction
        if help_seeking_score > 0.5:
            crisis_score *= (1.0 - (help_seeking_score * 0.6))

        # Apply time-of-day considerations
        if self.current_user['time_of_day'] in ['night', 'early_morning']:
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

    def detect_crisis_level(self, text: str, user_id: Optional[str] = None) -> CrisisLevel:
        """Main crisis detection method - Configurable: AI/Pattern/Hybrid"""
        if not text or not text.strip():
            return CrisisLevel.NONE

        # Use current user if no user_id provided
        if not user_id:
            user_id = self.current_user.get('login', 'anonymous_user')

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
            pattern_level = CrisisLevel.NONE

            # Try AI-powered crisis detection
            try:
                ai_level = self._ai_powered_crisis_detection(text)
                print(f"🤖 AI Analysis: {ai_level.value}")
            except Exception as e:
                print(f"⚠️ AI crisis detection failed: {e}")

            # Always run pattern-based detection for comparison
            pattern_level = self._pattern_based_crisis_detection(text, user_id)
            print(f"📊 Pattern Analysis: {pattern_level.value}")

            # Hybrid decision logic: Take the higher of the two levels for safety
            crisis_levels = [CrisisLevel.NONE, CrisisLevel.LOW, CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL]
            
            ai_index = crisis_levels.index(ai_level) if ai_level in crisis_levels else 0
            pattern_index = crisis_levels.index(pattern_level) if pattern_level in crisis_levels else 0
            
            # Use the higher level (more conservative approach for safety)
            final_level = crisis_levels[max(ai_index, pattern_index)]
            
            print(f"🔒 Final Decision: {final_level.value} (AI: {ai_level.value}, Pattern: {pattern_level.value})")
            
            return final_level

    def _ai_powered_crisis_detection(self, text: str) -> CrisisLevel:
        """AI-powered crisis detection using LLM analysis"""
        if not hasattr(self, 'llm') or self.llm is None:
            raise Exception("LLM not available")

        crisis_analysis_prompt = f"""
You are a mental health crisis assessment AI. Analyze the following message for suicide risk and crisis level.

Message: "{text}"

Instructions:
1. Assess the immediate suicide/self-harm risk level
2. Consider context, intent, and emotional state
3. Look for both explicit and implicit crisis indicators
4. Consider if this is genuine distress vs. casual expression

Return ONLY one of these exact levels:
- CRITICAL: Immediate suicide/self-harm intent or plan
- HIGH: Strong suicidal ideation or distress  
- MEDIUM: Moderate emotional distress or concerning thoughts
- LOW: Mild emotional difficulties
- NONE: No crisis indicators

Crisis Level:"""

        try:
            response = self.llm.invoke(crisis_analysis_prompt)
            ai_response = response.content.strip().upper() if hasattr(response, 'content') else str(response).strip().upper()
            
            # Parse AI response
            if 'CRITICAL' in ai_response:
                return CrisisLevel.CRITICAL
            elif 'HIGH' in ai_response:
                return CrisisLevel.HIGH
            elif 'MEDIUM' in ai_response:
                return CrisisLevel.MEDIUM
            elif 'LOW' in ai_response:
                return CrisisLevel.LOW
            else:
                return CrisisLevel.NONE
                
        except Exception as e:
            print(f"❌ AI crisis analysis error: {e}")
            raise e

    def _pattern_based_crisis_detection(self, text: str, user_id: Optional[str] = None) -> CrisisLevel:
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

        # Update user patterns
        if user_id:  # Ensure user_id is not None
            self.user_patterns[user_id]['crisis_history'].append({
                'text': text,
                'level': final_level,
                'score': crisis_score,
                'contexts': list(contexts),
                'timestamp': self.current_user['timestamp'].isoformat()
            })

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

        return final_level

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

# Initialize AI-powered crisis detector with hybrid mode
crisis_detector = CrisisDetector(detection_mode="hybrid")
print("✅ AI-powered crisis detection initialized (Hybrid mode: AI + Patterns)!")
print(f"🕐 Session started at: {crisis_detector.current_user['timestamp']}")
print(f"👤 User context: {crisis_detector.current_user['login']} ({crisis_detector.current_user['time_of_day']})")

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

    def __post_init__(self):
        if self.issue_details is None:
            self.issue_details = {}
        if self.progress_notes is None:
            self.progress_notes = []
        if self.key_themes is None:
            self.key_themes = []
        if self.user_preferences is None:
            self.user_preferences = {}
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

class TherapyBot:
    """Enhanced professional therapy chatbot with strict session isolation"""

    def __init__(self, groq_api_key: str):
        self.groq_api_key = groq_api_key
        self.crisis_detector = crisis_detector
        self.storage = storage
        self.active_sessions: Dict[str, UserSession] = {}

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
            print("🤖 AI-powered crisis detection enabled!")
        else:
            print("⚠️ Using pattern-based crisis detection only")

        # Initialize enhanced knowledge base
        self._initialize_enhanced_knowledge_base()

        # Setup dynamic conversation prompts
        self._setup_dynamic_prompts()

        print("✅ Enhanced TherapyBot with strict session isolation initialized!")

    def _initialize_enhanced_knowledge_base(self):
        """Initialize enhanced vector store with mental health knowledge"""
        try:
            print("🧠 Building enhanced knowledge base...")

            # Process all datasets with better text extraction
            all_texts = []
            metadata_list = []

            for dataset_idx, dataset in enumerate(datasets):
                if isinstance(dataset, list):
                    # Skip list-type datasets (fallback data removed)
                    continue
                else:
                    # Handle HuggingFace datasets with improved extraction
                    for item_idx, item in enumerate(dataset):
                        text = ""
                        source_type = "unknown"

                        # Enhanced field extraction
                        if 'Context' in item and 'Response' in item:
                            text = f"Context: {item['Context']}\nResponse: {item['Response']}"
                            source_type = "counseling_conversation"
                        elif 'input' in item and 'output' in item:
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
                            for field in ['conversation', 'context', 'response', 'content', 'input', 'output']:
                                if field in item and item[field]:
                                    text_parts.append(f"{field.title()}: {str(item[field])}")
                            text = "\n".join(text_parts)
                            source_type = "combined_fields"

                        if text.strip() and len(text.strip()) > 10:
                            all_texts.append(text.strip())
                            metadata_list.append({
                                'source': f'dataset_{dataset_idx}',
                                'index': item_idx,
                                'type': source_type
                            })

            print(f"📄 Processing {len(all_texts)} enhanced documents...")

            # Enhanced text splitter with therapeutic context preservation
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=150,
                separators=["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "],
                length_function=len,
                keep_separator=True
            )

            # Split texts with metadata preservation
            chunks = []
            chunk_metadata = []

            for i, text in enumerate(all_texts[:1500]):
                try:
                    text_chunks = text_splitter.split_text(text)
                    for chunk_idx, chunk in enumerate(text_chunks):
                        if len(chunk.strip()) > 20:
                            chunks.append(chunk)
                            chunk_metadata.append({
                                **metadata_list[i],
                                'chunk_index': chunk_idx,
                                'chunk_length': len(chunk)
                            })
                except Exception as e:
                    print(f"⚠️ Error processing text {i}: {e}")
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

            # Create specialized retrievers
            self.crisis_retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 3, "filter": {"type": "counseling_conversation"}}
            )

            self.general_retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 3}
            )

            print(f"✅ Enhanced knowledge base ready with {len(chunks)} chunks!")

        except Exception as e:
            print(f"⚠️ Error creating enhanced knowledge base: {e}")
            raise RuntimeError(f"Knowledge base creation failed: {e}")



    def _setup_dynamic_prompts(self):
        """Setup dynamic therapeutic conversation prompts with strict session isolation"""

        #  Casual prompt with session verification
        self.casual_prompt = PromptTemplate(
            input_variables=["user_input", "conversation_history", "session_context"],
            template="""You are a warm, professional mental health support assistant. Keep this response natural and conversational.

CURRENT SESSION CONTEXT ONLY: {session_context}

CURRENT SESSION CONVERSATION HISTORY:
{conversation_history}

USER MESSAGE: {user_input}

CRITICAL: Only reference information from the CURRENT session shown above. Never reference information not explicitly mentioned in this conversation.

Respond naturally like a skilled therapist would - warm, genuine, and appropriately brief for simple interactions.

Your natural response:"""
        )

        #  Therapeutic prompt with strict session boundaries
        self.therapeutic_prompt = PromptTemplate(
            input_variables=["context", "conversation_history", "user_input", "crisis_level", "session_context", "conversation_summary"],
            template="""You are a highly skilled, empathetic mental health support assistant trained in evidence-based approaches.

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
- If you don't have enough context from THIS session, ask for clarification
- Build understanding based ONLY on what the user has shared in THIS conversation

RESPONSE GUIDELINES:
- Respond naturally and maintain conversation continuity WITHIN this session only
- Match the length and depth to what the user shared
- Use therapeutic techniques when appropriate (CBT, DBT, mindfulness)
- Ask thoughtful questions based on what was shared in THIS conversation
- Show empathy without claiming false memories

Your empathetic, session-isolated response:"""
        )

        # Crisis intervention prompt (only for actual crises)
        self.crisis_prompt = PromptTemplate(
            input_variables=["user_input", "crisis_level", "assessment_questions", "session_context"],
            template=""" CRISIS INTERVENTION PROTOCOL ACTIVATED 

CURRENT SESSION CONTEXT: {session_context}

USER MESSAGE: {user_input}
CRISIS LEVEL: {crisis_level}

You are responding to someone who may be in immediate psychological distress or danger. Your response is CRITICAL and must be personalized to their specific situation.

IMMEDIATE PRIORITIES:
1. Acknowledge their courage in reaching out and validate their specific pain mentioned
2. Assess immediate safety without being intrusive - ask gentle safety questions
3. Connect with their specific emotions and situation they described
4. Instill hope while taking their pain seriously
5. Encourage immediate professional contact

ASSESSMENT QUESTIONS TO CONSIDER: {assessment_questions}

DO NOT include helpline numbers (they will be added automatically).
Be personal, empathetic, and specific to what they shared. Keep response 4-6 lines.

Your personalized crisis intervention response:"""
        )

    def _get_or_create_session_memory(self, user_id: str, session_id: str) -> SessionMemory:
        """ Get or create session memory with strict isolation"""
        session_key = f"{user_id}_{session_id}"
        if session_key not in self.session_memories:
            self.session_memories[session_key] = SessionMemory(
                session_id=session_id,
                created_at=datetime.now().isoformat(),
                issue_details={},
                progress_notes=[],
                key_themes=[],
                user_preferences={}
            )
            print(f"🆕 Created new isolated session memory for {session_key}")
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
            issue_keywords = {
                'work_stress': ['work', 'job', 'boss', 'colleague', 'workplace', 'professional', 'scolded'],
                'relationship': ['partner', 'family', 'friend', 'relationship', 'marriage'],
                'anxiety': ['anxious', 'worry', 'panic', 'nervous', 'scared'],
                'depression': ['depressed', 'sad', 'hopeless', 'empty', 'worthless'],
                'trauma': ['trauma', 'abuse', 'flashback', 'triggered'],
                'embarrassment': ['embarrass', 'shame', 'humiliat', 'mistake', 'mortify']
            }

            user_lower = user_input.lower()
            for issue_type, keywords in issue_keywords.items():
                if any(keyword in user_lower for keyword in keywords):
                    memory.primary_issue = issue_type
                    if memory.issue_details is not None:
                        memory.issue_details['initial_description'] = user_input[:200]
                    print(f"🎯 Identified primary issue for this session: {issue_type}")
                    break

        # Update progress notes for THIS session only
        if memory.progress_notes is not None:
            memory.progress_notes.append({
                'timestamp': datetime.now().isoformat(),
                'session_id': session_id,  #  Track session ID
                'user_input': user_input,
                'bot_response': bot_response[:100],
                'themes': self._extract_themes_from_text(user_input)
            })

            # Keep last 20 progress notes for THIS session
            if len(memory.progress_notes) > 20:
                memory.progress_notes = memory.progress_notes[-20:]

    def _extract_themes_from_text(self, text: str) -> List[str]:
        """Extract themes from user input"""
        themes = []
        text_lower = text.lower()

        theme_keywords = {
            'work_stress': ['work', 'job', 'boss', 'workplace', 'professional', 'career', 'scolded'],
            'embarrassment': ['embarrass', 'shame', 'mistake', 'humiliat', 'mortify'],
            'anxiety': ['anxious', 'worry', 'nervous', 'panic', 'overwhelm'],
            'professional_image': ['image', 'reputation', 'credibility', 'professional'],
            'coping': ['cope', 'handle', 'manage', 'deal with', 'overcome'],
            'distraction': ['distract', 'take mind off', 'forget', 'think about something else']
        }

        for theme, keywords in theme_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                themes.append(theme)

        return themes

    def _create_session_context(self, user_id: str, session_id: str) -> str:
        """ Create session context with strict isolation"""
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

        return " | ".join(context_parts) if context_parts else "New conversation - no prior context"

    def _create_conversation_summary(self, user_id: str, session_id: str) -> str:
        """ Create conversation summary with strict session isolation"""
        # Verify session isolation
        if not self._verify_session_isolation(user_id, session_id):
            return "This is a new isolated session."

        memory = self._get_or_create_session_memory(user_id, session_id)

        if not memory.progress_notes:
            return "This is the beginning of our conversation."

        # Filter notes to THIS session only
        session_notes = [note for note in memory.progress_notes if note.get('session_id') == session_id]

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
            # ONLY get history from the current session
            history = self.storage.get_conversation_history(user_id, session_id, limit=limit)
            formatted_history = []

            for conv in history[-limit:]:
                #  Keep full context from THIS session only
                formatted_history.append(f"Human: {conv['user_input']}")
                formatted_history.append(f"Assistant: {conv['bot_response']}")

            return "\n".join(formatted_history) if formatted_history else "No previous conversation in this session."

        except Exception as e:
            return "Previous conversation unavailable."

    def _determine_response_type(self, user_input: str, crisis_level: CrisisLevel, conversation_count: int) -> str:
        """Dynamically determine what type of response is needed"""
        user_input_lower = user_input.lower().strip()

        # Crisis situations always get crisis response
        if crisis_level in [CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
            print(f" CRISIS RESPONSE TYPE SELECTED: {crisis_level.value}")
            return "crisis"

        # Simple greetings and casual interactions
        casual_indicators = [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
            'how are you', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no',
            'sure', 'maybe', 'i see', 'alright', 'gotcha'
        ]

        # Check if it's a simple/casual message
        if (len(user_input.split()) <= 5 and
            any(indicator in user_input_lower for indicator in casual_indicators)):
            return "casual"

        # Check for therapeutic content indicators
        therapeutic_indicators = [
            'feel', 'feeling', 'emotion', 'sad', 'happy', 'angry', 'anxious', 'worried',
            'stressed', 'depressed', 'relationship', 'family', 'work', 'problem',
            'issue', 'struggle', 'difficult', 'hard', 'challenge', 'help', 'advice',
            'therapy', 'counseling', 'mental health', 'anxiety', 'depression', 'rough day',
            'scolded', 'boss'
        ]

        # If it contains therapeutic content or is longer/more complex
        if (any(indicator in user_input_lower for indicator in therapeutic_indicators) or
            len(user_input.split()) > 10 or
            len(user_input) > 50):
            return "therapeutic"

        # For first few messages, lean towards casual to build rapport
        if conversation_count < 3:
            return "casual"

        # Default to therapeutic for established conversations
        return "therapeutic"

    def _get_dynamic_context(self, query: str, crisis_level: CrisisLevel, response_type: str) -> str:
        """Get context only when needed for therapeutic responses"""
        # Don't retrieve context for casual responses
        if response_type == "casual":
            return ""

        # Only get context for therapeutic and crisis responses
        try:
            if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                enhanced_query = f"crisis intervention suicide prevention safety planning {query}"
                retriever = self.crisis_retriever
            else:
                enhanced_query = f"therapeutic techniques mental health support {query}"
                retriever = self.general_retriever

            if retriever:
                docs = retriever.get_relevant_documents(enhanced_query)
                context = "\n\n".join([doc.page_content for doc in docs[:2]])
                return context[:1000]
            else:
                return ""

        except Exception as e:
            print(f"⚠️ Context retrieval error: {e}")
            return ""

    def generate_enhanced_response(self, user_input: str, user_id: str, session_id: str) -> Tuple[str, CrisisLevel]:
        """Generate responses with strict session isolation"""
        try:
            # Enhanced crisis detection
            crisis_level = self.crisis_detector.detect_crisis_level(user_input, user_id)

            # Get conversation count for THIS session only
            current_session_history = self.storage.get_conversation_history(user_id, session_id)
            conversation_count = len(current_session_history)

            # Determine response type dynamically
            response_type = self._determine_response_type(user_input, crisis_level, conversation_count)
            print(f" Response Type Determined: {response_type} (Crisis Level: {crisis_level.value})")

            #  Get conversation history from THIS session only
            conversation_history = self._format_conversation_history(user_id, session_id, limit=10)

            # Get session context and summary from THIS session only
            session_context = self._create_session_context(user_id, session_id)
            conversation_summary = self._create_conversation_summary(user_id, session_id)

            print(f"🔒 Session isolated context: {session_context}")
            print(f"📝 Session isolated summary: {conversation_summary}")

            # Generate response based on type
            if response_type == "crisis":
                print(f" USING CRISIS PROMPT for {crisis_level.value}")
                assessment_questions = self.crisis_detector.get_safety_assessment_questions(crisis_level)
                formatted_prompt = self.crisis_prompt.format(
                    user_input=user_input,
                    crisis_level=crisis_level.value,
                    assessment_questions=assessment_questions[:2],
                    session_context=session_context
                )
                print(f" Crisis prompt preview: {formatted_prompt[:200]}...")

            elif response_type == "casual":
                formatted_prompt = self.casual_prompt.format(
                    user_input=user_input,
                    conversation_history=conversation_history,
                    session_context=session_context
                )

            else:  # therapeutic
                context = self._get_dynamic_context(user_input, crisis_level, response_type)

                formatted_prompt = self.therapeutic_prompt.format(
                    context=context,
                    conversation_history=conversation_history,
                    user_input=user_input,
                    crisis_level=crisis_level.value,
                    session_context=session_context,
                    conversation_summary=conversation_summary
                )

            # Generate response
            response = self._generate_with_retry(formatted_prompt)

            # Minimal post-processing - only add resources for actual crises
            if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                print(f" Adding crisis resources for {crisis_level.value}")
                response = self._add_crisis_resources(response, crisis_level)
                print(f" Crisis resources added, final response length: {len(response)}")

            #  Update session memory after generating response
            self._update_session_memory(user_id, session_id, user_input, response)

            # Save conversation
            mood_score = self._calculate_mood_score(user_input)
            self.storage.save_conversation(
                user_id=user_id,
                session_id=session_id,
                user_input=user_input,
                bot_response=response,
                crisis_level=crisis_level.value,
                mood_score=mood_score
            )

            return response, crisis_level

        except Exception as e:
            print(f"❌ Error generating response: {e}")
            raise RuntimeError(f"Response generation failed: {e}")

    # ... (rest of the methods remain the same but with session isolation checks)
    def _add_crisis_resources(self, response: str, crisis_level: CrisisLevel) -> str:
        """Add crisis resources only for actual crisis situations"""
        if crisis_level == CrisisLevel.CRITICAL:
            resources = """\n\n IMMEDIATE CRISIS SUPPORT (PAKISTAN):
• 1166 - National Emergency Helpline  
• 1019 - Mental Health Crisis Line (24/7)
• 0800-00-100 - Rozan Crisis Helpline"""

        elif crisis_level == CrisisLevel.HIGH:
            resources = """\n\n⚠️ URGENT SUPPORT (PAKISTAN):
• 1019 - Mental Health Crisis Line
• 0800-00-100 - Rozan Crisis Helpline"""

        elif crisis_level == CrisisLevel.MEDIUM:
            resources = """\n\n💙 SUPPORT AVAILABLE (PAKISTAN):
• 1019 - Mental Health Crisis Line
• 0800-00-100 - Rozan Crisis Helpline"""

        else:
            return response

        return response + resources

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

    def start_session(self, user_id: Optional[str] = None) -> str:
        """Start a new therapy session with enhanced context awareness"""
        # Generate dynamic user ID based on current context
        if not user_id or user_id.strip() == "":
            # Use current timestamp and login if available
            current_time = int(time.time())
            # Use environment variable or default user login
            user_login = os.getenv('USER_LOGIN', 'afaqm3121-lab')
            self.current_user_id = f"{user_login}_{current_time}"
        else:
            self.current_user_id = user_id.strip()

        # Generate dynamic session ID
        self.current_session_id = f"session_{int(time.time())}"
        self.conversation_count = 0
        self.session_start_time = datetime.now()
        self.last_crisis_level = CrisisLevel.NONE

        # Dynamic welcome message
        current_hour = datetime.now().hour
        if 5 <= current_hour < 12:
            greeting = "Good morning!"
        elif 12 <= current_hour < 17:
            greeting = "Good afternoon!"
        elif 17 <= current_hour < 21:
            greeting = "Good evening!"
        else:
            greeting = "Hello!"

        welcome_message = f"""{greeting} I'm here to provide you with mental health support. I'm trained in evidence-based therapeutic approaches and I'm here to listen and help.

I'll remember what we discuss during our conversation, so you don't need to repeat yourself. Whether you're having a tough day, dealing with ongoing challenges, or just need someone to talk to, this is a safe space for you.

How are you doing today?"""

        # Backend session logging (not shown to user)
        self._log_session_info("Session started")

        return welcome_message

    def send_message(self, message: str) -> str:
        """Send a message and get response"""

        if not self.therapy_bot:
            error_msg = """I'm currently unavailable. If you're in crisis, please contact:
• 988 - Suicide & Crisis Lifeline
• 911 - Emergency Services"""
            return error_msg

        if not self.current_user_id or not self.current_session_id:
            error_msg = """Please start a new session first.

If this is an emergency:
• **Call 1019** - Mental Health Crisis Line
• **Call 1166** - National Emergency Helpline"""
            return error_msg

        if not message.strip():
            return "Please enter a message."

        try:
            # Generate contextually-aware response with session memory
            response, crisis_level = self.therapy_bot.generate_enhanced_response(
                user_input=message,
                user_id=self.current_user_id,
                session_id=self.current_session_id
            )

            # Update conversation tracking (backend only)
            self.conversation_count += 1
            self.last_crisis_level = crisis_level
            self._log_session_info(f"Message processed: {crisis_level.value}")

            # Format response based on crisis level
            if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                formatted_response = f" URGENT SUPPORT NEEDED \n\n{response}"
            else:
                formatted_response = response

            return formatted_response

        except Exception as e:
            print(f"❌ Chat error: {e}")
            error_msg = f"""I encountered a technical issue. Please try again.

If you're in crisis, please contact immediately:
• 1019 - Mental Health Crisis Line
• 1166 - National Emergency Helpline"""

            return error_msg

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
        """Generate enhanced session summary with memory insights"""
        if not self.current_session_id:
            return "No active session to summarize."

        try:
            if not self.current_user_id:
                return "No user ID available for session summary."
                
            history = self.therapy_bot.storage.get_conversation_history(
                self.current_user_id, self.current_session_id
            )

            if not history:
                return "No conversations in this session yet."

            # Get session memory for enhanced summary
            memory = self.therapy_bot._get_or_create_session_memory(
                self.current_user_id, self.current_session_id
            )

            # Calculate session metrics dynamically
            total_messages = len(history)
            crisis_events = sum(1 for conv in history if conv.get('crisis_level') not in ['none', None])

            mood_scores = [conv.get('mood_score', 5.0) for conv in history if conv.get('mood_score')]
            avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 5.0

            # Get current timestamp for summary
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M")

            summary = f"""📋 **Session Summary**
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

**🧠 Session Memory Insights:**
{self._get_memory_insights(memory)}

**🌱 Recommended Next Steps:**
{self._generate_recommendations(history, memory)}"""

            return summary

        except Exception as e:
            return f"Error generating session summary: {e}"

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
        """Extract themes using both history and memory dynamically"""
        found_themes = []

        # Get themes from memory first
        if memory.key_themes:
            for theme in memory.key_themes:
                found_themes.append(f"😊 {theme.replace('_', ' ').title()}")

        # Add themes from conversation analysis
        try:
            all_text = " ".join([conv['user_input'] for conv in history]).lower()

            # Dynamic theme detection
            themes = {
                '😰 Anxiety/Stress': ['anxious', 'worried', 'panic', 'stressed', 'overwhelmed', 'nervous'],
                '😢 Depression/Sadness': ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'down'],
                '💔 Relationships': ['relationship', 'partner', 'family', 'friends', 'lonely', 'isolated'],
                '💼 Work/Career': ['work', 'job', 'career', 'boss', 'workplace', 'professional'],
                '😳 Embarrassment/Shame': ['embarrass', 'shame', 'humiliat', 'mortify', 'mistake', 'awkward'],
                '🏠 Family Issues': ['family', 'parents', 'siblings', 'children', 'home', 'relatives'],
                '🎓 Academic/Study': ['study', 'school', 'exam', 'homework', 'college', 'grades'],
                '💪 Self-Improvement': ['improve', 'better', 'grow', 'develop', 'progress', 'goals']
            }

            for theme, keywords in themes.items():
                if sum(1 for word in keywords if word in all_text) >= 1:
                    if theme not in [t for t in found_themes]:
                        found_themes.append(theme)

            return "\n".join([f"• {theme}" for theme in found_themes[:4]]) or "• General life concerns and wellbeing"

        except:
            return "• Conversation themes being analyzed"

    def _extract_strengths(self, history: List[Dict]) -> str:
        """Extract strengths mentioned or demonstrated dynamically"""
        try:
            all_text = " ".join([conv['user_input'] for conv in history]).lower()

            strengths = {
                '🧘 Self-awareness': ['realize', 'understand', 'aware', 'recognize', 'notice', 'insight'],
                '🤝 Seeking help': ['help', 'support', 'therapy', 'counseling', 'talking', 'reaching out'],
                '💪 Resilience': ['trying', 'fighting', 'working', 'effort', 'keep going', 'persevere'],
                '🎯 Problem-solving': ['fix', 'handle', 'solve', 'figure out', 'work through', 'address'],
                '❤️ Self-compassion': ['kind to myself', 'forgive', 'gentle', 'understanding', 'patient'],
                '🌱 Growth mindset': ['learn', 'improve', 'develop', 'change', 'progress', 'better']
            }

            found_strengths = []
            for strength, indicators in strengths.items():
                if sum(1 for word in indicators if word in all_text) >= 1:
                    found_strengths.append(strength)

            return "\n".join([f"• {strength}" for strength in found_strengths[:3]]) or "• Courage in seeking support\n• Willingness to share experiences"

        except:
            return "• Reaching out for support shows strength"

    def _generate_recommendations(self, history: List[Dict], memory: SessionMemory) -> str:
        """Generate personalized recommendations using memory dynamically"""
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
                    recommendations.append("• 🧘 Use reframing techniques for difficult situations")
                elif 'anxiety' in memory.primary_issue:
                    recommendations.append("• 🌬️ Practice breathing exercises daily")
                    recommendations.append("• 🧘 Try mindfulness meditation")
                elif 'depression' in memory.primary_issue:
                    recommendations.append("• 🌅 Maintain daily routines")
                    recommendations.append("• 🚶 Engage in gentle physical activity")

            # Mood-based recommendations
            if avg_mood < 4.0:
                recommendations.append("• 🌅 Focus on daily mood-boosting activities")
            elif avg_mood < 6.0:
                recommendations.append("• 🧘 Practice regular mindfulness or meditation")

            # Conversation-based recommendations
            if self.conversation_count > 5:
                recommendations.append("• 📔 Continue building on our therapeutic relationship")
            else:
                recommendations.append("• 🤝 Keep exploring your thoughts and feelings")

            # General recommendations
            recommendations.append("• 🔄 Consider scheduling regular check-ins")

            return "\n".join(recommendations[:4])

        except:
            return "• Continue building on our conversation\n• Practice the coping strategies we discussed"

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
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("Please try again or type 'quit' to exit.")

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

    print("\n✅ Bot test completed!")

# API Mode - Don't run console interface automatically
print("✅ Therapy bot ready for API integration!")
print("🔗 Available functions for external calls:")
print("- interface.start_session() to start")
print("- interface.send_message('your message') to chat") 
print("- interface.get_session_summary() to get summary")
print("🌟 Ready to be imported by therapy_service.py")
