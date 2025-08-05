export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    utterance.volume = 0.8;
    
    // Use a child-friendly voice if available
    const voices = speechSynthesis.getVoices();
    const childVoice = voices.find(voice => 
      voice.name.includes('Female') || voice.name.includes('Karen')
    );
    if (childVoice) {
      utterance.voice = childVoice;
    }
    
    speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported');
  }
};