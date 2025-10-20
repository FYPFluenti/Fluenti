import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

export interface GroqTranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
  segments?: any[];
}

/**
 * Server-side Groq Whisper transcription endpoint
 * Handles audio file uploads and returns transcription results
 */
export async function transcribeAudioWithGroq(req: Request, res: Response) {
  try {
    console.log('🎤 Server: Starting Groq Whisper transcription...');

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      allowEmptyFiles: false
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.audio || !files.audio[0]) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    const audioFile = files.audio[0];
    console.log('📁 Audio file received:', {
      originalFilename: audioFile.originalFilename,
      mimetype: audioFile.mimetype,
      size: audioFile.size
    });

    // Read the audio file and create proper File object for Groq
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    
    // Convert Buffer to Uint8Array for File constructor
    const audioArray = new Uint8Array(audioBuffer);
    
    // Create a File object for Groq API (Node.js compatible)
    const file = new File([audioArray], audioFile.originalFilename || 'audio.webm', {
      type: audioFile.mimetype || 'audio/webm'
    });

    // Call Groq Whisper API
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: process.env.GROQ_SPEECH_MODEL || 'whisper-large-v3',
      temperature: 0,
      response_format: 'verbose_json',
      language: 'en'
    });

    // Handle the response with proper typing
    const transcriptionData = transcription as any; // Type assertion for verbose_json response

    // Calculate confidence from verbose response
    let confidence = 0.9; // Default confidence
    if (transcriptionData.segments && transcriptionData.segments.length > 0) {
      const avgConfidence = transcriptionData.segments.reduce((sum: number, segment: any) => {
        const segmentConfidence = Math.max(0, 1 - (segment.no_speech_prob || 0));
        return sum + segmentConfidence;
      }, 0) / transcriptionData.segments.length;
      confidence = Math.round(avgConfidence * 100) / 100;
    }

    const result: GroqTranscriptionResult = {
      text: transcriptionData.text || '',
      confidence: confidence,
      language: transcriptionData.language || 'en',
      duration: transcriptionData.duration || 0,
      segments: transcriptionData.segments || []
    };

    console.log('✅ Groq transcription successful:', {
      text: result.text,
      confidence: result.confidence,
      duration: result.duration
    });

    // Clean up temporary file
    fs.unlinkSync(audioFile.filepath);

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    console.error('❌ Server Groq transcription error:', error);
    
    res.status(500).json({
      error: 'Transcription failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Pronunciation assessment using Groq Whisper
 * Compares the target word with the transcribed speech
 */
export async function assessPronunciationWithGroq(req: Request, res: Response) {
  try {
    console.log('🎯 Server: Starting Groq pronunciation assessment...');

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      allowEmptyFiles: false
    });

    const [fields, files] = await form.parse(req);
    
    const targetWord = Array.isArray(fields.targetWord) ? fields.targetWord[0] : fields.targetWord;
    
    if (!targetWord) {
      return res.status(400).json({
        error: 'Target word is required'
      });
    }

    if (!files.audio || !files.audio[0]) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    const audioFile = files.audio[0];
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    
    // Convert Buffer to Uint8Array for File constructor
    const audioArray = new Uint8Array(audioBuffer);
    
    const file = new File([audioArray], audioFile.originalFilename || 'audio.webm', {
      type: audioFile.mimetype || 'audio/webm'
    });

    // Transcribe with Groq
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: process.env.GROQ_SPEECH_MODEL || 'whisper-large-v3',
      temperature: 0,
      response_format: 'verbose_json',
      language: 'en'
    });

    // Handle the response with proper typing
    const transcriptionData = transcription as any; // Type assertion for verbose_json response

    // Calculate confidence
    let confidence = 0.9;
    if (transcriptionData.segments && transcriptionData.segments.length > 0) {
      const avgConfidence = transcriptionData.segments.reduce((sum: number, segment: any) => {
        const segmentConfidence = Math.max(0, 1 - (segment.no_speech_prob || 0));
        return sum + segmentConfidence;
      }, 0) / transcriptionData.segments.length;
      confidence = Math.round(avgConfidence * 100) / 100;
    }

    // Analyze pronunciation accuracy
    const spokenText = (transcriptionData.text || '').toLowerCase().trim();
    const target = targetWord.toLowerCase().trim();
    
    // Simple pronunciation accuracy calculation
    let accuracy = 0;
    let isCorrect = false;
    
    if (spokenText === target) {
      accuracy = 100;
      isCorrect = true;
    } else if (spokenText.includes(target) || target.includes(spokenText)) {
      accuracy = 80;
      isCorrect = true;
    } else {
      // Calculate similarity using Levenshtein distance
      accuracy = Math.max(0, 100 - (levenshteinDistance(spokenText, target) * 20));
      isCorrect = accuracy >= 70;
    }

    // Boost accuracy for high-confidence Groq results
    if (confidence > 0.8 && accuracy > 50) {
      accuracy = Math.min(100, accuracy + 10);
    }

    const result = {
      targetWord: targetWord,
      spokenText: spokenText,
      accuracy: Math.round(accuracy),
      isCorrect: isCorrect,
      confidence: confidence,
      duration: transcriptionData.duration || 0,
      source: 'groq-whisper',
      suggestions: generateSuggestions(target, spokenText, accuracy)
    };

    console.log('✅ Groq pronunciation assessment:', result);

    // Clean up
    fs.unlinkSync(audioFile.filepath);

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    console.error('❌ Server Groq pronunciation assessment error:', error);
    
    res.status(500).json({
      error: 'Pronunciation assessment failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Generate helpful pronunciation suggestions
 */
function generateSuggestions(target: string, spoken: string, accuracy: number): string[] {
  const suggestions = [];
  
  if (accuracy < 50) {
    suggestions.push(`Try saying "${target}" more clearly`);
    suggestions.push('Speak closer to your microphone');
  } else if (accuracy < 70) {
    suggestions.push(`Almost there! Focus on the "${target}" sound`);
    suggestions.push('Try speaking a bit slower');
  } else if (accuracy < 90) {
    suggestions.push('Great job! Just fine-tune your pronunciation');
  } else {
    suggestions.push('Perfect pronunciation!');
  }
  
  return suggestions;
}