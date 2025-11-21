import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingStatus } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import FluentiLogo from "@/components/FluentiLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import ModelViewerAvatar from "@/components/ModelViewerAvatar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { UserTypeCard } from "@/components/UserTypeCard";
import FeatureCard from "@/components/FeatureCard";
import Spline from '@splinetool/react-spline';


import { 
  MessageCircle, 
  Users, 
  Mic, 
  Brain, 
  BarChart3, 
  Play, 
  Clock, 
  Trophy, 
  Target,
  Settings,
  User,
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

// Demo avatars
const avatarUrls = {
  therapist: "https://models.readyplayer.me/68ab4a2c3f2023411197a0fa.glb",
  professional: "https://models.readyplayer.me/68ab4ab5e05b84c2efb26767.glb",
  casual: "https://models.readyplayer.me/68aa261a75e83eeb00564816.glb",
};

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { onboardingStatus, isLoading: isOnboardingLoading } = useOnboardingStatus();
  
  // State variables
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showChatHelper, setShowChatHelper] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedTherapistType, setSelectedTherapistType] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'user' | 'ai'; content: string; timestamp: Date }>>([]);
  
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  //  STEP 1: Redirect authenticated users - check onboarding for children only
  useEffect(() => {
    if (!isLoading && !isOnboardingLoading && isAuthenticated && user) {
      const userType = (user as any)?.userType;
      console.log('User type detected:', userType);
      console.log('Onboarding status:', onboardingStatus);
      
      // Check if CHILD user needs onboarding first
      const needsOnboarding = onboardingStatus ? !onboardingStatus.isCompleted : true;
      
      if (needsOnboarding && userType === 'child') {
        console.log('Child user needs onboarding, redirecting to onboarding flow');
        setLocation('/onboarding');
        return;
      }
      
      // Redirect to appropriate dashboard based on user type
      switch (userType) {
        case 'child':
          console.log('Redirecting to child dashboard');
          setLocation('/child-dashboard');
          break;
        case 'adult':
          console.log('Redirecting to adult dashboard');
          setLocation('/adult-dashboard');
          break;
        
        default:
          console.log('Unknown user type, redirecting to child dashboard');
          setLocation('/child-dashboard');
      }
    }
  }, [isAuthenticated, isLoading, isOnboardingLoading, user, onboardingStatus, setLocation]);

  // Feedback submit function
  const submitFeedback = () => {
    setShowFeedback(false);
    setFeedback("");
  };

  // Get user location with explicit permission request
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser. Please use a modern browser.'));
        return;
      }

      setRequestingLocation(true);
      setLocationPermissionDenied(false);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRequestingLocation(false);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setRequestingLocation(false);
          let errorMessage = 'Location access denied.';
          
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermissionDenied(true);
            errorMessage = 'Location permission denied. Please allow location access to find nearby therapists.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information unavailable. Please check your device settings.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'Location request timed out. Please try again.';
          } else {
            errorMessage = `Location error: ${error.message}`;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  };

  // Find therapists
  const findTherapists = async (therapistType: string) => {
    setIsLoadingTherapists(true);
    setLocationError(null);

    try {
      // Get user location
      const location = await getUserLocation();
      setUserLocation(location);

      // Call API to find therapists
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
        ? 'https://fluenti-app.onrender.com' 
        : 'http://localhost:3000');

      const response = await fetch(`${API_BASE_URL}/api/therapists/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          therapistType: therapistType,
          radius: 10000 // 10km radius
        })
      });

      if (!response.ok) {
        throw new Error('Failed to find therapists');
      }

      const data = await response.json();
      
      if (data.success && data.therapists) {
        setTherapists(data.therapists);
        
        // Add AI response message
        const totalFound = data.totalFound || data.therapists.length;
        const aiMessage = data.therapists.length > 0
          ? `I analyzed ${totalFound} nearby ${therapistType} therapist${totalFound > 1 ? 's' : ''} and found the top 3 with the highest reviews and ratings:`
          : `I couldn't find any ${therapistType} therapists in your immediate area. Try expanding your search radius or check back later.`;
        
        setChatMessages(prev => [...prev, {
          type: 'ai',
          content: aiMessage,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'No therapists found');
      }
    } catch (error) {
      console.error('Error finding therapists:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to find therapists');
      
      setChatMessages(prev => [...prev, {
        type: 'ai',
        content: `I'm sorry, I encountered an error while searching for therapists. ${error instanceof Error ? error.message : 'Please try again later.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoadingTherapists(false);
    }
  };

  // Handle therapist type selection
  const handleTherapistTypeSelection = (type: 'speech' | 'emotional' | 'mental') => {
    setSelectedTherapistType(type);
    const typeLabel = type === 'speech' ? 'speech therapist' : type === 'emotional' ? 'emotional therapist' : 'mental health therapist';
    
    // Add user message
    const userMessage = type === 'speech' 
      ? "I need a speech therapist"
      : "I need an emotional/mental health therapist";
    
    setChatMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    // Add AI message requesting location permission
    setChatMessages(prev => [...prev, {
      type: 'ai',
      content: `Great! I'll help you find ${typeLabel}s near you. To find the closest therapists, I need to access your location. Please allow location access when prompted by your browser.`,
      timestamp: new Date()
    }]);

    // Find therapists (this will request location permission)
    findTherapists(type);
  };

  // Reset chat when modal opens
  useEffect(() => {
    if (showChatHelper) {
      setChatMessage("");
      setSelectedTherapistType(null);
      setTherapists([]);
      setLocationError(null);
      setRequestingLocation(false);
      setLocationPermissionDenied(false);
      setUserLocation(null);
      setChatMessages([{
        type: 'ai',
        content: "Hi! I'm here to help you find qualified speech and emotional therapists in your area. What type of support are you looking for?",
        timestamp: new Date()
      }]);
    }
  }, [showChatHelper]);

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
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/*  3D Background - Only Behind Hero Section */}
        <div className="absolute inset-0 w-full h-screen z-0"> {/* CHANGED: fixed → absolute, h-full → h-screen */}
          <Spline 
            scene="https://prod.spline.design/d1ABYikBmZ80miSz/scene.splinecode"
            className="w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none', // Prevents interaction interference
              opacity: 0.8,
        filter: 'none' //
      }}
    />
  </div>
       
  {/* Header*/}
  <header className="absolute top-0 w-full z-50  bg-white/2">
    <div className="max-w-7xl mx-auto px-5 py-4"> 
      <div className="flex items-center justify-between h-24 pt-6">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="relative group">
            <FluentiLogo className="w-12 h-12 lg:w-14 lg:h-14 text-[#ff6b1d] transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#ff6b1d]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">fluenti</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Link href="/login">
            <Button 
              variant="ghost"
              className="text-base font-medium text-gray-700 hover:text-gray-900 h-11 px-6 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              className="bg-[#ff6b1d] hover:bg-[#e55a1a] text-white text-base font-medium h-11 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              sign up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </header>

  {/* Hero Section - NO CHANGES */}
  <section className="pt-24 min-h-screen flex items-center relative z-10"> {/* ADDED: relative z-10 */}
    <div className="max-w-7xl mx-auto px-6 w-full">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side - Text Content */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              it's not therapy.
              <br />
              it's just{" "}
              <span className="text-[#ff6b1d]">fluenti.</span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              your ai speech therapist built to help you communicate 
              with confidence and clarity.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/signup">
              <Button 
                size="lg"
                className="bg-[#ff6b1d] hover:bg-[#e55a1a] text-white px-8 py-3 text-lg rounded-lg font-medium"
              >
                start speaking — it's free
              </Button>
            </Link>
            
            <p className="text-sm text-gray-500">
              loved by 10,000+ people
            </p>
          </div>
        </div>

        {/* Right Side - YOUR SPLINE 3D AVATAR (UNCHANGED) */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            
            
            {/* Enlarged 3D Model Container (No White Box) */}
            <div className="relative">
              {/* ENLARGED SIZE: Increased from w-80 h-80 lg:w-96 lg:h-96 to w-96 h-96 lg:w-[28rem] lg:h-[28rem] */}
              {/* POSITIONED LEFT: Added -ml-8 lg:-ml-12 */}
              <div className="w-96 h-96 lg:w-[28rem] lg:h-[28rem] relative -ml-8 lg:-ml-12">
                
                {/* Spline 3D Model - Direct Integration */}
                <div className="w-full h-full relative">
                  <Spline 
                    scene="https://prod.spline.design/NKxj87myxipVSVjM/scene.splinecode"
                    className="w-full h-full"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '0' // REMOVED BORDER RADIUS
                    }}
                    onLoad={() => {
                      console.log('✅ Spline model loaded successfully!');
                      const loadingEl = document.getElementById('spline-loading-enlarged');
                      if (loadingEl) {
                        loadingEl.style.opacity = '0';
                        setTimeout(() => loadingEl.style.display = 'none', 500);
                      }
                    }}
                    onError={(error) => {
                      console.error('❌ Spline model failed to load:', error);
                      const loadingEl = document.getElementById('spline-loading-enlarged');
                      const fallbackEl = document.getElementById('spline-fallback-enlarged');
                      if (loadingEl) loadingEl.style.display = 'none';
                      if (fallbackEl) fallbackEl.style.display = 'flex';
                    }}
                  />
                </div>
                
                {/* Loading State - No Box Styling */}
                <div 
                  id="spline-loading-enlarged"
                  className="absolute inset-0 flex items-center justify-center bg-transparent z-10 transition-opacity duration-500"
                >
                  <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b1d] mx-auto mb-4"></div>
                    <p className="text-gray-600 text-sm font-medium">Loading...</p>
                    <p className="text-gray-400 text-xs mt-1">Your AI therapist is coming to life!</p>
                  </div>
                </div>
                
                {/* Fallback State - No Box Styling */}
                <div 
                  id="spline-fallback-enlarged"
                  className="absolute inset-0 hidden items-center justify-center bg-transparent z-10"
                >
                  <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#ff6b1d] to-[#ff8a4a] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <span className="text-3xl"></span>
                    </div>
                    <p className="text-gray-700 text-sm font-medium">Hi!</p>
                    <p className="text-gray-500 text-xs mt-1">Your AI Speech Therapist</p>
                  </div>
                </div>
                
              </div>
              
              {/* Floating Name Tag - Repositioned for Larger Model */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200 z-30">
                <p className="text-sm font-medium text-gray-900"></p>
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* 2. FEATURES SECTION - Show what Fluenti does */}
  <section className="py-24 bg-gray-50 relative z-10">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          how fluenti works
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          professional speech therapy powered by ai technology
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-12">
        {/* Real-time Feedback Card */}
        <div className="text-center group cursor-pointer p-8 rounded-3xl transition-all duration-300 hover:bg-white hover:shadow-2xl hover:scale-105">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center border border-gray-200">
            <Mic className="w-8 h-8 text-[#ff6b1d]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            real-time feedback
          </h3>
          <p className="text-gray-600 leading-relaxed">
            instant pronunciation analysis as you speak with advanced voice recognition
          </p>
        </div>
        
        {/* Personalized AI Card */}
        <div className="text-center group cursor-pointer p-8 rounded-3xl transition-all duration-300 hover:bg-white hover:shadow-2xl hover:scale-105">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center border border-gray-200">
            <Brain className="w-8 h-8 text-[#ff6b1d]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            personalized ai
          </h3>
          <p className="text-gray-600 leading-relaxed">
            adapts to your unique learning style and speech patterns for optimal results
          </p>
        </div>
        
        {/* Track Progress Card */}
        <div className="text-center group cursor-pointer p-8 rounded-3xl transition-all duration-300 hover:bg-white hover:shadow-2xl hover:scale-105">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center border border-gray-200">
            <BarChart3 className="w-8 h-8 text-[#ff6b1d]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            track progress
          </h3>
          <p className="text-gray-600 leading-relaxed">
            detailed analytics show your improvement journey with clear insights
          </p>
        </div>
      </div>
    </div>
  </section>

  {/* AI Therapists Section – Simple, Supportive, Minimal UI */}
