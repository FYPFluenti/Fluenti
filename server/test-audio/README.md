# Test Audio Directory

This directory contains sample audio files for testing the STT implementation.

## Test Files Needed:
1. `test-english.wav` - English speech sample
2. `test-urdu.wav` - Urdu speech sample
3. `clean-audio-en.wav` - High-quality English audio for accuracy testing
4. `noisy-audio-ur.wav` - Lower-quality Urdu audio for robustness testing

## Recommended Sources:
- **Mozilla Common Voice**: https://commonvoice.mozilla.org/en/datasets
  - Download Urdu dataset for authentic Urdu pronunciation tests
  - Download English dataset for comparison tests

## Audio Requirements:
- Format: WAV (16kHz, mono preferred)
- Duration: 3-10 seconds for quick testing
- Content: Simple emotional expressions like "I feel stressed" or "مجھے تناؤ محسوس ہو رہا ہے"

## Usage:
```bash
# Run STT test with sample files
npx tsx server/test-stt.ts
```
