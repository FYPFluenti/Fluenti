import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, FoxIcon, SparkleIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import { generatePronunciationAssessmentPrompts, generateFluencyAssessmentSentences, generateDldAssessmentSentences } from '@/services/geminiService';
import { AssessmentResult, AudioFeatures, TherapyType } from '@/types/games/story-game';

interface AssessmentScreenProps {
  onComplete: (results: AssessmentResult[]) => void;
  isLoading: boolean;
  therapyType: TherapyType;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
}

const screenConfigs = {
    pronunciation: {
        title: "Pronunciation Check-up",
        subtitle: "Let's play a fun word game!",
        fetcher: generatePronunciationAssessmentPrompts,
        defaultPrompts: [
            { scenario: "A magical door appears in front of you, but it's locked! The door needs a special magic word to open.", action: "To open the magic door, you must say the magic word: 'rabbit'! Can you repeat it?", targetWord: "rabbit" },
            { scenario: "The wizard's crystal ball is glowing, but it needs a magic word to show you a vision!", action: "The wizard needs you to say the magic word: 'treasure'! Repeat it after me: 'treasure'!", targetWord: "treasure" },
            { scenario: "A friendly dragon wants to be your friend, but first you need to say the magic word!", action: "Say the magic word to befriend the dragon: 'sparkle'! Can you say 'sparkle'?", targetWord: "sparkle" }
        ]
    },
    fluency: {
        title: "Fluency Check-up",
        subtitle: "Let's warm up our smooth-talking voices!",
        fetcher: generateFluencyAssessmentSentences,
        defaultPrompts: [
            { scenario: "Oh no! The brave knight needs to say a magic spell quickly to save the castle!", action: "Say this magic spell smoothly: 'Peter Piper picked a peck of pickled peppers!'", targetPhrase: "Peter Piper picked a peck of pickled peppers." },
            { scenario: "The robot needs a special code word to activate its superpowers!", action: "Say this code smoothly: 'Ten tiny turtles tiptoed on the tall, tilted table.'", targetPhrase: "Ten tiny turtles tiptoed on the tall, tilted table." },
            { scenario: "The wizard needs you to say the secret password to open the treasure door!", action: "Say this password smoothly: 'How can a clam cram in a clean cream can?'", targetPhrase: "How can a clam cram in a clean cream can?" }
        ]
    },
    dld: {
        title: "Language Check-up",
        subtitle: "Let's practice building big ideas!",
        fetcher: generateDldAssessmentSentences,
        defaultPrompts: [
            { scenario: "Imagine you're a superhero with amazing powers! You're about to go on your first adventure!", action: "Tell me about your superpower and why you chose it! Use complete sentences.", targetConcept: "complex sentences with cause and effect" },
            { scenario: "You're exploring a magical forest and you discover a hidden treasure chest!", action: "Describe what's inside the treasure chest and explain how you found it!", targetConcept: "descriptive vocabulary and sequencing" },
            { scenario: "You're a chef in a magical kitchen and you need to create the most amazing meal ever!", action: "Tell me what ingredients you would use and how you would make your special dish!", targetConcept: "vocabulary expansion and complex sentence formation" }
        ]
    },
    social: { title: "", subtitle: "", instruction: "", fetcher: async () => [], defaultPrompts: [] },
    none: { title: "", subtitle: "", instruction: "", fetcher: async () => [], defaultPrompts: [] },
};


