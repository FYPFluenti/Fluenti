#!/usr/bin/env python3
"""
Simple API Wrapper for Therapy Response Generator
Provides a clean interface for programmatic access to the therapy bot
"""

import sys
import os
from typing import Dict, Optional, Tuple
from datetime import datetime

# Add current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import existing components
from TherapyInterface import interface, therapy_bot, TherapyInterface
from SessionMemory import CrisisLevel, TherapyBot
from utils.user_context import get_user_context
from utils.error_handler import handle_api_error

class TherapyResponseAPI:
    """
    Simple API wrapper for therapy response generation
    Reuses all existing components without duplication
    """
    
    def __init__(self):
        self.interface: Optional[TherapyInterface] = interface
        self.therapy_bot: Optional[TherapyBot] = therapy_bot
        self.active_sessions = {}
        
    def is_available(self) -> bool:
        """Check if the therapy bot is available"""
        return self.interface is not None and self.therapy_bot is not None
    
    def start_session(self, user_id: Optional[str] = None) -> Dict:
        """
        Start a new therapy session
        Returns session info and welcome message
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Therapy bot not available",
                "session_id": None,
                "welcome_message": None
            }
        
        if self.interface is None:
            return {
                "success": False,
                "error": "Interface not initialized",
                "session_id": None,
                "welcome_message": None
            }
        
        try:
            # Start session using existing interface
            welcome_message = self.interface.start_session(user_id)
            
            return {
                "success": True,
                "session_id": self.interface.current_session_id,
                "user_id": self.interface.current_user_id,
                "welcome_message": welcome_message,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": handle_api_error(e, "Session Start"),
                "session_id": None,
                "welcome_message": None
            }
    
    def send_message(self, message: str, session_id: Optional[str] = None) -> Dict:
        """
        Send a message and get response
        Returns response with metadata
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Therapy bot not available",
                "response": None,
                "crisis_level": None
            }
        
        if self.interface is None:
            return {
                "success": False,
                "error": "Interface not initialized",
                "response": None,
                "crisis_level": None
            }
        
        # Auto-start session if needed
        if not self.interface.current_session_id:
            session_result = self.start_session()
            if not session_result["success"]:
                return {
                    "success": False,
                    "error": "Could not start session",
                    "response": None,
                    "crisis_level": None
                }
        
        try:
            # Get response using existing interface
            response = self.interface.send_message(message)
            
            return {
                "success": True,
                "response": response,
                "session_id": self.interface.current_session_id,
                "user_id": self.interface.current_user_id,
                "crisis_level": self.interface.last_crisis_level.value if hasattr(self.interface, 'last_crisis_level') else "none",
                "message_count": self.interface.conversation_count,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": handle_api_error(e, "Message Processing"),
                "response": None,
                "crisis_level": None
            }
    
    def get_session_summary(self, session_id: Optional[str] = None) -> Dict:
        """
        Get session summary using existing interface
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Therapy bot not available",
                "summary": None
            }
        
        if self.interface is None:
            return {
                "success": False,
                "error": "Interface not initialized",
                "summary": None
            }
        
        try:
            summary = self.interface.get_session_summary()
            
            return {
                "success": True,
                "summary": summary,
                "session_id": self.interface.current_session_id,
                "user_id": self.interface.current_user_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": handle_api_error(e, "Summary Generation"),
                "summary": None
            }
    
    def get_system_status(self) -> Dict:
        """Get comprehensive system status"""
        status = {
            "therapy_bot_available": self.therapy_bot is not None,
            "interface_available": self.interface is not None,
            "session_active": self.interface.current_session_id is not None if self.interface else False,
            "current_session_id": self.interface.current_session_id if self.interface else None,
            "current_user_id": self.interface.current_user_id if self.interface else None,
            "message_count": self.interface.conversation_count if self.interface else 0,
            "user_context": None,
            "components": {
                "mongodb_storage": False,
                "crisis_detector": False,
                "session_memory": False,
                "data_loader": False
            },
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            # Get user context
            status["user_context"] = get_user_context()
            
            # Check component availability
            if self.therapy_bot:
                status["components"]["mongodb_storage"] = hasattr(self.therapy_bot, 'storage') and self.therapy_bot.storage is not None
                status["components"]["crisis_detector"] = hasattr(self.therapy_bot, 'crisis_detector') and self.therapy_bot.crisis_detector is not None
                status["components"]["session_memory"] = hasattr(self.therapy_bot, 'session_memories') and self.therapy_bot.session_memories is not None
                
            # Check if DataLoader datasets are available
            try:
                from DataLoader import datasets
                status["components"]["data_loader"] = len(datasets) > 0
            except:
                status["components"]["data_loader"] = False
                
        except Exception as e:
            status["error"] = str(e)
        
        return status

# Initialize API instance
api = TherapyResponseAPI()

# Convenience functions for direct use
def quick_response(message: str) -> str:
    """Get a quick response without dealing with the full API"""
    result = api.send_message(message)
    return result.get("response", "Sorry, I'm not available right now.")

def start_new_session() -> str:
    """Start a new session and return welcome message"""
    result = api.start_session()
    return result.get("welcome_message", "Sorry, I'm not available right now.")

def get_summary() -> str:
    """Get current session summary"""
    result = api.get_session_summary()
    return result.get("summary", "No session summary available.")

# Demo function
def demo_api():
    """Demonstrate API usage"""
    print("🔧 Therapy Response API Demo")
    print("=" * 40)
    
    # Check status
    status = api.get_system_status()
    print(f"System Available: {'✅' if status['therapy_bot_available'] else '❌'}")
    
    if not status['therapy_bot_available']:
        print("❌ Therapy bot not available")
        return
    
    # Start session
    print("\n1. Starting session...")
    session_result = api.start_session()
    if session_result["success"]:
        print(f"   Session ID: {session_result['session_id'][-8:]}")
        print(f"   Welcome: {session_result['welcome_message'][:80]}...")
    else:
        print(f"   Error: {session_result['error']}")
        return
    
    # Send messages
    test_messages = [
        "Hi, I'm feeling anxious today",
        "I have a big presentation tomorrow and I'm worried"
    ]
    
    for i, msg in enumerate(test_messages, 2):
        print(f"\n{i}. Sending: '{msg}'")
        result = api.send_message(msg)
        if result["success"]:
            print(f"   Crisis Level: {result['crisis_level']}")
            print(f"   Response: {result['response'][:80]}...")
        else:
            print(f"   Error: {result['error']}")
    
    # Get summary
    print(f"\n{len(test_messages) + 2}. Getting summary...")
    summary_result = api.get_session_summary()
    if summary_result["success"]:
        print(f"   Summary: {summary_result['summary'][:100]}...")
    else:
        print(f"   Error: {summary_result['error']}")
    
    print("\n✅ API Demo Complete!")

if __name__ == "__main__":
    print("🔧 Therapy Response API")
    print("Simple programmatic interface to therapy bot")
    print("\nAvailable functions:")
    print("- api.start_session()")
    print("- api.send_message(message)")
    print("- api.get_session_summary()")
    print("- api.get_system_status()")
    print("- quick_response(message)")
    print("- start_new_session()")
    print("- get_summary()")
    
    # Ask if user wants to run demo
    try:
        choice = input("\nRun API demo? (y/n): ").strip().lower()
        if choice in ['y', 'yes']:
            demo_api()
        else:
            print("✅ API ready for use!")
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")