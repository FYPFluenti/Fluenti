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
  Mail,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Key,
} from "lucide-react";
import SharedSidebarEmotional from "@/components/layout/SharedSidebarEmotional";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FeedbackModal from "@/components/layout/FeedbackModel";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { useUserSettings } from "@/hooks/useUserSettings";


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
  
  const {
    settings,
    profile,
    emailVerification,
    isLoading: settingsLoading,
    error: settingsError,
    updateSetting,
    updateProfile,
    changePassword,
    resendVerificationEmail,
    deleteAccount,
  } = useUserSettings();

  // UI state
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    profilePicture: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

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
    
        setLocation("/child-dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  // Apply theme changes
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add("dark");
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [settings.theme]);

  // Derived display name (full name preferred, fallback to email)
  const displayName =
    [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(
      " "
    ) || user?.email || "User";

  // Handlers
  const handleToggleDark = async () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    const success = await updateSetting('theme', next);
    if (success) {
      toast({
        title: "Theme updated",
        description: `${next === 'dark' ? 'Dark' : 'Light'} mode enabled`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update theme setting",
        variant: "destructive",
      });
    }
  };

  const handleToggleAnalytics = async () => {
    const newValue = !settings.analyticsEnabled;
    const success = await updateSetting('analyticsEnabled', newValue);
    if (success) {
      toast({
        title: newValue ? "Analytics enabled" : "Analytics disabled",
        description: newValue ? "Anonymous usage data will be collected" : "Data collection has been disabled",
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
    const newValue = !settings.pushNotifications;
    const success = await updateSetting('pushNotifications', newValue);
    if (success) {
      toast({
        title: newValue ? "Push notifications enabled" : "Push notifications disabled",
        description: newValue ? "You'll receive browser notifications for reminders and updates" : "Browser notifications have been turned off",
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
    const newValue = !settings.emailNotifications;
    const success = await updateSetting('emailNotifications', newValue);
    if (success) {
      toast({
        title: newValue ? "Email notifications enabled" : "Email notifications disabled",
        description: newValue ? "You'll receive progress reports and updates via email" : "Email notifications have been turned off",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update email notification setting",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error", 
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    
    setIsChangingPassword(false);
  };

  const handleResendVerificationEmail = async () => {
    setIsResendingEmail(true);
    
    const result = await resendVerificationEmail();
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Verification email sent! Please check your inbox.",
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    
    setIsResendingEmail(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);

    const result = await updateProfile({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      profilePicture: profileForm.profilePicture.trim() || undefined,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setShowProfileEdit(false);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }

    setIsUpdatingProfile(false);
  };

  // Initialize profile form when opening edit
  useEffect(() => {
    if (showProfileEdit && profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        profilePicture: profile.profilePicture || ''
      });
    }
  }, [showProfileEdit, profile]);

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

    let password = '';
    if (profile?.signupMethod === 'email') {
      const inputPassword = prompt("Please enter your password to confirm account deletion:");
      if (!inputPassword) return;
      password = inputPassword;
    }

    const result = await deleteAccount(password);
    
    if (result.success) {
      toast({
        title: "Account deleted",
        description: "Your account has been deleted. You will be redirected to the homepage.",
      });
      setTimeout(() => setLocation("/"), 1500);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/80">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SharedSidebarEmotional
          onFeedbackOpen={() => setShowFeedback(true)}
          currentPage="settings"
        />
      </div>

      {/* Feedback modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Main */}
      <main className="lg:ml-20 w-full pb-20 lg:pb-0">
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
              <div className="flex-grow">
                <div className="text-lg font-medium">{displayName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <button
                onClick={() => setShowProfileEdit(!showProfileEdit)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg"
              >
                <User className="w-4 h-4" />
                {showProfileEdit ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* Profile Edit Form */}
            {showProfileEdit && (
              <form onSubmit={handleProfileUpdate} className="mt-6 p-4 border border-border rounded-lg bg-muted/20">
                <h3 className="font-semibold mb-4">Edit Profile Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium block mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium block mb-2">Profile Picture URL (optional)</label>
                  <input
                    type="url"
                    value={profileForm.profilePicture}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, profilePicture: e.target.value }))}
                    placeholder="https://example.com/your-profile-picture.jpg"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-4 py-2 bg-[#ff6b1d] text-white rounded-lg hover:bg-[#e55a15] disabled:opacity-50"
                  >
                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileEdit(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 h-px bg-border" />
          </section>

          {/* Security Settings */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-[#ff6b1d]" />
              <h2 className="text-2xl font-bold">Security</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Manage your account security and authentication
            </p>

            <div className="space-y-4">
              {/* Two-Factor Authentication */}
              <button
                onClick={() => setShow2FA(true)}
                className="w-full p-4 border border-border hover:bg-muted rounded-lg transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-[#ff6b1d]" />
                  <div className="text-left">
                    <div className="font-semibold">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground group-hover:translate-x-1 transition">→</div>
              </button>
            </div>
          </section>

          {/* Advanced Security */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-[#ff6b1d]" />
              <h2 className="text-2xl font-bold">Advanced Security</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Manage email verification, password settings, and other security options
            </p>

            <div className="space-y-6">

              {/* Email Verification Status */}
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Email Verification</div>
                      <div className="text-sm text-muted-foreground">
                        {emailVerification?.email || user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {emailVerification?.emailVerified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Not Verified</span>
                        </div>
                        {emailVerification?.signupMethod === 'email' && (
                          <button
                            onClick={handleResendVerificationEmail}
                            disabled={isResendingEmail}
                            className="px-3 py-1 text-sm bg-[#ff6b1d] text-white rounded-lg hover:bg-[#e55a15] disabled:opacity-50"
                          >
                            {isResendingEmail ? 'Sending...' : 'Resend'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change */}
              {profile?.signupMethod === 'email' && (
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5" />
                      <div>
                        <div className="font-semibold">Password</div>
                        <div className="text-sm text-muted-foreground">
                          Change your account password
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
                      className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg"
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
                              placeholder="Enter your new password (min 6 characters)"
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
                            placeholder="Confirm your new password"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="px-4 py-2 bg-[#ff6b1d] text-white rounded-lg hover:bg-[#e55a15] disabled:opacity-50"
                        >
                          {isChangingPassword ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
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
                      role="switch"
                      aria-checked="true"
                      className="relative inline-flex h-6 w-12 rounded-full bg-muted cursor-not-allowed"
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
                      Receive browser notifications for session reminders, progress updates, and achievement notifications.
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
                      Receive weekly progress reports, account updates, and important announcements via email.
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

          

          {/* Danger Zone */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">Danger zone</h2>
            <p className="text-muted-foreground mb-4">
              Irreversible actions — proceed with caution
            </p>

            <div className="space-y-4">
            
              <div>
                <div>
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
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="settings"
        userType="adult"
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      {/* 2FA Setup Modal */}
      <TwoFactorSetup
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
        userType="adult"
        onSuccess={() => {
          toast({
            title: "2FA Configuration Updated",
            description: "Your two-factor authentication settings have been updated successfully.",
          });
        }}
      />
    </div>
  );
}