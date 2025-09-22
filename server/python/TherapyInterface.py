
# IMPORTANT: Set your Groq API key in the .env file
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional

# Add current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import common utilities
from utils.env_manager import get_api_key
from utils.user_context import get_user_context, UserContextManager
from utils.message_formatter import MessageFormatter
from utils.error_handler import safe_execute, handle_api_error
from utils.session_utils import generate_session_id, format_duration

from SessionMemory import TherapyBot, CrisisLevel, SessionMemory

# Initialize utility instances
user_context_manager = UserContextManager()
message_formatter = MessageFormatter()

# Initialize therapy bot using common utilities
try:
    GROQ_API_KEY = get_api_key('groq', required=True)
    if GROQ_API_KEY:  # Type guard
        therapy_bot = TherapyBot(GROQ_API_KEY)
        print("✅ Therapy bot initialized successfully!")
    else:
        therapy_bot = None
        print("❌ GROQ API key not available")
    
    # Test function to demonstrate the bot is working
    def test_therapy_bot():
        if therapy_bot:
            print("\n🧠 Testing therapy bot...")
            response, crisis_level = therapy_bot.generate_enhanced_response(
                user_input="Hello, I'm feeling a bit stressed today.",
                user_id="test_user",
                session_id="test_session_001"
            )
            print(f"Bot Response: {response}")
            print(f"Crisis Level: {crisis_level.value}")
        else:
            print("❌ Therapy bot not available for testing")
    
    # Uncomment the line below to test the bot immediately
    # test_therapy_bot()
    
except Exception as e:
    print(f"❌ Error initializing therapy bot: {e}")
    therapy_bot = None

