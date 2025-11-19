export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'child' | 'adult' | 'guardian';
  language: 'english' | 'urdu' | 'both';
  profileImageUrl?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingData {
  id: string;
  userId: string;
  parentBirthYear: number;
  childBirthYear?: number;
  childName?: string;
  childGender?: 'girl' | 'boy';
  childBirthDate?: Date | string; // Can be Date object or ISO string from API
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
    selectedDate?: Date | string; // Can be Date object or ISO string from API
    selectedTime?: string;
    timezone?: string;
  };
  isCompleted: boolean;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
}