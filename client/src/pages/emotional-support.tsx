import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmotionalChat } from "@/components/chat/emotional-chat";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Link } from "wouter";
import { 
  MessageCircle, 
  Brain, 
  Home, 
  ArrowLeft, 
  Heart,
  Shield,
  Clock,
  MessageSquare,
  Headphones,
  Users
} from "lucide-react";

interface ChatSession {
  id: string;
  emotionDetected?: string;
  supportType?: string;
  messagesCount: number;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  emotion?: string;
  confidence?: number;
  createdAt: string;
}

export default function EmotionalSupport() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // WebSocket for real-time chat
  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'ai_response') {
        setIsTyping(false);
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'ai',
          message: data.data.response,
          emotion: data.data.emotion,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setIsTyping(false);
    }
  });

  // Create new chat session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chat/session');
      return response.json();
    },
    onSuccess: (session: ChatSession) => {
      setCurrentSession(session);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'ai',
        message: "Hello! I'm here to provide emotional support and listen to whatever you'd like to share. How are you feeling today?",
        createdAt: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start chat session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { sessionId: string; message: string; voiceTone?: string }) => {
      const response = await apiRequest('POST', '/api/chat/message', data);
      return response.json();
    },
    onSuccess: (result) => {
      // Update session with detected emotion
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          emotionDetected: result.analysis.emotion,
          supportType: result.analysis.supportType,
          messagesCount: currentSession.messagesCount + 2
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (message: string, voiceTone?: string) => {
    if (!currentSession) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Send via WebSocket for real-time response
    if (isConnected) {
      sendMessage({
        type: 'chat_message',
        content: message,
        voiceTone,
        sessionId: currentSession.id
      });
    }

    // Also send via HTTP API for persistence
    sendMessageMutation.mutate({
      sessionId: currentSession.id,
      message,
      voiceTone
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Brain className="text-white text-lg" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-purple-600">Fluenti</span>
                  <p className="text-sm text-gray-600">Emotional Support</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentSession && (
                <Badge className="bg-green-100 text-green-700 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connected</span>
                </Badge>
              )}
              <Link href="/">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentSession ? (
          /* Welcome Screen */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Emotional Support Chat
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Connect with our AI therapist for emotional support, stress relief, and mental wellness guidance. 
                Your conversations are private and confidential.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
              {/* Features */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Emotion Recognition</h3>
                    <p className="text-gray-600">AI analyzes your messages to detect emotional states and provide targeted support.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversational Therapy</h3>
                    <p className="text-gray-600">Evidence-based CBT techniques delivered through natural, empathetic conversations.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
                    <p className="text-gray-600">End-to-end encryption ensures your conversations remain completely confidential.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-orange-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Availability</h3>
                    <p className="text-gray-600">Get support whenever you need it, day or night.</p>
                  </div>
                </div>
              </div>

              {/* Chat Preview */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8">
                <Card className="fluenti-card">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <Brain className="text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">AI Therapist</CardTitle>
                        <Badge className="bg-green-100 text-green-600 text-xs">
                          Available Now
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">
                        "I'm here to listen and support you through whatever you're experiencing. 
                        Whether you're feeling stressed, anxious, or just need someone to talk to, 
                        I'm here for you."
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Headphones className="h-4 w-4" />
                      <span>Voice and text support available</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="text-center">
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-xl rounded-xl font-semibold"
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2" />
                    Start Conversation
                  </>
                )}
              </Button>
              
              <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Confidential</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Judgment-free</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Professional support</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Session */
          <div className="max-w-4xl mx-auto">
            <EmotionalChat
              messages={messages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              currentEmotion={currentSession.emotionDetected}
              isConnected={isConnected}
            />
          </div>
        )}
      </main>
    </div>
  );
}
