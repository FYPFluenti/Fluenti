# Therapeutic Audio Assets

This directory contains audio files used in therapeutic speech games.

## Directory Structure

```
therapeutic/
├── sounds/           # Sound effects
├── words/            # Word pronunciation samples
├── phrases/          # Phrase pronunciation samples
├── feedback/         # Feedback audio (success, encouragement, etc.)
└── background/       # Background music and ambient sounds
```

## Audio Format Guidelines

- **Format**: MP3 or WAV
- **Sample Rate**: 44.1 kHz (preferred)
- **Bit Depth**: 16-bit
- **Channels**: Mono for speech, Stereo for music
- **File Naming**: Use lowercase with underscores (e.g., `success_sound.mp3`)

## Usage

```typescript
import successSound from '@/public/audio/therapeutic/feedback/success.mp3';

const playSound = () => {
  const audio = new Audio(successSound);
  audio.play();
};
```

## Recording Guidelines for Speech Samples

1. **Environment**: Record in a quiet room with minimal echo
2. **Distance**: Keep microphone 6-8 inches from mouth
3. **Volume**: Speak at normal conversation level
4. **Clarity**: Articulate clearly without exaggeration
5. **Pace**: Speak at a moderate, natural pace

## File Organization

### Words (`words/`)
- Group by difficulty level: `easy/`, `medium/`, `hard/`
- Name by word: `cat.mp3`, `dog.mp3`, etc.

### Phrases (`phrases/`)
- Group by length: `short/`, `medium/`, `long/`
- Use descriptive names: `greeting_hello.mp3`

### Feedback (`feedback/`)
- `success_great.mp3`
- `success_excellent.mp3`
- `encourage_keep_trying.mp3`
- `encourage_almost.mp3`

## Copyright and Licensing

Ensure all audio files are either:
- Original recordings
- Royalty-free from licensed sources
- Properly attributed if required

## Size Optimization

- Keep files under 500KB when possible
- Use MP3 for compression when quality allows
- Use WAV for high-fidelity speech samples
