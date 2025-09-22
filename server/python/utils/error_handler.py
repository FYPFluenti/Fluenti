"""
Error Handler - Centralized error handling utilities
Provides safe execution and standardized error handling
"""

import functools
import traceback
from typing import Any, Callable, Optional, TypeVar, Union
from datetime import datetime

T = TypeVar('T')

class FluentError(Exception):
    """Base exception for Fluent application errors"""
    pass

class APIError(FluentError):
    """Exception for API-related errors"""
    pass

class EnvironmentError(FluentError):
    """Exception for environment configuration errors"""
    pass

class SessionError(FluentError):
    """Exception for session-related errors"""
    pass

def safe_execute(func: Callable[..., T], *args, fallback: Optional[T] = None, 
                log_errors: bool = True, **kwargs) -> Optional[T]:
    """
    Safely execute a function with error handling
    
    Args:
        func: Function to execute
        *args: Positional arguments for the function
        fallback: Fallback value if function fails
        log_errors: Whether to log errors
        **kwargs: Keyword arguments for the function
    
    Returns:
        Function result or fallback value
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        if log_errors:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"[{timestamp}] Error in {func.__name__}: {str(e)}")
            if hasattr(e, '__traceback__'):
                print(f"Traceback: {traceback.format_exc()}")
        return fallback

def handle_api_error(error: Exception, service: str = "API") -> str:
    """
    Handle API errors and return user-friendly message
    
    Args:
        error: The exception that occurred
        service: Name of the service that failed
    
    Returns:
        User-friendly error message
    """
    error_messages = {
        'connection': f"{service} connection failed. Please check your internet connection.",
        'authentication': f"{service} authentication failed. Please check your API key.",
        'rate_limit': f"{service} rate limit exceeded. Please try again later.",
        'timeout': f"{service} request timed out. Please try again.",
        'not_found': f"{service} resource not found.",
        'server_error': f"{service} server error. Please try again later.",
        'generic': f"{service} error occurred. Please try again."
    }
    
    error_str = str(error).lower()
    
    if 'connection' in error_str or 'network' in error_str:
        return error_messages['connection']
    elif 'auth' in error_str or 'key' in error_str or 'token' in error_str:
        return error_messages['authentication']
    elif 'rate' in error_str or 'limit' in error_str:
        return error_messages['rate_limit']
    elif 'timeout' in error_str:
        return error_messages['timeout']
    elif '404' in error_str or 'not found' in error_str:
        return error_messages['not_found']
    elif '500' in error_str or 'server' in error_str:
        return error_messages['server_error']
    else:
        return error_messages['generic']

def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """
    Decorator to retry function on failure
    
    Args:
        max_retries: Maximum number of retry attempts
        delay: Delay between retries in seconds
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            import time
            
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        print(f"Attempt {attempt + 1} failed for {func.__name__}: {str(e)}")
                        time.sleep(delay)
                    else:
                        print(f"All {max_retries + 1} attempts failed for {func.__name__}")
            
            # Re-raise the last exception if all attempts failed
            if last_exception:
                raise last_exception
                
        return wrapper
    return decorator

def log_error(error: Exception, context: str = "", user_id: Optional[str] = None):
    """
    Log error with context information
    
    Args:
        error: The exception that occurred
        context: Additional context about when/where the error occurred
        user_id: User ID if available
    """
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    user_info = f" [User: {user_id}]" if user_id else ""
    context_info = f" [Context: {context}]" if context else ""
    
    error_log = f"[{timestamp}]{user_info}{context_info} {type(error).__name__}: {str(error)}"
    print(error_log)
    
    # In production, you might want to send this to a logging service
    # For now, we'll just print to console

def validate_input(value: Any, value_type: type, field_name: str) -> bool:
    """
    Validate input value and type
    
    Args:
        value: Value to validate
        value_type: Expected type
        field_name: Name of the field being validated
    
    Returns:
        True if valid, False otherwise
    
    Raises:
        ValueError: If validation fails
    """
    if value is None:
        raise ValueError(f"{field_name} cannot be None")
    
    if not isinstance(value, value_type):
        raise ValueError(f"{field_name} must be of type {value_type.__name__}, got {type(value).__name__}")
    
    if value_type == str and not value.strip():
        raise ValueError(f"{field_name} cannot be empty")
    
    return True

class ErrorTracker:
    """Track and manage application errors"""
    
    def __init__(self):
        self.error_count = 0
        self.error_history = []
        self.max_history = 100
    
    def record_error(self, error: Exception, context: str = ""):
        """Record an error in the tracker"""
        self.error_count += 1
        error_record = {
            'timestamp': datetime.now(),
            'error_type': type(error).__name__,
            'message': str(error),
            'context': context
        }
        
        self.error_history.append(error_record)
        
        # Keep only the most recent errors
        if len(self.error_history) > self.max_history:
            self.error_history = self.error_history[-self.max_history:]
    
    def get_error_summary(self) -> dict:
        """Get summary of tracked errors"""
        return {
            'total_errors': self.error_count,
            'recent_errors': len(self.error_history),
            'most_common_errors': self._get_most_common_errors()
        }
    
    def _get_most_common_errors(self) -> dict:
        """Get the most common error types"""
        error_types = {}
        for error in self.error_history:
            error_type = error['error_type']
            error_types[error_type] = error_types.get(error_type, 0) + 1
        
        return dict(sorted(error_types.items(), key=lambda x: x[1], reverse=True)[:5])

# Global error tracker instance
error_tracker = ErrorTracker()