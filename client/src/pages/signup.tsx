import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    language: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    
    try {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!");
        setIsLoading(false);
        return;
      }
      
      if (!formData.userType) {
        alert("Please select your role!");
        setIsLoading(false);
        return;
      }
      
      if (!formData.language) {
        alert("Please select your preferred language!");
        setIsLoading(false);
        return;
      }
      
      // Create new user account
      const response = await apiRequest('POST', '/api/auth/signup', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        language: formData.language
      });
      
      const data = await response.json();
      console.log('Signup response:', data); // Debug log
      
      if (data.success && data.user) {
        // Store auth token in localStorage for WebSocket connections and API requests
        if (data.authToken) {
          localStorage.setItem('authToken', data.authToken);
        } else {
          // Fallback to user ID if authToken not provided
          localStorage.setItem('authToken', data.user.id);
        }
        
        // Explicitly notify storage listeners (for useWebSocket)
        const storageEvent = new Event('storage');
        window.dispatchEvent(storageEvent);
        
        // Redirect to the appropriate dashboard based on user's actual type
        switch(data.user.userType) {
          case 'child':
            window.location.href = '/child-dashboard';
            break;
          case 'adult':
            window.location.href = '/adult-dashboard';
            break;
          case 'guardian':
            window.location.href = '/guardian-dashboard';
            break;
          default:
            window.location.href = '/';
        }
      } else {
        console.error('Signup failed:', data);
        alert(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen fluenti-gradient-primary relative overflow-hidden">
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
              <div className="w-12 h-12 fluenti-gradient-warm rounded-xl flex items-center justify-center shadow-lg fluenti-pulse">
                <MessageCircle className="text-white text-xl" />
              </div>
              <span className="text-3xl font-bold text-gradient-warm">Fluenti</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">Join Fluenti</h1>
            <p className="text-blue-100 text-lg animate-fade-in" style={{animationDelay: '0.1s'}}>Start your personalized speech therapy journey</p>
          </div>

          {/* Signup Form */}
          <div className="fluenti-card fluenti-card-interactive animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Fill in your details to get started</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
                      <input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        className="fluenti-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        className="fluenti-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="fluenti-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="userType" className="text-sm font-medium text-gray-700">I am a...</label>
                    <select 
                      id="userType"
                      value={formData.userType} 
                      onChange={(e) => handleInputChange('userType', e.target.value)}
                      className="fluenti-input"
                      aria-label="Select your role"
                      required
                    >
                      <option value="">Select your role</option>
                      <option value="child">Child (under 18)</option>
                      <option value="adult">Adult</option>
                      <option value="guardian">Parent/Guardian</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="language" className="text-sm font-medium text-gray-700">Preferred Language</label>
                    <select 
                      value={formData.language} 
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="fluenti-input"
                      aria-label="Select your preferred language"
                      required
                    >
                      <option value="">Select language</option>
                      <option value="english">English</option>
                      <option value="urdu">Urdu</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      className="fluenti-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      className="fluenti-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full fluenti-button-primary text-lg mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary-dark font-medium hover:underline transition-colors duration-300">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
