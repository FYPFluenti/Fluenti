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
    <div className="min-h-screen fluenti-gradient-cool relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full fluenti-float"></div>
      <div className="absolute top-32 right-16 w-16 h-16 bg-white/10 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
      
      <div className="flex items-center justify-center p-4 relative z-10 min-h-screen">
        <div className="w-full max-w-md animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/">
              <button className="fluenti-button-outline mb-4 hover-lift">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </button>
            </Link>
            <div className="flex items-center justify-center space-x-2 mb-4 hover-lift">
              <div className="w-12 h-12 fluenti-gradient-primary rounded-xl flex items-center justify-center shadow-lg fluenti-pulse">
                <MessageCircle className="text-white text-xl" />
              </div>
              <span className="text-3xl font-bold text-gradient-primary">Fluenti</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">Welcome Back</h1>
            <p className="text-blue-100 text-lg animate-fade-in" style={{animationDelay: '0.1s'}}>Sign in to continue your speech therapy journey</p>
          </div>

          {/* Login Form */}
          <div className="fluenti-card fluenti-card-interactive animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-600">Enter your credentials to access your account</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="fluenti-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="fluenti-input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full fluenti-button-primary text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:text-primary-dark font-medium hover:underline transition-colors duration-300">
                  Sign up here
                </Link>
              </div>
            </div>
          </div>

          {/* Development Mode Options */}
          <div className="mt-6 fluenti-card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="p-4">
              <p className="text-sm text-blue-800 text-center mb-3 font-medium">
                <strong>Development Mode - Select User Type:</strong>
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover-lift ${
                    userType === 'adult' 
                      ? 'fluenti-gradient-primary text-white shadow-lg' 
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => setUserType('adult')}
                >
                  Adult
                </button>
                <button 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover-lift ${
                    userType === 'child' 
                      ? 'fluenti-gradient-warm text-white shadow-lg' 
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => setUserType('child')}
                >
                  Child
                </button>
                <button 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover-lift ${
                    userType === 'guardian' 
                      ? 'fluenti-gradient-cool text-white shadow-lg' 
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => setUserType('guardian')}
                >
                  Guardian
                </button>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full fluenti-button-accent hover-lift"
              >
                {isLoading ? 'Logging in...' : `Login as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
