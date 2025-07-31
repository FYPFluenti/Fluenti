import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Heart, 
  Smile, 
  Frown, 
  Meh, 
  MessageCircle,
  Bot,
  User,
  Mic,
  MicOff
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  emotion?: 'happy' | 'sad' | 'neutral' | 'anxious' | 'excited';
}

interface EmotionalChatProps {
  language?: 'english' | 'urdu';
  onClose?: () => void;
}

export function EmotionalChat({ language = 'english', onClose }: EmotionalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<'happy' | 'sad' | 'neutral' | 'anxious' | 'excited'>('neutral');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Initial welcome message
    const welcomeMessage: Message = {
      id: '1',
      content: language === 'urdu' 
        ? 'سلام! میں یہاں آپ کی مدد کے لیے ہوں۔ آپ کیسا محسوس کر رہے ہیں؟'
        : 'Hello! I\'m here to support you. How are you feeling today?',
      sender: 'ai',
      timestamp: new Date(),
      emotion: 'happy'
    };
    setMessages([welcomeMessage]);
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectEmotion = (text: string): 'happy' | 'sad' | 'neutral' | 'anxious' | 'excited' => {
    const lowerText = text.toLowerCase();
    
    const happyWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'joy', 'smile'];
    const sadWords = ['sad', 'down', 'depressed', 'unhappy', 'crying', 'hurt', 'pain', 'difficult'];
    const anxiousWords = ['worried', 'anxious', 'nervous', 'scared', 'fear', 'stress', 'overwhelmed'];
    const excitedWords = ['excited', 'thrilled', 'pumped', 'energetic', 'enthusiastic'];

    if (happyWords.some(word => lowerText.includes(word))) return 'happy';
    if (sadWords.some(word => lowerText.includes(word))) return 'sad';
    if (anxiousWords.some(word => lowerText.includes(word))) return 'anxious';
    if (excitedWords.some(word => lowerText.includes(word))) return 'excited';
    
    return 'neutral';
  };

  const generateResponse = (userMessage: string, emotion: string): string => {
    const responses = {
      english: {
        happy: [
          "That's wonderful to hear! Your positive energy is contagious. What's been making you feel so good?",
          "I'm so glad you're feeling happy! It's important to celebrate these moments. Tell me more about what's going well.",
          "Your happiness brings me joy too! What would you like to share about your good mood?"
        ],
        sad: [
          "I hear that you're going through a difficult time. It's okay to feel sad - your feelings are valid. Would you like to talk about what's troubling you?",
          "I'm here to listen and support you. Sometimes talking about our sadness can help us process it. What's on your mind?",
          "Thank you for sharing how you feel with me. Sadness is part of the human experience. How can I best support you right now?"
        ],
        anxious: [
          "I understand you're feeling anxious. That can be really overwhelming. Let's take this one step at a time. What's causing you worry?",
          "Anxiety can feel very intense. You're being brave by reaching out. Would some breathing exercises help, or would you prefer to talk?",
          "I'm here with you through this anxious moment. You're not alone. What thoughts are racing through your mind?"
        ],
        excited: [
          "Your excitement is infectious! I love hearing when people are enthusiastic about something. What has you so energized?",
          "That's fantastic energy! Excitement can be such a powerful motivator. Tell me what's got you feeling so pumped up!",
          "I can feel your enthusiasm! It's wonderful to see you so excited. What's the source of all this positive energy?"
        ],
        neutral: [
          "I appreciate you sharing with me. Sometimes we don't have strong emotions, and that's perfectly normal. What's on your mind today?",
          "Thank you for opening up. Not every day is filled with intense emotions, and that's okay. How has your day been?",
          "I'm here to listen, whether you're feeling strongly about something or just need someone to talk to. What would you like to discuss?"
        ]
      },
      urdu: {
        happy: [
          "یہ سن کر بہت خوشی ہوئی! آپ کی مثبت توانائی متاثر کن ہے۔ کیا چیز آپ کو اتنا خوش کر رہی ہے؟",
          "میں خوش ہوں کہ آپ خوش محسوس کر رہے ہیں! ان لمحوں کا جشن منانا ضروری ہے۔ مجھے بتائیں کہ کیا اچھا ہو رہا ہے۔"
        ],
        sad: [
          "میں سمجھ رہا ہوں کہ آپ مشکل وقت سے گزر رہے ہیں۔ اداس محسوس کرنا ٹھیک ہے - آپ کے جذبات قابل قدر ہیں۔ کیا آپ بتانا چاہیں گے کہ کیا پریشان کر رہا ہے؟",
          "میں یہاں سننے اور آپ کی مدد کے لیے ہوں۔ کبھی کبھی اپنے غم کے بارے میں بات کرنا اسے سمجھنے میں مدد کرتا ہے۔"
        ],
        anxious: [
          "میں سمجھتا ہوں کہ آپ پریشان محسوس کر رہے ہیں۔ یہ واقعی دباؤ والا ہو سکتا ہے۔ آئیے اسے قدم بہ قدم لیتے ہیں۔ کیا پریشان کر رہا ہے؟"
        ],
        excited: [
          "آپ کا جوش متاثر کن ہے! جب لوگ کسی چیز کے بارے میں پرجوش ہوتے ہیں تو مجھے سن کر اچھا لگتا ہے۔ کیا چیز آپ کو اتنا پرجوش بنا رہی ہے؟"
        ],
        neutral: [
          "آپ کا مجھ سے بانٹنا قابل تعریف ہے۔ کبھی کبھی ہمارے پاس شدید جذبات نہیں ہوتے، اور یہ بالکل نارمل ہے۔ آج آپ کے ذہن میں کیا ہے؟"
        ]
      }
    };

    const emotionResponses = responses[language as keyof typeof responses]?.[emotion as keyof typeof responses.english] || responses.english.neutral;
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Detect emotion and generate response
    const detectedEmotion = detectEmotion(inputMessage);
    setCurrentEmotion(detectedEmotion);

    // Simulate AI processing time
    setTimeout(() => {
      const response = generateResponse(inputMessage, detectedEmotion);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        emotion: detectedEmotion
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const getEmotionIcon = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return <Smile className="w-4 h-4 text-green-500" />;
      case 'sad': return <Frown className="w-4 h-4 text-blue-500" />;
      case 'anxious': return <Frown className="w-4 h-4 text-orange-500" />;
      case 'excited': return <Heart className="w-4 h-4 text-pink-500" />;
      default: return <Meh className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return 'bg-green-100 border-green-200';
      case 'sad': return 'bg-blue-100 border-blue-200';
      case 'anxious': return 'bg-orange-100 border-orange-200';
      case 'excited': return 'bg-pink-100 border-pink-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <Card>
          <CardContent className="p-6">
            <ThreeAvatar
              isListening={isListening}
              currentMessage={messages[messages.length - 1]?.sender === 'ai' ? messages[messages.length - 1]?.content : ''}
              language={language}
            />
            
            <div className="mt-4 text-center">
              <Badge variant="outline" className="flex items-center space-x-2">
                {getEmotionIcon(currentEmotion)}
                <span className="capitalize">{currentEmotion}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Emotional Support Chat</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : `${getEmotionColor(message.emotion)} text-gray-800`
                    }`}>
                      <div className="flex items-start space-x-2">
                        {message.sender === 'ai' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                        {message.sender === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.emotion && message.sender === 'ai' && (
                              <div className="flex items-center space-x-1">
                                {getEmotionIcon(message.emotion)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 border-gray-200 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce bounce-delay-1"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce bounce-delay-2"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce bounce-delay-3"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={language === 'urdu' ? 'یہاں اپنا پیغام لکھیں...' : 'Type your message here...'}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}