<section className="py-16 bg-white relative z-10">
  <div className="max-w-4xl mx-auto px-6">
    
    {/* Section Header */}
    <div className="text-center mb-10">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
        Meet Your AI Therapy Companions
      </h2>
      <p className="text-lg text-gray-600 max-w-xl mx-auto">
        You're not alone on your journey—choose from our caring AI companions, each here to guide and support you through every step of your speech journey.
      </p>
    </div>
    
    {/* Avatars Row */}
    <div className="grid md:grid-cols-3 gap-8">
      {/* Luna */}
      <div className="flex flex-col items-center text-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="w-full flex justify-center">
          <ModelViewerAvatar
            avatarUrl={avatarUrls.therapist}
            size="small"
            className="w-32 h-48 object-contain"
            autoRotate={true}
            cameraControls={false}
          />
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 text-lg">Luna</h3>
          <p className="text-sm text-gray-600 mt-1 mb-2">Gentle Encourager</p>
          <p className="text-gray-500 text-sm">
            Brings warmth, playfulness, and gentle encouragement—ideal for building confidence in every session.
          </p>
        </div>
      </div>
      
      {/* Victor */}
      <div className="flex flex-col items-center text-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="w-full flex justify-center">
          <ModelViewerAvatar
            avatarUrl={avatarUrls.professional}
            size="small"
            className="w-32 h-48 object-contain"
            autoRotate={true}
            cameraControls={false}
          />
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 text-lg">Victor</h3>
          <p className="text-sm text-gray-600 mt-1 mb-2">Steady Motivator</p>
          <p className="text-gray-500 text-sm">
            Guides you with calm reassurance and steady motivation—perfect for adults and professionals seeking progress.
          </p>
        </div>
      </div>
      
      {/* Serena */}
      <div className="flex flex-col items-center text-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="w-full flex justify-center">
          <ModelViewerAvatar
            avatarUrl={avatarUrls.casual}
            size="small"
            className="w-32 h-48 object-contain"
            autoRotate={true}
            cameraControls={false}
          />
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 text-lg">Serena</h3>
          <p className="text-sm text-gray-600 mt-1 mb-2">Empathetic Listener</p>
          <p className="text-gray-500 text-sm">
            Offers a safe, supportive space—listens with empathy and helps you grow at your own pace.
          </p>
        </div>
      </div>
    </div>
    
    {/* Subtle Supportive Note */}
    <div className="text-center mt-10">
      <p className="text-sm text-gray-400">
        Every AI companion is designed to make your speech journey feel welcoming, positive, and uniquely yours.
      </p>
    </div>
  </div>
