import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState("adult");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Always use our development login endpoint for now
      const response = await fetch('/api/dev/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userType }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.success) {
        // Invalidate queries to refresh user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Wait a moment for the query to update
        setTimeout(() => {
          // Redirect to the appropriate dashboard based on user type
          switch(userType) {
            case 'child':
              setLocation('/child-dashboard');
              break;
            case 'adult':
              setLocation('/adult-dashboard');
              break;
            case 'guardian':
              setLocation('/guardian-dashboard');
              break;
            default:
              setLocation('/');
          }
        }, 1000);
      } else {
        console.error('Login failed:', data);
        alert('Login failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <MessageCircle className="text-white text-xl" />
            </div>
            <span className="text-3xl font-bold text-primary">Fluenti</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue your speech therapy journey</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full fluenti-button-primary"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Development Mode Options */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 text-center mb-3">
            <strong>Select User Type:</strong>
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button 
              variant={userType === 'adult' ? 'default' : 'outline'} 
              onClick={() => setUserType('adult')}
              className="text-sm py-2"
            >
              Adult
            </Button>
            <Button 
              variant={userType === 'child' ? 'default' : 'outline'} 
              onClick={() => setUserType('child')}
              className="text-sm py-2"
            >
              Child
            </Button>
            <Button 
              variant={userType === 'guardian' ? 'default' : 'outline'} 
              onClick={() => setUserType('guardian')}
              className="text-sm py-2"
            >
              Guardian
            </Button>
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Logging in...' : `Login as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
