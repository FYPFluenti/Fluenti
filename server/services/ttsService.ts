import { spawn } from 'child_process';
import path from 'path';

export interface TTSResult {
  audioBase64?: string;
  error?: string;
  text: string;
  language: string;
  processing_time?: number;
  model?: string;
}

/**
 * Generate Text-to-Speech audio using Python TTS generator
 */
export async function generateTTSAudio(text: string, language: 'en' | 'ur' = 'en'): Promise<TTSResult> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`[TTS] Converting text to speech: "${text}" (${text.length} chars, ${language})`);
      
      // Use virtual environment Python
      const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      const ttsScript = path.join(process.cwd(), 'server', 'python', 'tts_generator.py');
      
      // Set environment for proper Unicode support
      const env = {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), '.venv', 'Lib', 'site-packages'),
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSSTDIO: '1'
      };

      // Spawn Python process
      const python = spawn(venvPython, [ttsScript], { env });

      let output = '';
      let errorOutput = '';

      // Prepare TTS request
      const request = JSON.stringify({
        text: text.trim(),
        language: language
      });

      // Set timeout for TTS generation
      const timeout = setTimeout(() => {
        python.kill();
        reject(new Error('TTS timeout - generation took too long'));
      }, 30000); // 30 second timeout

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('[TTS Debug]:', data.toString().trim());
      });

      python.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.error('[TTS] Python process failed with code:', code);
          console.error('[TTS] Error output:', errorOutput);
          resolve({
            error: `TTS failed: ${errorOutput.substring(0, 200)}...`,
            text,
            language
          });
        } else {
          try {
            const result = JSON.parse(output.trim());
            console.log(`[TTS] Audio generated successfully (${result.processing_time}ms, model: ${result.model})`);
            resolve({
              audioBase64: result.audioBase64,
              error: result.error,
              text: result.text || text,
              language: result.language || language,
              processing_time: result.processing_time,
              model: result.model
            });
          } catch (parseError) {
            console.error('[TTS] Failed to parse response:', parseError);
            resolve({
              error: 'Failed to parse TTS response',
              text,
              language
            });
          }
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeout);
        console.error('[TTS] Process error:', err);
        resolve({
          error: `TTS process error: ${err.message}`,
          text,
          language
        });
      });

      // Send request to Python script
      python.stdin.write(request + '\n');
      python.stdin.end();

    } catch (err) {
      console.error('[TTS] Setup error:', err);
      resolve({
        error: `TTS setup error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        text,
        language
      });
    }
  });
}


