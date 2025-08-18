import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { EmotionalChat } from '@/components/chat/emotional-chat';
import { ThreeAvatar } from '@/components/ui/three-avatar';

const EmotionalSupportChat = () => {
  const language = localStorage.getItem('language') || 'en';  // From dashboard
  const [history, setHistory] = useState<{ user: string; ai: string }[]>([]);
  const [emotion, setEmotion] = useState('');
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');

  const handleSend = async () => {
    const formData = new FormData();
    formData.append('mode', 'chat');
    formData.append('language', language);
    formData.append('text', input);
    formData.append('history', JSON.stringify(history));

    const res = await fetch('/api/emotional-support', { method: 'POST', body: formData });
    const data = await res.json();
    setEmotion(data.emotion);
    setResponse(data.response);
    setHistory([...history, { user: input, ai: data.response }]);
    setInput('');
  };

  return (
    <div>
      <ThreeAvatar 
        currentMessage={response} 
        language={language === 'ur' ? 'urdu' : 'english'}
        onSpeak={(text) => console.log('Speaking:', text)}
      />  {/* Visual reaction */}
      <EmotionalChat language={language === 'ur' ? 'urdu' : 'english'} />
      <Input 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
        placeholder="Type your message..." 
      />
    </div>
  );
};

export default EmotionalSupportChat;
