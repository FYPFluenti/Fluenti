#!/usr/bin/env python3
"""Test crisis detection patterns"""

def test_crisis_patterns():
    """Test if the crisis detection patterns match the user's examples"""
    
    test_messages = [
        "i feel like dying",
        "i wanna just die", 
        "ill kill myself"
    ]
    
    # These are the patterns from the emotional_therapy.py file
    critical_patterns = {
        'suicide_explicit': {
            'patterns': ['kill myself', 'end my life', 'take my life', 'suicide', 'suicidal', 
                       'want to die', 'wanna die', 'wish i was dead', 'better off dead',
                       'should be dead', 'going to kill myself', 'plan to die'],
            'score': 10.0,
            'variations': ['kill my self', 'end my own life', 'want to dies', 'wanna dies']
        }
    }
    
    print("Crisis Detection Pattern Test")
    print("=" * 40)
    
    # Test each message
    for msg in test_messages:
        msg_lower = msg.lower()
        print(f"Testing: '{msg}'")
        
        # Check if patterns match
        matches = []
        all_patterns = critical_patterns['suicide_explicit']['patterns'] + critical_patterns['suicide_explicit']['variations']
        
        for pattern in all_patterns:
            if pattern in msg_lower:
                matches.append(pattern)
        
        print(f"  Matches found: {matches}")
        
        # Check specific patterns that should match
        specific_checks = [
            ('want to die', 'want to die' in msg_lower),
            ('wanna die', 'wanna die' in msg_lower), 
            ('kill myself', 'kill myself' in msg_lower),
            ('feel like dying', 'dying' in msg_lower)  # Check if 'dying' variant exists
        ]
        
        for pattern, found in specific_checks:
            if found:
                print(f"  ✓ Matches '{pattern}': {found}")
            else:
                print(f"  ✗ Missing '{pattern}': {found}")
        
        # Calculate expected crisis score
        crisis_score = len(matches) * 10.0
        print(f"  Expected Crisis Score: {crisis_score}")
        print(f"  Should trigger CRITICAL: {'YES' if crisis_score >= 10.0 else 'NO'}")
        print("---")
    
    print("\n🔍 ISSUE ANALYSIS:")
    print("1. 'i feel like dying' - Contains 'dying' but patterns look for 'want to die' or 'wanna die'")
    print("2. 'i wanna just die' - Should match 'wanna die' pattern") 
    print("3. 'ill kill myself' - Should match 'kill myself' pattern")
    
    print("\n💡 RECOMMENDED FIXES:")
    print("1. Add 'feel like dying' to suicide_explicit patterns")
    print("2. Add 'wanna * die' pattern to catch 'wanna just die'") 
    print("3. Add 'ill kill myself' pattern (contraction of 'I will')")
    print("4. Add more flexible pattern matching for variations")

if __name__ == "__main__":
    test_crisis_patterns()