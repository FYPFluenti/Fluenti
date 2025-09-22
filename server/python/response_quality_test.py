#!/usr/bin/env python3
"""
Comprehensive Therapy Response Quality Testing
Tests actual therapeutic responses against established best practices
"""

from SessionMemory import TherapyBot
from utils.env_manager import get_api_key
import json
import re

def analyze_response_quality(response, expected_elements, category):
    """Analyze response quality against therapeutic best practices"""
    analysis = {
        'category': category,
        'response_length': len(response),
        'elements_found': [],
        'quality_indicators': {},
        'areas_for_improvement': [],
        'overall_score': 0
    }
    
    # Check for key therapeutic elements
    response_lower = response.lower()
    
    # Validation and empathy indicators
    empathy_phrases = ['understand', 'hear you', 'sounds like', 'that must', 'i can imagine', 'feels', 'difficult', 'challenging']
    validation_phrases = ['valid', 'makes sense', 'understandable', 'normal', 'okay to feel']
    
    # Professional boundaries
    professional_phrases = ['i\'m not', 'professional help', 'therapist', 'counselor', 'qualified']
    
    # Coping strategies
    coping_phrases = ['breathing', 'grounding', 'technique', 'strategy', 'help you', 'try', 'practice']
    
    # Crisis indicators
    crisis_phrases = ['crisis', 'emergency', '988', '911', 'safety', 'immediate']
    
    # Score empathy (0-25 points)
    empathy_count = sum(1 for phrase in empathy_phrases if phrase in response_lower)
    analysis['quality_indicators']['empathy'] = min(empathy_count * 5, 25)
    if empathy_count > 0:
        analysis['elements_found'].append('empathy')
    
    # Score validation (0-25 points)
    validation_count = sum(1 for phrase in validation_phrases if phrase in response_lower)
    analysis['quality_indicators']['validation'] = min(validation_count * 8, 25)
    if validation_count > 0:
        analysis['elements_found'].append('validation')
    
    # Score professional boundaries (0-20 points)
    professional_count = sum(1 for phrase in professional_phrases if phrase in response_lower)
    analysis['quality_indicators']['professional_boundaries'] = min(professional_count * 10, 20)
    if professional_count > 0:
        analysis['elements_found'].append('professional_boundaries')
    
    # Score coping strategies (0-20 points)
    coping_count = sum(1 for phrase in coping_phrases if phrase in response_lower)
    analysis['quality_indicators']['coping_strategies'] = min(coping_count * 5, 20)
    if coping_count > 0:
        analysis['elements_found'].append('coping_strategies')
    
    # Score crisis awareness (0-10 points)
    crisis_count = sum(1 for phrase in crisis_phrases if phrase in response_lower)
    analysis['quality_indicators']['crisis_awareness'] = min(crisis_count * 5, 10)
    if crisis_count > 0:
        analysis['elements_found'].append('crisis_awareness')
    
    # Check response structure
    has_questions = '?' in response
    has_reflection = any(word in response_lower for word in ['it sounds like', 'what i hear', 'seems like'])
    appropriate_length = 100 <= len(response) <= 500
    
    if has_questions:
        analysis['quality_indicators']['engagement'] = 10
        analysis['elements_found'].append('therapeutic_questions')
    
    if has_reflection:
        analysis['quality_indicators']['reflection'] = 10
        analysis['elements_found'].append('reflection')
    
    if appropriate_length:
        analysis['quality_indicators']['appropriate_length'] = 10
    else:
        analysis['areas_for_improvement'].append('response_length')
    
    # Calculate overall score
    total_score = sum(analysis['quality_indicators'].values())
    analysis['overall_score'] = min(total_score, 100)
    
    # Add improvement suggestions
    if analysis['overall_score'] < 50:
        analysis['areas_for_improvement'].append('needs_more_empathy_and_validation')
    if 'professional_boundaries' not in analysis['elements_found']:
        analysis['areas_for_improvement'].append('should_mention_professional_limitations')
    
    return analysis

def run_therapy_response_tests():
    """Run comprehensive therapy response testing"""
    print("=== COMPREHENSIVE THERAPY RESPONSE TESTING ===")
    
    groq_key = get_api_key('groq')
    if not groq_key:
        print("❌ No Groq API key found")
        return
    
    bot = TherapyBot(groq_key)
    
    # Test scenarios based on evidence-based therapeutic principles
    test_scenarios = [
        {
            'input': 'I feel like nobody cares about me and I am worthless',
            'category': 'depression_self_worth',
            'expected_elements': ['validation', 'reframe_negative_thoughts', 'empathy', 'challenge_absolutism']
        },
        {
            'input': 'I have been having panic attacks and I cannot control my breathing',
            'category': 'anxiety_panic',
            'expected_elements': ['breathing_techniques', 'grounding', 'normalize_experience', 'coping_strategies']
        },
        {
            'input': 'My relationship ended and I feel completely alone',
            'category': 'grief_loss',
            'expected_elements': ['validate_grief', 'normalize_pain', 'support_exploration', 'hope_building']
        },
        {
            'input': 'I have been drinking more lately to cope with stress',
            'category': 'substance_coping',
            'expected_elements': ['non_judgmental', 'explore_triggers', 'healthy_alternatives', 'professional_resources']
        },
        {
            'input': 'Work is so stressful I can barely get out of bed in the morning',
            'category': 'work_stress_depression',
            'expected_elements': ['validate_stress', 'explore_impact', 'coping_strategies', 'work_life_balance']
        }
    ]
    
    results = []
    total_scores = []
    
    for i, scenario in enumerate(test_scenarios):
        print(f"\n--- Test {i+1}: {scenario['category']} ---")
        print(f"Input: {scenario['input']}")
        
        # Generate response
        response, crisis_level = bot.generate_enhanced_response(
            scenario['input'], 
            f'test_user_{i}', 
            f'test_session_{i}'
        )
        
        print(f"Crisis Level: {crisis_level.value}")
        print(f"Response ({len(response)} chars): {response[:200]}...")
        
        # Analyze quality
        analysis = analyze_response_quality(response, scenario['expected_elements'], scenario['category'])
        
        print(f"Quality Score: {analysis['overall_score']}/100")
        print(f"Elements Found: {', '.join(analysis['elements_found'])}")
        
        if analysis['areas_for_improvement']:
            print(f"Areas for Improvement: {', '.join(analysis['areas_for_improvement'])}")
        
        results.append({
            'scenario': scenario['category'],
            'input': scenario['input'],
            'response': response,
            'crisis_level': crisis_level.value,
            'analysis': analysis
        })
        
        total_scores.append(analysis['overall_score'])
    
    # Overall assessment
    average_score = sum(total_scores) / len(total_scores)
    print(f"\n=== OVERALL ASSESSMENT ===")
    print(f"Average Quality Score: {average_score:.1f}/100")
    
    if average_score >= 80:
        print("✅ EXCELLENT: Responses meet high therapeutic standards")
    elif average_score >= 70:
        print("✅ GOOD: Responses are therapeutically sound with minor improvements needed")
    elif average_score >= 60:
        print("⚠️ MODERATE: Responses need improvement in key areas")
    else:
        print("❌ NEEDS WORK: Responses require significant therapeutic enhancement")
    
    # Save detailed results
    with open('therapy_response_analysis.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📊 Detailed analysis saved to 'therapy_response_analysis.json'")
    
    return results, average_score

if __name__ == "__main__":
    run_therapy_response_tests()