import React from 'react';

export const FoxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6.5C18 8.43 16.43 10 14.5 10C12.57 10 11 8.43 11 6.5C11 4.57 12.57 3 14.5 3C16.43 3 18 4.57 18 6.5M6 20C6 20 5 17 8 17S11 20 11 20H6M17.5 10C18.88 10 20 8.88 20 7.5C20 6.12 18.88 5 17.5 5C17.2 5 16.92 5.06 16.65 5.17C16.89 5.59 17.04 6.07 17.04 6.5C17.04 8.43 15.43 10 13.5 10C13.07 10 12.68 9.9 12.33 9.73C13.23 11.23 14.89 12.21 16.79 12.43L15.5 14L14.5 13L13.5 14L12.5 13L11.5 14L10.5 13L9.5 14L8.5 13L7.5 14L6.21 12.43C4.5 12.09 3.09 11.09 2 9.77C3.12 8.32 4.61 7.29 6.27 6.88C6.1 7.19 6 7.5 6 7.85C6 9.87 7.79 11.5 10 11.5C10.35 11.5 10.68 11.43 11 11.33V11.5C11 13.43 9.43 15 7.5 15C5.57 15 4 13.43 4 11.5C4 10.39 4.54 9.4 5.38 8.75C3.5 8.35 2 6.88 2 5C2 2.79 3.79 1 6 1C8.21 1 10 2.79 10 5C10 5.88 9.68 6.68 9.17 7.31C9.69 7.73 10.3 8 11 8C11.54 8 12.03 7.82 12.44 7.5C12.82 7.18 13.12 6.78 13.35 6.35C13.72 6.12 14.1 6 14.5 6C15.88 6 17 7.12 17 8.5C17 9.13 16.74 9.7 16.32 10.15C16.66 10.27 17.05 10.31 17.5 10.31L17.5 10Z" />
  </svg>
);

export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
  </svg>
);

export const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.35 4.7L19 7.85l-3.5 3.4L16.7 16 12 13.4 7.3 16l1.2-4.75L5 7.85l4.65-1.15L12 2zM12 5.3l-1.3 2.6L8 8.5l2.5 2.45-.6 3.05L12 12.5l2.1 1.5-.6-3.05L16 8.5l-2.7-.6L12 5.3z" />
  </svg>
);

export const SpeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
);

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A6.01 6.01 0 0012 18c2.05 0 3.84-1.03 4.88-2.61C19.49 14.82 21 12.78 21 10V7c0-1.1-.9-2-2-2zm-7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
    </svg>
);

export const FantasyForestIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a9 9 0 0 0-9 9c0 4.43 3.09 8.13 7.15 8.84V22h3.7v-2.16C17.91 19.13 21 15.43 21 11a9 9 0 0 0-9-9z"/>
    </svg>
);

export const JungleAdventureIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.94 4.66c-1.4-1.2-3.49-.94-4.84.2l-1.35 1.35-1.54-1.54-1.41 1.41 1.54 1.54-1.35 1.35c-1.14 1.35-.88 3.44.54 4.84l4.13 4.13c1.4 1.42 3.49 1.68 4.84.54l4.13-4.13c1.4-1.4.68-3.49-.54-4.84L12.94 4.66z"/>
    </svg>
);

export const SpaceQuestIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.5 17c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm6.5-17L14 3l-2-2-2 2-2-2-2 2-2-2v7c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V0l-2 2z"/>
    </svg>
);

export const MagicalSchoolIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6" />
    </svg>
);

export const LionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9h4v-2h-4v2zm0 4h4v-2h-4v2z" />
    </svg>
);

export const NatureIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V8h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2z"/>
    </svg>
);

export const InventorIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v2h-2zm0 4h2v6h-2z"/>
    </svg>
);

export const CreateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-14C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

export const SpeechBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
);

export const FluencyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12c.88.9 1.83 1.58 3 2 2.5.88 5-1.13 7.5-1.13s4.38 1.88 7.5 1.13c1.4-.35 2.33-1.04 3-2"/>
        <path d="M3 6c.88.9 1.83 1.58 3 2 2.5.88 5-1.13 7.5-1.13s4.38 1.88 7.5 1.13c1.4-.35 2.33-1.04 3-2"/>
        <path d="M3 18c.88.9 1.83 1.58 3 2 2.5.88 5-1.13 7.5-1.13s4.38 1.88 7.5 1.13c1.4-.35 2.33-1.04 3-2"/>
    </svg>
);

export const DldIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
    </svg>
);