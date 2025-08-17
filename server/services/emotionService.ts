// Phase 3: Emotion Detection Service
// Text-based emotion detection using Hugging Face GoEmotions models
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function detectEmotionFromText(text: string, language: 'en' | 'ur' = 'en'): Promise<{ emotion: string; score: number }> {
  try {
    if (!text || text.trim().length === 0) {
      return { emotion: 'neutral', score: 0.5 };
    }

    let model = 'SamLowe/roberta-base-go_emotions';  // Primary for 27 emotions (Phase 3 specification)
    
    // Phase 3: Bilingual handling - use GoEmotions for English, multilingual for Urdu
    if (language === 'ur') {
      // Fallback for Urdu: Use multilingual sentiment model if GoEmotions struggles
      model = 'distilbert-multilingual-nli-stsb-quora-ranking';  // Or custom Urdu-fine-tuned if available
      console.log('Using multilingual model for Urdu text');
    } else {
      // For English, use GoEmotions model as specified in Phase 3
      model = 'SamLowe/roberta-base-go_emotions';
      console.log('Using GoEmotions model for English text');
    }

    console.log(`Phase 3 Text Emotion: Processing "${text.substring(0, 50)}..." with model: ${model}`);

    const result = await hf.textClassification({
      model: model,
      inputs: text,
    });

    // Handle multi-label results: Pick top emotion
    if (!result || result.length === 0) {
      throw new Error('No emotion classification results');
    }

    const topEmotion = Array.isArray(result) ? result[0] : result;
    
    // Map sentiment labels to emotion labels for multilingual model
    let emotionLabel = topEmotion.label;
    if (model.includes('sentiment')) {
      // Map sentiment to emotions
      const sentimentToEmotion: { [key: string]: string } = {
        'LABEL_0': 'negative',  // Often sadness/stress
        'LABEL_1': 'neutral',
        'LABEL_2': 'positive',   // Often joy/contentment
        'positive': 'joy',
        'negative': 'sadness',
        'neutral': 'neutral'
      };
      emotionLabel = sentimentToEmotion[topEmotion.label.toLowerCase()] || topEmotion.label;
    } else if (model.includes('emotion')) {
      // For emotion models, use label directly but standardize common ones
      const emotionMapping: { [key: string]: string } = {
        'anger': 'anger',
        'fear': 'fear', 
        'joy': 'joy',
        'love': 'joy',
        'sadness': 'sadness',
        'surprise': 'surprise',
        'optimism': 'joy',
        'pessimism': 'sadness'
      };
      emotionLabel = emotionMapping[topEmotion.label.toLowerCase()] || topEmotion.label;
    }

    const result_emotion = {
      emotion: emotionLabel,
      score: topEmotion.score || 0.5
    };

    console.log(`Phase 3 Text Emotion Result: ${result_emotion.emotion} (${result_emotion.score})`);
    return result_emotion;

  } catch (error) {
    console.error('Text Emotion Detection Error:', error);
    
    // Phase 3: Fallback with keyword-based detection
    console.log('Falling back to keyword-based emotion detection');
    return performKeywordBasedEmotionDetection(text, language);
  }
}

// Phase 3: Keyword-based fallback for when API fails
function performKeywordBasedEmotionDetection(text: string, language: 'en' | 'ur'): { emotion: string; score: number } {
  const lowercaseText = text.toLowerCase();
  
  // English emotion keywords
  const englishKeywords = {
    stress: ['stressed', 'stress', 'anxious', 'anxiety', 'worried', 'tension', 'pressure', 'overwhelmed', 'overwhelm'],
    sadness: ['sad', 'depressed', 'down', 'unhappy', 'blue', 'miserable', 'crying', 'cry', 'tears', 'weeping', 'upset', 'heartbroken', 'devastated', 'grief'],
    anger: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'rage', 'pissed', 'frustrated', 'livid'],
    fear: ['scared', 'afraid', 'terrified', 'frightened', 'nervous', 'panic', 'fearful', 'worried'],
    joy: ['happy', 'joyful', 'excited', 'cheerful', 'glad', 'delighted', 'ecstatic', 'thrilled', 'elated'],
    disgust: ['disgusted', 'revolted', 'sick', 'nauseated', 'repulsed', 'appalled'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered']
  };

  // Urdu emotion keywords (romanized and native script)
  const urduKeywords = {
    stress: ['تناؤ', 'پریشان', 'فکر', 'tension', 'pareshaan', 'fikar', 'پریشانی', 'تشویش'],
    sadness: ['غم', 'اداس', 'دکھ', 'gham', 'udaas', 'dukh', 'رونا', 'آنسو', 'rona', 'aansu', 'غمگین', 'دل ٹوٹا'],
    anger: ['غصہ', 'غضب', 'ناراض', 'gussa', 'ghazab', 'naaraaz', 'غصیل', 'برہمی'],
    fear: ['ڈر', 'خوف', 'dar', 'khauf', 'گھبراہٹ', 'گھبرانا'],
    joy: ['خوش', 'خوشی', 'khush', 'khushi', 'مسرور', 'شادان', 'خوشحال'],
    disgust: ['نفرت', 'nafrat', 'گھن', 'بیزاری'],
    surprise: ['حیرت', 'hairat', 'surprised', 'تعجب', 'حیران']
  };

  const keywords = language === 'ur' ? urduKeywords : englishKeywords;
  
  // Check for keyword matches
  for (const [emotion, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lowercaseText.includes(word)) {
        console.log(`Keyword match: "${word}" -> ${emotion}`);
        return { emotion, score: 0.7 }; // Medium confidence for keyword match
      }
    }
  }
  
  // No matches found
  console.log('No emotion keywords found, returning neutral');
  return { emotion: 'neutral', score: 0.5 };
}

