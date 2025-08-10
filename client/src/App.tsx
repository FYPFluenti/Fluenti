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
import ChildDashboard from "@/pages/child-dashboard";
import GuardianDashboard from "@/pages/guardian-dashboard";
import SpeechTherapy from "@/pages/speech-therapy";
import EmotionalSupport from "@/pages/emotional-support";
import ProgressDashboard from "@/pages/progress-dashboard";
import Assessment from "@/pages/assessment";
import Achievements from "@/pages/achievements";
import Settings from "./pages/settings";

function DashboardRedirect() {
  const { user } = useAuth();
  const userType = (user as any)?.userType;
  
  switch (userType) {
    case 'child':
      return <Redirect to="/child-dashboard" />;
    case 'adult':
      return <Redirect to="/adult-dashboard" />;
    case 'guardian':
      return <Redirect to="/guardian-dashboard" />;
    default:
      return <Redirect to="/adult-dashboard" />;
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
      {/* Public routes - always accessible */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/logout" component={Logout} />
      
      {/* Protected routes - only when authenticated */}
      {isAuthenticated ? (
        <>
          {/* Root redirect to appropriate dashboard */}
          <Route path="/" component={DashboardRedirect} />
          
          {/* Role-specific dashboards */}
          <Route path="/adult-dashboard">
            <RoleBasedComponent allowedRoles={['adult']}>
              <AdultDashboard />
            </RoleBasedComponent>
          </Route>
          
          <Route path="/child-dashboard">
            <RoleBasedComponent allowedRoles={['child']}>
              <ChildDashboard />
            </RoleBasedComponent>
          </Route>
          
          <Route path="/guardian-dashboard">
            <RoleBasedComponent allowedRoles={['guardian']}>
              <GuardianDashboard />
            </RoleBasedComponent>
          </Route>
          
          {/* Speech therapy - available to all but with different interfaces */}
          <Route path="/speech-therapy" component={SpeechTherapy} />
          
          {/* Emotional support - available to all */}
          <Route path="/emotional-support" component={EmotionalSupport} />
          
          {/* Progress tracking - different views for different roles */}
          <Route path="/progress-dashboard" component={ProgressDashboard} />

          {/* Achievements page */}
          <Route path="/achievements" component={Achievements} />

          {/* Assessment - available to all but different content */}
          <Route path="/assessment" component={Assessment} />

          <Route path="/settings" component={Settings} />

          {/* Legacy home route - redirect to appropriate dashboard */}
          <Route path="/home" component={DashboardRedirect} />
        </>
      ) : (
        <>
          {/* When not authenticated, show landing page for root */}
          <Route path="/" component={Landing} />
        </>
      )}
      
      {/* Catch-all for 404 */}
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
