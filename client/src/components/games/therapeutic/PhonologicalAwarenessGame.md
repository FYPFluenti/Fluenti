# Phonological Awareness Game - Documentation

## Overview

The **Phonological Awareness Game** is an evidence-based therapeutic game designed to help children develop phonological processing skills, which are crucial for reading development and speech clarity.

## Component Details

**File:** `client/src/components/games/therapeutic/PhonologicalAwarenessGame.tsx`

**Purpose:** Interactive game that targets phonological awareness through four different task types:
1. Rhyme Detection
2. Initial Sound Identification
3. Syllable Counting
4. Sound Blending

## Game Structure

### Task Types

#### 1. Rhyme Detection
**Target Skill:** Recognizing rhyming patterns in words

**Example:**
- Present: "cat" 🐱 and "hat" 👒
- Question: "Do these words rhyme?"
- Options: Yes ✓ / No ✗

**Clinical Value:**
- Develops phonological awareness
- Foundational skill for reading
- Difficulty Level: 1 (Easiest)

#### 2. Initial Sound Identification
**Target Skill:** Identifying the first phoneme in a word

**Example:**
- Present: "ball" ⚽
- Question: "What sound does this word start with?"
- Options: b / d / p

**Clinical Value:**
- Phoneme isolation
- Sound discrimination
- Difficulty Level: 2

#### 3. Syllable Counting
**Target Skill:** Segmenting words into syllables

**Example:**
- Present: "butterfly" 🦋
- Question: "How many parts (syllables) does this word have?"
- Options: 1 / 2 / 3 / 4

**Clinical Value:**
- Phonological segmentation
- Syllable awareness
- Difficulty Level: 3

#### 4. Sound Blending
**Target Skill:** Combining individual phonemes into words

**Example:**
- Present: "c", "a", "t"
- Question: "What word do they make together?"
- Options: cat / cut / cot

**Clinical Value:**
- Phoneme synthesis
- Auditory processing
- Difficulty Level: 2

## Props Interface

```typescript
interface PhonologicalGameProps {
  onComplete: (results: any) => void;  // Callback when game finishes
  userLevel: number;                    // Current user level (1-5)
}
```

## Game States

The game progresses through four states:

1. **`instruction`** - Welcome screen with game explanation
2. **`task`** - Active gameplay, displaying current task
3. **`feedback`** - Shows result (correct/incorrect) after each response
4. **`complete`** - Final summary with statistics

## Features

### 🎵 Text-to-Speech Integration
- Uses browser's Speech Synthesis API
- Playback rate: 0.8x (slower for clarity)
- Volume: 0.8
- Helps auditory learners and reduces cognitive load

### 📊 Progress Tracking
- Visual progress bar
- Current task number display
- Percentage completion

### 🎨 Visual Design
- Large, colorful emojis for engagement
- Color-coded task types:
  - **Blue**: Rhyme Detection
  - **Purple**: Initial Sound
  - **Orange**: Syllable Counting
  - **Teal/Indigo**: Sound Blending

### ⏱️ Performance Metrics
- Reaction time tracking for each response
- Accuracy percentage calculation
- Average reaction time computation

### ✨ Animation
- Smooth transitions between states
- Framer Motion for professional animations
- Engaging feedback animations

## Results Object

When the game completes, it returns a comprehensive results object:

```typescript
{
  gameType: 'phonological_awareness',
  totalTasks: number,              // Total number of tasks (4)
  correctResponses: number,        // Number of correct answers
  accuracy: number,                // Percentage (0-100)
  avgReactionTime: number,         // Average time in milliseconds
  responses: [                     // Array of all responses
    {
      taskId: string,
      taskType: string,
      userResponse: any,
      correctAnswer: any,
      isCorrect: boolean,
      reactionTime: number,
      difficulty: number
    }
  ],
  therapeuticData: {
    phonemeAwareness: number,      // Same as accuracy
    taskTypes: string[],           // Types of tasks completed
    difficultyLevels: number[]     // Difficulty of each task
  }
}
```

## Usage Example

```typescript
import PhonologicalAwarenessGame from '@/components/games/therapeutic/PhonologicalAwarenessGame';

function TherapySession() {
  const handleGameComplete = (results: any) => {
    console.log('Game Results:', results);
    console.log(`Accuracy: ${results.accuracy}%`);
    console.log(`Average Reaction Time: ${results.avgReactionTime}ms`);
    
    // Save to database
    saveGameSession(results);
    
    // Update user progress
    updateUserProgress(results);
    
    // Show feedback to user
    showCompletionScreen(results);
  };

  return (
    <PhonologicalAwarenessGame
      onComplete={handleGameComplete}
      userLevel={currentUserLevel}
    />
  );
}
```

## Integration with Therapeutic Engine

