"""
Security Configuration for Emotional Therapy Bot
This file contains security settings and validation rules.
"""

import os
from typing import Dict, List, Set
import re

class SecurityConfig:
    """Centralized security configuration management"""
    
    # Input validation settings
    MAX_INPUT_LENGTH = int(os.getenv('MAX_INPUT_LENGTH', '5000'))
    MAX_SESSION_DURATION = int(os.getenv('MAX_SESSION_DURATION', '86400'))  # 24 hours
    MAX_CONVERSATIONS_PER_SESSION = int(os.getenv('MAX_CONVERSATIONS_PER_SESSION', '1000'))
    
    # Rate limiting settings
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '3600'))  # 1 hour
    MAX_REQUESTS_PER_HOUR = int(os.getenv('MAX_REQUESTS_PER_HOUR', '100'))
    
    # Security features flags
    ENCRYPTION_ENABLED = os.getenv('ENCRYPTION_ENABLED', 'true').lower() == 'true'
    AUDIT_LOGGING = os.getenv('AUDIT_LOGGING', 'true').lower() == 'true'
    SANITIZE_INPUTS = os.getenv('SANITIZE_INPUTS', 'true').lower() == 'true'
    VALIDATE_SESSION_TOKENS = os.getenv('VALIDATE_SESSION_TOKENS', 'true').lower() == 'true'
    
    # Data retention settings
    DATA_RETENTION_DAYS = int(os.getenv('DATA_RETENTION_DAYS', '30'))
    AUTOMATIC_CLEANUP = os.getenv('AUTOMATIC_CLEANUP', 'true').lower() == 'true'
    
    # Crisis detection security
    CRISIS_ALERT_ENABLED = os.getenv('CRISIS_ALERT_ENABLED', 'true').lower() == 'true'
    LOG_CRISIS_DETAILS = os.getenv('LOG_CRISIS_DETAILS', 'false').lower() == 'true'
    
    # Input sanitization patterns
    DANGEROUS_PATTERNS = [
        r'\bDROP\b', r'\bDELETE\b', r'\bINSERT\b', r'\bUPDATE\b',
        r'\bUNION\b', r'\bSELECT\b', r'\bEXEC\b', r'\bEXECUTE\b',
        r'<script', r'javascript:', r'vbscript:', r'onload=', r'onerror=',
        r'eval\s*\(', r'setTimeout\s*\(', r'setInterval\s*\(',
        r'document\.', r'window\.', r'alert\s*\('
    ]
    
    # Allowed characters for user IDs
    USER_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_\-\.@]+$')
    SESSION_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_\-]+$')
    
    # PII fields that should be encrypted
    SENSITIVE_FIELDS = {
        'user_input', 'bot_response', 'message', 'content',
        'conversation_text', 'response_text', 'user_message'
    }
    
    # Fields that should be hashed for privacy
    PII_FIELDS = {
        'user_id', 'session_id', 'login', 'email', 'username',
        'user_agent', 'ip_address', 'device_id'
    }
    
    @classmethod
    def validate_user_id(cls, user_id: str) -> bool:
        """Validate user ID format"""
        if not user_id or len(user_id) > 100:
            return False
        return bool(cls.USER_ID_PATTERN.match(user_id))
    
    @classmethod
    def validate_session_id(cls, session_id: str) -> bool:
        """Validate session ID format"""
        if not session_id or len(session_id) > 150:
            return False
        return bool(cls.SESSION_ID_PATTERN.match(session_id))
    
    @classmethod
    def is_sensitive_field(cls, field_name: str) -> bool:
        """Check if field contains sensitive data"""
        return field_name.lower() in cls.SENSITIVE_FIELDS
    
    @classmethod
    def is_pii_field(cls, field_name: str) -> bool:
        """Check if field contains PII data"""
        return field_name.lower() in cls.PII_FIELDS
    
    @classmethod
    def get_security_headers(cls) -> Dict[str, str]:
        """Get recommended security headers"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    
    @classmethod
    def validate_configuration(cls) -> List[str]:
        """Validate security configuration and return warnings"""
        warnings = []
        
        if not cls.ENCRYPTION_ENABLED:
            warnings.append("Encryption is disabled - sensitive data will be stored in plaintext")
        
        if not cls.AUDIT_LOGGING:
            warnings.append("Audit logging is disabled - security events will not be tracked")
        
        if not cls.VALIDATE_SESSION_TOKENS:
            warnings.append("Session token validation is disabled - security risk")
        
        if cls.DATA_RETENTION_DAYS > 90:
            warnings.append(f"Data retention period is {cls.DATA_RETENTION_DAYS} days - consider shorter retention for privacy")
        
        if cls.MAX_REQUESTS_PER_HOUR > 200:
            warnings.append(f"Rate limit is high ({cls.MAX_REQUESTS_PER_HOUR}/hour) - may allow abuse")
        
        if not os.getenv('ENCRYPTION_KEY'):
            warnings.append("No encryption key set in environment - using generated key")
        
        return warnings

# Security constants
SECURITY_VERSION = "2.0"
LAST_UPDATED = "2025-11-16"

# Export configuration instance
security_config = SecurityConfig()