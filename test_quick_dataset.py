#!/usr/bin/env python3
"""
FLUENTI: Quick Dataset Test
Simple test for GoEmotions dataset with emotion analysis
"""

import time
print("🧪 FLUENTI: Quick Dataset Test")

start_time = time.time()

from datasets import load_dataset

# Load GoEmotions dataset (cached after first run)
dataset = load_dataset("go_emotions", split="train[:100]")  # Load only first 100 samples for speed

load_time = time.time() - start_time

print(f"✅ GoEmotions loaded: {len(dataset)} samples in {load_time:.2f}s")

# Show emotion labels mapping
emotion_names = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring", 
    "confusion", "curiosity", "desire", "disappointment", "disapproval", 
    "disgust", "embarrassment", "excitement", "fear", "gratitude", 
    "grief", "joy", "love", "nervousness", "optimism", "pride", 
    "realization", "relief", "remorse", "sadness", "surprise", "neutral"
]

print(f"\n🎭 GoEmotions has {len(emotion_names)} emotion categories:")
for i, emotion in enumerate(emotion_names[:10]):  # Show first 10
    print(f"   {i}: {emotion}")
print(f"   ... and {len(emotion_names)-10} more")

# Show sample
sample = dataset[0]
emotion_id = sample['labels'][0]
emotion_name = emotion_names[emotion_id] if emotion_id < len(emotion_names) else "unknown"

print(f"\n📝 Sample text: \"{sample['text'][:50]}...\"")
print(f"🎭 Detected emotion: {emotion_name} (ID: {emotion_id})")

print(f"\n✅ Dataset ready for FLUENTI emotion detection!")