// Phase 3: Voice tone-based emotion detection (SER)
export async function detectEmotionFromAudio(audioBuffer: Buffer, language: 'en' | 'ur' = 'en'): Promise<{ emotion: string; score: number }> {
  try {
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Empty audio buffer provided');
    }

    // Phase 3: Model selection based on language and capabilities
    let model = 'FunAudioLLM/SenseVoiceSmall';  // Multilingual SER (default)
    
    if (language === 'en') {
      // English-specific model for potentially better accuracy
      model = 'superb/hubert-large-superb-er';  
      console.log('Using HuBERT model for English voice emotion detection');
    } else {
      console.log('Using SenseVoice model for multilingual voice emotion detection');
    }

    // Phase 3: Preprocess audio - ensure proper format for SER models
    console.log(`Phase 3 Voice Emotion: Processing ${audioBuffer.length} bytes with model: ${model}`);

    // Convert Buffer to Uint8Array for Blob compatibility (from Phase 2 fix)
    const uint8Array = new Uint8Array(audioBuffer);
    const audioBlob = new Blob([uint8Array], { 
      type: 'audio/wav'  // SER models typically expect WAV format
    });

    console.log(`Sending ${audioBlob.size} bytes as ${audioBlob.type} to SER model`);

    const result = await hf.audioClassification({
      model: model,
      data: audioBlob,
    });

    // Pick top emotion from results
    if (!result || result.length === 0) {
      throw new Error('No audio emotion classification results');
    }

    const topEmotion = Array.isArray(result) ? result[0] : result;
    
    const result_emotion = {
      emotion: topEmotion.label || 'neutral',
      score: topEmotion.score || 0.5
    };

    console.log(`Phase 3 Voice Emotion Result: ${result_emotion.emotion} (${result_emotion.score})`);
    return result_emotion;

  } catch (error) {
    console.error('Voice Emotion Detection Error:', error);
    
    // Phase 3: Fallback to neutral when voice processing fails
    console.log('Voice emotion detection failed, returning neutral');
    return { emotion: 'neutral', score: 0.3 };
  }
}

// Phase 3: Combine text and voice emotion results with weighted scoring
export function combineEmotions(
  textResult: { emotion: string; score: number }, 
  voiceResult: { emotion: string; score: number }
): { emotion: string; score: number } {
  
  console.log(`Combining emotions - Text: ${textResult.emotion} (${textResult.score}), Voice: ${voiceResult.emotion} (${voiceResult.score})`);

  // Phase 3: If both emotions match, return with averaged confidence
  if (textResult.emotion === voiceResult.emotion) {
    const averageScore = (textResult.score + voiceResult.score) / 2;
    console.log(`Emotions match: ${textResult.emotion} with combined score: ${averageScore}`);
    return { emotion: textResult.emotion, score: averageScore };
  }

  // Phase 3: Weighted combination - 60% voice (tone more direct), 40% text
  const voiceWeight = 0.6;
  const textWeight = 0.4;
  
  const finalScore = (voiceResult.score * voiceWeight) + (textResult.score * textWeight);
  
  // Choose emotion from the higher-confidence source
  const finalEmotion = voiceResult.score > textResult.score ? voiceResult.emotion : textResult.emotion;
  
  console.log(`Combined result: ${finalEmotion} (score: ${finalScore}) - Voice weighted at ${voiceWeight}`);
  
  return { 
    emotion: finalEmotion, 
    score: Math.round(finalScore * 100) / 100  // Round to 2 decimal places
  };
}
