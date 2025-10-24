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
  'openai': {
    name: 'OpenAI TTS',
    quality: 'high',
    cost: 'paid',
    setup_required: true
  },
  'windows_sapi': {
    name: 'Windows SAPI',
    quality: 'basic',
    cost: 'free',
    setup_required: false
  }
};



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
    const voice = 'onyx'; // Other options: alloy, echo, fable, onyx, nova, shimmer

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