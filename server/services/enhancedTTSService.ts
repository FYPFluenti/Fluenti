import { spawn } from 'child_process';
import path from 'path';
import fetch from 'node-fetch';

export interface EnhancedTTSResult {
  audioBase64?: string;
  error?: string;
  text: string;
  language: string;
  processing_time?: number;
  model: string;
  quality: 'basic' | 'high' | 'premium';
}

export interface TTSProvider {
  name: string;
  quality: 'basic' | 'high' | 'premium';
  cost: 'free' | 'paid';
  setup_required: boolean;
}

export const TTS_PROVIDERS: Record<string, TTSProvider> = {
  'windows_sapi': {
    name: 'Windows SAPI',
    quality: 'basic',
    cost: 'free',
    setup_required: false
  },
  'elevenlabs': {
    name: 'ElevenLabs AI',
    quality: 'premium',
    cost: 'paid',
    setup_required: true
  },
  'openai': {
    name: 'OpenAI TTS',
    quality: 'high',
    cost: 'paid',
    setup_required: true
  },
  'azure': {
    name: 'Azure Speech',
    quality: 'high',
    cost: 'paid',
    setup_required: true
  },
  'edge_tts': {
    name: 'Edge TTS (Free)',
    quality: 'high',
    cost: 'free',
    setup_required: false
  }
};

/**
 * ElevenLabs TTS - Premium Human-like Voices
 */
export async function generateElevenLabsTTS(text: string, language: 'en' | 'ur' = 'en'): Promise<EnhancedTTSResult> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found in environment variables');
    }

    // Select voice based on language
    const voiceId = language === 'ur' ? 
      '21m00Tcm4TlvDq8ikWAM' : // Rachel (English)
      'AZnzlk1XvdvUeBnXmlld'; // Domi (English, warm voice)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return {
      audioBase64,
      text,
      language,
      processing_time: Date.now() - startTime,
      model: 'elevenlabs_v1',
      quality: 'premium'
    };

  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return {
      error: `ElevenLabs TTS failed: ${error instanceof Error ? error.message : String(error)}`,
      text,
      language,
      processing_time: Date.now() - startTime,
      model: 'elevenlabs_v1',
      quality: 'premium'
    };
  }
}

/**
 * OpenAI TTS - High Quality Neural Voices
 */
export async function generateOpenAITTS(text: string, language: 'en' | 'ur' = 'en'): Promise<EnhancedTTSResult> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    // Select voice - OpenAI has great natural voices
    const voice = 'nova'; // Other options: alloy, echo, fable, onyx, nova, shimmer

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.trim(),
        voice: voice,
        response_format: 'wav'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return {
      audioBase64,
      text,
      language,
      processing_time: Date.now() - startTime,
      model: 'openai_tts_1',
      quality: 'high'
    };

  } catch (error) {
    console.error('OpenAI TTS error:', error);
    return {
      error: `OpenAI TTS failed: ${error instanceof Error ? error.message : String(error)}`,
      text,
      language,
      processing_time: Date.now() - startTime,
      model: 'openai_tts_1',
      quality: 'high'
    };
  }
}

/**
 * Edge TTS - Free High-Quality Neural Voices
 */
export async function generateEdgeTTS(text: string, language: 'en' | 'ur' = 'en'): Promise<EnhancedTTSResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    try {
      console.log(`[Edge TTS] Converting text to speech: "${text.substring(0, 50)}..." (${text.length} chars, ${language})`);
      
      // Use virtual environment Python
      const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      const edgeTTSScript = path.join(process.cwd(), 'server', 'python', 'edge_tts_generator.py');
      
      // Set environment
      const env = {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages'),
        PYTHONIOENCODING: 'utf-8'
      };

      const python = spawn(venvPython, [edgeTTSScript], { env });

      let output = '';
      let errorOutput = '';

      // Prepare request with voice selection
      const voice = language === 'ur' ? 
        'ur-PK-AsadNeural' : 
        'en-US-AriaNeural'; // Natural, expressive voice

      const request = JSON.stringify({
        text: text.trim(),
        language: language,
        voice: voice,
        rate: '+0%',
        pitch: '+0Hz'
      });

      // Set timeout
      const timeout = setTimeout(() => {
        python.kill();
        resolve({
          error: 'Edge TTS timeout',
          text,
          language,
          processing_time: Date.now() - startTime,
          model: 'edge_tts',
          quality: 'high'
        });
      }, 20000);

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0 && output.trim()) {
          try {
            const result = JSON.parse(output.trim());
            resolve({
              ...result,
              processing_time: Date.now() - startTime,
              model: 'edge_tts',
              quality: 'high'
            });
          } catch (parseError) {
            resolve({
              error: `Edge TTS parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
              text,
              language,
              processing_time: Date.now() - startTime,
              model: 'edge_tts',
              quality: 'high'
            });
          }
        } else {
          resolve({
            error: `Edge TTS failed: ${errorOutput || 'Unknown error'}`,
            text,
            language,
            processing_time: Date.now() - startTime,
            model: 'edge_tts',
            quality: 'high'
          });
        }
      });

      // Send request
      python.stdin.write(request + '\n');
      python.stdin.end();

    } catch (error) {
      resolve({
        error: `Edge TTS error: ${error instanceof Error ? error.message : String(error)}`,
        text,
        language,
        processing_time: Date.now() - startTime,
        model: 'edge_tts',
        quality: 'high'
      });
    }
  });
}

/**
 * Fallback to current Windows SAPI TTS
 */
export async function generateWindowsSAPITTS(text: string, language: 'en' | 'ur' = 'en'): Promise<EnhancedTTSResult> {
  const { generateTTSAudio } = await import('./ttsService');
  const result = await generateTTSAudio(text, language);
  
  return {
    audioBase64: result.audioBase64,
    error: result.error,
    text: result.text,
    language: result.language,
    processing_time: result.processing_time,
    model: result.model || 'windows_sapi',
    quality: 'basic'
  };
}

/**
 * Smart TTS with fallback chain
 */
export async function generateSmartTTS(text: string, language: 'en' | 'ur' = 'en', preferredProvider?: string): Promise<EnhancedTTSResult> {
  const providers = [
    { name: 'edge_tts', fn: generateEdgeTTS },
    { name: 'elevenlabs', fn: generateElevenLabsTTS },
    { name: 'openai', fn: generateOpenAITTS },
    { name: 'windows_sapi', fn: generateWindowsSAPITTS }
  ];

  // If user specified a preferred provider, try it first
  if (preferredProvider) {
    const preferredFn = providers.find(p => p.name === preferredProvider)?.fn;
    if (preferredFn) {
      console.log(`[Smart TTS] Trying preferred provider: ${preferredProvider}`);
      const result = await preferredFn(text, language);
      if (result.audioBase64 && !result.error) {
        return result;
      }
      console.log(`[Smart TTS] Preferred provider ${preferredProvider} failed, trying fallbacks`);
    }
  }

  // Try providers in order of quality
  for (const provider of providers) {
    try {
      console.log(`[Smart TTS] Trying provider: ${provider.name}`);
      const result = await provider.fn(text, language);
      
      if (result.audioBase64 && !result.error) {
        console.log(`[Smart TTS] Success with ${provider.name} (${result.quality} quality)`);
        return result;
      }
      console.log(`[Smart TTS] Provider ${provider.name} failed: ${result.error}`);
    } catch (error) {
      console.log(`[Smart TTS] Provider ${provider.name} error: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
  }

  // If all providers failed
  return {
    error: 'All TTS providers failed',
    text,
    language,
    processing_time: 0,
    model: 'none',
    quality: 'basic'
  };
}