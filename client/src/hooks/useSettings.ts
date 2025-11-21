import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface UserSettings {
  analyticsEnabled: boolean;
  necessaryCookies: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'english' | 'urdu';
}

const defaultSettings: UserSettings = {
  analyticsEnabled: true,
  necessaryCookies: true,
  pushNotifications: true,
  emailNotifications: true,
  theme: 'system',
  language: 'english'
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Fetch user settings
  const fetchSettings = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl('/api/settings'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        console.log('✅ Settings loaded:', data.settings);
      } else {
        throw new Error(data.message || 'Failed to load settings');
      }
    } catch (err) {
      console.error('❌ Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      // Use default settings on error
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  // Update all settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!isAuthenticated) return false;

    try {
      setError(null);

      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl('/api/settings'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        console.log('✅ Settings updated:', newSettings);
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

  // Update specific setting
  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!isAuthenticated) return false;

    try {
      setError(null);

      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl(`/api/settings/${key}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({ ...prev, [key]: value }));
        console.log(`✅ Setting ${key} updated to:`, value);
        return true;
      } else {
        throw new Error(data.message || `Failed to update ${key}`);
      }
    } catch (err) {
      console.error(`❌ Error updating ${key}:`, err);
      setError(err instanceof Error ? err.message : `Failed to update ${key}`);
      return false;
    }
  };

  // Delete account
  const deleteAccount = async (password?: string) => {
    if (!isAuthenticated) return false;

    try {
      setError(null);
      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl('/api/settings/account'), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          confirmDeletion: 'DELETE_MY_ACCOUNT'
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Account deleted successfully');
        // Clear local storage and redirect
        localStorage.clear();
        window.location.href = '/';
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error('❌ Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      return false;
    }
  };

  // Load settings on mount and when auth changes
  useEffect(() => {
    fetchSettings();
  }, [isAuthenticated]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSetting,
    deleteAccount,
    refetch: fetchSettings
  };
}