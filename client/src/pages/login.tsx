import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Validation
      if (!email?.trim() || !password?.trim()) {
        setError("Please enter both email and password");
        return;
      }

      if (!email.includes('@')) {
        setError("Please enter a valid email address");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      
      const response = await apiRequest('POST', '/api/auth/login', { 
        email: email.trim(),
        password: password.trim()
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        setSuccess("Login successful! Redirecting...");
        
        // No need to store token - it's in httpOnly cookie
        // Just clear and refresh queries
        queryClient.clear();
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect to home - it handles user type routing
        setTimeout(() => {
          setLocation('/');
        }, 1000);
        
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail?.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!resetEmail.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      const response = await apiRequest('POST', '/api/auth/forgot-password', { 
        email: resetEmail.trim()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("Password reset instructions have been sent to your email");
        setShowForgotPassword(false);
        setResetEmail("");
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Unable to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            AI-powered speech therapy platform
          </h2>
          
          <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
            Connect with AI speech therapists, track your progress, and improve your communication skills with personalized exercises.
          </p>
          
          <div className="mt-12 space-y-4 text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>AI-Powered Speech Analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Personalized Learning Path</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Real-time Feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
              Welcome back
            </h2>
            <p className="text-slate-600 text-lg">
              Sign in to continue your speech therapy journey
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

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Reset Password</h3>
              <form onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label htmlFor="resetEmail" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="resetEmail"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg 
                               placeholder-slate-400 text-slate-900
                               focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                               transition duration-200 text-sm"
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                             disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setError("");
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg
                             hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                             transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Login Form */}
          {!showForgotPassword && (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg 
                             placeholder-slate-400 text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                             transition duration-200 text-sm"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg 
                             placeholder-slate-400 text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                             transition duration-200 text-sm"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError("");
                    setResetEmail(email); // Pre-fill with current email
                  }}
                  className="text-sm font-medium text-orange-600 hover:text-orange-500 transition duration-200"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
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
                      Signing in...
                    </div>
                  ) : (
                    'Sign in to Fluenti'
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-slate-500">New to Fluenti?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <Link
                  href="/signup"
                  className="w-full flex justify-center py-3 px-4 border border-slate-300 
                           text-sm font-semibold rounded-lg text-slate-700 bg-white
                           hover:bg-slate-50 hover:border-slate-400
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                           transition duration-200"
                >
                  Create a free account
                </Link>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-xs text-slate-500">
              Protected by industry-standard encryption and privacy compliance
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