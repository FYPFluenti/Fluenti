import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Home from "@/pages/home";
import AdultDashboard from "@/pages/adult-dashboard";
import ChildDashboard from "@/pages/child-dashboard";
import GuardianDashboard from "@/pages/guardian-dashboard";
import SpeechTherapy from "@/pages/speech-therapy";
import EmotionalSupport from "@/pages/emotional-support";
import ProgressDashboard from "@/pages/progress-dashboard";
import Assessment from "@/pages/assessment";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Protected routes */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/adult-dashboard" component={AdultDashboard} />
          <Route path="/child-dashboard" component={ChildDashboard} />
          <Route path="/guardian-dashboard" component={GuardianDashboard} />
          <Route path="/speech-therapy" component={SpeechTherapy} />
          <Route path="/emotional-support" component={EmotionalSupport} />
          <Route path="/progress" component={ProgressDashboard} />
          <Route path="/assessment" component={Assessment} />
        </>
      )}
      <Route component={NotFound} />
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
