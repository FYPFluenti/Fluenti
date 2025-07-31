import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Link } from "wouter";
import { 
  MessageCircle, 
  Home, 
  ArrowLeft, 
  CheckCircle,
  Target,
  Play,
  Mic,
  ArrowRight,
  Trophy,
  BarChart3,
  Clock,
  User
} from "lucide-react";

interface AssessmentWord {
  word: string;
  phonetic: string;
  language: 'english' | 'urdu';
  expectedDifficulty: number;
}

interface AssessmentResult {
  word: string;
  accuracy: number;
  language: 'english' | 'urdu';
  attempts: number;
}

interface FinalAssessment {
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  recommendedLevel: number;
  exercises: any[];
}

const assessmentWords: AssessmentWord[] = [
  { word: 'HELLO', phonetic: '/həˈloʊ/', language: 'english', expectedDifficulty: 1 },
  { word: 'WATER', phonetic: '/ˈwɔːtər/', language: 'english', expectedDifficulty: 1 },
  { word: 'BEAUTIFUL', phonetic: '/ˈbjuːtɪfəl/', language: 'english', expectedDifficulty: 2 },
  { word: 'COMPUTER', phonetic: '/kəmˈpjuːtər/', language: 'english', expectedDifficulty: 2 },
  { word: 'PRONUNCIATION', phonetic: '/prəˌnʌnsiˈeɪʃən/', language: 'english', expectedDifficulty: 3 },
];

