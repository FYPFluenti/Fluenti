import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';

export interface UserSettings {
  analyticsEnabled: boolean;
  necessaryCookies: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'english' | 'urdu';
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  userType: 'adult' | 'child' | 'guardian';
  signupMethod: 'email' | 'google' | 'facebook';
}

export interface EmailVerificationStatus {
  emailVerified: boolean;
  email: string;
  signupMethod: string;
}

const defaultSettings: UserSettings = {
  analyticsEnabled: true,
  necessaryCookies: true,
  pushNotifications: true,
  emailNotifications: true,
  theme: 'system',
  language: 'english'
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emailVerification, setEmailVerification] = useState<EmailVerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch user settings
  const fetchSettings = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      const response = await apiRequest('GET', '/api/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
      } else {
        throw new Error(data.message || 'Failed to load settings');
      }
    } catch (err) {
      console.error('❌ Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setSettings(defaultSettings);
    }
  };

  // Fetch email verification status
  const fetchEmailVerificationStatus = async () => {
    if (!isAuthenticated) return;

    try {
      console.log('🔍 Fetching email verification status...');
      const response = await apiRequest('GET', '/api/auth/email-verification-status');
      const data = await response.json();

      console.log('📧 Email verification response:', data);
      if (data.success) {
        setEmailVerification(data);
      } else {
        console.error('❌ Email verification fetch failed:', data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching email verification status:', err);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setProfile(user as UserProfile);
      
      // Add a small delay to ensure JWT token is properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await Promise.all([
        fetchSettings(),
        fetchEmailVerificationStatus()
      ]);
      
      setIsLoading(false);
    };

    initializeData();
  }, [isAuthenticated, user]);

  // Update settings
  const updateSetting = async (key: keyof UserSettings, value: boolean | string) => {
    if (!isAuthenticated) return false;

    try {
      setError(null);

      // Add a small delay to prevent rapid-fire requests
      await new Promise(resolve => setTimeout(resolve, 50));

      const response = await fetch(`/api/settings/${key}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ value })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({ ...prev, [key]: value }));
        return true;
      } else {
        throw new Error(data.message || 'Failed to update setting');
      }
    } catch (err) {
      console.error('❌ Error updating setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update setting');
      return false;
    }
  };

  // Update multiple settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!isAuthenticated) return false;

    try {
      setError(null);

      const response = await apiRequest('PUT', '/api/settings', { settings: newSettings });
      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        return true;
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('❌ Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      return false;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!isAuthenticated) return { success: false, message: 'Not authenticated' };

    try {
      setError(null);

      const response = await apiRequest('POST', '/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to change password' };
      }
    } catch (err) {
      console.error('❌ Error changing password:', err);
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setError(message);
      return { success: false, message };
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!isAuthenticated) return { success: false, message: 'Not authenticated' };

    try {
      setError(null);

      const response = await apiRequest('POST', '/api/auth/resend-verification');
      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to send verification email' };
      }
    } catch (err) {
      console.error('❌ Error resending verification email:', err);
      const message = err instanceof Error ? err.message : 'Failed to send verification email';
      setError(message);
      return { success: false, message };
    }
  };

  // Update user profile
  const updateProfile = async (profileData: Partial<Pick<UserProfile, 'firstName' | 'lastName'>>) => {
    if (!isAuthenticated) return { success: false, message: 'Not authenticated' };

    try {
      setError(null);

      const response = await apiRequest('PUT', '/api/settings/profile', profileData);
      const data = await response.json();

      if (data.success) {
        setProfile(prev => prev ? { ...prev, ...data.user } : null);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to update profile' };
      }
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      return { success: false, message };
    }
  };

  // Delete account
  const deleteAccount = async (password?: string) => {
    if (!isAuthenticated) return { success: false, message: 'Not authenticated' };

    try {
      setError(null);

      const requestBody: any = {
        confirmDeletion: 'DELETE_MY_ACCOUNT'
      };

      if (password) {
        requestBody.password = password;
      }

      const response = await apiRequest('DELETE', '/api/settings/account', requestBody);
      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to delete account' };
      }
    } catch (err) {
      console.error('❌ Error deleting account:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      return { success: false, message };
    }
  };

  return {
    // Data
    settings,
    profile,
    emailVerification,
    isLoading,
    error,

    // Actions
    updateSetting,
    updateSettings,
    updateProfile,
    changePassword,
    resendVerificationEmail,
    deleteAccount,

    // Refresh functions
    refreshSettings: fetchSettings,
    refreshEmailVerification: fetchEmailVerificationStatus,
  };
}