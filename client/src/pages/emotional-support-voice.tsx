import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';

const EmotionalSupportVoice = () => {
  const language = localStorage.getItem('language') || 'en';
  const supportLanguage = language === 'ur' ? 'urdu' : 'english';
  const [history, setHistory] = useState<{ user: string; ai: string }[]>([]);
  const [emotion, setEmotion] = useState('');
  const [response, setResponse] = useState('');
  const { startRecording, stopRecording, isRecording } = useSpeechRecognition();

  const handleRecordStop = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('mode', 'voice');
      formData.append('language', language);
      formData.append('audio', blob, 'voice.wav');
      formData.append('history', JSON.stringify(history));

      const res = await fetch('/api/emotional-support', { method: 'POST', body: formData });
      const data = await res.json();
      
      setEmotion(data.emotion || 'neutral');
      setResponse(data.response || 'Processing your voice...');
      setHistory([...history, { user: data.transcription || 'Voice input received', ai: data.response || 'Processing...' }]);
    } catch (error) {
      console.error('Error processing voice input:', error);
      setResponse('Sorry, there was an error processing your voice input.');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 p-4">
        <ThreeAvatar 
          isListening={isRecording}
          currentMessage={response}
          language={supportLanguage}
        />
      </div>
      
      
      <div className="p-4 bg-gray-100">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={() => isRecording ? stopRecording(handleRecordStop) : startRecording()}
            className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            size="lg"
          >
            {isRecording ? 'Stop Speaking' : 'Start Speaking'}
          </Button>
          
          {response && (
            <div className="mt-4 p-3 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Last response:</p>
              <p className="text-gray-800">{response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionalSupportVoice;
