import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { SpeechExercise } from '@/components/speech/speech-exercise';
import { useToast } from '@/hooks/use-toast';
import { 
  ClipboardCheck, 
  Mic, 
  Globe, 
  User, 
  Calendar,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'speech';
  options?: string[];
  category: 'demographic' | 'language' | 'speech' | 'goals';
}

interface AssessmentData {
  age: string;
  primaryLanguage: string;
  difficultyAreas: string[];
  goals: string[];
  experienceLevel: string;
  preferredLanguage: 'english' | 'urdu' | 'both';
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'age',
    question: 'What is your age group?',
    type: 'single',
    options: ['Under 5', '5-8', '9-12', '13-17', '18+'],
    category: 'demographic'
  },
  {
    id: 'primaryLanguage',
    question: 'What is your primary language?',
    type: 'single',
    options: ['English', 'Urdu', 'Both equally'],
    category: 'language'
  },
  {
    id: 'difficultyAreas',
    question: 'What speech areas do you want to improve? (Select all that apply)',
    type: 'multiple',
    options: [
      'Pronunciation of specific sounds',
      'Speaking clearly and loudly',
      'Speaking at the right speed',
      'Grammar and sentence structure',
      'Vocabulary building',
      'Confidence in speaking'
    ],
    category: 'speech'
  },
  {
    id: 'goals',
    question: 'What are your main goals? (Select all that apply)',
    type: 'multiple',
    options: [
      'Better pronunciation',
      'More confident speaking',
      'Clearer communication',
      'Academic improvement',
      'Social interaction',
      'Professional development'
    ],
    category: 'goals'
  },
  {
    id: 'experience',
    question: 'Have you had speech therapy before?',
    type: 'single',
    options: ['Never', 'A little', 'Some experience', 'Lots of experience'],
    category: 'speech'
  }
];

export interface InitialAssessmentProps {
  onComplete: (data: AssessmentData & { speechResults?: any }) => void;
  onSkip?: () => void;
}

export function InitialAssessment({ onComplete, onSkip }: InitialAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showSpeechTest, setShowSpeechTest] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const { toast } = useToast();

  const currentQuestion = ASSESSMENT_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100;

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextStep = () => {
    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeQuestionnaire();
    }
  };

  const completeQuestionnaire = () => {
    // Process answers into structured data
    const data: AssessmentData = {
      age: answers.age as string || '',
      primaryLanguage: answers.primaryLanguage as string || '',
      difficultyAreas: answers.difficultyAreas as string[] || [],
      goals: answers.goals as string[] || [],
      experienceLevel: answers.experience as string || '',
      preferredLanguage: determinePreferredLanguage(answers.primaryLanguage as string)
    };

    setAssessmentData(data);
    setShowSpeechTest(true);

    toast({
      title: "Questionnaire Complete!",
      description: "Now let's test your speech pronunciation.",
    });
  };

  const determinePreferredLanguage = (primaryLang: string): 'english' | 'urdu' | 'both' => {
    if (primaryLang === 'English') return 'english';
    if (primaryLang === 'Urdu') return 'urdu';
    return 'both';
  };

  const handleSpeechTestComplete = (speechResults: any) => {
    if (assessmentData) {
      const finalData = {
        ...assessmentData,
        speechResults
      };
      
      setIsComplete(true);
      
      toast({
        title: "Assessment Complete!",
        description: "Your personalized learning plan is ready.",
      });

      setTimeout(() => {
        onComplete(finalData);
      }, 2000);
    }
  };

  const skipAssessment = () => {
    const defaultData: AssessmentData = {
      age: 'Not specified',
      primaryLanguage: 'English',
      difficultyAreas: ['Pronunciation of specific sounds'],
      goals: ['Better pronunciation'],
      experienceLevel: 'Never',
      preferredLanguage: 'english'
    };
    
    onSkip?.();
    onComplete(defaultData);
  };

  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
          <p className="text-gray-600 mb-4">
            Great job! We've created a personalized learning plan just for you.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Preparing your dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (showSpeechTest && assessmentData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <span>Speech Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Now let's test your pronunciation with a few words. This helps us understand your current level.
            </p>
          </CardContent>
        </Card>
        
        <SpeechExercise
          language={assessmentData.preferredLanguage === 'both' ? 'english' : assessmentData.preferredLanguage}
          exerciseType="assessment"
          onComplete={handleSpeechTestComplete}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Initial Speech Assessment</h1>
              <p className="text-gray-600">Help us understand your needs and goals</p>
            </div>
            <Button variant="ghost" onClick={skipAssessment}>
              Skip Assessment
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-gray-600">
              {currentStep + 1} of {ASSESSMENT_QUESTIONS.length}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Avatar Guidance */}
        <Card>
          <CardContent className="p-6">
            <ThreeAvatar
              currentMessage={`Question ${currentStep + 1}: ${currentQuestion.question}`}
              language="english"
            />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              {currentQuestion.category === 'demographic' && <User className="w-5 h-5" />}
              {currentQuestion.category === 'language' && <Globe className="w-5 h-5" />}
              {currentQuestion.category === 'speech' && <Mic className="w-5 h-5" />}
              {currentQuestion.category === 'goals' && <Star className="w-5 h-5" />}
              <CardTitle className="capitalize">{currentQuestion.category} Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {currentQuestion.question}
              </h3>

              {currentQuestion.type === 'single' && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] as string || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === 'multiple' && currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => {
                    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                    const isSelected = currentAnswers.includes(option);
                    
                    return (
                      <label
                        key={option}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleAnswer(currentQuestion.id, [...currentAnswers, option]);
                            } else {
                              handleAnswer(currentQuestion.id, currentAnswers.filter(a => a !== option));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={!answers[currentQuestion.id] || 
                  (Array.isArray(answers[currentQuestion.id]) && 
                   (answers[currentQuestion.id] as string[]).length === 0)}
              >
                {currentStep === ASSESSMENT_QUESTIONS.length - 1 ? 'Continue to Speech Test' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      {Object.keys(answers).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Responses So Far</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(answers).map(([questionId, answer]) => {
                const question = ASSESSMENT_QUESTIONS.find(q => q.id === questionId);
                if (!question) return null;
                
                return (
                  <div key={questionId} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm mb-1">{question.question}</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(answer) ? (
                        answer.map(ans => (
                          <Badge key={ans} variant="secondary" className="text-xs">
                            {ans}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {answer}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}