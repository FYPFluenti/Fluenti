import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import DarkModeToggle from '@/components/DarkModeToggle';

interface HeaderControlsProps {
  className?: string;
}

export default function HeaderControls({ 
  className = "flex items-center gap-6"
}: HeaderControlsProps) {
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <>
      <div className={className}>
        {/* Dark Mode with Text - Exact match from child-dashboard */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Dark Mode</span>
          <DarkModeToggle />
        </div>
        
        {/* Preferences Button - Exact match */}
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="p-2 rounded-full hover:bg-muted transition"
          aria-label="Toggle preferences"
        >
          <SlidersHorizontal className="w-6 h-6 text-foreground" aria-hidden="true" />
        </button>
      </div>

      {/* Preferences Modal - Exact same as child-dashboard */}
      {showPreferences && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-20 right-10 w-[360px] bg-popover border border-border rounded-xl shadow-xl p-6 space-y-4 z-50"
        >
          <div>
            <h3 className="text-lg font-semibold">Preferences</h3>
            <p className="text-sm text-muted-foreground">Set how the assistant works for you</p>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Language</h4>
                <p className="text-xs text-muted-foreground">Conversation only</p>
              </div>
              <select 
                className="bg-card text-foreground border border-border rounded-md px-3 py-1 text-sm font-dm-sans focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                aria-label="Select conversation language"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}