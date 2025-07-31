import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmotionalChat } from "@/components/chat/emotional-chat";
import { RoleBasedComponent, UserTypeGuard } from "@/components/auth/RoleBasedComponent";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Home, 
  Heart,
  Shield,
  Clock,
  Brain,
  Star,
  Smile
} from "lucide-react";

export default function EmotionalSupport() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'urdu'>('english');

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Emotional Support</h1>
            <p className="text-gray-600">Chat with our AI companion for emotional guidance</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedLanguage === 'english' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLanguage('english')}
            >
              English
            </Button>
            <Button
              variant={selectedLanguage === 'urdu' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLanguage('urdu')}
            >
              اردو
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span className="text-sm font-medium">AI Support</span>
          </div>
        </div>
      </div>

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
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors">
            <Home className="w-4 h-4 inline mr-1" />
            Home
          </Link>
          <span>•</span>
          <Link href="/speech-therapy" className="hover:text-primary transition-colors">
            Speech Therapy
          </Link>
          <span>•</span>
          <Link href="/progress" className="hover:text-primary transition-colors">
            Progress Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}