import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TherapeuticResponse {
  response: string;
  confidence: number;
  emotion: string;
  source: 'superior_therapeutic' | 'fallback';
  quality_indicators: {
    empathy_score: number;
    professionalism: number;
    therapeutic_value: number;
  };
  model_info?: {
    loss: string;
    type: string;
    training_samples: string;
  };
}

export class TherapeuticService {
  private pythonScriptPath: string;
  private modelPath: string;
  private pythonExecutable: string;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../python/therapeutic_model.py');
    this.modelPath = path.join(__dirname, '../../models/fluenti_therapeutic_model');
    // Use the same Python executable as the working model
    this.pythonExecutable = 'E:/Fluenti/.venv/Scripts/python.exe';
  }

  async generateTherapeuticResponse(
    userInput: string,
    emotion: string = 'general',
    conversationHistory: string[] = []
  ): Promise<TherapeuticResponse> {
    return new Promise((resolve, reject) => {
      console.log(`🧠 Generating superior therapeutic response for emotion: ${emotion}`);
      console.log(`📁 Model path: ${this.modelPath}`);
      console.log(`🐍 Python script: ${this.pythonScriptPath}`);
      
      const pythonProcess = spawn(this.pythonExecutable, [
        this.pythonScriptPath,
        userInput,
        emotion,
        JSON.stringify(conversationHistory),
        this.modelPath
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(this.pythonScriptPath)
      });

      let responseData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.log('🔍 Python stderr:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        console.log(`🏁 Python process exited with code: ${code}`);
        
        if (code === 0) {
          try {
            const result = JSON.parse(responseData.trim());
            console.log('✅ Superior therapeutic model response generated');
            console.log(`🎯 Confidence: ${result.confidence}, Source: ${result.source}`);
            resolve(result);
          } catch (error) {
            console.error('❌ Failed to parse therapeutic response:', error);
            console.error('📄 Raw response data:', responseData);
            resolve(this.getFallbackResponse(emotion));
          }
        } else {
          console.error('❌ Therapeutic model error:', errorData);
          resolve(this.getFallbackResponse(emotion));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Python process spawn error:', error);
        resolve(this.getFallbackResponse(emotion));
      });

      // 60 second timeout for high-quality generation
      setTimeout(() => {
        console.log('⏰ Therapeutic model timeout, using fallback');
        pythonProcess.kill();
        resolve(this.getFallbackResponse(emotion));
      }, 60000);
    });
  }

  private getFallbackResponse(emotion: string): TherapeuticResponse {
    const responses = {
      anxiety: {
        response: "I can sense that you're feeling anxious right now, and I want you to know that what you're experiencing is completely valid. Anxiety can feel overwhelming, but you're not alone in this. Would you like to explore what might be contributing to these feelings, or would some grounding techniques be helpful right now?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.85, professionalism: 0.90, therapeutic_value: 0.80 }
      },
      depression: {
        response: "I hear the pain in what you're sharing, and I want you to know that your feelings are completely understandable. Depression can make everything feel heavier and more difficult. You've taken a brave step by reaching out. What feels most important for you to talk about right now?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.92, professionalism: 0.88, therapeutic_value: 0.85 }
      },
      sadness: {
        response: "I can hear the sadness in your words, and I want you to acknowledge how brave you are for sharing these feelings with me. Sadness is such a natural human emotion, even though it can feel overwhelming. You don't have to carry this alone. What's been weighing most heavily on your heart?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.90, professionalism: 0.85, therapeutic_value: 0.82 }
      },
      anger: {
        response: "I can sense the frustration and anger in what you've shared, and those feelings make complete sense given what you're experiencing. Anger often tells us that something important to us has been threatened or hurt. Your feelings are valid, and I'm here to help you work through this. What do you think might be underneath this anger?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.88, professionalism: 0.85, therapeutic_value: 0.83 }
      },
      stress: {
        response: "It sounds like you're carrying a tremendous amount right now, and feeling stressed is such a natural response to everything you're managing. When we're overwhelmed like this, it can be hard to see a clear path forward. Let's take this one step at a time together. What feels like the most pressing concern for you today?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.87, professionalism: 0.88, therapeutic_value: 0.80 }
      },
      fear: {
        response: "I can sense the fear you're experiencing, and I want you to know that feeling afraid is completely understandable given what you're going through. Fear often shows up when we're facing something uncertain or threatening. You're safe here with me. What aspects of this situation feel most frightening to you?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.88, professionalism: 0.87, therapeutic_value: 0.81 }
      },
      joy: {
        response: "I can hear the joy in what you're sharing, and it's wonderful to see you experiencing these positive feelings! Joy and happiness are such important emotions to celebrate. I'm curious about what's bringing you this sense of joy - would you like to share more about what's contributing to these good feelings?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.80, professionalism: 0.85, therapeutic_value: 0.75 }
      },
      disappointment: {
        response: "I can hear the disappointment in what you're sharing, and I want you to know that those feelings are completely valid. Disappointment can be particularly painful because it often involves our hopes and expectations not being met. You're not alone in feeling this way. What aspect of this situation has been most disappointing for you?",
        confidence: 0.75,
        quality_indicators: { empathy_score: 0.89, professionalism: 0.86, therapeutic_value: 0.82 }
      },
      neutral: {
        response: "Thank you for sharing what's on your mind with me. Whatever you're going through right now, I want you to know that your feelings and experiences are important and valid. I'm here to listen and support you through this. What would feel most helpful to explore together right now?",
        confidence: 0.70,
        quality_indicators: { empathy_score: 0.78, professionalism: 0.85, therapeutic_value: 0.75 }
      },
      general: {
        response: "I'm really glad you've reached out and shared what's on your mind. Whatever you're going through, your feelings and experiences matter deeply. I'm here to listen and support you with empathy and understanding. What would feel most helpful to talk about right now?",
        confidence: 0.70,
        quality_indicators: { empathy_score: 0.80, professionalism: 0.85, therapeutic_value: 0.75 }
      }
    };

    const response = responses[emotion as keyof typeof responses] || responses.general;
    
    return {
      ...response,
      emotion,
      source: 'fallback' as const,
      model_info: {
        loss: "fallback",
        type: "empathetic_fallback",
        training_samples: "curated"
      }
    };
  }

  // Method to validate model availability
  async validateModel(): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const modelExists = await fs.access(this.modelPath).then(() => true).catch(() => false);
      const scriptExists = await fs.access(this.pythonScriptPath).then(() => true).catch(() => false);
      
      console.log(`📁 Model path exists: ${modelExists}`);
      console.log(`🐍 Script path exists: ${scriptExists}`);
      
      return modelExists && scriptExists;
    } catch (error) {
      console.error('❌ Model validation error:', error);
      return false;
    }
  }
}

export const therapeuticService = new TherapeuticService();
