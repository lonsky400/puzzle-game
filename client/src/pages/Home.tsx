/**
 * Home — 游戏主页面
 * 
 * 国潮水墨风设计：
 * - 宣纸暖白(#F5F0E8)底色
 * - 墨色(#2C2C2C)主文字
 * - 朱砂红(#C4463A)强调色
 * - 水墨晕染背景纹理
 * - 印章风格按钮
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PuzzleBoard from '@/components/PuzzleBoard';
import LevelSelect, { type LevelConfig } from '@/components/LevelSelect';
import WinOverlay from '@/components/WinOverlay';
import ReferenceImage from '@/components/ReferenceImage';
import DifficultySelector from '@/components/DifficultySelector';
import { PuzzleEngine } from '@/lib/puzzleEngine';

// 关卡配置
const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '齐天大圣',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-1-f3jViPGAbKdjUnVhbmATvF.webp',
    gridSize: 3,
    thumbnailUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-1-f3jViPGAbKdjUnVhbmATvF.webp',
  },
  {
    id: 2,
    name: '山水画卷',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-2-me66SyANWK8Dtp7wK3ytnN.webp',
    gridSize: 3,
    thumbnailUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-2-me66SyANWK8Dtp7wK3ytnN.webp',
  },
  {
    id: 3,
    name: '祥龙腾云',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-3-N5zFytSfaCvy4N8ub7jMKv.webp',
    gridSize: 4,
    thumbnailUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-3-N5zFytSfaCvy4N8ub7jMKv.webp',
  },
  {
    id: 4,
    name: '古街集市',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-4-NUqogFR4toNUZtpxpCABCg.webp',
    gridSize: 4,
    thumbnailUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-4-NUqogFR4toNUZtpxpCABCg.webp',
  },
];

const BG_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-bg-9orue8KtPNBbe5YaNbq2Xw.webp';

type GameState = 'menu' | 'playing' | 'win';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [gridSize, setGridSize] = useState(3);
  const [showNumbers, setShowNumbers] = useState(false);
  const [engine, setEngine] = useState<PuzzleEngine | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [, setRenderTick] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 计时器
  useEffect(() => {
    if (gameState === 'playing') {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const startGame = useCallback((level: LevelConfig) => {
    const size = level.gridSize;
    setGridSize(size);
    setCurrentLevel(level);
    const newEngine = new PuzzleEngine(size);
    setEngine(newEngine);
    setMoveCount(0);
    setGameState('playing');
  }, []);

  const handleDifficultyChange = useCallback((newSize: number) => {
    if (!currentLevel) return;
    setGridSize(newSize);
    const newEngine = new PuzzleEngine(newSize);
    setEngine(newEngine);
    setMoveCount(0);
    setElapsedTime(0);
    setRenderTick(t => t + 1);
  }, [currentLevel]);

  const handleRestart = useCallback(() => {
    if (!currentLevel) return;
    const newEngine = new PuzzleEngine(gridSize);
    setEngine(newEngine);
    setMoveCount(0);
    setElapsedTime(0);
    setGameState('playing');
    setRenderTick(t => t + 1);
  }, [currentLevel, gridSize]);

  const handleMove = useCallback(() => {
    if (engine) {
      setMoveCount(engine.moveCount);
      setRenderTick(t => t + 1);
    }
  }, [engine]);

  const handleWin = useCallback(() => {
    setGameState('win');
  }, []);

  const handleBackToLevels = useCallback(() => {
    setGameState('menu');
    setCurrentLevel(null);
    setEngine(null);
  }, []);

  const progress = useMemo(() => {
    if (!engine) return 0;
    return engine.getProgress();
  }, [engine, moveCount]);

  const groupCount = useMemo(() => {
    if (!engine) return 0;
    return engine.getGroupCount();
  }, [engine, moveCount]);

  return (
    <div
      className="w-full min-h-[100dvh] flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-center py-2.5 sm:py-3 relative shrink-0">
        {gameState !== 'menu' && (
          <button
            onClick={handleBackToLevels}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{ backgroundColor: 'rgba(232, 224, 208, 0.85)', boxShadow: '0 1px 4px rgba(60,50,40,0.1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg sm:text-xl tracking-widest"
          style={{
            fontFamily: "'ZCOOL KuaiLe', cursive",
            color: '#2C2C2C',
          }}
        >
          你今天拼图了吗
        </motion.h1>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto pb-4 sm:pb-6">
        <AnimatePresence mode="wait">
          {gameState === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center gap-3 sm:gap-4 pt-1 sm:pt-2"
            >
              <div className="text-center mb-0.5 sm:mb-1">
                <p
                  className="text-xs sm:text-sm tracking-wider"
                  style={{ color: '#8B8680', fontFamily: "'Noto Serif SC', serif" }}
                >
                  你能拼回那些年代吗？
                </p>
              </div>

              <LevelSelect levels={LEVELS} onSelect={startGame} />
            </motion.div>
          )}

          {gameState === 'playing' && engine && currentLevel && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center gap-2"
            >
              {/* 游戏信息栏 */}
              <div className="flex items-center justify-between w-full max-w-[500px] px-3 sm:px-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <ReferenceImage imageUrl={currentLevel.imageUrl} />
                  <div>
                    <p
                      className="text-xs sm:text-sm font-semibold"
                      style={{ color: '#2C2C2C', fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {currentLevel.name}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs" style={{ color: '#8B8680' }}>
                      <span>
                        步数：<span style={{ color: '#C4463A', fontWeight: 700 }}>{moveCount}</span>
                      </span>
                      <span style={{ color: '#D0C9BE' }}>|</span>
                      <span>
                        <span style={{ color: '#C4463A', fontWeight: 700 }}>{formatTime(elapsedTime)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <DifficultySelector current={gridSize} onChange={handleDifficultyChange} />
              </div>

              {/* 进度条 */}
              <div className="w-full max-w-[500px] px-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-1 sm:h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(232, 224, 208, 0.8)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: '#C4463A' }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold shrink-0" style={{ color: '#C4463A', minWidth: 28 }}>
                    {progress}%
                  </span>
                </div>
              </div>

              {/* 拼图画板 */}
              <PuzzleBoard
                engine={engine}
                imageUrl={currentLevel.imageUrl}
                showNumbers={showNumbers}
                onMove={handleMove}
                onWin={handleWin}
              />

              {/* 底部控制栏 */}
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                {/* 数字角标开关 */}
                <button
                  onClick={() => setShowNumbers(!showNumbers)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: showNumbers ? '#C4463A' : 'rgba(232, 224, 208, 0.85)',
                    color: showNumbers ? '#FFF' : '#6B6560',
                    border: showNumbers ? '1px solid #C4463A' : '1px solid rgba(139, 134, 128, 0.25)',
                    fontFamily: "'Noto Serif SC', serif",
                    boxShadow: '0 1px 3px rgba(60,50,40,0.08)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  角标
                </button>

                {/* 重新开始 */}
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: 'rgba(232, 224, 208, 0.85)',
                    color: '#6B6560',
                    border: '1px solid rgba(139, 134, 128, 0.25)',
                    fontFamily: "'Noto Serif SC', serif",
                    boxShadow: '0 1px 3px rgba(60,50,40,0.08)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  重来
                </button>

                {/* 组数信息 */}
                <div
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold"
                  style={{
                    backgroundColor: 'rgba(232, 224, 208, 0.65)',
                    color: '#6B6560',
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  剩余 <span style={{ color: '#C4463A', fontWeight: 700 }}>{groupCount}</span> 组
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 胜利弹窗 */}
      <AnimatePresence>
        {gameState === 'win' && currentLevel && (
          <WinOverlay
            moveCount={moveCount}
            elapsedTime={elapsedTime}
            imageUrl={currentLevel.imageUrl}
            onRestart={handleRestart}
            onBackToLevels={handleBackToLevels}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
