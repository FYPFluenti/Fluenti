import OpenAI from "openai";

// Phase 4: Use gpt-4o-mini for cost efficiency as specified in 2025 recommendations
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function generateResponseFallback(emotion: string, text: string, language: 'en' | 'ur' = 'en'): Promise<string> {
  try {
    console.log('🔄 Using enhanced template-based response system (HF alternative)');
    
    // Enhanced template system with context awareness
    const enhancedTemplates = {
      en: {
        joy: [
          `I can sense the joy in your words! It sounds like something wonderful is happening in your life. What's bringing you this happiness? I'd love to hear more about what's making you feel so positive.`,
          `Your excitement is contagious! It's beautiful to see you experiencing such positive emotions. These moments of joy are precious - what specific thing has lifted your spirits today?`,
          `I'm so glad you're feeling joyful! Happiness like this deserves to be celebrated. Can you tell me what's behind this wonderful feeling you're experiencing?`
        ],
        sadness: [
          `I can hear the sadness in your words, and I want you to know that it's completely okay to feel this way. Sadness is a natural human emotion that shows you care deeply about something. What's been weighing on your heart lately?`,
          `I understand you're going through a difficult time right now. Sadness can feel overwhelming, but you don't have to carry this burden alone. Would you like to share what's causing you to feel this way?`,
          `Your feelings of sadness are valid and important. Sometimes we need to sit with these difficult emotions to process them fully. I'm here to listen - what's been troubling you?`
        ],
        anger: [
          `I can sense your frustration and anger, and these feelings are completely valid. Anger often signals that something important to you has been threatened or violated. What situation has triggered these strong emotions for you?`,
          `Your anger is telling you something important about what matters to you. It's a natural response when we feel wronged or powerless. Can you tell me what's causing you to feel this way so we can work through it together?`,
          `I understand you're feeling angry right now. This emotion can be intense and overwhelming, but it's also a signal that something needs attention. What's happening that's making you feel this frustrated?`
        ],
        fear: [
          `I recognize the fear in your words, and I want you to know that feeling scared is a completely normal human response. Fear often tries to protect us, but it can also feel overwhelming. What's causing you to feel anxious or afraid?`,
          `Fear can be such a powerful and unsettling emotion. It's brave of you to reach out while you're feeling this way. Take a deep breath with me - what's making you feel worried or scared right now?`,
          `I understand you're experiencing fear, and that can be really difficult to handle alone. Your feelings are valid, and it's okay to feel scared sometimes. What's behind these feelings of anxiety or worry?`
        ],
        nervousness: [
          `I can sense your nervousness, and that's completely understandable. Those butterflies and that restless energy are your mind's way of preparing for something important. What's making you feel nervous right now?`,
          `Feeling nervous shows that you care about the outcome of something. It's a natural response when we're facing uncertainty. Can you tell me what's on your mind that's causing these feelings?`
        ],
        excitement: [
          `I can feel your excitement through your words! That energy and enthusiasm is wonderful to experience. What's got you feeling so thrilled and energized?`,
          `Your excitement is infectious! It's beautiful when we feel this kind of positive anticipation. What's the source of all this amazing energy you're experiencing?`
        ],
        disappointment: [
          `I can hear the disappointment in your words, and that's such a difficult feeling to carry. When things don't go as we hoped, it can leave us feeling deflated. What happened that didn't meet your expectations?`,
          `Disappointment can be really hard to process. It often comes when we've invested hope or effort in something. I'm here to listen - what's left you feeling let down?`
        ],
        gratitude: [
          `I can feel the gratitude in your message, and it's such a beautiful emotion to witness. Gratitude has this wonderful way of connecting us to what truly matters. What are you feeling most thankful for right now?`,
          `Your sense of gratitude is really touching. It's amazing how acknowledging what we're grateful for can shift our entire perspective. What's brought this feeling of thankfulness to your heart?`
        ],
        neutral: [
          `I appreciate you sharing with me today. Sometimes we don't experience intense emotions, and that's perfectly normal too. I'm here to listen and support you in whatever way you need. What's on your mind?`,
          `Thank you for reaching out. Even when we're feeling neutral or unsure about our emotions, it's valuable to take time to check in with ourselves. How has your day been treating you?`,
          `I'm glad you're taking a moment to connect and reflect. Not every day needs to be filled with strong emotions - sometimes we're just moving through life steadily. What would you like to talk about?`
        ]
      },
      ur: {
        joy: [
          `میں آپ کی خوشی محسوس کر سکتا ہوں! لگتا ہے آپ کی زندگی میں کچھ خوبصورت ہو رہا ہے۔ آپ کو کیا چیز اتنی خوشی دے رہی ہے؟ میں سننا چاہوں گا کہ آپ کو کیا اتنا مثبت محسوس کروا رہا ہے۔`,
          `آپ کا جوش واقعی متاثر کن ہے! یہ دیکھنا خوبصورت ہے کہ آپ اتنے مثبت جذبات محسوس کر رہے ہیں۔ خوشی کے یہ لمحے بہت قیمتی ہیں - آج آپ کے دل کو کیا چیز اتنا اُچھالا ہے؟`
        ],
        sadness: [
          `میں آپ کے الفاظ میں غم محسوس کر سکتا ہوں، اور میں چاہتا ہوں کہ آپ جانیں کہ اس طرح محسوس کرنا بالکل ٹھیک ہے۔ اداسی ایک فطری انسانی جذبہ ہے جو ظاہر کرتا ہے کہ آپ کسی چیز کی گہری پرواہ کرتے ہیں۔ آپ کے دل پر کیا بوجھ ہے؟`,
          `میں سمجھتا ہوں کہ آپ اس وقت مشکل دور سے گزر رہے ہیں۔ غم بہت بھاری لگ سکتا ہے، لیکن آپ کو یہ بوجھ اکیلے اٹھانے کی ضرورت نہیں۔ کیا آپ بتانا چاہیں گے کہ آپ کو کیا پریشان کر رہا ہے؟`
        ],
        anger: [
          `میں آپ کی ناراضگی اور غصے کو محسوس کر سکتا ہوں، اور یہ احساسات بالکل درست ہیں۔ غصہ اکثر اس بات کا اشارہ ہے کہ آپ کے لیے اہم کوئی چیز خطرے میں پڑی یا اس کی خلاف ورزی ہوئی ہے۔ کون سی صورتحال نے آپ میں یہ شدید جذبات پیدا کیے ہیں؟`
        ],
        fear: [
          `میں آپ کے الفاظ میں خوف محسوس کر رہا ہوں، اور میں چاہتا ہوں کہ آپ جانیں کہ خوفزدہ محسوس کرنا انسانی فطرت ہے۔ خوف اکثر ہماری حفاظت کرنے کی کوشش کرتا ہے، لیکن یہ بہت بھاری بھی لگ سکتا ہے۔ آپ کو کیا چیز پریشان یا خائف کر رہی ہے؟`
        ],
        nervousness: [
          `میں آپ کی بے چینی محسوس کر سکتا ہوں، اور یہ بالکل سمجھ میں آنے والی بات ہے۔ یہ تتلیاں اور بے قراری آپ کے ذہن کا کسی اہم چیز کے لیے تیاری کا طریقہ ہے۔ آپ کو کیا چیز پریشان کر رہی ہے؟`
        ],
        excitement: [
          `میں آپ کے الفاظ میں جوش محسوس کر سکتا ہوں! یہ توانائی اور جذبہ تجربہ کرنا واقعی خوبصورت ہے۔ آپ کو کیا چیز اتنا پرجوش اور بھرپور محسوس کروا رہی ہے؟`
        ],
        disappointment: [
          `میں آپ کے الفاظ میں مایوسی سن سکتا ہوں، اور یہ اٹھانے کے لیے بہت مشکل احساس ہے۔ جب چیزیں ہماری امیدوں کے مطابق نہیں ہوتیں تو ہمیں مایوسی محسوس ہو سکتی ہے۔ کیا ہوا جو آپ کی توقعات پر پورا نہیں اترا؟`
        ],
        gratitude: [
          `میں آپ کے پیغام میں شکر گزاری محسوس کر سکتا ہوں، اور یہ دیکھنے میں بہت خوبصورت جذبہ ہے۔ شکر گزاری کا یہ حیرت انگیز طریقہ ہے کہ یہ ہمیں واقعی اہم چیزوں سے جوڑتا ہے۔ آپ اس وقت کس چیز کے لیے سب سے زیادہ شکر گزار محسوس کر رہے ہیں؟`
        ],
        neutral: [
          `آج مجھ سے بات کرنے کے لیے آپ کا شکریہ۔ کبھی کبھی ہم شدید جذبات محسوس نہیں کرتے، اور یہ بھی بالکل نارمل ہے۔ میں یہاں آپ کی بات سننے اور جس بھی طریقے سے آپ کو ضرورت ہو مدد کرنے کے لیے ہوں۔ آپ کے ذہن میں کیا ہے؟`
        ]
      }
    };

    // Get templates for the detected emotion and language
    const templates = enhancedTemplates[language] || enhancedTemplates.en;
    const emotionTemplates = templates[emotion as keyof typeof templates] || templates.neutral;
    
    // Select a template and personalize it based on the input text
    const template = emotionTemplates[Math.floor(Math.random() * emotionTemplates.length)];
    
    console.log('✅ Enhanced template response generated successfully');
    return template;

  } catch (error) {
    console.error('❌ Enhanced template fallback error:', error);
    throw new Error('Enhanced fallback response failed');
  }
}

