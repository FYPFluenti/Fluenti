import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RoleBasedComponent, UserTypeGuard } from "@/components/auth/RoleBasedComponent";
import { Link, useLocation } from "wouter";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useWebSocket } from "@/hooks/useWebSocket";
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
  MicOff
} from "lucide-react";

export default function EmotionalSupport() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  // Phase 1 Specification: Use 'en' | 'ur' language codes
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Phase 1: WebSocket integration for real-time communication
  const { socket, isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'emotional-support-response') {
        setResponse(data.response);
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
      
      // Update input text with transcription if available
      if (data.transcription) {
        setInputText(data.transcription);
      }
      
      toast({
        title: "Analysis Complete",
        description: `Detected emotion: ${data.emotion?.emotion || 'unknown'}`,
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-pink-300/20 rounded-full fluenti-float"></div>
      <div className="absolute top-20 right-20 w-12 h-12 bg-purple-300/20 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-indigo-300/20 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/">
              <button className="fluenti-button-outline hover-lift">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">Emotional Support</h1>
              <p className="text-gray-600 text-base md:text-lg">Chat with our AI companion for emotional guidance</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-medium transition-all duration-300 hover-lift ${
                  language === 'en' 
                    ? 'fluenti-gradient-primary text-white shadow-lg' 
                    : 'fluenti-button-outline'
                }`}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-medium transition-all duration-300 hover-lift ${
                  language === 'ur' 
                    ? 'fluenti-gradient-primary text-white shadow-lg' 
                    : 'fluenti-button-outline'
                }`}
                onClick={() => setLanguage('ur')}
              >
                اردو
              </button>
            </div>
            <div className="flex items-center space-x-2 bg-pink-50 px-3 py-2 rounded-lg">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-red-500 fluenti-pulse" />
              <span className="text-sm font-medium">AI Support</span>
            </div>
          </div>
        </div>

        {/* Phase 1 Test Interface */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Star className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-semibold text-gray-800">Voice & Text Input</h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Phase 1</span>
            </div>
            
            <div className="space-y-4">
              {/* Input Section */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={language === 'ur' ? "اپنے جذبات یہاں لکھیں..." : "Share your feelings here..."}
                  className="flex-1 min-h-[44px] border-pink-200 focus:border-pink-400 focus:ring-pink-400"
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
                    className="min-w-[100px] fluenti-gradient-primary hover:shadow-lg transition-all duration-300"
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
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">
                          Recording... {language === 'ur' ? '(اردو میں بولیں)' : '(Speak now)'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {isListening && !isRecording && (
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                      <div className="flex items-center space-x-2 text-pink-600">
                        <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">
                          Listening... {language === 'ur' ? '(اردو میں بولیں)' : '(Speak now)'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Processing your input...</span>
                      </div>
                    </div>
                  )}

                  {speechError && (
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-4 h-4 text-red-500">⚠️</div>
                        <span className="text-sm font-medium">{speechError}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Debug info for audio recording */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
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
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <Smile className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">AI Companion Response:</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{response}</p>
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
                      className="text-xs hover:bg-pink-50"
                      disabled={isProcessing}
                    >
                      Try: "I'm feeling anxious"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputText("I'm having trouble sleeping")}
                      className="text-xs hover:bg-purple-50"
                      disabled={isProcessing}
                    >
                      Try: "Trouble sleeping"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputText("I feel overwhelmed")}
                      className="text-xs hover:bg-indigo-50"
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
                      className="text-xs hover:bg-pink-50"
                      disabled={isProcessing}
                      dir="rtl"
                    >
                      Try: "میں پریشان ہوں"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputText("مجھے نیند نہیں آتی")}
                      className="text-xs hover:bg-purple-50"
                      disabled={isProcessing}
                      dir="rtl"
                    >
                      Try: "نیند کی مسئلہ"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputText("میں بہت تھکا ہوا محسوس کر رہا ہوں")}
                      className="text-xs hover:bg-indigo-50"
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
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Safe Space</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your conversations are private and secure. Share your feelings without judgment in this confidential environment.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800">24/7 Available</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get emotional support anytime you need it, day or night. We're always here when you need someone to listen.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover-lift sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800">AI-Powered</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Advanced emotional intelligence to understand and respond to your needs with empathy and care.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Footer */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors hover-lift flex items-center">
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
           
          </div>
        </div>
      </div>
    </div>
  );
}