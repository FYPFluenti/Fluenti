import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import VerifyEmail from "@/pages/verify-email";
import ResetPassword from "@/pages/reset-password";
import SecuritySettings from "@/pages/security-settings";
import OnboardingPage from "@/pages/onboarding";
import OnboardingStatistics from "@/pages/onboarding-statistics";
import ChildDashboard from "@/pages/child-dashboard";
import AdultDashboard from "@/pages/adult-dashboard";
import SpeechTherapy from "@/pages/speech-therapy";
import ProgressDashboard from "@/pages/progress-dashboard";
import EmotionalSupport from "@/pages/emotional-support";
import EmotionalSupportVoice from "@/pages/emotional-support-voice";
// import SpeechTest from "@/pages/SpeechTest"; // Disabled - using Groq only
// import QuickSpeechTest from "@/pages/QuickSpeechTest"; // Disabled - using Groq only
import GroqTestPage from "@/components/GroqTestPage";
import Assessment from "@/pages/assessment";
import Achievements from "@/pages/achievements";
import Settings from "@/pages/settings";
import VoiceModel from "@/pages/voice-model";
import AdultHistory from "@/pages/adult-history";
import AdultSettings from "@/pages/adult-settings";



// Protected Route Component
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Switch>
              {/* Public Routes */}
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/verify-email" component={VerifyEmail} />
            <Route path="/reset-password" component={ResetPassword} />
            
            {/* Protected Settings Routes */}
            <Route path="/security">
              <ProtectedRoute>
                <SecuritySettings />
              </ProtectedRoute>
            </Route>
            
            {/* Onboarding Route */}
            <Route path="/onboarding">
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            </Route>
            
            {/* Onboarding Statistics Route (Admin) */}
            <Route path="/onboarding-statistics">
              <ProtectedRoute>
                <OnboardingStatistics />
              </ProtectedRoute>
            </Route>
            
            {/* Protected Dashboard Routes */}
            <Route path="/child-dashboard">
              <ProtectedRoute allowedUserTypes={['child']}>
                <ChildDashboard />
              </ProtectedRoute>
            </Route>
            
            <Route path="/adult-dashboard">
              <ProtectedRoute allowedUserTypes={['adult']}>
                <AdultDashboard />
              </ProtectedRoute>
            </Route>
            
            {/* Protected Feature Routes */}
            <Route path="/speech-therapy">
              <ProtectedRoute>
                <SpeechTherapy />
              </ProtectedRoute>
            </Route>
            
            <Route path="/progress-dashboard">
              <ProtectedRoute>
                <ProgressDashboard />
              </ProtectedRoute>
            </Route>
            
            <Route path="/emotional-support">
              <ProtectedRoute allowedUserTypes={['adult']}>
                <EmotionalSupport />
              </ProtectedRoute>
            </Route>
            
            <Route path="/emotional-support-voice">
              <ProtectedRoute allowedUserTypes={['adult']}>
                <EmotionalSupportVoice />
              </ProtectedRoute>
            </Route>
            
            <Route path="/assessment">
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            </Route>
            
            <Route path="/achievements">
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            </Route>
            
            <Route path="/adult-settings">
              <ProtectedRoute>
                <AdultSettings />
              </ProtectedRoute>
            </Route>
            
            
            <Route path="/settings">
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </Route>

            <Route path="/adult-history">
              <ProtectedRoute>
                <AdultHistory />
              </ProtectedRoute>
            </Route>
            
            <Route path="/voice-model">
              <ProtectedRoute allowedUserTypes={['child']}>
                <VoiceModel />
              </ProtectedRoute>
            </Route>
            
            {/* Microsoft Speech Test Routes (Disabled - using Groq only) */}
            {/* <Route path="/speech-test">
              <SpeechTest />
            </Route>
            
            <Route path="/quick-test">
              <QuickSpeechTest />
            </Route> */}
            
            {/* Groq Test Route (Debug) */}
            <Route path="/groq-test">
              <GroqTestPage />
            </Route>
            
            {/* 404 Route */}
            <Route>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Page not found</p>
                  <a href="/" className="text-[#ff6b1d] hover:underline">
                    Go back home
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
          
          <Toaster />
        </div>
    </QueryClientProvider>
  );
}