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

from langchain_text_splitters import RecursiveCharacterTextSplitter

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

    def detect_crisis_level(self, text: str, user_id: Optional[str] = None) -> Tuple[CrisisLevel, HarmType]:
        """Main crisis detection method - Configurable: AI/Pattern/Hybrid"""
        if not text or not text.strip():
            return CrisisLevel.NONE, HarmType.NONE

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

            # Hybrid decision logic: Take the higher of the two levels for safety
            crisis_levels = [CrisisLevel.NONE, CrisisLevel.LOW, CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL]
            
            ai_index = crisis_levels.index(ai_level) if ai_level in crisis_levels else 0
            pattern_index = crisis_levels.index(pattern_level) if pattern_level in crisis_levels else 0
            
            # Use the higher level (more conservative approach for safety)
            final_level = crisis_levels[max(ai_index, pattern_index)]
            
            # Combine harm types - if either detects harm to others, flag it
            final_harm_type = HarmType.NONE
            if ai_harm_type == HarmType.HARM_TO_OTHERS or pattern_harm_type == HarmType.HARM_TO_OTHERS:
                final_harm_type = HarmType.HARM_TO_OTHERS
            elif ai_harm_type == HarmType.SELF_HARM or pattern_harm_type == HarmType.SELF_HARM:
                final_harm_type = HarmType.SELF_HARM
            elif ai_harm_type == HarmType.BOTH or pattern_harm_type == HarmType.BOTH:
                final_harm_type = HarmType.BOTH
            
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

Return your analysis in this EXACT format:
CRISIS_LEVEL: [one of: CRITICAL, HIGH, MEDIUM, LOW, NONE]
HARM_TYPE: [one of: SELF_HARM, HARM_TO_OTHERS, BOTH, NONE]

Crisis Levels:
- CRITICAL: Immediate intent or plan to harm self or others
- HIGH: Strong ideation or distress about harming self or others
- MEDIUM: Moderate emotional distress or concerning thoughts about harm
- LOW: Mild emotional difficulties
- NONE: No crisis indicators

