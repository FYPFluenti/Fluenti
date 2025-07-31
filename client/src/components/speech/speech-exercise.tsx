import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Mic, RotateCcw, Volume2, CheckCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { PronunciationFeedback } from './pronunciation-feedback';

interface Exercise {
  id: string;
  word: string;
  phonetic: string;
  sentence: string;
  language: 'english' | 'urdu';
  difficulty: number;
}

interface SpeechExerciseProps {
  exercise: Exercise;
  onComplete: (result: { accuracy: number; attempts: number }) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function SpeechExercise({ 
  exercise, 
  onComplete, 
  onNext, 
  isLoading = false 
}: SpeechExerciseProps) {
  const [attempts, setAttempts] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const {
    isListening,
    transcript,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  // Text-to-speech for demonstration
  const speakWord = async () => {
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true);
      const utterance = new SpeechSynthesisUtterance(exercise.word);
      utterance.lang = exercise.language === 'urdu' ? 'ur-PK' : 'en-US';
      utterance.rate = 0.8;
      
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  // Handle speech recognition result
  useEffect(() => {
    if (transcript && !isListening) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // Simulate accuracy calculation (in production, this would call the API)
      const similarity = calculateSimilarity(exercise.word.toLowerCase(), transcript.toLowerCase());
      const accuracy = Math.min(100, Math.max(0, similarity * 100));
      
      setLastAccuracy(accuracy);
      setFeedbackData({
        accuracy,
        feedback: accuracy >= 80 
          ? "Excellent pronunciation! Well done!" 
          : accuracy >= 60 
          ? "Good attempt! Try emphasizing the vowel sounds more."
          : "Keep practicing! Focus on each syllable clearly.",
        improvements: accuracy < 80 
          ? ["Speak more slowly", "Emphasize vowel sounds", "Practice the phonetic pronunciation"]
          : ["Great job! Keep up the good work!"]
      });

      if (accuracy >= 75 || newAttempts >= 3) {
        setIsCompleted(true);
        onComplete({ accuracy, attempts: newAttempts });
      }
    }
  }, [transcript, isListening]);

  // Simple similarity calculation (Levenshtein distance)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return 1 - matrix[str2.length][str1.length] / maxLength;
  };

  const handleRecord = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Card className="fluenti-card">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">
            Speech recognition is not supported in your browser. 
            Please use Chrome, Safari, or Edge for the best experience.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exercise Header */}
      <Card className="fluenti-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900">Current Exercise</CardTitle>
            <Badge className="bg-accent text-white">
              Level {exercise.difficulty}
            </Badge>
          </div>
          <p className="text-gray-600">Practice clear pronunciation</p>
        </CardHeader>
      </Card>

      {/* Word Practice */}
      <Card className="fluenti-card">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-primary mb-2 uppercase">
              {exercise.word}
            </h2>
            <p className="text-gray-600 text-lg">
              Phonetic: {exercise.phonetic}
            </p>
            {exercise.sentence && (
              <p className="text-gray-500 mt-2 italic">
                Example: "{exercise.sentence}"
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              className="bg-blue-100 hover:bg-blue-200 text-primary py-4 text-lg"
              onClick={speakWord}
              disabled={isPlayingAudio || isLoading}
            >
              <Play className="mr-2" />
              {isPlayingAudio ? 'Playing...' : 'Listen'}
            </Button>
            
            <Button
              className={`py-4 text-lg ${
                isListening 
                  ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                  : 'bg-green-100 hover:bg-green-200 text-secondary'
              }`}
              onClick={handleRecord}
              disabled={isLoading}
            >
              <Mic className="mr-2" />
              {isListening ? 'Stop Recording' : 'Record'}
            </Button>
          </div>

          {/* Recording Indicator */}
          {isListening && (
            <div className="text-center mb-4">
              <div className="speech-wave mx-auto mb-2">
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
                <div className="speech-wave-bar"></div>
              </div>
              <p className="text-gray-600">Listening... Speak clearly!</p>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mic className="text-primary h-4 w-4" />
                <span className="font-medium text-gray-700">You said:</span>
              </div>
              <p className="text-gray-800 font-medium">"{transcript}"</p>
              <p className="text-sm text-gray-500 mt-1">
                Confidence: {Math.round(confidence * 100)}%
              </p>
            </div>
          )}

          {/* Attempts Counter */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>Attempt {attempts}/3</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetTranscript();
                setAttempts(0);
                setLastAccuracy(null);
                setIsCompleted(false);
                setFeedbackData(null);
              }}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Progress Bar */}
          <Progress 
            value={isCompleted ? 100 : (attempts / 3) * 100} 
            className="mb-4"
          />
        </CardContent>
      </Card>

      {/* Pronunciation Feedback */}
      {feedbackData && (
        <PronunciationFeedback
          accuracy={feedbackData.accuracy}
          feedback={feedbackData.feedback}
          improvements={feedbackData.improvements}
          isCompleted={isCompleted}
        />
      )}

      {/* Next Button */}
      {isCompleted && (
        <div className="text-center">
          <Button 
            className="fluenti-button-primary text-lg px-8 py-4"
            onClick={onNext}
          >
            <CheckCircle className="mr-2" />
            Next Exercise
          </Button>
        </div>
      )}
    </div>
  );
}
