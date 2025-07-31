import { Card, CardContent } from '@/components/ui/card';

interface ChartDataPoint {
  day: string;
  accuracy: number;
  sessions: number;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  const maxAccuracy = Math.max(...data.map(d => d.accuracy));
  const minAccuracy = Math.min(...data.map(d => d.accuracy));
  const accuracyRange = maxAccuracy - minAccuracy;

  const getBarHeight = (accuracy: number) => {
    if (accuracyRange === 0) return 50; // Default height if all values are the same
    return ((accuracy - minAccuracy) / accuracyRange) * 80 + 20; // 20-100% of container
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 80) return 'bg-blue-500';
    if (accuracy >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-64 flex items-end justify-between space-x-2 bg-gray-50 rounded-lg p-4">
        {data.map((point, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            {/* Bar */}
            <div className="relative w-full max-w-12 mb-2">
              <div 
                className={`w-full rounded-t-lg ${getAccuracyColor(point.accuracy)} transition-all duration-500 hover:opacity-80`}
                style={{ height: `${getBarHeight(point.accuracy)}px` }}
                title={`${point.accuracy}% accuracy, ${point.sessions} sessions`}
              >
              </div>
              
              {/* Accuracy Label */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                {point.accuracy}%
              </div>
            </div>
            
            {/* Day Label */}
            <div className="text-sm font-medium text-gray-600">
              {point.day}
            </div>
            
            {/* Sessions Count */}
            <div className="text-xs text-gray-500 mt-1">
              {point.sessions} session{point.sessions !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-600">Excellent (90%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-600">Good (80-89%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-gray-600">Fair (70-79%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-gray-600">Needs Work (&lt;70%)</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-lg font-bold text-primary">
              {Math.round(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length)}%
            </div>
            <div className="text-sm text-gray-600">Weekly Average</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-lg font-bold text-secondary">
              {data.reduce((sum, d) => sum + d.sessions, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-lg font-bold text-accent">
              {Math.max(...data.map(d => d.accuracy))}%
            </div>
            <div className="text-sm text-gray-600">Best Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Weekly Insights</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {(() => {
            const avgAccuracy = data.reduce((sum, d) => sum + d.accuracy, 0) / data.length;
            const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0);
            const bestDay = data.reduce((best, current) => 
              current.accuracy > best.accuracy ? current : best
            );
            
            return (
              <>
                <p>• Your weekly average accuracy is {Math.round(avgAccuracy)}%</p>
                <p>• You completed {totalSessions} practice sessions this week</p>
                <p>• Your best performance was on {bestDay.day} with {bestDay.accuracy}% accuracy</p>
                {avgAccuracy >= 85 && <p>• Excellent work! You're maintaining high accuracy consistently</p>}
                {avgAccuracy < 75 && <p>• Consider focusing on slower, clearer pronunciation</p>}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
