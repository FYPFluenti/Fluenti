export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'child' | 'adult' | 'guardian';
  language: 'english' | 'urdu' | 'both';
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingData {
  id: string;
  userId: string;
  childBirthYear: number;
  childName?: string;
  childGender?: 'girl' | 'boy';
  childBirthDate?: Date;
  interests?: string[];
  vocabularyLevel?: string;
  seekingSpeechTherapy?: boolean;
  hasBeenEvaluated?: boolean;
  assessmentResponses?: {
    hearing?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    pragmatics?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    play?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
    comprehension?: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>;
  };
  evaluationBooking?: {
    selectedDate?: Date;
    selectedTime?: string;
    timezone?: string;
  };
  isCompleted: boolean;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
}