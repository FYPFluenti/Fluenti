import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Flame } from "lucide-react";

export default function ProgressStats() {
  // Example stats, replace with real data from API if available
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow p-6 mb-8">
      <CardContent className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">15</div>
          <div className="text-sm text-gray-600">Words Practiced</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary">88%</div>
          <div className="text-sm text-gray-600">Avg. Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent">12</div>
          <div className="text-sm text-gray-600">Achievements</div>
        </div>
      </CardContent>
    </Card>
  );
}
