"""
Session Utilities - Centralized session management utilities
Handles session ID generation, duration tracking, and session state management
"""

import time
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from dataclasses import dataclass, field

@dataclass
class SessionInfo:
    """Session information data structure"""
    session_id: str
    user_id: str
    start_time: datetime
    last_activity: datetime
    message_count: int = 0
    crisis_events: int = 0
    total_duration: timedelta = field(default_factory=lambda: timedelta())

class SessionManager:
    """Manages session state and lifecycle"""
    
    def __init__(self):
        self.active_sessions: Dict[str, SessionInfo] = {}
        self.session_timeout = timedelta(hours=24)  # Sessions expire after 24 hours
    
    def create_session(self, user_id: str, prefix: str = "session") -> str:
        """Create a new session and return session ID"""
        session_id = generate_session_id(prefix)
        current_time = datetime.now()
        
        session_info = SessionInfo(
            session_id=session_id,
            user_id=user_id,
            start_time=current_time,
            last_activity=current_time
        )
        
        self.active_sessions[session_id] = session_info
        return session_id
    
    def update_session_activity(self, session_id: str):
        """Update last activity time for a session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].last_activity = datetime.now()
            self.active_sessions[session_id].message_count += 1
    
    def get_session_info(self, session_id: str) -> Optional[SessionInfo]:
        """Get session information"""
        self._cleanup_expired_sessions()
        return self.active_sessions.get(session_id)
    
    def end_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """End a session and return summary"""
        if session_id not in self.active_sessions:
            return None
        
        session_info = self.active_sessions[session_id]
        end_time = datetime.now()
        session_info.total_duration = end_time - session_info.start_time
        
        summary = {
            'session_id': session_info.session_id,
            'user_id': session_info.user_id,
            'duration': session_info.total_duration,
            'message_count': session_info.message_count,
            'crisis_events': session_info.crisis_events,
            'start_time': session_info.start_time,
            'end_time': end_time
        }
        
        # Remove from active sessions
        del self.active_sessions[session_id]
        
        return summary
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions"""
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, session_info in self.active_sessions.items():
            if current_time - session_info.last_activity > self.session_timeout:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.active_sessions[session_id]
    
    def get_active_session_count(self) -> int:
        """Get count of active sessions"""
        self._cleanup_expired_sessions()
        return len(self.active_sessions)

def generate_session_id(prefix: str = "session") -> str:
    """
    Generate a unique session ID
    
    Args:
        prefix: Prefix for the session ID
    
    Returns:
        Unique session ID string
    """
    timestamp = int(time.time())
    return f"{prefix}_{timestamp}"

def format_duration(start_time: datetime, end_time: Optional[datetime] = None) -> str:
    """
    Format duration between two timestamps
    
    Args:
        start_time: Start timestamp
        end_time: End timestamp (defaults to current time)
    
    Returns:
        Formatted duration string (e.g., "2h 30m", "45m")
    """
    if end_time is None:
        end_time = datetime.now()
    
    duration = end_time - start_time
    total_seconds = duration.total_seconds()
    
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    
    if hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m"

def calculate_session_metrics(session_info: SessionInfo) -> Dict[str, Any]:
    """
    Calculate comprehensive session metrics
    
    Args:
        session_info: Session information object
    
    Returns:
        Dictionary with calculated metrics
    """
    current_time = datetime.now()
    duration = current_time - session_info.start_time
    
    # Calculate messages per minute
    total_minutes = duration.total_seconds() / 60
    messages_per_minute = session_info.message_count / total_minutes if total_minutes > 0 else 0
    
    # Calculate crisis event rate
    crisis_rate = session_info.crisis_events / session_info.message_count if session_info.message_count > 0 else 0
    
    return {
        'total_duration': format_duration(session_info.start_time, current_time),
        'message_count': session_info.message_count,
        'crisis_events': session_info.crisis_events,
        'messages_per_minute': round(messages_per_minute, 2),
        'crisis_rate': round(crisis_rate * 100, 1),  # As percentage
        'session_length_category': _categorize_session_length(duration),
        'activity_level': _categorize_activity_level(messages_per_minute)
    }

def _categorize_session_length(duration: timedelta) -> str:
    """Categorize session length"""
    minutes = duration.total_seconds() / 60
    
    if minutes < 5:
        return "brief"
    elif minutes < 30:
        return "short"
    elif minutes < 60:
        return "medium"
    elif minutes < 120:
        return "long"
    else:
        return "extended"

def _categorize_activity_level(messages_per_minute: float) -> str:
    """Categorize activity level based on messages per minute"""
    if messages_per_minute < 0.5:
        return "low"
    elif messages_per_minute < 1.5:
        return "moderate"
    elif messages_per_minute < 3.0:
        return "high"
    else:
        return "very_high"

def validate_session_id(session_id: str) -> bool:
    """
    Validate session ID format
    
    Args:
        session_id: Session ID to validate
    
    Returns:
        True if valid, False otherwise
    """
    if not session_id or not isinstance(session_id, str):
        return False
    
    # Check if it follows the expected format: prefix_timestamp
    parts = session_id.split('_')
    if len(parts) < 2:
        return False
    
    # Check if the last part is a valid timestamp
    try:
        timestamp = int(parts[-1])
        # Verify it's a reasonable timestamp (not too old, not in future)
        current_time = int(time.time())
        if timestamp > current_time + 3600:  # Not more than 1 hour in future
            return False
        if timestamp < current_time - (7 * 24 * 3600):  # Not more than 7 days old
            return False
        return True
    except ValueError:
        return False

# Global session manager instance
session_manager = SessionManager()