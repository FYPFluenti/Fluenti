import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InitialAssessment } from '@/components/assessment/initial-assessment';
import { useLocation } from 'wouter';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function Assessment() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAssessmentComplete = (data: any) => {
    console.log('Assessment completed with data:', data);
    
    toast({
      title: "Welcome to Fluenti!",
      description: "Your personalized learning journey starts now.",
    });

    setIsCompleted(true);
    
    const userType = (user as any)?.userType;
    
    // Redirect based on user type
    setTimeout(() => {
      if (userType === 'child') {
        setLocation('/child-dashboard');
      } else if (userType === 'adult') {
        setLocation('/adult-dashboard');
      } else {
        setLocation('/');
      }
    }, 2500);
  };

  const handleSkipAssessment = () => {
    toast({
      title: "Skipped for now",
      description: "You can complete this assessment anytime from your dashboard.",
      variant: "default",
    });
    
    const userType = (user as any)?.userType;
    
    // Redirect based on user type
    if (userType === 'child') {
      setLocation('/child-dashboard');
    } else if (userType === 'adult') {
      setLocation('/adult-dashboard');
    } else {
      setLocation('/');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please log in to access the assessment.</p>
            <Button onClick={() => setLocation('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="text-center py-12 px-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-3">All Set! 🎉</h2>
            <p className="text-muted-foreground text-lg mb-6">
              Thank you for completing the assessment. We've created a personalized experience just for you.
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Taking you to your dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-background dark:to-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Assessment Card */}
        <Card className="shadow-2xl border-0">
          <CardContent className="p-8">
            <InitialAssessment 
              onComplete={handleAssessmentComplete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}