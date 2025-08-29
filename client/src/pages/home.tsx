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
  SlidersHorizontal
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
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Handle redirect if needed
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
  
  // ✅ FIXED: Landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
<div className="min-h-screen bg-white relative overflow-hidden">
  
  {/* FIXED: 3D Background - Only Behind Hero Section */}
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

  {/* Hero Section - NO CHANGES */}
  <section className="pt-24 min-h-screen flex items-center relative z-10"> {/* ADDED: relative z-10 */}
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
                <p className="text-sm font-medium text-gray-900">meet samaha</p>
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Features Section - ADDED z-index */}
  <section className="py-24 bg-gray-50 relative z-10"> {/* ADDED: relative z-10 */}
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
        <div className="text-center">
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
        
        <div className="text-center">
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
        
        <div className="text-center">
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

  {/* Professional FAQ Section with Dropdowns */}
<section className="py-24 bg-gray-50 relative z-10">
  <div className="max-w-4xl mx-auto px-6">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        frequently asked questions
      </h2>
      <p className="text-lg text-gray-600">
        everything you need to know about fluenti
      </p>
    </div>
    
    <div className="space-y-4">
      {/* FAQ Item 1 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button 
          className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b1d]/20"
          onClick={() => {
            const content = document.getElementById('faq-1');
            const icon = document.getElementById('icon-1');
            if (content?.classList.contains('hidden')) {
              content.classList.remove('hidden');
              icon?.classList.add('rotate-180');
            } else {
              content?.classList.add('hidden');
              icon?.classList.remove('rotate-180');
            }
          }}
        >
          <h3 className="text-xl font-semibold text-gray-900 pr-4">
            How does AI speech therapy work?
          </h3>
          <div id="icon-1" className="flex-shrink-0 w-6 h-6 text-[#ff6b1d] transform transition-transform duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div id="faq-1" className="hidden px-8 pb-6">
          <div className="pt-4 border-t border-gray-100">
            <p className="text-gray-700 leading-relaxed text-lg">
              Our <span className="font-semibold text-gray-900">advanced AI technology</span> analyzes your speech patterns in real-time using cutting-edge machine learning algorithms. The system provides:
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-[#ff6b1d] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Instant pronunciation feedback</strong> with detailed phonetic analysis</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-[#ff6b1d] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Adaptive learning paths</strong> that evolve based on your progress</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-[#ff6b1d] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Personalized exercises</strong> targeting your specific speech challenges</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Item 2 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button 
          className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b1d]/20"
          onClick={() => {
            const content = document.getElementById('faq-2');
            const icon = document.getElementById('icon-2');
            if (content?.classList.contains('hidden')) {
              content.classList.remove('hidden');
              icon?.classList.add('rotate-180');
            } else {
              content?.classList.add('hidden');
              icon?.classList.remove('rotate-180');
            }
          }}
        >
          <h3 className="text-xl font-semibold text-gray-900 pr-4">
            Is Fluenti suitable for children?
          </h3>
          <div id="icon-2" className="flex-shrink-0 w-6 h-6 text-[#ff6b1d] transform transition-transform duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div id="faq-2" className="hidden px-8 pb-6">
          <div className="pt-4 border-t border-gray-100">
            <p className="text-gray-700 leading-relaxed text-lg">
              <span className="font-bold text-2xl text-[#ff6b1d]">Absolutely!</span> Fluenti is <span className="font-bold text-xl text-gray-900">specifically designed for all ages</span>, with specialized features for children:
            </p>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="bg-[#ff6b1d]/5 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">👶 Ages 4-8</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Interactive games and stories</li>
                  <li>• Colorful, engaging interface</li>
                  <li>• Reward-based learning</li>
                </ul>
              </div>
              <div className="bg-[#ff6b1d]/5 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🧒 Ages 9-16</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Goal-oriented challenges</li>
                  <li>• Progress tracking dashboards</li>
                  <li>• Peer comparison features</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-gray-700">
              Our <span className="font-semibold">child-safe environment</span> ensures a secure, encouraging space for young learners to build confidence in their communication skills.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Item 3 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button 
          className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b1d]/20"
          onClick={() => {
            const content = document.getElementById('faq-3');
            const icon = document.getElementById('icon-3');
            if (content?.classList.contains('hidden')) {
              content.classList.remove('hidden');
              icon?.classList.add('rotate-180');
            } else {
              content?.classList.add('hidden');
              icon?.classList.remove('rotate-180');
            }
          }}
        >
          <h3 className="text-xl font-semibold text-gray-900 pr-4">
            Can it replace traditional speech therapy?
          </h3>
          <div id="icon-3" className="flex-shrink-0 w-6 h-6 text-[#ff6b1d] transform transition-transform duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div id="faq-3" className="hidden px-8 pb-6">
          <div className="pt-4 border-t border-gray-100">
            <p className="text-gray-700 leading-relaxed text-lg">
              Fluenti is designed as a <span className="font-bold text-xl text-gray-900">powerful complement to traditional therapy</span>, not a replacement. Here's how it enhances professional care:
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#ff6b1d] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Between Sessions</h4>
                  <p className="text-gray-600">Provides continuous practice and reinforcement of techniques learned with your therapist</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#ff6b1d] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Progress Acceleration</h4>
                  <p className="text-gray-600">Studies show up to <strong>3x faster improvement</strong> when used alongside professional therapy</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#ff6b1d] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Detailed Reporting</h4>
                  <p className="text-gray-600">Generates comprehensive progress reports for your speech-language pathologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Item 4 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button 
          className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b1d]/20"
          onClick={() => {
            const content = document.getElementById('faq-4');
            const icon = document.getElementById('icon-4');
            if (content?.classList.contains('hidden')) {
              content.classList.remove('hidden');
              icon?.classList.add('rotate-180');
            } else {
              content?.classList.add('hidden');
              icon?.classList.remove('rotate-180');
            }
          }}
        >
          <h3 className="text-xl font-semibold text-gray-900 pr-4">
            What speech conditions does Fluenti help with?
          </h3>
          <div id="icon-4" className="flex-shrink-0 w-6 h-6 text-[#ff6b1d] transform transition-transform duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div id="faq-4" className="hidden px-8 pb-6">
          <div className="pt-4 border-t border-gray-100">
            <p className="text-gray-700 leading-relaxed text-lg mb-4">
              Fluenti supports a <span className="font-bold text-xl text-gray-900">comprehensive range of speech and language challenges</span>:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#ff6b1d] rounded-full mr-2"></span>
                  Articulation Disorders
                </h4>
                <ul className="text-gray-600 text-sm space-y-1 ml-4">
                  <li>• Pronunciation difficulties</li>
                  <li>• Sound substitutions</li>
                  <li>• Speech clarity issues</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#ff6b1d] rounded-full mr-2"></span>
                  Language Development
                </h4>
                <ul className="text-gray-600 text-sm space-y-1 ml-4">
                  <li>• Vocabulary building</li>
                  <li>• Sentence structure</li>
                  <li>• Communication confidence</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#ff6b1d] rounded-full mr-2"></span>
                  Fluency Disorders
                </h4>
                <ul className="text-gray-600 text-sm space-y-1 ml-4">
                  <li>• Stuttering support</li>
                  <li>• Rhythm and pace</li>
                  <li>• Breathing techniques</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#ff6b1d] rounded-full mr-2"></span>
                  Accent Modification
                </h4>
                <ul className="text-gray-600 text-sm space-y-1 ml-4">
                  <li>• English pronunciation</li>
                  <li>• Professional communication</li>
                  <li>• Confidence building</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Item 5 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button 
          className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b1d]/20"
          onClick={() => {
            const content = document.getElementById('faq-5');
            const icon = document.getElementById('icon-5');
            if (content?.classList.contains('hidden')) {
              content.classList.remove('hidden');
              icon?.classList.add('rotate-180');
            } else {
              content?.classList.add('hidden');
              icon?.classList.remove('rotate-180');
            }
          }}
        >
          <h3 className="text-xl font-semibold text-gray-900 pr-4">
            How secure is my speech data?
          </h3>
          <div id="icon-5" className="flex-shrink-0 w-6 h-6 text-[#ff6b1d] transform transition-transform duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div id="faq-5" className="hidden px-8 pb-6">
          <div className="pt-4 border-t border-gray-100">
            <p className="text-gray-700 leading-relaxed text-lg mb-4">
              Your privacy and security are <span className="font-bold text-xl text-gray-900">our absolute priority</span>. We implement industry-leading security measures:
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700"><strong>End-to-end encryption</strong> for all voice data</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700"><strong>HIPAA compliant</strong> data handling and storage</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700"><strong>No data sharing</strong> with third parties without consent</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700"><strong>Local processing</strong> where possible to minimize data transmission</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

  {/* CTA Section - ADDED z-index */}
  <section className="py-24 relative z-10"> {/* ADDED: relative z-10 */}
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
</div> 
    );
  }

  // ✅ FIXED: Dashboard for authenticated users (removed duplicate header)
  const userType = (user as any)?.userType || 'child';

  return (
    <div className="h-screen font-sans flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-50 border-r border-border">
        {/* Logo */}
        <div
          onMouseEnter={() => setHovered("home")}
          onMouseLeave={() => setHovered(null)}
          className="relative group"
        >
          <button
            onClick={() => setLocation("/")}
            aria-label="Go to home"
            className="w-12 h-12 grid place-items-center rounded-xl transition"
          >
            <FluentiLogo
              className="w-10 h-10 text-[#ff6b1d] transition-colors duration-150 group-hover:text-[#ff8a4a]"
            />
          </button>

          {hovered === "home" && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 12 }}
              exit={{ opacity: 0, x: 5 }}
              className="absolute left-[38px] bottom-1 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg shadow-md border border-border z-10"
            >
              home
            </motion.div>
          )}
        </div>

        {/* Sidebar Buttons */}
        {[
          { icon: Gamepad2, label: "games", id: "games", path: "/speech-therapy" },
          { icon: LineChart, label: "progress", id: "progress", path: "/progress-dashboard" },
          { icon: Smile, label: "feedback", id: "feedback" },
        ].map(({ icon: Icon, label, id, path }) => (
          <div
            key={id}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            className="relative group"
          >
            <button
              onClick={() =>
                id === "feedback"
                  ? setShowFeedback(true)
                  : path && setLocation(path)
              }
              className="w-10 h-10 flex items-center justify-center rounded-xl transition group"
              aria-label={label}
            >
              <Icon className="text-foreground w-7 h-7 transition-colors duration-150 group-hover:text-muted-foreground" />
            </button>

            {hovered === id && (
              <motion.div
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 12 }}
                exit={{ opacity: 0, x: 5 }}
                className="absolute left-[38px] bottom-0 bg-popover text-popover-foreground px-4 py-2 rounded-lg shadow-md border border-border z-10 w-30 space-y-1"
              >
                {label}
              </motion.div>
            )}
          </div>
        ))}

        <div className="flex-1" />

        {/* User Menu */}
        <div 
          className="relative" 
          onMouseEnter={() => { 
            if (hideTimer.current) clearTimeout(hideTimer.current); 
            setShowUserMenu(true); 
          }} 
          onMouseLeave={() => { 
            hideTimer.current = setTimeout(() => setShowUserMenu(false), 200); 
          }}
        >
          <button
            className="group w-10 h-10 flex items-center justify-center rounded-full transition"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
          >
            <User
              className={`w-7 h-7 transition-colors duration-150 ${
                showUserMenu
                  ? "text-muted-foreground"
                  : "text-muted-foreground group-hover:text-muted-foreground"
              }`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute left-12 bottom-0 w-48 bg-popover border border-border rounded-xl shadow-lg p-4 z-50 space-y-2">
              <button 
                onClick={() => setLocation("/settings")} 
                className="w-full px-5 py-3 text-sm flex items-center gap-3 hover:bg-muted hover:brightness-90 rounded-lg"
              >
                <Settings className="w-5 h-5" />
                <span className="text-foreground font-medium">Settings</span>
              </button>
              <div className="border-t border-border my-1" />
              <LogoutButton className="w-full px-5 py-3 text-base text-left hover:bg-gray-200 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white bg-orange-500 text-white font-medium flex items-center gap-3 rounded-lg" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 px-6 w-full h-screen overflow-hidden flex flex-col">
        {/* Welcome Section */}
        <div className="py-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {(user as any)?.firstName || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {userType === 'child' 
              ? "Ready for your speech therapy session today?"
              : userType === 'adult'
              ? "How are you feeling today? I'm here to support you."
              : "Check on your children's progress and schedule new sessions."
            }
          </p>
        </div>

        {/* Content area with scroll */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userType === 'child' && (
              <>
                <Link href="/speech-therapy">
                  <Card className="cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <Mic className="text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Start Session</h3>
                      <p className="text-sm text-muted-foreground">Begin speech therapy</p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/assessment">
                  <Card className="cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <Target className="text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Assessment</h3>
                      <p className="text-sm text-muted-foreground">Take speech test</p>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}

            {userType === 'adult' && (
              <Link href="/emotional-support">
                <Card className="cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Brain className="text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Chat Support</h3>
                    <p className="text-sm text-muted-foreground">Talk with AI therapist</p>
                  </CardContent>
                </Card>
              </Link>
            )}

            <Link href="/progress-dashboard">
              <Card className="cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Progress</h3>
                  <p className="text-sm text-muted-foreground">View statistics</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/achievements">
              <Card className="cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Achievements</h3>
                  <p className="text-sm text-muted-foreground">View rewards</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Dashboard Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Today's Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Today's Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Practice Sessions</span>
                  <Badge variant="outline">0/2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Words Practiced</span>
                  <Badge variant="outline">0/20</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accuracy Goal</span>
                  <Badge variant="outline">85%+</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  <span>This Week</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Accuracy</span>
                  <span className="font-semibold text-secondary">87%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Practice Time</span>
                  <span className="font-semibold">45m</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Perfect Score!</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">3 Day Streak</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Continue Learning */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-primary" />
                <span>Continue Learning</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Pronunciation Practice: Level 2</h3>
                  <p className="text-sm text-muted-foreground">Focus on vowel sounds and clarity</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">65% complete</span>
                  </div>
                </div>
                <Link href="/speech-therapy">
                  <Button>
                    Continue
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Preferences Modal */}
      {showPreferences && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-20 right-10 w-[360px] bg-popover border border-border rounded-xl shadow-xl p-6 space-y-4 z-50"
        >
          <div>
            <h3 className="text-lg font-semibold">Preferences</h3>
            <p className="text-sm text-muted-foreground">Set how the assistant works for you</p>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Language</h4>
                <p className="text-xs text-muted-foreground">Conversation only</p>
              </div>
              <select 
                className="bg-card text-foreground border border-border rounded-md px-3 py-1 text-sm font-dm-sans focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors"
                aria-label="Select conversation language"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[500px] max-w-[92vw] rounded-2xl bg-popover border border-border shadow-2xl">
            <div className="p-6">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="how can we improve fluenti?"
                className="w-full h-32 resize-none rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/70 p-4 focus:outline-none focus:ring-0 focus:border-border shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between px-6 pb-6">
              <button
                onClick={() => { setShowFeedback(false); setFeedback(""); }}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition"
              >
                cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={!feedback.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition"
                style={{ backgroundColor: "hsl(27, 95%, 61%)" }}
              >
                submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}