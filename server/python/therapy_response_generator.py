#!/usr/bin/env python3
"""
Production Therapy Response Generator
Provides API for therapy response generation and system integration
"""

import sys
import os
from typing import Optional

# Add current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import existing components
from TherapyInterface import interface, therapy_bot
from utils.user_context import get_user_context
from utils.message_formatter import MessageFormatter
from utils.error_handler import handle_api_error

# Initialize utilities
message_formatter = MessageFormatter()

def generate_single_response(user_message: str, user_id: Optional[str] = None, session_id: Optional[str] = None) -> str:
    """
    Generate a therapy response for the given user message.
    
    Args:
        user_message: The user's input message
        user_id: Optional user identifier for session management
        session_id: Optional session identifier
        
    Returns:
        str: The generated therapy response
    """
    if not interface:
        return "Therapy bot not available"
    
    try:
        # Start session if needed
        if not interface.current_session_id:
            interface.start_session(user_id)
        
        # Generate response using existing interface
        response = interface.send_message(user_message)
        return response
        
    except Exception as e:
        return handle_api_error(e, "Response Generation")

def get_system_status() -> dict:
    """
    Get the operational status of all therapy system components.
    
    Returns:
        dict: Status information for system monitoring and health checks
    """
    status = {
        "therapy_bot": therapy_bot is not None,
        "interface": interface is not None,
        "session_active": interface.current_session_id is not None if interface else False,
        "user_context": None,
        "components": {
            "mongodb_storage": False,
            "crisis_detector": False,
            "session_memory": False,
            "data_loader": False
        }
    }
    
    try:
        # Get user context
        status["user_context"] = get_user_context()
        
        # Check component availability
        if therapy_bot:
            status["components"]["mongodb_storage"] = hasattr(therapy_bot, 'storage') and therapy_bot.storage is not None
            status["components"]["crisis_detector"] = hasattr(therapy_bot, 'crisis_detector') and therapy_bot.crisis_detector is not None
            status["components"]["session_memory"] = hasattr(therapy_bot, 'session_memories') and therapy_bot.session_memories is not None
            
        # Check if DataLoader datasets are available
        try:
            from DataLoader import datasets
            status["components"]["data_loader"] = len(datasets) > 0
        except:
            status["components"]["data_loader"] = False
            
    except Exception as e:
        status["error"] = str(e)
    
    return status

# Main execution
if __name__ == "__main__":
    # Production mode - just verify system is ready
    status = get_system_status()
    if not status['therapy_bot'] or not status['interface']:
        print("❌ Therapy system not properly initialized")
        sys.exit(1)
    print("✅ Therapy Response Generator ready for production use")