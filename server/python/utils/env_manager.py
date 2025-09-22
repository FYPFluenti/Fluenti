"""
Environment Manager - Centralized environment variable handling
Ensures all sensitive values are loaded from .env file securely
"""

import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables once at module import
load_dotenv()

class EnvironmentError(Exception):
    """Custom exception for environment-related errors"""
    pass

def get_api_key(service: str, required: bool = True) -> Optional[str]:
    """
    Get API key for specified service from environment variables
    
    Args:
        service: Service name ('groq', 'openai', 'huggingface', 'mongodb')
        required: Whether the key is required (raises error if missing)
    
    Returns:
        API key string or None if not found and not required
    
    Raises:
        EnvironmentError: If required key is missing
    """
    service_keys = {
        'groq': 'GROQ_API_KEY',
        'openai': 'OPENAI_API_KEY', 
        'huggingface': 'HUGGINGFACE_API_KEY',
        'mongodb': 'MONGODB_URI'
    }
    
    if service.lower() not in service_keys:
        raise ValueError(f"Unknown service: {service}. Supported: {list(service_keys.keys())}")
    
    env_var = service_keys[service.lower()]
    api_key = os.getenv(env_var)
    
    if not api_key and required:
        raise EnvironmentError(
            f"❌ {env_var} not found in environment variables!\n"
            f"Please add {env_var}=your_key to your .env file"
        )
    
    if api_key:
        # Log successful load without exposing the key
        print(f"✅ {env_var} loaded from environment")
        
    return api_key

def get_connection_string(service: str, required: bool = True) -> Optional[str]:
    """
    Get connection string for specified service
    
    Args:
        service: Service name ('mongodb', 'postgres', etc.)
        required: Whether the connection string is required
    
    Returns:
        Connection string or None if not found and not required
    """
    connection_vars = {
        'mongodb': 'MONGODB_URI',
        'postgres': 'POSTGRES_URI',
        'redis': 'REDIS_URI'
    }
    
    if service.lower() not in connection_vars:
        raise ValueError(f"Unknown service: {service}. Supported: {list(connection_vars.keys())}")
    
    env_var = connection_vars[service.lower()]
    connection_string = os.getenv(env_var)
    
    if not connection_string and required:
        raise EnvironmentError(
            f"❌ {env_var} not found in environment variables!\n"
            f"Please add {env_var}=your_connection_string to your .env file"
        )
    
    if connection_string:
        # Log successful load without exposing sensitive data
        print(f"✅ {env_var} loaded from environment")
        
    return connection_string

def validate_environment() -> Dict[str, bool]:
    """
    Validate that all required environment variables are present
    
    Returns:
        Dictionary mapping service names to availability status
    """
    required_vars = {
        'GROQ_API_KEY': 'groq',
        'MONGODB_URI': 'mongodb',
        'OPENAI_API_KEY': 'openai',
        'HUGGINGFACE_API_KEY': 'huggingface'
    }
    
    status = {}
    missing_vars = []
    
    for env_var, service in required_vars.items():
        value = os.getenv(env_var)
        status[service] = bool(value)
        if not value:
            missing_vars.append(env_var)
    
    if missing_vars:
        print(f"⚠️ Missing environment variables: {', '.join(missing_vars)}")
        print("Add these to your .env file for full functionality")
    else:
        print("✅ All required environment variables are present")
    
    return status

def get_env_var(var_name: str, default: Optional[str] = None, required: bool = False) -> Optional[str]:
    """
    Generic environment variable getter with validation
    
    Args:
        var_name: Environment variable name
        default: Default value if not found
        required: Whether the variable is required
    
    Returns:
        Environment variable value or default
    """
    value = os.getenv(var_name, default)
    
    if not value and required:
        raise EnvironmentError(f"❌ Required environment variable {var_name} not found!")
    
    return value

def get_model_cache_config() -> Dict[str, str]:
    """
    Get model cache configuration from environment
    
    Returns:
        Dictionary with cache paths and settings
    """
    return {
        'hf_home': os.getenv('HF_HOME', 'models/hf_cache'),
        'whisper_cache': os.getenv('WHISPER_CACHE_DIR', 'models/hf_cache/whisper'),
        'torch_disable_check': os.getenv('HF_HUB_DISABLE_TORCH_LOAD_CHECK', '0')
    }

def get_server_config() -> Dict[str, Any]:
    """
    Get server configuration from environment
    
    Returns:
        Dictionary with server settings
    """
    return {
        'port': int(os.getenv('PORT', '3000')),
        'node_env': os.getenv('NODE_ENV', 'development'),
        'session_secret': os.getenv('SESSION_SECRET', ''),
        'debug': os.getenv('NODE_ENV') == 'development'
    }