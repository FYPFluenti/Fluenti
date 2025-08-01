import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, LogOut, Home } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function Logout() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Perform logout operation
    const performLogout = async () => {
      try {
        // Call the logout API
        const response = await apiRequest('GET', '/api/logout');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Logout response:', data);
        }
        
        // Clear any local storage or session data
        localStorage.clear();
        sessionStorage.clear();
        
        // Wait a moment for the logout to process
        setTimeout(() => {
          setIsLoggingOut(false);
          setIsComplete(true);
        }, 1500);
        
      } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, proceed with logout
        localStorage.clear();
        sessionStorage.clear();
        setIsLoggingOut(false);
        setIsComplete(true);
      }
    };

    performLogout();
  }, []);

  const handleGoToLanding = () => {
    // Force a full page reload to ensure authentication state is cleared
    window.location.href = '/';
  };

  // Auto redirect with countdown
  useEffect(() => {
    if (isComplete) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            window.location.href = '/';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
            {isLoggingOut ? (
              <>
                <LogOut className="w-6 h-6 text-blue-500" />
                <span>Logging Out...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span>Logout Successful</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoggingOut ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600">
                Signing you out securely...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">
                  You have been successfully logged out
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Thank you for using Fluenti!
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleGoToLanding}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return to Homepage
                </Button>
                
                <p className="text-sm text-gray-500">
                  Redirecting to homepage in {countdown} seconds...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
