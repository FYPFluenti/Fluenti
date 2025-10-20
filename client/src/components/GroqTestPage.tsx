import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { groqSpeechService } from '@/services/groqSpeechService';
import { useToast } from '@/hooks/use-toast';

export default function GroqTestPage() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testWord] = useState('hello');

  const testGroqTranscription = async () => {
    if (isRecording || isProcessing) return;

    try {
      setIsRecording(true);
      setIsProcessing(false);
      setResult(null);

      toast({
        title: "🎤 Recording Started",
        description: `Say the word "${testWord}" clearly`,
      });

      // Record and transcribe using Groq
      const transcriptionResult = await groqSpeechService.recordAndTranscribe(5000);
      
      setIsRecording(false);
      setIsProcessing(true);

      // Analyze the result
      const spokenText = transcriptionResult.text.toLowerCase().trim();
      const isCorrect = spokenText.includes(testWord.toLowerCase());
      
      const testResult = {
        targetWord: testWord,
        transcription: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
        duration: transcriptionResult.duration,
        isCorrect: isCorrect,
        timestamp: new Date().toLocaleTimeString()
      };

      setResult(testResult);
      setIsProcessing(false);

      toast({
        title: isCorrect ? "✅ Perfect!" : "🔄 Try Again",
        description: `Heard: "${transcriptionResult.text}"`,
        variant: isCorrect ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Groq test error:', error);
      setIsRecording(false);
      setIsProcessing(false);
      
      toast({
        title: "❌ Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast({
      title: "⏹️ Recording Stopped",
      description: "Processing your speech...",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🎤
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Groq Whisper Test
          </h1>
          <p className="text-gray-600">
            Test the new Groq speech recognition
          </p>
        </div>

        {/* Test Word Display */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Say this word:</p>
            <p className="text-3xl font-bold text-blue-600">{testWord}</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Powered by Groq Whisper-Large-v3</span>
          </div>
        </div>

        {/* Recording Button */}
        <div className="text-center mb-6">
          <motion.button
            onClick={isRecording ? stopRecording : testGroqTranscription}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all transform hover:scale-105 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg' 
                : isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-xl'
            } disabled:transform-none`}
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isRecording ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <MicOff className="w-8 h-8" />
              </motion.div>
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </motion.button>
          
          <p className="text-sm text-gray-600 mt-2">
            {isProcessing ? 'Processing...' : isRecording ? 'Recording... (tap to stop)' : 'Tap to start recording'}
          </p>
        </div>

        {/* Results Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Result:</span>
              {result.isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Target:</span> "{result.targetWord}"
              </div>
              <div>
                <span className="font-medium">Heard:</span> "{result.transcription}"
              </div>
              <div>
                <span className="font-medium">Confidence:</span> {(result.confidence * 100).toFixed(1)}%
              </div>
              <div>
                <span className="font-medium">Duration:</span> {result.duration?.toFixed(1)}s
              </div>
              <div>
                <span className="font-medium">Time:</span> {result.timestamp}
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This test verifies that Groq Whisper integration is working correctly.
            The AI will transcribe your speech and check if you said the target word.
          </p>
        </div>
      </motion.div>
    </div>
  );
}