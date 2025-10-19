import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThreeAvatar } from '@/components/ui/three-avatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition_simple';
import { Mic, MicOff, Waves, Heart, Brain, Shield } from 'lucide-react';

interface SessionData {
  sessionId?: string;
  userId?: string;
  sessionKey?: string;
}

const EmotionalSupportVoice = () => {
  const language = localStorage.getItem('language') || 'en';
  const supportLanguage = language === 'ur' ? 'urdu' : 'english';
  const [history, setHistory] = useState<{ user: string; ai: string }[]>([]);
  const [emotion, setEmotion] = useState('');
  const [response, setResponse] = useState('');
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData>({});
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
    <div className="h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black flex flex-col relative overflow-hidden">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-blue-900/10 to-purple-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

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

      {/* Main Content - Centered Avatar */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative">
          {/* Circular Avatar Border with Glow */}
          <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
            isRecording 
              ? 'ring-4 ring-red-400/50 shadow-2xl shadow-red-500/30' 
              : 'ring-4 ring-cyan-400/50 shadow-2xl shadow-cyan-500/30'
          }`}>
            <div className={`absolute inset-0 rounded-full animate-pulse ${
              isRecording ? 'bg-red-400/20' : 'bg-cyan-400/20'
            }`}></div>
          </div>

          {/* Avatar Container - Circular */}
          <div className="relative w-80 h-80 rounded-full overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-white/10">
            <ThreeAvatar 
              isListening={isRecording}
              currentMessage={response}
              language={supportLanguage}
              audioBase64={audioBase64}
              voiceModel={audioBase64 ? 'coqui' : 'browser'}
              enableLipSync={true}
            />
          </div>

          {/* Recording Pulse Animation */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-20"></div>
              <div className="absolute inset-4 rounded-full border-2 border-red-400 animate-ping opacity-40 animation-delay-150"></div>
              <div className="absolute inset-8 rounded-full border-2 border-red-400 animate-ping opacity-60 animation-delay-300"></div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="flex flex-col items-center pb-8 px-6">
          {/* Status Message */}
          <div className="mb-6 text-center">
            <h2 className="text-white text-xl font-medium mb-2">
              {isRecording ? 'Listening...' : 'Ready to talk'}
            </h2>
            <p className="text-slate-300 text-sm">
              {isRecording ? 'Speak naturally, I\'m here to help' : 'Tap the mic to start'}
            </p>
          </div>

          {/* Floating Control Card */}
          <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full">
            {/* Main Voice Button */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-medium">Voice Session</p>
                <p className="text-slate-400 text-sm">
                  {serviceStatus === 'online' ? 'AI Therapist ready' : 'Service unavailable'}
                </p>
              </div>
              
              {/* Mic Button - Circular like the design */}
              <button 
                onClick={() => isRecording ? stopRecording(handleRecordStop) : startRecording()}
                disabled={serviceStatus === 'offline'}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-6 w-6 text-white" />
                ) : (
                  <Mic className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* AI Response Floating Card */}
          {response && (
            <div className="mt-4 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-w-md w-full">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500/20 p-2 rounded-lg">
                  <Brain className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-cyan-300 text-sm font-medium mb-1">AI Therapist</p>
                  <p className="text-white text-sm leading-relaxed">{response}</p>
                  {emotion && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                      <Heart className="h-3 w-3 text-pink-400" />
                      <p className="text-pink-300 text-xs">Emotion: {emotion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Service Offline Warning */}
          {serviceStatus === 'offline' && (
            <div className="mt-4 bg-red-900/30 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 shadow-2xl max-w-md w-full">
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
    </div>
  );
};

export default EmotionalSupportVoice;
