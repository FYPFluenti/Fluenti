import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Heart, 
  Brain,
  MessageCircle,
  Smile,
  Frown,
  Meh
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  emotion?: string;
  confidence?: number;
  createdAt: string;
}

interface EmotionalChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, voiceTone?: string) => void;
  isTyping?: boolean;
  currentEmotion?: string;
  isConnected?: boolean;
}

export function EmotionalChat({
  messages,
  onSendMessage,
  isTyping = false,
  currentEmotion,
  isConnected = false
}: EmotionalChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle voice input
  useEffect(() => {
    if (transcript && !isListening && isVoiceMode) {
      setInputMessage(transcript);
      handleSendMessage(transcript);
      resetTranscript();
      setIsVoiceMode(false);
    }
  }, [transcript, isListening, isVoiceMode]);

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend) return;

    onSendMessage(messageToSend);
    setInputMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      resetTranscript();
      startListening();
      setIsVoiceMode(true);
    }
  };

  const speakMessage = (message: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  const getEmotionIcon = (emotion?: string) => {
    switch (emotion?.toLowerCase()) {
      case 'happy':
      case 'joy':
      case 'excited':
        return <Smile className="h-4 w-4 text-green-500" />;
      case 'sad':
      case 'depressed':
      case 'grief':
        return <Frown className="h-4 w-4 text-blue-500" />;
      case 'angry':
      case 'frustrated':
        return <Frown className="h-4 w-4 text-red-500" />;
      case 'anxious':
      case 'stressed':
      case 'worried':
        return <Frown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Meh className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion?.toLowerCase()) {
      case 'happy':
      case 'joy':
        return 'text-green-600 bg-green-50';
      case 'sad':
      case 'depressed':
        return 'text-blue-600 bg-blue-50';
      case 'angry':
      case 'frustrated':
        return 'text-red-600 bg-red-50';
      case 'anxious':
      case 'stressed':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      {/* Chat Header */}
      <Card className="fluenti-card mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Brain className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Therapist</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    {isConnected ? 'Online' : 'Connecting...'}
                  </Badge>
                  {currentEmotion && (
                    <Badge className={`text-xs ${getEmotionColor(currentEmotion)}`}>
                      {getEmotionIcon(currentEmotion)}
                      <span className="ml-1 capitalize">{currentEmotion}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:bg-purple-50"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="fluenti-card flex-1 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      {message.sender === 'ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          onClick={() => speakMessage(message.message)}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {message.emotion && (
                        <div className="flex items-center space-x-1">
                          {getEmotionIcon(message.emotion)}
                          {message.confidence && (
                            <span className="text-xs text-gray-400">
                              {Math.round(message.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={isVoiceMode ? transcript : inputMessage}
                  onChange={handleTextareaChange}
                  placeholder={isVoiceMode ? "Listening..." : "Share your thoughts..."}
                  className="resize-none min-h-[44px] max-h-[120px]"
                  disabled={isVoiceMode || isTyping}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              
              <div className="flex space-x-2">
                {isSupported && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceToggle}
                    disabled={isTyping}
                    className={`p-2 ${
                      isListening ? 'bg-red-50 border-red-200 text-red-600' : 'hover:bg-purple-50'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && !transcript) || isTyping || isVoiceMode}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Voice Mode Indicator */}
            {isVoiceMode && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center space-x-2 text-sm text-purple-600">
                  <div className="speech-wave">
                    <div className="speech-wave-bar"></div>
                    <div className="speech-wave-bar"></div>
                    <div className="speech-wave-bar"></div>
                    <div className="speech-wave-bar"></div>
                    <div className="speech-wave-bar"></div>
                  </div>
                  <span>Listening... Speak your mind</span>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-2 text-xs text-gray-500 text-center">
              <span>Press Enter to send • Shift+Enter for new line</span>
              {isSupported && <span> • Click mic for voice input</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
