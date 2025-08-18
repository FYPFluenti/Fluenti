import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmotionalChat } from '@/components/chat/emotional-chat';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

const EmotionalSupportVoice = () => {
  const language = localStorage.getItem('language') || 'en';
  const [history, setHistory] = useState<{ user: string; ai: string }[]>([]);
  const [emotion, setEmotion] = useState('');
  const [response, setResponse] = useState('');
  const { startRecording, stopRecording, isRecording } = useSpeechRecognition();

  const handleInput = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('mode', 'voice');
    formData.append('language', language);
    formData.append('audio', blob);
    formData.append('history', JSON.stringify(history));

    const res = await fetch('/api/emotional-support', { method: 'POST', body: formData });
    const data = await res.json();
    setEmotion(data.emotion);
    setResponse(data.response);
    setHistory([...history, { user: data.transcription, ai: data.response }]);
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        await handleInput(blob);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div>
      <ThreeAvatar 
        currentMessage={response} 
        language={language === 'ur' ? 'urdu' : 'english'}
        isListening={isRecording}
        onSpeak={(text) => console.log('Speaking:', text)}
      />  {/* Talks back */}
      <EmotionalChat language={language === 'ur' ? 'urdu' : 'english'} />
      <Button onClick={handleRecordingToggle}>
        {isRecording ? 'Stop Speaking' : 'Start Speaking'}
      </Button>
    </div>
  );
};

export default EmotionalSupportVoice;