const AssessmentScreen: React.FC<AssessmentScreenProps> = ({ onComplete, isLoading, therapyType }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isFetchingPrompts, setIsFetchingPrompts] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const silenceTimerRef = useRef<number | null>(null);
  const transcriptRef = useRef('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioDataRef = useRef<{ pitchData: number[], volumeData: number[], wordCount: number, duration: number }>({ pitchData: [], volumeData: [], wordCount: 0, duration: 0 });
  const animationFrameId = useRef<number | null>(null);

  const screenConfig = screenConfigs[therapyType];

  useEffect(() => {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      const voiceScores: Record<string, number> = {
        'Microsoft Aria Online (Natural) - English (United States)': 100,
        'Microsoft Jenny Online (Natural) - English (United States)': 100,
        'Google US English': 90, 'Samantha': 85, 'Alex': 80,
        'Microsoft Zira Desktop - English (United States)': 75,
      };
      const scoredVoices = voices
        .filter(v => v.lang.startsWith('en'))
        .map(voice => ({ voice, score: voiceScores[voice.name] || 0 }))
        .sort((a, b) => b.score - a.score);
      setSelectedVoice(scoredVoices.length > 0 ? scoredVoices[0].voice : (voices.find(v => v.lang.startsWith('en')) || voices[0]));
    };
    if (speechSynthesis.getVoices().length > 0) setVoice();
    else if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = setVoice;
    return () => {
      speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    // Prevent double fetching by checking if prompts are already loaded
    if (prompts.length > 0) {
      return; // Already have prompts, don't fetch again
    }
    
    const fetchPrompts = async () => {
      setIsFetchingPrompts(true);
      setError(null); // Clear previous errors
      try {
        const newPrompts = await screenConfig.fetcher();
        if (newPrompts && newPrompts.length > 0) {
        setPrompts(newPrompts);
        } else {
          throw new Error("Empty response from API");
        }
      } catch (err: any) {
        console.error("Error fetching prompts:", err);
        const errorMessage = err?.message || 'Unknown error';
        // Only show error if it's not a network/API issue that we can recover from
        if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable') || errorMessage.includes('rate limit')) {
          setError(`The service is temporarily unavailable. Using default prompts.`);
        } else if (errorMessage.includes('API_KEY') || errorMessage.includes('authentication')) {
          setError(`API configuration error. Please check your API key. Using defaults.`);
        } else {
        setError(`Could not generate new prompts. Using defaults.`);
        }
        // Always fall back to defaults
        if (screenConfig.defaultPrompts && screenConfig.defaultPrompts.length > 0) {
        setPrompts(screenConfig.defaultPrompts);
        }
      } finally {
        setIsFetchingPrompts(false);
      }
    };
    if (therapyType !== 'none' && therapyType !== 'social') {
        fetchPrompts();
    }
  }, [therapyType, screenConfig.fetcher, screenConfig.defaultPrompts, prompts.length]); // Only depend on therapyType to prevent double fetching

  useEffect(() => {
    return () => {
        if (recognition) recognition.stop();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
  }, []);

  const narratePrompt = (roundIndex: number, onEndCallback: () => void) => {
    if (!selectedVoice || !prompts[roundIndex]) {
        onEndCallback();
        return;
    }

    const prompt = prompts[roundIndex];
    const roundIntro = `Round ${roundIndex + 1}. `;
    let textToSpeak = '';

    if (therapyType === 'pronunciation') {
      // Use '...' for a natural pause between scenario and action
      textToSpeak = `${roundIntro} ${prompt.scenario} ... ${prompt.action}`;
    } else if (therapyType === 'fluency' || therapyType === 'dld') {
      // Use '...' for a natural pause between scenario and action
      textToSpeak = `${roundIntro} ${prompt.scenario} ... ${prompt.action}`;
    } else {
      textToSpeak = `${roundIntro} ${prompt}`;
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = selectedVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => {
      setIsNarrating(false);
      onEndCallback();
    };
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const calculateAverage = (arr: number[]) => arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;

  const autocorrelate = (buf: Float32Array, sampleRate: number) => {
      let SIZE = buf.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) {
          const val = buf[i];
          rms += val * val;
      }
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.01) return -1;

      let r1 = 0, r2 = SIZE - 1, thres = 0.2;
      for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
      for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

      buf = buf.slice(r1, r2);
      SIZE = buf.length;

      const c = new Array(SIZE).fill(0);
      for (let i = 0; i < SIZE; i++) {
          for (let j = 0; j < SIZE - i; j++) {
              c[i] = c[i] + buf[j] * buf[j + i];
          }
      }

      let d = 0;
      while (d < c.length && c[d] > c[d + 1]) d++;
      let maxval = -1, maxpos = -1;
      for (let i = d; i < SIZE; i++) {
          if (c[i] > maxval) {
              maxval = c[i];
              maxpos = i;
          }
      }
      let T0 = maxpos;

      const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);

      return sampleRate / T0;
  }

  const getPitch = (analyser: AnalyserNode, sampleRate: number) => {
      const buffer = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buffer);
      const pitch = autocorrelate(buffer, sampleRate);
      return pitch > 0 ? pitch : 0;
  };
  
  const calculateJitterAndShimmer = (pitchData: number[], volumeData: number[]) => {
      if (pitchData.length < 2 || volumeData.length < 2) return { jitter: 0, shimmer: 0 };
      
      let jitter = 0;
      for (let i = 1; i < pitchData.length; i++) {
          jitter += Math.abs(pitchData[i] - pitchData[i - 1]);
      }
      jitter /= (pitchData.length - 1);
      const avgPitch = calculateAverage(pitchData);
      if (avgPitch > 0) jitter /= avgPitch;

      let shimmer = 0;
      for (let i = 1; i < volumeData.length; i++) {
          shimmer += Math.abs(volumeData[i] - volumeData[i - 1]);
      }
      shimmer /= (volumeData.length - 1);
      const avgVolume = calculateAverage(volumeData);
      if (avgVolume > 0) shimmer /= avgVolume;
      
      return { jitter, shimmer };
  };

  const startAudioAnalysis = async () => {
      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
          }

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 2048;
          sourceRef.current.connect(analyserRef.current);
          
          audioDataRef.current = { pitchData: [], volumeData: [], wordCount: 0, duration: 0 };
          const startTime = Date.now();

          const analysisLoop = () => {
              if (analyserRef.current && audioContextRef.current) {
                  const pitch = getPitch(analyserRef.current, audioContextRef.current.sampleRate);
                  if (pitch > 50 && pitch < 600) audioDataRef.current.pitchData.push(pitch);

                  const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
                  analyserRef.current.getByteTimeDomainData(buffer);
                  let sum = 0;
                  for(let i = 0; i < buffer.length; i++) {
                      sum += Math.pow((buffer[i] / 128.0) - 1, 2);
                  }
                  const rms = Math.sqrt(sum / buffer.length);
                  audioDataRef.current.volumeData.push(rms);
                  
                  audioDataRef.current.duration = (Date.now() - startTime) / 1000;
                  animationFrameId.current = requestAnimationFrame(analysisLoop);
              }
          };
          analysisLoop();
      } catch (err) {
          console.error("Error starting audio analysis:", err);
          setError("Could not access microphone for analysis.");
      }
  };

  const stopAudioAnalysis = (transcript: string): AudioFeatures | undefined => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (sourceRef.current) sourceRef.current.disconnect();

      if (audioDataRef.current.pitchData.length === 0) return undefined;

      const { jitter, shimmer } = calculateJitterAndShimmer(audioDataRef.current.pitchData, audioDataRef.current.volumeData);
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      const speakingRate = audioDataRef.current.duration > 0 ? (wordCount / audioDataRef.current.duration) * 60 : 0;
      
      const features: AudioFeatures = {
          pitch: calculateAverage(audioDataRef.current.pitchData),
          volume: calculateAverage(audioDataRef.current.volumeData),
          jitter,
          shimmer,
          speakingRate,
      };
      return features;
  };

  const handleRetry = (roundIndex: number) => {
    const retryUtterance = new SpeechSynthesisUtterance("Oops, I didn't hear you. Let's try that one more time!");
    if (selectedVoice) retryUtterance.voice = selectedVoice;
    
    retryUtterance.onstart = () => setIsNarrating(true);
    retryUtterance.onend = () => {
        setIsNarrating(false);
        // After saying the retry prompt, re-narrate the actual prompt and start listening again for the same round.
        narratePrompt(roundIndex, () => startRecognition(roundIndex));
    };
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(retryUtterance);
  };

  const startRecognition = (roundIndex: number) => {
    if (!recognition || !prompts[roundIndex] || isNarrating) {
        setError('Speech recognition is not supported or ready.');
        return;
    }
    
    setIsListening(true);
    transcriptRef.current = '';
    
    startAudioAnalysis();
    
    recognition.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        transcriptRef.current = Array.from(event.results).map((result: any) => result[0].transcript).join('');
        silenceTimerRef.current = window.setTimeout(() => recognition?.stop(), 2500);
    };
    
    recognition.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}. Please try again.`);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
    };

    recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
        const finalTranscript = transcriptRef.current.trim();
        const audioFeatures = stopAudioAnalysis(finalTranscript);
        
        // Retry logic: if transcript is empty, don't proceed.
        if (!finalTranscript && roundIndex < prompts.length) {
            handleRetry(roundIndex);
            return; // Stop execution to prevent moving to the next round
        }
        
        const currentPrompt = prompts[roundIndex];
        let sentence = '';
        let targetWord: string | undefined = undefined;
        
        if (therapyType === 'pronunciation') {
            sentence = currentPrompt.action;
            targetWord = currentPrompt.targetWord;
        } else if (therapyType === 'fluency') {
            sentence = currentPrompt.action;
            // For fluency, we can use targetPhrase for reference but don't need it in the result
        } else if (therapyType === 'dld') {
            sentence = currentPrompt.action;
            // For DLD, we can use targetConcept for reference but don't need it in the result
        } else {
            sentence = typeof currentPrompt === 'string' ? currentPrompt : currentPrompt.toString();
        }
        
        const newResult: AssessmentResult = { 
            sentence: sentence, 
            targetWord: targetWord,
            transcript: finalTranscript,
            audioFeatures
        };
        
        const updatedResults = [...results, newResult];
        setResults(updatedResults);
        
        if (recognition) {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
        }

        const nextRound = roundIndex + 1;
        if (nextRound < prompts.length) {
            setTimeout(() => startRound(nextRound), 1500);
        } else {
            onComplete(updatedResults);
        }
    };
    
    recognition.start();
  };

  const startRound = (roundIndex: number) => {
    setCurrentRound(roundIndex);
    transcriptRef.current = '';
    narratePrompt(roundIndex, () => startRecognition(roundIndex));
  };
  
  const handleStartInteraction = () => {
    if (isLoading || hasStarted || prompts.length === 0) return;
    setHasStarted(true);
    startRound(0);
  };

  const getStatusText = () => {
    if (isNarrating) return "Listen to the instructions...";
    if (!hasStarted) return "Tap 'I'm Ready' to begin!";
    if (isListening) return "I'm listening for your answer...";
    if (isLoading) return "Analyzing your voice...";
    if (hasStarted && !isListening && !isNarrating) return "Great job! Getting the next round ready...";
    return "Let's get started!";
  };

  const currentPrompt = prompts[currentRound];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--gradient-main-start] to-[--gradient-main-end] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[--card-background] rounded-3xl shadow-2xl p-6 md-p-10 text-center">
        <FoxIcon className="w-20 h-20 mx-auto text-[--primary] mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-[--foreground]">{screenConfig.title}</h1>
        <p className="text-[--text-light] mt-2 mb-8 text-lg">{screenConfig.subtitle}</p>
        
        <div className="my-8 p-6 bg-[--secondary-light] border-2 border-[--secondary] rounded-2xl min-h-[150px] flex flex-col justify-center">
          {isFetchingPrompts ? (
            <LoadingSpinner />
          ) : !currentPrompt ? null : (
              (therapyType === 'pronunciation' || therapyType === 'fluency' || therapyType === 'dld') ? (
                  <div>
                      <p className="text-lg text-[--secondary-dark] mb-2">
                          (Round {currentRound + 1} of {prompts.length})
                      </p>
                      <p className="text-xl text-center text-[--foreground] leading-relaxed mb-3">
                        {currentPrompt.scenario}
                      </p>
                       <p className="text-2xl text-center font-bold text-[--primary] leading-relaxed">
                        {currentPrompt.action}
                      </p>
                  </div>
              ) : (
                  <>
                      <p className="text-lg text-[--secondary-dark] mb-2">
                          (Round {currentRound + 1} of {prompts.length}):
                      </p>
                      <p className="text-2xl font-bold text-[--secondary-dark]">"{currentPrompt}"</p>
                  </>
              )
          )}
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[120px]">
                <LoadingSpinner />
                <p className="mt-4 text-[--text-light]">Analyzing your voice...</p>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center min-h-[120px]">
                {!hasStarted ? (
                    <button 
                        onClick={handleStartInteraction}
                        disabled={isFetchingPrompts}
                        className="p-4 rounded-2xl text-white bg-[--primary] hover:bg-[--primary-dark] shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-3 text-2xl font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label="I'm Ready, start assessment"
                    >
                        <SparkleIcon className="w-8 h-8"/>
                        <span>I'm Ready!</span>
                    </button>
                ) : (
                    <div 
                        className={`p-5 rounded-full text-white transition-all duration-300 shadow-lg transform ${isListening ? 'bg-red-500 animate-pulse scale-110' : (isNarrating ? 'bg-gray-400' : 'bg-[--success]')}`}
                    >
                        <MicrophoneIcon className="w-10 h-10" />
                    </div>
                )}
                <p className="mt-4 text-sm text-[--text-light] h-5">
                    {getStatusText()}
                </p>
            </div>
        )}

        {error && <p className="mt-4 text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
      </div>
    </div>
  );
};

export default AssessmentScreen;