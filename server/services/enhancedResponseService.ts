// Enhanced Response Service - Conversational Therapy AI
// Integrates Llama-2-7b, context analysis, emotion detection, and TTS
// Supports bilingual conversations with memory and therapeutic techniques

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Type definitions for enhanced conversational context
export interface ConversationHistory {
  user: string;
  ai: string;
  emotion?: string;
  timestamp?: number;
  topics?: string[];
  therapeuticContext?: any;
}

export interface EnhancedResponseRequest {
  text: string;
  emotion?: string;
  language: 'en' | 'ur';
  history?: ConversationHistory[];
  userContext?: {
    name?: string;
    age?: string;
    preferences?: string[];
    therapeuticGoals?: string[];
    previousSessions?: number;
  };
  sessionContext?: {
    sessionId?: string;
    sessionStart?: number;
    mode?: 'text' | 'voice';
    avatar?: boolean;
  };
}

export interface EnhancedResponseResult {
  response: string;
  emotion: string;
  confidence: number;
  audioBase64?: string;
  contextAnalysis?: {
    topics: string[];
    emotionalIndicators: string[];
    therapeuticNeeds: string[];
    severity: 'mild' | 'moderate' | 'severe';
  };
  therapeuticTechniques?: string[];
  conversationFlow?: {
    responseType: 'empathetic' | 'exploratory' | 'supportive' | 'educational';
    nextSteps: string[];
  };
  metadata?: {
    model: string;
    processingTime: number;
    historyLength: number;
    features: string[];
  };
}

