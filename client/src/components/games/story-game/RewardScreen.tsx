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
        gradient: string;
        badgeBg: string;
        badgeIconColor: string;
        scoreColor: string;
        buttonColor: string;
        iconColor: string;
    }> = {
        happy: {
            gradient: 'from-yellow-100 to-[--secondary-light]',
            badgeBg: 'bg-[--primary-bg-light]',
            badgeIconColor: 'text-[--primary]',
            scoreColor: 'text-[--primary-dark]',
            buttonColor: 'bg-[--primary] hover:bg-[--primary-dark]',
            iconColor: 'text-[--secondary]'
        },
        neutral: {
            gradient: 'from-blue-100 to-purple-100',
            badgeBg: 'bg-purple-100',
            badgeIconColor: 'text-purple-500',
            scoreColor: 'text-purple-600',
            buttonColor: 'bg-purple-500 hover:bg-purple-600',
            iconColor: 'text-[--primary]'
        },
        sad: {
            gradient: 'from-gray-100 to-blue-200',
            badgeBg: 'bg-blue-100',
            badgeIconColor: 'text-blue-500',
            scoreColor: 'text-blue-600',
            buttonColor: 'bg-blue-500 hover:bg-blue-600',
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
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient} flex flex-col justify-center items-center p-4 transition-all duration-500`}>
      <div className="w-full max-w-lg bg-[--card-background] rounded-3xl shadow-2xl p-8 text-center transform transition-all hover:scale-101 duration-300">
        {endingType === 'happy' ? 
            <TrophyIcon className={`w-24 h-24 mx-auto ${config.iconColor} mb-4`} /> :
            <FoxIcon className={`w-24 h-24 mx-auto ${config.iconColor} mb-4`} />
        }
        
        {isLoading || !rewardContent ? (
          <div className="min-h-[150px] flex flex-col justify-center items-center">
            <LoadingSpinner />
            <p className="text-[--text-light] mt-4">Crafting your reward...</p>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-[--foreground]">{rewardContent.title}</h1>
            <p className="text-[--text-light] mt-2 text-lg">{rewardContent.message}</p>
          </>
        )}
        
        <div className={`my-8 p-6 ${config.badgeBg} rounded-2xl`}>
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
            <div className={`my-8 p-4 ${config.badgeBg} rounded-2xl flex items-center justify-center space-x-3`}>
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
          className={`w-full ${config.buttonColor} text-white font-bold text-2xl py-4 px-6 rounded-2xl shadow-lg transform hover:-translate-y-1 transition-all duration-200 disabled:bg-gray-400`}
        >
          {endingType === 'sad' ? 'Try a New Adventure!' : 'Play Again!'}
        </button>
      </div>
    </div>
  );
};

export default RewardScreen;