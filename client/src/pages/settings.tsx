import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, Bell, Lock, Trash2, RotateCcw, Globe, Moon, Sun } from "lucide-react";
import SharedSidebar from "@/components/layout/SharedSidebar";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import {
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal,
} from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: { email?: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);
   const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  // toggles (persist to your API in onChange)
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

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
       {/* Sidebar */}
              <SharedSidebar 
                onFeedbackOpen={() => setShowFeedback(true)}
                currentPage="dashboard"
              />

      {/* Main */}
      <main className="ml-20 w-full">
        
        {/* Header actions (right) */}
       <PageHeader />

        <div className="max-w-4xl mx-auto px-6 pb-24">
          {/* Profile header */}
          <section className="mb-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted grid place-items-center text-xl font-semibold">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-lg font-medium">{user?.email || "user@example.com"}</div>
            </div>
            <div className="mt-6 h-px bg-border" />
          </section>

          {/* Privacy settings */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-1">privacy settings</h2>
            <p className="text-muted-foreground mb-6">
              manage your cookie and tracking preferences
            </p>

            {/* Necessary cookies (locked) */}
            <div className="flex items-start gap-4 mb-5">
              <button
                disabled
                className="relative inline-flex h-6 w-12 cursor-not-allowed rounded-full bg-[#ff6b1d] transition"
                role="switch"
                aria-checked="true"
                aria-label="Necessary cookies (required)"
                title="Necessary cookies (required)"
              >
                <span className="pointer-events-none absolute top-1 left-7 inline-block h-4 w-4 rounded-full bg-white" />
              </button>
              <div>
                <div className="font-semibold">necessary cookies</div>
                <p className="text-sm text-muted-foreground max-w-prose">
                  required for the website to function properly. cannot be disabled.
                </p>
              </div>
            </div>

            {/* Analytics cookies (toggleable) */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => setAnalyticsOn(v => !v)}
                className={`relative inline-flex h-6 w-12 rounded-full transition ${
                  analyticsOn ? "bg-[#ff6b1d]" : "bg-muted"
                }`}
                role="switch"
                aria-checked={analyticsOn ? "true" : "false"}
                aria-label={`Analytics cookies ${analyticsOn ? 'enabled' : 'disabled'}`}
                title={`Toggle analytics cookies ${analyticsOn ? 'off' : 'on'}`}
              >
                <span
                  className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                    analyticsOn ? "left-7" : "left-1"
                  }`}
                />
              </button>
              <div>
                <div className="font-semibold">analytics cookies</div>
                <p className="text-sm text-muted-foreground max-w-prose">
                  help us understand how visitors interact with our website using posthog analytics.
                </p>
              </div>
            </div>

            <div className="mt-8 h-px bg-border" />
          </section>

         {/* Notifications */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
      
              <h2 className="text-2xl font-bold">notifications</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Control how you receive updates and reminders
            </p>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about session reminders and progress updates.
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
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

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Get weekly progress reports and tips via email.
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
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
              </CardContent>
            </Card>

            <div className="mt-8 h-px bg-border" />
          </motion.section>

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
    </div>
  );
}
