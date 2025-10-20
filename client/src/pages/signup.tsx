import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

// Google and Facebook SDK types
declare global {
  interface Window {
    google: any;
    FB: any;
    fbAsyncInit: () => void;
  }
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
          callback: handleGoogleSignup,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    const loadGoogleScript = () => {
      if (!document.getElementById('google-signin-script')) {
        const script = document.createElement('script');
        script.id = 'google-signin-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.head.appendChild(script);
      } else {
        initializeGoogle();
      }
    };

    loadGoogleScript();
  }, []);

  // Initialize Facebook SDK
  useEffect(() => {
    const initializeFacebook = () => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID",
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };

      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    };

    initializeFacebook();
  }, []);

  // Handle Google Sign-up
  const handleGoogleSignup = async (response: any) => {
    setSocialLoading('google');
    setError("");
    
    try {
      const result = await apiRequest('POST', '/api/auth/google-signup', {
        credential: response.credential
      });
      
      const data = await result.json();
      
      if (data.success && data.user) {
        setSuccess("Account created successfully with Google! Redirecting...");
        
        // Store auth token
        const authToken = data.authToken || data.user.id;
        localStorage.setItem('authToken', authToken);
        
        // Trigger auth state update
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'authToken',
          newValue: authToken,
        }));
        
        // Clear and refresh queries
        queryClient.clear();
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect directly to appropriate dashboard based on user type
        const userType = data.user?.userType;
        setTimeout(() => {
          switch (userType) {
            case 'child':
              setLocation('/child-dashboard');
              break;
            case 'adult':
              setLocation('/adult-dashboard');
              break;
            default:
              setLocation('/child-dashboard');
          }
        }, 1000);
      } else {
        setError(data.message || 'Google signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Google signup failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  // Handle Facebook Sign-up
  const handleFacebookSignup = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please refresh and try again.');
      return;
    }

    setSocialLoading('facebook');
    setError("");

    window.FB.login((response: any) => {
      if (response.authResponse) {
        // Get user info from Facebook
        window.FB.api('/me', { fields: 'name,email,first_name,last_name,picture' }, async (userInfo: any) => {
          try {
            const result = await apiRequest('POST', '/api/auth/facebook-signup', {
              accessToken: response.authResponse.accessToken,
              userID: response.authResponse.userID,
              userInfo: userInfo
            });
            
            const data = await result.json();
            
            if (data.success && data.user) {
              setSuccess("Account created successfully with Facebook! Redirecting...");
              
              // Store auth token
              const authToken = data.authToken || data.user.id;
              localStorage.setItem('authToken', authToken);
              
              // Trigger auth state update
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'authToken',
                newValue: authToken,
              }));
              
              // Clear and refresh queries
              queryClient.clear();
              await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              
              // Redirect directly to appropriate dashboard based on user type
              const userType = data.user?.userType;
              setTimeout(() => {
                switch (userType) {
                  case 'child':
                    setLocation('/child-dashboard');
                    break;
                  case 'adult':
                    setLocation('/adult-dashboard');
                    break;
                  default:
                    setLocation('/child-dashboard');
                }
              }, 1000);
            } else {
              setError(data.message || 'Facebook signup failed. Please try again.');
            }
          } catch (error) {
            console.error('Facebook signup error:', error);
            setError('Facebook signup failed. Please try again.');
          } finally {
            setSocialLoading(null);
          }
        });
      } else {
        setSocialLoading(null);
        setError('Facebook login was cancelled.');
      }
    }, { scope: 'email,public_profile' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Validation
      if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
        setError("Please enter your first and last name");
        return;
      }

      if (!formData.email?.trim()) {
        setError("Please enter your email address");
        return;
      }

      if (!formData.email.includes('@')) {
        setError("Please enter a valid email address");
        return;
      }

      if (!formData.userType) {
        setError("Please select your role");
        return;
      }

      if (!formData.language) {
        setError("Please select your preferred language");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      
      const response = await apiRequest('POST', '/api/auth/signup', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        userType: formData.userType,
        language: formData.language
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        setSuccess("Account created successfully! Redirecting...");
        
        // Store auth token
        const authToken = data.authToken || data.user.id;
        localStorage.setItem('authToken', authToken);
        
        // Trigger auth state update
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'authToken',
          newValue: authToken,
        }));
        
        // Clear and refresh queries
        queryClient.clear();
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect directly to appropriate dashboard based on user type
        const userType = data.user.userType;
        setTimeout(() => {
          switch (userType) {
            case 'child':
              setLocation('/child-dashboard');
              break;
            case 'adult':
              setLocation('/adult-dashboard');
              break;
            default:
              setLocation('/child-dashboard');
          }
        }, 1000);
        
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: 'rgba(211, 211, 211, 0.3)' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:30px_30px]"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start px-16 text-slate-800">
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight mb-4">fluenti</h1>
            <div className="w-20 h-1 bg-orange-400 rounded-full"></div>
          </div>
          
          <h2 className="text-3xl font-light leading-relaxed mb-6 max-w-md">
            Join thousands improving their communication
          </h2>
          
          <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
            Create your account and start your personalized speech therapy journey with AI-powered tools and expert guidance.
          </p>
          
          <div className="mt-12 space-y-4 text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Free to Get Started</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Personalized Learning Path</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Progress Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Multiple Language Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">fluenti</h1>
            <div className="w-16 h-1 bg-orange-400 mx-auto rounded-full"></div>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Create your account
            </h2>
            <p className="text-slate-600 text-lg">
              Start your speech therapy journey today
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Social Signup Buttons */}
          <div className="mb-8 space-y-3">
            {/* Google Signup Button */}
            <button
              onClick={() => {
                if (window.google) {
                  window.google.accounts.id.prompt();
                } else {
                  setError('Google Sign-In not loaded. Please refresh and try again.');
                }
              }}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-lg 
                         bg-white text-slate-700 hover:bg-gray-50 hover:border-slate-400
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition duration-200 text-sm font-medium"
            >
              {socialLoading === 'google' ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing up with Google...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Facebook Signup Button */}
            <button
              onClick={handleFacebookSignup}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-lg 
                         bg-[#1877F2] text-white hover:bg-[#166FE5]
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition duration-200 text-sm font-medium"
            >
              {socialLoading === 'facebook' ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing up with Facebook...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-slate-500">Or create account with email</span>
            </div>
          </div>

          {/* Your existing form content remains the same */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* ... rest of your existing form fields ... */}
            {/* I'm keeping the rest of your form implementation as-is */}
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg 
                             placeholder-slate-400 text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                             transition duration-200 text-sm"
                    placeholder="John"
                    disabled={isLoading || socialLoading !== null}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg 
                             placeholder-slate-400 text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                             transition duration-200 text-sm"
                    placeholder="Doe"
                    disabled={isLoading || socialLoading !== null}
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg 
                           placeholder-slate-400 text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                           transition duration-200 text-sm"
                  placeholder="john@example.com"
                  disabled={isLoading || socialLoading !== null}
                />
              </div>
            </div>

            {/* User Type */}
            <div>
              <label htmlFor="userType" className="block text-sm font-semibold text-slate-700 mb-2">
                I am a...
              </label>
              <select 
                id="userType"
                value={formData.userType} 
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="block w-full px-3 py-3 border border-slate-300 rounded-lg 
                         text-slate-900 bg-white
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         transition duration-200 text-sm"
                required
                disabled={isLoading || socialLoading !== null}
              >
                <option value="">Select your role</option>
                <option value="child">Child (under 18)</option>
                <option value="adult">Adult</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-semibold text-slate-700 mb-2">
                Preferred Language
              </label>
              <select 
                id="language"
                value={formData.language} 
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="block w-full px-3 py-3 border border-slate-300 rounded-lg 
                         text-slate-900 bg-white
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         transition duration-200 text-sm"
                required
                disabled={isLoading || socialLoading !== null}
              >
                <option value="">Select language</option>
                <option value="english">English</option>
                <option value="urdu">Urdu</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg 
                           placeholder-slate-400 text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                           transition duration-200 text-sm"
                  placeholder="Create a password"
                  disabled={isLoading || socialLoading !== null}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || socialLoading !== null}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg 
                           placeholder-slate-400 text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                           transition duration-200 text-sm"
                  placeholder="Confirm your password"
                  disabled={isLoading || socialLoading !== null}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading || socialLoading !== null}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                disabled={isLoading || socialLoading !== null}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-700">
                I agree to the{' '}
                <Link href="/terms" className="text-orange-600 hover:text-orange-500 font-medium">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-orange-600 hover:text-orange-500 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || socialLoading !== null}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent 
                         text-sm font-semibold rounded-lg text-white 
                         bg-orange-600 hover:bg-orange-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-slate-500">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link
                href="/login"
                className="w-full flex justify-center py-3 px-4 border border-slate-300 
                         text-sm font-semibold rounded-lg text-slate-700 bg-white
                         hover:bg-slate-50 hover:border-slate-400
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         transition duration-200"
              >
                Sign in to existing account
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-xs text-slate-500">
              By creating an account, you agree to our terms and privacy policy
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-600">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-slate-400 hover:text-slate-600">
                Terms of Service
              </Link>
              <Link href="/help" className="text-xs text-slate-400 hover:text-slate-600">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}