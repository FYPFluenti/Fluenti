import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RoleBasedComponent, UserTypeGuard } from "@/components/auth/RoleBasedComponent";
import { Link, useLocation } from "wouter";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useWebSocket } from "@/hooks/useWebSocket";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Home, 
  Heart,
  Shield,
  Clock,
  Brain,
  Star,
  Smile,
  Mic,
  MicOff,
  BarChart,
  History,
  MessageSquare,
  User,
  Settings,
  SlidersHorizontal,
  ThumbsUp
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import DarkModeToggle from "@/components/DarkModeToggle";
import { AdultSettings } from "@/components/dashboard/AdultSettings";

interface User {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export default function EmotionalSupport() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();
  // Phase 1 Specification: Use 'en' | 'ur' language codes
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Phase 3: State for emotion detection results
  const [lastProcessedData, setLastProcessedData] = useState<any>(null);
  
  // Chat conversation state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    emotion?: { emotion: string; score: number };
  }>>([]);

  // Adult Dashboard state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Phase 1: WebSocket integration for real-time communication
  const { socket, isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'emotional-support-response') {
        // Add AI response to chat messages
        setChatMessages(prev => [...prev, {
          id: Date.now() + '-ai',
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          emotion: data.emotion
        }]);
        
        // Phase 3: Store processed data from WebSocket for emotion display
        setLastProcessedData(data);
        setIsProcessing(false);
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

  // Phase 2: Set up speech recognition with proper language codes
  const speechLanguage = language === 'ur' ? 'ur-PK' : 'en-US';
  const { 
    startListening, 
    stopListening, 
    isListening, 
    transcript, 
    resetTranscript, 
    error: speechError,
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    sendAudioToBackend 
  } = useSpeechRecognition(speechLanguage);

  // Phase 1 & 2: API call function for emotional support
  const processInput = async (audioBlob?: Blob) => {
    if (!inputText.trim() && !audioBlob) return;
    
    const userMessage = inputText.trim();
    
    // Add user message to chat immediately
    if (userMessage) {
      const userChatMessage = {
        id: Date.now() + '-user',
        type: 'user' as const,
        content: userMessage,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userChatMessage]);
    }
    
    setIsProcessing(true);
    setInputText(''); // Clear input after adding to chat
    
    try {
      // Try WebSocket first for real-time communication
      if (isConnected && socket) {
        if (audioBlob) {
          // Convert blob to base64 for WebSocket transmission
          const reader = new FileReader();
          reader.onload = () => {
            const audioData = reader.result as string;
            sendMessage({
              type: 'emotional-support',
              audio: audioData.split(',')[1], // Remove data:audio/wav;base64, prefix
              text: userMessage,
              language: language // Phase 1: Use 'en' | 'ur' language codes
            });
          };
          reader.readAsDataURL(audioBlob);
        } else {
          sendMessage({
            type: 'emotional-support',
            text: userMessage,
            language: language
          });
        }
        return; // WebSocket will handle the response
      }

      // Fallback to HTTP API
      const formData = new FormData();
      if (audioBlob) formData.append('audio', audioBlob);
      formData.append('text', userMessage);
      formData.append('language', language); // Phase 1: Use 'en' | 'ur' language codes

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
      
      // Add AI response to chat messages
      setChatMessages(prev => [...prev, {
        id: Date.now() + '-ai',
        type: 'ai',
        content: data.response || 'I understand. Please tell me more.',
        timestamp: new Date(),
        emotion: data.emotion
      }]);
      
      // Phase 3: Store processed data for emotion display
      setLastProcessedData(data);
      
      // Phase 3: Enhanced emotion display with detailed information
      const emotionInfo = data.emotion || { emotion: 'unknown', score: 0 };
      const confidencePercent = Math.round(emotionInfo.score * 100);
      const emotionSource = data.emotionSource || 'text-only';
      
      toast({
        title: "Analysis Complete",
        description: `Detected emotion: ${emotionInfo.emotion} (${confidencePercent}% confidence, ${emotionSource})`,
      });
      
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process your input. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle transcript updates
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleRecord = async () => {
    if (isRecording) {
      // First stop the recording and wait for it to complete
      try {
        console.log('Stopping recording...');
        const recordedBlob = await stopRecording();
        
        console.log('Recording stopped, received blob:', recordedBlob);
        
        // Check if we have an audio blob
        if (!recordedBlob || recordedBlob.size === 0) {
          throw new Error('No audio data recorded');
        }
        
        // Now send to backend
        await sendAudioToBackend((result) => {
          if (result && result.transcription) {
            setInputText(result.transcription);
            toast({
              title: "Recording Successful",
              description: "Audio transcribed successfully!",
              variant: "default",
            });
          }
        }, recordedBlob);
        
      } catch (error) {
        console.error('Error processing recording:', error);
        toast({
          title: "Processing Error",
          description: "Failed to process audio recording.",
          variant: "destructive",
        });
      }
    } else if (isListening) {
      // Stop Web Speech API
      stopListening();
    } else {
      // Start new recording - prefer MediaRecorder for Phase 2
      resetTranscript();
      try {
        console.log('Starting MediaRecorder...');
        await startRecording();
        toast({
          title: "Recording Started",
          description: "Speak now to record your message.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error starting MediaRecorder:', error);
        toast({
          title: "Recording Error",
          description: "Failed to start recording. Trying fallback...",
          variant: "destructive",
        });
        // Fallback to Web Speech API
        startListening();
      }
    }
  };

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
      {/* Top right close */}
      <Link href="/adult-dashboard">
        <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </Link>

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
            <span className="w-10 h-10 rounded-full bg-[#F5B82E] flex items-center justify-center">
              <Brain className="w-5 h-5 text-black" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Emotional Support Chat</h2>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected • Real-time support' : 'Offline mode'}
              </p>
            </div>
            
            {/* Mode switcher */}
            <div className="ml-auto">
              <Link href="/emotional-support-voice">
                <button className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Voice Mode
                </button>
              </Link>
            </div>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center space-x-2 mt-3">
            <button
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                language === 'en' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : 'bg-muted text-foreground'
              }`}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                language === 'ur' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : 'bg-muted text-foreground'
              }`}
              onClick={() => setLanguage('ur')}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4">
          {/* Initial AI greeting */}
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-[#F5B82E] flex items-center justify-center">
              <Brain className="w-4 h-4 text-black" />
            </span>
            <div className="bg-muted/40 text-foreground rounded-xl px-4 py-2 shadow-sm max-w-md">
              hey there! I'm here to provide emotional support. what's on your mind today? feel free to share your feelings - I'm listening.
            </div>
          </div>

          {/* Chat Messages */}
          {chatMessages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${
              message.type === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-[#F5B82E]'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Brain className="w-4 h-4 text-black" />
                )}
              </span>
              <div className={`rounded-xl px-4 py-2 shadow-sm max-w-md ${
                message.type === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted/40 text-foreground'
              }`}>
                <p className="text-sm">{message.content}</p>
                {message.emotion && (
                  <div className="mt-2 pt-2 border-t border-border/30 text-xs opacity-70">
                    <span className="capitalize">{message.emotion.emotion}</span>
                    <span className="ml-2">({Math.round(message.emotion.score * 100)}%)</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-[#F5B82E] flex items-center justify-center">
                <Brain className="w-4 h-4 text-black animate-pulse" />
              </span>
              <div className="bg-muted/40 text-foreground rounded-xl px-4 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-muted-foreground ml-2">Analyzing your feelings...</span>
                </div>
              </div>
            </div>
          )}

          {/* Recording/Listening Status */}
          {(isRecording || isListening) && (
            <div className="flex justify-center">
              <div className={`px-4 py-2 rounded-full text-xs font-medium ${
                isRecording 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
              }`}>
                {isRecording ? 'Recording...' : 'Listening...'} 
                {language === 'ur' ? ' (اردو میں بولیں)' : ' (Speak now)'}
              </div>
            </div>
          )}

          {/* Speech Error */}
          {speechError && (
            <div className="flex justify-center">
              <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                ⚠️ {speechError}
              </div>
            </div>
          )}
        </div>

        {/* Quick suggestions */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {language === 'en' ? (
              <>
                <button
                  onClick={() => setInputText("I'm feeling anxious about work today")}
                  className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                  disabled={isProcessing}
                >
                  Try: "I'm feeling anxious"
                </button>
                <button
                  onClick={() => setInputText("I'm having trouble sleeping")}
                  className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                  disabled={isProcessing}
                >
                  Try: "Trouble sleeping"
                </button>
                <button
                  onClick={() => setInputText("I feel overwhelmed")}
                  className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                  disabled={isProcessing}
                >
                  Try: "Feeling overwhelmed"
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setInputText("میں کام کے بارے میں پریشان ہوں")}
                  className="px-3 py-1 text-xs bg-muted/60 hover:bg-muted text-foreground rounded-full transition-colors"
                  disabled={isProcessing}
                  dir="rtl"
                >
                  Try: "میں پریشان ہوں"
                </button>
                <button
                  onClick={() => setInputText("مجھے نیند نہیں آتی")}
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

        {/* Input */}
        <div className="w-full flex items-center gap-3 border border-border rounded-xl bg-card p-3 shadow-sm">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? "Recording..." : (language === 'ur' ? "اپنے جذبات یہاں لکھیں..." : "Share your feelings here...")}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                processInput();
              }
            }}
            disabled={isProcessing || isRecording}
            dir={language === 'ur' ? 'rtl' : 'ltr'}
          />
          
          {/* Voice recording button */}
          <button 
            onClick={handleRecord}
            className={`w-10 h-10 rounded-full border border-border grid place-items-center transition-colors ${
              (isRecording || isListening) ? 'bg-red-500 text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
            disabled={isProcessing}
            title={(isRecording || isListening) ? "Stop recording" : "Start voice input"}
          >
            {(isRecording || isListening) ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          {/* Send button */}
          <button
            onClick={() => processInput()}
            disabled={(!inputText.trim() && !isRecording) || isProcessing}
            className="w-10 h-10 rounded-full grid place-items-center bg-[#F5B82E] hover:brightness-95 disabled:opacity-50 transition-all"
            aria-label="send"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-black">
                <path fill="currentColor" d="M3 11l18-8-8 18-2-7-8-3z" />
              </svg>
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

      {/* Adult Settings Modal */}
      <AdultSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
}