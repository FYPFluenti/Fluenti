import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import ModelViewerAvatar from '@/components/ModelViewerAvatar';
import SharedSidebar from '@/components/layout/SharedSidebar';
import FeedbackModal from '@/components/layout/FeedbackModel';
import { useLocation } from 'wouter';

// Demo avatars
const avatarUrls = {
  therapist: "https://models.readyplayer.me/68ab4a2c3f2023411197a0fa.glb",
  professional: "https://models.readyplayer.me/68ab4ab5e05b84c2efb26767.glb",
  casual: "https://models.readyplayer.me/68aa261a75e83eeb00564816.glb",
};

export default function VoiceModel() {
  const [, setLocation] = useLocation();
  const [listening, setListening] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="fixed inset-0 bg-background flex">
      {/* Sidebar */}
      <SharedSidebar 
        onFeedbackOpen={() => setShowFeedback(true)}
        currentPage="voice"
      />

      <button
        onClick={() => setLocation('/child-dashboard')}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 text-2xl w-10 h-10 flex items-center justify-center"
        aria-label="Close voice chat"
      >
        ✕
      </button>

      <main className="ml-20 flex-1 grid place-items-center p-6">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 -m-3 rounded-full border-4 border-cyan-300/90 blur-[0.3px]" />
            <div className="relative rounded-full overflow-hidden bg-[#1f2028] w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80">
              <div className="absolute inset-0 w-full h-full">
                <ModelViewerAvatar
                  avatarUrl={avatarUrls.professional}
                  size="large"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-lg border border-border rounded-xl bg-card p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {listening ? "Listening…" : "Ready to talk"}
              </span>
              <span className="text-xs text-muted-foreground">
                {listening ? "Speak to your AI avatar" : "Tap the mic to start"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setListening(false)}
                className="w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted"
                aria-label="stop listening"
                title="stop listening"
              >
                ✕
              </button>
              <button
                onClick={() => setListening((v: boolean) => !v)}
                className="w-12 h-12 rounded-full grid place-items-center bg-[#F5B82E] hover:brightness-95 transition"
                aria-label="toggle microphone"
                title="toggle microphone"
              >
                {listening ? <Mic className="w-5 h-5 text-black" /> : <MicOff className="w-5 h-5 text-black" />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
}