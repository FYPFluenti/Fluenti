"""
Message Formatter - Centralized message formatting utilities
Handles consistent formatting across all therapy interfaces
"""

from datetime import datetime
from typing import Dict, List, Optional
from .user_context import detect_time_period

class MessageFormatter:
    """Handles message formatting for therapy interfaces"""
    
    def __init__(self):
        self.crisis_indicators = {
            'CRITICAL': "🚨 CRITICAL",
            'HIGH': "⚠️ HIGH RISK", 
            'MEDIUM': "⚡ ELEVATED",
            'LOW': "💛 MILD",
            'NONE': "✅ STABLE"
        }
        
        self.emergency_contacts = {
            'suicide_lifeline': "988 - Suicide & Crisis Lifeline",
            'emergency': "911 - Emergency Services",
            'crisis_text': "Text HOME to 741741 - Crisis Text Line"
        }
    
    def format_greeting(self) -> str:
        """Generate time-appropriate greeting"""
        time_period = detect_time_period()
        
        greetings = {
            'morning': "Good morning!",
            'afternoon': "Good afternoon!",
            'evening': "Good evening!",
            'night': "Good evening!"
        }
        
        return greetings.get(time_period, "Hello!")
    
    def format_crisis_response(self, response: str, crisis_level: str) -> str:
        """Format response based on crisis level"""
        if crisis_level.upper() in ['HIGH', 'CRITICAL']:
            crisis_indicator = self.crisis_indicators.get(crisis_level.upper(), "⚠️")
            return f"**{crisis_indicator} SUPPORT NEEDED**\n\n{response}"
        else:
            return response
    
    def format_emergency_info(self) -> str:
        """Format emergency contact information"""
        contacts = [
            f"• **{self.emergency_contacts['suicide_lifeline']}**",
            f"• **{self.emergency_contacts['emergency']}**",
            f"• **{self.emergency_contacts['crisis_text']}**"
        ]
        return "\n".join(contacts)
    
    def format_session_summary_header(self, session_id: str, user_id: str) -> str:
        """Format session summary header"""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M")
        session_display = session_id[-8:] if session_id else "unknown"
        user_display = user_id[-12:] if user_id else "unknown"
        
        return f"""**Session Summary**
Generated: {current_time}
Session: ...{session_display}
User: ...{user_display}"""
    
    def format_duration(self, start_time: datetime) -> str:
        """Format session duration"""
        duration = datetime.now() - start_time
        total_seconds = duration.total_seconds()
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
    
    def format_mood_score(self, score: float) -> str:
        """Format mood score with emoji"""
        if score >= 8.0:
            return f"{score:.1f}/10 😊"
        elif score >= 6.0:
            return f"{score:.1f}/10 🙂"
        elif score >= 4.0:
            return f"{score:.1f}/10 😐"
        elif score >= 2.0:
            return f"{score:.1f}/10 😔"
        else:
            return f"{score:.1f}/10 😢"
    
    def format_theme_list(self, themes: List[str], max_themes: int = 4) -> str:
        """Format theme list for display"""
        if not themes:
            return "• General life concerns and wellbeing"
        
        formatted_themes = [f"• {theme.replace('_', ' ').title()}" for theme in themes[:max_themes]]
        return "\n".join(formatted_themes)
    
    def format_error_message(self, error_type: str = "general") -> str:
        """Format error messages with appropriate emergency info"""
        base_message = "I encountered a technical issue. Please try again."
        
        if error_type == "crisis":
            return f"{base_message}\n\n**If this is an emergency:**\n{self.format_emergency_info()}"
        elif error_type == "api":
            return f"{base_message}\n\n**If you need immediate support:**\n{self.format_emergency_info()}"
        else:
            return base_message
    
    def format_unavailable_message(self) -> str:
        """Format message when service is unavailable"""
        return f"""I'm currently unavailable. If you're in crisis, please contact:

{self.format_emergency_info()}"""
    
    def format_session_required_message(self) -> str:
        """Format message when session is required"""
        return f"""Please start a new session first.

**If this is an emergency:**
{self.format_emergency_info()}"""
    
    def format_backend_log(self, session_info: Dict) -> str:
        """Format backend log entry"""
        return f"""
Backend Session Info:
Session: ...{session_info.get('session_display', 'unknown')}
User: ...{session_info.get('user_display', 'unknown')}
Messages: {session_info.get('message_count', 0)}
Duration: {session_info.get('duration', '0m')}
Crisis Level: {session_info.get('crisis_level', 'UNKNOWN')}
Event: {session_info.get('event', 'Unknown')}
Timestamp: {datetime.now().strftime('%H:%M:%S')}
        """
    
    def format_strengths_list(self, strengths: List[str], max_strengths: int = 3) -> str:
        """Format strengths list for display"""
        if not strengths:
            return "• Courage in seeking support\n• Willingness to share experiences"
        
        formatted_strengths = [f"• {strength}" for strength in strengths[:max_strengths]]
        return "\n".join(formatted_strengths)
    
    def format_recommendations_list(self, recommendations: List[str], max_recs: int = 4) -> str:
        """Format recommendations list for display"""
        if not recommendations:
            return "• Continue building on our conversation\n• Practice the coping strategies we discussed"
        
        formatted_recs = [f"• {rec}" for rec in recommendations[:max_recs]]
        return "\n".join(formatted_recs)