import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'reason',
    question: 'what brings you to fluenti?',
    options: [
      'unlock insights about myself',
      'process my emotions',
      'set and achieve my goals',
      'just need to vent',
      "i don't know yet"
    ]
  },
  {
    id: 'frequency',
    question: 'how often do you want to check in?',
    options: [
      'daily',
      'a few times a week',
      'once a week',
      'whenever i feel like it'
    ]
  },
  {
    id: 'experience',
    question: 'have you tried therapy or journaling before?',
    options: [
      'yes, therapy',
      'yes, journaling',
      'both',
      'neither',
      'prefer not to say'
    ]
  }
];

export interface InitialAssessmentProps {
  onComplete: (data: any) => void;
  onSkip?: () => void;
}

export function InitialAssessment({ onComplete, onSkip }: InitialAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');

  const currentQuestion = ASSESSMENT_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100;

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
  };

  const handleContinue = () => {
    if (!selectedOption) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: selectedOption
    };
    setAnswers(newAnswers);
    setSelectedOption('');

    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedOption(answers[ASSESSMENT_QUESTIONS[currentStep - 1].id] || '');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="text-foreground hover:text-muted-foreground transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <h2 className="text-3xl font-medium mb-8 text-foreground">
        {currentQuestion.question}
      </h2>

      {/* Options */}
      <div className="space-y-3 mb-12">
        {currentQuestion.options.map((option) => (
          <button
            key={option}
            onClick={() => handleOptionClick(option)}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              selectedOption === option
                ? 'bg-foreground text-background'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedOption}
        className="w-full bg-muted-foreground hover:bg-muted-foreground/90 text-background disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        continue
      </Button>
    </div>
  );
}
