import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InitialAssessment } from '@/components/assessment/initial-assessment';
import { Link, useLocation } from 'wouter';
import { 
  ArrowLeft, 
  ClipboardCheck, 
  CheckCircle,
  Home
} from 'lucide-react';

export default function Assessment() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAssessmentComplete = (data: any) => {
    console.log('Assessment completed with data:', data);
    
    toast({
      title: "Assessment Complete!",
      description: "Your personalized learning plan is ready. Redirecting to home...",
    });

    setIsCompleted(true);
    
    // Redirect to home after a short delay
    setTimeout(() => {
      setLocation('/');
    }, 3000);
  };

  const handleSkipAssessment = () => {
    toast({
      title: "Assessment Skipped",
      description: "You can take the assessment later from your dashboard.",
    });
    setLocation('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <p className="text-gray-600">Please log in to take the assessment.</p>
            <Button asChild className="mt-4">
              <Link href="/api/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for completing the assessment. We've created a personalized learning plan based on your responses.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
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
            <h1 className="text-2xl font-bold">Speech Assessment</h1>
            <p className="text-gray-600">Help us create your personalized learning plan</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ClipboardCheck className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Assessment</span>
        </div>
      </div>

      {/* Assessment Component */}
      <InitialAssessment 
        onComplete={handleAssessmentComplete}
        onSkip={handleSkipAssessment}
      />

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