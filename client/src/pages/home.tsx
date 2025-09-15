import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import FluentiLogo from "@/components/FluentiLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import ModelViewerAvatar from "@/components/ModelViewerAvatar";
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
  ChevronRight
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
  
  // State variables
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  // Feedback submit function
  const submitFeedback = () => {
    setShowFeedback(false);
    setFeedback("");
    toast({
      title: "Feedback submitted",
      description: "Thank you for helping us improve Fluenti!",
    });
  };

  // Handle routing for authenticated users to their appropriate dashboards
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Handle redirect if needed for non-authenticated users
    }
  }, [isAuthenticated, isLoading, toast]);

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
  
  // Landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* 3D Background - Only Behind Hero Section */}
        <div className="absolute inset-0 w-full h-screen z-0">
          <Spline 
            scene="https://prod.spline.design/d1ABYikBmZ80miSz/scene.splinecode"
            className="w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              opacity: 0.8,
              filter: 'none'
            }}
          />
        </div>
       
        {/* Header */}
        <header className="absolute top-0 w-full z-50 bg-white/2">
          <div className="max-w-7xl mx-auto px-5 py-4"> 
            <div className="flex items-center justify-between h-24 pt-6">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <FluentiLogo className="w-14 h-14 text-[#ff6b1d] transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-[#ff6b1d]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-4xl font-bold text-gray-900 tracking-tight">fluenti</span>
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

        {/* Hero Section */}
        <section className="pt-24 min-h-screen flex items-center relative z-10">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Side - Text Content */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
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

              {/* Right Side - 3D Avatar */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="relative">
                    <div className="w-96 h-96 lg:w-[28rem] lg:h-[28rem] relative -ml-8 lg:-ml-12">
                      
                      {/* Spline 3D Model */}
                      <div className="w-full h-full relative">
                        <Spline 
                          scene="https://prod.spline.design/NKxj87myxipVSVjM/scene.splinecode"
                          className="w-full h-full"
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '0'
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
                      
                      {/* Loading State */}
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
                      
                      {/* Fallback State */}
                      <div 
                        id="spline-fallback-enlarged"
                        className="absolute inset-0 hidden items-center justify-center bg-transparent z-10"
                      >
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                          <div className="w-20 h-20 bg-gradient-to-br from-[#ff6b1d] to-[#ff8a4a] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <span className="text-3xl">🤖</span>
                          </div>
                          <p className="text-gray-700 text-sm font-medium">Hi there!</p>
                          <p className="text-gray-500 text-xs mt-1">Your AI Speech Therapist</p>
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Floating Name Tag */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200 z-30">
                      <p className="text-sm font-medium text-gray-900">Samaha - AI Therapist</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
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

        {/* AI Therapists Section */}
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

        {/* Stats Section */}
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
            
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <p className="opacity-90">active users</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">87%</div>
                <p className="opacity-90">improvement rate</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <p className="opacity-90">languages supported</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">4.9★</div>
                <p className="opacity-90">user rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
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

        {/* FAQ Section */}
        <section className="py-24 bg-white relative z-10">
          <div className="max-w-4xl mx-auto px-6">
            
            {/* Header */}
            <div className="text-center mb-32"> 
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
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
                    yes! fluenti supports multiple languages including english, urdu, arabic, and spanish. our ai adapts to different 
                    accents and dialects, making it perfect for diverse learners and accent modification goals.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gray-50 relative z-10">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              ready to speak with confidence?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              join thousands improving their communication with fluenti
            </p>
            
            <Link href="/signup">
              <Button 
                size="lg"
                className="bg-[#ff6b1d] hover:bg-[#e55a1a] text-white px-8 py-4 text-lg rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                start your free trial
              </Button>
            </Link>
            
            <p className="text-sm text-gray-500 mt-4">
              no credit card required • 7-day free trial
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white relative z-10">
          
          {/* Footer Links */}
          <div className="border-t border-gray-200 py-12">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-4 gap-12 items-start">
                
                {/* Brand */}
                <div className="flex items-center space-x-1">
                  <div className="relative group">
                    <FluentiLogo className="w-9 h-9 text-[#ff6b1d] transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[#ff6b1d]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <span className="text-xl font-bold text-gray-900">fluenti</span>
                </div>
                
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
                
                {/* Copyright */}
                <div className="text-right">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    © 2025 fluenti inc
                    <br />
                    by samaha munir & fluenti team
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

    // Dashboard for authenticated users
  const userType = (user as any)?.userType || 'child';

  return (
    <div className="h-screen font-sans flex bg-background text-foreground overflow-hidden">
      {/* Main Content */}
      <main className="px-6 w-full h-screen overflow-hidden flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Fluenti Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              User Type: {userType}
            </p>
            <div className="space-y-4">
              <Link href="/child-dashboard">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg mr-4">
                  Child Dashboard
                </button>
              </Link>
              <Link href="/adult-dashboard">
                <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg mr-4">
                  Adult Dashboard
                </button>
              </Link>
              <Link href="/guardian-dashboard">
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg">
                  Guardian Dashboard
                </button>
              </Link> 
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}