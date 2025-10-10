# Therapeutic Game Types Documentation

This document explains the type definitions for therapeutic games in the Fluenti speech therapy application.

## Core Types

### `TherapeuticGame`

Defines the structure of a therapeutic game with clinical and educational metadata.

```typescript
interface TherapeuticGame {
  id: number;
  title: string;
  description: string;
  category: 'articulation' | 'phonological' | 'fluency' | 'language' | 'pragmatic' | 'sensory';
  targetAudience: 'autism' | 'speech-delay' | 'apraxia' | 'stuttering' | 'all';
  evidenceLevel: 'research-backed' | 'clinical-proven' | 'expert-recommended';
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: string;
  unlocked: boolean;
  therapeutic_goals: string[];
  age_range: string;
  icon: string;
  color: string;
  game_type: 'interactive' | 'visual-sequence' | 'auditory-processing' | 'social-communication';
}
```

#### Categories

- **`articulation`** - Speech sound production and clarity
- **`phonological`** - Sound patterns and phonemic awareness
- **`fluency`** - Smooth, effortless speech flow
- **`language`** - Vocabulary, grammar, and comprehension
- **`pragmatic`** - Social communication and language use
- **`sensory`** - Sensory integration and regulation

#### Target Audiences

- **`autism`** - Autism Spectrum Disorder
- **`speech-delay`** - General speech and language delays
- **`apraxia`** - Childhood Apraxia of Speech (CAS)
- **`stuttering`** - Fluency disorders
- **`all`** - General population

#### Evidence Levels

- **`research-backed`** - Supported by peer-reviewed research
- **`clinical-proven`** - Proven effective in clinical practice
- **`expert-recommended`** - Recommended by speech-language pathologists

#### Game Types

- **`interactive`** - Real-time user interaction with speech recognition
- **`visual-sequence`** - Visual memory and sequencing tasks
- **`auditory-processing`** - Sound discrimination and processing
- **`social-communication`** - Social skills and pragmatic language

### `GameSession`

Tracks a single game session with therapeutic data.

```typescript
interface GameSession {
  gameId: number;
  userId: string;
  startTime: Date;
  endTime?: Date;
  responses: GameResponse[];
  accuracy: number;
  reaction_times: number[];
  therapeutic_data: TherapeuticData;
  completed: boolean;
}
```

**Usage:**
```typescript
const session: GameSession = {
  gameId: 1,
  userId: "user123",
  startTime: new Date(),
  responses: [],
  accuracy: 0,
  reaction_times: [],
  therapeutic_data: {
    category: 'articulation',
    phonemesWorked: ['/k/', '/g/'],
    improvementAreas: ['final consonants'],
    strengthAreas: ['initial sounds'],
    recommendations: ['Continue practicing /k/ in final position']
  },
  completed: false
};
```

### `GameResponse`

Records individual user responses within a session.

```typescript
interface GameResponse {
  questionId: string;
  userResponse: any;
  correctResponse: any;
  isCorrect: boolean;
  reactionTime: number;
  timestamp: Date;
}
```

**Example:**
```typescript
const response: GameResponse = {
  questionId: "q1_cat",
  userResponse: "cat",
  correctResponse: "cat",
  isCorrect: true,
  reactionTime: 1500, // milliseconds
  timestamp: new Date()
};
```

### `TherapeuticData`

Clinical data collected during gameplay.

```typescript
interface TherapeuticData {
  category: string;
  phonemesWorked: string[];
  improvementAreas: string[];
  strengthAreas: string[];
  recommendations: string[];
}
```

**Phoneme Examples:**
- Consonants: `/p/`, `/b/`, `/k/`, `/g/`, `/s/`, `/z/`
- Vowels: `/i/`, `/e/`, `/a/`, `/o/`, `/u/`
- Blends: `/st/`, `/bl/`, `/kr/`

### `UserProgress`

Tracks user's overall progress across multiple domains.

```typescript
interface UserProgress {
  userId: string;
  articulation_score: number;        // 0-100
  phonological_awareness: number;    // 0-100
  language_comprehension: number;    // 0-100
  social_communication: number;      // 0-100
  sessions_completed: number;
  level: number;
  lastSession: Date;
  totalPracticeTime: number;         // in minutes
}
```

**Progress Tracking:**
```typescript
const progress: UserProgress = {
  userId: "user123",
  articulation_score: 75,
  phonological_awareness: 82,
  language_comprehension: 68,
  social_communication: 80,
  sessions_completed: 15,
  level: 3,
  lastSession: new Date(),
  totalPracticeTime: 180
};
```

## Usage Examples

### Creating a Therapeutic Game

```typescript
import type { TherapeuticGame } from '@/types/games/therapeutic';

const articulationGame: TherapeuticGame = {
  id: 1,
  title: "Sound Safari",
  description: "Practice /k/ and /g/ sounds with animal names",
  category: 'articulation',
  targetAudience: 'all',
  evidenceLevel: 'clinical-proven',
  difficulty: 2,
  duration: "10-15 min",
  unlocked: true,
  therapeutic_goals: [
    "Improve /k/ production in initial position",
    "Increase accuracy of /g/ in medial position",
    "Generalize sounds to conversational speech"
  ],
  age_range: "4-8 years",
  icon: "🦁",
  color: "from-orange-400 to-yellow-500",
  game_type: 'interactive'
};
```

