/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  Gamepad2, 
  Trophy,
  Volume2,
  ListMusic,
  RotateCcw
} from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2;
const MIN_SPEED = 50;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const TRACKS = [
  { id: 1, title: 'Cyber Pulse', artist: 'AI Weaver', duration: '3:45', tags: ['Synthwave', 'Hard'] },
  { id: 2, title: 'Neon Dreams', artist: 'Neural Chord', duration: '4:20', tags: ['Chill', 'Lo-fi'] },
  { id: 3, title: 'Glitch Horizon', artist: 'Aero Synth', duration: '2:58', tags: ['Electronic', 'Fast'] },
];

// --- Snake Game Component ---
const SnakeGame = ({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStart, setGameStart] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setIsGameOver(false);
    setScore(0);
    onScoreUpdate(0);
    setSpeed(INITIAL_SPEED);
    setGameStart(true);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setNextDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setNextDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setNextDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setNextDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    if (!gameStart || isGameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const newSnake = [...prev];
        const head = { ...newSnake[0] };
        const currentDir = nextDirection;
        setDirection(currentDir);

        switch (currentDir) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Collision Check
        if (
          head.x < 0 || head.x >= GRID_SIZE ||
          head.y < 0 || head.y >= GRID_SIZE ||
          newSnake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
          setIsGameOver(true);
          return prev;
        }

        newSnake.unshift(head);

        // Food Check
        if (head.x === food.x && head.y === food.y) {
          setScore(s => {
            const next = s + 10;
            onScoreUpdate(next);
            return next;
          });
          setFood(generateFood(newSnake));
          setSpeed(prevSpeed => Math.max(MIN_SPEED, prevSpeed - SPEED_INCREMENT));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [gameStart, isGameOver, food, nextDirection, generateFood, onScoreUpdate, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 20); ctx.lineTo(400, i * 20); ctx.stroke();
    }

    // Draw Food (Neon Cyan Circle)
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(food.x * 20 + 10, food.y * 20 + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake (Neon Pink Rects)
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    snake.forEach((segment, i) => {
      const size = i === 0 ? 18 : 16;
      const offset = (20 - size) / 2;
      ctx.fillRect(segment.x * 20 + offset, segment.y * 20 + offset, size, size);
    });

  }, [snake, food]);

  return (
    <div className="relative group">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        className="bg-zinc-900/50 rounded-xl neon-border-pink backdrop-blur-sm shadow-2xl transition-all duration-300"
      />
      {!gameStart && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-md">
          <Gamepad2 className="w-16 h-16 text-neon-pink mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold neon-text-pink mb-6">SNAKE NEON</h2>
          <button 
            onClick={resetGame}
            className="px-8 py-3 bg-neon-pink text-black font-bold rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,255,0.5)]"
          >
            START GAME
          </button>
          <p className="mt-4 text-zinc-400 text-sm">Use Arrow Keys to Navigate</p>
        </div>
      )}
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl backdrop-blur-lg">
          <Trophy className="w-16 h-16 text-neon-yellow mb-2" />
          <h2 className="text-4xl font-black text-white mb-2">GAME OVER</h2>
          <p className="text-2xl font-mono text-neon-pink mb-6">SCORE: {score}</p>
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 px-8 py-3 outline outline-neon-pink text-neon-pink font-bold rounded-lg hover:bg-neon-pink hover:text-black transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

// --- Music Player Component ---
const MusicPlayer = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const track = TRACKS[currentTrackIndex];

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgress(0);
  };

  return (
    <div className="w-full max-w-md bg-zinc-900/80 p-6 rounded-3xl neon-border-cyan backdrop-blur-xl">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-cyan via-zinc-800 to-neon-pink flex items-center justify-center shadow-lg overflow-hidden relative group">
          <Music className={`w-12 h-12 text-white ${isPlaying ? 'animate-bounce' : ''}`} />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="flex gap-1 h-8 items-end">
                {[1, 2, 3, 4].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [10, 20, 15, 25, 10] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-neon-cyan"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold neon-text-cyan truncate">{track.title}</h3>
          <p className="text-zinc-400 text-sm mb-2">{track.artist}</p>
          <div className="flex gap-2">
            {track.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500 uppercase tracking-tighter">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className="absolute h-full bg-neon-cyan shadow-[0_0_10px_#00ffff]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <span>0:{Math.floor(progress * 2.5).toString().padStart(2, '0')}</span>
          <span>{track.duration}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button className="text-zinc-500 hover:text-white transition-colors"><ListMusic className="w-5 h-5" /></button>
        <div className="flex items-center gap-6">
          <button onClick={handlePrev} className="p-2 text-zinc-300 hover:text-neon-cyan transition-all hover:scale-110 active:scale-95">
            <SkipBack className="w-8 h-8 fill-current" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 flex items-center justify-center bg-neon-cyan text-black rounded-full shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:scale-105 active:scale-90 transition-all"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
          <button onClick={handleNext} className="p-2 text-zinc-300 hover:text-neon-cyan transition-all hover:scale-110 active:scale-95">
            <SkipForward className="w-8 h-8 fill-current" />
          </button>
        </div>
        <button className="text-zinc-500 hover:text-white transition-colors"><Volume2 className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [highScore, setHighScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
    if (score > highScore) setHighScore(score);
  };

  return (
    <div className="min-h-screen bg-[#050505] relative flex flex-col items-center justify-center p-4 selection:bg-neon-pink selection:text-black">
      <div className="scanline" />
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-neon-pink/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px]" />
      </div>

      <header className="mb-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-neon-lime animate-pulse shadow-[0_0_8px_#39ff14]" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">System Online</span>
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white neon-text-pink leading-none">
          NEON<br />GROOVE
        </h1>
      </header>

      <main className="grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full max-w-6xl">
        {/* Left Section: Game */}
        <section className="flex flex-col items-center justify-center">
          <div className="flex justify-between w-full max-w-[400px] mb-8 font-digital">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Current Score</span>
              <span 
                className="text-6xl text-neon-pink glow glitch font-black" 
                data-text={currentScore}
              >
                {currentScore}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Hyper Record</span>
              <span 
                className="text-6xl text-neon-yellow glow glitch font-black" 
                data-text={highScore}
              >
                {highScore}
              </span>
            </div>
          </div>
          
          <SnakeGame onScoreUpdate={handleScoreUpdate} />
          
          <div className="mt-8 flex gap-8 text-zinc-500 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-neon-pink rounded-sm" />
              <span>SNAKE_CORE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-neon-cyan rounded-full" />
              <span>NEURON_FOOD</span>
            </div>
          </div>
        </section>

        {/* Right Section: Music */}
        <section className="flex flex-col items-center lg:items-start justify-center gap-8">
          <div className="text-left w-full max-w-md">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">Audio Module v4.2</h2>
            <div className="h-px bg-gradient-to-r from-zinc-800 to-transparent w-full mb-8" />
          </div>

          <MusicPlayer />

          <div className="w-full max-w-md space-y-3">
            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-2">Upcoming Sequence</h4>
            <div className="space-y-1">
              {TRACKS.map((t, i) => (
                <div key={t.id} className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-zinc-800 hover:bg-zinc-900/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-zinc-700">0{i+1}</span>
                    <span className="text-sm font-medium text-zinc-400 group-hover:text-neon-cyan">{t.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{t.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 text-zinc-700 font-mono text-[10px] uppercase tracking-[0.4em] relative z-20">
        &copy; 2026 AI_STUDIO // NEON_CORE_EST_404
      </footer>
    </div>
  );
}
