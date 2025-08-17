import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Home, BarChart, History, MessageSquare, User, Settings, SlidersHorizontal, ArrowRight, Sun, Moon } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { motion } from "framer-motion";
import { Star, ThumbsUp, Clock, Mic, MicOff, Brain, Send } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import { AdultSettings } from "@/components/dashboard/AdultSettings";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useWebSocket } from "@/hooks/useWebSocket";

interface User {
  firstName?: string;
  lastName?: string;
}

export default function AdultDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth() as {
    user: User;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showChatUI, setShowChatUI] = useState(false);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [listening, setListening] = useState(false);
  const [showAdultSettings, setShowAdultSettings] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  
  // Emotional Support Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    emotion?: { emotion: string; score: number };
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedData, setLastProcessedData] = useState<any>(null);

  // WebSocket integration for real-time emotional support
  const { socket, isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'emotional-support-response') {
        setChatMessages(prev => [...prev, {
          id: Date.now() + '-ai',
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        }]);
        setLastProcessedData(data);
        setIsProcessing(false);
        
        if (data.emotion) {
          toast({
            title: "Emotion Detected",
            description: `${data.emotion.emotion} (${Math.round(data.emotion.score * 100)}% confidence)`,
          });
        }
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Real-time connection lost. Using fallback mode.",
        variant: "destructive"
      });
    }
  });

  // Speech recognition for chat
  const speechLanguage = language === 'ur' ? 'ur-PK' : 'en-US';
  const { 
    startListening: startSpeech, 
    stopListening: stopSpeech, 
    isListening: isSpeechActive, 
    transcript, 
    resetTranscript, 
    error: speechError,
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    sendAudioToBackend 
  } = useSpeechRecognition(speechLanguage);

  // Update chat input with speech transcript
  useEffect(() => {
    if (transcript) {
      setChatInput(transcript);
    }
  }, [transcript]);

  // Process emotional support input
  const processEmotionalInput = async (audioBlob?: Blob) => {
    if (!chatInput.trim() && !audioBlob) return;
    
    setIsProcessing(true);
    
    // Add user message to chat
    const userMessage = {
      id: Date.now() + '-user',
      type: 'user' as const,
      content: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      // Try WebSocket first for real-time communication
      if (isConnected && socket) {
        if (audioBlob) {
          const reader = new FileReader();
          reader.onload = () => {
            const audioData = reader.result as string;
            sendMessage({
              type: 'emotional-support',
              audio: audioData.split(',')[1],
              text: chatInput,
              language: language
            });
          };
          reader.readAsDataURL(audioBlob);
        } else {
          sendMessage({
            type: 'emotional-support',
            text: chatInput,
            language: language
          });
        }
        setChatInput('');
        return;
      }

      // Fallback to HTTP API
      const formData = new FormData();
      if (audioBlob) formData.append('audio', audioBlob);
      formData.append('text', chatInput);
      formData.append('language', language);

      const res = await fetch('/api/emotional-support', { 
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData 
      });
      
      if (!res.ok) {
        throw new Error('Failed to process input');
      }

      const data = await res.json();
      
      // Add AI response to chat
      setChatMessages(prev => [...prev, {
        id: Date.now() + '-ai',
        type: 'ai',
        content: data.response || 'I understand. Please tell me more.',
        timestamp: new Date(),
        emotion: data.emotion
      }]);
      
      setLastProcessedData(data);
      setChatInput('');
      
      if (data.emotion) {
        const confidencePercent = Math.round(data.emotion.score * 100);
        toast({
          title: "Analysis Complete",
          description: `Detected emotion: ${data.emotion.emotion} (${confidencePercent}% confidence)`,
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process your input. Please try again.",
        variant: "destructive"
      });
      
      // Add error message to chat
      setChatMessages(prev => [...prev, {
        id: Date.now() + '-ai-error',
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle voice recording in chat
  const handleChatRecord = async () => {
    if (isRecording) {
      try {
        const recordedBlob = await stopRecording();
        if (recordedBlob && recordedBlob.size > 0) {
          await processEmotionalInput(recordedBlob);
        }
      } catch (error) {
        console.error('Error processing recording:', error);
        toast({
          title: "Recording Error",
          description: "Failed to process audio recording.",
          variant: "destructive",
        });
      }
    } else if (isSpeechActive) {
      stopSpeech();
    } else {
      resetTranscript();
      try {
        await startRecording();
        toast({
          title: "Recording Started",
          description: "Speak now to record your message.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        startSpeech();
      }
    }
  };

  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const therapyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const motivationRef = useRef<HTMLDivElement>(null);

  const [hovered, setHovered] = useState<string | null>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const submitFeedback = () => {
    // TODO: send to your API
    setShowFeedback(false);
    setFeedback("");
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#ff6b1d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ff6b1d]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen font-sans flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-50 border-r border-border">
        <div className="w-6 h-6 rounded-full bg-blue-500" />

        {/* Sidebar Buttons */}
        {[
          { icon: Home, label: "Home", id: "home", path: "/adult-dashboard" },
          { icon: BarChart, label: "Insight", id: "insight", path: "/adult-insights" },
          { icon: History, label: "History", id: "history", path: "/adult-history" },
          { icon: MessageSquare, label: "Feedback", id: "feedback" },
        ].map(({ icon: Icon, label, id, path }) => (
          <div
            key={id}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            className="relative group"
          >
            <button
              onClick={() =>
                id === "feedback"
                  ? setShowFeedback(true)
                  : path
                    ? setLocation(path)
                    : undefined
              }
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
                hovered === id ? "bg-muted" : ""
              }`}
              aria-label={label}
            >
              <Icon className="text-foreground w-7 h-7" />
            </button>

            {hovered === id && (
              <motion.div
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 12 }}
                exit={{ opacity: 0, x: 5 }}
                className="absolute left-[38px] bottom-0 bg-popover text-popover-foreground px-4 py-2 rounded-lg shadow-md border border-border z-10 w-30 space-y-1"
              >
                {label}
              </motion.div>
            )}
          </div>
        ))}

        <div className="flex-1" />

        <div className="relative" onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); setShowUserMenu(true); }} onMouseLeave={() => { hideTimer.current = setTimeout(() => setShowUserMenu(false), 200); }}>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition"
            aria-label="User menu"
            title="User menu"
          >
            <User className="w-7 h-7 text-foreground" aria-hidden="true" />
          </button>

          {showUserMenu && (
            <div className="absolute left-12 bottom-0 w-48 bg-popover border border-border rounded-xl shadow-lg p-3 z-50">
              <div className="space-y-1">
                <button 
                  onClick={() => { 
                    setShowAdultSettings(true); 
                    setShowUserMenu(false); 
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition"
                >
                  <Settings className="w-4 h-4" />
                  <span>settings</span>
                </button>
                
                <div className="border-t border-border pt-1 mt-1">
                  <LogoutButton className="w-full px-3 py-3 text-base text-left hover:bg-muted text-foreground font-medium flex items-center gap-3 rounded-lg" />
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 px-6 pb-24 w-full">
        <header className="flex justify-between items-center py-6 ">
          <div />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">gen z mode</span>
              <DarkModeToggle />
            </div>
            <button
              onClick={() => setShowPreferences(true)}
              className="p-2 rounded-full hover:bg-muted transition"
              aria-label="Open preferences"
              title="Preferences"
            >
              <SlidersHorizontal className="w-6 h-6 text-foreground" aria-hidden="true" />
            </button>
          </div>
        </header>

        <section ref={therapyRef} className="text-center py-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-xl mx-auto">
            <iframe
              src="https://your-avatar-url.readyplayer.me/avatar"
              allow="camera *; microphone *"
              className="mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-full mb-8"
              title="AI Avatar"
            />
            <h2 className="text-2xl font-bold mb-4">coffee and calmi time?</h2>
            <div className="space-y-3">
              <button onClick={() => setShowVoiceUI(true)} className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all">
                <div>
                  <h3 className="text-base font-semibold">voice mode</h3>
                  <p className="text-sm text-muted-foreground">upgrade to pro for voice mode</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => setShowChatUI(true)} className="border rounded-xl px-4 py-3 text-left shadow bg-card text-foreground border-border w-[300px] mx-auto flex items-center justify-between hover:bg-muted transition-all">
                <div>
                  <h3 className="text-base font-semibold">text mode</h3>
                  <p className="text-sm text-muted-foreground">not in the talking mood?</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Preferences Modal (triggered on preferences button click) */}
        {showPreferences && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowPreferences(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw] bg-popover border border-border rounded-2xl shadow-xl p-8 z-50"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-foreground mb-2">preferences</h3>
                <p className="text-muted-foreground">set how calmi works for you</p>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">language</h4>
                    <p className="text-sm text-muted-foreground">conversation only</p>
                  </div>
                  <select 
                    className="bg-background text-foreground border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'en' | 'ur')}
                    aria-label="Select conversation language"
                    title="Select conversation language"
                  >
                    <option value="en">english</option>
                    <option value="ur">urdu</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">voice</h4>
                    <p className="text-sm text-muted-foreground">coming soon</p>
                  </div>
                  <select 
                    className="bg-background text-foreground border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                    disabled
                    aria-label="Select voice"
                    title="Select voice"
                  >
                    <option value="female">femme</option>
                    <option value="male">male</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-foreground">session mode</h4>
                    <p className="text-sm text-muted-foreground">choose your session style</p>
                  </div>
                  <select 
                    className="bg-background text-foreground border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                    aria-label="Select session mode"
                    title="Select session mode"
                  >
                    <option value="classic">classic</option>
                    <option value="therapeutic">therapeutic</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {showFeedback && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-[500px] max-w-[92vw] rounded-2xl bg-popover border border-border shadow-2xl">
              {/* Textarea */}
              <div className="p-6">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="how can we improve calmi?"
                  className="w-full h-32 resize-none rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/70 p-4 focus:outline-none focus:ring-0 focus:border-border shadow-inner"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-between px-6 pb-6">
                <button
                  onClick={() => { setShowFeedback(false); setFeedback(""); }}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition"
                >
                  cancel
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={!feedback.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition"
                  style={{ backgroundColor: "hsl(27, 95%, 61%)" }} // soft orange
                >
                  submit
                </button>
              </div>
            </div>
          </div>
        )}
   
        {showChatUI && (
          <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
            {/* Top right close */}
            <button
              onClick={() => setShowChatUI(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>

            {/* Sidebar mock */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col items-center py-6 gap-8 bg-background border-r border-border">
              <span className="w-8 h-8 rounded-full bg-[#F5B82E]" />
              <Star className="w-6 h-6 text-muted-foreground" />
              <Clock className="w-6 h-6 text-muted-foreground" />
              <ThumbsUp className="w-6 h-6 text-muted-foreground" />
              <Brain className="w-6 h-6 text-purple-500" />
              <User className="w-6 h-6 text-muted-foreground mt-auto" />
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-col pl-24 max-w-3xl w-full h-full">
              {/* Header */}
              <div className="py-4 border-b border-border mb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-10 h-10 rounded-full bg-[#F5B82E] flex items-center justify-center">
                    <Brain className="w-5 h-5 text-black" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Emotional Support Chat</h2>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? 'Connected • Real-time support' : 'Offline mode'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {/* Initial AI greeting */}
                {chatMessages.length === 0 && (
                  <div className="flex items-start gap-3">
                    <span className="inline-block w-8 h-8 rounded-full bg-[#F5B82E]" />
                    <div className="bg-muted/40 text-foreground rounded-xl px-4 py-2 shadow-sm max-w-md">
                      hey there! what's on your mind today? I'm here to listen and support you through whatever you're feeling.
                    </div>
                  </div>
                )}

                {/* Chat messages */}
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : ''
                  }`}>
                    {message.type === 'ai' && (
                      <span className="inline-block w-8 h-8 rounded-full bg-[#F5B82E] flex items-center justify-center">
                        <Brain className="w-4 h-4 text-black" />
                      </span>
                    )}
                    {message.type === 'user' && (
                      <span className="inline-block w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </span>
                    )}
                    <div className={`rounded-xl px-4 py-2 shadow-sm max-w-md ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-muted/40 text-foreground'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      {message.emotion && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-80">
                          <span className="capitalize">{message.emotion.emotion}</span>
                          <span className="ml-2">({Math.round(message.emotion.score * 100)}%)</span>
                        </div>
                      )}
                      <div className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="flex items-start gap-3">
                    <span className="inline-block w-8 h-8 rounded-full bg-[#F5B82E] flex items-center justify-center">
                      <Brain className="w-4 h-4 text-black animate-pulse" />
                    </span>
                    <div className="bg-muted/40 text-foreground rounded-xl px-4 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-sm text-muted-foreground ml-2">Analyzing your message...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick suggestions */}
              {chatMessages.length === 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {language === 'en' ? (
                      <>
                        <button
                          onClick={() => setChatInput("I'm feeling anxious about work today")}
                          className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                          disabled={isProcessing}
                        >
                          Try: "I'm feeling anxious"
                        </button>
                        <button
                          onClick={() => setChatInput("I'm having trouble sleeping")}
                          className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                          disabled={isProcessing}
                        >
                          Try: "Trouble sleeping"
                        </button>
                        <button
                          onClick={() => setChatInput("I feel overwhelmed")}
                          className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                          disabled={isProcessing}
                        >
                          Try: "Feeling overwhelmed"
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setChatInput("میں کام کے بارے میں پریشان ہوں")}
                          className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                          disabled={isProcessing}
                          dir="rtl"
                        >
                          Try: "میں پریشان ہوں"
                        </button>
                        <button
                          onClick={() => setChatInput("مجھے نیند نہیں آتی")}
                          className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                          disabled={isProcessing}
                          dir="rtl"
                        >
                          Try: "نیند کی مسئلہ"
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="w-full flex items-center gap-3 border border-border rounded-xl bg-card p-3 shadow-sm">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isRecording ? "Recording..." : "Share your feelings here..."}
                  rows={1}
                  className="flex-1 resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      processEmotionalInput();
                    }
                  }}
                  disabled={isProcessing || isRecording}
                  dir={language === 'ur' ? 'rtl' : 'ltr'}
                />
                
                {/* Voice recording button */}
                <button 
                  onClick={handleChatRecord}
                  className={`w-10 h-10 rounded-full border border-border grid place-items-center transition-colors ${
                    isRecording ? 'bg-red-500 text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                  disabled={isProcessing}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                
                {/* Send button */}
                <button
                  onClick={() => processEmotionalInput()}
                  disabled={(!chatInput.trim() && !isRecording) || isProcessing}
                  className="w-10 h-10 rounded-full grid place-items-center bg-[#F5B82E] hover:brightness-95 disabled:opacity-50 transition-all"
                  aria-label="send"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4 text-black" />
                  )}
                </button>
              </div>

              {/* Connection status and language indicator */}
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>{isConnected ? 'Real-time mode' : 'Offline mode'}</span>
                </div>
                <span>Language: {language === 'ur' ? 'اردو' : 'English'}</span>
              </div>
            </div>
          </div>
        )}

        {showVoiceUI && (
          <div className="fixed inset-0 bg-background flex">
            {/* Close */}
            <button
              onClick={() => { setListening(false); setShowVoiceUI(false); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close voice chat"
            >
              ✕
            </button>

            {/* Sidebar (same as text mode) */}
            <aside className="w-16 shrink-0 border-r border-border bg-background flex flex-col items-center py-6 gap-8">
              <span className="w-8 h-8 rounded-full bg-[#F5B82E]" />
              <Star className="w-6 h-6 text-muted-foreground" />
              <Clock className="w-6 h-6 text-muted-foreground" />
              <ThumbsUp className="w-6 h-6 text-muted-foreground" />
              <User className="w-6 h-6 text-muted-foreground mt-auto" />
            </aside>

            {/* Main: big centered avatar */}
            <main className="flex-1 grid place-items-center p-6">
              <div className="flex flex-col items-center gap-8">
                {/* Avatar circle */}
                <div className="relative">
                  {/* neon ring */}
                  <div className="absolute inset-0 -m-3 rounded-full border-4 border-cyan-300/90 blur-[0.3px]" />
                  {/* clip the iframe to a circle */}
                  <div className="relative rounded-full overflow-hidden bg-[#1f2028]
                                  w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80">
                    <iframe
                      src="https://your-avatar-url.readyplayer.me/avatar"
                      allow="camera *; microphone *"
                      className="absolute inset-0 w-full h-full"
                      title="AI Avatar"
                    />
                  </div>
                </div>

                {/* Control bar beneath the avatar */}
                <div className="w-full max-w-lg border border-border rounded-xl bg-card p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {listening ? "Listening…" : "Ready to talk"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {listening ? "Speak to your AI avatar" : "Tap the mic to start"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setListening(false)}
                      className="w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted"
                      aria-label="stop listening"
                      title="stop listening"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => setListening(v => !v)}
                      className="w-12 h-12 rounded-full grid place-items-center bg-[#F5B82E] hover:brightness-95 transition"
                      aria-label="toggle microphone"
                      title="toggle microphone"
                    >
                      {listening ? <Mic className="w-5 h-5 text-black" /> : <MicOff className="w-5 h-5 text-black" />}
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* Adult Settings Modal */}
        <AdultSettings
          isOpen={showAdultSettings}
          onClose={() => setShowAdultSettings(false)}
          language={language}
          onLanguageChange={setLanguage}
        />
      </main>
    </div>
  );
}
