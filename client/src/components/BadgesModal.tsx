import React from 'react';
import { X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: {
    pronunciation: string[];
    fluency: string[];
    dld: string[];
    social: string[];
  };
}

const therapyTypeNames = {
  pronunciation: 'Pronunciation',
  fluency: 'Fluency & Stuttering',
  dld: 'Language Building',
  social: 'Social Communication'
};

const therapyTypeColors = {
  pronunciation: {
    bg: 'bg-[--primary-bg-light]',
    border: 'border-[--primary]',
    text: 'text-[--primary-dark]',
    badge: 'bg-[--primary]/10 text-[--primary]'
  },
  fluency: {
    bg: 'bg-[--primary-bg-light]',
    border: 'border-[--primary]',
    text: 'text-[--primary-dark]',
    badge: 'bg-[--primary]/10 text-[--primary]'
  },
  dld: {
    bg: 'bg-purple-50/20',
    border: 'border-purple-300',
    text: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-500'
  },
  social: {
    bg: 'bg-yellow-50/20',
    border: 'border-yellow-300',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/10 text-yellow-500'
  }
};

export default function BadgesModal({ isOpen, onClose, badges }: BadgesModalProps) {
  const totalBadges = badges.pronunciation.length + badges.fluency.length + badges.dld.length + badges.social.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F5B82E]/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#F5B82E]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your Badges</h2>
                    <p className="text-sm text-muted-foreground">
                      {totalBadges} {totalBadges === 1 ? 'badge' : 'badges'} earned
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {totalBadges === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No badges earned yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Complete stories and level up to earn badges!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(['pronunciation', 'fluency', 'dld', 'social'] as const).map((therapyType) => {
                      const therapyBadges = badges[therapyType];
                      if (therapyBadges.length === 0) return null;

                      const colors = therapyTypeColors[therapyType];

                      return (
                        <div key={therapyType} className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
                          <h3 className={`text-sm font-bold mb-3 ${colors.text}`}>
                            {therapyTypeNames[therapyType]}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {therapyBadges.map((badge, index) => (
                              <div
                                key={index}
                                className={`px-3 py-2 rounded-full text-sm font-medium ${colors.badge} border ${colors.border}`}
                              >
                                {badge}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

