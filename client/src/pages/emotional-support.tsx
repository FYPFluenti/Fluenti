import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Heart, MessageCircle } from 'lucide-react';
import SharedSidebarEmotional from '@/components/layout/SharedSidebarEmotional';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';

interface Message {
  id: string;
  user: string;
  ai: string;
  timestamp: Date;
  crisisLevel?: string;
  isCrisis?: boolean;
}

interface SessionData {
  sessionId?: string;
  userId?: string;
  sessionKey?: string;
}

const EmotionalSupport = () => {
  const language = localStorage.getItem('language') || 'en';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isContinuedSession, setIsContinuedSession] = useState(false);
  const [continuedSessionTitle, setContinuedSessionTitle] = useState<string>('');

  // Check service health and handle session continuation on component mount
  useEffect(() => {
    checkServiceHealth();
    handleSessionContinuation();
  }, []);

  const handleSessionContinuation = () => {
    try {
      const continuingSessionData = localStorage.getItem('continuingSession');
      if (continuingSessionData) {
        const sessionInfo = JSON.parse(continuingSessionData);
        
        // Set session data for continuation
        setSessionData({
          sessionId: sessionInfo.sessionId,
          userId: sessionInfo.userId,
          sessionKey: sessionInfo.sessionKey
        });

        // Restore previous messages if available
        if (sessionInfo.messages && sessionInfo.messages.length > 0) {
          const restoredMessages: Message[] = sessionInfo.messages.map((msg: any, index: number) => ({
            id: `restored_${index}`,
            user: msg.role === 'user' ? msg.content : '',
            ai: msg.role === 'assistant' ? msg.content : '',
            timestamp: new Date(msg.timestamp || Date.now()),
            crisisLevel: 'none',
            isCrisis: false
          })).filter((msg: Message) => msg.user || msg.ai);

          setMessages(restoredMessages);
        }

        // Set continuation indicators
        setIsContinuedSession(true);
        setContinuedSessionTitle(sessionInfo.title || 'Previous Session');

        // Clear the continuation data
        localStorage.removeItem('continuingSession');
        
        console.log('🔄 Continuing session:', sessionInfo.title);
      }
    } catch (error) {
      console.error('Error handling session continuation:', error);
      localStorage.removeItem('continuingSession'); // Clear invalid data
    }
  };

  const checkServiceHealth = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/therapy/health');
      const data = await res.json();
      setServiceStatus(data.success && data.python_service?.status === 'healthy' ? 'healthy' : 'unhealthy');
    } catch (error) {
      console.error('Health check failed:', error);
      setServiceStatus('unhealthy');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage = input.trim();
    setInput(''); // Clear input immediately
    
    try {
      const res = await fetch('http://localhost:3000/api/emotional-support-chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          language: language,
          sessionId: sessionData.sessionId,
          userId: sessionData.userId,
          sessionKey: sessionData.sessionKey
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Update session data if new session or session data returned
      if (data.sessionId || data.userId || data.sessionKey) {
        setSessionData({
          sessionId: data.sessionId || sessionData.sessionId,
          userId: data.userId || sessionData.userId,
          sessionKey: data.sessionKey || sessionData.sessionKey
        });
      }
      
      // Add new message with crisis information
      const newMessage: Message = {
        id: Date.now().toString(),
        user: userMessage,
        ai: data.chatResponse || data.response || "I understand. Can you tell me more?",
        timestamp: new Date(),
        crisisLevel: data.crisisLevel,
        isCrisis: data.isCrisis
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Show welcome message if it's a new session
      if (data.newSession && data.welcomeMessage && data.welcomeMessage !== data.chatResponse) {
        const welcomeMessage: Message = {
          id: (Date.now() - 1).toString(),
          user: '',
          ai: data.welcomeMessage,
          timestamp: new Date(),
          crisisLevel: 'none',
          isCrisis: false
        };
        setMessages(prev => [welcomeMessage, ...prev.slice(-1)]);
      }
      
    } catch (error) {
      console.error('Error:', error);
      // Add error message with crisis resources
      const errorMessage: Message = {
        id: Date.now().toString(),
        user: userMessage,
        ai: `I'm sorry, I'm having trouble responding right now. Please try again.

If you're in immediate crisis, please contact:
• 1019 - Mental Health Crisis Line (24/7)
• 1166 - National Emergency Helpline
• 0800-00-100 - Rozan Crisis Helpline

Your wellbeing is important.`,
        timestamp: new Date(),
        crisisLevel: 'none',
        isCrisis: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <SharedSidebarEmotional 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="chat"
      />

      {/* Main Content */}
      <div className="ml-20 flex-1 flex flex-col h-screen overflow-hidden relative">
        <PageHeader />
        
        {/* Service Status - Top Right Corner (below header) */}
        <div className="absolute top-20 right-4 z-10">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            serviceStatus === 'healthy' 
              ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-600' 
              : serviceStatus === 'unhealthy' 
              ? 'bg-red-500/20 border border-red-400/30 text-red-600'
              : 'bg-amber-500/20 border border-amber-400/30 text-amber-600'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              serviceStatus === 'healthy' ? 'bg-emerald-500' :
              serviceStatus === 'unhealthy' ? 'bg-red-500' :
              'bg-amber-500 animate-pulse'
            }`}></div>
            <span>
              {serviceStatus === 'unknown' ? 'Checking...' : serviceStatus === 'healthy' ? 'online' : 'offline'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col max-w-4xl mx-auto p-6 overflow-hidden">
        {/* Service Status Alert */}
        {serviceStatus === 'unhealthy' && (
          <div className="mb-4 space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                The therapy service is currently unavailable. If you're in crisis, please contact:
                <br />
                <strong>1019</strong> - Mental Health Crisis Line or <strong>1166</strong> - National Emergency
              </AlertDescription>
            </Alert>
            
            {/* Crisis Resources Banner - Only when service is offline */}
            <div className="bg-muted/40 backdrop-blur-sm border border-border/50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-xs">
                <Heart className="w-3 h-3 text-blue-400" />
                <span className="text-foreground/80">
                  <span className="font-medium">Crisis Resources:</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">1019</span> <span className="text-blue-400">(Mental Health Crisis)</span>
                  <span className="mx-2">•</span>  
                  <span className="font-semibold">1166</span> <span className="text-blue-400">(Emergency)</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">0800-00-100</span> <span className="text-blue-400">(Rozan Crisis)</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Session Continuation Banner */}
        {isContinuedSession && (
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-800">
                    Continuing Previous Session
                  </h4>
                  <p className="text-xs text-blue-600 mt-1">
                    {continuedSessionTitle} • Previous conversation restored
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsContinuedSession(false)}
                  className="text-blue-600 hover:bg-blue-100"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}

          {/* Chat Messages */}
          <div className="flex-1 rounded-lg p-4 mb-4 overflow-y-auto bg-muted/20 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Welcome to Fluenti</h3>
              <p>Your AI-powered companion for emotional wellness and mental health support.</p>
              <p className="text-sm mt-2">Share what's on your mind - I'm here to listen and help.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {/* User message */}
                  {message.user && (
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-[80%]">
                        <p className="whitespace-pre-wrap">{message.user}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI response */}
                  <div className="flex justify-start">
                    <div className={`px-4 py-3 rounded-xl max-w-[80%] ${
                      message.isCrisis 
                        ? 'bg-gradient-to-br from-red-25 via-red-50 to-red-25 border border-red-200/60 shadow-md backdrop-blur-sm' 
                        : 'bg-muted'
                    }`}>
                      {/* Crisis alert */}
                      {message.isCrisis && (
                        <div className="relative mb-4 p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm overflow-hidden">
                          {/* Subtle animated background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/20 to-transparent animate-pulse" />
                          
                          {/* Content */}
                          <div className="relative flex items-start gap-3">
                            <div className="flex-shrink-0 p-2 bg-red-100 rounded-full border border-red-200">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-red-800 mb-1">
                                Urgent Support Needed
                              </h4>
                              <p className="text-xs text-red-700/90 leading-relaxed">
                                Crisis support resources are available 24/7. You don't have to face this alone.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="whitespace-pre-wrap">{message.ai}</div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Input */}
          <div className="flex-shrink-0">
            <div className="flex gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} 
              placeholder={language === 'ur' ? 'اپنا پیغام یہاں لکھیں...' : 'Share what\'s on your mind...'}
              disabled={isLoading || serviceStatus === 'unhealthy'}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading || serviceStatus === 'unhealthy'}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
            </div>
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

export default EmotionalSupport;
