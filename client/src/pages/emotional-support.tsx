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
  const { startListening, stopListening, isListening, transcript, resetTranscript } = useSpeechRecognition(speechLanguage);

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
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <button className="fluenti-button-outline hover-lift">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Emotional Support</h1>
              <p className="text-gray-600 text-lg">Chat with our AI companion for emotional guidance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover-lift ${
                  selectedLanguage === 'english' 
                    ? 'fluenti-gradient-primary text-white shadow-lg' 
                    : 'fluenti-button-outline'
                }`}
                onClick={() => setSelectedLanguage('english')}
              >
                English
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover-lift ${
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
              <Heart className="w-6 h-6 text-red-500 fluenti-pulse" />
            <span className="text-sm font-medium">AI Support</span>
          </div>
        </div>
      </div>

      {/* Phase 1 Test Interface */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Phase 1 Test - Voice & Text Input</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={selectedLanguage === 'urdu' ? "یہاں لکھیں..." : "Type here..."}
                className="flex-1"
                disabled={isProcessing}
              />
              <Button 
                onClick={handleRecord}
                variant={isListening ? "destructive" : "outline"}
                disabled={isProcessing}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? 'Stop' : 'Record'}
              </Button>
              <Button 
                onClick={() => processInput()}
                disabled={!inputText.trim() || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Send'}
              </Button>
            </div>
            
            {response && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">AI Response:</h4>
                <p className="text-sm">{response}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Support Features Info */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <h3 className="font-semibold">Safe Space</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your conversations are private and secure. Share your feelings without judgment.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-8 h-8 text-green-500" />
              <h3 className="font-semibold">24/7 Available</h3>
            </div>
            <p className="text-sm text-gray-600">
              Get emotional support anytime you need it, day or night.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Brain className="w-8 h-8 text-purple-500" />
              <h3 className="font-semibold">AI-Powered</h3>
            </div>
            <p className="text-sm text-gray-600">
              Advanced emotional intelligence to understand and respond to your needs.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Emotional Chat Component */}
      <EmotionalChat language={selectedLanguage} />

      {/* Navigation Footer */}
      <div className="mt-12 text-center animate-fade-in">
        <div className="inline-flex items-center space-x-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors hover-lift">
            <Home className="w-4 h-4 inline mr-1" />
            Home
          </Link>
          <span>•</span>
          <Link href="/speech-therapy" className="hover:text-primary transition-colors hover-lift">
            Speech Therapy
          </Link>
          <span>•</span>
          <Link href="/progress" className="hover:text-primary transition-colors hover-lift">
            Progress Dashboard
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}