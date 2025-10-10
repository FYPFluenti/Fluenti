import React, { useEffect, useRef } from 'react';

interface GameContainerProps {
  gameId: number;
  onGameEnd: (score: number, accuracy: number) => void;
}

export default function GameContainer({ gameId, onGameEnd }: GameContainerProps) {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) {
      loadGame(gameId);
    }
  }, [gameId]);

  const loadGame = (id: number) => {
    // Clear previous game
    if (gameRef.current) {
      gameRef.current.innerHTML = '';
    }

    switch (id) {
      case 4: // Rhythm Training
        loadRhythmGame();
        break;
      default:
        console.log('Game not implemented');
    }
  };

  const loadRhythmGame = () => {
    const gameHtml = `
      <div id="rhythm-game" style="width: 100%; height: 400px; background: #f0f0f0; border-radius: 12px; padding: 20px;">
        <h3>Rhythm Training Game</h3>
        <div id="rhythm-display" style="font-size: 24px; text-align: center; margin: 20px 0;">
          Tap the beat: 🎵 🎵 🎵
        </div>
        <button id="beat-button" style="width: 100px; height: 100px; border-radius: 50%; border: none; background: #ff6b1d; color: white; font-size: 20px; cursor: pointer;">
          TAP
        </button>
        <div id="score-display" style="margin-top: 20px;">Score: 0</div>
      </div>
    `;

    if (gameRef.current) {
      gameRef.current.innerHTML = gameHtml;
      
      // Initialize game logic
      let score = 0;
      let beatCount = 0;
      const maxBeats = 10;
      
      const button = document.getElementById('beat-button');
      const scoreDisplay = document.getElementById('score-display');
      
      button?.addEventListener('click', () => {
        score += 10;
        beatCount++;
        if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
        
        if (beatCount >= maxBeats) {
          const accuracy = Math.min((score / (maxBeats * 10)) * 100, 100);
          onGameEnd(score, accuracy);
        }
      });
    }
  };

  return <div ref={gameRef} className="w-full" />;
}