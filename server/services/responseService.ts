// Phase 4: Conversational Response Service with Llama-2-7b
// Empathetic, history-aware responses with emotional context
// Integrates with TTS for voice responses

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Type definitions for conversational context
interface ConversationHistory {
  user: string;
  ai: string;
  emotion?: string;
  timestamp?: number;
}

interface ResponseRequest {
  text: string;
  emotion: string;
  language: 'en' | 'ur';
  history?: ConversationHistory[];
  userContext?: {
    name?: string;
    age?: string;
    preferences?: string[];
  };
}

interface ResponseResult {
  response: string;
  emotion: string;
  confidence: number;
  audioBase64?: string; // TTS generated audio
  metadata?: {
    model: string;
    processingTime: number;
    historyLength: number;
  };
}

// Phase 4: Llama-2-7b Response Generation with Emotion Context
export async function generateConversationalResponse(request: ResponseRequest): Promise<ResponseResult> {
  const startTime = Date.now();
  
  try {
    console.log(`Phase 4 Llama Response: Processing request with emotion ${request.emotion}, language ${request.language}`);
    console.log(`Phase 4 Llama Response: History length: ${request.history?.length || 0}`);
    
    // Try Llama-2 first (primary method)
    const llamaResponse = await runLlamaResponse(request);
    console.log(`Phase 4 Llama Response: Success with response length: ${llamaResponse.length}`);
    
    // Generate TTS if English (Phase 4 requirement)
    let audioBase64: string | undefined;
    if (request.language === 'en') {
      try {
        audioBase64 = await generateTTS(llamaResponse, request.language);
        console.log(`Phase 4 TTS: Generated audio for response (${audioBase64.length} chars)`);
      } catch (ttsError) {
        console.warn('Phase 4 TTS: Failed to generate audio, continuing without TTS:', ttsError);
      }
    }
    
    return {
      response: llamaResponse,
      emotion: request.emotion,
      confidence: 0.9,
      audioBase64,
      metadata: {
        model: 'llama-2-7b',
        processingTime: Date.now() - startTime,
        historyLength: request.history?.length || 0
      }
    };
    
  } catch (error) {
    console.error('Phase 4 Llama Response: Failed, using fallback:', error);
    
    // Fallback to rule-based responses (existing openai.ts logic)
    const fallbackResponse = generateFallbackResponse(request);
    
    return {
      response: fallbackResponse,
      emotion: request.emotion,
      confidence: 0.7,
      metadata: {
        model: 'fallback',
        processingTime: Date.now() - startTime,
        historyLength: request.history?.length || 0
      }
    };
  }
}

// Llama-2-7b subprocess execution with optimized parameters
async function runLlamaResponse(request: ResponseRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'server', 'python', 'llama_response_generator.py');
    
    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error('Llama response generator script not found');
    }
    
    // Prepare conversation history for context
    const conversationContext = request.history?.slice(-5).map(h => ({
      user: h.user,
      ai: h.ai,
      emotion: h.emotion
    })) || [];
    
    const requestData = {
      text: request.text,
      emotion: request.emotion,
      language: request.language,
      history: conversationContext,
      userContext: request.userContext
    };
    
    console.log(`Phase 4 Llama: Spawning Python process with data:`, JSON.stringify(requestData).substring(0, 200) + '...');
    
    const pythonProcess = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim());
          if (result.response) {
            resolve(result.response);
          } else {
            reject(new Error('No response in Python output'));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse Python response: ${parseError}`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
    
    // Send request data to Python script
    pythonProcess.stdin.write(JSON.stringify(requestData) + '\n');
    pythonProcess.stdin.end();
    
    // Timeout after 2 minutes for model loading/GPU processing
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Llama response generation timed out'));
    }, 120000);
  });
}

// TTS Generation using Coqui XTTS-v2
export async function generateTTS(text: string, language: 'en' | 'ur' = 'en'): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'server', 'python', 'tts_generator.py');
    
    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error('TTS generator script not found');
    }
    
    const requestData = {
      text: text.substring(0, 500), // Limit text length for performance
      language,
      voice: language === 'en' ? 'female_voice' : 'urdu_voice'
    };
    
    console.log(`Phase 4 TTS: Generating audio for text: "${text.substring(0, 50)}..."`);
    
    const pythonProcess = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim());
          if (result.audioBase64) {
            resolve(result.audioBase64);
          } else {
            reject(new Error('No audio data in TTS output'));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse TTS response: ${parseError}`));
        }
      } else {
        reject(new Error(`TTS process failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start TTS process: ${error.message}`));
    });
    
    // Send request data to Python script
    pythonProcess.stdin.write(JSON.stringify(requestData) + '\n');
    pythonProcess.stdin.end();
    
    // Timeout after 45 seconds (TTS models can be slow on first load)
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('TTS generation timed out'));
    }, 45000);
  });
}