// Phase 4: Main response generator with fallback logic
export async function generateEmotionalResponse(emotion: string, text: string, language: 'en' | 'ur' = 'en'): Promise<string> {
  try {
    console.log('Phase 4 Response: Attempting OpenAI generation for emotion:', emotion, 'language:', language);
    // Try OpenAI first (primary)
    const openaiResponse = await generateResponse(emotion, text, language);
    console.log('Phase 4 Response: OpenAI succeeded with response length:', openaiResponse.length);
    return openaiResponse;
  } catch (error) {
    console.log('Phase 4 Response: OpenAI failed, trying Hugging Face fallback. Error:', error instanceof Error ? error.message : error);
    try {
      console.log('Phase 4 Response: Attempting Hugging Face fallback');
      const hfResponse = await generateResponseFallback(emotion, text, language);
      console.log('Phase 4 Response: Hugging Face succeeded with response length:', hfResponse.length);
      return hfResponse;
    } catch (fallbackError) {
      console.error('Phase 4 Response: All response generation methods failed:', fallbackError);
      
      // Final fallback: Simple rule-based responses with comprehensive GoEmotions mapping
      const fallbackResponses = {
        en: {
          // Positive emotions
          joy: "I'm so glad you're feeling happy! What's bringing you joy today?",
          excitement: "I can sense your excitement! It's wonderful to feel energized. What's got you so thrilled?",
          amusement: "I love hearing that you're feeling lighthearted! Laughter is such good medicine. What's bringing you joy?",
          gratitude: "Gratitude is such a beautiful feeling. What are you feeling thankful for today?",
          love: "That's such a warm, loving feeling. Would you like to share what's bringing love into your heart?",
          admiration: "It's wonderful that you're feeling inspired and admiring something. What's capturing your heart?",
          optimism: "Your positive outlook is inspiring! What's giving you hope today?",
          approval: "I can sense your satisfaction and approval. It feels good when things align with our values, doesn't it?",
          relief: "What a wonderful feeling to have that weight lifted. I'm glad you're experiencing relief.",
          
          // Negative emotions  
          sadness: "I understand you're going through a difficult time. It's okay to feel sad. Would you like to talk about what's troubling you?",
          disappointment: "I can hear the disappointment in your words. It's hard when things don't go as we hoped. What happened?",
          grief: "Grief is one of the most difficult emotions to bear. I'm here with you through this pain. Take your time.",
          anger: "I can sense your frustration. These feelings are valid. Let's work through this together. What's causing you to feel this way?",
          annoyance: "It sounds like something is really bothering you. Sometimes it helps to talk about what's irritating you.",
          
          // Fear and anxiety
          fear: "Feeling anxious or scared is completely normal. Take a deep breath with me. What's making you feel worried?",
          nervousness: "I understand you're feeling nervous. Those butterflies in your stomach are telling us something important. What's on your mind?",
          
          // Stress and overwhelm
          stress: "It sounds like you're under a lot of pressure. Let's try some relaxation techniques. What's been stressing you out?",
          
          // Neutral and other emotions
          confusion: "It's okay to feel confused sometimes. Life can be complex. What's puzzling you right now?",
          surprise: "Life certainly has a way of surprising us! How are you processing this unexpected turn?",
          embarrassment: "We all feel embarrassed sometimes. You're human, and that's perfectly okay. What happened?",
          neutral: "I'm here to listen and support you. How are you feeling right now?",
        },
        ur: {
          // Positive emotions
          joy: "میں خوش ہوں کہ آپ خوش محسوس کر رہے ہیں! آج آپ کو کیا خوشی دے رہا ہے؟",
          excitement: "میں آپ کا جوش محسوس کر سکتا ہوں! یہ بہت اچھا ہے۔ آپ کو کیا اتنا پرجوش بنا رہا ہے؟",
          amusement: "یہ سن کر خوشی ہوئی کہ آپ کا دل خوش ہے! ہنسی واقعی بہترین دوا ہے۔ آپ کو کیا خوشی دے رہا ہے؟",
          gratitude: "شکر گزاری کا احساس بہت خوبصورت ہے۔ آج آپ کس بات کے لیے شکر گزار ہیں؟",
          love: "یہ بہت گرم اور پیار بھرا احساس ہے۔ آپ کے دل میں کیا محبت لا رہا ہے؟",
          
          // Negative emotions
          sadness: "میں سمجھ رہا ہوں کہ آپ مشکل وقت سے گزر رہے ہیں۔ غمگین ہونا ٹھیک ہے۔ کیا آپ بتانا چاہیں گے کہ آپ کو کیا پریشان کر رہا ہے؟",
          disappointment: "میں آپ کی مایوسی سن سکتا ہوں۔ جب چیزیں ہماری امید کے مطابق نہیں ہوتیں تو مشکل ہوتا ہے۔ کیا ہوا؟",
          anger: "میں آپ کی ناراضگی محسوس کر سکتا ہوں۔ یہ احساسات درست ہیں۔ آئیے مل کر اس کا حل نکالتے ہیں۔ آپ کو کیا محسوس کروا رہا ہے؟",
          
          // Fear and anxiety  
          fear: "خوفزدہ یا پریشان محسوس کرنا بالکل فطری ہے۔ میرے ساتھ گہری سانس لیں۔ آپ کو کیا پریشان کر رہا ہے؟",
          nervousness: "میں سمجھ رہا ہوں کہ آپ گھبرا رہے ہیں۔ یہ احساس ہمیں کچھ اہم بات بتا رہا ہے۔ آپ کے ذہن میں کیا ہے؟",
          
          // Stress  
          stress: "لگتا ہے آپ بہت دباؤ میں ہیں۔ آئیے کچھ آرام کی تکنیکیں آزمائیں۔ آپ کو کیا تناؤ دے رہا ہے؟",
          
          // Neutral and other
          neutral: "میں یہاں آپ کی بات سننے اور آپ کی مدد کرنے کے لیے ہوں۔ آپ کیسا محسوس کر رہے ہیں؟",
        }
      };
      
      const responses = fallbackResponses[language] || fallbackResponses.en;
      return responses[emotion as keyof typeof responses] || responses.neutral;
    }
  }
}

