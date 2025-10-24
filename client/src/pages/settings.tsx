import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useLocation } from "wouter";
import {
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal,
  Shield,
  Loader2,
  AlertCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
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
  signupMethod?: string;
}

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: UserData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const {
    settings,
    isLoading: settingsLoading,
    error: settingsError,
    updateSetting,
    deleteAccount
  } = useSettings();

  const {
    profile,
    changePassword,
  } = useUserSettings();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Oops!",
        description: "New passwords don't match. Please try again!",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password too short!",
        description: "Your password should be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    setIsChangingPassword(false);
    
    if (success) {
      toast({
        title: "Password Changed! 🎉",
        description: "Your password has been updated successfully!",
      });
      setShowPasswordChange(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAnalytics = async () => {
    const success = await updateSetting('analyticsEnabled', !settings.analyticsEnabled);
    if (success) {
      toast({
        title: "Settings Updated",
        description: `Analytics ${settings.analyticsEnabled ? 'disabled' : 'enabled'}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update analytics setting",
        variant: "destructive",
      });
    }
  };

  const handleToggleNotifications = async () => {
    const success = await updateSetting('pushNotifications', !settings.pushNotifications);
    if (success) {
      toast({
        title: "Settings Updated",
        description: `Push notifications ${settings.pushNotifications ? 'disabled' : 'enabled'}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update notification setting",
        variant: "destructive",
      });
    }
  };

  const handleToggleEmailNotifications = async () => {
    const success = await updateSetting('emailNotifications', !settings.emailNotifications);
    if (success) {
      toast({
        title: "Settings Updated",
        description: `Email notifications ${settings.emailNotifications ? 'disabled' : 'enabled'}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update email notification setting",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    const success = await deleteAccount(deletePassword || undefined);
    setIsDeleting(false);
    
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please check your password and try again.",
        variant: "destructive",
      });
    }
    // If successful, the user will be redirected by the deleteAccount function
  };

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";
  
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  if (isLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center child-dashboard-no-zoom">
        <div className="flex items-center gap-2 text-foreground/80 child-dashboard-container px-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading settings…
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // Show error message if settings failed to load
  if (settingsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center child-dashboard-no-zoom">
        <div className="flex items-center gap-2 text-red-500 child-dashboard-container px-4">
          <AlertCircle className="w-5 h-5" />
          Error loading settings: {settingsError}
        </div>
      </div>
    );
  }

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
         <PageHeader />        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
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

          {/* Security Settings */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-1">security</h2>
            <p className="text-muted-foreground mb-6">
              manage your account security and authentication
            </p>

            <div className="space-y-4">
              {/* Advanced Security Settings */}
              <button
                onClick={() => setLocation("/security")}
                className="w-full p-4 bg-card hover:bg-muted/50 border border-border rounded-lg transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">Advanced Security</div>
                    <div className="text-sm text-muted-foreground">
                      Extra protection, email verification and more! 
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground group-hover:translate-x-1 transition">→</div>
              </button>
            </div>
          </section>

          {/* Password Settings */}
          {user?.signupMethod === 'email' && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-1">password</h2>
              <p className="text-muted-foreground mb-6">
                change your account password
              </p>

              <div className="p-4 bg-card hover:bg-muted/50 border border-border rounded-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-[#ff6b1d]" />
                    <div>
                      <div className="font-semibold">Your Password</div>
                      <div className="text-sm text-muted-foreground">
                        Keep your account safe with a strong password
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPasswordChange(!showPasswordChange);
                      if (showPasswordChange) {
                        // Reset form when canceling
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }
                    }}
                    className="px-4 py-2 text-sm bg-background hover:bg-muted/30 rounded-lg border border-border transition"
                  >
                    {showPasswordChange ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
                
                {showPasswordChange && (
                  <form onSubmit={handlePasswordChange} className="space-y-4 mt-4 pt-4 border-t border-border">
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Enter your current password"
                            className="w-full px-3 py-2 border border-border rounded-lg pr-10 bg-background"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium block mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter your new password (at least 6 characters)"
                            className="w-full px-3 py-2 border border-border rounded-lg pr-10 bg-background"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium block mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Type your new password again"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition"
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        className="flex-1 px-4 py-2 bg-[#ff6b1d] text-white rounded-lg hover:bg-[#e55a15] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isChangingPassword ? 'Changing...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}

          {/* Privacy settings */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-1">privacy settings</h2>
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
                      role="switch"
                      aria-checked={true}
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
                        settings.analyticsEnabled ? "bg-[#ff6b1d]" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={settings.analyticsEnabled}
                    >
                      <span
                        className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                          settings.analyticsEnabled ? "left-7" : "left-1"
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
                        settings.pushNotifications ? "bg-[#ff6b1d]" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={settings.pushNotifications}
                    >
                      <span
                        className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                          settings.pushNotifications ? "left-7" : "left-1"
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
                        settings.emailNotifications ? "bg-[#ff6b1d]" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={settings.emailNotifications}
                    >
                      <span
                        className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-white transition ${
                          settings.emailNotifications ? "left-7" : "left-1"
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
                {!showDeleteConfirm ? (
                  <button
                    className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                    onClick={handleDeleteAccount}
                  >
                    delete account
                  </button>
                ) : (
                  <div className="space-y-4 p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">Confirm Account Deletion</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                    
                    {user?.signupMethod === 'email' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-red-700 dark:text-red-300">
                          Enter your password to confirm:
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full p-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Your current password"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || (user?.signupMethod === 'email' && !deletePassword)}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Permanently Delete Account'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword("");
                        }}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {!showDeleteConfirm && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-prose">
                    this will delete your account and everything related to it. be careful, it cannot be undone.
                  </p>
                )}
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
