// Example integration in WordPracticeGame.tsx

import { EnhancedSpeechRecognitionService } from '@/services/enhancedSpeechRecognition';

// In your component:
const initializeSpeechRecognition = () => {
  const speechConfig = {
    language: 'en-US',
    sampleRate: 16000,
    continuous: false,
    interimResults: true,
    maxAlternatives: 5,
    usePronunciationAssessment: true, // Enable Microsoft Speech API
    microsoftSpeechConfig: {
      subscriptionKey: process.env.REACT_APP_MICROSOFT_SPEECH_KEY || '',
      region: process.env.REACT_APP_MICROSOFT_SPEECH_REGION || 'eastus'
    },
    onResult: (result) => {
      if (result.isFinal) {
        // Enhanced result with pronunciation assessment
        console.log('🎯 Enhanced Speech Result:', result);
        
        if (result.pronunciationAssessment) {
          // Use Microsoft's detailed analysis
          const accuracy = result.pronunciationAssessment.overallScore;
          const isCorrect = accuracy >= 70;
          
          handleSpeechResult(
            result.transcript,
            result.confidence,
            result.alternatives,
            result.pronunciationAssessment
          );
        } else {
          // Fallback to our enhanced analysis
          handleSpeechResult(result.transcript, result.confidence, result.alternatives);
        }
      }
    },
    onError: (error) => {
      console.error('Enhanced speech recognition error:', error);
      setIsListening(false);
    },
    onStart: () => setIsListening(true),
    onEnd: () => setIsListening(false)
  };

  const speechService = new EnhancedSpeechRecognitionService(speechConfig);
  speechService.setTargetWord(currentWord.word);
  
  return speechService;
};

// Enhanced speech result handler
const handleSpeechResult = async (
  transcript: string,
  confidence: number,
  alternatives?: Array<{ transcript: string; confidence: number }>,
  pronunciationAssessment?: PronunciationResult
) => {
  const targetWord = currentWord.word.toLowerCase();
  
  let analysis;
  
  if (pronunciationAssessment) {
    // Use Microsoft's advanced analysis
    analysis = AdvancedPronunciationAnalyzerService.analyzePronunciation(
      targetWord,
      transcript,
      confidence,
      pronunciationAssessment,
      alternatives
    );
    
    console.log('🔬 Microsoft Speech Analysis:', {
      overallScore: pronunciationAssessment.overallScore,
      accuracyScore: pronunciationAssessment.accuracyScore,
      fluencyScore: pronunciationAssessment.fluencyScore,
      phonemeDetails: pronunciationAssessment.phonemes
    });
  } else {
    // Fallback to enhanced local analysis
    analysis = PronunciationAnalyzer.analyzePronunciation(
      targetWord,
      transcript,
      confidence,
      alternatives
    );
  }

  // Rest of your existing logic...
  const attemptData = {
    word: currentWord.word,
    transcript,
    accuracy: analysis.accuracy,
    correct: analysis.isCorrect,
    confidence,
    attempt: currentAttempt,
    timestamp: new Date(),
    phonemeAccuracy: analysis.phonemeAccuracy,
    suggestions: analysis.suggestions,
    detailedFeedback: analysis.detailedFeedback // New detailed feedback
  };

  setAttempts([...attempts, attemptData]);
  // ... continue with existing logic
};