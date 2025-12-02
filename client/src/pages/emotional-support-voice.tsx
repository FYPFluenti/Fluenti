import { useState, useEffect } from 'react';
import { useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import ModelViewerAvatar from '@/components/ModelViewerAvatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';
import { Mic, MicOff, Waves, Heart, Brain, Shield, X, AlertTriangle, RotateCcw, Plus } from 'lucide-react';
import SharedSidebarEmotional from '@/components/layout/SharedSidebarEmotional';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';
import { useSession } from '@/hooks/useSession';

interface SessionData {
  sessionId?: string;
  userId?: string;
  sessionKey?: string;
}

const avatarUrls = {
  therapist: "https://models.readyplayer.me/68ab4a2c3f2023411197a0fa.glb",
  professional: "https://models.readyplayer.me/68ab4ab5e05b84c2efb26767.glb", 
  casual: "https://models.readyplayer.me/68aa261a75e83eeb00564816.glb",  
};

const EmotionalSupportVoice = () => {
  const language = 'english';
  const [history, setHistory] = useState<{ user: string; ai: string }[]>([]);
  const [response, setResponse] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [showServiceOfflineModal, setShowServiceOfflineModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isContinuedSession, setIsContinuedSession] = useState(false);
  const [continuedSessionTitle, setContinuedSessionTitle] = useState<string>('');
  const { startRecording, stopRecording, isRecording } = useSpeechRecognition();

  // Avatar animation states
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Get session ID from URL parameters
  const searchParams = new URLSearchParams(useSearch());
  const sessionIdFromUrl = searchParams.get('sessionId');
  
  // Use the session hook to fetch session data if continuing
  const { session: existingSession, loading: sessionLoading, error: sessionError } = useSession(sessionIdFromUrl);

  // Manage avatar state transitions based on recording state
  useEffect(() => {
    if (!isRecording && !isProcessing && !isAudioPlaying) {
      // Smooth transition to idle when not in any active state
      const timeout = setTimeout(() => {
        setAvatarState('idle');
      }, 300); // Small delay for smooth transition
      
      return () => clearTimeout(timeout);
    }
  }, [isRecording, isProcessing, isAudioPlaying]);

  // Handle Coqui TTS audio playback directly with avatar state management
  useEffect(() => {
    if (audioBase64) {
      console.log('🎵 Coqui TTS audio base64 set, length:', audioBase64.length);
      console.log('🔊 Playing Coqui TTS audio directly...');
      
      try {
        // Create audio from base64
        const audioUrl = `data:audio/wav;base64,${audioBase64}`;
        const audio = new Audio(audioUrl);
        
        audio.onloadeddata = () => {
          console.log('🎶 Coqui TTS audio loaded, starting synced playback and typing...');
          
          // Start both audio and typing simultaneously
          audio.play().then(() => {
            console.log('✅ Coqui TTS audio playback started');
            setAvatarState('speaking'); // Set avatar to speaking state
            setIsAudioPlaying(true);
          }).catch(error => {
            console.error('❌ Coqui TTS audio playback failed:', error);
            setAvatarState('idle');
            setIsAudioPlaying(false);
          });
        };
        
        audio.onended = () => {
          console.log('🏁 Coqui TTS audio playback completed');
          setAudioBase64(''); // Clear audio after playing
          setAvatarState('idle'); // Return avatar to idle state
          setIsAudioPlaying(false);
        };
        
        audio.onerror = (error) => {
          console.error('❌ Audio error:', error);
          setAudioBase64(''); // Clear audio on error
          setAvatarState('idle'); // Return avatar to idle state
          setIsAudioPlaying(false);
        };
        
      } catch (error) {
        console.error('❌ Failed to create audio:', error);
        setAudioBase64(''); // Clear audio on error
        setAvatarState('idle');
        setIsAudioPlaying(false);
      }
    } else {
      console.log('🔇 Audio base64 cleared');
      if (!isRecording && !isProcessing) {
        setAvatarState('idle');
        setIsAudioPlaying(false);
      }
    }
  }, [audioBase64]);

  // Handle typewriter effect synchronized with audio
  useEffect(() => {
    if (response && response !== displayedResponse && audioBase64) {
      setIsTyping(true);
      setDisplayedResponse(''); // Clear previous text
      
      // Create audio to get duration
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      
      audio.onloadedmetadata = () => {
        const audioDuration = audio.duration * 1000; // Convert to milliseconds
        const textLength = response.length;
        const typingSpeed = audioDuration / textLength; // Speed per character to match audio
        
        console.log(`🎯 Syncing text: ${textLength} chars over ${audioDuration}ms = ${typingSpeed}ms per char`);
        
        let currentIndex = 0;
        const typeInterval = setInterval(() => {
          if (currentIndex < response.length) {
            setDisplayedResponse(response.slice(0, currentIndex + 1));
            currentIndex++;
          } else {
            setIsTyping(false);
            clearInterval(typeInterval);
          }
        }, typingSpeed);
        
        // Cleanup function
        return () => {
          clearInterval(typeInterval);
          setIsTyping(false);
        };
      };
      
      audio.onerror = () => {
        // Fallback to default speed if audio fails
        console.log('📝 Audio sync failed, using default typing speed');
        let currentIndex = 0;
        const fallbackSpeed = 50; // Default fallback speed
        
        const typeInterval = setInterval(() => {
          if (currentIndex < response.length) {
            setDisplayedResponse(response.slice(0, currentIndex + 1));
            currentIndex++;
          } else {
            setIsTyping(false);
            clearInterval(typeInterval);
          }
        }, fallbackSpeed);
      };
    }
  }, [response, audioBase64]);

  // Session persistence - save active session data for voice mode
  useEffect(() => {
    if (sessionData.sessionId && history.length > 0) {
      const sessionToSave = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        sessionKey: sessionData.sessionKey,
        messages: history.flatMap(item => [
          ...(item.user ? [{ role: 'user', content: item.user, timestamp: new Date().toISOString() }] : []),
          ...(item.ai ? [{ role: 'assistant', content: item.ai, timestamp: new Date().toISOString() }] : [])
        ]),
        lastUpdated: new Date().toISOString(),
        title: 'Active Voice Session'
      };
      localStorage.setItem('activeVoiceSessionData', JSON.stringify(sessionToSave));
      console.log('💾 Saved active voice session data:', sessionData.sessionId);
    }
  }, [sessionData, history]);

  // Check therapy service status on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
          ? 'https://fluenti-app.onrender.com' 
          : 'http://localhost:3000');
        const res = await fetch(`${API_BASE_URL}/api/therapy/health`);
        if (res.ok) {
          const prevStatus = serviceStatus;
          setServiceStatus('online');
          // Close modal if service comes back online
          if (prevStatus === 'offline') {
            setShowServiceOfflineModal(false);
          }
        } else {
          setServiceStatus('offline');
          setShowServiceOfflineModal(true);
        }
      } catch (error) {
        setServiceStatus('offline');
        setShowServiceOfflineModal(true);
      }
    };
    
    checkServiceStatus();
    handleSessionContinuation();
    // Check status every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, [serviceStatus, existingSession]);

  const handleSessionContinuation = () => {
    try {
      // First, check for active voice session data (from page refresh)
      const activeVoiceSessionData = localStorage.getItem('activeVoiceSessionData');
      if (activeVoiceSessionData && !sessionIdFromUrl) {
        const sessionInfo = JSON.parse(activeVoiceSessionData);
        console.log('🔄 Restoring active voice session from localStorage:', sessionInfo.sessionId);
        
        // Set session data for continuation
        setSessionData({
          sessionId: sessionInfo.sessionId,
          userId: sessionInfo.userId,
          sessionKey: sessionInfo.sessionKey
        });

        // Restore previous history if available
        if (sessionInfo.messages && sessionInfo.messages.length > 0) {
          const restoredHistory = sessionInfo.messages
            .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
            .reduce((acc: any[], msg: any, index: number, array: any[]) => {
              if (msg.role === 'user') {
                const nextMsg = array[index + 1];
                acc.push({
                  user: msg.content,
                  ai: (nextMsg && nextMsg.role === 'assistant') ? nextMsg.content : ''
                });
              }
              return acc;
            }, [])
            .filter((item: any) => item.user || item.ai);

          setHistory(restoredHistory);
        }

        // Set continuation indicators
        setIsContinuedSession(true);
        setContinuedSessionTitle(sessionInfo.title || 'Restored Voice Session');
        
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

        // Restore previous history if available
        if (existingSession.messages && existingSession.messages.length > 0) {
          const restoredHistory = existingSession.messages
            .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
            .map((msg: any, index: number) => ({
              user: msg.role === 'user' ? msg.content : '',
              ai: msg.role === 'assistant' ? msg.content : ''
            }))
            .filter((item: any) => item.user || item.ai);

          setHistory(restoredHistory);
        }

        // Set continuation indicators
        setIsContinuedSession(true);
        setContinuedSessionTitle(existingSession.title || 'Previous Session');
        
        // Auto-dismiss continuation banner after 2 seconds
        setTimeout(() => {
          setIsContinuedSession(false);
        }, 2000);
        
        console.log('🔄 Continuing voice session:', existingSession.title);
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

        // Restore previous history if available
        if (sessionInfo.messages && sessionInfo.messages.length > 0) {
          const restoredHistory = sessionInfo.messages
            .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
            .map((msg: any, index: number) => ({
              user: msg.role === 'user' ? msg.content : '',
              ai: msg.role === 'assistant' ? msg.content : ''
            }))
            .filter((item: any) => item.user || item.ai);

          setHistory(restoredHistory);
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
        
        console.log('🔄 Continuing voice session from localStorage:', sessionInfo.title);
      }
    } catch (error) {
      console.error('Error handling voice session continuation:', error);
      localStorage.removeItem('continuingSession'); // Clear invalid data
    }
  };

  const handleRecordStop = async (blob: Blob) => {
    try {
      setIsProcessing(true); // Start processing
      setAvatarState('thinking'); // Set avatar to thinking state
      setDisplayedResponse(''); // Clear previous response display
      const formData = new FormData();
      formData.append('mode', 'voice');
      formData.append('language', language);
      formData.append('audio', blob, 'voice.wav');
      formData.append('history', JSON.stringify(history));
      formData.append('requestTTS', 'true'); // Request audio response
      formData.append('ttsProvider', 'coqui'); // Use Coqui TTS specifically
      
      // *NEW: Add session data for continuity (same as chat mode)*
      // Always send session data, even if undefined - backend will create new session if needed
      formData.append('sessionId', sessionData.sessionId || '');
      formData.append('userId', sessionData.userId || '');
      if (sessionData.sessionKey) {
        formData.append('sessionKey', sessionData.sessionKey);
      }

      console.log('🎙 Sending voice input to therapy service with session data:', {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        sessionKey: sessionData.sessionKey
      });
      const res = await fetch('/api/emotional-support', { method: 'POST', body: formData });
      const data = await res.json();
      
      console.log('📥 Therapy service response:', data);
      
      if (data.success) {
        // *NEW: Update session data for continuity (same as chat mode)*
        if (data.sessionId || data.userId || data.sessionKey) {
          const newSessionData = {
            sessionId: data.sessionId || sessionData.sessionId,
            userId: data.userId || sessionData.userId,
            sessionKey: data.sessionKey || sessionData.sessionKey
          };
          setSessionData(newSessionData);
          console.log('📝 Session data updated:', newSessionData);
          
          // If this is a completely new session, clear any old active session data
          if (data.newSession) {
            localStorage.removeItem('activeVoiceSessionData');
            console.log('🗑️ Cleared old active voice session data for new session');
          }
        }
        
        // Handle successful therapy response
        setResponse(data.response || 'Processing your voice...');
        setHistory([...history, { 
          user: data.transcription || 'Voice input received', 
          ai: data.response || 'Processing...' 
        }]);

        // Handle crisis detection
        if (data.isCrisis && data.crisisLevel) {
          console.warn(' Crisis detected:', data.crisisLevel);
          // You could add visual crisis indicators here
        }

        // Set TTS audio for playback (Coqui TTS)
        if (data.audioBase64) {
          console.log('🔊 Received Coqui TTS audio, length:', data.audioBase64.length, 'chars');
          console.log('🎙️ TTS Provider used:', data.ttsProvider || 'unknown');
          setAudioBase64(data.audioBase64);
        } else {
          console.log('❌ No Coqui TTS audio received in response');
          setAudioBase64(''); // Clear audio if none provided
        }
      } else {
        // Handle error response with crisis resources
        setResponse(data.response || 'Sorry, there was an error processing your voice input.');
        if (data.fallback) {
          console.warn('⚠ Using fallback response due to service issues');
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      setResponse('Sorry, there was an error processing your voice input. If you\'re in crisis, please contact 988 (Suicide & Crisis Lifeline) or 911.');
    } finally {
      setIsProcessing(false); // End processing
      // Avatar state will be managed by audio playback or set to idle if no audio
      if (!audioBase64) {
        setAvatarState('idle');
      }
    }
  };

  // Function to start a new voice session explicitly
  const startNewSession = () => {
    // Clear all session data and history
    setSessionData({});
    setHistory([]);
    setResponse('');
    setDisplayedResponse('');
    setIsContinuedSession(false);
    setContinuedSessionTitle('');
    localStorage.removeItem('activeVoiceSessionData');
    console.log('🆕 Started new voice session');
  };

  return (
    <div className="min-h-screen max-h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <SharedSidebarEmotional 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="voice"
      />

      {/* Main Content */}
      <div className="ml-20 flex-1 flex flex-col h-screen overflow-hidden relative">
        <PageHeader />
        
        {/* Service Status - Top Right Corner (below header) */}
        <div className="absolute top-20 right-4 z-10">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            serviceStatus === 'online' 
              ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-600' 
              : serviceStatus === 'offline' 
              ? 'bg-red-500/20 border border-red-400/30 text-red-600'
              : 'bg-amber-500/20 border border-amber-400/30 text-amber-600'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              serviceStatus === 'online' ? 'bg-emerald-500' :
              serviceStatus === 'offline' ? 'bg-red-500' :
              'bg-amber-500 animate-pulse'
            }`}></div>
            <span>
              {serviceStatus === 'checking' ? 'Connecting...' : serviceStatus}
            </span>
          </div>
        </div>

        {/* Session Continuation Banner */}
        {isContinuedSession && (
          <div className="flex justify-center mx-4 mb-2">
            <div className="bg-gray-500/10 border border-gray-300/30 rounded-full px-4 py-2 flex items-center gap-2 max-w-fit">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
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
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content Area - Flex Layout with Avatar on Left */}
          <div className="flex-1 flex items-center px-6 py-8 gap-8 min-h-0">
            
            {/* Avatar Section - Fixed Left Side */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="relative">
                <ModelViewerAvatar
                  avatarUrl={avatarUrls.professional}
                  size="medium"
                  className="drop-shadow-lg transition-all duration-500"
                  isListening={avatarState === 'listening'}
                  isSpeaking={avatarState === 'speaking'}
                />
                
                {/* Avatar State Indicator with Smooth Transitions */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className={`transition-all duration-300 ease-in-out ${
                    avatarState === 'idle' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}>
                    {avatarState === 'listening' && (
                      <div className="flex items-center gap-1 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-full px-3 py-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-blue-400 text-xs font-medium">Listening</span>
                      </div>
                    )}
                    {avatarState === 'thinking' && (
                      <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-full px-3 py-1">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-amber-400 text-xs font-medium">Thinking</span>
                      </div>
                    )}
                    {avatarState === 'speaking' && (
                      <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full px-3 py-1">
                        <div className="flex gap-1">
                          <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                          <div className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                          <div className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                          <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        </div>
                        <span className="text-emerald-400 text-xs font-medium">Speaking</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ambient Glow Effect for Avatar States */}
                <div className={`absolute inset-0 rounded-full transition-all duration-500 ease-in-out pointer-events-none ${
                  avatarState === 'listening' 
                    ? 'shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105' 
                    : avatarState === 'thinking'
                    ? 'shadow-[0_0_30px_rgba(245,158,11,0.3)] scale-102'
                    : avatarState === 'speaking'
                    ? 'shadow-[0_0_40px_rgba(34,197,94,0.4)] scale-105'
                    : 'shadow-none scale-100'
                }`}></div>
              </div>
            </div>

            {/* Response Section - Centered Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto min-h-0 px-4 sm:px-0">
              {(response || displayedResponse) ? (
                <div className="w-full max-w-2xl">
                  <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-cyan-600 font-semibold text-xs sm:text-sm">AI Therapist</h3>
                          {isTyping && (
                            <div className="w-1 h-3 sm:h-4 bg-cyan-400 animate-pulse rounded-sm"></div>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed text-sm sm:text-base">
                          {displayedResponse}
                          {isTyping && <span className="animate-pulse">|</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <p className="text-muted-foreground text-center max-w-md">
                    Welcome to Fluenti - Your AI companion for emotional wellness. Click "Start Speaking" to share what's on your mind.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls Section - Fixed Bottom */}
          <div className="px-6 pb-8">
            <div className="flex justify-center items-center gap-4">
              <Button 
                onClick={() => {
                  if (isRecording) {
                    stopRecording(handleRecordStop);
                    setAvatarState('idle');
                  } else {
                    startRecording();
                    setAvatarState('listening');
                  }
                }}
                disabled={serviceStatus === 'offline' || avatarState === 'thinking' || avatarState === 'speaking'}
                className={`px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                  avatarState === 'listening'
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 animate-pulse' 
                    : avatarState === 'thinking'
                    ? 'bg-amber-500 text-white shadow-amber-500/25 cursor-not-allowed'
                    : avatarState === 'speaking'
                    ? 'bg-emerald-500 text-white shadow-emerald-500/25 cursor-not-allowed animate-pulse'
                    : 'bg-[#ff6b1d] hover:bg-[#e55a1a] text-white shadow-[#ff6b1d]/25'
                } disabled:opacity-50 disabled:transform-none disabled:shadow-none`}
                size="lg"
              >
                <div className="flex items-center space-x-3">
                  {avatarState === 'listening' ? (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <span>Listening...</span>
                    </>
                  ) : avatarState === 'thinking' ? (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span>AI is thinking...</span>
                    </>
                  ) : avatarState === 'speaking' ? (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-0.5 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                      <span>AI is speaking...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <Mic className="h-3 w-3" />
                      </div>
                      <span>Start Speaking</span>
                    </>
                  )}
                </div>
              </Button>

              {/* New Session Button - Only show if we have conversation history */}
              {(history.length > 0 || isContinuedSession) && (
                <Button 
                  onClick={startNewSession}
                  variant="outline"
                  className="px-3 sm:px-4 py-2 rounded-xl border-gray-500/30 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-400/50 transition-all duration-200 text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Session</span>
                  <span className="sm:hidden">New</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Service Offline Modal */}
      {showServiceOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3c4043]/95 backdrop-blur-sm">
          <div className="bg-[#3c4043] backdrop-blur-md border border-[#5f6368]/30 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Service Unavailable</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowServiceOfflineModal(false)}
                className="w-8 h-8 p-0 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-slate-300">
                The therapy service is currently offline. Please check your connection and try again.
              </p>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-medium">Connection Failed</span>
              </div>
              
              {/* Crisis Support Section */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  <h3 className="text-red-300 font-semibold text-sm">Emergency Crisis Support</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-red-300">Mental Health Crisis Line:</span>
                    <span className="font-mono font-semibold text-red-200">1019</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-300">National Emergency:</span>
                    <span className="font-mono font-semibold text-red-200">1166</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-300">Rozan Crisis Helpline:</span>
                    <span className="font-mono font-semibold text-red-200">0800-00-100</span>
                  </div>
                </div>
                <p className="text-xs text-red-300 font-medium">
                  If you're in immediate crisis, please contact these numbers directly.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  // Retry connection
                  setServiceStatus('checking');
                  setShowServiceOfflineModal(false);
                }}
                className="flex-1 bg-[#ff6b1d] hover:bg-[#e55a1a] text-white"
              >
                Retry Connection
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowServiceOfflineModal(false)}
                className="px-6 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
};

export default EmotionalSupportVoice;
