import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { RoleBasedComponent } from "@/components/auth/RoleBasedComponent";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Logout from "@/pages/logout";
import Home from "@/pages/home";
import AdultDashboard from "@/pages/adult-dashboard";
import AdultInsights from "@/pages/adult-insights";
import AdultHistory from "@/pages/adult-history";
import ChildDashboard from "@/pages/child-dashboard";
import GuardianDashboard from "@/pages/guardian-dashboard";
import SpeechTherapy from "@/pages/speech-therapy";
import EmotionalSupport from "@/pages/emotional-support";
import EmotionalSupportVoice from "@/pages/emotional-support-voice";
import ProgressDashboard from "@/pages/progress-dashboard";
import Assessment from "@/pages/assessment";
import Achievements from "@/pages/achievements";
import Settings from "./pages/settings";

function DashboardRedirect() {
  const { user } = useAuth();
  const userType = (user as any)?.userType;
  
  // For development, default to child dashboard
  if (!user || !userType) {
    return <Redirect to="/child-dashboard" />;
  }
  
  switch (userType) {
    case 'child':
      return <Redirect to="/child-dashboard" />;
    case 'adult':
      return <Redirect to="/adult-dashboard" />;
    case 'guardian':
      return <Redirect to="/guardian-dashboard" />;
    default:
      return <Redirect to="/child-dashboard" />;
  }
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/logout" component={Logout} />
      
      {/* Homepage - always accessible */}
      <Route path="/" component={Home} />
      
      {/* Protected routes - only when authenticated */}
      {isAuthenticated ? (
        <>
          {/* Dashboard redirect route */}
          <Route path="/dashboard" component={DashboardRedirect} />
          
          {/* Role-specific dashboards */}
          <Route path="/child-dashboard" component={ChildDashboard} />
          <Route path="/adult-dashboard" component={AdultDashboard} />
          <Route path="/guardian-dashboard" component={GuardianDashboard} />
          
          {/* Other protected routes */}
          <Route path="/speech-therapy" component={SpeechTherapy} />
          <Route path="/progress-dashboard" component={ProgressDashboard} />
          <Route path="/settings" component={Settings} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/emotional-support" component={EmotionalSupport} />
          <Route path="/emotional-support-voice" component={EmotionalSupportVoice} />
          
          {/* Fallback for authenticated users */}
          <Route component={NotFound} />
        </>
      ) : (
        <>
          {/* Public landing page for non-authenticated users */}
          <Route path="/home" component={Landing} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
