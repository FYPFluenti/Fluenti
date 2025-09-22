"""
Common Utilities Module for Fluenti Mental Health System

This module provides shared functionality across all mental health scripts:
- Environment variable management
- API key validation and loading
- User context detection
- Common error handling
- Session management utilities
- Message formatting
"""

from .env_manager import get_api_key, get_connection_string, validate_environment
from .user_context import get_user_context, UserContextManager
from .message_formatter import MessageFormatter
from .error_handler import safe_execute, handle_api_error
from .session_utils import generate_session_id, format_duration

# Create singleton instances for common use
user_context_manager = UserContextManager()
message_formatter = MessageFormatter()

__all__ = [
    'get_api_key',
    'get_connection_string', 
    'validate_environment',
    'get_user_context',
    'user_context_manager',
    'message_formatter',
    'safe_execute',
    'handle_api_error',
    'generate_session_id',
    'format_duration'
]