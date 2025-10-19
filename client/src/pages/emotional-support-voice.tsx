import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ModelViewerAvatar from '@/components/ModelViewerAvatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';
import { Mic, MicOff, Waves, Heart, Brain, Shield } from 'lucide-react';
import SharedSidebarEmotional from '@/components/layout/SharedSidebarEmotional';
import FeedbackModal from '@/components/layout/FeedbackModel';
import PageHeader from '@/components/layout/PageHeader';

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
  const [emotion, setEmotion] = useState('');
  const [response, setResponse] = useState('');
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const { startRecording, stopRecording, isRecording } = useSpeechRecognition();

  // Check therapy service status on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const res = await fetch('http://localhost:5001/health');
        if (res.ok) {
          setServiceStatus('online');
        } else {
          setServiceStatus('offline');
        }
      } catch (error) {
        setServiceStatus('offline');
      }
    };
    
    checkServiceStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRecordStop = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('mode', 'voice');
      formData.append('language', language);
      formData.append('audio', blob, 'voice.wav');
      formData.append('history', JSON.stringify(history));
      formData.append('requestTTS', 'true'); // Request audio response
      
      // **NEW: Add session data for continuity (same as chat mode)**
      // Always send session data, even if undefined - backend will create new session if needed
      formData.append('sessionId', sessionData.sessionId || '');
      formData.append('userId', sessionData.userId || '');
      if (sessionData.sessionKey) {
        formData.append('sessionKey', sessionData.sessionKey);
      }

      console.log('🎙️ Sending voice input to therapy service with session data:', {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        sessionKey: sessionData.sessionKey
      });
      const res = await fetch('/api/emotional-support', { method: 'POST', body: formData });
      const data = await res.json();
      
      console.log('📥 Therapy service response:', data);
      
      if (data.success) {
        // **NEW: Update session data for continuity (same as chat mode)**
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
        setEmotion(data.emotion || 'neutral');
        setResponse(data.response || 'Processing your voice...');
        setHistory([...history, { 
          user: data.transcription || 'Voice input received', 
          ai: data.response || 'Processing...' 
        }]);

        // Handle crisis detection
        if (data.isCrisis && data.crisisLevel) {
          console.warn('🚨 Crisis detected:', data.crisisLevel);
          // You could add visual crisis indicators here
        }

        // Set TTS audio for ThreeAvatar to handle
        if (data.audioBase64) {
          console.log('🔊 Received TTS audio, passing to ThreeAvatar');
          setAudioBase64(data.audioBase64);
        } else {
          setAudioBase64(''); // Clear audio if none provided
        }
      } else {
        // Handle error response with crisis resources
        setResponse(data.response || 'Sorry, there was an error processing your voice input.');
        if (data.fallback) {
          console.warn('⚠️ Using fallback response due to service issues');
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      setResponse('Sorry, there was an error processing your voice input. If you\'re in crisis, please contact 988 (Suicide & Crisis Lifeline) or 911.');
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <SharedSidebarEmotional 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="voice"
      />

      {/* Main Content */}
      <div className="ml-20 flex-1 flex flex-col">
        <PageHeader />
        
        {/* Service Status - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
            serviceStatus === 'online' 
              ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' 
              : serviceStatus === 'offline' 
              ? 'bg-red-500/20 border-red-400/30 text-red-300'
              : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              serviceStatus === 'online' ? 'bg-emerald-400' :
              serviceStatus === 'offline' ? 'bg-red-400' :
              'bg-amber-400 animate-pulse'
            }`}></div>
            <span className="text-sm font-medium">
              {serviceStatus === 'checking' ? 'Connecting...' : serviceStatus}
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <ModelViewerAvatar
              avatarUrl={avatarUrls.therapist}
              size="large"
              className="mx-auto mb-8"
            />
            
            {isRecording && (
              <div className="mt-4 text-[#ff6b1d] font-semibold animate-pulse">
                Listening...
              </div>
            )}
            
            {response && (
              <div className="mt-4 p-4 bg-card border border-border rounded-xl shadow-lg max-w-lg mx-auto">
                <p className="text-sm text-muted-foreground mb-2">AI Response:</p>
                <p className="text-foreground text-lg">{response}</p>
                {emotion && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                    <Heart className="h-3 w-3 text-pink-400" />
                    <p className="text-pink-300 text-xs">Emotion: {emotion}</p>
                  </div>
                )}
              </div>
            )}

            {/* Service Offline Warning */}
            {serviceStatus === 'offline' && (
              <div className="mt-4 bg-red-900/30 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 shadow-2xl max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  <p className="text-red-300 font-medium text-sm">Service Unavailable</p>
                </div>
                <p className="text-red-200 text-xs mb-2">
                  The therapy service is offline. Please check the connection.
                </p>
                <p className="text-red-100 text-xs">
                  Crisis support: 988 (Suicide & Crisis Lifeline) or 911
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-muted border-t border-border">
          <div className="max-w-md mx-auto">
            <Button 
              onClick={() => isRecording ? stopRecording(handleRecordStop) : startRecording()}
              disabled={serviceStatus === 'offline'}
              className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#ff6b1d] hover:bg-[#e55a1a]'}`}
              size="lg"
            >
              {isRecording ? 'Stop Speaking' : 'Start Speaking'}
            </Button>
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

export default EmotionalSupportVoice;
