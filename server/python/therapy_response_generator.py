#!/usr/bin/env python3
"""
Lightweight Therapy Response Generator
Integrates existing components for cohesive response generation
"""

import time
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

def run_console_therapy_session():
    """Run a simple console-based therapy session using existing components"""

    if not interface:
        print("❌ Therapy bot not properly initialized. Please check your setup.")
        return

    print("=" * 60)
    print("🤝 Mental Health Support Chat - Console Version")
    print("=" * 60)
    print("Type 'quit', 'exit', or 'bye' to end the session")
    print("Type 'summary' to get a session summary")
    print("Type 'new' to start a new session")
    print("=" * 60)

    # Start initial session using existing interface
    welcome_msg = interface.start_session()
    print(f"\n🤖 Bot: {welcome_msg}\n")

    # Main conversation loop
    while True:
        try:
            # Get user input
            user_input = input("👤 You: ").strip()

            # Handle special commands
            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("\n🤖 Bot: Thank you for sharing with me today. Take care, and remember that support is always available when you need it.")
                print("\n🚨 Remember: If you're in crisis, contact 988 (Suicide & Crisis Lifeline) or 911")
                break

            elif user_input.lower() == 'summary':
                summary = interface.get_session_summary()
                print(f"\n📋 {summary}\n")
                continue

            elif user_input.lower() == 'new':
                welcome_msg = interface.start_session()
                print(f"\n🤖 Bot: {welcome_msg}\n")
                continue

            elif not user_input:
                print("Please enter a message or type 'quit' to exit.")
                continue

            # Get bot response using existing interface
            print("\n🤖 Thinking...")
            response = interface.send_message(user_input)
            print(f"\n🤖 Bot: {response}\n")

        except KeyboardInterrupt:
            print("\n\n🤖 Bot: Session interrupted. Take care!")
            break
        except Exception as e:
            error_msg = handle_api_error(e, "Console Session")
            print(f"\n❌ {error_msg}")
            print("Please try again or type 'quit' to exit.")

def test_therapy_bot():
    """Test the therapy bot with sample conversations using existing components"""

    if not interface:
        print("❌ Therapy bot not available for testing")
        return

    print("🧪 Testing Therapy Bot...")

    # Start session using existing interface
    welcome = interface.start_session()
    print(f"Welcome: {welcome[:100]}...")

    # Test messages
    test_messages = [
        "Hi, I'm having a rough day at work",
        "My boss scolded me in front of everyone and I feel so embarrassed",
        "I just want to forget about it",
        "Thanks for listening"
    ]

    for msg in test_messages:
        print(f"\n📤 Test input: {msg}")
        response = interface.send_message(msg)
        print(f"📥 Response: {response[:150]}...")

    # Get summary using existing interface
    summary = interface.get_session_summary()
    print(f"\n📋 Summary: {summary[:200]}...")

    print("\n✅ Bot test completed!")

def generate_single_response(user_message: str, user_id: Optional[str] = None, session_id: Optional[str] = None) -> str:
    """
    Generate a single response using existing components
    Useful for API endpoints or programmatic access
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
    """Get status of all integrated components"""
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

def print_system_status():
    """Print system status in a readable format"""
    status = get_system_status()
    
    print("\n🔍 System Status:")
    print("=" * 40)
    print(f"Therapy Bot: {'✅' if status['therapy_bot'] else '❌'}")
    print(f"Interface: {'✅' if status['interface'] else '❌'}")
    print(f"Session Active: {'✅' if status['session_active'] else '❌'}")
    
    if status.get('user_context'):
        user = status['user_context']
        print(f"User: {user['login']} ({user['environment']})")
    
    print("\n📦 Components:")
    for component, available in status['components'].items():
        print(f"  {component}: {'✅' if available else '❌'}")
    
    if status.get('error'):
        print(f"\n❌ Error: {status['error']}")
    
    print("=" * 40)

# Main execution
if __name__ == "__main__":
    print("\n🚀 Therapy Response Generator")
    print("Integrating existing components...")
    
    # Print system status
    print_system_status()
    
    # Choose how to run the interface
    print("\n🚀 Therapy Bot Interface Options:")
    print("1. Run interactive console session")
    print("2. Run quick test")
    print("3. Show system status only")
    
    try:
        choice = input("\nEnter your choice (1, 2, or 3): ").strip()
        
        if choice == "1":
            run_console_therapy_session()
        elif choice == "2":
            test_therapy_bot()
        else:
            print("\n✅ Interface setup complete. Available functions:")
            print("- generate_single_response('your message') for single responses")
            print("- run_console_therapy_session() for interactive mode")
            print("- test_therapy_bot() for testing")
            print("- get_system_status() for component status")
            
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")