class TherapyInterface:
    """Enhanced professional therapy interface with persistent session memory and context continuity"""

    def __init__(self, therapy_bot: TherapyBot):
        self.therapy_bot = therapy_bot
        self.current_user_id: Optional[str] = None
        self.current_session_id: Optional[str] = None
        self.conversation_count = 0
        self.session_start_time = None
        self.last_crisis_level = CrisisLevel.NONE

    def start_session(self, user_id: Optional[str] = None) -> str:
        """Start a new therapy session with enhanced context awareness"""
        # Generate dynamic user ID using common utilities
        if not user_id or user_id.strip() == "":
            context = get_user_context()
            current_time = int(time.time())
            user_login = context['login']
            self.current_user_id = f"{user_login}_{current_time}"
        else:
            self.current_user_id = user_id.strip()

        # Generate dynamic session ID using common utilities
        self.current_session_id = generate_session_id()
        self.conversation_count = 0
        self.session_start_time = datetime.now()
        self.last_crisis_level = CrisisLevel.NONE

        # Dynamic welcome message using common utilities
        greeting = message_formatter.format_greeting()

        welcome_message = f"""{greeting} I'm here to provide you with mental health support. I'm trained in evidence-based therapeutic approaches and I'm here to listen and help.

I'll remember what we discuss during our conversation, so you don't need to repeat yourself. Whether you're having a tough day, dealing with ongoing challenges, or just need someone to talk to, this is a safe space for you.

How are you doing today?"""

        # Backend session logging (not shown to user)
        self._log_session_info("Session started")

        return welcome_message

    def send_message(self, message: str) -> str:
        """Send a message and get response"""

        if not self.therapy_bot:
            return message_formatter.format_unavailable_message()

        if not self.current_user_id or not self.current_session_id:
            return message_formatter.format_session_required_message()

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

            # Format response based on crisis level using utilities
            formatted_response = message_formatter.format_crisis_response(response, crisis_level.value)

            return formatted_response

        except Exception as e:
            error_msg = handle_api_error(e, "Therapy Bot")
            return message_formatter.format_error_message("api")

    def _log_session_info(self, event: str):
        """Backend logging for session information (not displayed to user)"""
        duration_str = format_duration(self.session_start_time) if self.session_start_time else "0m"

        # Prepare session info for formatting
        session_info = {
            'session_display': self.current_session_id[-8:] if self.current_session_id else "unknown",
            'user_display': self.current_user_id[-12:] if self.current_user_id else "unknown",
            'message_count': self.conversation_count,
            'duration': duration_str,
            'crisis_level': message_formatter.crisis_indicators.get(self.last_crisis_level.value.upper(), "UNKNOWN"),
            'event': event
        }

        # Log to backend using utilities
        backend_log = message_formatter.format_backend_log(session_info)
        print(backend_log)  # This goes to backend logs only

    def get_session_summary(self) -> str:
        """Generate enhanced session summary with memory insights"""
        if not self.current_session_id or not self.current_user_id:
            return "No active session to summarize."

        try:
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

            # Get session summary header using utilities
            summary_header = message_formatter.format_session_summary_header(
                self.current_session_id or "unknown", 
                self.current_user_id or "unknown"
            )

            summary = f"""{summary_header}

**Session Metrics:**
- Total Messages: {total_messages}
- Average Mood Score: {message_formatter.format_mood_score(avg_mood)}
- Crisis Events: {crisis_events}
- Session Duration: {self._get_session_duration()}
- Primary Issue: {memory.primary_issue.replace('_', ' ').title() if memory.primary_issue else 'General support'}

**Key Themes Discussed:**
{self._extract_themes(history, memory)}

**Strengths Identified:**
{self._extract_strengths(history)}

**Session Memory Insights:**
{self._get_memory_insights(memory)}

**Recommended Next Steps:**
{self._generate_recommendations(history, memory)}"""

            return summary

        except Exception as e:
            return f"Error generating session summary: {e}"

    def _get_session_duration(self) -> str:
        """Calculate and format session duration dynamically"""
        if self.session_start_time:
            return format_duration(self.session_start_time)
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
            memory_themes = [theme.replace('_', ' ').title() for theme in memory.key_themes]
            found_themes.extend(memory_themes)

        # Add themes from conversation analysis
        try:
            all_text = " ".join([conv['user_input'] for conv in history]).lower()

            # Dynamic theme detection
            themes = {
                'Anxiety/Stress': ['anxious', 'worried', 'panic', 'stressed', 'overwhelmed', 'nervous'],
                'Depression/Sadness': ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'down'],
                'Relationships': ['relationship', 'partner', 'family', 'friends', 'lonely', 'isolated'],
                'Work/Career': ['work', 'job', 'career', 'boss', 'workplace', 'professional'],
                'Embarrassment/Shame': ['embarrass', 'shame', 'humiliat', 'mortify', 'mistake', 'awkward'],
                'Family Issues': ['family', 'parents', 'siblings', 'children', 'home', 'relatives'],
                'Academic/Study': ['study', 'school', 'exam', 'homework', 'college', 'grades'],
                'Self-Improvement': ['improve', 'better', 'grow', 'develop', 'progress', 'goals']
            }

            for theme, keywords in themes.items():
                if sum(1 for word in keywords if word in all_text) >= 1:
                    if theme not in found_themes:
                        found_themes.append(theme)

            return message_formatter.format_theme_list(found_themes)

        except:
            return "• Conversation themes being analyzed"

    def _extract_strengths(self, history: List[Dict]) -> str:
        """Extract strengths mentioned or demonstrated dynamically"""
        try:
            all_text = " ".join([conv['user_input'] for conv in history]).lower()

            strengths = {
                'Self-awareness': ['realize', 'understand', 'aware', 'recognize', 'notice', 'insight'],
                'Seeking help': ['help', 'support', 'therapy', 'counseling', 'talking', 'reaching out'],
                'Resilience': ['trying', 'fighting', 'working', 'effort', 'keep going', 'persevere'],
                'Problem-solving': ['fix', 'handle', 'solve', 'figure out', 'work through', 'address'],
                'Self-compassion': ['kind to myself', 'forgive', 'gentle', 'understanding', 'patient'],
                'Growth mindset': ['learn', 'improve', 'develop', 'change', 'progress', 'better']
            }

            found_strengths = []
            for strength, indicators in strengths.items():
                if sum(1 for word in indicators if word in all_text) >= 1:
                    found_strengths.append(strength)

            return message_formatter.format_strengths_list(found_strengths)

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
                recommendations.append("Consider scheduling an appointment with a mental health professional")

            # Issue-specific recommendations based on memory
            if memory.primary_issue:
                if 'work' in memory.primary_issue or 'stress' in memory.primary_issue:
                    recommendations.append("Practice workplace stress management techniques")
                    recommendations.append("Use reframing techniques for difficult situations")
                elif 'anxiety' in memory.primary_issue:
                    recommendations.append("Practice breathing exercises daily")
                    recommendations.append("Try mindfulness meditation")
                elif 'depression' in memory.primary_issue:
                    recommendations.append("Maintain daily routines")
                    recommendations.append("Engage in gentle physical activity")

            # Mood-based recommendations
            if avg_mood < 4.0:
                recommendations.append("Focus on daily mood-boosting activities")
            elif avg_mood < 6.0:
                recommendations.append("Practice regular mindfulness or meditation")

            # Conversation-based recommendations
            if self.conversation_count > 5:
                recommendations.append("Continue building on our therapeutic relationship")
            else:
                recommendations.append("Keep exploring your thoughts and feelings")

            # General recommendations
            recommendations.append("Consider scheduling regular check-ins")

            return message_formatter.format_recommendations_list(recommendations)

        except:
            return "• Continue building on our conversation\n• Practice the coping strategies we discussed"

# Initialize interface
if therapy_bot:
    interface = TherapyInterface(therapy_bot)
    print("Enhanced therapy interface ready!")
else:
    interface = None
    print("Therapy bot not available")

if __name__ == "__main__":
    print("\n🤖 TherapyInterface.py loaded successfully!")
    print("The therapy bot is ready to use.")
    if interface:
        print("Interface initialized and ready for sessions.")
    else:
        print("Interface not available - check therapy bot initialization.")