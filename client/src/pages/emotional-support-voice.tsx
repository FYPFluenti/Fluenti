import { useState, useEffect } from 'react';
import { useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import ModelViewerAvatar from '@/components/ModelViewerAvatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';
import { Mic, MicOff, Waves, Heart, Brain, Shield, X, AlertTriangle, RotateCcw } from 'lucide-react';
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

  // Get session ID from URL parameters
  const searchParams = new URLSearchParams(useSearch());
  const sessionIdFromUrl = searchParams.get('sessionId');
  
  // Use the session hook to fetch session data if continuing
  const { session: existingSession, loading: sessionLoading, error: sessionError } = useSession(sessionIdFromUrl);

  // Handle Coqui TTS audio playback directly
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
          }).catch(error => {
            console.error('❌ Coqui TTS audio playback failed:', error);
          });
        };
        
        audio.onended = () => {
          console.log('🏁 Coqui TTS audio playback completed');
          setAudioBase64(''); // Clear audio after playing
        };
        
        audio.onerror = (error) => {
          console.error('❌ Audio error:', error);
          setAudioBase64(''); // Clear audio on error
        };
        
      } catch (error) {
        console.error('❌ Failed to create audio:', error);
        setAudioBase64(''); // Clear audio on error
      }
    } else {
      console.log('🔇 Audio base64 cleared');
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

  // Check therapy service status on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const res = await fetch('http://localhost:5001/health');
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
          setSessionData({
            sessionId: data.sessionId || sessionData.sessionId,
            userId: data.userId || sessionData.userId,
            sessionKey: data.sessionKey || sessionData.sessionKey
          });
          console.log('📝 Session data updated:', {
            sessionId: data.sessionId || sessionData.sessionId,
            userId: data.userId || sessionData.userId,
            sessionKey: data.sessionKey || sessionData.sessionKey
          });
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
    }
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
          {/* Main Content Area - Grid Layout for stable positioning */}
          <div className="flex-1 grid grid-rows-[auto_1fr_auto] items-center px-6 py-8 gap-6 min-h-0">
            
            {/* Avatar Section - Fixed Top */}
            <div className="flex justify-center">
              <ModelViewerAvatar
                avatarUrl={avatarUrls.therapist}
                size="medium"
                className="drop-shadow-lg"
              />
            </div>

            {/* Response Section - Scrollable Middle */}
            <div className="flex justify-center overflow-y-auto min-h-0">
              {(response || displayedResponse) ? (
                <div className="w-full max-w-2xl">
                  <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                          <Brain className="h-5 w-5 text-cyan-400" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-cyan-600 font-semibold text-sm">AI Therapist</h3>
                          {isTyping && (
                            <div className="w-1 h-4 bg-cyan-400 animate-pulse rounded-sm"></div>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed">
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

            {/* Controls - Fixed Bottom */}
            <div className="flex justify-center">
              <Button 
                onClick={() => isRecording ? stopRecording(handleRecordStop) : startRecording()}
                disabled={serviceStatus === 'offline' || isProcessing || !!audioBase64}
                className={`px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25' 
                    : isProcessing
                    ? 'bg-amber-500 text-white shadow-amber-500/25 cursor-not-allowed'
                    : !!audioBase64
                    ? 'bg-cyan-500 text-white shadow-cyan-500/25 cursor-not-allowed'
                    : 'bg-[#ff6b1d] hover:bg-[#e55a1a] text-white shadow-[#ff6b1d]/25'
                } disabled:opacity-50 disabled:transform-none disabled:shadow-none`}
                size="lg"
              >
                <div className="flex items-center space-x-3">
                  {isRecording ? (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <span>Listening...</span>
                    </>
                  ) : isProcessing ? (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span>AI is thinking...</span>
                    </>
                  ) : !!audioBase64 ? (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
