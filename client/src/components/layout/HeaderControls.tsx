import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import DarkModeToggle from '@/components/DarkModeToggle';

interface HeaderControlsProps {
  showPreferencesLabel?: boolean;
  showDarkModeLabel?: boolean;
  className?: string;
  onPreferencesChange?: (isOpen: boolean) => void;
}

export default function HeaderControls({ 
  showPreferencesLabel = true,
  showDarkModeLabel = true,
  className = "flex items-center gap-6",
  onPreferencesChange
}: HeaderControlsProps) {
  const [showPreferences, setShowPreferences] = useState(false);

  const togglePreferences = () => {
    const newState = !showPreferences;
    setShowPreferences(newState);
    onPreferencesChange?.(newState);
  };

  return (
    <>
      <div className={className}>
        {/* Dark Mode Toggle */}
        {showDarkModeLabel && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Dark Mode</span>
            <DarkModeToggle />
          </div>
        )}
        
        {!showDarkModeLabel && <DarkModeToggle />}

        {/* Preferences Button */}
        <button
          onClick={togglePreferences}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Toggle preferences"
        >
          <SlidersHorizontal className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Preferences Modal */}
      <PreferencesModal 
        isOpen={showPreferences}
        onClose={() => {
          setShowPreferences(false);
          onPreferencesChange?.(false);
        }}
      />
    </>
  );
}

// Preferences Modal Component
interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [language, setLanguage] = useState('en');
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const [notifications, setNotifications] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            className="fixed top-20 right-10 w-[380px] bg-popover border border-border rounded-xl shadow-xl z-50"
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Preferences</h3>
                  <p className="text-sm text-muted-foreground">Customize your experience</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Language Setting */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Language</h4>
                  <p className="text-xs text-muted-foreground">Choose your preferred conversation language</p>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b1d] focus:border-[#ff6b1d] transition-colors"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                  <option value="both">Both Languages</option>
                </select>
              </div>

              {/* Voice Speed Setting */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Voice Speed</h4>
                  <p className="text-xs text-muted-foreground">How fast should the AI speak?</p>
                </div>
                <select 
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(e.target.value)}
                  className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b1d] focus:border-[#ff6b1d] transition-colors"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Notifications</h4>
                  <p className="text-xs text-muted-foreground">Get reminders for practice sessions</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-[#ff6b1d]' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Avatar Selection */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">AI Avatar</h4>
                  <p className="text-xs text-muted-foreground">Choose your preferred AI companion</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Luna', emoji: '👩‍💼', id: 'therapist' },
                    { name: 'Victor', emoji: '👨‍🏫', id: 'professional' },
                    { name: 'Serena', emoji: '👩‍🎓', id: 'casual' }
                  ].map((avatar) => (
                    <button
                      key={avatar.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted transition-colors text-center"
                    >
                      <div className="text-2xl mb-1">{avatar.emoji}</div>
                      <div className="text-xs font-medium">{avatar.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium bg-[#ff6b1d] text-white rounded-lg hover:bg-[#e55a1a] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}