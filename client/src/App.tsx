import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ChildDashboard from "@/pages/child-dashboard";
import AdultDashboard from "@/pages/adult-dashboard";
import GuardianDashboard from "@/pages/guardian-dashboard";
import SpeechTherapy from "@/pages/speech-therapy";
import ProgressDashboard from "@/pages/progress-dashboard";
import EmotionalSupport from "@/pages/emotional-support";
import Assessment from "@/pages/assessment";
import Achievements from "@/pages/achievements";
import Settings from "@/pages/settings";
import VoiceModel from "@/pages/voice-model";

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
            
            <Route path="/guardian-dashboard">
              <ProtectedRoute allowedUserTypes={['guardian']}>
                <GuardianDashboard />
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
            
            <Route path="/settings">
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </Route>
            
            <Route path="/voice-model">
              <ProtectedRoute allowedUserTypes={['child']}>
                <VoiceModel />
              </ProtectedRoute>
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