import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';

const EmotionalSupportVoice = () => {
  const language = localStorage.getItem('language') || 'en';
  const supportLanguage = language === 'ur' ? 'urdu' : 'english';
  const [history, setHistory] = useState<{ user: string; ai: string }[]>([]);
  const [emotion, setEmotion] = useState('');
  const [response, setResponse] = useState('');
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const { startRecording, stopRecording, isRecording } = useSpeechRecognition();

  // Check therapy service status on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const res = await fetch('http://localhost:5001/health');
        if (res.ok) {
          setServiceStatus('online');
        } else {
          setServiceStatus('offline');
        }
      } catch (error) {
        setServiceStatus('offline');
      }
    };
    
    checkServiceStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRecordStop = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('mode', 'voice');
      formData.append('language', language);
      formData.append('audio', blob, 'voice.wav');
      formData.append('history', JSON.stringify(history));
      formData.append('requestTTS', 'true'); // Request audio response

      console.log('🎙️ Sending voice input to therapy service...');
      const res = await fetch('/api/emotional-support', { method: 'POST', body: formData });
      const data = await res.json();
      
      console.log('📥 Therapy service response:', data);
      
      if (data.success) {
        // Handle successful therapy response
        setEmotion(data.emotion || 'neutral');
        setResponse(data.response || 'Processing your voice...');
        setHistory([...history, { 
          user: data.transcription || 'Voice input received', 
          ai: data.response || 'Processing...' 
        }]);

        // Handle crisis detection
        if (data.isCrisis && data.crisisLevel) {
          console.warn('🚨 Crisis detected:', data.crisisLevel);
          // You could add visual crisis indicators here
        }

        // Set TTS audio for ThreeAvatar to handle
        if (data.audioBase64) {
          console.log('🔊 Received TTS audio, passing to ThreeAvatar');
          setAudioBase64(data.audioBase64);
        } else {
          setAudioBase64(''); // Clear audio if none provided
        }
      } else {
        // Handle error response with crisis resources
        setResponse(data.response || 'Sorry, there was an error processing your voice input.');
        if (data.fallback) {
          console.warn('⚠️ Using fallback response due to service issues');
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      setResponse('Sorry, there was an error processing your voice input. If you\'re in crisis, please contact 988 (Suicide & Crisis Lifeline) or 911.');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 p-4">
        <ThreeAvatar 
          isListening={isRecording}
          currentMessage={response}
          language={supportLanguage}
          audioBase64={audioBase64}
          voiceModel={audioBase64 ? 'coqui' : 'browser'}
          enableLipSync={true}
        />
      </div>
      
      
      <div className="p-4 bg-gray-100">
        <div className="max-w-md mx-auto">
          {/* Service Status Indicator */}
          <div className="mb-3 text-center">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              serviceStatus === 'online' ? 'bg-green-100 text-green-800' :
              serviceStatus === 'offline' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${
                serviceStatus === 'online' ? 'bg-green-400' :
                serviceStatus === 'offline' ? 'bg-red-400' :
                'bg-yellow-400 animate-pulse'
              }`}></span>
              Therapy Service: {serviceStatus === 'checking' ? 'Connecting...' : serviceStatus}
            </span>
          </div>
          
          <Button 
            onClick={() => isRecording ? stopRecording(handleRecordStop) : startRecording()}
            className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            size="lg"
            disabled={serviceStatus === 'offline'}
          >
            {isRecording ? 'Stop Speaking' : 'Start Speaking'}
          </Button>
          
          {response && (
            <div className="mt-4 p-3 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">AI Therapist:</p>
              <p className="text-gray-800">{response}</p>
              {emotion && (
                <p className="text-xs text-blue-600 mt-1">Detected emotion: {emotion}</p>
              )}
            </div>
          )}

          {serviceStatus === 'offline' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Therapy service is offline. Please ensure the Python service is running.
                <br />
                <span className="text-xs">If you're in crisis, please contact 988 or 911.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionalSupportVoice;
