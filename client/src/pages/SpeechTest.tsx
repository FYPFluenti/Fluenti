import React, { useState } from 'react';
import { microsoftSpeechService } from '@/services/microsoftSpeechService';

export default function SpeechTest() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const forceReinitialize = () => {
    setResult('Force reinitializing Microsoft Speech Service...\n');
    const success = microsoftSpeechService.forceReinitialize();
    setResult(prev => prev + `Reinitialization: ${success ? 'SUCCESS' : 'FAILED'}\n`);
    
    if (success) {
      const isAvailable = microsoftSpeechService.isAvailable();
      setResult(prev => prev + `Service Available: ${isAvailable}\n`);
    }
  };

  const testSDKDirectly = () => {
    setResult('Testing Speech SDK directly...\n');
    const sdkWorks = microsoftSpeechService.testSDKDirectly();
    setResult(prev => prev + `SDK Direct Test: ${sdkWorks ? 'PASS' : 'FAIL'}\n`);
  };

  const testMicrosoftSpeech = async () => {
    setIsLoading(true);
    setResult('Testing Microsoft Speech API...\n');
    
    try {
      console.log('🧪 Testing Microsoft Speech Service');
      
      // Check if service is available
      const isAvailable = microsoftSpeechService.isAvailable();
      setResult(prev => prev + `Service Available: ${isAvailable}\n`);
      
      if (isAvailable) {
        setResult(prev => prev + 'Starting direct pronunciation assessment for "hello"...\n');
        setResult(prev => prev + 'Please say "hello" clearly into your microphone...\n');
        const testResult = await microsoftSpeechService.assessPronunciationDirect('hello');
        
        if (testResult) {
          setResult(prev => prev + `SUCCESS! Score: ${testResult.pronunciationScore}\n`);
          setResult(prev => prev + `Transcript: "${testResult.transcript}"\n`);
          setResult(prev => prev + `Accuracy: ${testResult.accuracyScore}\n`);
          setResult(prev => prev + `Fluency: ${testResult.fluencyScore}\n`);
          setResult(prev => prev + `Is Correct: ${testResult.isCorrect}\n`);
        } else {
          setResult(prev => prev + 'Assessment returned null - please try speaking louder\n');
        }
      }
    } catch (error) {
      setResult(prev => prev + `Error: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnvironment = () => {
    const envInfo = {
      'VITE_MICROSOFT_SPEECH_KEY': !!(import.meta.env.VITE_MICROSOFT_SPEECH_KEY),
      'REACT_APP_MICROSOFT_SPEECH_KEY': !!(import.meta.env.REACT_APP_MICROSOFT_SPEECH_KEY),
      'VITE_MICROSOFT_SPEECH_REGION': import.meta.env.VITE_MICROSOFT_SPEECH_REGION,
      'REACT_APP_MICROSOFT_SPEECH_REGION': import.meta.env.REACT_APP_MICROSOFT_SPEECH_REGION,
    };
    
    setResult(`Environment Check:\n${JSON.stringify(envInfo, null, 2)}`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Microsoft Speech API Test</h1>
      
      <button onClick={checkEnvironment} style={{ margin: '10px', padding: '10px' }}>
        Check Environment Variables
      </button>
      
      <button onClick={testSDKDirectly} style={{ margin: '10px', padding: '10px' }}>
        Test SDK Directly
      </button>
      
      <button onClick={forceReinitialize} style={{ margin: '10px', padding: '10px', backgroundColor: '#ff6b1d', color: 'white' }}>
        Force Reinitialize Service
      </button>
      
      <button 
        onClick={testMicrosoftSpeech} 
        disabled={isLoading}
        style={{ margin: '10px', padding: '10px' }}
      >
        {isLoading ? 'Testing...' : 'Test Microsoft Speech API'}
      </button>
      
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        minHeight: '200px',
        whiteSpace: 'pre-wrap'
      }}>
        {result || 'Click a button to start testing...'}
      </pre>
    </div>
  );
}