Harm Types:
- SELF_HARM: Intent/thoughts about harming oneself
- HARM_TO_OTHERS: Intent/thoughts about harming other people
- BOTH: Both self-harm and harm to others mentioned
- NONE: No harm indicators

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

        # Determine harm type based on patterns
        harm_type = HarmType.NONE
        text_lower = text.lower()
        
        # Check for harm to others patterns
        harm_others_patterns = [
            'hurt someone', 'kill someone', 'harm others', 'attack', 'violence',
            'revenge', 'get back at', 'make them pay', 'hurt them', 'teach them a lesson',
            'hate everyone', 'everyone deserves', 'they all should', 'nobody understands'
        ]
        
        # Check for self-harm patterns  
        self_harm_patterns = [
            'hurt myself', 'kill myself', 'end it all', 'suicide', 'self harm',
            'cut myself', 'overdose', 'jump off', 'hang myself', 'slit my wrists'
        ]
        
        has_harm_others = any(pattern in text_lower for pattern in harm_others_patterns)
        has_self_harm = any(pattern in text_lower for pattern in self_harm_patterns)
        
        if has_harm_others and has_self_harm:
            harm_type = HarmType.BOTH
        elif has_harm_others:
            harm_type = HarmType.HARM_TO_OTHERS
        elif has_self_harm:
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

        #  Enhanced casual prompt with therapeutic context support
        self.casual_prompt = PromptTemplate(
            input_variables=["user_input", "conversation_history", "session_context", "context"],
            template="""You are a warm, professional mental health support assistant. Even in casual interactions, maintain a therapeutically-informed and supportive tone.

CURRENT SESSION CONTEXT ONLY: {session_context}

THERAPEUTIC GUIDANCE (use subtly when appropriate):
{context}

CURRENT SESSION CONVERSATION HISTORY:
{conversation_history}

USER MESSAGE: {user_input}

CRITICAL: Only reference information from the CURRENT session shown above. Never reference information not explicitly mentioned in this conversation.

Respond naturally like a skilled therapist would - warm, genuine, and appropriately brief for simple interactions. Even for casual exchanges, maintain therapeutic awareness and provide subtle emotional support when appropriate.

Your natural, therapeutically-informed response:"""
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
        """Simple fallback issue classification when AI is unavailable"""
        text_lower = user_input.lower()
        
        # Basic keyword-based fallback (minimal hardcoding)
        if any(word in text_lower for word in ['work', 'job', 'boss', 'colleague']):
            return "work_stress"
        elif any(word in text_lower for word in ['family', 'parent', 'sibling', 'relative']):
            return "family_dynamics"  
        elif any(word in text_lower for word in ['friend', 'relationship', 'partner']):
            return "relationship_issues"
        elif any(word in text_lower for word in ['anxious', 'anxiety', 'worry', 'panic']):
            return "anxiety_symptoms"
        elif any(word in text_lower for word in ['sad', 'depressed', 'depression', 'down']):
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
            if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                final_query = f"crisis intervention emergency safety {enhanced_query}"
                retriever = self.crisis_retriever
                context_limit = 1200  # More context for crisis situations
                docs_to_retrieve = 3
            elif response_type == "casual":
                final_query = f"supportive empathetic conversation {enhanced_query}"
                retriever = self.general_retriever
                context_limit = 600  # Lighter context for casual interactions
                docs_to_retrieve = 2
            else:  # therapeutic responses
                final_query = f"therapeutic counseling mental health {enhanced_query}"
                retriever = self.general_retriever
                context_limit = 1000  # Full context for therapeutic responses
                docs_to_retrieve = 3

            if retriever:
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
                        final_context = ai_selected_context[:context_limit]
                        print(f"🧠 AI-selected context: {len(final_context)} chars")
                        return final_context
                    except Exception as e:
                        print(f"⚠️ AI context selection failed, using direct retrieval: {e}")
                
                # Fallback: use direct document content
                context = "\n\n".join([doc.page_content for doc in docs[:docs_to_retrieve]])
                return context[:context_limit]
            else:
                print(f"⚠️ No retriever available")
                return ""

        except Exception as e:
            print(f"⚠️ Context retrieval error: {e}")
            return ""

    def generate_enhanced_response(self, user_input: str, user_id: str, session_id: str) -> Tuple[str, CrisisLevel, HarmType]:
        """Generate responses with strict session isolation"""
        try:
            # Enhanced crisis detection
            crisis_level, harm_type = self.crisis_detector.detect_crisis_level(user_input, user_id)

            # Get conversation count for THIS session only
            current_session_history = self.storage.get_conversation_history(user_id, session_id)
            conversation_count = len(current_session_history)

            # Determine response type dynamically
            response_type = self._determine_response_type(user_input, crisis_level, conversation_count)
            print(f" Response Type Determined: {response_type} (Crisis Level: {crisis_level.value}, Harm Type: {harm_type.value})")

            #  Get conversation history from THIS session only
            conversation_history = self._format_conversation_history(user_id, session_id, limit=10)

            # Get session context and summary from THIS session only
            session_context = self._create_session_context(user_id, session_id)
            conversation_summary = self._create_conversation_summary(user_id, session_id)

            print(f"🔒 Session isolated context: {session_context}")
            print(f"📝 Session isolated summary: {conversation_summary}")

            # Get therapeutic context for all response types
            context = self._get_dynamic_context(user_input, crisis_level, response_type)
            print(f"📚 Retrieved context ({response_type}): {len(context)} chars")
            if context:
                print(f"📖 Context preview: {context[:100]}...")

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
                    session_context=session_context,
                    context=context  # Now includes therapeutic context
                )

            else:  # therapeutic
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

            # Handle emergency notification for harm to others
            if harm_type in [HarmType.HARM_TO_OTHERS, HarmType.BOTH] and crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
                print(f" EMERGENCY: Harm to others detected - Level: {crisis_level.value}, Type: {harm_type.value}")
                self._send_emergency_notification(user_id, session_id, user_input, response, crisis_level, harm_type)

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
                response = requests.post(
                    'http://localhost:3000/api/emergency-notification',
                    json=notification_data,
                    timeout=5
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
                    print(f"🤖 Generated AI crisis resources: {len(ai_resources)} chars")
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

    def start_session(self, user_id: Optional[str] = None) -> str:
        """Start a new therapy session with AI-generated contextual welcome"""
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
        self.last_harm_type = HarmType.NONE

        # AI-generated contextual welcome message
        welcome_message = self._generate_ai_welcome_message()

        # Backend session logging (not shown to user)
        self._log_session_info("Session started")

        return welcome_message

    def _generate_ai_welcome_message(self) -> str:
        """Generate AI-powered contextual welcome message based on time and environment"""
        try:
            if self.therapy_bot and self.therapy_bot.llm:
                current_time = datetime.now()
                current_hour = current_time.hour
                day_of_week = current_time.strftime("%A")
                
                welcome_prompt = f"""
You are a warm, professional mental health support assistant starting a new therapy session.

Context:
- Current time: {current_hour}:00 on {day_of_week}
- This is the beginning of a new therapy session
- You need to create a welcoming, safe environment
- The user may be feeling vulnerable or uncertain

Generate a natural, contextually appropriate welcome message that:
1. Includes a time-appropriate greeting that feels natural (not robotic)
2. Establishes you as a mental health support assistant
3. Creates a sense of safety and confidentiality
4. Mentions session continuity (remembering conversation context)
5. Ends with an open, inviting question
6. Keeps the tone warm but professional
7. Is 3-4 sentences long

Make it feel personal and human while maintaining therapeutic boundaries.

Welcome message:"""

                response = self.therapy_bot.llm.invoke(welcome_prompt)
                ai_welcome = self.therapy_bot._extract_llm_content(response)
                
                if ai_welcome and len(ai_welcome.strip()) > 20:
                    print(f"🤖 Generated AI welcome message: {len(ai_welcome)} chars")
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
You are a mental health support assistant handling an error situation.

Error Type: {error_type}
Context: {error_context.get(error_type, "Unknown error")}

Generate a helpful, supportive error message that:
1. Acknowledges the issue clearly but gently
2. Provides appropriate next steps for the user
3. Includes crisis support information if relevant (Pakistan numbers: 1019, 1166, 0800-00-100)
4. Maintains a caring, professional tone
5. Keeps it concise (2-3 lines)

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
You are a mental health crisis specialist formatting an emergency response.

Context:
- Crisis Level: {crisis_level.value}
- Harm Type: {harm_type.value}
- This involves potential harm to others
- Immediate intervention may be needed

Task: Create an appropriate emergency message wrapper that:
1. Clearly indicates the emergency nature
2. Emphasizes immediate safety for all involved
3. Directs to appropriate emergency services
4. Maintains therapeutic support while ensuring safety
5. Is clear and actionable

Original therapeutic response: "{response[:100]}..."

Generate an emergency message format that wraps this response appropriately:"""

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
You are a mental health crisis specialist formatting an urgent response.

Context:
- Crisis Level: {crisis_level.value}
- High-risk situation requiring immediate attention
- Focus on self-harm prevention and safety

Task: Create an appropriate urgent message wrapper that:
1. Indicates urgency while remaining supportive
2. Emphasizes immediate safety and support
3. Maintains hope and connection
4. Is clear about next steps

Original therapeutic response: "{response[:100]}..."

Generate an urgent message format that wraps this response appropriately:"""

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
                    print(f"🎯 AI-extracted conversation themes: {len(ai_themes)} chars")
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
                    print(f"🎯 AI-identified strengths: {len(ai_strengths)} chars")
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
                    print(f"🎯 AI-generated recommendations: {len(ai_recommendations)} chars")
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
