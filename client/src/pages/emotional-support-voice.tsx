import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ModelViewerAvatar from '@/components/ModelViewerAvatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';
import SharedSidebarEmotional from '@/components/layout/SharedSidebarEmotional';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';

const avatarUrls = {
 therapist: "https://models.readyplayer.me/68ab4a2c3f2023411197a0fa.glb" ,
  professional: "https://models.readyplayer.me/68ab4ab5e05b84c2efb26767.glb", 
  casual: "https://models.readyplayer.me/68aa261a75e83eeb00564816.glb",  
};

const EmotionalSupportVoice = () => {
  const language = localStorage.getItem('language') || 'en';
  const supportLanguage = language === 'ur' ? 'urdu' : 'english';
  const [history, setHistory] = useState<{ user: string; ai: string }[]>([]);
  const [emotion, setEmotion] = useState('');
  const [response, setResponse] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
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
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <SharedSidebarEmotional 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="voice"
      />

      {/* Main Content */}
      <div className="ml-20 flex-1 flex flex-col">
        <PageHeader />
        
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <ModelViewerAvatar
              avatarUrl={avatarUrls.therapist}
              size="large"
              className="mx-auto mb-8"
            />
            
            {isRecording && (
              <div className="mt-4 text-[#ff6b1d] font-semibold animate-pulse">
                Listening...
              </div>
            )}
            
            {response && (
              <div className="mt-4 p-4 bg-card border border-border rounded-xl shadow-lg max-w-lg mx-auto">
                <p className="text-sm text-muted-foreground mb-2">AI Response:</p>
                <p className="text-foreground text-lg">{response}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-muted border-t border-border">
          <div className="max-w-md mx-auto">
            <Button 
              onClick={() => isRecording ? stopRecording(handleRecordStop) : startRecording()}
              className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#ff6b1d] hover:bg-[#e55a1a]'}`}
              size="lg"
            >
              {isRecording ? 'Stop Speaking' : 'Start Speaking'}
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
};

export default EmotionalSupportVoice;