// Enhanced conversational response generation with therapeutic focus
export async function generateEnhancedConversationalResponse(
  request: EnhancedResponseRequest
): Promise<EnhancedResponseResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🧠 Enhanced Therapy AI: Processing ${request.language} request`);
    console.log(`📚 Context: ${request.history?.length || 0} history items`);
    
    // Step 1: Enhanced emotion detection with context
    const emotionAnalysis = await detectEnhancedEmotion(request.text, request.language);
    const finalEmotion = request.emotion || emotionAnalysis.emotion;
    
    console.log(`😊 Emotion detected: ${finalEmotion} (confidence: ${emotionAnalysis.confidence})`);
    
    // Step 2: Generate therapeutic response using enhanced Llama model
    const therapeuticResponse = await generateTherapeuticResponse({
      ...request,
      emotion: finalEmotion,
      emotionAnalysis
    });
    
    console.log(`💬 Response generated: ${therapeuticResponse.response.length} characters`);
    
    // Step 3: Generate TTS for voice mode (if requested)
    let audioBase64: string | undefined;
    if (request.sessionContext?.mode === 'voice' && request.language === 'en') {
      try {
        audioBase64 = await generateEnhancedTTS(therapeuticResponse.response, request.language);
        console.log(`🔊 TTS generated: ${audioBase64.length} characters`);
      } catch (ttsError) {
        console.warn('⚠️ TTS generation failed:', ttsError);
      }
    }
    
    // Step 4: Identify therapeutic techniques used
    const therapeuticTechniques = identifyTherapeuticTechniques(
      therapeuticResponse.response, 
      finalEmotion,
      emotionAnalysis.therapeuticIndicators
    );
    
    // Step 5: Plan conversation flow
    const conversationFlow = planConversationFlow(
      request.text,
      therapeuticResponse.response,
      finalEmotion,
      request.history || []
    );
    
    return {
      response: therapeuticResponse.response,
      emotion: finalEmotion,
      confidence: emotionAnalysis.confidence,
      audioBase64,
      contextAnalysis: {
        topics: emotionAnalysis.context?.topics || [],
        emotionalIndicators: emotionAnalysis.therapeuticIndicators?.stress_indicators || [],
        therapeuticNeeds: identifyTherapeuticNeeds(emotionAnalysis),
        severity: emotionAnalysis.severity || 'mild'
      },
      therapeuticTechniques,
      conversationFlow,
      metadata: {
        model: 'enhanced-llama-2-therapy',
        processingTime: Date.now() - startTime,
        historyLength: request.history?.length || 0,
        features: [
          'context_analysis', 
          'emotion_detection', 
          'therapeutic_techniques',
          'conversational_memory',
          'bilingual_support'
        ]
      }
    };
    
  } catch (error) {
    console.error('❌ Enhanced response generation failed:', error);
    
    // Intelligent fallback with therapeutic principles
    const fallbackResponse = generateIntelligentFallback(request);
    
    return {
      response: fallbackResponse.response,
      emotion: request.emotion || 'neutral',
      confidence: 0.7,
      therapeuticTechniques: fallbackResponse.techniques,
      conversationFlow: {
        responseType: 'supportive',
        nextSteps: ['continue_conversation', 'emotional_check_in']
      },
      metadata: {
        model: 'intelligent_fallback',
        processingTime: Date.now() - startTime,
        historyLength: request.history?.length || 0,
        features: ['therapeutic_fallback']
      }
    };
  }
}

// Enhanced emotion detection with therapeutic context
async function detectEnhancedEmotion(text: string, language: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    
    // Try enhanced emotion detector first, fallback to simple test
    const scriptPaths = [
      path.join(process.cwd(), 'server', 'python', 'enhanced_emotion_detector.py'),
      path.join(process.cwd(), 'server', 'python', 'simple_emotion_test.py')
    ];
    
    let currentScriptIndex = 0;
    
    function tryNextScript() {
      if (currentScriptIndex >= scriptPaths.length) {
        // Ultimate fallback
        resolve({
          emotion: 'neutral',
          confidence: 0.5,
          method: 'ultimate_fallback',
          context: { topics: [] },
          therapeuticIndicators: {},
          severity: 'mild'
        });
        return;
      }
      
      const scriptPath = scriptPaths[currentScriptIndex];
      const scriptName = currentScriptIndex === 0 ? 'enhanced' : 'simple';
      
      if (!fs.existsSync(scriptPath)) {
        console.warn(`⚠️ ${scriptName} emotion detector not found, trying next...`);
        currentScriptIndex++;
        tryNextScript();
        return;
      }

      const requestData = { text, language };

      const pythonProcess = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        timeout: 15000 // 15 second timeout for emotion detection
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
            console.log(`✅ ${scriptName} emotion detection succeeded`);
            resolve(result);
          } catch (parseError) {
            console.error(`❌ ${scriptName} emotion detection JSON parse error:`, parseError);
            currentScriptIndex++;
            tryNextScript();
          }
        } else {
          console.error(`❌ ${scriptName} emotion detection failed with code ${code}`);
          if (stderr) console.error(`Stderr: ${stderr}`);
          currentScriptIndex++;
          tryNextScript();
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`❌ ${scriptName} emotion detection spawn error:`, error);
        currentScriptIndex++;
        tryNextScript();
      });

      pythonProcess.stdin.write(JSON.stringify(requestData));
      pythonProcess.stdin.end();
    }
    
    // Start with the first script
    tryNextScript();
  });
}

// Enhanced therapeutic response generation
async function generateTherapeuticResponse(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    
    // Try enhanced therapy generator first, fallback to lightweight version
    const scriptPaths = [
      path.join(process.cwd(), 'server', 'python', 'enhanced_therapy_generator.py'),
      path.join(process.cwd(), 'server', 'python', 'lightweight_therapy_generator.py')
    ];
    
    let currentScriptIndex = 0;
    
    function tryNextScript() {
      if (currentScriptIndex >= scriptPaths.length) {
        reject(new Error('All therapy generators failed'));
        return;
      }
      
      const scriptPath = scriptPaths[currentScriptIndex];
      const scriptName = currentScriptIndex === 0 ? 'enhanced' : 'lightweight';
      
      if (!fs.existsSync(scriptPath)) {
        console.warn(`⚠️ ${scriptName} therapy generator not found, trying next...`);
        currentScriptIndex++;
        tryNextScript();
        return;
      }

      // Prepare context for the therapy generator
      const requestPayload = {
        user_input: request.text,
        emotion: request.emotion,
        context: {
          work_stress: request.emotionAnalysis?.context?.stress_indicators?.includes('work') || false,
          sleep_issues: request.emotionAnalysis?.context?.topics?.some((t: string) => t.includes('sleep')) || false,
          relationship_concerns: request.emotionAnalysis?.context?.topics?.some((t: string) => t.includes('relationship')) || false
        },
        language: request.language,
        history: request.history?.slice(-3) || [] // Last 3 exchanges for context
      };

      console.log(`🚀 Launching ${scriptName} therapy generator...`);

      const pythonProcess = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        timeout: 30000, // 30 second timeout
        env: { 
          ...process.env, 
          PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages'),
          PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:512'
        }
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
              console.log(`✅ ${scriptName} therapy generator succeeded`);
              resolve({ 
                response: result.response,
                model: scriptName,
                techniques: result.techniques_used || []
              });
            } else {
              throw new Error('No response in therapy generator output');
            }
          } catch (parseError) {
            console.error(`❌ ${scriptName} therapy generator JSON parse error:`, parseError);
            console.log(`Raw output: ${stdout}`);
            currentScriptIndex++;
            tryNextScript();
          }
        } else {
          console.error(`❌ ${scriptName} therapy generator failed with code ${code}`);
          if (stderr) console.error(`Stderr: ${stderr}`);
          currentScriptIndex++;
          tryNextScript();
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`❌ ${scriptName} therapy generator spawn error:`, error);
        currentScriptIndex++;
        tryNextScript();
      });

      // Send input to the Python script
      pythonProcess.stdin.write(JSON.stringify(requestPayload));
      pythonProcess.stdin.end();
    }
    
    // Start with the first script
    tryNextScript();
  });
}

// Enhanced TTS with emotion-aware voice generation
export async function generateEnhancedTTS(text: string, language: 'en' | 'ur' = 'en', emotion?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'server', 'python', 'tts_generator.py');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error('TTS generator script not found');
    }
    
    const requestData = {
      text: text.substring(0, 600), // Extended limit for therapeutic responses
      language,
      emotion: emotion || 'neutral',
      voice: language === 'en' ? 'therapeutic_voice' : 'urdu_voice',
      style: 'empathetic'
    };
    
    console.log(`🎙️ Generating empathetic TTS for: "${text.substring(0, 50)}..."`);
    
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
    
    pythonProcess.stdin.write(JSON.stringify(requestData) + '\n');
    pythonProcess.stdin.end();
    
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('TTS generation timed out'));
    }, 60000);
  });
}

// Identify therapeutic techniques used in response
function identifyTherapeuticTechniques(response: string, emotion: string, indicators: any): string[] {
  const techniques = [];
  const responseLower = response.toLowerCase();
  
  // Cognitive Behavioral Therapy (CBT)
  if (responseLower.includes('think') || responseLower.includes('thought') || responseLower.includes('perspective')) {
    techniques.push('cognitive_reframing');
  }
  
  // Mindfulness and grounding
  if (responseLower.includes('breathe') || responseLower.includes('present') || responseLower.includes('mindful')) {
    techniques.push('mindfulness');
  }
  
  // Validation therapy
  if (responseLower.includes('understand') || responseLower.includes('valid') || responseLower.includes('makes sense')) {
    techniques.push('emotional_validation');
  }
  
  // Solution-focused therapy
  if (responseLower.includes('strategy') || responseLower.includes('plan') || responseLower.includes('solution')) {
    techniques.push('solution_focused');
  }
  
  // Motivational interviewing
  if (responseLower.includes('what would') || responseLower.includes('how might') || responseLower.includes('what if')) {
    techniques.push('motivational_interviewing');
  }
  
  // Psychoeducation
  if (responseLower.includes('normal') || responseLower.includes('common') || responseLower.includes('many people')) {
    techniques.push('psychoeducation');
  }
  
  return techniques;
}

// Identify therapeutic needs based on emotion analysis
function identifyTherapeuticNeeds(emotionAnalysis: any): string[] {
  const needs = [];
  
  if (emotionAnalysis.severity === 'severe') {
    needs.push('crisis_support', 'immediate_intervention');
  }
  
  if (emotionAnalysis.emotion === 'anxiety') {
    needs.push('anxiety_management', 'relaxation_techniques');
  }
  
  if (emotionAnalysis.emotion === 'sadness') {
    needs.push('grief_support', 'mood_enhancement');
  }
  
  if (emotionAnalysis.emotion === 'anger') {
    needs.push('anger_management', 'communication_skills');
  }
  
  if (emotionAnalysis.therapeuticIndicators?.stress_indicators?.length > 0) {
    needs.push('stress_management', 'coping_strategies');
  }
  
  if (emotionAnalysis.context?.relationship_context?.length > 0) {
    needs.push('relationship_support');
  }
  
  return needs;
}

// Plan conversation flow for optimal therapeutic engagement
function planConversationFlow(
  userInput: string, 
  aiResponse: string, 
  emotion: string, 
  history: ConversationHistory[]
): any {
  
  const flow = {
    responseType: 'supportive' as 'empathetic' | 'exploratory' | 'supportive' | 'educational',
    nextSteps: [] as string[]
  };
  
  // Determine response type based on emotion and context
  if (emotion === 'sadness' || emotion === 'anxiety') {
    flow.responseType = 'empathetic';
    flow.nextSteps.push('emotional_support', 'validation');
  } else if (emotion === 'neutral' || emotion === 'joy') {
    flow.responseType = 'exploratory';
    flow.nextSteps.push('explore_deeper', 'goal_setting');
  } else if (emotion === 'anger') {
    flow.responseType = 'supportive';
    flow.nextSteps.push('de_escalation', 'problem_solving');
  }
  
  // Add educational component if appropriate
  if (history.length > 3) {
    flow.nextSteps.push('psychoeducation');
  }
  
  // Always include follow-up
  flow.nextSteps.push('follow_up_question');
  
  return flow;
}

// Intelligent fallback with therapeutic principles
function generateIntelligentFallback(request: EnhancedResponseRequest): any {
  const { emotion = 'neutral', language, history } = request;
  
  const hasHistory = history && history.length > 0;
  const lastInteraction = hasHistory ? history[history.length - 1] : null;
  
  const responses = {
    en: {
      anxiety: "I can sense that you're feeling anxious or worried right now, and I want you to know that these feelings are completely valid and understandable. Anxiety often shows up when we're facing uncertainty or challenges that feel overwhelming, and it's our mind's way of trying to protect us. Let's take a moment to acknowledge what you're experiencing without judgment. I'm here to support you through this, and together we can explore what's contributing to these feelings and find some strategies that might help you feel more grounded. What would feel most helpful for you right now - would you like to talk about what's triggering this anxiety, or would you prefer to try a simple breathing exercise together?",
      
      sadness: "I can feel the weight of sadness in what you're sharing, and I want you to know that it's completely okay to sit with these difficult emotions. Sadness is often a natural response to loss, disappointment, or when something important to us has been affected, and honoring these feelings is actually a crucial part of the healing process. You don't need to rush through this or put on a brave face - your emotions deserve space and respect. I'm here to walk alongside you through this difficult time, offering support and understanding without trying to fix or change what you're experiencing. Can you tell me a bit more about what's bringing up these feelings, or would it help to just talk about how you're coping day by day?",
      
      stress: "I can really hear the stress and pressure you're under right now, and I want you to know that feeling overwhelmed is a completely normal response when we're managing too much or facing challenging circumstances. Stress affects not just our minds but our entire bodies, and it takes real strength to reach out and talk about it like you're doing now. You don't have to carry this burden alone, and there are ways we can work together to help you feel more manageable and in control. Let's start by acknowledging that you're doing the best you can in a difficult situation, and that's something to be recognized. What feels like the biggest source of pressure for you right now, or would it help to talk about what strategies you've already tried to manage these feelings?",
      
      neutral: "I'm really glad you're here and taking this time to connect and share your thoughts with me. Sometimes the most meaningful conversations start from exactly where you are right now, without needing any particular crisis or problem to address. Creating space for honest reflection and self-exploration is valuable in itself, and I appreciate you trusting me with whatever is on your mind. Whether you're looking to process recent experiences, explore feelings, or just have someone listen without judgment, I'm here to support you in whatever way feels most helpful. What's been occupying your thoughts lately, or is there something specific you'd like to explore together today?"
    },
    ur: {
      anxiety: "میں محسوس کر سکتا ہوں کہ آپ اس وقت پریشان یا فکر مند ہیں، اور میں چاہتا ہوں کہ آپ جان لیں کہ یہ احساسات بالکل درست اور قابل فہم ہیں۔ پریشانی اکثر اس وقت آتی ہے جب ہم غیر یقینی صورتحال یا مشکل چیلنجز کا سامنا کر رہے ہوتے ہیں، اور یہ ہمارے ذہن کا اپنے آپ کو محفوظ رکھنے کا طریقہ ہے۔ آئیے ایک لمحے کے لیے بغیر کسی فیصلے کے آپ کے تجربات کو تسلیم کرتے ہیں۔ میں یہاں آپ کی مدد کے لیے ہوں، اور ہم مل کر یہ جان سکتے ہیں کہ ان احساسات کی وجہ کیا ہے۔ اس وقت آپ کے لیے کیا سب سے زیادہ مددگار ہوگا - کیا آپ اس بارے میں بات کرنا چاہیں گے کہ کیا چیز آپ کو پریشان کر رہی ہے، یا آپ ایک آسان سانس کی ورزش کرنا پسند کریں گے؟",
      
      sadness: "میں آپ کے اشتراک میں اداسی کا بوجھ محسوس کر سکتا ہوں، اور میں چاہتا ہوں کہ آپ جان لیں کہ ان مشکل احساسات کے ساتھ بیٹھنا بالکل ٹھیک ہے۔ اداسی اکثر نقصان، مایوسی، یا جب ہمارے لیے کوئی اہم چیز متاثر ہوئی ہو تو ایک فطری ردعمل ہے، اور ان احساسات کا احترام کرنا شفا یابی کا اہم حصہ ہے۔ آپ کو جلدی میں کچھ محسوس کرنے یا بہادری دکھانے کی ضرورت نہیں - آپ کے جذبات کو جگہ اور احترام کی ضرورت ہے۔ میں اس مشکل وقت میں آپ کے ساتھ چلنے کے لیے یہاں ہوں۔ کیا آپ مجھے یہ بتا سکتے ہیں کہ یہ احساسات کیوں آ رہے ہیں، یا آپ روزانہ کیسے ان سے نمٹ رہے ہیں؟",
      
      stress: "میں سن سکتا ہوں کہ آپ اس وقت تناؤ اور دباؤ میں ہیں، اور میں چاہتا ہوں کہ آپ جان لیں کہ جب ہم بہت زیادہ کام یا مشکل حالات کا سامنا کر رہے ہوں تو پریشان محسوس کرنا بالکل فطری ہے۔ تناؤ نہ صرف ہمارے ذہن بلکہ پورے جسم کو متاثر کرتا ہے، اور اس کے بارے میں بات کرنا جیسا کہ آپ کر رہے ہیں، حقیقی طاقت کا مظاہرہ ہے۔ آپ کو یہ بوجھ اکیلے اٹھانے کی ضرورت نہیں، اور ایسے طریقے ہیں جن سے ہم مل کر آپ کو بہتر اور قابو میں محسوس کرا سکتے ہیں۔ اس وقت آپ کے لیے سب سے بڑا دباؤ کیا لگ رہا ہے، یا آپ ان طریقوں کے بارے میں بات کرنا چاہیں گے جو آپ نے پہلے آزمائے ہیں؟",
      
      neutral: "میں خوش ہوں کہ آپ یہاں ہیں اور اپنے خیالات شیئر کرنے کے لیے وقت نکال رہے ہیں۔ بعض اوقات سب سے اہم گفتگو بالکل وہیں سے شروع ہوتی ہے جہاں آپ اب ہیں، بغیر کسی خاص بحران یا مسئلے کے۔ ایماندار غور و فکر اور خود شناسی کے لیے جگہ بنانا خود میں قیمتی ہے، اور میں اس بات کی تعریف کرتا ہوں کہ آپ نے مجھ پر اعتماد کیا۔ چاہے آپ حالیہ تجربات پر غور کرنا چاہتے ہوں، احساسات کو سمجھنا چاہتے ہوں، یا صرف کوئی ایسا شخص چاہتے ہوں جو بغیر فیصلے کے سنے، میں یہاں ہوں۔ حال ہی میں آپ کے خیالات میں کیا چیز ہے، یا کوئی خاص بات ہے جس پر آپ آج بحث کرنا چاہیں گے؟"
    }
  };
  
  const langResponses = responses[language] || responses.en;
  const response = langResponses[emotion as keyof typeof langResponses] || langResponses.neutral;
  
  return {
    response,
    techniques: ['empathetic_listening', 'open_ended_questioning', 'emotional_validation']
  };
}

// Export legacy function for backward compatibility
export async function generateConversationalResponse(request: any): Promise<any> {
  const enhancedRequest: EnhancedResponseRequest = {
    text: request.text,
    emotion: request.emotion,
    language: request.language || 'en',
    history: request.history,
    userContext: request.userContext
  };
  
  const result = await generateEnhancedConversationalResponse(enhancedRequest);
  
  // Convert to legacy format
  return {
    response: result.response,
    emotion: result.emotion,
    confidence: result.confidence,
    audioBase64: result.audioBase64,
    metadata: result.metadata
  };
}


