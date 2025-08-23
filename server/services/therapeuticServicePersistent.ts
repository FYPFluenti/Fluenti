// Persistent Superior Therapeutic Model Service
// Uses persistent Python therapeutic server for high performance
// Superior model stays loaded in memory, eliminating startup overhead and memory issues

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface TherapeuticResponse {
  response: string;
  confidence: number;
  emotion: string;
  source: string;
  quality_indicators: {
    empathy_score: number;
    professionalism: number;
    therapeutic_value: number;
  };
  model_info?: {
    loss: string;
    type: string;
    training_samples: string;
    cached?: boolean;
  };
  error?: string;
}

class PersistentTherapeuticServer {
  private static instance: PersistentTherapeuticServer;
  private process: ChildProcessWithoutNullStreams | null = null;
  private isReady = false;
  private requestQueue: Array<{
    request: any;
    resolve: (result: TherapeuticResponse) => void;
    reject: (error: Error) => void;
  }> = [];

  private constructor() {
    this.startServer();
  }

  static getInstance(): PersistentTherapeuticServer {
    if (!PersistentTherapeuticServer.instance) {
      PersistentTherapeuticServer.instance = new PersistentTherapeuticServer();
    }
    return PersistentTherapeuticServer.instance;
  }

  private startServer() {
    try {
      const pythonPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      const scriptPath = path.join(process.cwd(), 'server', 'python', 'therapeutic_server_lightweight.py');

      if (!fs.existsSync(scriptPath)) {
        console.error('❌ Persistent therapeutic server script not found');
        return;
      }

      console.log('🚀 Starting lightweight therapeutic model server...');

      this.process = spawn(pythonPath, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages') }
      });

      this.process.stderr.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        console.log(`[Therapeutic Server] ${message}`);
        
        if (message.includes('ready for requests')) {
          this.isReady = true;
          console.log('✅ Persistent therapeutic server is ready');
          this.processQueue();
        }
      });

      this.process.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.handleResponse(line.trim());
          }
        }
      });

      this.process.on('close', (code) => {
        console.log(`❌ Therapeutic server process exited with code ${code}`);
        this.isReady = false;
        this.process = null;
        
        // Reject any pending requests
        while (this.requestQueue.length > 0) {
          const { reject } = this.requestQueue.shift()!;
          reject(new Error('Therapeutic server process terminated'));
        }
      });

      this.process.on('error', (error) => {
        console.error('❌ Therapeutic server process error:', error);
        this.isReady = false;
      });

    } catch (error) {
      console.error('❌ Failed to start therapeutic server:', error);
    }
  }

  private handleResponse(jsonLine: string) {
    try {
      const result = JSON.parse(jsonLine);
      
      if (this.requestQueue.length > 0) {
        const { resolve } = this.requestQueue.shift()!;
        resolve(result);
        
        // Process next request in queue if any
        if (this.requestQueue.length > 0) {
          try {
            const nextRequest = this.requestQueue[0].request;
            const jsonRequest = JSON.stringify(nextRequest) + '\n';
            this.process?.stdin.write(jsonRequest);
          } catch (error) {
            console.error('❌ Failed to send next request in queue:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse therapeutic server response:', error);
      
      if (this.requestQueue.length > 0) {
        const { reject } = this.requestQueue.shift()!;
        reject(new Error('Invalid response from therapeutic server'));
      }
    }
  }

  private processQueue() {
    // Process any queued requests now that server is ready
    // (No action needed here as sendRequest handles queuing)
  }

  async sendRequest(request: any): Promise<TherapeuticResponse> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Therapeutic server not running'));
        return;
      }

      // Add timestamp and unique ID for better tracking
      const requestId = Date.now() + Math.random();
      const requestWithId = { ...request, requestId };
      
      // Add to queue
      this.requestQueue.push({ request: requestWithId, resolve, reject });

      if (this.isReady && this.requestQueue.length === 1) {
        // Send request immediately if no other requests in queue
        try {
          const jsonRequest = JSON.stringify(requestWithId) + '\n';
          this.process.stdin.write(jsonRequest);
        } catch (error) {
          // Remove from queue if sending failed
          const index = this.requestQueue.findIndex(item => item.resolve === resolve);
          if (index >= 0) {
            this.requestQueue.splice(index, 1);
          }
          reject(error);
        }
      }
      
      // Set timeout for request (reduced to 10 seconds for lightweight server)
      setTimeout(() => {
        const index = this.requestQueue.findIndex(item => item.resolve === resolve);
        if (index >= 0) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Therapeutic model request timeout'));
        }
      }, 10000); // 10 second timeout for lightweight server
    });
  }

  shutdown() {
    if (this.process) {
      console.log('🛑 Shutting down therapeutic server...');
      this.process.kill('SIGTERM');
      this.process = null;
      this.isReady = false;
    }
  }

  isServerReady(): boolean {
    return this.isReady;
  }
}

