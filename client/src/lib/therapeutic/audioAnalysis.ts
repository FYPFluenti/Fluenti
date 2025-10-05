/**
 * Audio Analysis Utilities
 * Functions for analyzing audio input and providing feedback
 */

export interface AudioMetrics {
  volume: number;
  pitch: number;
  clarity: number;
  duration: number;
}

/**
 * Analyze audio volume
 */
export const analyzeVolume = (audioData: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  const rms = Math.sqrt(sum / audioData.length);
  return Math.round(rms * 100);
};

/**
 * Detect pitch (fundamental frequency)
 */
export const detectPitch = (audioData: Float32Array, sampleRate: number): number => {
  // Simplified pitch detection using autocorrelation
  const correlations = [];
  const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
  const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min

  for (let period = minPeriod; period < maxPeriod; period++) {
    let sum = 0;
    for (let i = 0; i < audioData.length - period; i++) {
      sum += audioData[i] * audioData[i + period];
    }
    correlations.push(sum);
  }

  const maxCorrelation = Math.max(...correlations);
  const period = correlations.indexOf(maxCorrelation) + minPeriod;
  const frequency = sampleRate / period;

  return Math.round(frequency);
};

/**
 * Calculate audio clarity score
 */
export const calculateClarity = (audioData: Float32Array): number => {
  // Measure signal-to-noise ratio
  const signal = analyzeVolume(audioData);
  const noise = estimateNoise(audioData);
  
  if (noise === 0) return 100;
  
  const snr = signal / noise;
  const clarity = Math.min(100, snr * 10);
  
  return Math.round(clarity);
};

/**
 * Estimate background noise level
 */
const estimateNoise = (audioData: Float32Array): number => {
  // Take the quietest 10% of samples as noise estimate
  const sorted = Array.from(audioData).map(Math.abs).sort((a, b) => a - b);
  const noiseIndex = Math.floor(sorted.length * 0.1);
  return sorted[noiseIndex] || 0.01;
};

/**
 * Create audio context for analysis
 */
export const createAudioContext = (): AudioContext => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
};

/**
 * Get audio metrics from MediaStream
 */
export const getAudioMetrics = async (
  stream: MediaStream,
  duration: number = 1000
): Promise<AudioMetrics> => {
  const audioContext = createAudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  
  analyser.fftSize = 2048;
  source.connect(analyser);
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      analyser.getFloatTimeDomainData(dataArray);
      
      const metrics: AudioMetrics = {
        volume: analyzeVolume(dataArray),
        pitch: detectPitch(dataArray, audioContext.sampleRate),
        clarity: calculateClarity(dataArray),
        duration: duration
      };
      
      audioContext.close();
      resolve(metrics);
    }, duration);
  });
};
