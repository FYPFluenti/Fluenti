import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import SharedSidebar from "@/components/layout/SharedSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
}

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: UserData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  const handleToggleAnalytics = () => setAnalyticsOn(!analyticsOn);
  const handleToggleNotifications = () => setNotificationsEnabled(!notificationsEnabled);
  const handleToggleEmailNotifications = () => setEmailNotifications(!emailNotifications);

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";
  
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/80">Loading…</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
       {/* Desktop Sidebar */}
       <div className="hidden lg:block">
              <SharedSidebar 
                onFeedbackOpen={() => setShowFeedback(true)}
                currentPage="settings"
              />
        </div>

      {/* Main */}
      <main className="lg:ml-20 w-full pb-20 lg:pb-0">
        
        {/* Header actions (right) */}
       <PageHeader />

        <div className="max-w-4xl mx-auto px-6 pb-24">
          {/* Profile header */}
          <section className="mb-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted grid place-items-center text-xl font-semibold">
                {initials}
              </div>
              <div className="text-lg font-medium">{displayName}</div>
            </div>
            <div className="mt-6 h-px bg-border" />
          </section>

  {/* Privacy & analytics */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Privacy settings</h2>
            <p className="text-muted-foreground mb-6">
              Manage your cookie and tracking preferences
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Necessary cookies</div>
                    <p className="text-sm text-muted-foreground">
                      Required for the website to function properly.
                    </p>
                  </div>
                  <div className="inline-flex items-center">
                    <button
                      disabled
                      className="relative inline-flex h-6 w-12 rounded-full bg-muted cursor-not-allowed"
                      aria-checked="true"
                    >
                      <span className="absolute top-1 left-7 inline-block h-4 w-4 rounded-full bg-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Analytics</div>
                    <p className="text-sm text-muted-foreground">
                      Help us improve Fluenti (anonymous).
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={handleToggleAnalytics}
                      className={`relative inline-flex h-6 w-12 rounded-full transition ${
                        analyticsOn ? "bg-[#ff6b1d]" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={analyticsOn}
                    >
                      <span
                        className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                          analyticsOn ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">Notifications</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Control how you receive updates and reminders
            </p>

            <div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Push Notifications</div>
                    <p className="text-sm text-muted-foreground">
                      Session reminders & progress updates.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={handleToggleNotifications}
                      className={`relative inline-flex h-6 w-12 rounded-full transition ${
                        notificationsEnabled ? "bg-[#ff6b1d]" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={notificationsEnabled}
                    >
                      <span
                        className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                          notificationsEnabled ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Email Notifications</div>
                    <p className="text-sm text-muted-foreground">
                      Weekly progress reports by email.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={handleToggleEmailNotifications}
                      className={`relative inline-flex h-6 w-12 rounded-full transition ${
                        emailNotifications ? "bg-[#ff6b1d]" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={emailNotifications}
                    >
                      <span
                        className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                          emailNotifications ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          

             {/* Danger zone */}
          <section className="mb-6">
            <h2 className="text-2xl font-bold mb-1">danger zone</h2>
            <p className="text-muted-foreground mb-6">
              be careful with these settings
            </p>

            <div className="space-y-6">
          
              <div>
                <button
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                  onClick={() => {
                    // TODO: call your API to delete account
                  }}
                >
                  delete account
                </button>
                <p className="text-sm text-muted-foreground mt-2 max-w-prose">
                  this will delete your account and everything related to it. be careful, it cannot be undone.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="settings"
        userType="child"
      />

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal 
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
