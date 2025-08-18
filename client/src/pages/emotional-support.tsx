import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const EmotionalSupportChat = () => {
  const language = localStorage.getItem('language') || 'en';  // From dashboard
  const [messages, setMessages] = useState<{ id: string; user: string; ai: string; timestamp: Date }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage = input.trim();
    setInput(''); // Clear input immediately
    
    try {
      const formData = new FormData();
      formData.append('mode', 'chat');
      formData.append('language', language);
      formData.append('text', userMessage);
      formData.append('history', JSON.stringify(messages.map(m => ({ user: m.user, ai: m.ai }))));

      const res = await fetch('/api/emotional-support', { method: 'POST', body: formData });
      const data = await res.json();
      
      // Add new message
      const newMessage = {
        id: Date.now().toString(),
        user: userMessage,
        ai: data.response || "I understand. Can you tell me more?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        user: userMessage,
        ai: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-4xl mx-auto p-6">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Chat Mode</h1>
          <p className="text-muted-foreground">
            Language: {language === 'ur' ? 'اردو' : 'English'}
          </p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 border rounded-lg p-4 mb-4 min-h-[400px] max-h-[600px] overflow-y-auto bg-muted/20">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-[80%]">
                      <p>{message.user}</p>
                    </div>
                  </div>
                  
                  {/* AI response */}
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-lg max-w-[80%]">
                      <p>{message.ai}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} 
            placeholder={language === 'ur' ? 'اپنا پیغام یہاں لکھیں...' : 'Type your message here...'}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmotionalSupportChat;
