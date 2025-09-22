"""
User Context Manager - Centralized user context detection and management
Handles user identification across different environments
"""

import os
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class UserContext:
    """User context data structure"""
    login: str
    timestamp: datetime
    session_start: str
    user_agent: str
    environment: str
    session_id: Optional[str] = None

class UserContextManager:
    """Manages user context across the application"""
    
    def __init__(self):
        self.current_context: Optional[UserContext] = None
        self._initialize_context()
    
    def _initialize_context(self):
        """Initialize user context from environment"""
        self.current_context = self._create_user_context()
    
    def _create_user_context(self) -> UserContext:
        """Create user context from current environment"""
        current_time = datetime.now(timezone.utc)
        
        # Get user login from environment with intelligent fallback
        user_login = self._get_user_login()
        
        return UserContext(
            login=user_login,
            timestamp=current_time,
            session_start=current_time.isoformat(),
            user_agent=os.getenv('HTTP_USER_AGENT', 'Fluenti-Environment'),
            environment=self._detect_environment()
        )
    
    def _get_user_login(self) -> str:
        """Get user login with intelligent detection"""
        # Try multiple environment variables in order of preference
        user_login = (
            os.getenv('USER_LOGIN') or          # Explicit user login
            os.getenv('USER') or                # System user
            os.getenv('USERNAME') or            # Windows username
            os.getenv('LOGNAME') or             # Unix login name
            'fluenti-user'                      # Fallback
        )
        
        # For development environments, use a more specific default
        if user_login in ['runner', 'root', 'administrator']:
            user_login = 'fluenti-dev-user'
        
        return user_login
    
    def _detect_environment(self) -> str:
        """Detect the current runtime environment"""
        if 'COLAB_GPU' in os.environ:
            return 'Google-Colab'
        elif 'VSCODE_PID' in os.environ:
            return 'VS-Code'
        elif 'JUPYTER_SERVER_ROOT' in os.environ:
            return 'Jupyter'
        elif 'GITHUB_ACTIONS' in os.environ:
            return 'GitHub-Actions'
        elif 'HEROKU_APP_NAME' in os.environ:
            return 'Heroku'
        elif 'VERCEL' in os.environ:
            return 'Vercel'
        elif 'NETLIFY' in os.environ:
            return 'Netlify'
        else:
            return 'Local-Development'
    
    def get_context(self) -> UserContext:
        """Get current user context"""
        if not self.current_context:
            self._initialize_context()
        
        # Type guard to ensure we have a valid context
        if not self.current_context:
            raise RuntimeError("Failed to initialize user context")
            
        return self.current_context
    
    def generate_user_id(self, prefix: Optional[str] = None) -> str:
        """Generate a unique user ID"""
        context = self.get_context()
        timestamp = int(time.time())
        
        if prefix:
            return f"{prefix}_{context.login}_{timestamp}"
        else:
            return f"{context.login}_{timestamp}"
    
    def generate_session_id(self, prefix: str = "session") -> str:
        """Generate a unique session ID"""
        timestamp = int(time.time())
        return f"{prefix}_{timestamp}"
    
    def update_session_id(self, session_id: str):
        """Update the current session ID"""
        if self.current_context:
            self.current_context.session_id = session_id
    
    def get_formatted_context(self) -> Dict[str, Any]:
        """Get formatted context for logging/debugging"""
        context = self.get_context()
        return {
            'user_login': context.login,
            'environment': context.environment,
            'session_start': context.session_start,
            'user_agent': context.user_agent,
            'session_id': context.session_id,
            'timestamp': context.timestamp.isoformat()
        }

def get_user_context() -> Dict[str, Any]:
    """
    Global function to get user context
    
    Returns:
        Dictionary with user context information
    """
    manager = UserContextManager()
    context = manager.get_context()
    
    return {
        'login': context.login,
        'timestamp': context.timestamp,
        'session_start': context.session_start,
        'user_agent': context.user_agent,
        'environment': context.environment
    }

def detect_time_period() -> str:
    """Detect current time period for contextual responses"""
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 12:
        return 'morning'
    elif 12 <= current_hour < 17:
        return 'afternoon'
    elif 17 <= current_hour < 21:
        return 'evening'
    else:
        return 'night'

def format_user_identifier(user_id: str, max_length: int = 12) -> str:
    """Format user identifier for display purposes"""
    if len(user_id) <= max_length:
        return user_id
    return f"...{user_id[-max_length:]}"