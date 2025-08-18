// Lightweight fallback speech service that doesn't require heavy ML models
export async function simpleTranscribeAudio(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  // For now, return a placeholder that indicates voice was received
  // This can be replaced with a lighter speech recognition service later
  const timestamp = new Date().toLocaleTimeString();
  
  if (language === 'ur') {
    return `آڈیو پیغام موصول ہوا ${timestamp} پر`;
  } else {
    return `Audio message received at ${timestamp}`;
  }
}

// Alternative: Web Speech API wrapper (for future implementation)
export async function webSpeechTranscribe(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<string> {
  // This would use the Web Speech API on the client side
  // For now, return a placeholder
  return "Web Speech API transcription not implemented yet";
}

// Simple audio validation
export function validateAudioBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length === 0) {
    return false;
  }
  
  // Check if buffer is too large (over 10MB)
  if (buffer.length > 10 * 1024 * 1024) {
    return false;
  }
  
  // Basic WAV header check (if it's a WAV file)
  const header = buffer.toString('ascii', 0, 4);
  if (header === 'RIFF') {
    return true;
  }
  
  // For other formats, assume valid for now
  return true;
}
