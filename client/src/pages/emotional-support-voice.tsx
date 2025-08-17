import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useWebSocket } from "@/hooks/useWebSocket";
import { motion } from "framer-motion";
import { 
  Brain,
  Star,
  Clock,
  ThumbsUp,
  Mic,
  MicOff,
  User,
  Pause,
  Play,
  Volume2,
  VolumeX,
  MessageSquare,
  BarChart3
} from "lucide-react";

interface User {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface VoiceSession {
  id: string;
  type: 'user' | 'ai';
  audioBlob?: Blob;
  transcript?: string;
  timestamp: Date;
  emotion?: { emotion: string; score: number };
  duration?: number;
}

export default function EmotionalSupportVoice() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  const [, setLocation] = useLocation();
  
  // Voice-specific states
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedData, setLastProcessedData] = useState<any>(null);
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice UI specific states
  const [isInConversation, setIsInConversation] = useState(false);
  const [conversationStep, setConversationStep] = useState<'listening' | 'processing' | 'speaking' | 'idle'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Auto-scroll to bottom when new sessions are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [voiceSessions]);

  // WebSocket integration for voice mode
  const { socket, isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'emotional-support-voice-response') {
        // Add AI voice response to sessions
        setVoiceSessions(prev => [...prev, {
          id: Date.now() + '-ai-voice',
          type: 'ai',
          transcript: data.response,
          timestamp: new Date(),
          emotion: data.emotion,
          audioBlob: data.audioBlob ? new Blob([Buffer.from(data.audioBlob, 'base64')], { type: 'audio/wav' }) : undefined
        }]);
        
        setLastProcessedData(data);
        setIsProcessing(false);
        setConversationStep('speaking');
        
        // Auto-play AI response if available
        if (data.audioBlob && !isMuted) {
          playAIResponse(data.audioBlob);
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

  // Enhanced speech recognition for voice mode
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

  // Play AI response audio
  const playAIResponse = (base64Audio: string) => {
    try {
      const audioBlob = new Blob([Buffer.from(base64Audio, 'base64')], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setConversationStep('idle');
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('Error playing AI response:', error);
      setConversationStep('idle');
    }
  };

  // Enhanced voice processing with emotion analysis
  const processVoiceInput = async (audioBlob?: Blob) => {
    if (!audioBlob && !transcript.trim()) return;
    
    const userTranscript = transcript.trim();
    
    // Add user voice session immediately
    if (userTranscript || audioBlob) {
      const userSession: VoiceSession = {
        id: Date.now() + '-user-voice',
        type: 'user',
        transcript: userTranscript,
        timestamp: new Date(),
        audioBlob: audioBlob
      };
      setVoiceSessions(prev => [...prev, userSession]);
    }
    
    setIsProcessing(true);
    setConversationStep('processing');
    resetTranscript();

    try {
      // Try WebSocket first for real-time voice communication
      if (isConnected && socket) {
        if (audioBlob) {
          const reader = new FileReader();
          reader.onload = () => {
            const audioData = reader.result as string;
            sendMessage({
              type: 'emotional-support-voice',
              audio: audioData.split(',')[1], // Remove data:audio/wav;base64, prefix
              text: userTranscript,
              language: language,
              requestTTS: true, // Request Text-to-Speech response
              voiceSettings: {
                speed: 1.0,
                pitch: 1.0,
                emotion: 'supportive'
              }
            });
          };
          reader.readAsDataURL(audioBlob);
        } else {
          sendMessage({
            type: 'emotional-support-voice',
            text: userTranscript,
            language: language,
            requestTTS: true
          });
        }
        return; // WebSocket will handle the response
      }

      // Fallback to HTTP API for voice mode
      const formData = new FormData();
      if (audioBlob) formData.append('audio', audioBlob);
      formData.append('text', userTranscript);
      formData.append('language', language);
      formData.append('mode', 'voice'); // Specify voice mode
      formData.append('requestTTS', 'true'); // Request TTS response

      const res = await fetch('/api/emotional-support', { 
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData 
      });
      
      if (!res.ok) {
        throw new Error('Failed to process voice input');
      }

      const data = await res.json();
      
      // Add AI voice response
      setVoiceSessions(prev => [...prev, {
        id: Date.now() + '-ai-voice',
        type: 'ai',
        transcript: data.response || 'I understand. Please tell me more.',
        timestamp: new Date(),
        emotion: data.emotion,
        audioBlob: data.audioBlob ? new Blob([Buffer.from(data.audioBlob, 'base64')], { type: 'audio/wav' }) : undefined
      }]);
      
      setLastProcessedData(data);
      
      // Enhanced emotion display for voice mode
      const emotionInfo = data.emotion || { emotion: 'unknown', score: 0 };
      const confidencePercent = Math.round(emotionInfo.score * 100);
      
      toast({
        title: "Voice Analysis Complete",
        description: `Detected emotion: ${emotionInfo.emotion} (${confidencePercent}% confidence)`,
      });

      // Play AI response if TTS available
      if (data.audioBlob && !isMuted) {
        setConversationStep('speaking');
        playAIResponse(data.audioBlob);
      } else {
        setConversationStep('idle');
      }
      
    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Voice Processing Error",
        description: "Failed to process your voice input. Please try again.",
        variant: "destructive"
      });
      setConversationStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced voice recording handler
  const handleVoiceRecord = async () => {
    if (isRecording) {
      try {
        console.log('Stopping voice recording...');
        const recordedBlob = await stopRecording();
        setConversationStep('processing');
        
        if (!recordedBlob || recordedBlob.size === 0) {
          throw new Error('No audio data recorded');
        }
        
        // Process the voice input
        await processVoiceInput(recordedBlob);
        
      } catch (error) {
        console.error('Error processing voice recording:', error);
        toast({
          title: "Recording Error",
          description: "Failed to process voice recording.",
          variant: "destructive",
        });
        setConversationStep('idle');
      }
    } else if (isListening) {
      stopListening();
      setConversationStep('idle');
    } else {
      // Start new voice conversation
      resetTranscript();
      setIsInConversation(true);
      setConversationStep('listening');
      
      try {
        console.log('Starting voice recording...');
        await startRecording();
        toast({
          title: "Voice Mode Active",
          description: "Speak now - I'm listening to your feelings.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error starting voice recording:', error);
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

  // Play/pause session audio
  const toggleAudioPlayback = (sessionId: string, audioBlob?: Blob) => {
    if (!audioBlob) return;

    if (currentPlayingId === sessionId) {
      // Stop current audio
      const audio = audioRefs.current.get(sessionId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setCurrentPlayingId(null);
    } else {
      // Stop any currently playing audio
      audioRefs.current.forEach((audio, id) => {
        audio.pause();
        audio.currentTime = 0;
      });

      // Play new audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setCurrentPlayingId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRefs.current.set(sessionId, audio);
      audio.play();
      setCurrentPlayingId(sessionId);
    }
  };

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

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

      {/* Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col items-center py-6 gap-8 bg-background border-r border-border">
        <span className="w-8 h-8 rounded-full bg-[#F5B82E]" />
        <Star className="w-6 h-6 text-muted-foreground" />
        <Clock className="w-6 h-6 text-muted-foreground" />
        <ThumbsUp className="w-6 h-6 text-muted-foreground" />
        <Brain className="w-6 h-6 text-purple-500" />
        <User className="w-6 h-6 text-muted-foreground mt-auto" />
      </div>

      {/* Main Voice Area */}
      <div className="flex flex-col pl-24 max-w-4xl w-full h-full">
        {/* Header */}
        <div className="py-4 border-b border-border mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#F5B82E] flex items-center justify-center">
              <Mic className="w-5 h-5 text-black" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Voice Emotional Support</h2>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected • Real-time voice therapy' : 'Offline mode'}
              </p>
            </div>
            
            {/* Mode switcher */}
            <div className="ml-auto">
              <Link href="/emotional-support">
                <button className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat Mode
                </button>
              </Link>
            </div>
            
            {/* Voice controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                title={isMuted ? 'Unmute AI responses' : 'Mute AI responses'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
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

        {/* Voice Sessions */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4">
          {/* Initial AI greeting */}
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-[#F5B82E] flex items-center justify-center">
              <Brain className="w-4 h-4 text-black" />
            </span>
            <div className="bg-muted/40 text-foreground rounded-xl px-4 py-2 shadow-sm max-w-md">
              Hello! I'm here for voice-based emotional support. Take a deep breath and share what's on your mind - I'm listening with full attention.
            </div>
          </div>

          {/* Voice Sessions */}
          {voiceSessions.map((session) => (
            <div key={session.id} className={`flex items-start gap-3 ${
              session.type === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                session.type === 'user' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-[#F5B82E]'
              }`}>
                {session.type === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Brain className="w-4 h-4 text-black" />
                )}
              </span>
              <div className={`rounded-xl px-4 py-2 shadow-sm max-w-md ${
                session.type === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted/40 text-foreground'
              }`}>
                {session.transcript && (
                  <p className="text-sm mb-2">{session.transcript}</p>
                )}
                
                {session.audioBlob && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => toggleAudioPlayback(session.id, session.audioBlob)}
                      className={`p-1 rounded-full ${
                        session.type === 'user' 
                          ? 'bg-white/20 text-white hover:bg-white/30'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                      title={currentPlayingId === session.id ? 'Stop audio' : 'Play audio'}
                    >
                      {currentPlayingId === session.id ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>
                    <BarChart3 className="w-4 h-4 opacity-70" />
                    <span className="text-xs opacity-70">
                      {session.duration ? `${session.duration}s` : 'Audio'}
                    </span>
                  </div>
                )}
                
                {session.emotion && (
                  <div className="mt-2 pt-2 border-t border-border/30 text-xs opacity-70">
                    <span className="capitalize">{session.emotion.emotion}</span>
                    <span className="ml-2">({Math.round(session.emotion.score * 100)}%)</span>
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
                  <span className="text-sm text-muted-foreground ml-2">Analyzing your voice and emotions...</span>
                </div>
              </div>
            </div>
          )}

          {/* Conversation status */}
          {conversationStep !== 'idle' && (
            <div className="flex justify-center">
              <div className={`px-4 py-2 rounded-full text-xs font-medium ${
                conversationStep === 'listening' 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : conversationStep === 'processing'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
              }`}>
                {conversationStep === 'listening' && `🎤 ${language === 'ur' ? 'اردو میں بولیں...' : 'I\'m listening...'}`}
                {conversationStep === 'processing' && '🧠 Processing your emotions...'}
                {conversationStep === 'speaking' && '🔊 AI is responding...'}
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

        {/* Voice Control Center */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col items-center">
            {/* Main voice button */}
            <motion.button
              onClick={handleVoiceRecord}
              className={`relative w-20 h-20 rounded-full border-4 transition-all duration-300 ${
                (isRecording || isListening) 
                  ? 'bg-red-500 border-red-400 text-white shadow-lg' 
                  : 'bg-[#F5B82E] border-[#F5B82E] text-black hover:shadow-lg hover:scale-105'
              }`}
              disabled={isProcessing}
              whileTap={{ scale: 0.95 }}
            >
              {(isRecording || isListening) ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
              
              {/* Pulsing ring for active states */}
              {(isRecording || isListening) && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-400"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </motion.button>

            {/* Status text */}
            <p className="text-sm text-muted-foreground mt-3 text-center">
              {isProcessing ? 'Processing your voice...' :
               (isRecording || isListening) ? 
                 (language === 'ur' ? 'اردو میں اپنے جذبات شیئر کریں' : 'Share your feelings out loud') :
                 'Tap to start voice therapy session'
              }
            </p>

            {/* Transcript preview */}
            {transcript && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg max-w-md text-center">
                <p className="text-sm text-muted-foreground mb-1">Current transcript:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}
          </div>
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span>{isConnected ? 'Real-time voice mode' : 'Offline voice mode'}</span>
          </div>
          <span>Language: {language === 'ur' ? 'اردو' : 'English'}</span>
        </div>
      </div>
    </div>
  );
}