### Starting a Game Session

```typescript
import type { GameSession, TherapeuticData } from '@/types/games/therapeutic';

const startSession = (gameId: number, userId: string): GameSession => {
  return {
    gameId,
    userId,
    startTime: new Date(),
    responses: [],
    accuracy: 0,
    reaction_times: [],
    therapeutic_data: {
      category: 'articulation',
      phonemesWorked: [],
      improvementAreas: [],
      strengthAreas: [],
      recommendations: []
    },
    completed: false
  };
};
```

### Recording a Response

```typescript
import type { GameResponse } from '@/types/games/therapeutic';

const recordResponse = (
  session: GameSession,
  questionId: string,
  userResponse: any,
  correctResponse: any
): void => {
  const startTime = performance.now();
  
  // Simulate response processing
  const reactionTime = performance.now() - startTime;
  
  const response: GameResponse = {
    questionId,
    userResponse,
    correctResponse,
    isCorrect: userResponse === correctResponse,
    reactionTime,
    timestamp: new Date()
  };
  
  session.responses.push(response);
  session.reaction_times.push(reactionTime);
  
  // Update accuracy
  const correctCount = session.responses.filter(r => r.isCorrect).length;
  session.accuracy = (correctCount / session.responses.length) * 100;
};
```

### Analyzing Therapeutic Data

```typescript
const analyzeSession = (session: GameSession): TherapeuticData => {
  const therapeuticData: TherapeuticData = {
    category: 'articulation',
    phonemesWorked: extractPhonemesFromResponses(session.responses),
    improvementAreas: identifyWeakAreas(session.responses),
    strengthAreas: identifyStrongAreas(session.responses),
    recommendations: generateRecommendations(session.responses, session.accuracy)
  };
  
  return therapeuticData;
};

const extractPhonemesFromResponses = (responses: GameResponse[]): string[] => {
  // Extract phonemes from practiced words
  return ['/k/', '/g/', '/s/'];
};

const identifyWeakAreas = (responses: GameResponse[]): string[] => {
  // Analyze incorrect responses
  return ['final consonant deletion', 'consonant cluster reduction'];
};

const identifyStrongAreas = (responses: GameResponse[]): string[] => {
  // Identify consistent correct patterns
  return ['initial consonants', 'vowel accuracy'];
};

const generateRecommendations = (
  responses: GameResponse[],
  accuracy: number
): string[] => {
  if (accuracy >= 80) {
    return ['Ready to advance to harder difficulty', 'Practice in conversational context'];
  } else {
    return ['Continue practicing at current level', 'Focus on accuracy before speed'];
  }
};
```

## Integration with Components

### In a Game Component

```typescript
import { useState, useEffect } from 'react';
import type { TherapeuticGame, GameSession, GameResponse } from '@/types/games/therapeutic';

interface GameProps {
  game: TherapeuticGame;
  userId: string;
  onComplete: (session: GameSession) => void;
}

export default function TherapeuticGameComponent({ game, userId, onComplete }: GameProps) {
  const [session, setSession] = useState<GameSession>({
    gameId: game.id,
    userId,
    startTime: new Date(),
    responses: [],
    accuracy: 0,
    reaction_times: [],
    therapeutic_data: {
      category: game.category,
      phonemesWorked: [],
      improvementAreas: [],
      strengthAreas: [],
      recommendations: []
    },
    completed: false
  });

  const handleResponse = (response: GameResponse) => {
    setSession(prev => ({
      ...prev,
      responses: [...prev.responses, response],
      reaction_times: [...prev.reaction_times, response.reactionTime]
    }));
  };

  const completeSession = () => {
    const completedSession = {
      ...session,
      endTime: new Date(),
      completed: true
    };
    onComplete(completedSession);
  };

  return (
    <div>
      <h1>{game.title}</h1>
      {/* Game implementation */}
    </div>
  );
}
```

## Best Practices

1. **Always validate therapeutic data** - Ensure phonemes, improvement areas, and recommendations are clinically relevant

2. **Track reaction times** - Important for assessing processing speed and automaticity

3. **Store sessions for analysis** - Save session data for progress tracking and clinical reporting

4. **Use evidence-based categories** - Align with recognized speech therapy domains

5. **Document therapeutic goals** - Clear goals help therapists track progress

6. **Age-appropriate content** - Respect the age_range field when presenting games

7. **Progressive difficulty** - Use difficulty levels (1-5) to scaffold learning

8. **Regular progress updates** - Update UserProgress after each completed session

## Clinical Considerations

### Evidence Levels
- Choose `research-backed` for interventions with published studies
- Use `clinical-proven` for widely-used clinical methods
- Mark `expert-recommended` for therapist-developed activities

### Target Audiences
- Design games specifically for clinical populations
- Consider sensory sensitivities for `autism`
- Focus on motor planning for `apraxia`
- Emphasize fluency strategies for `stuttering`

### Therapeutic Goals
- Write SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
- Align with IEP/treatment plan objectives
- Track progress toward goals across sessions

## Type Safety

All types are exported from a single location:

```typescript
import type {
  TherapeuticGame,
  GameSession,
  GameResponse,
  TherapeuticData,
  UserProgress
} from '@/types/games';
```

This ensures type consistency across the application.
