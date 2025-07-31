import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Star,
  Volume2,
  BookOpen,
  Trophy
} from 'lucide-react';

interface Word {
  id: string;
  word: string;
  phonetic: string;
  translation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface SpeechExerciseProps {
  language: 'english' | 'urdu';
  exerciseType: 'assessment' | 'practice' | 'exercise';
  onComplete?: (results: any) => void;
  sessionId?: string;
}

const SAMPLE_WORDS: Record<string, Word[]> = {
  english: [
    { id: '1', word: 'hello', phonetic: '/həˈloʊ/', difficulty: 'easy', category: 'greetings' },
    { id: '2', word: 'beautiful', phonetic: '/ˈbjuːtɪfəl/', difficulty: 'medium', category: 'adjectives' },
    { id: '3', word: 'pronunciation', phonetic: '/prəˌnʌnsiˈeɪʃən/', difficulty: 'hard', category: 'vocabulary' },
    { id: '4', word: 'water', phonetic: '/ˈwɔːtər/', difficulty: 'easy', category: 'nouns' },
    { id: '5', word: 'wonderful', phonetic: '/ˈwʌndərfəl/', difficulty: 'medium', category: 'adjectives' },
  ],
  urdu: [
    { id: '1', word: 'سلام', phonetic: '/salam/', translation: 'Hello', difficulty: 'easy', category: 'greetings' },
    { id: '2', word: 'خوبصورت', phonetic: '/khubsurat/', translation: 'Beautiful', difficulty: 'medium', category: 'adjectives' },
    { id: '3', word: 'تعلیم', phonetic: '/taleem/', translation: 'Education', difficulty: 'medium', category: 'nouns' },
    { id: '4', word: 'پانی', phonetic: '/pani/', translation: 'Water', difficulty: 'easy', category: 'nouns' },
    { id: '5', word: 'دوست', phonetic: '/dost/', translation: 'Friend', difficulty: 'easy', category: 'nouns' },
  ]
};

export function SpeechExercise({ 
  language, 
  exerciseType, 
  onComplete, 
  sessionId 
}: SpeechExerciseProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, { accuracy: number; attempts: number; feedback: string }>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [score, setScore] = useState(0);

  const { toast } = useToast();
  const {
    isListening,
    transcript,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  const words = SAMPLE_WORDS[language] || [];
  const currentWord = words[currentWordIndex];
  const progress = (currentWordIndex / words.length) * 100;

  useEffect(() => {
    if (!exerciseStarted) {
      setAvatarMessage(`Welcome! Let's practice ${language === 'english' ? 'English' : 'Urdu'} pronunciation. Click start when you're ready!`);
    }
  }, [language, exerciseStarted]);

  useEffect(() => {
    if (transcript && currentWord) {
      analyzeTranscript();
    }
  }, [transcript, currentWord]);

  const analyzeTranscript = async () => {
    if (!currentWord || !transcript) return;

    const wordId = currentWord.id;
    const currentAttempts = attempts[wordId] || 0;
    
    // Simple accuracy calculation (in real app, this would use AI)
    const similarity = calculateSimilarity(transcript.toLowerCase(), currentWord.word.toLowerCase());
    const accuracy = Math.min(100, Math.max(20, similarity * 100 + Math.random() * 20));
    
    const newAttempts = { ...attempts, [wordId]: currentAttempts + 1 };
    setAttempts(newAttempts);

    // Generate feedback
    const feedback = generateFeedback(accuracy, currentWord.word, transcript);
    
    // Store result
    const newResults = {
      ...results,
      [wordId]: {
        accuracy: Math.round(accuracy),
        attempts: newAttempts[wordId],
        feedback
      }
    };
    setResults(newResults);

    // Update score
    setScore(prev => prev + Math.round(accuracy));

    // Provide avatar feedback
    setAvatarMessage(feedback);

    toast({
      title: accuracy >= 80 ? "Great job!" : accuracy >= 60 ? "Good try!" : "Keep practicing!",
      description: `Accuracy: ${Math.round(accuracy)}%`,
      variant: accuracy >= 80 ? "default" : "destructive",
    });

    // Auto-advance after good pronunciation or multiple attempts
    if (accuracy >= 80 || newAttempts[wordId] >= 3) {
      setTimeout(() => {
        nextWord();
      }, 2000);
    }

    resetTranscript();
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const generateFeedback = (accuracy: number, targetWord: string, spokenWord: string): string => {
    if (accuracy >= 90) {
      return `Perfect! You pronounced "${targetWord}" excellently!`;
    } else if (accuracy >= 80) {
      return `Great job! Your pronunciation of "${targetWord}" is very good.`;
    } else if (accuracy >= 60) {
      return `Good try! Focus on the pronunciation of "${targetWord}". Try to speak more clearly.`;
    } else {
      return `Keep practicing "${targetWord}". Listen carefully and try again.`;
    }
  };

  const startExercise = () => {
    setExerciseStarted(true);
    setAvatarMessage(`Let's start with the word "${currentWord.word}". Click the microphone when ready!`);
  };

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      const nextWord = words[currentWordIndex + 1];
      setAvatarMessage(`Great! Now let's try "${nextWord.word}"`);
      resetTranscript();
    } else {
      completeExercise();
    }
  };

  const completeExercise = () => {
    setIsComplete(true);
    const averageAccuracy = Object.values(results).reduce((sum, result) => sum + result.accuracy, 0) / Object.values(results).length || 0;
    const totalAttempts = Object.values(attempts).reduce((sum, attempt) => sum + attempt, 0);
    
    setAvatarMessage(`Excellent work! You completed the exercise with ${Math.round(averageAccuracy)}% average accuracy!`);
    
    const finalResults = {
      sessionId,
      language,
      exerciseType,
      wordsCompleted: words.length,
      averageAccuracy: Math.round(averageAccuracy),
      totalAttempts,
      results,
      score: Math.round(score / words.length)
    };

    onComplete?.(finalResults);

    toast({
      title: "Exercise Complete!",
      description: `Average accuracy: ${Math.round(averageAccuracy)}%`,
    });
  };

  const restartExercise = () => {
    setCurrentWordIndex(0);
    setAttempts({});
    setResults({});
    setIsComplete(false);
    setExerciseStarted(false);
    setScore(0);
    resetTranscript();
  };

  if (!isSupported) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Speech Recognition Not Supported</h3>
          <p className="text-gray-600">
            Your browser doesn't support speech recognition. Please use Chrome, Safari, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const averageAccuracy = Object.values(results).reduce((sum, result) => sum + result.accuracy, 0) / Object.values(results).length || 0;
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Exercise Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {Math.round(averageAccuracy)}%
            </div>
            <p className="text-gray-600">Average Accuracy</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{words.length}</div>
              <p className="text-sm text-gray-600">Words Practiced</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(attempts).reduce((sum, attempt) => sum + attempt, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Attempts</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Word Results:</h4>
            {words.map(word => {
              const result = results[word.id];
              return result ? (
                <div key={word.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{word.word}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={result.accuracy >= 80 ? 'default' : result.accuracy >= 60 ? 'secondary' : 'destructive'}>
                      {result.accuracy}%
                    </Badge>
                    <span className="text-sm text-gray-500">({result.attempts} attempts)</span>
                  </div>
                </div>
              ) : null;
            })}
          </div>

          <Button onClick={restartExercise} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold capitalize">
                {language} {exerciseType}
              </h2>
              <p className="text-sm text-gray-600">
                Word {currentWordIndex + 1} of {words.length}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Score: {Math.round(score / Math.max(1, currentWordIndex + 1))}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Avatar Section */}
        <Card>
          <CardContent className="p-6">
            <ThreeAvatar
              isListening={isListening}
              currentMessage={avatarMessage}
              language={language}
              onSpeak={(text) => console.log('Avatar spoke:', text)}
            />
          </CardContent>
        </Card>

        {/* Exercise Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Current Word</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {exerciseStarted && currentWord ? (
              <>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-primary">
                    {currentWord.word}
                  </div>
                  <div className="text-lg text-gray-600">
                    {currentWord.phonetic}
                  </div>
                  {currentWord.translation && (
                    <div className="text-sm text-gray-500">
                      Translation: {currentWord.translation}
                    </div>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {currentWord.difficulty} • {currentWord.category}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-full h-12 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    disabled={!currentWord}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>

                  {transcript && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">You said:</p>
                      <p className="font-medium">"{transcript}"</p>
                      {confidence > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Confidence: {Math.round(confidence * 100)}%
                        </p>
                      )}
                    </div>
                  )}

                  {results[currentWord.id] && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Last Result:</span>
                        <Badge variant={results[currentWord.id].accuracy >= 80 ? 'default' : 'secondary'}>
                          {results[currentWord.id].accuracy}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {results[currentWord.id].feedback}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const utterance = new SpeechSynthesisUtterance(currentWord.word);
                        utterance.lang = language === 'urdu' ? 'ur-PK' : 'en-US';
                        speechSynthesis.speak(utterance);
                      }}
                      className="flex-1"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Hear Word
                    </Button>
                    
                    {(results[currentWord.id]?.accuracy >= 80 || (attempts[currentWord.id] || 0) >= 3) && (
                      <Button onClick={nextWord} className="flex-1">
                        {currentWordIndex < words.length - 1 ? 'Next Word' : 'Finish'}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl">🎯</div>
                <h3 className="text-xl font-semibold">Ready to Practice?</h3>
                <p className="text-gray-600">
                  You'll practice {words.length} {language} words. 
                  The AI avatar will guide you through each pronunciation.
                </p>
                <Button onClick={startExercise} size="lg" className="w-full">
                  Start {exerciseType === 'assessment' ? 'Assessment' : 'Exercise'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}