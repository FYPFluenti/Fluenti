import logging
import time
import re
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Union
import random

from datasets import load_dataset, Dataset, DatasetDict, IterableDataset, IterableDatasetDict
import nltk

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Import common utilities
from utils.env_manager import get_api_key
from utils.user_context import get_user_context
from utils.error_handler import safe_execute, log_error

# Configure Hugging Face authentication using utilities
hf_token = get_api_key('huggingface', required=False)
if hf_token:
    # Set the token for huggingface_hub
    try:
        from huggingface_hub import login
        login(token=hf_token)
        print("✅ Successfully authenticated with Hugging Face Hub")
    except Exception as e:
        log_error(e, "Hugging Face Hub authentication")
else:
    print("⚠️ Warning: No Hugging Face API key found in environment variables")

# Download required NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('punkt', quiet=True)
    from nltk.sentiment import SentimentIntensityAnalyzer
    print("✅ NLTK sentiment analyzer ready")
except:
    print("⚠️ NLTK not available, using basic sentiment analysis")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get current user context using utilities
current_user = get_user_context()

class DataLoader:
    """Enhanced mental health data loader with focused, efficient datasets"""

    @staticmethod
    def _get_dataset_length(dataset: Union[Dataset, DatasetDict, IterableDataset, IterableDatasetDict]) -> Union[int, str]:
        """Safely get dataset length, handling IterableDataset types"""
        try:
            # For Dataset objects that have __len__
            if isinstance(dataset, Dataset) and hasattr(dataset, '__len__'):
                return len(dataset)
            # For DatasetDict objects, get total across all splits
            elif isinstance(dataset, DatasetDict):
                total = 0
                for split_dataset in dataset.values():
                    if hasattr(split_dataset, '__len__'):
                        total += len(split_dataset)
                return total if total > 0 else "unknown"
            # For objects with num_rows attribute (using getattr for safety)
            elif hasattr(dataset, 'num_rows'):
                num_rows = getattr(dataset, 'num_rows', None)
                if isinstance(num_rows, int):
                    return num_rows
                else:
                    return "unknown"
            else:
                return "unknown"
        except Exception:
            return "unknown"

    @staticmethod
    def load_mental_health_datasets():
        """Load multiple mental health datasets from Hugging Face - optimized for speed"""
        datasets = []
        
        # Get HF token for authenticated requests
        hf_token = get_api_key('huggingface', required=False)
        
     
        try:
            print("Loading focused mental health datasets...")

            # Dataset 1: Mental health counseling conversations (KEEP - working well)
            try:
                print("Loading counseling conversations dataset...")
                dataset1 = load_dataset("Amod/mental_health_counseling_conversations", split='train', token=hf_token)
                datasets.append(dataset1)
                dataset1_len = DataLoader._get_dataset_length(dataset1)
                print(f"Loaded {dataset1_len} counseling conversations")
            except Exception as e:
                print(f"Warning: Could not load counseling dataset: {e}")

            # Dataset 2: Mental health chatbot dataset (KEEP - working well)
            try:
                print("Loading mental health chatbot dataset...")
                dataset2 = load_dataset("heliosbrahma/mental_health_chatbot_dataset", split='train', token=hf_token)
                datasets.append(dataset2)
                print(f"Loaded {DataLoader._get_dataset_length(dataset2)} chatbot conversations")
            except Exception as e:
                print(f"Warning: Could not load chatbot dataset: {e}")

            # Dataset 3: Counsel Chat - Therapy conversations (KEEP - working well)
            try:
                print("Loading counsel chat therapy dataset...")
                dataset3 = load_dataset("nbertagnolli/counsel-chat", split='train', token=hf_token)
                datasets.append(dataset3)
                print(f"Loaded {DataLoader._get_dataset_length(dataset3)} counsel chat conversations")
            except Exception as e:
                print(f"Warning: Could not load counsel chat dataset: {e}")

            # Dataset 4: Mental health conversations - Alternative smaller dataset
            try:
                print("Loading focused mental health conversations...")
                dataset4 = load_dataset("Amod/mental_health_counseling_conversations", split='train[:1000]', token=hf_token)  # Limit to 1000
                datasets.append(dataset4)
                print(f"Loaded {DataLoader._get_dataset_length(dataset4)} additional conversations")
            except Exception as e:
                print(f"Warning: Could not load additional conversations: {e}")

            # Dataset 5: Skip problematic mental health_dataset 
            # (This dataset doesn't exist on the Hub)
            print("Skipping mental_health_dataset (not available)")

            # Dataset 6: Skip ultrachat_200k (too large, causing timeouts)
            print("Skipping HuggingFaceH4/ultrachat_200k (too large)")

            # Dataset 7: Skip nvidia/HelpSteer (too large)
            print("Skipping nvidia/HelpSteer (too large)")

            # Dataset 8: Use a smaller, more reliable Q&A dataset
            try:
                print("Loading mental health Q&A dataset...")
                dataset8 = load_dataset("squad_v2", split='train[:1000]', token=hf_token)  # Much smaller size
                datasets.append(dataset8)
                print(f"Loaded {DataLoader._get_dataset_length(dataset8)} Q&A examples")
            except Exception as e:
                print(f"Warning: Could not load Q&A dataset: {e}")

            # Dataset 9: Skip daily_dialog (deprecated)
            print("Skipping daily_dialog (deprecated dataset scripts)")

            # Dataset 10: Mental health classification dataset (working well)
            try:
                print("Loading mental health classification dataset...")
                dataset10 = load_dataset("emotion", split='train[:2000]', token=hf_token)  # Limited size
                datasets.append(dataset10)
                print(f"Loaded {DataLoader._get_dataset_length(dataset10)} emotion classification examples")
            except Exception as e:
                print(f"Warning: Could not load emotion dataset: {e}")

            # Additional working datasets
            try:
                print("Loading GoEmotions dataset...")
                dataset11 = load_dataset("go_emotions", split='train[:1000]', token=hf_token)
                datasets.append(dataset11)
                print(f"Loaded {DataLoader._get_dataset_length(dataset11)} emotion examples")
            except Exception as e:
                print(f"Warning: Could not load GoEmotions dataset: {e}")

            if datasets:
                # Calculate total entries, excluding unknown lengths
                total_entries = 0
                known_count = 0
                for dataset in datasets:
                    length = DataLoader._get_dataset_length(dataset)
                    if isinstance(length, int):
                        total_entries += length
                        known_count += 1
                
                if known_count > 0:
                    print(f"Successfully loaded {len(datasets)} datasets with {total_entries} total entries ({known_count} datasets with known sizes)")
                else:
                    print(f"Successfully loaded {len(datasets)} datasets")
                print("Optimized for speed and mental health relevance!")
                return datasets
            else:
                print("Warning: No datasets loaded, using enhanced fallback data")
                return DataLoader._create_enhanced_therapeutic_data()

        except Exception as e:
            print(f"Error loading datasets: {e}")
            return DataLoader._create_enhanced_therapeutic_data()

    @staticmethod
    def _create_enhanced_therapeutic_data():
        """Create comprehensive therapeutic conversations as fallback"""
        therapeutic_conversations = [
            # CBT Techniques - Enhanced
            {
                "text": "Cognitive Behavioral Therapy (CBT) focuses on identifying and changing negative thought patterns. The cognitive triangle shows how thoughts, feelings, and behaviors are interconnected. When you change one, the others follow. Common cognitive distortions include all-or-nothing thinking, catastrophizing, mind reading, and fortune telling. Challenge these by asking: What evidence supports this thought? What would I tell a friend? What's a more balanced perspective?"
            },
            {
                "text": "CBT thought challenging techniques: 1) Identify the triggering situation, 2) Notice emotions and rate intensity 1-10, 3) Write down automatic thoughts, 4) Identify thinking errors, 5) Examine evidence for/against, 6) Create balanced thoughts, 7) Notice emotional changes. Practice this daily to rewire negative thinking patterns and improve emotional regulation."
            },
            {
                "text": "Behavioral activation for depression involves scheduling activities that bring mastery (accomplishment) and pleasure. Start with small, achievable tasks. Rate activities 1-10 for pleasure and mastery. Gradually increase challenging activities. The goal is to break the cycle of depression where low mood leads to inactivity, which worsens mood."
            },

            # DBT Skills - Enhanced
            {
                "text": "Dialectical Behavior Therapy (DBT) teaches four core modules: Mindfulness (being present), Distress Tolerance (crisis survival), Emotion Regulation (understanding and managing emotions), and Interpersonal Effectiveness (healthy relationships). These skills help with emotional intensity, self-harm urges, and relationship difficulties."
            },
            {
                "text": "DBT TIPP skills for crisis moments: Temperature (cold water on face/hands, ice cubes), Intense exercise (jumping jacks, running), Paced breathing (slower exhale than inhale), Paired muscle relaxation (tense and release). These change body chemistry quickly to reduce crisis urges."
            },
            {
                "text": "DBT emotion regulation skills: PLEASE (treat Physical illness, balance Eating, avoid mood-Altering substances, balance Sleep, get Exercise), opposite action (act opposite to emotion's urge), and mastery activities (build confidence). Understanding emotions: they have causes, serve functions, and will pass."
            },

            # Mindfulness and Grounding - Enhanced
            {
                "text": "Mindfulness is about being present without judgment. The RAIN technique: Recognize what's happening, Allow the experience, Investigate with kindness, Natural awareness (not identifying with the experience). This helps with anxiety, depression, and emotional overwhelm by creating space between you and difficult experiences."
            },
            {
                "text": "Grounding techniques for anxiety and trauma: 5-4-3-2-1 (5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste), progressive muscle relaxation, box breathing (4-4-4-4 count), holding ice cubes, naming objects in the room. These activate the parasympathetic nervous system and bring you to the present."
            },
            {
                "text": "Body-based mindfulness: Body scan meditation, mindful movement, noticing breath sensations, feeling feet on ground. These help when thoughts are overwhelming or when experiencing dissociation. The body is always in the present moment and can anchor awareness."
            },

            # Crisis Intervention - Enhanced
            {
                "text": "Suicide risk assessment looks at: Ideation (thoughts), Plan (specific method), Means (access to method), Intent (desire to die), Timeline (when), Protective factors (reasons to live, support system), Previous attempts, Mental state, Substance use. High risk requires immediate professional intervention."
            },
            {
                "text": "Safety planning involves: 1) Warning signs recognition, 2) Internal coping strategies, 3) Social contacts for distraction, 4) Family/friends for help, 5) Professional contacts, 6) Environmental safety (remove means), 7) Reasons for living. This should be written, accessible, and reviewed regularly with a professional."
            },
            {
                "text": "Crisis de-escalation techniques: Remain calm and non-judgmental, listen actively, validate feelings, ask open-ended questions, avoid arguing with delusions/paranoia, give choices when possible, speak slowly and clearly, maintain safe distance, assess for immediate danger. Focus on emotional support before problem-solving."
            },

            # Trauma-Informed Care - Enhanced
            {
                "text": "Trauma-informed care recognizes that trauma is common and affects the brain, body, and behavior. The 4 R's: Realization (awareness of trauma's impact), Recognition (identifying trauma symptoms), Response (changing practices to be trauma-sensitive), and Resistance to re-traumatization. This approach emphasizes safety, trustworthiness, collaboration, and cultural humility."
            },
            {
                "text": "Trauma responses include fight (anger, aggression), flight (anxiety, avoidance), freeze (numbness, dissociation), and fawn (people-pleasing, compliance). These are survival mechanisms, not character flaws. Healing involves understanding these responses, building safety, and developing new coping skills."
            },
            {
                "text": "Window of tolerance describes the zone where you can handle stress effectively. Trauma can cause hyperarousal (anxiety, panic, rage) or hypoarousal (numbness, depression, disconnection). Therapy helps expand this window through grounding, breathing, movement, and gradual exposure to triggers in a safe environment."
            },

            # Anxiety Management - Enhanced
            {
                "text": "Anxiety disorders respond well to exposure therapy, cognitive restructuring, and relaxation techniques. Common types include generalized anxiety (excessive worry), panic disorder (sudden intense fear), social anxiety (fear of judgment), and specific phobias. Treatment involves gradual, controlled exposure to feared situations while learning coping skills."
            },
            {
                "text": "Panic attack management: Remember they peak in 10 minutes and aren't dangerous. Use 4-7-8 breathing (inhale 4, hold 7, exhale 8), grounding techniques, positive self-talk ('This will pass', 'I am safe'), and avoid avoidance behaviors that reinforce fear. Caffeine, lack of sleep, and stress can trigger attacks."
            },
            {
                "text": "Worry time technique: Set aside 15-20 minutes daily for worrying. When anxious thoughts arise, write them down and say 'I'll think about this during worry time.' During worry time, categorize concerns as solvable (make action plans) or unsolvable (practice acceptance). This contains anxiety and reduces rumination."
            },

            # Depression Support - Enhanced
            {
                "text": "Depression involves changes in mood, thinking, behavior, and physical symptoms. It's not weakness or laziness—it's a medical condition. Treatment includes therapy, medication, lifestyle changes, and social support. Recovery is possible with appropriate help. Symptoms include persistent sadness, loss of interest, fatigue, concentration problems, and sleep changes."
            },
            {
                "text": "Combating depression: Maintain routines, get sunlight exposure, exercise regularly (even 10 minutes helps), connect with others, practice gratitude, limit alcohol, eat regularly, engage in meaningful activities. Small steps count. Progress isn't linear—expect ups and downs."
            },
            {
                "text": "Suicidal thoughts in depression are symptoms, not reality. They indicate pain, not actual desire to die. Create a crisis plan, remove means of self-harm, reach out for support, use helplines, go to emergency rooms if needed. Thoughts and feelings change—permanent solutions to temporary problems aren't necessary."
            },

            # Relationship and Communication - Enhanced
            {
                "text": "Healthy relationships involve mutual respect, trust, communication, boundaries, and support. Warning signs of unhealthy relationships: controlling behavior, isolation from friends/family, emotional/physical abuse, extreme jealousy, manipulation. Everyone deserves relationships that feel safe and supportive."
            },
            {
                "text": "Assertiveness skills: Use 'I' statements, be specific about needs, listen to others' perspectives, stay calm, be willing to compromise. The difference between passive (not expressing needs), aggressive (violating others' rights), and assertive (respectful self-advocacy). Practice saying no without guilt."
            },
            {
                "text": "Conflict resolution: Address issues early, focus on specific behaviors not character, listen to understand not to win, find common ground, be willing to apologize when wrong, seek win-win solutions. Healthy conflict can strengthen relationships when handled respectfully."
            },

            # Self-Care and Wellness - Enhanced
            {
                "text": "Self-care isn't selfish—it's necessary for mental health. Physical: exercise, nutrition, sleep, medical care. Emotional: therapy, journaling, creative expression. Social: healthy relationships, community involvement. Spiritual: meditation, nature, purpose/meaning. Intellectual: learning, reading, mental stimulation. Set boundaries and prioritize your well-being."
            },
            {
                "text": "Sleep hygiene for mental health: Consistent bedtime/wake time, cool dark room, comfortable mattress, no screens 1 hour before bed, avoid large meals/caffeine before sleep, wind-down routine, get sunlight in morning. Poor sleep worsens depression, anxiety, and emotional regulation."
            },
            {
                "text": "Stress management techniques: Deep breathing, progressive muscle relaxation, meditation, yoga, regular exercise, time in nature, social support, hobbies, limiting news/social media, time management, saying no to excessive commitments. Chronic stress affects physical and mental health."
            },

            # Professional Therapy Approaches
            {
                "text": "Types of therapy: CBT (changing thoughts/behaviors), DBT (emotional regulation), EMDR (trauma processing), psychodynamic (unconscious patterns), humanistic (self-acceptance), family therapy (relationship dynamics). Different approaches work for different people and problems. It's okay to try different therapists to find the right fit."
            },
            {
                "text": "What to expect in therapy: Initial assessment, goal setting, regular sessions (usually weekly), homework/practice between sessions, progress monitoring, eventually spacing out sessions. Therapy is collaborative—you're an active participant in your healing. Be honest with your therapist for best results."
            }
        ]

        print(f"Created {len(therapeutic_conversations)} enhanced therapeutic conversation examples")
        return therapeutic_conversations

# Load the enhanced datasets safely
try:
    datasets = DataLoader.load_mental_health_datasets()
    print("Enhanced mental health knowledge base ready!")
except Exception as e:
    print(f"Warning: Could not load datasets: {e}")
    datasets = []
    print("Using empty dataset list as fallback")