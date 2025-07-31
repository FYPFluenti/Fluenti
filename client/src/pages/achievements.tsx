import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award } from "lucide-react";

export default function Achievements() {
  // Example achievements, replace with real data from API if available
  const achievements = [
    { icon: <Trophy className="text-yellow-500 w-6 h-6" />, title: "First Session", description: "Completed your first speech therapy session." },
    { icon: <Star className="text-blue-500 w-6 h-6" />, title: "Accuracy Master", description: "Achieved 90%+ accuracy in a session." },
    { icon: <Award className="text-green-500 w-6 h-6" />, title: "Streak Champion", description: "Practiced for 7 days in a row." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="text-yellow-500 w-8 h-8" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {achievements.map((ach, idx) => (
                <div key={idx} className="flex items-center space-x-4 bg-white rounded-lg shadow p-4">
                  {ach.icon}
                  <div>
                    <div className="font-bold text-lg text-gray-800">{ach.title}</div>
                    <div className="text-gray-600">{ach.description}</div>
                  </div>
                  <Badge className="ml-auto bg-accent text-white">Unlocked</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
