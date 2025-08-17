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
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Phase 3: State for emotion detection results
  const [lastProcessedData, setLastProcessedData] = useState<any>(null);

  // Adult Dashboard state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Phase 1: WebSocket integration for real-time communication
  const { socket, isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'emotional-support-response') {
        setResponse(data.response);
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
    setIsProcessing(true);
    
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
              text: inputText,
              language: language // Phase 1: Use 'en' | 'ur' language codes
            });
          };
          reader.readAsDataURL(audioBlob);
        } else {
          sendMessage({
            type: 'emotional-support',
            text: inputText,
            language: language
          });
        }
        return; // WebSocket will handle the response
      }

      // Fallback to HTTP API
      const formData = new FormData();
      if (audioBlob) formData.append('audio', audioBlob);
      formData.append('text', inputText);
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
      setResponse(data.response || 'I understand. Please tell me more.');
      
      // Phase 3: Store processed data for emotion display
      setLastProcessedData(data);
      
      // Update input text with transcription if available
      if (data.transcription) {
        setInputText(data.transcription);
      }
      
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
    <div className="flex h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      {/* Sidebar */}
      <motion.div 
        ref={sidebarRef}
        className="w-20 flex flex-col items-center py-6 bg-white/80 backdrop-blur-sm border-r border-gray-200 dark:bg-gray-800/80 dark:border-gray-700"
        initial={{ x: -50 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center space-y-6 h-full">
          {/* Top Navigation */}
          <div className="flex flex-col items-center space-y-4">
            <Link href="/adult-dashboard" className="group">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200">
                <Home className="w-5 h-5" />
              </div>
            </Link>
            <Link href="/adult-insights" className="group">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors duration-200">
                <BarChart className="w-5 h-5" />
              </div>
            </Link>
            <Link href="/adult-history" className="group">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200">
                <History className="w-5 h-5" />
              </div>
            </Link>
            <button onClick={() => setIsFeedbackOpen(true)} className="group">
              <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors duration-200">
                <ThumbsUp className="w-5 h-5" />
              </div>
            </button>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <Heart className="w-5 h-5" />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex-1 flex flex-col justify-end space-y-4">
            <button onClick={() => setIsSettingsOpen(true)} className="group">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <Settings className="w-5 h-5" />
              </div>
            </button>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <LogoutButton />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-6 bg-white/50 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Emotional Support</h1>
              <p className="text-gray-600 dark:text-gray-400">Chat with our AI companion for emotional guidance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                  language === 'en' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                  language === 'ur' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setLanguage('ur')}
              >
                اردو
              </button>
            </div>
            <DarkModeToggle />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Phase 1 Test Interface */}
            <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Voice & Text Input</h3>
                  <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium px-2.5 py-0.5 rounded-full">Phase 1</span>
                </div>
                
                <div className="space-y-4">
                  {/* Input Section */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={language === 'ur' ? "اپنے جذبات یہاں لکھیں..." : "Share your feelings here..."}
                      className="flex-1 min-h-[44px] border-pink-200 focus:border-pink-400 focus:ring-pink-400 dark:border-gray-600 dark:focus:border-pink-500"
                      disabled={isProcessing}
                      dir={language === 'ur' ? 'rtl' : 'ltr'}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRecord}
                        variant={(isListening || isRecording) ? "destructive" : "outline"}
                        disabled={isProcessing}
                        className="min-w-[100px] transition-all duration-300"
                      >
                        {(isListening || isRecording) ? (
                          <>
                            <MicOff className="w-4 h-4 mr-2" />
                            {isRecording ? "Stop Recording" : "Stop"}
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Record
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => processInput()}
                        disabled={!inputText.trim() || isProcessing}
                        className="min-w-[100px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  {(isListening || isRecording || isProcessing || speechError) && (
                    <div className="flex flex-col gap-3">
                      {isRecording && (
                        <div className="flex items-center justify-center p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">
                              Recording... {language === 'ur' ? '(اردو میں بولیں)' : '(Speak now)'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {isListening && !isRecording && (
                        <div className="flex items-center justify-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                          <div className="flex items-center space-x-2 text-pink-600 dark:text-pink-400">
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">
                              Listening... {language === 'ur' ? '(اردو میں بولیں)' : '(Speak now)'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {isProcessing && (
                        <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Processing your input...</span>
                          </div>
                        </div>
                      )}

                      {speechError && (
                        <div className="flex items-center justify-center p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                            <div className="w-4 h-4 text-red-500">⚠️</div>
                            <span className="text-sm font-medium">{speechError}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Debug info for audio recording */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-500 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div>Recording: {isRecording ? 'Yes' : 'No'}</div>
                          <div>Listening: {isListening ? 'Yes' : 'No'}</div>
                          <div>Audio Blob: {audioBlob ? `${audioBlob.size} bytes` : 'None'}</div>
                          <div>MediaRecorder Support: {navigator.mediaDevices ? 'Yes' : 'No'}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Response Section */}
                  {response && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <Smile className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300">AI Companion Response:</h4>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{response}</p>
                    </div>
                  )}

                  {/* Phase 3: Enhanced Emotion Detection Display */}
                  {lastProcessedData && lastProcessedData.emotion && (
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-semibold text-purple-900 dark:text-purple-300">Emotion Analysis:</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Primary Emotion Display as specified in Phase 3 */}
                        <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
                          <span className="font-medium text-gray-800 dark:text-gray-200">Detected Emotion:</span>
                          <div className="text-right">
                            <span className="font-semibold text-purple-700 dark:text-purple-400 capitalize">
                              {lastProcessedData.emotion.emotion}
                            </span>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Score: {Math.round(lastProcessedData.emotion.score * 100)}%
                            </div>
                          </div>
                        </div>

                        {/* Emotion Source and Confidence Indicator */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Detection Source:</span>
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                            {lastProcessedData.emotionSource || 'text-only'}
                          </span>
                        </div>

                        {/* Confidence Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.round(lastProcessedData.emotion.score * 100)}%` }}
                          ></div>
                        </div>

                        {/* Additional Emotion Metadata if available */}
                        {lastProcessedData.emotionDetails && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                            Analysis Method: {lastProcessedData.emotionDetails.method || 'Keyword-based fallback'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    {language === 'en' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputText("I'm feeling anxious about work today")}
                          className="text-xs hover:bg-pink-50 dark:hover:bg-pink-900/20"
                          disabled={isProcessing}
                        >
                          Try: "I'm feeling anxious"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputText("I'm having trouble sleeping")}
                          className="text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          disabled={isProcessing}
                        >
                          Try: "Trouble sleeping"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputText("I feel overwhelmed")}
                          className="text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          disabled={isProcessing}
                        >
                          Try: "Feeling overwhelmed"
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputText("میں کام کے بارے میں پریشان ہوں")}
                          className="text-xs hover:bg-pink-50 dark:hover:bg-pink-900/20"
                          disabled={isProcessing}
                          dir="rtl"
                        >
                          Try: "میں پریشان ہوں"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputText("مجھے نیند نہیں آتی")}
                          className="text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          disabled={isProcessing}
                          dir="rtl"
                        >
                          Try: "نیند کی مسئلہ"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputText("میں بہت تھکا ہوا محسوس کر رہا ہوں")}
                          className="text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          disabled={isProcessing}
                          dir="rtl"
                        >
                          Try: "تھکاوٹ"
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Features Info */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Safe Space</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Your conversations are private and secure. Share your feelings without judgment in this confidential environment.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">24/7 Available</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Get emotional support anytime you need it, day or night. We're always here when you need someone to listen.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">AI-Powered</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Advanced emotional intelligence to understand and respond to your needs with empathy and care.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Adult Settings Modal */}
      <AdultSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Adult Feedback Modal */}
      {isFeedbackOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsFeedbackOpen(false)}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Feedback</h2>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How was your session today?
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Comments
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Share your thoughts about the session..."
                />
              </div>

              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors">
                Submit Feedback
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}