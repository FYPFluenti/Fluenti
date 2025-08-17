import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/auth/LogoutButton";
import DarkModeToggle from "@/components/DarkModeToggle";
import { Settings, User, Bell, Shield, Palette } from "lucide-react";

interface User {
  name?: string;
  email?: string;
}

interface AdultSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'ur';
  onLanguageChange?: (language: 'en' | 'ur') => void;
}

export function AdultSettings({ isOpen, onClose, language = 'en', onLanguageChange }: AdultSettingsProps) {
  const { user } = useAuth() as { user: User };
  const [notifications, setNotifications] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Profile</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  {user?.name || 'Adult User'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email || 'adult@fluenti.com'}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Adult Account
                </p>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Appearance</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Switch between light and dark themes
                  </p>
                </div>
                <DarkModeToggle />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Language</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose your preferred language
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      language === 'en'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => onLanguageChange?.('en')}
                  >
                    English
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      language === 'ur'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => onLanguageChange?.('ur')}
                  >
                    اردو
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Push Notifications</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive notifications about your progress
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    aria-label="Toggle push notifications"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      notifications ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Session Reminders</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get reminded about your therapy sessions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={sessionReminders}
                    onChange={(e) => setSessionReminders(e.target.checked)}
                    aria-label="Toggle session reminders"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    sessionReminders ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      sessionReminders ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Privacy & Security</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Data Sharing</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Allow anonymous data sharing for research
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={dataSharing}
                    onChange={(e) => setDataSharing(e.target.checked)}
                    aria-label="Toggle data sharing"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    dataSharing ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      dataSharing ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Your privacy is important to us. All session data is encrypted and stored securely.
                </p>
                <button className="text-purple-600 dark:text-purple-400 text-sm hover:underline">
                  View Privacy Policy
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Account</h3>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Change Password</span>
              </button>
              
              <button className="w-full text-left p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Export Data</span>
              </button>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
