import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Calendar, Shield, Globe, Smartphone, Users, Mic, Brain, MessageCircle, ShieldCheck, Star, Clock, Trophy, Flame, CheckCircle, Facebook, Twitter, Linkedin, Youtube, Mail, Phone, ArrowRight, Heart } from "lucide-react";

export default function Landing() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 hover-lift">
              <div className="w-10 h-10 fluenti-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-gradient-primary">Fluenti</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-primary transition-all duration-300 font-medium hover-lift focus-ring-primary relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('roles')}
                className="text-gray-600 hover:text-primary transition-all duration-300 font-medium hover-lift focus-ring-primary relative group"
              >
                Family Roles
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('therapy')}
                className="text-gray-600 hover:text-primary transition-all duration-300 font-medium hover-lift focus-ring-primary relative group"
              >
                Speech Therapy
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('support')}
                className="text-gray-600 hover:text-primary transition-all duration-300 font-medium hover-lift focus-ring-primary relative group"
              >
                Emotional Support
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('progress')}
                className="text-gray-600 hover:text-primary transition-all duration-300 font-medium hover-lift focus-ring-primary relative group"
              >
                Progress
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/login'}
                className="text-gray-600 hover:text-primary transition-all duration-300 font-medium px-4 py-2 rounded-lg hover:bg-primary/5 focus-ring-primary"
              >
                Log In
              </button>
              <button
                onClick={() => window.location.href = '/signup'}
                className="fluenti-button-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full fluenti-float"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-br from-accent/20 to-pink-300/20 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-purple-300/20 to-indigo-300/20 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <h1 className="text-5xl font-bold leading-tight mb-6">
                <span className="text-gradient-primary">AI-Powered Speech Therapy</span> for
                <span className="text-gradient-warm"> Every Child</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Interactive 3D AI avatar provides personalized speech therapy exercises with real-time feedback in English and Urdu. Make learning fun while tracking progress.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button 
                  className="fluenti-button-primary text-lg animate-scale-in"
                  onClick={() => window.location.href = '/signup'}
                >
                  <Play className="mr-2" />
                  Start Therapy Session
                </button>
                <button 
                  className="fluenti-button-accent text-lg animate-scale-in hover-lift"
                  onClick={() => scrollToSection('assessment')}
                  style={{animationDelay: '0.2s'}}
                >
                  <Calendar className="mr-2" />
                  Schedule Assessment
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500 animate-fade-in" style={{animationDelay: '0.4s'}}>
                <div className="flex items-center space-x-2 hover-lift">
                  <Shield className="text-secondary" />
                  <span>COPPA Compliant</span>
                </div>
                <div className="flex items-center space-x-2 hover-lift">
                  <Globe className="text-secondary" />
                  <span>Bilingual Support</span>
                </div>
                <div className="flex items-center space-x-2 hover-lift">
                  <Smartphone className="text-secondary" />
                  <span>Mobile Friendly</span>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-in-right">
              <div className="fluenti-card fluenti-card-interactive p-8 relative overflow-hidden">
                {/* Avatar Demo Area */}
                <div className="fluenti-avatar-container mb-6 fluenti-pulse">
                  <div className="w-48 h-48 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Users className="text-white text-6xl" />
                  </div>
                  {/* AI Status Indicator */}
                  <div className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full flex items-center space-x-2 animate-bounce-gentle">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">AI Active</span>
                  </div>
                </div>

                {/* Speech Interaction Demo */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 hover-lift">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mic className="text-primary" />
                      <span className="font-medium text-gray-700">AI Avatar Says:</span>
                    </div>
                    <p className="text-gray-600">"Let's practice saying 'Hello' - repeat after me!"</p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 hover-lift">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Mic className="text-secondary" />
                        <span className="font-medium text-gray-700">Your Speech:</span>
                      </div>
                      <span className="text-gradient-primary font-semibold">95% Accuracy</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="fluenti-pronunciation-bar">
                        <div className="fluenti-pronunciation-fill w-[95%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Language Indicator */}
              <div className="absolute -top-4 -left-4 bg-gradient-to-r from-accent to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg animate-bounce-gentle">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">English | اردو</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-secondary rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-accent rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-gradient-primary">Comprehensive Speech & Emotional Support</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with proven therapy techniques to provide accessible, personalized support for children and adults.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Interactive 3D AI Avatar",
                description: "Engaging virtual therapist guides children through exercises with real-time facial expressions and voice interaction.",
                features: ["Lifelike animations", "Voice recognition", "Emotional responses"],
                bgColor: "from-blue-50 to-blue-100",
                iconBg: "fluenti-gradient-primary",
                delay: "0s"
              },
              {
                icon: Mic,
                title: "Real-time Speech Analysis",
                description: "Advanced AI analyzes pronunciation, rhythm, and clarity providing instant feedback and correction suggestions.",
                features: ["Pronunciation scoring", "Phonetic analysis", "Progress tracking"],
                bgColor: "from-green-50 to-green-100",
                iconBg: "fluenti-gradient-primary",
                delay: "0.1s"
              },
              {
                icon: Globe,
                title: "Bilingual Support",
                description: "Seamless switching between English and Urdu with native speaker pronunciation models and cultural context.",
                features: ["Native pronunciation", "Cultural adaptation", "Code-switching support"],
                bgColor: "from-orange-50 to-orange-100",
                iconBg: "fluenti-gradient-warm",
                delay: "0.2s"
              },
              {
                icon: Brain,
                title: "Emotional Support",
                description: "AI-powered conversational therapy for adults with emotion detection and personalized mental health support.",
                features: ["Emotion recognition", "CBT techniques", "Crisis intervention"],
                bgColor: "from-purple-50 to-purple-100",
                iconBg: "fluenti-gradient-cool",
                delay: "0.3s"
              },
              {
                icon: Star,
                title: "Gamified Learning",
                description: "Interactive games, rewards, and achievements make speech therapy engaging and motivating for children.",
                features: ["Achievement system", "Interactive games", "Progress rewards"],
                bgColor: "from-pink-50 to-pink-100",
                iconBg: "fluenti-gradient-warm",
                delay: "0.4s"
              },
              {
                icon: Trophy,
                title: "Progress Dashboard",
                description: "Comprehensive analytics for guardians to monitor improvement, session history, and milestone achievements.",
                features: ["Performance metrics", "Session reports", "Goal tracking"],
                bgColor: "from-indigo-50 to-indigo-100",
                iconBg: "fluenti-gradient-cool",
                delay: "0.5s"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`fluenti-card fluenti-card-interactive bg-gradient-to-br ${feature.bgColor} rounded-2xl p-8 hover-lift animate-slide-up`}
                style={{animationDelay: feature.delay}}
              >
                <div className="p-0">
                  <div className={`w-16 h-16 ${feature.iconBg} rounded-xl flex items-center justify-center mb-6 fluenti-pulse`}>
                    <feature.icon className="text-white text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 hover-lift">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section id="roles" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Designed for Every Family Member</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fluenti provides tailored experiences for children, adults, and guardians - ensuring comprehensive support and progress tracking for the entire family.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Children */}
            <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 hover-lift animate-slide-up border-2 border-transparent hover:border-green-200 transition-all duration-300">
              <div className="p-0 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 fluenti-pulse shadow-lg">
                  <Heart className="text-white text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Children</h3>
                <p className="text-gray-600 mb-6">
                  Interactive, gamified learning experience designed to make speech therapy fun and engaging for young learners.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-green-600 w-5 h-5 animate-pulse" />
                    <span className="text-gray-700">3D AI avatar companions</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-green-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.1s'}} />
                    <span className="text-gray-700">Achievement rewards & badges</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-green-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.2s'}} />
                    <span className="text-gray-700">Age-appropriate exercises</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-green-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.3s'}} />
                    <span className="text-gray-700">Bilingual support (English/Urdu)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adults */}
            <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 hover-lift animate-slide-up border-2 border-transparent hover:border-blue-200 transition-all duration-300" style={{animationDelay: '0.1s'}}>
              <div className="p-0 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 fluenti-pulse shadow-lg">
                  <Brain className="text-white text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Adults</h3>
                <p className="text-gray-600 mb-6">
                  Professional-grade speech therapy and emotional support tools designed for adult learners and mental health needs.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-blue-600 w-5 h-5 animate-pulse" />
                    <span className="text-gray-700">Advanced speech analysis</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-blue-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.1s'}} />
                    <span className="text-gray-700">Emotional support chat</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-blue-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.2s'}} />
                    <span className="text-gray-700">Professional progress reports</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-blue-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.3s'}} />
                    <span className="text-gray-700">CBT-based interventions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardians */}
            <div className="fluenti-card fluenti-card-interactive bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-8 hover-lift animate-slide-up border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-200/50" style={{animationDelay: '0.2s'}}>
              <div className="p-0 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 fluenti-pulse shadow-lg">
                  <Shield className="text-white text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Guardians</h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive oversight and monitoring tools to track your child's progress and support their learning journey.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-purple-600 w-5 h-5 animate-pulse" />
                    <span className="text-gray-700">Real-time progress monitoring</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-purple-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.1s'}} />
                    <span className="text-gray-700">Detailed session reports</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-purple-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.2s'}} />
                    <span className="text-gray-700">Goal setting & milestones</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-purple-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.3s'}} />
                    <span className="text-gray-700">Child safety controls</span>
                  </div>
                  <div className="flex items-center space-x-3 hover-lift">
                    <CheckCircle className="text-purple-600 w-5 h-5 animate-pulse" style={{animationDelay: '0.4s'}} />
                    <span className="text-gray-700">Communication with therapists</span>
                  </div>
                </div>
                
                {/* Featured Badge */}
                <div className="mt-6 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200 hover-lift">
                  <div className="flex items-center justify-center space-x-2">
                    <Trophy className="text-purple-600 w-5 h-5 animate-bounce-gentle" />
                    <span className="text-purple-800 font-semibold text-sm">Most Comprehensive Dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Role Highlight */}
          <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Shield className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Guardian Role Features</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  As a Guardian, you have complete oversight of your child's therapy journey with advanced monitoring and control features designed specifically for family management.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-purple-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Session scheduling</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-purple-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Progress analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-purple-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Content filtering</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-purple-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Time management</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">What Guardians Can Do:</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <span className="text-gray-700 text-sm">Monitor child's daily progress and session completion rates</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="text-gray-700 text-sm">Set learning goals and customize therapy plans</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span className="text-gray-700 text-sm">Receive detailed weekly and monthly progress reports</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    <span className="text-gray-700 text-sm">Communicate directly with AI system about child's needs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Children Role Highlight */}
          <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 border border-green-100">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <Heart className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Children's Learning Features</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Specially designed for young learners with engaging, age-appropriate activities that make speech therapy feel like playing games.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Interactive games</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Reward system</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Visual feedback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Kid-friendly interface</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">What Children Experience:</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <span className="text-gray-700 text-sm">Play interactive games while practicing speech sounds</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="text-gray-700 text-sm">Earn badges and rewards for completing exercises</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span className="text-gray-700 text-sm">Interact with friendly 3D avatar companions</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    <span className="text-gray-700 text-sm">Get instant positive feedback and encouragement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Adult Role Highlight */}
          <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">What Adults Get:</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <span className="text-gray-700 text-sm">Professional-grade speech analysis and correction</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="text-gray-700 text-sm">24/7 emotional support and mental health assistance</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span className="text-gray-700 text-sm">Detailed progress reports and performance analytics</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    <span className="text-gray-700 text-sm">CBT-based interventions and coping strategies</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Brain className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Adult Professional Features</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Comprehensive tools designed for adult learners seeking professional speech therapy and emotional support with advanced analytics.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-blue-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Advanced analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-blue-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Emotional AI support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-blue-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Professional reports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-blue-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Privacy controls</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speech Therapy Demo */}
      <section id="therapy" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Speech Therapy in Action</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience how our AI avatar guides children through personalized speech exercises with real-time feedback and encouragement.
            </p>
          </div>

          <Card className="fluenti-card overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Avatar Interaction Panel */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 lg:p-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Meet Your AI Therapist</h3>
                  <p className="text-gray-600">Interactive avatar responds to your child's speech in real-time</p>
                </div>

                {/* Avatar Container */}
                <div className="fluenti-avatar-container mb-6">
                  <div className="w-64 h-64 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center relative">
                    <Users className="text-white text-8xl" />
                    {/* Speech bubble */}
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-3 shadow-lg">
                      <MessageCircle className="text-primary text-xl animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Avatar Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <Button className="fluenti-button-primary">
                    <Mic className="mr-2" />
                    <span>Speak</span>
                  </Button>
                  <Button className="fluenti-button-secondary">
                    <ArrowRight className="mr-2" />
                    <span>Repeat</span>
                  </Button>
                </div>
              </div>

              {/* Exercise Panel */}
              <div className="p-8 lg:p-12">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Current Exercise</h3>
                    <Badge className="bg-accent text-white">Level 1</Badge>
                  </div>
                  <p className="text-gray-600">Practice clear pronunciation of common words</p>
                </div>

                {/* Exercise Content */}
                <div className="space-y-6">
                  {/* Word Practice */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="text-center mb-4">
                      <h4 className="text-3xl font-bold text-primary mb-2">HELLO</h4>
                      <p className="text-gray-600">Phonetic: /həˈloʊ/</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Button className="bg-blue-100 hover:bg-blue-200 text-primary">
                        <Play className="mr-2" />
                        Listen
                      </Button>
                      <Button className="bg-green-100 hover:bg-green-200 text-secondary">
                        <Mic className="mr-2" />
                        Record
                      </Button>
                    </div>

                    {/* Pronunciation Feedback */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">Pronunciation Score</span>
                        <span className="text-secondary font-bold text-lg">92%</span>
                      </div>
                      <div className="fluenti-pronunciation-bar mb-2">
                        <div className="fluenti-pronunciation-fill w-[92%]"></div>
                      </div>
                      <p className="text-sm text-gray-600">Great job! Try emphasizing the 'o' sound more.</p>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary">15</div>
                      <div className="text-sm text-gray-600">Words Practiced</div>
                    </div>
                    <div className="text-center bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary">88%</div>
                      <div className="text-sm text-gray-600">Avg. Accuracy</div>
                    </div>
                    <div className="text-center bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-accent">12</div>
                      <div className="text-sm text-gray-600">Achievements</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Emotional Support Section */}
      <section id="support" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Emotional Support & Well-being</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered emotional support system provides 24/7 assistance, helping children and adults build confidence and emotional resilience.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI-Powered Emotional Assessment</h3>
                    <p className="text-gray-600">Advanced sentiment analysis to understand emotional states and provide personalized support.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">24/7 Chat Support</h3>
                    <p className="text-gray-600">Always available emotional support chatbot trained on child psychology principles.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Safe & Secure Environment</h3>
                    <p className="text-gray-600">HIPAA-compliant platform ensuring privacy and safety for all users.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
                  <span className="font-medium">Emotional Support Chat</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm">I'm feeling nervous about speaking in class tomorrow.</p>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-3 max-w-xs ml-auto">
                    <p className="text-sm">I understand those feelings. Let's practice some breathing exercises together. Would you like to try a confidence-building exercise?</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="text-purple-600" />
                      <span className="font-medium text-sm">Emotional State: Anxious</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="text-green-600" />
                      <span className="text-sm text-gray-600">Recommended: Deep breathing + positive affirmations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section id="progress" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Track Your Progress</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analytics and progress tracking to celebrate achievements and identify areas for improvement.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Progress Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Achievements</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Words Mastered</span>
                    <span className="font-bold text-blue-600">247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sessions Completed</span>
                    <span className="font-bold text-blue-600">42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Streak Days</span>
                    <span className="font-bold text-blue-600">12</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accuracy Chart */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8">
              <div className="text-center mb-6">
                <Star className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Accuracy Trends</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <span className="font-semibold">94%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last Week</span>
                    <span className="font-semibold">87%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '87%'}}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall</span>
                    <span className="font-semibold">91%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '91%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8">
              <div className="text-center">
                <Flame className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Goals & Challenges</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Weekly Goal</span>
                      <span className="text-xs text-orange-600">8/10 sessions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{width: '80%'}}></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Accuracy Challenge</span>
                      <span className="text-xs text-orange-600">95% target</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '94%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 fluenti-gradient-primary"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full fluenti-float"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full fluenti-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-white/10 rounded-full fluenti-float" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6 animate-slide-up">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed animate-slide-up" style={{animationDelay: '0.1s'}}>
            Join thousands of families already improving speech and emotional well-being with Fluenti's AI-powered therapy platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <button 
              className="bg-white text-primary hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 hover-lift shadow-lg"
              onClick={() => window.location.href = '/signup'}
            >
              <Users className="mr-2" />
              Create Free Account
            </button>
            <button 
              className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 hover-lift"
              onClick={() => scrollToSection('assessment')}
            >
              <Calendar className="mr-2" />
              Schedule Demo
            </button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-blue-100 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center space-x-2 hover-lift">
              <CheckCircle className="animate-pulse" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center space-x-2 hover-lift">
              <CheckCircle className="animate-pulse" style={{animationDelay: '0.1s'}} />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2 hover-lift">
              <CheckCircle className="animate-pulse" style={{animationDelay: '0.2s'}} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <MessageCircle className="text-white text-lg" />
                </div>
                <span className="text-2xl font-bold">Fluenti</span>
              </div>
              <p className="text-gray-400 mb-6">AI-powered speech therapy and emotional support platform making professional help accessible to everyone.</p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Facebook />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Twitter />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Linkedin />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Youtube />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Platform</h3>
              <ul className="space-y-3 text-gray-400">
                <li><button className="hover:text-white transition-colors">Speech Therapy</button></li>
                <li><button className="hover:text-white transition-colors">Emotional Support</button></li>
                <li><button className="hover:text-white transition-colors">Progress Tracking</button></li>
                <li><button className="hover:text-white transition-colors">3D Avatar</button></li>
                <li><button className="hover:text-white transition-colors">Bilingual Support</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Resources</h3>
              <ul className="space-y-3 text-gray-400">
                <li><button className="hover:text-white transition-colors">Help Center</button></li>
                <li><button className="hover:text-white transition-colors">User Guides</button></li>
                <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button className="hover:text-white transition-colors">COPPA Compliance</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Contact</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Mail />
                  <span>support@fluenti.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Clock />
                  <span>24/7 Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 Fluenti. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Powered by advanced AI technology</span>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="text-secondary" />
                <span className="text-sm text-gray-400">HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
