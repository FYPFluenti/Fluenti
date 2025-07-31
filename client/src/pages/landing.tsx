import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Calendar, Shield, Globe, Smartphone, Users, Mic, Brain, MessageCircle, ShieldCheck, Star, Clock, Trophy, Flame, CheckCircle, Facebook, Twitter, Linkedin, Youtube, Mail, Phone, ArrowRight } from "lucide-react";

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
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <MessageCircle className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-primary">Fluenti</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('therapy')}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Speech Therapy
              </button>
              <button 
                onClick={() => scrollToSection('support')}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Emotional Support
              </button>
              <button 
                onClick={() => scrollToSection('progress')}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Progress
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/api/login'}
                className="text-gray-600 hover:text-primary transition-colors font-medium"
              >
                Log In
              </Button>
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="fluenti-button-primary"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                AI-Powered Speech Therapy for
                <span className="text-primary"> Every Child</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Interactive 3D AI avatar provides personalized speech therapy exercises with real-time feedback in English and Urdu. Make learning fun while tracking progress.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  className="fluenti-button-primary text-lg"
                  onClick={() => window.location.href = '/api/login'}
                >
                  <Play className="mr-2" />
                  Start Therapy Session
                </Button>
                <Button 
                  variant="outline" 
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-xl font-semibold text-lg"
                  onClick={() => scrollToSection('assessment')}
                >
                  <Calendar className="mr-2" />
                  Schedule Assessment
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Shield className="text-secondary" />
                  <span>COPPA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="text-secondary" />
                  <span>Bilingual Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="text-secondary" />
                  <span>Mobile Friendly</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="fluenti-card p-8 relative overflow-hidden">
                {/* Avatar Demo Area */}
                <div className="fluenti-avatar-container mb-6">
                  <div className="w-48 h-48 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Users className="text-white text-6xl" />
                  </div>
                  {/* AI Status Indicator */}
                  <Badge className="absolute top-4 right-4 bg-secondary text-white flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <span>AI Active</span>
                  </Badge>
                </div>

                {/* Speech Interaction Demo */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mic className="text-primary" />
                      <span className="font-medium text-gray-700">AI Avatar Says:</span>
                    </div>
                    <p className="text-gray-600">"Let's practice saying 'Hello' - repeat after me!"</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Mic className="text-primary" />
                        <span className="font-medium text-gray-700">Your Speech:</span>
                      </div>
                      <span className="text-secondary font-semibold">95% Accuracy</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="fluenti-pronunciation-bar">
                        <div className="fluenti-pronunciation-fill" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Floating Language Indicator */}
              <Badge className="absolute -top-4 -left-4 bg-accent text-white px-4 py-2 shadow-lg">
                <Globe className="mr-2" />
                English | اردو
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Speech & Emotional Support</h2>
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
                iconBg: "bg-primary"
              },
              {
                icon: Mic,
                title: "Real-time Speech Analysis",
                description: "Advanced AI analyzes pronunciation, rhythm, and clarity providing instant feedback and correction suggestions.",
                features: ["Pronunciation scoring", "Phonetic analysis", "Progress tracking"],
                bgColor: "from-green-50 to-green-100",
                iconBg: "bg-secondary"
              },
              {
                icon: Globe,
                title: "Bilingual Support",
                description: "Seamless switching between English and Urdu with native speaker pronunciation models and cultural context.",
                features: ["Native pronunciation", "Cultural adaptation", "Code-switching support"],
                bgColor: "from-orange-50 to-orange-100",
                iconBg: "bg-accent"
              },
              {
                icon: Brain,
                title: "Emotional Support",
                description: "AI-powered conversational therapy for adults with emotion detection and personalized mental health support.",
                features: ["Emotion recognition", "CBT techniques", "Crisis intervention"],
                bgColor: "from-purple-50 to-purple-100",
                iconBg: "bg-purple-600"
              },
              {
                icon: Star,
                title: "Gamified Learning",
                description: "Interactive games, rewards, and achievements make speech therapy engaging and motivating for children.",
                features: ["Achievement system", "Interactive games", "Progress rewards"],
                bgColor: "from-pink-50 to-pink-100",
                iconBg: "bg-pink-600"
              },
              {
                icon: Trophy,
                title: "Progress Dashboard",
                description: "Comprehensive analytics for guardians to monitor improvement, session history, and milestone achievements.",
                features: ["Performance metrics", "Session reports", "Goal tracking"],
                bgColor: "from-indigo-50 to-indigo-100",
                iconBg: "bg-indigo-600"
              }
            ].map((feature, index) => (
              <Card key={index} className={`bg-gradient-to-br ${feature.bgColor} rounded-2xl p-8 hover:shadow-lg transition-shadow`}>
                <CardContent className="p-0">
                  <div className={`w-16 h-16 ${feature.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                    <feature.icon className="text-white text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {feature.features.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
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
                        <div className="fluenti-pronunciation-fill" style={{ width: '92%' }}></div>
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

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of families already improving speech and emotional well-being with Fluenti's AI-powered therapy platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              className="bg-white text-primary hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              <Users className="mr-2" />
              Create Free Account
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-xl font-semibold text-lg"
              onClick={() => scrollToSection('assessment')}
            >
              <Calendar className="mr-2" />
              Schedule Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-blue-100">
            <div className="flex items-center space-x-2">
              <CheckCircle />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle />
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
