import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bell,
  Lock,
  Trash2,
  RotateCcw,
  Shield,
  Zap,
  Palette,
} from "lucide-react";
import SharedSidebarEmotional from "@/components/layout/SharedSidebarEmotional";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

/**
 * Proper user type interface used across the settings page
 */
interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  userType?: "adult" | "child" | string;
  profilePicture?: string;
}

export default function AdultSettings() {
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // UI state (kept only those used)
  const [showFeedback, setShowFeedback] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    // redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    // verify user type — only allow adult users here
    if (!isLoading && isAuthenticated && user) {
      if (user.userType && user.userType !== "adult") {
        // redirect non-adults to their dashboard (child)
        setLocation("/child-dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  useEffect(() => {
    // apply dark mode preference on mount
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Derived display name (full name preferred, fallback to email)
  const displayName =
    [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(
      " "
    ) || user?.email || "User";

  // Handlers
  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    toast({
      title: "Appearance updated",
      description: next ? "Dark mode enabled" : "Light mode enabled",
    });
  };

  const handleToggleAnalytics = () => {
    setAnalyticsEnabled((v) => !v);
    toast({
      title: analyticsEnabled ? "Analytics disabled" : "Analytics enabled",
    });
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled((v) => !v);
    toast({
      title: notificationsEnabled ? "Notifications off" : "Notifications on",
    });
  };

  const handleToggleEmailNotifications = () => {
    setEmailNotifications((v) => !v);
    toast({
      title: emailNotifications ? "Email updates off" : "Email updates on",
    });
  };

  const handleResetChatHistory = async () => {
    if (
      !window.confirm(
        "Reset chat history? This cannot be undone. Do you want to continue?"
      )
    )
      return;

    try {
      // TODO: call API to reset chat history
      toast({
        title: "Chat history reset",
        description: "Your conversation history has been cleared.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reset chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm(
      "Delete account? This will permanently remove your data. Continue?"
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "Final confirmation: This action is irreversible. Click OK to proceed."
    );
    if (!confirm2) return;

    try {
      // TODO: call API to delete account
      toast({
        title: "Account deleted",
        description:
          "Your account has been scheduled for deletion. You will be signed out.",
      });
      // sign-out or redirect
      setTimeout(() => setLocation("/"), 1200);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete account. Contact support.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/80">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <SharedSidebarEmotional
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="settings"
      />

      {/* Feedback modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Main */}
      <main className="ml-20 w-full">
        <PageHeader />

        <div className="max-w-4xl mx-auto px-6 pb-24">
          {/* Profile header */}
          <section className="mb-8">
            <div className="flex items-center gap-4">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted grid place-items-center text-xl font-semibold">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div>
                <div className="text-lg font-medium">{displayName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
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
              <Card>
                <CardContent className="flex items-center justify-between">
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
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between">
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
                        analyticsEnabled ? "bg-[#ff6b1d]" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={analyticsEnabled}
                    >
                      <span
                        className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                          analyticsEnabled ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5" />
              <h2 className="text-2xl font-bold">Notifications</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Control how you receive updates and reminders
            </p>

            <Card>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </section>

          {/* Appearance */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5" />
              <h2 className="text-2xl font-bold">Appearance</h2>
            </div>
            <p className="text-muted-foreground mb-4">Theme</p>

            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Dark mode</div>
                  <p className="text-sm text-muted-foreground">
                    Use a darker theme to reduce eye strain.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleToggleDark}
                    className={`relative inline-flex h-6 w-12 rounded-full transition ${
                      darkMode ? "bg-[#ff6b1d]" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={darkMode}
                  >
                    <span
                      className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                        darkMode ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Danger Zone */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">Danger zone</h2>
            <p className="text-muted-foreground mb-4">
              Irreversible actions — proceed with caution
            </p>

            <div className="space-y-4">
              <Card>
                <CardContent>
                  <div className="flex items-start gap-4 mb-4">
                    <RotateCcw className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-semibold">Reset chat history</div>
                      <p className="text-sm text-muted-foreground">
                        Clear all conversation history for your account.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleResetChatHistory}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                    >
                      Reset chat history
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-start gap-4 mb-4">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-semibold text-red-600">Delete account</div>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete my account
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}