import React, { useState } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export default function QuickSpeechTest() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSDKWithEnvironmentKeys = async () => {
    setIsLoading(true);
    setResult('Testing Microsoft Speech SDK with environment variables...\n');
    
    try {
      // Use environment variables instead of hardcoded keys
      const key = import.meta.env.VITE_MICROSOFT_SPEECH_KEY || import.meta.env.VITE_AZURE_SPEECH_KEY;
      const region = import.meta.env.VITE_MICROSOFT_SPEECH_REGION || import.meta.env.VITE_AZURE_SPEECH_REGION || 'eastus';
      
      if (!key) {
        setResult(prev => prev + '❌ Azure Speech API key not found in environment variables\n');
        setResult(prev => prev + '💡 Please set VITE_MICROSOFT_SPEECH_KEY or VITE_AZURE_SPEECH_KEY in your .env file\n');
        setIsLoading(false);
        return;
      }
      
      setResult(prev => prev + `Creating speech config with region: ${region}...\n`);
      
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechRecognitionLanguage = 'en-US';
      
      setResult(prev => prev + 'Speech config created successfully!\n');
      setResult(prev => prev + 'Creating pronunciation assessment...\n');
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
        'hello',
        SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
        SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
        true
      );
      
      setResult(prev => prev + 'Pronunciation config created!\n');
      setResult(prev => prev + 'Creating recognizer...\n');
      
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);
      
      setResult(prev => prev + 'Starting recognition... Say "hello"!\n');
      
      recognizer.recognizeOnceAsync(
        (result) => {
          setResult(prev => prev + `Recognition result: ${result.reason}\n`);
          setResult(prev => prev + `Text: ${result.text}\n`);
          
          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            try {
              const pronunciationResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
              setResult(prev => prev + `SUCCESS! Pronunciation Score: ${pronunciationResult.pronunciationScore}\n`);
              setResult(prev => prev + `Accuracy: ${pronunciationResult.accuracyScore}\n`);
            } catch (err) {
              setResult(prev => prev + `Error processing pronunciation result: ${err}\n`);
            }
          } else {
            setResult(prev => prev + `Recognition failed: ${result.errorDetails}\n`);
          }
          
          recognizer.close();
          setIsLoading(false);
        },
        (error) => {
          setResult(prev => prev + `Recognition error: ${error}\n`);
          recognizer.close();
          setIsLoading(false);
        }
      );
      
    } catch (error) {
      setResult(prev => prev + `Error: ${error}\n`);
      setIsLoading(false);
    }
  };

  const testSDKImport = () => {
    setResult('Testing Speech SDK import...\n');
    
    try {
      setResult(prev => prev + `SpeechSDK exists: ${typeof SpeechSDK !== 'undefined'}\n`);
      setResult(prev => prev + `SpeechConfig exists: ${!!SpeechSDK.SpeechConfig}\n`);
      setResult(prev => prev + `AudioConfig exists: ${!!SpeechSDK.AudioConfig}\n`);
      setResult(prev => prev + `SpeechRecognizer exists: ${!!SpeechSDK.SpeechRecognizer}\n`);
      setResult(prev => prev + `PronunciationAssessmentConfig exists: ${!!SpeechSDK.PronunciationAssessmentConfig}\n`);
      setResult(prev => prev + 'All SDK components found!\n');
    } catch (error) {
      setResult(prev => prev + `SDK Import Error: ${error}\n`);
    }
  };

  const checkEnvironmentVars = () => {
    setResult('Checking Environment Variables...\n');
    
    const vars = {
      'VITE_MICROSOFT_SPEECH_KEY': import.meta.env.VITE_MICROSOFT_SPEECH_KEY,
      'REACT_APP_MICROSOFT_SPEECH_KEY': import.meta.env.REACT_APP_MICROSOFT_SPEECH_KEY,
      'VITE_MICROSOFT_SPEECH_REGION': import.meta.env.VITE_MICROSOFT_SPEECH_REGION,
      'REACT_APP_MICROSOFT_SPEECH_REGION': import.meta.env.REACT_APP_MICROSOFT_SPEECH_REGION,
    };
    
    Object.entries(vars).forEach(([key, value]) => {
      setResult(prev => prev + `${key}: ${value ? `${value.substring(0, 10)}...` : 'NOT SET'}\n`);
    });
    
    setResult(prev => prev + `\nAll env vars: ${Object.keys(import.meta.env).filter(k => k.includes('SPEECH')).join(', ')}\n`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>🧪 Quick Microsoft Speech Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={checkEnvironmentVars} style={{ margin: '5px', padding: '10px', backgroundColor: '#007acc', color: 'white', border: 'none', borderRadius: '5px' }}>
          Check Environment Variables
        </button>
        
        <button onClick={testSDKImport} style={{ margin: '5px', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
          Test SDK Import
        </button>
        
        <button 
          onClick={testSDKWithEnvironmentKeys} 
          disabled={isLoading}
          style={{ margin: '5px', padding: '10px', backgroundColor: isLoading ? '#6c757d' : '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {isLoading ? 'Testing... (Speak "hello")' : 'Test with Environment Keys'}
        </button>
      </div>
      
      <pre style={{ 
        background: '#ffffff', 
        padding: '15px', 
        borderRadius: '5px',
        minHeight: '400px',
        whiteSpace: 'pre-wrap',
        border: '1px solid #ddd',
        fontSize: '14px'
      }}>
        {result || 'Click a button to start testing...'}
      </pre>
    </div>
  );
}