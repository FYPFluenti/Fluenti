import { EmotionalVoiceChat } from '@/components/chat/emotional-voice-chat';

const EmotionalSupportVoice = () => {
  const language = localStorage.getItem('language') || 'en';

  return (
    <div className="h-screen flex flex-col">
      <EmotionalVoiceChat language={language === 'ur' ? 'urdu' : 'english'} />
    </div>
  );
};

export default EmotionalSupportVoice;