```typescript
import { TherapeuticGameEngine } from '@/lib/therapeutic';
import { PhonologicalAwarenessGame } from '@/components/games/therapeutic';

function TherapyPage() {
  const handleComplete = (results: any) => {
    // Convert to standard format
    const responses = results.responses.map((r: any) => ({
      isCorrect: r.isCorrect,
      reactionTime: r.reactionTime
    }));

    // Calculate improvement score
    const improvementScore = TherapeuticGameEngine.calculateImprovementScore(
      'phonological',
      results.accuracy
    );

    // Update user progress
    const updatedProgress = TherapeuticGameEngine.updateUserProgress(
      currentProgress,
      {
        gameId: game.id,
        userId: user.id,
        startTime: sessionStartTime,
        endTime: new Date(),
        responses: responses,
        accuracy: results.accuracy,
        reaction_times: results.responses.map((r: any) => r.reactionTime),
        therapeutic_data: {
          category: 'phonological',
          phonemesWorked: results.therapeuticData.taskTypes,
          improvementAreas: identifyWeakAreas(results),
          strengthAreas: identifyStrongAreas(results),
          recommendations: []
        },
        completed: true
      },
      game
    );

    // Generate recommendations
    const recommendations = TherapeuticGameEngine.generateTherapeuticRecommendations(
      updatedProgress
    );

    console.log('Recommendations:', recommendations);
  };

  return (
    <PhonologicalAwarenessGame
      onComplete={handleComplete}
      userLevel={userLevel}
    />
  );
}
```

## Clinical Considerations

### Evidence-Based Practice
This game is designed based on research in phonological awareness development:

1. **Rhyme Recognition** - Foundational phonological skill (Age 3-4)
2. **Initial Sound ID** - Phoneme isolation (Age 4-5)
3. **Syllable Counting** - Syllable segmentation (Age 4-6)
4. **Sound Blending** - Phoneme synthesis (Age 5-6)

### Difficulty Progression
Tasks are ordered by developmental appropriateness and can be adapted based on `userLevel`:

- **Level 1-2**: Focus on rhyme detection and syllable counting
- **Level 3-4**: Add initial sound identification
- **Level 5+**: Include sound blending and more complex tasks

### Adaptation Strategies
Future enhancements can include:
- Adjusting number of tasks based on `userLevel`
- Adding more complex phonological tasks for advanced users
- Implementing adaptive difficulty (easier/harder based on performance)

## Accessibility Features

### Visual
- ✅ Large, clear emojis (6xl, 8xl sizes)
- ✅ High contrast colors
- ✅ Clear typography (4xl font for words)

### Auditory
- ✅ Text-to-Speech for all stimuli
- ✅ Slower speech rate for clarity
- ✅ Repeatable audio playback

### Cognitive
- ✅ Clear, simple instructions
- ✅ One task at a time
- ✅ Immediate feedback
- ✅ Progress indicators

## Performance Considerations

### Optimization
- Speech synthesis initialized only when needed
- State updates batched with `useState`
- Animations use GPU acceleration
- Minimal re-renders with `AnimatePresence`

### Browser Compatibility
- **Text-to-Speech**: Chrome, Safari, Edge (not Firefox)
- **Animations**: All modern browsers
- **Fallback**: Graceful degradation if TTS not available

## Future Enhancements

### Planned Features
1. **Adaptive Difficulty**
   - Adjust task complexity based on real-time performance
   - Skip easier tasks if user demonstrates mastery

2. **Audio Recording**
   - Record user's verbal responses
   - Analyze pronunciation accuracy

3. **More Task Types**
   - Phoneme segmentation
   - Rhyme generation
   - Sound manipulation

4. **Progress Persistence**
   - Save game state to continue later
   - Track progress over time

5. **Multiplayer Mode**
   - Practice with peers
   - Cooperative sound blending

### Customization Options
- Custom word lists
- Therapist-selected phonemes
- Cultural/linguistic adaptations

## Testing Recommendations

### Unit Tests
```typescript
// Test task rendering
test('renders rhyme detection task correctly', () => {
  const { getByText } = render(<PhonologicalAwarenessGame />);
  expect(getByText(/Do these words rhyme/i)).toBeInTheDocument();
});

// Test response handling
test('handles correct response correctly', () => {
  const onComplete = jest.fn();
  const { getByText } = render(
    <PhonologicalAwarenessGame onComplete={onComplete} userLevel={1} />
  );
  // Simulate correct answer
  fireEvent.click(getByText('Yes, they rhyme!'));
  // Assert feedback shown
});
```

### Integration Tests
- Test full game flow (instruction → task → feedback → complete)
- Test `onComplete` callback with correct results structure
- Test audio playback functionality

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios

## Troubleshooting

### Common Issues

**Issue: Text-to-Speech not working**
- **Cause**: Browser doesn't support Speech Synthesis API
- **Solution**: Check browser compatibility, provide visual-only fallback

**Issue: Animations laggy**
- **Cause**: Low-end device or many background processes
- **Solution**: Reduce animation complexity, use `will-change` CSS property

**Issue: Progress bar not updating**
- **Cause**: State update timing issue
- **Solution**: Ensure `currentTaskIndex` updates before progress calculation

## Related Components

- **ArticulationGame** - Focuses on speech sound production
- **FluencyGame** - Targets smooth, effortless speech
- **LanguageComprehensionGame** - Develops vocabulary and grammar

## API Reference

### Methods

#### `handleResponse(response: any): void`
Processes user's answer and moves to feedback state

#### `completeGame(): void`
Calculates final results and calls `onComplete` callback

#### `playAudio(text: string): void`
Uses Speech Synthesis API to speak text aloud

#### `renderTask(): JSX.Element | null`
Renders the current task based on task type

## Support

For questions or issues:
- See main documentation: `THERAPEUTIC_GAMES_STRUCTURE.md`
- Utility functions: `client/src/lib/therapeutic/GAME_UTILS_DOCUMENTATION.md`
- Type definitions: `client/src/types/games/THERAPEUTIC_TYPES.md`

---

**Version:** 1.0.0  
**Last Updated:** October 6, 2025  
**Status:** ✅ Production Ready