</section>

  {/* 4. STATS SECTION - Show credibility and results */}
  <section className="py-24 bg-[#ff6b1d] text-white relative z-10">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">
          making a real impact
        </h2>
        <p className="text-xl opacity-90">
          helping thousands improve their communication skills
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">10,000+</div>
          <p className="opacity-90 text-sm md:text-base">active users</p>
        </div>
        <div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">87%</div>
          <p className="opacity-90 text-sm md:text-base">improvement rate</p>
        </div>
        <div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">50+</div>
          <p className="opacity-90 text-sm md:text-base">languages supported</p>
        </div>
        <div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">4.9★</div>
          <p className="opacity-90 text-sm md:text-base">user rating</p>
        </div>
      </div>
    </div>
  </section>

  {/* 5. TESTIMONIALS SECTION - Social proof after stats */}
  <section className="py-24 bg-gray-50 relative z-10">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          what our users are saying
        </h2>
        <p className="text-lg text-gray-600">
          real stories from real people improving their speech
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Sarah's Testimonial */}
        <div className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-[#ff6b1d] rounded-full flex items-center justify-center text-white font-bold">
              S
            </div>
            <div className="ml-4">
              <h4 className="font-semibold">Sarah M.</h4>
              <p className="text-sm text-gray-500">Parent</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            "My 8-year-old son's pronunciation improved dramatically in just 3 weeks. 
            The AI makes practice fun and engaging!"
          </p>
          <div className="flex text-yellow-400">
            ⭐⭐⭐⭐⭐
          </div>
        </div>
        
        {/* Ahmed's Testimonial */}
        <div className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-[#ff6b1d] rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="ml-4">
              <h4 className="font-semibold">Ahmed K.</h4>
              <p className="text-sm text-gray-500">Adult learner</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            "As someone learning English, Fluenti helped me gain confidence in speaking. 
            The real-time feedback is incredible."
          </p>
          <div className="flex text-yellow-400">
            ⭐⭐⭐⭐⭐
          </div>
        </div>
        
        {/* Dr. Lisa's Testimonial */}
        <div className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-[#ff6b1d] rounded-full flex items-center justify-center text-white font-bold">
              L
            </div>
            <div className="ml-4">
              <h4 className="font-semibold">Dr. Lisa Chen</h4>
              <p className="text-sm text-gray-500">Speech Therapist</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            "I recommend Fluenti to my patients' families. It's like having 
            a speech therapist available 24/7."
          </p>
          <div className="flex text-yellow-400">
            ⭐⭐⭐⭐⭐
          </div>
        </div>
        
      </div>
    </div>
  </section>

  {/* 6. FAQ SECTION - Address concerns before CTA */}
  <section className="py-24 bg-white relative z-10">
    <div className="max-w-4xl mx-auto px-6">
      
      {/* Header with Increased Distance */}
      <div className="text-center mb-32"> 
        <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 tracking-tight">
          frequently asked questions
        </h2>
      </div>
      
      {/* FAQ Items */}
      <div className="space-y-6"> 
        
        {/* FAQ Item 1 */}
        <div className="border-b border-gray-200 pb-6"> 
          <button 
            className="w-full flex items-center justify-between text-left group focus:outline-none"
            onClick={() => {
              const content = document.getElementById('faq-content-1');
              const icon = document.getElementById('faq-icon-1');
              const isHidden = content?.classList.contains('hidden');
              
              // Close all other FAQs
              document.querySelectorAll('[id^="faq-content-"]').forEach(el => {
                if (el.id !== 'faq-content-1') el.classList.add('hidden');
              });
              document.querySelectorAll('[id^="faq-icon-"]').forEach(el => {
                if (el.id !== 'faq-icon-1') el.classList.remove('rotate-180');
              });
              
              // Toggle current FAQ
              if (isHidden) {
                content?.classList.remove('hidden');
                icon?.classList.add('rotate-180');
              } else {
                content?.classList.add('hidden');
                icon?.classList.remove('rotate-180');
              }
            }}
          >
            <h3 className="text-xl font-semibold text-gray-900 pr-8 transition-all duration-200 group-hover:underline group-hover:text-[#ff6b1d] underline-offset-4"> 
              how does ai speech therapy work?
            </h3>
            <div id="faq-icon-1" className="flex-shrink-0 w-6 h-6 text-gray-400 transform transition-transform duration-300 group-hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <div id="faq-content-1" className="hidden mt-6 pl-0"> 
            <p className="text-lg text-gray-700 leading-relaxed">
              fluenti uses advanced ai models to analyze your speech patterns in real-time. you simply speak to the app, and it 
              responds with instant feedback on pronunciation, pace, and clarity, helping you improve your communication skills faster.
            </p>
          </div>
        </div>

        {/* FAQ Item 2 */}
        <div className="border-b border-gray-200 pb-6">
          <button 
            className="w-full flex items-center justify-between text-left group focus:outline-none"
            onClick={() => {
              const content = document.getElementById('faq-content-2');
              const icon = document.getElementById('faq-icon-2');
              const isHidden = content?.classList.contains('hidden');
              
              // Close all other FAQs
              document.querySelectorAll('[id^="faq-content-"]').forEach(el => {
                if (el.id !== 'faq-content-2') el.classList.add('hidden');
              });
              document.querySelectorAll('[id^="faq-icon-"]').forEach(el => {
                if (el.id !== 'faq-icon-2') el.classList.remove('rotate-180');
              });
              
              // Toggle current FAQ
              if (isHidden) {
                content?.classList.remove('hidden');
                icon?.classList.add('rotate-180');
              } else {
                content?.classList.add('hidden');
                icon?.classList.remove('rotate-180');
              }
            }}
          >
            <h3 className="text-xl font-semibold text-gray-900 pr-8 transition-all duration-200 group-hover:underline group-hover:text-[#ff6b1d] underline-offset-4">
              is fluenti suitable for children?
            </h3>
            <div id="faq-icon-2" className="flex-shrink-0 w-6 h-6 text-gray-400 transform transition-transform duration-300 group-hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <div id="faq-content-2" className="hidden mt-6 pl-0">
            <p className="text-lg text-gray-700 leading-relaxed">
              absolutely! fluenti is designed for all ages, with special kid-friendly interfaces, games, and activities that make 
              speech therapy fun and engaging for children aged 4 and up. our child-safe environment ensures secure learning.
            </p>
          </div>
        </div>

        {/* FAQ Item 3 */}
        <div className="border-b border-gray-200 pb-6">
          <button 
            className="w-full flex items-center justify-between text-left group focus:outline-none"
            onClick={() => {
              const content = document.getElementById('faq-content-3');
              const icon = document.getElementById('faq-icon-3');
              const isHidden = content?.classList.contains('hidden');
              
              // Close all other FAQs
              document.querySelectorAll('[id^="faq-content-"]').forEach(el => {
                if (el.id !== 'faq-content-3') el.classList.add('hidden');
              });
              document.querySelectorAll('[id^="faq-icon-"]').forEach(el => {
                if (el.id !== 'faq-icon-3') el.classList.remove('rotate-180');
              });
              
              // Toggle current FAQ
              if (isHidden) {
                content?.classList.remove('hidden');
                icon?.classList.add('rotate-180');
              } else {
                content?.classList.add('hidden');
                icon?.classList.remove('rotate-180');
              }
            }}
          >
            <h3 className="text-xl font-semibold text-gray-900 pr-8 transition-all duration-200 group-hover:underline group-hover:text-[#ff6b1d] underline-offset-4">
              is fluenti a replacement for traditional speech therapy?
            </h3>
            <div id="faq-icon-3" className="flex-shrink-0 w-6 h-6 text-gray-400 transform transition-transform duration-300 group-hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <div id="faq-content-3" className="hidden mt-6 pl-0">
            <p className="text-lg text-gray-700 leading-relaxed">
              fluenti is designed to complement traditional therapy, not replace it. it provides convenient practice between sessions 
              and can significantly accelerate progress when used alongside professional speech-language pathologist care.
            </p>
          </div>
        </div>

        {/* FAQ Item 4 */}
        <div className="border-b border-gray-200 pb-6">
          <button 
            className="w-full flex items-center justify-between text-left group focus:outline-none"
            onClick={() => {
              const content = document.getElementById('faq-content-4');
              const icon = document.getElementById('faq-icon-4');
              const isHidden = content?.classList.contains('hidden');
              
              // Close all other FAQs
              document.querySelectorAll('[id^="faq-content-"]').forEach(el => {
                if (el.id !== 'faq-content-4') el.classList.add('hidden');
              });
              document.querySelectorAll('[id^="faq-icon-"]').forEach(el => {
                if (el.id !== 'faq-icon-4') el.classList.remove('rotate-180');
              });
              
              // Toggle current FAQ
              if (isHidden) {
                content?.classList.remove('hidden');
                icon?.classList.add('rotate-180');
              } else {
                content?.classList.add('hidden');
                icon?.classList.remove('rotate-180');
              }
            }}
          >
            <h3 className="text-xl font-semibold text-gray-900 pr-8 transition-all duration-200 group-hover:underline group-hover:text-[#ff6b1d] underline-offset-4">
              is my speech data secure and confidential?
            </h3>
            <div id="faq-icon-4" className="flex-shrink-0 w-6 h-6 text-gray-400 transform transition-transform duration-300 group-hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <div id="faq-content-4" className="hidden mt-6 pl-0">
            <p className="text-lg text-gray-700 leading-relaxed">
              absolutely. your privacy is our priority. we use end-to-end encryption, follow HIPAA compliance standards, 
              and never share your data with third parties without explicit consent. all processing is secure and confidential.
            </p>
          </div>
        </div>

        {/* FAQ Item 5 */}
        <div className="border-b border-gray-200 pb-6">
          <button 
            className="w-full flex items-center justify-between text-left group focus:outline-none"
            onClick={() => {
              const content = document.getElementById('faq-content-5');
              const icon = document.getElementById('faq-icon-5');
              const isHidden = content?.classList.contains('hidden');
              
              // Close all other FAQs
              document.querySelectorAll('[id^="faq-content-"]').forEach(el => {
                if (el.id !== 'faq-content-5') el.classList.add('hidden');
              });
              document.querySelectorAll('[id^="faq-icon-"]').forEach(el => {
                if (el.id !== 'faq-icon-5') el.classList.remove('rotate-180');
              });
              
              // Toggle current FAQ
              if (isHidden) {
                content?.classList.remove('hidden');
                icon?.classList.add('rotate-180');
              } else {
                content?.classList.add('hidden');
                icon?.classList.remove('rotate-180');
              }
            }}
          >
            <h3 className="text-xl font-semibold text-gray-900 pr-8 transition-all duration-200 group-hover:underline group-hover:text-[#ff6b1d] underline-offset-4">
              does fluenti support multiple languages?
            </h3>
            <div id="faq-icon-5" className="flex-shrink-0 w-6 h-6 text-gray-400 transform transition-transform duration-300 group-hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <div id="faq-content-5" className="hidden mt-6 pl-0">
            <p className="text-lg text-gray-700 leading-relaxed">
              yes! fluenti currently supports english with more languages coming soon. our ai adapts to different 
              accents and dialects, making it perfect for diverse learners and accent modification goals.
            </p>
          </div>
        </div>

      </div>
    </div>
  </section>

  {/* 7. CTA SECTION - Final call to action */}
  <section className="py-24 bg-gray-50 relative z-10">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
        ready to speak with confidence?
      </h2>
      <p className="text-lg md:text-xl text-gray-600 mb-10">
        join thousands improving their communication with fluenti
      </p>
      
      <Link href="/signup">
        <Button 
          size="lg"
          className="bg-[#ff6b1d] hover:bg-[#e55a1a] text-white px-8 py-4 text-lg rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          start your journey for free
        </Button>
      </Link>
      
      <p className="text-sm text-gray-500 mt-4">
        no credit card required. cancel anytime.
      </p>
    </div>
  </section>

  {/* Chat Helper Button - Fixed Bottom Right */}
  <div className="fixed bottom-6 right-6 z-50">
    <button
      onClick={() => setShowChatHelper(true)}
      className="bg-[#ff6b1d] hover:bg-[#e55a1a] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
      aria-label="Chat with helper"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  </div>

  {/* Chat Helper Modal */}
  {showChatHelper && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[500px] max-w-[92vw] h-[600px] max-h-[90vh] rounded-2xl bg-white border border-gray-200 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff6b1d] rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chat Helper</h3>
              <p className="text-sm text-gray-600">Find therapists in your region</p>
            </div>
          </div>
          <button
            onClick={() => setShowChatHelper(false)}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            
            {/* Chat Messages */}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-3 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                {msg.type === 'ai' && (
                  <div className="w-8 h-8 bg-[#ff6b1d] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">AI</span>
                  </div>
                )}
                <div className={`rounded-lg p-4 max-w-[80%] ${
                  msg.type === 'user' 
                    ? 'bg-[#ff6b1d] text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-xs font-semibold">YOU</span>
                  </div>
                )}
              </div>
            ))}

            {/* Quick Options - Show only if no therapist type selected */}
            {!selectedTherapistType && chatMessages.length === 1 && (
              <div className="space-y-2">
                <button 
                  onClick={() => handleTherapistTypeSelection('speech')}
                  className="w-full text-left p-3 bg-[#ff6b1d]/10 hover:bg-[#ff6b1d]/20 rounded-lg border border-[#ff6b1d]/20 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">Speech Therapist</span>
                  <p className="text-xs text-gray-600 mt-1">Find certified speech-language pathologists</p>
                </button>
                
                <button 
                  onClick={() => handleTherapistTypeSelection('emotional')}
                  className="w-full text-left p-3 bg-[#ff6b1d]/10 hover:bg-[#ff6b1d]/20 rounded-lg border border-[#ff6b1d]/20 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">Emotional/Mental Health Therapist</span>
                  <p className="text-xs text-gray-600 mt-1">Connect with licensed mental health professionals</p>
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoadingTherapists && (
              <div className="flex flex-col items-center justify-center py-4">
                {requestingLocation && (
                  <div className="mb-3 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b1d] mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 font-medium">Requesting location access...</p>
                    <p className="text-xs text-gray-500 mt-1">Please allow location access in your browser</p>
                  </div>
                )}
                {!requestingLocation && (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b1d] mb-2"></div>
                    <p className="text-sm text-gray-600">Searching for therapists...</p>
                  </>
                )}
              </div>
            )}

            {/* Location Error */}
            {locationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">{locationError}</p>
                {locationPermissionDenied && (
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <p className="text-xs text-gray-700 mb-2">To enable location access:</p>
                    <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                      <li>Click the lock icon in your browser's address bar</li>
                      <li>Select "Allow" for location permissions</li>
                      <li>Refresh the page and try again</li>
                    </ol>
                  </div>
                )}
                <button
                  onClick={() => {
                    setLocationError(null);
                    setLocationPermissionDenied(false);
                    if (selectedTherapistType) {
                      handleTherapistTypeSelection(selectedTherapistType as 'speech' | 'emotional' | 'mental');
                    }
                  }}
                  className="mt-3 text-sm bg-[#ff6b1d] hover:bg-[#e55a1a] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Therapist Results - Show top 3 best matching therapists */}
            {therapists.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  Top 3 Best Matching Therapists:
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  Selected based on highest reviews and ratings
                </p>
                {therapists.map((therapist, idx) => (
                  <div key={therapist.id || idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Name and Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900 text-sm">{therapist.name}</h5>
                          {idx === 0 && (
                            <span className="text-xs bg-[#ff6b1d] text-white px-2 py-0.5 rounded-full font-medium">
                              #1 Best Match
                            </span>
                          )}
                          {therapist.businessStatus && therapist.businessStatus !== 'OPERATIONAL' && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                              {therapist.businessStatus}
                            </span>
                          )}
                        </div>

                        {/* Address */}
                        <p className="text-xs text-gray-600 mt-1">{therapist.address}</p>
                        {therapist.vicinity && therapist.vicinity !== therapist.address && (
                          <p className="text-xs text-gray-500 mt-0.5">{therapist.vicinity}</p>
                        )}

                        {/* Rating, Reviews, and Distance */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {therapist.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-yellow-600 font-semibold">⭐ {therapist.rating.toFixed(1)}</span>
                              {therapist.userRatingsTotal > 0 && (
                                <span className="text-xs text-gray-500 font-medium">({therapist.userRatingsTotal.toLocaleString()} reviews)</span>
                              )}
                            </div>
                          )}
                          {therapist.distance !== null && (
                            <p className="text-xs text-gray-500 font-medium">
                              📍 {therapist.distanceText || `${therapist.distance.toFixed(1)} km`} away from your location
                            </p>
                          )}
                        </div>

                        {/* Description */}
                        {therapist.editorialSummary && (
                          <p className="text-xs text-gray-600 mt-2 italic">{therapist.editorialSummary}</p>
                        )}

                        {/* Contact Information */}
                        <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">Contact Information:</p>
                          
                          {therapist.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">📞</span>
                              <a 
                                href={`tel:${therapist.internationalPhone || therapist.phone}`} 
                                className="text-xs text-[#ff6b1d] hover:text-[#e55a1a] hover:underline font-medium"
                              >
                                {therapist.phone}
                              </a>
                            </div>
                          )}
                          
                          {therapist.website && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">🌐</span>
                              <a 
                                href={therapist.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-[#ff6b1d] hover:text-[#e55a1a] hover:underline font-medium break-all"
                              >
                                {therapist.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                              </a>
                            </div>
                          )}

                          {/* Note: Google Places API doesn't provide email directly */}
                          {therapist.website && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-500">✉️</span>
                              <p className="text-xs text-gray-600">
                                Email: Check website for contact email
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Opening Hours - Complete Schedule */}
                        {therapist.openingHours && (
                          <div className="mt-3 border-t border-gray-100 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500">🕐</span>
                              <p className="text-xs font-semibold text-gray-700">Opening Hours:</p>
                              {therapist.openingHours.openNow ? (
                                <span className="text-xs text-green-600 font-medium">• Open Now</span>
                              ) : (
                                <span className="text-xs text-red-600 font-medium">• Closed Now</span>
                              )}
                            </div>
                            
                            {/* Show full weekly schedule if available */}
                            {therapist.openingHours.schedule && therapist.openingHours.schedule.length > 0 ? (
                              <div className="space-y-1 mt-1.5">
                                {therapist.openingHours.schedule.map((schedule: any, scheduleIdx: number) => (
                                  <div key={scheduleIdx} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 font-medium w-20">{schedule.day}:</span>
                                    {schedule.isClosed ? (
                                      <span className="text-red-600">Closed</span>
                                    ) : schedule.close ? (
                                      <span className="text-gray-700">
                                        {schedule.open} - {schedule.close}
                                      </span>
                                    ) : (
                                      <span className="text-gray-700">Open 24 hours</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : therapist.openingHours.weekdayText && therapist.openingHours.weekdayText.length > 0 ? (
                              <div className="space-y-1 mt-1.5">
                                {therapist.openingHours.weekdayText.map((day: string, dayIdx: number) => (
                                  <p key={dayIdx} className="text-xs text-gray-700">{day}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Hours not available</p>
                            )}
                          </div>
                        )}

                        {/* Recent Reviews */}
                        {therapist.reviews && therapist.reviews.length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Recent Reviews:</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {therapist.reviews.slice(0, 2).map((review: any, reviewIdx: number) => (
                                <div key={reviewIdx} className="bg-gray-50 rounded p-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-800">{review.authorName}</span>
                                    <span className="text-xs text-yellow-600">⭐ {review.rating}</span>
                                    {review.relativeTimeDescription && (
                                      <span className="text-xs text-gray-400">{review.relativeTimeDescription}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-2">{review.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {therapist.googleMapsUrl ? (
                        <a
                          href={therapist.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center text-xs bg-[#ff6b1d] hover:bg-[#e55a1a] text-white px-3 py-2 rounded-lg font-medium transition-colors"
                        >
                          View on Google Maps →
                        </a>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(therapist.name + ' ' + therapist.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center text-xs bg-[#ff6b1d] hover:bg-[#e55a1a] text-white px-3 py-2 rounded-lg font-medium transition-colors"
                        >
                          View on Google Maps →
                        </a>
                      )}
                      {therapist.phone && (
                        <a
                          href={`tel:${therapist.internationalPhone || therapist.phone}`}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors"
                        >
                          📞 Call
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b1d] focus:border-[#ff6b1d]"
            />
            <button
              onClick={async () => {
                if (!chatMessage.trim()) return;

                const message = chatMessage.trim();
                setChatMessage("");

                // Add user message
                setChatMessages(prev => [...prev, {
                  type: 'user',
                  content: message,
                  timestamp: new Date()
                }]);

                // Check if message contains therapist type keywords
                const lowerMessage = message.toLowerCase();
                if (lowerMessage.includes('speech')) {
                  handleTherapistTypeSelection('speech');
                } else if (lowerMessage.includes('emotional') || lowerMessage.includes('mental') || lowerMessage.includes('psychologist') || lowerMessage.includes('counselor')) {
                  handleTherapistTypeSelection('emotional');
                } else {
                  // Generic response
                  setChatMessages(prev => [...prev, {
                    type: 'ai',
                    content: "I can help you find speech therapists or emotional/mental health therapists. Please select one of the options above or specify which type you're looking for.",
                    timestamp: new Date()
                  }]);
                }
              }}
              disabled={!chatMessage.trim() || isLoadingTherapists}
              className="bg-[#ff6b1d] hover:bg-[#e55a1a] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by Fluenti AI • Connecting you with qualified professionals
          </p>
        </div>

      </div>
    </div>
  )}

  {/* 8. FOOTER - Always last */}
  <footer className="bg-white relative z-10">
    
    {/* Footer Content - Single Row Layout */}
    <div className="border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
          
          {/* Left Side - Brand */}
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <FluentiLogo className="w-9 h-9 text-[#ff6b1d] transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-[#ff6b1d]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">fluenti</span>
          </div>
          
          {/* Middle - Navigation Sections */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            {/* Socials */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">socials</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    tiktok
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    x (twitter)
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    linkedin
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                    privacy policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                    terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/ai-disclaimer" className="text-gray-600 hover:text-gray-900 transition-colors">
                    ai disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Right Side - Copyright */}
          <div className="lg:text-right">
            <p className="text-gray-600 text-sm">
              © 2025 fluenti inc
            </p>
            <p className="text-gray-600 text-sm">
              by samaha munir and syeda hira
            </p>
          </div>
          
        </div>
      </div>
    </div>
  </footer>
  
      </div>
      ); // Close the return statement for landing page
  }

  
  
} 