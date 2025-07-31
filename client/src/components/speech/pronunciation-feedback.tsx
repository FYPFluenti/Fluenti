import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Target } from 'lucide-react';

interface PronunciationFeedbackProps {
  accuracy: number;
  feedback: string;
  improvements?: string[];
  isCompleted?: boolean;
}

export function PronunciationFeedback({
  accuracy,
  feedback,
  improvements = [],
  isCompleted = false
}: PronunciationFeedbackProps) {
  
  const getAccuracyColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBg = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="text-green-600" />;
    if (score >= 70) return <Target className="text-yellow-600" />;
    return <AlertCircle className="text-red-600" />;
  };

  const getStatusMessage = (score: number) => {
    if (score >= 85) return 'Excellent!';
    if (score >= 70) return 'Good effort!';
    return 'Keep practicing!';
  };

  return (
    <Card className="fluenti-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon(accuracy)}
          <span>Pronunciation Feedback</span>
          {isCompleted && (
            <Badge className="bg-green-100 text-green-700">
              Completed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Accuracy Score */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Pronunciation Score</span>
            <span className={`font-bold text-xl ${getAccuracyColor(accuracy)}`}>
              {Math.round(accuracy)}%
            </span>
          </div>
          <div className="fluenti-pronunciation-bar">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getAccuracyBg(accuracy)}`}
              style={{ width: `${Math.min(100, Math.max(0, accuracy))}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
            <span>0%</span>
            <span className="font-medium">{getStatusMessage(accuracy)}</span>
            <span>100%</span>
          </div>
        </div>

        {/* Feedback Message */}
        <div className={`rounded-lg p-4 ${
          accuracy >= 85 
            ? 'bg-green-50 border-green-200' 
            : accuracy >= 70 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-red-50 border-red-200'
        } border`}>
          <p className="text-gray-700">{feedback}</p>
        </div>

        {/* Improvements */}
        {improvements.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">
              {accuracy >= 85 ? 'Keep it up!' : 'Tips for improvement:'}
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              {improvements.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Phonetic Tips */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Pronunciation Tips:</h4>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>• Speak slowly and clearly</li>
            <li>• Focus on each syllable</li>
            <li>• Practice in a quiet environment</li>
            <li>• Hold the microphone close to your mouth</li>
          </ul>
        </div>

        {/* Achievement Badge */}
        {accuracy >= 90 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Perfect Pronunciation Achievement!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
