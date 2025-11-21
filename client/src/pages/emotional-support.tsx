import { useState, useEffect, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Heart, MessageCircle, X, Send } from 'lucide-react';
import SharedSidebarEmotional from '@/components/layout/SharedSidebarEmotional';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSounds } from '@/hooks/useAudio';
import { ThinkingIndicator, MessageAnimationWrapper, TypingIndicator } from '@/components/chat/ChatAnimations';
import { MessageHeader } from '@/components/chat/MessageHeader';
import type { User } from '@/types/auth';

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
  const [isTyping, setIsTyping] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);

  // Refs for animations and sound
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingSoundRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio hooks
  const { playSendSound, playReceiveSound, playTypingSound } = useNotificationSounds();

  // Get session ID from URL parameters
  const searchParams = new URLSearchParams(useSearch());
  const sessionIdFromUrl = searchParams.get('sessionId');
  
  // Use the session hook to fetch session data if continuing
  const { session: existingSession, loading: sessionLoading, error: sessionError } = useSession(sessionIdFromUrl);
  
  // Use auth hook for authentication state
  const { isAuthenticated, logout, user } = useAuth();
  const typedUser = user as User | null;

  // Check service health and handle session continuation on component mount
  useEffect(() => {
    checkServiceHealth();
    handleSessionContinuation();
  }, [existingSession]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-scroll to bottom when typing indicator appears
  useEffect(() => {
    if ((isTyping || showThinking) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping, showThinking]);

  // Clear new message animation after delay
  useEffect(() => {
    if (newMessageId) {
      const timer = setTimeout(() => {
        setNewMessageId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [newMessageId]);

  // Session persistence - save active session data
  useEffect(() => {
    if (sessionData.sessionId && messages.length > 0) {
      const sessionToSave = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        sessionKey: sessionData.sessionKey,
        messages: messages.map(msg => ({
          role: msg.user ? 'user' : 'assistant',
          content: msg.user || msg.ai,
          timestamp: msg.timestamp.toISOString()
        })),
        lastUpdated: new Date().toISOString(),
        title: 'Active Chat Session'
      };
      localStorage.setItem('activeSessionData', JSON.stringify(sessionToSave));
      console.log('💾 Saved active session data:', sessionData.sessionId);
    }
  }, [sessionData, messages]);

  // Cleanup typing timeout and session data on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Note: We don't clear activeSessionData here to allow page refresh restoration
      // It will be cleared only when starting a completely new session
    };
  }, []);

  const handleSessionContinuation = () => {
    try {
      // First, check for active session data (from page refresh)
      const activeSessionData = localStorage.getItem('activeSessionData');
      if (activeSessionData && !sessionIdFromUrl) {
        const sessionInfo = JSON.parse(activeSessionData);
        console.log('🔄 Restoring active session from localStorage:', sessionInfo.sessionId);
        
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
        setContinuedSessionTitle(sessionInfo.title || 'Restored Session');
        
        // Auto-dismiss continuation banner after 2 seconds
        setTimeout(() => {
          setIsContinuedSession(false);
        }, 2000);
        
        return; // Exit early, don't check other sources
      }
      
      // Check if we have an existing session from the database
      if (existingSession && !sessionLoading && !sessionError) {
        // Set session data for continuation
        setSessionData({
          sessionId: existingSession.sessionId,
          userId: existingSession.userId,
        });

        // Restore previous messages if available
        if (existingSession.messages && existingSession.messages.length > 0) {
          const restoredMessages: Message[] = existingSession.messages.map((msg: any, index: number) => ({
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
        setContinuedSessionTitle(existingSession.title || 'Previous Session');
        
        // Auto-dismiss continuation banner after 2 seconds
        setTimeout(() => {
          setIsContinuedSession(false);
        }, 2000);
        
        console.log('🔄 Continuing session:', existingSession.title);
      }
      
      // Also check for legacy localStorage data for backward compatibility
      const continuingSessionData = localStorage.getItem('continuingSession');
      if (continuingSessionData && !existingSession) {
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

        // Auto-dismiss continuation banner after 2 seconds
        setTimeout(() => {
          setIsContinuedSession(false);
        }, 2000);

        // Clear the continuation data
        localStorage.removeItem('continuingSession');
        
        console.log('🔄 Continuing session from localStorage:', sessionInfo.title);
      }
    } catch (error) {
      console.error('Error handling session continuation:', error);
      localStorage.removeItem('continuingSession'); // Clear invalid data
    }
  };

  const checkServiceHealth = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
        ? 'https://fluentiai-backend.onrender.com' 
        : 'http://localhost:3000');
      const res = await fetch(`${API_BASE_URL}/api/therapy/health`, {
        credentials: 'include' // Include cookies for authentication
      });
      const data = await res.json();
      setServiceStatus(data.success && data.python_service?.status === 'healthy' ? 'healthy' : 'unhealthy');
    } catch (error) {
      console.error('Health check failed:', error);
      setServiceStatus('unhealthy');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isAuthenticated) return;
    
    setIsLoading(true);
    const userMessage = input.trim();
    setInput(''); // Clear input immediately
    
    // Hide typing indicator since user just sent the message
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Play send sound effect
    playSendSound();
    
    // Add user message immediately
    const userMessageId = Date.now().toString();
    const userMessageObj: Message = {
      id: userMessageId,
      user: userMessage,
      ai: '',
      timestamp: new Date(),
      crisisLevel: 'none',
      isCrisis: false
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    setNewMessageId(userMessageId);
    
    // Show AI thinking indicator immediately
    setShowThinking(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
        ? 'https://fluentiai-backend.onrender.com' 
        : 'http://localhost:3000');
      const res = await fetch(`${API_BASE_URL}/api/emotional-support-chat`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          message: userMessage,
          language: language,
          sessionId: sessionData.sessionId,
          userId: sessionData.userId,
          sessionKey: sessionData.sessionKey
        })
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          // Handle authentication error - logout and redirect
          console.error('Authentication failed - token may have expired');
          await logout();
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Update session data if new session or session data returned
      if (data.sessionId || data.userId || data.sessionKey) {
        const newSessionData = {
          sessionId: data.sessionId || sessionData.sessionId,
          userId: data.userId || sessionData.userId,
          sessionKey: data.sessionKey || sessionData.sessionKey
        };
        setSessionData(newSessionData);
        
        // If this is a completely new session, clear any old active session data
        if (data.newSession) {
          localStorage.removeItem('activeSessionData');
          console.log('🗑️ Cleared old active session data for new session');
        }
      }
      
      // Hide thinking indicator
      setShowThinking(false);
      
      // Play receive sound effect
      playReceiveSound();
      
      // Add AI response as a separate message
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        user: '',
        ai: data.chatResponse || data.response || "I understand. Can you tell me more?",
        timestamp: new Date(),
        crisisLevel: data.crisisLevel,
        isCrisis: data.isCrisis
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setNewMessageId(aiMessageId);
      
      // Show welcome message if it's a new session
      if (data.newSession && data.welcomeMessage && data.welcomeMessage !== data.chatResponse) {
        const welcomeMessageId = (Date.now() - 1).toString();
        const welcomeMessage: Message = {
          id: welcomeMessageId,
          user: '',
          ai: data.welcomeMessage,
          timestamp: new Date(),
          crisisLevel: 'none',
          isCrisis: false
        };
        setMessages(prev => [welcomeMessage, ...prev.slice(-1)]);
        // Don't animate welcome message separately since it comes with the response
      }
      
    } catch (error) {
      console.error('Error:', error);
      
      // Hide thinking indicator
      setShowThinking(false);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        await logout();
        window.location.href = '/login';
        return;
      }
      
      // Add error message with crisis resources
      const errorMessageId = (Date.now() + 2).toString();
      const errorMessage: Message = {
        id: errorMessageId,
        user: '',
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
      setIsTyping(false);
      setShowThinking(false);
    }
  };

  // Handle input change with typing sound and animation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const oldValue = input;
    const now = Date.now();
    
    // Only play sound when adding characters (not when deleting or pasting)
    // And debounce to prevent too many sounds (max one every 50ms)
    if (newValue.length > oldValue.length && 
        newValue.length - oldValue.length === 1 && 
        now - lastTypingSoundRef.current > 50) {
      playTypingSound();
      lastTypingSoundRef.current = now;
    }
    
    // Update input first to ensure state is synchronized
    setInput(newValue);
    
    // Show typing indicator when user is actively typing (any input with content)
    if (newValue.trim().length > 0) {
      setIsTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Hide typing indicator after user stops typing for 1 second
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      // Hide typing indicator immediately if input is empty
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Handle key press with enhanced UX
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Function to start a new session explicitly
  const startNewSession = () => {
    // Clear all session data and messages
    setSessionData({});
    setMessages([]);
    setIsContinuedSession(false);
    setContinuedSessionTitle('');
    localStorage.removeItem('activeSessionData');
    console.log('🆕 Started new chat session');
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
        
        <div className="absolute top-20 right-4 z-10 flex items-center space-x-3">
          {/* New Session Button - only show if there's an active session */}
          {(sessionData.sessionId && messages.length > 0) && (
            <button
              onClick={startNewSession}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-fluenti-primary/20 hover:bg-fluenti-primary/30 border border-fluenti-primary/30 text-fluenti-primary transition-all duration-200"
              title="Start a new session"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Session
            </button>
          )}
          
          {/* Service Status */}
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
        
        <div className="flex-1 flex flex-col px-8 py-4 overflow-hidden">
        {/* Authentication Alert */}
        {!isAuthenticated && (
          <div className="mb-4">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Please <a href="/login" className="underline font-medium">log in</a> to access the emotional support chat.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Service Status Alert */}
        {serviceStatus === 'unhealthy' && (
          <div className="mb-4 space-y-4">
            
            
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
          <div className="flex justify-center mb-4">
            <div className="bg-gray-500/10 border border-gray-300/30 rounded-full px-4 py-2 flex items-center gap-2 max-w-fit">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm font-medium">
                Continuing: {continuedSessionTitle}
              </span>
              <button
                onClick={() => setIsContinuedSession(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

          {/* Chat Messages */}
          <div className="flex-1 px-4 py-6 mb-4 overflow-y-auto min-h-0 scrollbar-hide">
          {messages.length === 0 && !isTyping && !showThinking ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Welcome to Fluenti</h3>
              <p>Your AI-powered companion for emotional wellness and mental health support.</p>
              <p className="text-sm mt-2">Share what's on your mind - I'm here to listen and help.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageAnimationWrapper 
                  key={message.id} 
                  isNew={message.id === newMessageId}
                  delay={message.user ? 0 : 200}
                >
                  <div className="space-y-1">
                    {/* User message */}
                    {message.user && (
                      <div className="flex flex-col">
                        {/* User message header */}
                        <div className="flex justify-center mb-2">
                          <div className="w-full max-w-3xl flex justify-end">
                            <div className="max-w-[70%]">
                              <MessageHeader 
                                type="user" 
                                timestamp={message.timestamp}
                                userName={typedUser?.firstName || 'You'}
                                isNewMessage={message.id === newMessageId}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* User message content */}
                        <div className="flex justify-center">
                          <div className="w-full max-w-3xl flex justify-end">
                            <div className="max-w-[70%]">
                              <p className="whitespace-pre-wrap text-large leading-relaxed text-foreground/90">{message.user}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* AI response */}
                    {message.ai && (
                      <div className="flex flex-col">
                        {/* AI message header */}
                        <div className="flex justify-center mb-2">
                          <div className="w-full max-w-3xl flex justify-start">
                            <div className="max-w-[70%]">
                              <MessageHeader 
                                type="ai" 
                                timestamp={message.timestamp}
                                isNewMessage={message.id === newMessageId && !message.user}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* AI message content */}
                        <div className="flex justify-center">
                          <div className="w-full max-w-3xl flex justify-start">
                            <div className="max-w-[70%]">
                              {/* Crisis alert */}
                              {message.isCrisis && (
                                <div className="relative mb-3 p-3 bg-red-50/50 border-l-4 border-red-400 rounded-r-lg">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-medium text-red-800 mb-1">
                                        Crisis Support Available
                                      </h4>
                                      <p className="text-xs text-red-700/80 leading-relaxed">
                                        24/7 resources: 1019 (Crisis Line), 1166 (Emergency), 0800-00-100 (Rozan)
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{message.ai}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </MessageAnimationWrapper>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <MessageAnimationWrapper isNew={true}>
                  <div className="flex flex-col">
                    <div className="flex justify-center mb-2">
                      <div className="w-full max-w-3xl flex justify-end">
                        <div className="max-w-[70%]">
                          <MessageHeader 
                            type="user" 
                            timestamp={new Date()}
                            userName={typedUser?.firstName || 'You'}
                            isNewMessage={true}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center mb-2">
                      <div className="w-full max-w-3xl flex justify-end">
                        <TypingIndicator className="text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </MessageAnimationWrapper>
              )}
              
              {/* Thinking Indicator */}
              {showThinking && (
                <MessageAnimationWrapper isNew={true}>
                  <div className="flex flex-col">
                    <div className="flex justify-center mb-2">
                      <div className="w-full max-w-3xl flex justify-start">
                        <div className="max-w-[70%]">
                          <MessageHeader 
                            type="ai" 
                            timestamp={new Date()}
                            isNewMessage={true}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-3xl flex justify-start">
                        <ThinkingIndicator />
                      </div>
                    </div>
                  </div>
                </MessageAnimationWrapper>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

          {/* Input */}
          <div className="flex-shrink-0 flex justify-center">
            <div className="flex gap-3 w-full max-w-2xl">
              <Input 
                ref={inputRef}
                value={input} 
                onChange={handleInputChange} 
                onKeyDown={handleKeyPress} 
                placeholder={language === 'ur' ? 'اپنا پیغام یہاں لکھیں...' : isAuthenticated ? 'Share what\'s on your mind...' : 'Please log in to chat...'}
                disabled={isLoading || serviceStatus === 'unhealthy' || !isAuthenticated}
                className="flex-1 transition-all duration-200 focus:scale-[1.01] focus:shadow-lg rounded-full px-4 py-3"
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading || serviceStatus === 'unhealthy' || !isAuthenticated}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 rounded-full px-6"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </div>
                )}
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