// Fallback response generation (rule-based)
function generateFallbackResponse(request: ResponseRequest): string {
  const { emotion, language, history } = request;
  
  // Reference previous conversation if available
  const hasHistory = history && history.length > 0;
  const lastInteraction = hasHistory ? history[history.length - 1] : null;
  
  const responses = {
    en: {
      joy: hasHistory 
        ? `I'm so glad our conversation has brought you joy! Following up on what we discussed about ${lastInteraction?.ai.split(' ').slice(0, 3).join(' ')}..., how are you feeling now?`
        : "I can feel your happiness radiating through your words! What's bringing you such joy today?",
      sadness: hasHistory
        ? `I remember you mentioned feeling down earlier. I'm here to continue supporting you through this difficult time. How are you processing those feelings now?`
        : "I can sense the sadness in your words. Remember that it's okay to feel this way, and I'm here to listen. What's weighing on your heart?",
      anger: hasHistory
        ? `I understand you're still dealing with frustration from our earlier conversation. These feelings are completely valid. Would you like to explore what's triggering this anger?`
        : "I can feel your frustration and anger. These emotions are telling us something important. What's causing you to feel this way?",
      fear: hasHistory
        ? `I notice you're still feeling anxious about what we discussed. Let's take this step by step together. What specifically is making you feel worried right now?`
        : "Feeling anxious or scared is completely natural. Let's breathe through this together. What's making you feel worried?",
      stress: hasHistory
        ? `Following up on the stress we talked about earlier - how are you managing? Remember, you don't have to carry this burden alone.`
        : "I can sense you're under a lot of pressure. Let's work through this together. What's been weighing on you?",
      neutral: hasHistory
        ? `Thank you for continuing our conversation. I appreciate you sharing your thoughts with me. What would you like to explore further?`
        : "I'm here to listen and support you in whatever way you need. What's on your mind today?"
    },
    ur: {
      joy: hasHistory
        ? `مجھے خوشی ہے کہ ہماری گفتگو آپ کو خوشی دے رہی ہے! جو ہم نے پہلے بات کی تھی، اب آپ کیسا محسوس کر رہے ہیں؟`
        : "آپ کی خوشی آپ کے الفاظ سے محسوس ہو رہی ہے! آج آپ کو کیا اتنی خوشی دے رہا ہے؟",
      sadness: hasHistory
        ? `مجھے یاد ہے آپ نے پہلے بھی اداسی کا ذکر کیا تھا۔ میں آپ کے ساتھ ہوں۔ اب آپ کیسا محسوس کر رہے ہیں؟`
        : "میں آپ کی اداسی محسوس کر سکتا ہوں۔ یہ احساسات رکھنا بالکل فطری ہے۔ آپ کو کیا پریشان کر رہا ہے؟",
      anger: hasHistory
        ? `میں سمجھ رہا ہوں کہ آپ ابھی بھی غصے میں ہیں۔ یہ احساسات درست ہیں۔ کیا آپ بتانا چاہیں گے کہ کیا آپ کو اتنا غصہ دلا رہا ہے؟`
        : "میں آپ کا غصہ محسوس کر سکتا ہوں۔ یہ احساسات اہم ہیں۔ آپ کو کیا اتنا غصہ دلا رہا ہے؟",
      fear: hasHistory
        ? `میں دیکھ رہا ہوں کہ آپ اب بھی پریشان ہیں۔ آئیے قدم بہ قدم اس سے نمٹتے ہیں۔ کیا چیز آپ کو پریشان کر رہی ہے؟`
        : "خوف اور پریشانی محسوس کرنا بالکل فطری ہے۔ آئیے مل کر اس سے نمٹتے ہیں۔ آپ کو کیا پریشان کر رہا ہے؟",
      stress: hasHistory
        ? `جو تناؤ ہم نے پہلے بحث کیا تھا، آپ اس سے کیسے نمٹ رہے ہیں؟ یاد رکھیں، آپ اکیلے نہیں ہیں۔`
        : "میں محسوس کر سکتا ہوں کہ آپ دباؤ میں ہیں۔ آئیے مل کر اس کا حل نکالتے ہیں۔ آپ کو کیا پریشان کر رہا ہے؟",
      neutral: hasHistory
        ? `ہماری گفتگو جاری رکھنے کا شکریہ۔ آپ مزید کیا بحث کرنا چاہیں گے؟`
        : "میں یہاں آپ کی بات سننے اور مدد کرنے کے لیے ہوں۔ آج آپ کے ذہن میں کیا ہے؟"
    }
  };
  
  const langResponses = responses[language] || responses.en;
  return langResponses[emotion as keyof typeof langResponses] || langResponses.neutral;
}

// Export types for use in other modules
export type { ConversationHistory, ResponseRequest, ResponseResult };
