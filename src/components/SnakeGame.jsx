import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Gamepad2, Volume2, VolumeX } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

const DIFFICULTY_SPEEDS = {
  debutant: 180,
  moyen: 120,
  avance: 70
};

const DIFFICULTY_GOALS = {
  debutant: 5,
  moyen: 10,
  avance: 20
};

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('moyen');
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const directionRef = useRef(INITIAL_DIRECTION);
  const gameLoopRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const audioContextRef = useRef(null);

  // FIX Bug 2 : refs pour les valeurs utilisées dans les fonctions audio et game loop
  const isMutedRef = useRef(false);
  const foodRef = useRef({ x: 15, y: 15 });
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);

  // Synchronisation des refs avec les états
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const startBackgroundMusic = () => {
    if (isMutedRef.current || backgroundMusicRef.current) return;

    try {
      const audioContext = getAudioContext();

      const playNote = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.05, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const melody = [
        { freq: 523, duration: 0.2 },
        { freq: 587, duration: 0.2 },
        { freq: 659, duration: 0.2 },
        { freq: 587, duration: 0.2 },
      ];

      let currentTime = audioContext.currentTime;

      const playMelody = () => {
        melody.forEach((note, index) => {
          playNote(note.freq, currentTime + (index * 0.25), note.duration);
        });
        currentTime += melody.length * 0.25;
        backgroundMusicRef.current = setTimeout(playMelody, 1000);
      };

      playMelody();
    } catch (e) {
      console.log('Audio non disponible');
    }
  };

  const stopBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      clearTimeout(backgroundMusicRef.current);
      backgroundMusicRef.current = null;
    }
  };

  // FIX Bug 2 : utilisation de isMutedRef.current au lieu de isMuted
  const playEatSound = () => {
    if (isMutedRef.current) return;
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.log('Audio non disponible');
    }
  };

  const playGameOverSound = () => {
    if (isMutedRef.current) return;
    stopBackgroundMusic();
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio non disponible');
    }
  };

  const playWinSound = () => {
    if (isMutedRef.current) return;
    stopBackgroundMusic();
    try {
      const audioContext = getAudioContext();
      [600, 800, 1000].forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        const startTime = audioContext.currentTime + (index * 0.15);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      });
    } catch (e) {
      console.log('Audio non disponible');
    }
  };

  // FIX Bug 3 : génération de nourriture inline avec prevSnake pour éviter les positions sur le serpent
  const generateFoodFromSnake = (currentSnake) => {
    let newFood;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      attempts++;
    } while (
      currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y) &&
      attempts < 100
    );
    return newFood;
  };

  const startGame = (selectedDifficulty) => {
    const initialFood = generateFoodFromSnake(INITIAL_SNAKE);
    setFood(initialFood);
    foodRef.current = initialFood;
    setGameStarted(true);
    setIsPaused(false);
    setGameOver(false);
    setGameWon(false);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    scoreRef.current = 0;
    setDifficulty(selectedDifficulty);
    setShowDifficultyMenu(false);
    startBackgroundMusic();
  };

  const resetGame = () => {
    setGameStarted(false);
    setIsPaused(true);
    setGameOver(false);
    setGameWon(false);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    scoreRef.current = 0;
    setFood({ x: 15, y: 15 });
    foodRef.current = { x: 15, y: 15 };
    setShowDifficultyMenu(false);
    stopBackgroundMusic();
  };

  const togglePause = () => {
    if (gameStarted && !gameOver && !gameWon) {
      setIsPaused(prev => !prev);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMutedRef.current;
    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState;

    if (newMutedState) {
      stopBackgroundMusic();
    } else if (gameStarted && !isPaused && !gameOver && !gameWon) {
      startBackgroundMusic();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setShowDifficultyMenu(true);
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (isPaused || gameOver || gameWon) return;

      const key = e.key.toLowerCase();
      const currentDir = directionRef.current;
      let newDirection = null;

      switch (key) {
        case 'arrowup':
        case 'z':
        case 'w':
          if (currentDir.y === 0) newDirection = { x: 0, y: -1 };
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          if (currentDir.y === 0) newDirection = { x: 0, y: 1 };
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'q':
        case 'a':
          if (currentDir.x === 0) newDirection = { x: -1, y: 0 };
          e.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          if (currentDir.x === 0) newDirection = { x: 1, y: 0 };
          e.preventDefault();
          break;
        default:
          return;
      }

      if (newDirection) {
        directionRef.current = newDirection;
        setDirection(newDirection);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, isPaused, gameOver, gameWon]);

  // FIX Bug 1 : game loop sans generateFood ni food/score/highScore dans les deps
  // Tout passe par les refs pour éviter la recréation de l'intervalle à chaque tick
  useEffect(() => {
    if (!gameStarted || isPaused || gameOver || gameWon) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    const moveSnake = () => {
      setSnake(prevSnake => {
        const newHead = {
          x: prevSnake[0].x + directionRef.current.x,
          y: prevSnake[0].y + directionRef.current.y
        };

        // Collision mur
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsPaused(true);
          playGameOverSound();
          if (scoreRef.current > highScoreRef.current) {
            setHighScore(scoreRef.current);
            highScoreRef.current = scoreRef.current;
          }
          return prevSnake;
        }

        // Collision corps
        if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          setGameOver(true);
          setIsPaused(true);
          playGameOverSound();
          if (scoreRef.current > highScoreRef.current) {
            setHighScore(scoreRef.current);
            highScoreRef.current = scoreRef.current;
          }
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // FIX Bug 3 : on utilise foodRef.current et prevSnake directement
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          const newScore = scoreRef.current + 1;
          setScore(newScore);
          scoreRef.current = newScore;

          const goal = DIFFICULTY_GOALS[difficulty];
          if (newScore >= goal) {
            setGameWon(true);
            setIsPaused(true);
            playWinSound();
            if (newScore > highScoreRef.current) {
              setHighScore(newScore);
              highScoreRef.current = newScore;
            }
          } else {
            // FIX Bug 3 : génération avec le vrai serpent à jour (newSnake)
            const newFood = generateFoodFromSnake(newSnake);
            setFood(newFood);
            foodRef.current = newFood;
            playEatSound();
          }
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = DIFFICULTY_SPEEDS[difficulty];
    gameLoopRef.current = setInterval(moveSnake, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameStarted, isPaused, gameOver, gameWon, difficulty]);

  const getHeadRotation = () => {
    if (directionRef.current.x === 1) return 'rotate(0deg)';
    if (directionRef.current.x === -1) return 'rotate(180deg)';
    if (directionRef.current.y === 1) return 'rotate(90deg)';
    if (directionRef.current.y === -1) return 'rotate(-90deg)';
    return 'rotate(0deg)';
  };

  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'debutant': return '🟢 Débutant';
      case 'moyen': return '🟡 Moyen';
      case 'avance': return '🔴 Avancé';
      default: return difficulty;
    }
  };

  const getDifficultyGoal = () => DIFFICULTY_GOALS[difficulty];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Gamepad2 className="w-12 h-12" />
            Snake Game
          </h1>
          <p className="text-purple-200 text-lg">Utilisez les flèches ou ZQSD pour jouer</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center">
              <p className="text-white/80 text-sm font-medium mb-1">Score</p>
              <p className="text-4xl font-bold text-white">{score}</p>
              {gameStarted && <p className="text-white/60 text-xs mt-1">Objectif: {getDifficultyGoal()}</p>}
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 text-white mx-auto mb-1" />
              <p className="text-white/80 text-sm font-medium">Meilleur</p>
              <p className="text-3xl font-bold text-white">{highScore}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-center">
              <p className="text-white/80 text-sm font-medium mb-1">Niveau</p>
              <p className="text-2xl font-bold text-white">{getDifficultyLabel()}</p>
            </div>
          </div>

          <div className="relative mb-6">
            <div
              className="mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 shadow-inner relative overflow-hidden"
              style={{
                width: GRID_SIZE * CELL_SIZE + 32,
                height: GRID_SIZE * CELL_SIZE + 32
              }}
            >
              <div className="absolute inset-4 opacity-10">
                {Array.from({ length: GRID_SIZE }).map((_, y) =>
                  Array.from({ length: GRID_SIZE }).map((_, x) => (
                    <div
                      key={`${x}-${y}`}
                      className="absolute border border-white/20"
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE
                      }}
                    />
                  ))
                )}
              </div>

              <div
                className="absolute transition-all duration-100"
                style={{
                  left: food.x * CELL_SIZE + 16,
                  top: food.y * CELL_SIZE + 16,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                  zIndex: 5
                }}
              >
                <div className="relative w-full h-full">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full shadow-lg animate-pulse"
                    style={{
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset -3px -3px 6px rgba(0,0,0,0.3), inset 3px 3px 6px rgba(255,255,255,0.3)'
                    }}
                  />
                  <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-sm" />
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gradient-to-b from-green-700 to-green-900 rounded-sm" />
                </div>
              </div>

              {snake.map((segment, index) => {
                const isHead = index === 0;
                if (isHead) {
                  return (
                    <div
                      key={index}
                      className="absolute transition-all duration-75"
                      style={{
                        left: segment.x * CELL_SIZE + 16,
                        top: segment.y * CELL_SIZE + 16,
                        width: CELL_SIZE - 4,
                        height: CELL_SIZE - 4,
                        transform: getHeadRotation(),
                        zIndex: 10
                      }}
                    >
                      <div
                        className="relative w-full h-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-lg"
                        style={{
                          boxShadow: '0 0 20px rgba(16, 185, 129, 0.8), inset -2px -2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        <div className="absolute top-1 right-1 flex gap-0.5">
                          <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-black rounded-full" />
                          </div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-black rounded-full" />
                          </div>
                        </div>
                        <div className="absolute top-1/2 -right-1 w-1 h-0.5 bg-red-500 rounded-full transform -translate-y-1/2" />
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={index}
                      className="absolute rounded-lg transition-all duration-75"
                      style={{
                        left: segment.x * CELL_SIZE + 16,
                        top: segment.y * CELL_SIZE + 16,
                        width: CELL_SIZE - 4,
                        height: CELL_SIZE - 4,
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                        boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.2)',
                        zIndex: snake.length - index
                      }}
                    />
                  );
                }
              })}

              {!gameStarted && !showDifficultyMenu && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Prêt à jouer ? 🐍</h2>
                    <p className="text-purple-200 mb-6">Cliquez sur JOUER pour choisir le niveau</p>
                  </div>
                </div>
              )}

              {showDifficultyMenu && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Choisis ton niveau 🎯</h2>
                    <div className="space-y-3">
                      <button
                        onClick={() => startGame('debutant')}
                        className="w-64 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105"
                      >
                        🟢 Débutant<br />
                        <span className="text-sm">(5 pommes pour gagner)</span>
                      </button>
                      <button
                        onClick={() => startGame('moyen')}
                        className="w-64 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105"
                      >
                        🟡 Moyen<br />
                        <span className="text-sm">(10 pommes pour gagner)</span>
                      </button>
                      <button
                        onClick={() => startGame('avance')}
                        className="w-64 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105"
                      >
                        🔴 Avancé<br />
                        <span className="text-sm">(20 pommes pour gagner)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {gameWon && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
                  <div className="text-center">
                    <h2 className="text-5xl font-bold text-yellow-400 mb-4">🎉 GAME WIN ! 🎉</h2>
                    <p className="text-3xl text-white mb-2">Tu as gagné !</p>
                    <p className="text-2xl text-green-400 mb-4">Score: {score}/{getDifficultyGoal()}</p>
                    <p className="text-purple-200">Félicitations ! 🏆</p>
                  </div>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
                  <div className="text-center">
                    <h2 className="text-5xl font-bold text-red-400 mb-4">Game Over! 💀</h2>
                    <p className="text-2xl text-white mb-2">Score: {score}/{getDifficultyGoal()}</p>
                    {score === highScore && score > 0 && (
                      <p className="text-yellow-400 text-xl mb-6 flex items-center justify-center gap-2">
                        <Trophy className="w-6 h-6" />
                        Nouveau record !
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isPaused && gameStarted && !gameOver && !gameWon && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Pause ⏸️</h2>
                    <p className="text-purple-200">Appuyez sur ESPACE pour continuer</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center items-center">
            {!gameStarted || gameOver || gameWon ? (
              <button
                onClick={() => setShowDifficultyMenu(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                <Play className="w-6 h-6" />
                {gameOver || gameWon ? 'Rejouer' : 'Jouer'}
              </button>
            ) : (
              <button
                onClick={togglePause}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                {isPaused ? 'Reprendre' : 'Pause'}
              </button>
            )}

            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-6 h-6" />
              Réinitialiser
            </button>

            <button
              onClick={toggleMute}
              className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-4 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>

          <div className="mt-6 text-center text-purple-200 text-sm">
            <p className="mb-2">🎮 Contrôles : Flèches directionnelles ou ZQSD</p>
            <p className="mb-2">⏸️ Pause : Barre d'espace</p>
            <p>🔊 Sons : {isMuted ? 'Coupés 🔇' : 'Activés 🔊'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
