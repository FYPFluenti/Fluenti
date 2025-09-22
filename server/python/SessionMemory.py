
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime

# Import required classes with conditional definitions
from enum import Enum

# Import common utilities
from utils.env_manager import get_api_key
from utils.user_context import get_user_context
from utils.error_handler import safe_execute, log_error
from utils.session_utils import generate_session_id

# Define base classes first, then conditionally import if available
class CrisisLevel(Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UserSession:
    pass

class CrisisDetector:
    def __init__(self):
        self.sentiment_available = False
        self.sentiment_analyzer = None
    
    def detect_crisis_level(self, user_input: str, user_id: str = "") -> 'CrisisLevel':
        return CrisisLevel.NONE
    
    def get_safety_assessment_questions(self, crisis_level: 'CrisisLevel') -> List[str]:
        return ["Are you feeling safe right now?", "Do you have someone you can talk to?"]

# Try to override with real implementations if available
try:
    from CrisisDetector import CrisisDetector, CrisisLevel, UserSession  # type: ignore
    CRISIS_DETECTOR_AVAILABLE = True
    print("Successfully imported CrisisDetector components")
except ImportError:
    print("Warning: CrisisDetector not found, using fallback definitions")
    CRISIS_DETECTOR_AVAILABLE = False

# Define LangChain fallback classes
class ChatGroq:
    def __init__(self, **kwargs):
        pass
    def invoke(self, prompt):
        class Response:
            content = "I'm having technical difficulties."
        return Response()

class PromptTemplate:
    def __init__(self, **kwargs):
        self.template = kwargs.get('template', '')
    def format(self, **kwargs):
        return self.template

class Chroma:
    @staticmethod
    def from_texts(**kwargs):
        return None

class HuggingFaceBgeEmbeddings:
    def __init__(self, **kwargs):
        pass

class RecursiveCharacterTextSplitter:
    def __init__(self, **kwargs):
        pass
    def split_text(self, text):
        return [text]

# Try to override with real LangChain implementations if available
try:
    from langchain_groq import ChatGroq  # type: ignore
    from langchain_core.prompts import PromptTemplate  # type: ignore
    from langchain_community.vectorstores import Chroma  # type: ignore
    from langchain_community.embeddings import HuggingFaceBgeEmbeddings  # type: ignore
    from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore
    LANGCHAIN_AVAILABLE = True
    print("Successfully imported LangChain components")
except ImportError as e:
    print(f"Warning: LangChain imports failed: {e}")
    LANGCHAIN_AVAILABLE = False

# Import datasets from DataLoader
try:
    from DataLoader import datasets
except ImportError:
    print("Warning: DataLoader datasets not found, using empty list")
    datasets = []

# Import real MongoDBStorage instead of placeholder
try:
    from MongoDBStorage import storage
    print("✅ Successfully imported real MongoDBStorage")
except ImportError:
    print("⚠️ Warning: MongoDBStorage not found, using fallback placeholder")
    # Fallback Storage class placeholder
    class Storage:
        def get_conversation_history(self, user_id: str, session_id: str, limit: int = 10):
            return []
        
        def save_conversation(self, **kwargs):
            pass
    
    storage = Storage()

# Create global instances (these should be injected in a real application)
crisis_detector = CrisisDetector()

@dataclass
class SessionMemory:
    """Enhanced session memory with strict isolation"""
    primary_issue: str = ""
    issue_details: Optional[Dict] = None
    progress_notes: Optional[List] = None
    conversation_summary: str = ""
    key_themes: Optional[List] = None
    user_preferences: Optional[Dict] = None
    session_id: str = ""  # Track specific session
    created_at: str = ""  # Track when session was created

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

        # Strict session memory isolation
        self.session_memories: Dict[str, SessionMemory] = {}
        self.user_preferences = {}
        self.conversation_analytics = {}

        # Initialize LLM with optimized settings
        self.llm = ChatGroq(
            temperature=0.7,
            groq_api_key=groq_api_key,
            model_name="llama-3.3-70b-versatile",
            max_tokens=1000,
            top_p=0.9,
            frequency_penalty=0.2
        )

        # Initialize enhanced knowledge base
        self._initialize_enhanced_knowledge_base()

        # Setup dynamic conversation prompts
        self._setup_dynamic_prompts()

        print("Enhanced TherapyBot with strict session isolation initialized!")

    def _safe_get_item_field(self, item: Any, field: str, default: str = "") -> str:
        """Safely get field from item, handling both dict and list access"""
        try:
            if hasattr(item, 'get'):
                return str(item.get(field, default))
            elif hasattr(item, '__getitem__'):
                return str(item[field]) if field in item else default
            else:
                return default
        except (KeyError, TypeError, IndexError):
            return default

    def _initialize_enhanced_knowledge_base(self):
        """Initialize enhanced vector store with mental health knowledge"""
        try:
            print("Building enhanced knowledge base...")

            # Process all datasets with better text extraction
            all_texts = []
            metadata_list = []

            for dataset_idx, dataset in enumerate(datasets):
                if isinstance(dataset, list):
                    # Handle our fallback data
                    for item_idx, item in enumerate(dataset):
                        if isinstance(item, dict):
                            text_field = self._safe_get_item_field(item, 'text')
                            if text_field:
                                all_texts.append(text_field)
                                metadata_list.append({
                                    'source': f'fallback_dataset_{dataset_idx}',
                                    'index': item_idx,
                                    'type': 'therapeutic_knowledge'
                                })
                else:
                    # Handle HuggingFace datasets with improved extraction
                    for item_idx, item in enumerate(dataset):
                        text = ""
                        source_type = "unknown"

                        # Enhanced field extraction with safe access
                        context = self._safe_get_item_field(item, 'Context')
                        response = self._safe_get_item_field(item, 'Response')
                        input_field = self._safe_get_item_field(item, 'input')
                        output_field = self._safe_get_item_field(item, 'output')
                        question = self._safe_get_item_field(item, 'question')
                        answer = self._safe_get_item_field(item, 'answer')
                        text_field = self._safe_get_item_field(item, 'text')

                        if context and response:
                            text = f"Context: {context}\nResponse: {response}"
                            source_type = "counseling_conversation"
                        elif input_field and output_field:
                            text = f"Question: {input_field}\nAnswer: {output_field}"
                            source_type = "qa_pair"
                        elif question and answer:
                            text = f"Question: {question}\nAnswer: {answer}"
                            source_type = "qa_pair"
                        elif text_field:
                            text = text_field
                            source_type = "general_text"
                        else:
                            # Try to combine all available fields
                            text_parts = []
                            for field in ['conversation', 'context', 'response', 'content', 'input', 'output']:
                                field_value = self._safe_get_item_field(item, field)
                                if field_value:
                                    text_parts.append(f"{field.title()}: {field_value}")
                            text = "\n".join(text_parts)
                            source_type = "combined_fields"

                        if text.strip() and len(text.strip()) > 10:
                            all_texts.append(text.strip())
                            metadata_list.append({
                                'source': f'dataset_{dataset_idx}',
                                'index': item_idx,
                                'type': source_type
                            })

            print(f"Processing {len(all_texts)} enhanced documents...")

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
                    print(f"Warning: Error processing text {i}: {e}")
                    continue

            print(f"Created {len(chunks)} enhanced knowledge chunks")

            # Enhanced embeddings with better model
            embeddings = HuggingFaceBgeEmbeddings(
                model_name='BAAI/bge-small-en-v1.5',
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )

            # Create enhanced vector store with metadata
            self.vector_store = Chroma.from_texts(
                texts=chunks,
                embedding=embeddings,
                metadatas=chunk_metadata,
                persist_directory="/content/therapy_enhanced_chroma_db"
            )

            # Create specialized retrievers
            if self.vector_store:
                self.crisis_retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": 3, "filter": {"type": "counseling_conversation"}}
                )

                self.general_retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": 3}
                )
            else:
                # Fallback retrievers with empty methods
                class FallbackRetriever:
                    def get_relevant_documents(self, query):
                        return []
                
                self.crisis_retriever = FallbackRetriever()
                self.general_retriever = FallbackRetriever()

            print(f"Enhanced knowledge base ready with {len(chunks)} chunks!")

        except Exception as e:
            print(f"Warning: Error creating enhanced knowledge base: {e}")
            self._create_minimal_knowledge_base()

    def _create_minimal_knowledge_base(self):
        """Fallback knowledge base"""
        print("Creating minimal fallback knowledge base...")
        self.vector_store = None
        self.crisis_retriever = None
        self.general_retriever = None

    def _setup_dynamic_prompts(self):
        """Setup dynamic therapeutic conversation prompts with strict session isolation"""

        # Casual prompt with session verification
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

        # Therapeutic prompt with strict session boundaries
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
            template="""CRISIS INTERVENTION PROTOCOL ACTIVATED

CURRENT SESSION CONTEXT: {session_context}

USER MESSAGE: {user_input}
CRISIS LEVEL: {crisis_level}

You are responding to someone who may be in immediate psychological distress or danger. Your response is CRITICAL.

IMMEDIATE PRIORITIES:
1. **Acknowledge their courage** in reaching out and validate their pain
2. **Assess immediate safety** without being intrusive
3. **Provide specific crisis resources** prominently and clearly
4. **Instill hope** while taking their pain seriously
5. **Encourage immediate professional contact**

CRISIS RESOURCES TO INCLUDE:
- **988** - Suicide & Crisis Lifeline (call or text, 24/7)
- **Text HOME to 741741** - Crisis Text Line
- **911** - If in immediate physical danger

Your crisis intervention response:"""
        )

    def _get_or_create_session_memory(self, user_id: str, session_id: str) -> SessionMemory:
        """Get or create session memory with strict isolation"""
        session_key = f"{user_id}_{session_id}"
        if session_key not in self.session_memories:
            self.session_memories[session_key] = SessionMemory(
                session_id=session_id,
                created_at=datetime.now().isoformat()
            )
            print(f"Created new isolated session memory for {session_key}")
        return self.session_memories[session_key]

    def _verify_session_isolation(self, user_id: str, session_id: str) -> bool:
        """Verify that we're only accessing the correct session's memory"""
        session_key = f"{user_id}_{session_id}"
        current_memory = self.session_memories.get(session_key)

        if current_memory and current_memory.session_id != session_id:
            print(f"Warning: Session isolation breach detected! Clearing contaminated memory.")
            # Clear contaminated memory
            self.session_memories[session_key] = SessionMemory(
                session_id=session_id,
                created_at=datetime.now().isoformat()
            )
            return False
        return True

    def _update_session_memory(self, user_id: str, session_id: str, user_input: str, bot_response: str):
        """Update session memory with strict isolation checks"""
        # Verify session isolation first
        if not self._verify_session_isolation(user_id, session_id):
            print(f"Session isolation enforced for {user_id}_{session_id}")

        memory = self._get_or_create_session_memory(user_id, session_id)

        # Extract primary issue from first few messages of THIS session only
        if not memory.primary_issue and len(memory.progress_notes or []) < 3:
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
                    if memory.issue_details is None:
                        memory.issue_details = {}
                    memory.issue_details['initial_description'] = user_input[:200]
                    print(f"Identified primary issue for this session: {issue_type}")
                    break

        # Update progress notes for THIS session only
        if memory.progress_notes is None:
            memory.progress_notes = []
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
        """Create session context with strict isolation"""
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
        """Create conversation summary with strict session isolation"""
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
        """Format conversation history with strict session isolation"""
        try:
            # ONLY get history from the current session
            history = self.storage.get_conversation_history(user_id, session_id, limit=limit)
            formatted_history = []

            for conv in history[-limit:]:
                # Keep full context from THIS session only
                formatted_history.append(f"Human: {conv['user_input']}")
                formatted_history.append(f"Assistant: {conv['bot_response']}")

            return "\n".join(formatted_history) if formatted_history else "No previous conversation in this session."

        except Exception as e:
            return "Previous conversation unavailable."

    def _determine_response_type(self, user_input: str, crisis_level: CrisisLevel, conversation_count: int) -> str:
        """Dynamically determine what type of response is needed"""
        user_input_lower = user_input.lower().strip()

        # Crisis situations always get crisis response
        if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
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
                if docs:
                    context = "\n\n".join([doc.page_content for doc in docs[:2]])
                    return context[:1000]
                else:
                    return ""
            else:
                return ""

        except Exception as e:
            print(f"Warning: Context retrieval error: {e}")
            return ""

    def generate_enhanced_response(self, user_input: str, user_id: str, session_id: str) -> Tuple[str, CrisisLevel]:
        """Generate responses with strict session isolation"""
        crisis_level = CrisisLevel.NONE  # Initialize with default value
        
        try:
            # Enhanced crisis detection
            crisis_level = self.crisis_detector.detect_crisis_level(user_input, user_id)

            # Get conversation count for THIS session only
            current_session_history = self.storage.get_conversation_history(user_id, session_id)
            conversation_count = len(current_session_history)

            # Determine response type dynamically
            response_type = self._determine_response_type(user_input, crisis_level, conversation_count)

            # Get conversation history from THIS session only
            conversation_history = self._format_conversation_history(user_id, session_id, limit=10)

            # Get session context and summary from THIS session only
            session_context = self._create_session_context(user_id, session_id)
            conversation_summary = self._create_conversation_summary(user_id, session_id)

            print(f"Session isolated context: {session_context}")
            print(f"Session isolated summary: {conversation_summary}")

            # Generate response based on type
            if response_type == "crisis":
                assessment_questions = self.crisis_detector.get_safety_assessment_questions(crisis_level)
                formatted_prompt = self.crisis_prompt.format(
                    user_input=user_input,
                    crisis_level=crisis_level.value,
                    assessment_questions=assessment_questions[:2],
                    session_context=session_context
                )

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
                response = self._add_crisis_resources(response, crisis_level)

            # Update session memory after generating response
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
            print(f"Error generating response: {e}")
            return self._generate_emergency_response(crisis_level), crisis_level

    def _add_crisis_resources(self, response: str, crisis_level: CrisisLevel) -> str:
        """Add crisis resources only for actual crisis situations"""
        if crisis_level == CrisisLevel.CRITICAL:
            resources = """\n\n**IMMEDIATE CRISIS RESOURCES:**
• **988** - Suicide & Crisis Lifeline (call or text, 24/7)
• **Text HOME to 741741** - Crisis Text Line
• **911** - Emergency Services"""

        elif crisis_level == CrisisLevel.HIGH:
            resources = """\n\n**URGENT SUPPORT:**
• **988** - Suicide & Crisis Lifeline
• **Text HOME to 741741** - Crisis Text Line"""

        else:
            return response

        return response + resources

    def _generate_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """Generate response with retry logic"""
        for attempt in range(max_retries):
            try:
                response = self.llm.invoke(prompt).content
                if response and len(response.strip()) > 10:
                    return response.strip()
            except Exception as e:
                print(f"Warning: Generation attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise

        return "I'm having technical difficulties. Please try again or contact professional support if needed."

    def _calculate_mood_score(self, user_input: str) -> float:
        """Calculate mood score from user input"""
        if self.crisis_detector.sentiment_available and self.crisis_detector.sentiment_analyzer:
            try:
                sentiment = self.crisis_detector.sentiment_analyzer.polarity_scores(user_input)
                return round(((sentiment['compound'] + 1) * 4.5) + 1, 1)
            except (AttributeError, KeyError):
                pass

        # Fallback simple mood estimation
        positive_words = ['good', 'better', 'happy', 'grateful', 'hopeful', 'improving']
        negative_words = ['bad', 'worse', 'sad', 'hopeless', 'terrible', 'awful', 'rough']

        positive_count = sum(1 for word in positive_words if word in user_input.lower())
        negative_count = sum(1 for word in negative_words if word in user_input.lower())

        if positive_count > negative_count:
            return 7.0
        elif negative_count > positive_count:
            return 3.0
        else:
            return 5.0

    def _generate_emergency_response(self, crisis_level: CrisisLevel) -> str:
        """Generate emergency fallback response"""
        base_response = """I apologize, but I'm experiencing technical difficulties right now."""

        if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
            return base_response + """\n\n**IMMEDIATE CRISIS SUPPORT:**
• **Call or text 988** - Suicide & Crisis Lifeline
• **Text HOME to 741741** - Crisis Text Line
• **Call 911** if in immediate danger"""
        else:
            return base_response + " Please try again in a moment."

print("Enhanced therapy bot with strict session isolation ready!")