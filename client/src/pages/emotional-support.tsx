import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmotionalChat } from "@/components/chat/emotional-chat";
import { RoleBasedComponent, UserTypeGuard } from "@/components/auth/RoleBasedComponent";
import { Link, useLocation } from "wouter";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
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
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'urdu'>('english');
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Set up speech recognition with proper language codes
  const speechLanguage = selectedLanguage === 'urdu' ? 'ur-PK' : 'en-US';
  const { startListening, stopListening, isListening, transcript, resetTranscript, error: speechError } = useSpeechRecognition(speechLanguage);

  // API call function for emotional support
  const processInput = async (audioBlob?: Blob) => {
    setIsProcessing(true);
    try {
      let requestBody: FormData | string;
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      };

      if (audioBlob) {
        // Send as FormData for audio
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('text', inputText);
        formData.append('language', speechLanguage);
        requestBody = formData;
      } else {
        // Send as JSON for text-only
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          text: inputText,
          language: speechLanguage
        });
      }

      const res = await fetch('/api/emotional-support', { 
        method: 'POST', 
        headers,
        body: requestBody 
      });
      
      if (!res.ok) {
        throw new Error('Failed to process input');
      }

      const data = await res.json();
      setResponse(data.response || 'I understand. Please tell me more.');
      
      toast({
        title: "Analysis Complete",
        description: `Detected emotion: ${data.detectedEmotion}`,
      });
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

  const handleRecord = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
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
                  selectedLanguage === 'english' 
                    ? 'fluenti-gradient-primary text-white shadow-lg' 
                    : 'fluenti-button-outline'
                }`}
                onClick={() => setSelectedLanguage('english')}
              >
                English
              </button>
              <button
                className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-medium transition-all duration-300 hover-lift ${
                  selectedLanguage === 'urdu' 
                    ? 'fluenti-gradient-primary text-white shadow-lg' 
                    : 'fluenti-button-outline'
                }`}
                onClick={() => setSelectedLanguage('urdu')}
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
                  placeholder={selectedLanguage === 'urdu' ? "اپنے جذبات یہاں لکھیں..." : "Share your feelings here..."}
                  className="flex-1 min-h-[44px] border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  disabled={isProcessing}
                  dir={selectedLanguage === 'urdu' ? 'rtl' : 'ltr'}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRecord}
                    variant={isListening ? "destructive" : "outline"}
                    disabled={isProcessing}
                    className="min-w-[100px] transition-all duration-300"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop
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
              {(isListening || isProcessing || speechError) && (
                <div className="flex flex-col gap-3">
                  {isListening && (
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                      <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">
                          Listening... {selectedLanguage === 'urdu' ? '(اردو میں بولیں)' : '(Speak now)'}
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
                {selectedLanguage === 'english' ? (
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

      {/* Emotional Chat Component */}
      <EmotionalChat language={selectedLanguage} />

        {/* Navigation Footer */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors hover-lift flex items-center">
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/speech-therapy" className="hover:text-primary transition-colors hover-lift">
              Speech Therapy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/progress" className="hover:text-primary transition-colors hover-lift">
              Progress Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}