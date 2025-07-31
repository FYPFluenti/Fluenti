import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  Crown, 
  Medal,
  Zap,
  Award,
  Calendar,
  Mic,
  Volume2,
  BookOpen,
  LucideIcon
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: 'pronunciation' | 'streak' | 'practice' | 'social' | 'milestone';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: number;
  progress?: number;
  unlocked: boolean;
  unlockedAt?: Date;
  points: number;
}

interface AchievementsProps {
  userAchievements: Achievement[];
  totalPoints: number;
  currentLevel: number;
  nextLevelPoints: number;
}

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  pronunciation: Mic,
  streak: Flame,
  practice: BookOpen,
  social: Volume2,
  milestone: Trophy
};

const DIFFICULTY_COLORS = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500'
};

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_word',
    title: 'First Steps',
    description: 'Complete your first word pronunciation',
    icon: Star,
    category: 'milestone',
    difficulty: 'bronze',
    requirement: 1,
    progress: 1,
    unlocked: true,
    unlockedAt: new Date(),
    points: 10
  },
  {
    id: 'perfect_score',
    title: 'Perfect Pronunciation',
    description: 'Achieve 100% accuracy on 5 words',
    icon: Target,
    category: 'pronunciation',
    difficulty: 'gold',
    requirement: 5,
    progress: 3,
    unlocked: false,
    points: 50
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Practice for 7 days in a row',
    icon: Flame,
    category: 'streak',
    difficulty: 'silver',
    requirement: 7,
    progress: 4,
    unlocked: false,
    points: 30
  },
  {
    id: 'hundred_words',
    title: 'Vocabulary Master',
    description: 'Practice 100 different words',
    icon: BookOpen,
    category: 'practice',
    difficulty: 'gold',
    requirement: 100,
    progress: 23,
    unlocked: false,
    points: 75
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete 10 exercises in under 30 seconds each',
    icon: Zap,
    category: 'practice',
    difficulty: 'silver',
    requirement: 10,
    progress: 6,
    unlocked: false,
    points: 40
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Share your progress 5 times',
    icon: Volume2,
    category: 'social',
    difficulty: 'bronze',
    requirement: 5,
    progress: 1,
    unlocked: false,
    points: 20
  },
  {
    id: 'champion',
    title: 'Champion',
    description: 'Reach level 10',
    icon: Crown,
    category: 'milestone',
    difficulty: 'platinum',
    requirement: 10,
    progress: 3,
    unlocked: false,
    points: 100
  }
];

export function Achievements({ 
  userAchievements = SAMPLE_ACHIEVEMENTS, 
  totalPoints = 85,
  currentLevel = 3,
  nextLevelPoints = 120
}: AchievementsProps) {
  const unlockedAchievements = userAchievements.filter(a => a.unlocked);
  const inProgressAchievements = userAchievements.filter(a => !a.unlocked && (a.progress || 0) > 0);
  const lockedAchievements = userAchievements.filter(a => !a.unlocked && (a.progress || 0) === 0);

  const levelProgress = (totalPoints % 100);
  const pointsToNext = nextLevelPoints - totalPoints;

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span>Level Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{currentLevel}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Level {currentLevel}</h3>
                <p className="text-sm text-gray-600">{totalPoints} total points</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Next Level</p>
              <p className="font-semibold">{pointsToNext} points to go</p>
            </div>
          </div>
          <Progress value={levelProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
            <div className="text-sm text-gray-600">Unlocked</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{inProgressAchievements.length}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <Medal className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{userAchievements.length}</div>
            <div className="text-sm text-gray-600">Total Available</div>
          </CardContent>
        </Card>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-500" />
              <span>Unlocked Achievements</span>
              <Badge variant="secondary">{unlockedAchievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className="p-4 border border-green-200 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${DIFFICULTY_COLORS[achievement.difficulty]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            +{achievement.points} pts
                          </Badge>
                          {achievement.unlockedAt && (
                            <span className="text-xs text-gray-500">
                              {achievement.unlockedAt.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>In Progress</span>
              <Badge variant="secondary">{inProgressAchievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressAchievements.map((achievement) => {
                const IconComponent = achievement.icon;
                const progress = ((achievement.progress || 0) / achievement.requirement) * 100;
                
                return (
                  <div
                    key={achievement.id}
                    className="p-4 border border-blue-200 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className={`w-10 h-10 ${DIFFICULTY_COLORS[achievement.difficulty]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        +{achievement.points} pts
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {achievement.progress} / {achievement.requirement}
                        </span>
                        <span className="font-medium">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Medal className="w-5 h-5 text-gray-400" />
              <span>Locked Achievements</span>
              <Badge variant="outline">{lockedAchievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedAchievements.map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className="p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-60"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-700">{achievement.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                        <Badge variant="outline" className="text-xs">
                          +{achievement.points} pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}