// Initialize the persistent server
const therapeuticServer = PersistentTherapeuticServer.getInstance();

// Cleanup on process exit
process.on('exit', () => therapeuticServer.shutdown());
process.on('SIGINT', () => therapeuticServer.shutdown());
process.on('SIGTERM', () => therapeuticServer.shutdown());

// Main service function for generating therapeutic responses
export async function generateSuperiorTherapeuticResponse(
  userInput: string,
  emotion: string = 'general',
  history: string[] = []
): Promise<TherapeuticResponse> {
  try {
    console.log(`🧠 Generating superior therapeutic response for emotion: ${emotion}`);
    
    const request = {
      user_input: userInput,
      emotion: emotion,
      history: history
    };

    const response = await therapeuticServer.sendRequest(request);
    
    console.log(`✅ Superior therapeutic response generated`);
    console.log(`🎯 Confidence: ${response.confidence}, Source: ${response.source}`);
    
    return response;
    
  } catch (error: any) {
    console.error('❌ Therapeutic model error:', error.message);
    
    // High-quality fallback response
    const fallbackResponse = getHighQualityFallback(emotion, userInput);
    
    return {
      response: fallbackResponse,
      confidence: 0.7,
      emotion: emotion,
      source: 'fallback_service',
      quality_indicators: {
        empathy_score: 0.8,
        professionalism: 0.85,
        therapeutic_value: 0.75
      },
      error: error.message
    };
  }
}

function getHighQualityFallback(emotion: string, userInput: string): string {
  const fallbacks: Record<string, string> = {
    anxiety: "I can sense the anxiety in what you've shared, and I want you to know that these feelings are completely understandable. Anxiety often shows up when we care deeply about something or when we're facing uncertainty. You're being incredibly brave by reaching out and talking about this. What aspect of this anxiety feels most overwhelming to you right now?",
    
    nervousness: "I can sense the nervousness in what you've shared, and I want you to know that these feelings are completely understandable. Nervousness often shows up when we care deeply about something or when we're facing uncertainty. You're being incredibly brave by reaching out and talking about this. What aspect of this nervousness feels most overwhelming to you right now?",
    
    depression: "Thank you for trusting me with what you've shared. I can hear how much you're struggling right now, and I want you to know that your pain is real and valid. Depression can make everything feel so much heavier. You've shown tremendous courage by reaching out today. What feels most important for you to talk about in this moment?",
    
    sadness: "I can hear the sadness in your words, and I want to acknowledge how brave you are for sharing these feelings with me. Sadness is such a natural human emotion, even though it can feel overwhelming. You don't have to carry this alone. What's been weighing most heavily on your heart?",
    
    stress: "It sounds like you're carrying a tremendous amount right now, and feeling stressed is such a natural response to everything you're managing. When we're overwhelmed like this, it can be hard to see a clear path forward. Let's take this one step at a time together. What feels like the most pressing concern for you today?",
    
    anger: "I can sense the frustration and anger in what you've shared, and those feelings make complete sense given what you're experiencing. Anger often tells us that something important to us has been threatened or hurt. Your feelings are valid, and I'm here to help you work through this. What do you think might be underneath this anger?",
    
    fear: "I can sense the fear you're experiencing, and I want you to know that feeling afraid is completely understandable given what you're going through. Fear often shows up when we're facing something uncertain or threatening. You're safe here with me. What aspects of this situation feel most frightening to you?",
    
    joy: "I can hear the joy in what you're sharing, and it's wonderful to see you experiencing these positive feelings! Joy and happiness are such important emotions to celebrate. I'm curious about what's bringing you this sense of joy - would you like to share more about what's contributing to these good feelings?",
    
    admiration: "I can sense the positive feelings you're experiencing, and it's wonderful to hear about what's bringing you fulfillment. These positive emotions are just as important to explore as challenging ones. I'm curious about what's creating these good feelings for you - would you like to share more about what's contributing to this sense of admiration or appreciation?",
    
    general: "Thank you for sharing what's on your mind with me. Whatever you're going through right now, I want you to know that your feelings and experiences are important and valid. I'm here to listen and support you through this. What would feel most helpful to explore together right now?"
  };
  
  return fallbacks[emotion] || fallbacks.general;
}

// Export server status check
export function isTherapeuticServerReady(): boolean {
  return therapeuticServer.isServerReady();
}

// Export for manual server management
export { therapeuticServer };