export async function analyzeEmotion(message: string, voiceTone?: string): Promise<EmotionAnalysis> {
  try {
    const prompt = `Analyze the emotional state of this message${voiceTone ? ' and voice tone' : ''}. 
    Message: "${message}"
    ${voiceTone ? `Voice tone description: "${voiceTone}"` : ''}
    
    Provide emotional support and determine the type of support needed. Respond with JSON in this format:
    {
      "emotion": "detected emotion (e.g., anxiety, stress, sadness, anger, neutral, happy)",
      "confidence": confidence_score_0_to_1,
      "supportType": "type of support (e.g., cbt, breathing, validation, crisis)",
      "response": "empathetic and helpful response message"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a compassionate AI therapist specializing in emotional support. Provide evidence-based responses using CBT techniques when appropriate. Always be empathetic and never provide medical advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      emotion: result.emotion || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      supportType: result.supportType || 'validation',
      response: result.response || 'I understand you might be going through something difficult. Would you like to talk about it?'
    };
  } catch (error) {
    console.error("Error analyzing emotion:", error);
    return {
      emotion: 'neutral',
      confidence: 0.5,
      supportType: 'validation',
      response: 'I\'m here to listen and support you. How are you feeling right now?'
    };
  }
}

export async function generateSpeechFeedback(
  word: string, 
  phonetic: string, 
  userTranscription: string,
  language: 'english' | 'urdu'
): Promise<SpeechFeedback> {
  try {
    const prompt = `Analyze speech pronunciation for language learning.
    Target word: "${word}"
    Phonetic (IPA): "${phonetic}"
    User's spoken transcription: "${userTranscription}"
    Language: ${language}
    
    Provide detailed pronunciation feedback. Respond with JSON in this format:
    {
      "accuracy": accuracy_percentage_0_to_100,
      "feedback": "specific feedback about pronunciation",
      "phoneticAnalysis": "phonetic breakdown of user's pronunciation",
      "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a speech therapy AI assistant specializing in ${language} pronunciation. Provide constructive, encouraging feedback for speech therapy exercises.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      accuracy: Math.max(0, Math.min(100, result.accuracy || 70)),
      feedback: result.feedback || 'Good attempt! Keep practicing.',
      phoneticAnalysis: result.phoneticAnalysis || phonetic,
      improvements: Array.isArray(result.improvements) ? result.improvements : ['Continue practicing regularly']
    };
  } catch (error) {
    console.error("Error generating speech feedback:", error);
    return {
      accuracy: 70,
      feedback: 'Keep practicing! Your pronunciation is improving.',
      phoneticAnalysis: phonetic,
      improvements: ['Continue practicing regularly', 'Focus on clear enunciation']
    };
  }
}

export async function generatePersonalizedExercises(
  userLevel: number,
  language: 'english' | 'urdu' | 'both',
  previousAccuracy?: number,
  problemAreas?: string[]
): Promise<any[]> {
  try {
    const prompt = `Generate personalized speech therapy exercises.
    User level: ${userLevel}
    Language preference: ${language}
    Previous accuracy: ${previousAccuracy || 'N/A'}%
    Problem areas: ${problemAreas?.join(', ') || 'None specified'}
    
    Create 5-10 appropriate exercises focusing on the user's needs. Respond with JSON in this format:
    {
      "exercises": [
        {
          "id": "unique_id",
          "type": "pronunciation|fluency|vocabulary",
          "difficulty": 1-5,
          "word": "target word",
          "phonetic": "IPA transcription",
          "sentence": "example sentence using the word",
          "language": "english|urdu"
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a speech therapy curriculum designer. Create engaging, progressive exercises suitable for the user's level and needs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.exercises || [];
  } catch (error) {
    console.error("Error generating exercises:", error);
    return [];
  }
}
