import { promises as fs } from 'fs';
import path from 'path';
import wav from 'wav';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface AudioConversionOptions {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}

export class AudioProcessor {
  /**
   * Convert audio buffer to WAV format
   */
  static async convertToWav(
    inputBuffer: Buffer, 
    outputPath: string,
    options: AudioConversionOptions = {}
  ): Promise<string> {
    const {
      sampleRate = 16000, // 16kHz is good for speech recognition
      channels = 1, // Mono
      bitDepth = 16
    } = options;

    return new Promise((resolve, reject) => {
      const tempInputPath = path.join(process.cwd(), 'temp', `input_${Date.now()}.webm`);
      
      // Ensure temp directory exists
      fs.mkdir(path.dirname(tempInputPath), { recursive: true })
        .then(() => fs.writeFile(tempInputPath, inputBuffer))
        .then(() => {
          ffmpeg(tempInputPath)
            .audioChannels(channels)
            .audioFrequency(sampleRate)
            .audioBitrate('64k')
            .format('wav')
            .on('end', async () => {
              // Clean up temp file
              try {
                await fs.unlink(tempInputPath);
                resolve(outputPath);
              } catch (cleanupError) {
                console.warn('Failed to clean up temp file:', cleanupError);
                resolve(outputPath);
              }
            })
            .on('error', (err) => {
              console.error('FFmpeg conversion error:', err);
              reject(err);
            })
            .save(outputPath);
        })
        .catch(reject);
    });
  }

  /**
   * Get audio file information
   */
  static async getAudioInfo(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  /**
   * Convert WebM to WAV (common browser recording format)
   */
  static async webmToWav(
    webmBuffer: Buffer,
    outputPath?: string
  ): Promise<string> {
    const output = outputPath || path.join(
      process.cwd(), 
      'temp', 
      `converted_${Date.now()}.wav`
    );

    await this.convertToWav(webmBuffer, output, {
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16
    });

    return output;
  }

  /**
   * Read WAV file and return raw PCM data
   */
  static async readWavFile(filePath: string): Promise<{
    data: Buffer;
    sampleRate: number;
    channels: number;
    bitDepth: number;
  }> {
    const fileBuffer = await fs.readFile(filePath);
    
    return new Promise((resolve, reject) => {
      const reader = new wav.Reader();
      let audioData = Buffer.alloc(0);
      let format: any = null;

      reader.on('format', (fmt) => {
        format = fmt;
      });

      reader.on('data', (chunk) => {
        audioData = Buffer.concat([audioData, chunk]);
      });

      reader.on('end', () => {
        if (format) {
          resolve({
            data: audioData,
            sampleRate: format.sampleRate,
            channels: format.channels,
            bitDepth: format.bitDepth
          });
        } else {
          reject(new Error('Failed to read WAV format'));
        }
      });

      reader.on('error', reject);
      reader.end(fileBuffer);
    });
  }

  /**
   * Create a WAV file from PCM data
   */
  static async createWavFile(
    pcmData: Buffer,
    outputPath: string,
    options: Required<AudioConversionOptions>
  ): Promise<void> {
    const writer = new wav.FileWriter(outputPath, {
      channels: options.channels,
      sampleRate: options.sampleRate,
      bitDepth: options.bitDepth
    });

    return new Promise((resolve, reject) => {
      writer.on('error', reject);
      writer.on('done', () => resolve());
      writer.end(pcmData);
    });
  }

  /**
   * Ensure temp directory exists
   */
  static async ensureTempDir(): Promise<void> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
  }

  /**
   * Clean up temporary files older than 1 hour
   */
  static async cleanupTempFiles(): Promise<void> {
    const tempDir = path.join(process.cwd(), 'temp');
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }
}

// Auto-cleanup on startup
AudioProcessor.ensureTempDir()
  .then(() => AudioProcessor.cleanupTempFiles())
  .catch(console.error);
