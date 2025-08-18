import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface Message {
  user: string;
  ai: string;
  emotion?: string;
  timestamp?: number;
}

interface EmotionalVoiceChatProps {
  language: 'english' | 'urdu';
}

const EmotionalVoiceChat = ({ language }: EmotionalVoiceChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { startRecording, stopRecording, isRecording } = useSpeechRecognition();

  const handleVoiceInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('mode', 'voice');
      formData.append('language', language === 'urdu' ? 'ur' : 'en');
      formData.append('audio', audioBlob);
      formData.append('history', JSON.stringify(messages));

      const response = await fetch('/api/emotional-support', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.response) {
        const newMessage: Message = {
          user: data.transcription || 'Voice input...',
          ai: data.response,
          emotion: data.emotion,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, newMessage]);
        setCurrentEmotion(data.emotion || '');
        setCurrentResponse(data.response);

        // Debug logging
        console.log('New AI response set:', data.response);
        console.log('Speech synthesis available:', !!window.speechSynthesis);
        
        // The ThreeAvatar component should handle speaking automatically
        if (data.response) {
          console.log('AI will speak:', data.response);
        }
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      setCurrentResponse(language === 'urdu' 
        ? 'معذرت، کوئی خرابی ہوئی ہے' 
        : 'Sorry, there was an error processing your voice.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await handleVoiceInput(audioBlob);
      }
    } else {
      startRecording();
    }
  };

  const testSpeak = () => {
    const testMessage = language === 'urdu' 
      ? 'یہ ایک ٹیسٹ میسج ہے' 
      : 'This is a test message';
    setCurrentResponse(testMessage);
  };

  const handleAvatarSpeak = (text: string) => {
    console.log('Avatar speaking:', text);
    
    // Ensure audio context is enabled (user gesture required)
    if (window.speechSynthesis) {
      // Small delay to ensure proper audio context
      setTimeout(() => {
        console.log('Speech synthesis ready');
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">
          {language === 'urdu' 
            ? 'آواز کے ذریعے جذباتی مدد' 
            : 'Voice Emotional Support'
          }
        </h2>
        {currentEmotion && (
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-semibold">
              {language === 'urdu' ? 'موجودہ جذبات: ' : 'Current Emotion: '}
            </span>
            {currentEmotion}
          </p>
        )}
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center mb-6">
        <ThreeAvatar
          currentMessage={currentResponse}
          language={language}
          isListening={isRecording}
          onSpeak={handleAvatarSpeak}
          className="w-64 h-64"
        />
      </div>

      {/* Voice Controls */}
      <div className="flex justify-center mb-6 space-x-4">
        <Button 
          onClick={handleRecordingToggle}
          disabled={isLoading}
          size="lg"
          className={`px-8 py-4 text-lg font-semibold ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading
            ? (language === 'urdu' ? 'پروسیسنگ...' : 'Processing...')
            : isRecording
              ? (language === 'urdu' ? 'رک جائیں 🛑' : 'Stop Speaking 🛑')
              : (language === 'urdu' ? 'بولنا شروع کریں 🎤' : 'Start Speaking 🎤')
          }
        </Button>
        
        <Button
          onClick={testSpeak}
          variant="outline"
          size="lg"
          className="px-4 py-4"
        >
          {language === 'urdu' ? 'آواز ٹیسٹ 🔊' : 'Test Voice 🔊'}
        </Button>
      </div>

      {/* Status Indicator */}
      {isRecording && (
        <div className="text-center mb-4">
          <p className="text-red-500 font-semibold animate-pulse">
            {language === 'urdu' ? '🎤 سن رہا ہے...' : '🎤 Listening...'}
          </p>
        </div>
      )}

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-gray-50 rounded-lg p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">
              {language === 'urdu' 
                ? 'بات چیت شروع کرنے کے لیے مائیک بٹن دبائیں' 
                : 'Press the microphone button to start talking'
              }
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="space-y-3">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="max-w-xs lg:max-w-md px-4 py-2 bg-blue-500 text-white rounded-lg shadow">
                  <p className="font-medium">
                    {language === 'urdu' ? 'آپ:' : 'You:'}
                  </p>
                  <p>{message.user}</p>
                  {message.emotion && (
                    <p className="text-xs mt-1 opacity-80">
                      {language === 'urdu' ? 'جذبات:' : 'Emotion:'} {message.emotion}
                    </p>
                  )}
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 bg-green-500 text-white rounded-lg shadow">
                  <p className="font-medium">
                    {language === 'urdu' ? 'AI مددگار:' : 'AI Helper:'}
                  </p>
                  <p>{message.ai}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          {language === 'urdu'
            ? 'مائیک بٹن دبا کر بولیں، پھر دوبارہ دبا کر رک جائیں'
            : 'Press the microphone button to speak, then press again to stop'
          }
        </p>
      </div>
    </div>
  );
};

export { EmotionalVoiceChat };
