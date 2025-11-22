import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";


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
  const [termsAccepted, setTermsAccepted] = useState(false);
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

      if (!termsAccepted) {
        setError("You must agree to the Terms of Service and Privacy Policy to create an account");
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
        setSuccess("Account created successfully! Please check your email to verify your account before logging in.");
        
        // No need to store token - it's in httpOnly cookie
        // Just clear and refresh queries
        queryClient.clear();
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
        
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
        <div className="relative z-10 flex flex-col justify-start items-start px-16 pt-24 text-slate-800">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">fluenti</h1>
            <div className="w-20 h-1 bg-orange-400 rounded-full"></div>
          </div>
          
          <h2 className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed mb-6 max-w-md">
            Join thousands improving their communication
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg">
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

          {/* Signup Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
              >
                <option value="">Select your role</option>
                <option value="child">Parent/Guardian</option>
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
                disabled={isLoading}
              >
                <option value="">Select language</option>
                <option value="english">English</option>
                
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
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
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                disabled={isLoading}
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
                disabled={isLoading || !termsAccepted}
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