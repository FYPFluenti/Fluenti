import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ChildNameScreenProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function ChildNameScreen({ data, onNext, onBack, onSkip }: ChildNameScreenProps) {
  const [childName, setChildName] = useState<string>(data.childName || '');

  const handleContinue = () => {
    if (childName.trim()) {
      onNext({ childName: childName.trim() });
    }
  };

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-normal text-foreground mb-16">
          what's your child name?
        </h1>

        {/* Name Input */}
        <div className="mb-16">
          <motion.input
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            type="text"
            placeholder="name..."
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full px-0 py-3 text-lg bg-transparent border-0 border-b border-border focus:border-primary focus:outline-none transition-colors text-center placeholder-muted-foreground text-foreground"
            maxLength={50}
          />
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={!childName.trim()}
          className={`w-full py-4 px-8 rounded-full font-medium transition-all duration-200 ${
            childName.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          continue
        </motion.button>
      </motion.div>
    </div>
  );
}