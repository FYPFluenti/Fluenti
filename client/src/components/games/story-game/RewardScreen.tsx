import React from 'react';
import { GameState, EndingType, MAX_FOCUS_STARS } from '@/types/games/story-game';
import { TrophyIcon, SparkleIcon, FoxIcon, StarIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface RewardScreenProps {
  gameState: GameState;
  onRestart: () => void;
}

const getEndingConfig = (endingType: EndingType) => {
    const configMap: Record<EndingType, {
        badgeBg: string;
        badgeIconColor: string;
        scoreColor: string;
        iconColor: string;
    }> = {
        happy: {
            badgeBg: 'bg-orange-50',
            badgeIconColor: 'text-[#ff6b1d]',
            scoreColor: 'text-[#ff6b1d]',
            iconColor: 'text-[#F5B82E]'
        },
        neutral: {
            badgeBg: 'bg-purple-50',
            badgeIconColor: 'text-purple-600',
            scoreColor: 'text-purple-600',
            iconColor: 'text-[#ff6b1d]'
        },
        sad: {
            badgeBg: 'bg-blue-50',
            badgeIconColor: 'text-blue-600',
            scoreColor: 'text-blue-600',
            iconColor: 'text-gray-600'
        },
    };
    return configMap[endingType];
}

const RewardScreen: React.FC<RewardScreenProps> = ({ gameState, onRestart }) => {
  const { endingType, rewardContent, isLoading, therapyType, levels, latestBadgeEarned, focusStars } = gameState;
  const config = getEndingConfig(endingType || 'neutral');
  
  const therapyName = {
    pronunciation: 'Pronunciation',
    fluency: 'Fluency',
    dld: 'Language',
    social: 'Social',
    none: 'Speech',
  }[therapyType];
  
  const currentLevel = therapyType !== 'none' ? levels[therapyType] : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white border border-orange-200 rounded-xl shadow-lg p-8">
        {endingType === 'happy' ? 
            <TrophyIcon className={`w-24 h-24 mx-auto ${config.iconColor} mb-4`} /> :
            <FoxIcon className={`w-24 h-24 mx-auto ${config.iconColor} mb-4`} />
        }
        
        {isLoading || !rewardContent ? (
          <div className="min-h-[150px] flex flex-col justify-center items-center">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Crafting your reward...</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">{rewardContent.title}</h1>
            <p className="text-gray-600 text-center mt-2 mb-6 text-lg">{rewardContent.message}</p>
          </>
        )}
        
        <div className={`my-8 p-6 ${config.badgeBg} border border-orange-200 rounded-xl`}>
          {/* Stars section - centered above scores */}
          <div className="mb-6">
            <p className={`text-lg ${config.scoreColor} font-bold mb-3`}>Stars</p>
            <div className="flex justify-center items-center space-x-1">
              {[...Array(MAX_FOCUS_STARS)].map((_, i) => (
                <StarIcon key={i} className={`w-12 h-12 ${i < focusStars ? 'text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>
          
          {/* Score sections in a row */}
          <div className="flex justify-around items-center text-center">
            <div>
              <p className={`text-lg ${config.scoreColor} font-bold`}>{therapyName} Lvl.</p>
              <p className={`text-5xl font-bold ${config.scoreColor} my-2`}>{currentLevel}</p>
            </div>
            <div>
              <p className={`text-lg ${config.scoreColor} font-bold`}>{therapyName}</p>
              <p className={`text-5xl font-bold ${config.scoreColor} my-2`}>{gameState.speechScore}</p>
            </div>
            <div>
              <p className={`text-lg ${config.scoreColor} font-bold`}>Creativity</p>
              <p className={`text-5xl font-bold ${config.scoreColor} my-2`}>{gameState.totalScore}</p>
            </div>
          </div>
        </div>
        
        {!isLoading && rewardContent && (
            <div className={`my-8 p-4 ${config.badgeBg} border border-border rounded-xl flex items-center justify-center space-x-3`}>
                {endingType === 'happy' && latestBadgeEarned ? (
                    <>
                        <span className="text-3xl" aria-hidden="true">{latestBadgeEarned.emoji}</span>
                        <p className={`text-xl font-bold ${config.badgeIconColor}`}>{latestBadgeEarned.title}</p>
                    </>
                ) : (
                    <>
                        <SparkleIcon className={`w-8 h-8 ${config.badgeIconColor}`} />
                        <p className={`text-xl font-bold ${config.badgeIconColor}`}>{rewardContent.badgeText}</p>
                    </>
                )}
            </div>
        )}

        <button
          onClick={onRestart}
          disabled={isLoading}
          className="w-full max-w-sm mx-auto border rounded-xl px-4 py-3 text-left shadow bg-gradient-to-r from-[#ff6b1d] to-orange-500 text-white border-[#ff6b1d] flex items-center justify-between hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div>
            <h3 className="text-base font-semibold">{endingType === 'sad' ? 'Try a New Adventure!' : 'Play Again!'}</h3>
            <p className="text-sm text-white/90">Start another story</p>
          </div>
          <SparkleIcon className="w-5 h-5 flex-shrink-0"/>
        </button>
      </div>
    </div>
  );
};

export default RewardScreen;