export default function Assessment() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<'intro' | 'assessment' | 'results'>('intro');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [finalResults, setFinalResults] = useState<FinalAssessment | null>(null);

  const {
    isListening,
    transcript,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (results: AssessmentResult[]) => {
      const response = await apiRequest('POST', '/api/speech/assessment', {
        assessmentResults: results
      });
      return response.json();
    },
    onSuccess: (results: FinalAssessment) => {
      setFinalResults(results);
      setCurrentStep('results');
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle speech recognition result
  useEffect(() => {
    if (transcript && !isListening && currentStep === 'assessment') {
      const currentWord = assessmentWords[currentWordIndex];
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // Calculate similarity (simplified version)
      const similarity = calculateSimilarity(currentWord.word.toLowerCase(), transcript.toLowerCase());
      const accuracy = Math.min(100, Math.max(0, similarity * 100));
      
      if (accuracy >= 60 || newAttempts >= 3) {
        // Move to next word or complete assessment
        const result: AssessmentResult = {
          word: currentWord.word,
          accuracy,
          language: currentWord.language,
          attempts: newAttempts
        };
        
        const newResults = [...assessmentResults, result];
        setAssessmentResults(newResults);
        
        if (currentWordIndex < assessmentWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setAttempts(0);
          resetTranscript();
        } else {
          // Assessment complete
          submitAssessmentMutation.mutate(newResults);
        }
      }
    }
  }, [transcript, isListening, currentStep, currentWordIndex, attempts, assessmentResults]);

  // Simple similarity calculation
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

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleRecord = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="fluenti-card max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Speech recognition is not supported in your browser. 
              Please use Chrome, Safari, or Edge for the best experience.
            </p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentWord = assessmentWords[currentWordIndex];
  const progressPercentage = ((currentWordIndex + (attempts > 0 ? 0.5 : 0)) / assessmentWords.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center">
                  <Target className="text-white text-lg" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-secondary">Fluenti</span>
                  <p className="text-sm text-gray-600">Speech Assessment</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'intro' && (
          /* Introduction */
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary to-accent rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Target className="text-white text-4xl" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Speech Assessment
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Let's evaluate your current speech abilities to create a personalized therapy plan. 
                This assessment will take about 5-10 minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Assessment Steps */}
              <Card className="fluenti-card text-left">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="text-secondary" />
                    <span>Assessment Process</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div>
                      <div className="font-medium text-gray-900">Speech Samples</div>
                      <div className="text-sm text-gray-600">Record pronunciation of 5 words</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div>
                      <div className="font-medium text-gray-900">AI Analysis</div>
                      <div className="text-sm text-gray-600">Advanced phonetic and clarity analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                    <div>
                      <div className="font-medium text-gray-900">Custom Plan</div>
                      <div className="text-sm text-gray-600">Personalized exercise recommendations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What to Expect */}
              <Card className="fluenti-card text-left">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="text-primary" />
                    <span>What to Expect</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-secondary h-4 w-4" />
                    <span className="text-sm">Phoneme production analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-secondary h-4 w-4" />
                    <span className="text-sm">Pronunciation accuracy scoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-secondary h-4 w-4" />
                    <span className="text-sm">Voice clarity evaluation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-secondary h-4 w-4" />
                    <span className="text-sm">Personalized difficulty level</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              className="fluenti-button-secondary text-xl px-12 py-6"
              onClick={() => setCurrentStep('assessment')}
            >
              <Play className="mr-2" />
              Start Assessment
            </Button>
          </div>
        )}

        {currentStep === 'assessment' && (
          /* Assessment in Progress */
          <div className="space-y-8">
            {/* Progress Header */}
            <Card className="fluenti-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Speech Assessment</h2>
                  <Badge className="bg-secondary text-white">
                    Word {currentWordIndex + 1} of {assessmentWords.length}
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="mb-2" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress: {Math.round(progressPercentage)}%</span>
                  <span>Estimated time remaining: {Math.max(0, assessmentWords.length - currentWordIndex)} minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Word Assessment */}
            <Card className="fluenti-card">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-bold text-primary mb-4 uppercase">
                    {currentWord.word}
                  </h3>
                  <p className="text-xl text-gray-600 mb-2">
                    Phonetic: {currentWord.phonetic}
                  </p>
                  <Badge className="bg-gray-100 text-gray-700">
                    Difficulty Level {currentWord.expectedDifficulty}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Button
                    className="bg-blue-100 hover:bg-blue-200 text-primary py-4 text-lg"
                    onClick={() => speakWord(currentWord.word)}
                  >
                    <Play className="mr-2" />
                    Listen
                  </Button>
                  
                  <Button
                    className={`py-4 text-lg ${
                      isListening 
                        ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                        : 'bg-green-100 hover:bg-green-200 text-secondary'
                    }`}
                    onClick={handleRecord}
                    disabled={submitAssessmentMutation.isPending}
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
                    <p className="text-gray-600">Listening... Speak the word clearly!</p>
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

                <div className="text-center text-sm text-gray-500">
                  Attempt {attempts}/3 • Speak clearly into your microphone
                </div>
              </CardContent>
            </Card>

            {/* Completed Words */}
            {assessmentResults.length > 0 && (
              <Card className="fluenti-card">
                <CardHeader>
                  <CardTitle>Completed Words</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {assessmentResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            result.accuracy >= 80 ? 'bg-green-100' : result.accuracy >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <CheckCircle className={`h-4 w-4 ${
                              result.accuracy >= 80 ? 'text-green-600' : result.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          </div>
                          <span className="font-medium text-gray-900">{result.word}</span>
                        </div>
                        <span className={`font-bold ${
                          result.accuracy >= 80 ? 'text-green-600' : result.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(result.accuracy)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === 'results' && finalResults && (
          /* Assessment Results */
          <div className="space-y-8">
            {/* Results Header */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary to-accent rounded-full mx-auto mb-6 flex items-center justify-center">
                <Trophy className="text-white text-4xl" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Assessment Complete! 🎉
              </h1>
              <p className="text-xl text-gray-600">
                Here are your personalized results and recommendations.
              </p>
            </div>

            {/* Overall Score */}
            <Card className="fluenti-card text-center">
              <CardContent className="p-8">
                <div className="text-6xl font-bold text-primary mb-4">
                  {Math.round(finalResults.overallScore)}%
                </div>
                <div className="text-xl text-gray-600 mb-4">Overall Speech Accuracy</div>
                
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {finalResults.strengths.length}
                    </div>
                    <div className="text-sm text-green-700">Strengths Identified</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      Level {finalResults.recommendedLevel}
                    </div>
                    <div className="text-sm text-blue-700">Recommended Level</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-lg font-bold text-purple-600 mb-1">
                      {finalResults.exercises.length}
                    </div>
                    <div className="text-sm text-purple-700">Custom Exercises</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Strengths */}
              <Card className="fluenti-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-600">
                    <CheckCircle />
                    <span>Your Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {finalResults.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {finalResults.strengths.map((strength, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">Keep practicing! Strengths will develop with consistent effort.</p>
                  )}
                </CardContent>
              </Card>

              {/* Improvement Areas */}
              <Card className="fluenti-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-600">
                    <Target />
                    <span>Focus Areas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {finalResults.improvementAreas.length > 0 ? (
                    <ul className="space-y-2">
                      {finalResults.improvementAreas.map((area, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-700">{area}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">Excellent! No major areas for improvement identified.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/speech-therapy">
                <Button className="fluenti-button-primary text-lg px-8 py-4">
                  <Play className="mr-2" />
                  Start Therapy Sessions
                </Button>
              </Link>
              
              <Link href="/progress">
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white text-lg px-8 py-4">
                  <BarChart3 className="mr-2" />
                  View Progress Dashboard
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" className="text-lg px-8 py-4">
                  <Home className="mr-2" />
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
