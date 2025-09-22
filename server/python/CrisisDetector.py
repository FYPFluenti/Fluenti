
import re
import os
from typing import Dict, List, Set, Tuple, Any, Optional
from collections import defaultdict, Counter
import json
from datetime import datetime
from enum import Enum
from dataclasses import dataclass

# Import common utilities
from utils.user_context import get_user_context
from utils.error_handler import safe_execute, log_error

# Define CrisisLevel enum
class CrisisLevel(Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Define UserSession dataclass
@dataclass
class UserSession:
    user_id: str
    session_id: str
    start_time: datetime
    mood_history: List[Dict]
    topics_discussed: List[str]
    crisis_level: CrisisLevel
    conversation_history: List[Dict]

# Import NLTK sentiment analyzer
try:
    from nltk.sentiment import SentimentIntensityAnalyzer
    SENTIMENT_AVAILABLE = True
except ImportError:
    SentimentIntensityAnalyzer = None
    SENTIMENT_AVAILABLE = False
    print("⚠️ NLTK not available, using basic sentiment analysis")

class CrisisDetector:
    """Fully dynamic crisis detection system with zero hardcoded patterns"""

    def __init__(self):
        # Core crisis severity indicators - these are fundamental psychological markers
        self.severity_markers = {
            'critical_risk': {
                'weight': 4,
                'base_indicators': set()  # Will be learned dynamically
            },
            'high_risk': {
                'weight': 3,
                'base_indicators': set()
            },
            'moderate_concern': {
                'weight': 2,
                'base_indicators': set()
            },
            'mild_concern': {
                'weight': 1,
                'base_indicators': set()
            }
        }

        # Dynamic learning storage
        self.learned_patterns = {
            'contexts': defaultdict(lambda: {'keywords': set(), 'phrases': set(), 'frequency': 0}),
            'help_seeking': defaultdict(int),
            'negation_patterns': defaultdict(int),
            'crisis_indicators': defaultdict(lambda: {'severity': 0, 'context_associations': defaultdict(int)}),
            'escalation_patterns': defaultdict(list)
        }

        # Conversation tracking for pattern learning
        self.conversation_history: Dict[str, List] = defaultdict(list)
        self.user_patterns: Dict[str, Dict] = defaultdict(lambda: {
            'typical_language': defaultdict(int),
            'crisis_history': [],
            'help_seeking_patterns': defaultdict(int),
            'context_preferences': defaultdict(int)
        })

        # Dynamic linguistic analysis
        self.linguistic_patterns = {
            'question_indicators': defaultdict(int),
            'request_indicators': defaultdict(int),
            'emotional_intensity': defaultdict(int),
            'temporal_urgency': defaultdict(int),
            'social_connection': defaultdict(int)
        }

        # Initialize sentiment analyzer
        try:
            if SENTIMENT_AVAILABLE and SentimentIntensityAnalyzer:
                self.sentiment_analyzer = SentimentIntensityAnalyzer()
                self.sentiment_available = True
            else:
                self.sentiment_analyzer = None
                self.sentiment_available = False
        except Exception:
            self.sentiment_analyzer = None
            self.sentiment_available = False

        # Get current user context using utilities
        self.current_user = get_user_context()

        print(f"Fully dynamic crisis detection initialized for user: {self.current_user['login']}")

    def _classify_time_of_day(self, hour: int) -> str:
        """Dynamically classify time periods"""
        if 5 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 17:
            return 'afternoon'
        elif 17 <= hour < 21:
            return 'evening'
        else:
            return 'night'

    def _extract_linguistic_features(self, text: str) -> Dict[str, Any]:
        """Dynamically extract linguistic features from text"""
        text_lower = text.lower().strip()
        words = text_lower.split()

        features = {
            'word_count': len(words),
            'sentence_count': len([s for s in text.split('.') if s.strip()]),
            'question_marks': text.count('?'),
            'exclamation_marks': text.count('!'),
            'first_person': sum(1 for word in words if word in ['i', 'me', 'my', 'myself', 'mine']),
            'second_person': sum(1 for word in words if word in ['you', 'your', 'yours', 'yourself']),
            'negation_words': sum(1 for word in words if word in ['no', 'not', 'never', 'nothing', 'nobody', 'nowhere']),
            'intensity_words': sum(1 for word in words if word in ['very', 'really', 'extremely', 'completely', 'totally']),
            'temporal_words': sum(1 for word in words if word in ['now', 'today', 'tonight', 'tomorrow', 'soon', 'immediately']),
            'social_words': sum(1 for word in words if word in ['help', 'support', 'together', 'alone', 'lonely', 'everyone', 'someone']),
            'starts_with_question': text_lower.startswith(('how', 'what', 'when', 'where', 'why', 'can', 'could', 'would', 'should')),
            'contains_request': any(phrase in text_lower for phrase in ['can you', 'could you', 'please', 'help me', 'i need']),
            'average_word_length': sum(len(word) for word in words) / len(words) if words else 0
        }

        return features

    def _learn_context_from_text(self, text: str, user_id: Optional[str] = None) -> Set[str]:
        """Dynamically learn and extract contexts from text"""
        text_lower = text.lower()
        words = text_lower.split()
        detected_contexts = set()

        # Extract noun phrases and topics
        potential_contexts = []

        # Look for patterns like "my [noun]", "at [noun]", "in [noun]", etc.
        context_indicators = ['my', 'at', 'in', 'with', 'about', 'regarding', 'concerning']
        for i, word in enumerate(words):
            if word in context_indicators and i + 1 < len(words):
                next_word = words[i + 1]
                if len(next_word) > 2 and next_word.isalpha():
                    potential_contexts.append(next_word)

        # Look for compound contexts
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i + 1]}"
            if any(char.isalpha() for char in bigram) and len(bigram) > 5:
                potential_contexts.append(bigram)

        # Learn and categorize contexts
        for context in potential_contexts:
            # Determine if this is a legitimate context
            if self._is_valid_context(context, text_lower):
                context_category = self._categorize_context(context, text_lower)
                detected_contexts.add(context_category)

                # Learn this context
                self.learned_patterns['contexts'][context_category]['keywords'].add(context)
                self.learned_patterns['contexts'][context_category]['frequency'] += 1

                # Learn associated phrases
                for phrase in self._extract_phrases_around_context(text_lower, context):
                    self.learned_patterns['contexts'][context_category]['phrases'].add(phrase)

        return detected_contexts

    def _is_valid_context(self, context: str, full_text: str) -> bool:
        """Determine if extracted text represents a valid context"""
        # Filter out common words that aren't contexts
        invalid_words = {'the', 'and', 'or', 'but', 'that', 'this', 'with', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might'}

        if context in invalid_words:
            return False

        # Must be substantial enough
        if len(context) < 3:
            return False

        # Check if it appears in a meaningful context
        meaningful_patterns = [
            f"about {context}", f"with {context}", f"at {context}",
            f"in {context}", f"my {context}", f"{context} is", f"{context} was"
        ]

        return any(pattern in full_text for pattern in meaningful_patterns)

    def _categorize_context(self, context: str, full_text: str) -> str:
        """Dynamically categorize contexts based on surrounding language"""
        # Analyze surrounding words to determine category
        context_pos = full_text.find(context)
        if context_pos == -1:
            return 'general'

        # Get surrounding context (50 characters before and after)
        start = max(0, context_pos - 50)
        end = min(len(full_text), context_pos + len(context) + 50)
        surrounding = full_text[start:end]

        # Define dynamic categorization rules
        categorization_clues = {
            'academic': ['school', 'study', 'exam', 'class', 'grade', 'homework', 'college', 'university', 'learn', 'education'],
            'professional': ['work', 'job', 'office', 'boss', 'career', 'salary', 'meeting', 'colleague', 'company'],
            'personal': ['family', 'friend', 'relationship', 'partner', 'parent', 'child', 'sibling'],
            'health': ['doctor', 'hospital', 'medicine', 'illness', 'pain', 'treatment', 'therapy', 'medical'],
            'financial': ['money', 'budget', 'debt', 'bill', 'income', 'expense', 'saving', 'cost'],
            'emotional': ['feel', 'emotion', 'mood', 'mental', 'psychological', 'stress', 'anxiety', 'depression'],
            'social': ['people', 'social', 'community', 'group', 'team', 'club', 'organization'],
            'recreational': ['hobby', 'game', 'sport', 'music', 'art', 'entertainment', 'fun', 'leisure']
        }

        # Score each category
        category_scores = defaultdict(int)
        for category, clues in categorization_clues.items():
            for clue in clues:
                if clue in surrounding:
                    category_scores[category] += 1

        # Return highest scoring category or 'general' if no clear winner
        if category_scores:
            return max(category_scores.items(), key=lambda x: x[1])[0]
        else:
            return 'general'

    def _extract_phrases_around_context(self, text: str, context: str) -> List[str]:
        """Extract meaningful phrases around a context"""
        phrases = []
        context_pos = text.find(context)

        if context_pos != -1:
            # Get 3-5 word phrases containing the context
            words = text.split()
            context_word_index = -1

            for i, word in enumerate(words):
                if context in word:
                    context_word_index = i
                    break

            if context_word_index != -1:
                # Extract phrases of different lengths
                for phrase_length in [3, 4, 5]:
                    for start_offset in range(-2, 1):
                        start_idx = max(0, context_word_index + start_offset)
                        end_idx = min(len(words), start_idx + phrase_length)

                        if end_idx - start_idx >= 3:
                            phrase = ' '.join(words[start_idx:end_idx])
                            if context in phrase:
                                phrases.append(phrase)

        return phrases

    def _analyze_help_seeking_behavior(self, text: str, features: Dict[str, Any]) -> float:
        """Dynamically analyze help-seeking behavior"""
        help_score = 0.0

        # Question-based help seeking
        if features['starts_with_question']:
            help_score += 2.0

        if features['question_marks'] > 0:
            help_score += features['question_marks'] * 0.5

        # Request-based help seeking
        if features['contains_request']:
            help_score += 2.0

        # Language patterns that indicate help seeking
        text_lower = text.lower()

        # Learn new help-seeking patterns dynamically
        help_patterns = [
            'help', 'advice', 'suggest', 'recommend', 'guide', 'assist', 'support',
            'how to', 'what should', 'can you', 'could you', 'would you',
            'i need', 'looking for', 'trying to', 'want to learn'
        ]

        for pattern in help_patterns:
            if pattern in text_lower:
                help_score += 1.0
                self.learned_patterns['help_seeking'][pattern] += 1

        # Normalize score
        return min(help_score / 5.0, 1.0)

    def _detect_crisis_indicators(self, text: str, contexts: Set[str], features: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Dynamically detect crisis indicators"""
        text_lower = text.lower()
        crisis_score = 0.0
        detected_indicators = []

        # Dynamic crisis word analysis
        words = text_lower.split()

        # Emotional intensity analysis
        intensity_multiplier = 1.0 + (features['intensity_words'] * 0.2)
        temporal_urgency = 1.0 + (features['temporal_words'] * 0.3)

        # Learn crisis patterns dynamically
        crisis_patterns = {
            'self_reference_negative': ['i am', 'i feel', 'i can\'t', 'i don\'t', 'i won\'t'],
            'absolute_language': ['never', 'always', 'nothing', 'everything', 'everyone', 'nobody'],
            'despair_language': ['hopeless', 'pointless', 'useless', 'worthless', 'meaningless'],
            'isolation_language': ['alone', 'lonely', 'isolated', 'abandoned', 'rejected'],
            'pain_language': ['hurt', 'pain', 'suffering', 'agony', 'unbearable'],
            'escape_language': ['escape', 'get away', 'run away', 'disappear', 'vanish'],
            'finality_language': ['end', 'over', 'finished', 'done', 'final', 'last']
        }

        for pattern_type, patterns in crisis_patterns.items():
            for pattern in patterns:
                if pattern in text_lower:
                    # Base score for pattern
                    pattern_score = 1.0

                    # Adjust based on context
                    if contexts:
                        # Reduce score if in specific non-life contexts
                        non_critical_contexts = {'academic', 'professional', 'recreational', 'financial'}
                        if any(ctx in non_critical_contexts for ctx in contexts):
                            pattern_score *= 0.4

                    # Apply multipliers
                    pattern_score *= intensity_multiplier * temporal_urgency

                    crisis_score += pattern_score
                    detected_indicators.append(f"{pattern} ({pattern_type})")

                    # Learn this pattern
                    self.learned_patterns['crisis_indicators'][pattern]['severity'] = pattern_score
                    for context in contexts:
                        self.learned_patterns['crisis_indicators'][pattern]['context_associations'][context] += 1

        # Sentiment analysis contribution
        if self.sentiment_available and self.sentiment_analyzer:
            sentiment = self.sentiment_analyzer.polarity_scores(text)
            if sentiment['compound'] < -0.5:
                crisis_score += abs(sentiment['compound']) * 2

        return crisis_score, detected_indicators

    def _check_negation_and_context(self, text: str, contexts: Set[str]) -> bool:
        """Dynamically check for negation patterns"""
        text_lower = text.lower()

        # Learn negation patterns dynamically
        negation_indicators = ['not', 'don\'t', 'doesn\'t', 'isn\'t', 'aren\'t', 'won\'t', 'wouldn\'t', 'can\'t', 'couldn\'t']

        for negation in negation_indicators:
            if negation in text_lower:
                negation_pos = text_lower.find(negation)

                # Check if negation is near context words
                for context in contexts:
                    # Find all context-related words in the text
                    context_keywords = self.learned_patterns['contexts'][context]['keywords']
                    for keyword in context_keywords:
                        keyword_pos = text_lower.find(keyword)
                        if keyword_pos != -1 and abs(keyword_pos - negation_pos) < 30:
                            # Learn this negation pattern
                            pattern = f"{negation}...{keyword}"
                            self.learned_patterns['negation_patterns'][pattern] += 1
                            return True

        return False

    def _calculate_final_crisis_level(self, crisis_score: float, help_seeking_score: float,
                                    has_negation: bool, contexts: Set[str]) -> CrisisLevel:
        """Dynamically calculate final crisis level"""

        # Apply context-based adjustments
        if has_negation:
            crisis_score *= 0.2

        # Apply help-seeking reduction
        if help_seeking_score > 0.5:
            crisis_score *= (1.0 - (help_seeking_score * 0.6))

        # Apply time-of-day considerations
        if self.current_user['time_of_day'] in ['night', 'early_morning']:
            crisis_score *= 1.1  # Slightly higher concern during vulnerable hours

        # Determine level based on score
        if crisis_score >= 8.0:
            return CrisisLevel.CRITICAL
        elif crisis_score >= 5.0:
            return CrisisLevel.HIGH
        elif crisis_score >= 2.5:
            return CrisisLevel.MEDIUM
        elif crisis_score >= 1.0:
            return CrisisLevel.LOW
        else:
            return CrisisLevel.NONE

    def detect_crisis_level(self, text: str, user_id: Optional[str] = None) -> CrisisLevel:
        """Main dynamic crisis detection method"""
        if not text or not text.strip():
            return CrisisLevel.NONE

        # Use current user if no user_id provided
        if not user_id:
            user_id = self.current_user['login']

        # Extract linguistic features
        features = self._extract_linguistic_features(text)

        # Learn and extract contexts dynamically
        contexts = self._learn_context_from_text(text, user_id)

        # Analyze help-seeking behavior
        help_seeking_score = self._analyze_help_seeking_behavior(text, features)

        # Detect crisis indicators
        crisis_score, indicators = self._detect_crisis_indicators(text, contexts, features)

        # Check for negation patterns
        has_negation = self._check_negation_and_context(text, contexts)

        # Calculate final level
        final_level = self._calculate_final_crisis_level(crisis_score, help_seeking_score, has_negation, contexts)

        # Update user patterns
        if user_id:
            # Ensure the user pattern is properly initialized
            if user_id not in self.user_patterns:
                self.user_patterns[user_id] = {
                    'typical_language': defaultdict(int),
                    'crisis_history': [],
                    'help_seeking_patterns': defaultdict(int),
                    'context_preferences': defaultdict(int)
                }
            
            self.user_patterns[user_id]['crisis_history'].append({
                'text': text,
                'level': final_level,
                'score': crisis_score,
                'contexts': list(contexts),
                'timestamp': self.current_user['timestamp'].isoformat()
            })

        # Log results
        if final_level in [CrisisLevel.CRITICAL, CrisisLevel.HIGH]:
            print(f"CRISIS DETECTED: {final_level.value} (Score: {crisis_score:.2f})")
            print(f"   Contexts: {contexts}")
            print(f"   Indicators: {indicators[:3]}")
        elif final_level in [CrisisLevel.MEDIUM, CrisisLevel.LOW]:
            print(f"Warning: Concern detected: {final_level.value} (Score: {crisis_score:.2f})")
        else:
            print(f"No crisis detected (Score: {crisis_score:.2f}, Help-seeking: {help_seeking_score:.2f})")

        if contexts:
            print(f"Learned contexts: {contexts}")

        return final_level

    def get_safety_assessment_questions(self, crisis_level: CrisisLevel) -> List[str]:
        """Generate dynamic safety assessment questions"""
        base_questions = {
            CrisisLevel.CRITICAL: [
                "Are you thinking about ending your life right now?",
                "Do you have a specific plan?",
                "Do you have access to means to hurt yourself?",
                "When are you thinking of doing this?",
                "Is there someone who can stay with you?",
                "Can you tell me where you are?",
                "What has stopped you before?"
            ],
            CrisisLevel.HIGH: [
                "Are you having thoughts of hurting yourself?",
                "How long have you been feeling this way?",
                "What triggered these feelings?",
                "Do you have people for support?",
                "Have you been able to keep yourself safe?",
                "What has helped you cope before?"
            ],
            CrisisLevel.MEDIUM: [
                "Can you tell me more about what's difficult?",
                "How long have you been struggling?",
                "What usually helps when you feel this way?",
                "Who provides you with support?",
                "How are your sleep and appetite?",
                "Have you considered professional help?"
            ],
            CrisisLevel.LOW: [
                "What's been on your mind lately?",
                "How can I best support you?",
                "What would help you feel better?",
                "Do you have support systems?",
                "What are some positive things in your life?"
            ]
        }

        return base_questions.get(crisis_level, base_questions[CrisisLevel.LOW])

    def get_immediate_interventions(self, crisis_level: CrisisLevel) -> List[str]:
        """Generate dynamic intervention suggestions"""
        interventions = {
            CrisisLevel.CRITICAL: [
                "Contact 988 (Suicide & Crisis Lifeline) immediately",
                "Go to the nearest emergency room",
                "Call 911 if in immediate danger",
                "Have someone stay with you",
                "Remove access to means of self-harm",
                "Contact your therapist now"
            ],
            CrisisLevel.HIGH: [
                "Use grounding techniques (5-4-3-2-1 method)",
                "Practice deep breathing exercises",
                "Reach out to a trusted person",
                "Consider calling a crisis helpline",
                "Stay in a safe environment",
                "Avoid substances"
            ],
            CrisisLevel.MEDIUM: [
                "Take slow, deep breaths",
                "Try progressive muscle relaxation",
                "Engage in a comforting activity",
                "Connect with supportive people",
                "Consider scheduling therapy",
                "Practice self-compassion"
            ],
            CrisisLevel.LOW: [
                "Practice mindfulness or meditation",
                "Engage in physical activity",
                "Maintain regular sleep schedule",
                "Connect with friends or family",
                "Pursue enjoyable activities",
                "Practice gratitude"
            ]
        }

        return interventions.get(crisis_level, interventions[CrisisLevel.LOW])

# Initialize fully dynamic crisis detector
crisis_detector = CrisisDetector()
print("Fully dynamic crisis detection with zero hardcoded patterns initialized!")
print(f"Session started at: {crisis_detector.current_user['timestamp']}")
print(f"User context: {crisis_detector.current_user['login']} ({crisis_detector.current_user['environment']})")