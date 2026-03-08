/**
 * Home — 游戏主页面
 *
 * 按《游戏玩法说明》重构：四大主题 → 每主题 70 关 → 星级与进度；道具无限量（开发环境）
 * 界面风格、拼图交互保持当前不变
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PuzzleBoard from '@/components/PuzzleBoard';
import ThemeSelect from '@/components/ThemeSelect';
import LevelSelect from '@/components/LevelSelect';
import WinOverlay from '@/components/WinOverlay';
import ReferenceImage from '@/components/ReferenceImage';
import { PuzzleEngine } from '@/lib/puzzleEngine';
import {
  type ThemeId,
  type LevelInfo,
  getLevelInfo,
  getLevelsForTheme,
  computeStars,
  THEMES,
} from '@/lib/levelConfig';
import {
  loadStars,
  saveStars,
  setStarForLevel,
  type StarsMap,
} from '@/lib/progressStorage';

const BG_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-bg-9orue8KtPNBbe5YaNbq2Xw.webp';

type GameState = 'themeSelect' | 'levelSelect' | 'playing' | 'win';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('themeSelect');
  const [currentTheme, setCurrentTheme] = useState<ThemeId | null>(null);
  const [themeLevels, setThemeLevels] = useState<LevelInfo[]>([]);
  const [currentLevel, setCurrentLevel] = useState<LevelInfo | null>(null);
  const [stars, setStars] = useState<StarsMap>(() => loadStars());
  const [engine, setEngine] = useState<PuzzleEngine | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [, setRenderTick] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNumbers, setShowNumbers] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStars(loadStars());
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      setElapsedTime(0);
      timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
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

  const startGame = useCallback((level: LevelInfo) => {
    setCurrentLevel(level);
    setEngine(new PuzzleEngine(level.gridSize));
    setMoveCount(0);
    setElapsedTime(0);
    setGameState('playing');
    setRenderTick((n) => n + 1);
  }, []);

  const handleThemeSelect = useCallback((themeId: ThemeId) => {
    setCurrentTheme(themeId);
    setThemeLevels(getLevelsForTheme(themeId));
    setGameState('levelSelect');
  }, []);

  const handleLevelSelect = useCallback((level: LevelInfo) => {
    startGame(level);
  }, [startGame]);

  const handleBackFromLevelSelect = useCallback(() => {
    setGameState('themeSelect');
    setCurrentTheme(null);
    setThemeLevels([]);
  }, []);

  const handleBackFromPlaying = useCallback(() => {
    setGameState('levelSelect');
    setCurrentLevel(null);
    setEngine(null);
  }, []);

  const handleRestart = useCallback(() => {
    if (!currentLevel) return;
    setEngine(new PuzzleEngine(currentLevel.gridSize));
    setMoveCount(0);
    setElapsedTime(0);
    setGameState('playing');
    setRenderTick((n) => n + 1);
  }, [currentLevel]);

  const handleMove = useCallback(() => {
    if (engine) {
      setMoveCount(engine.moveCount);
      setRenderTick((n) => n + 1);
    }
  }, [engine]);

  const handleWin = useCallback(() => {
    if (!engine || !currentLevel) return;
    const star = computeStars(engine.moveCount, currentLevel.gridSize);
    setStars((prev) => {
      const next = setStarForLevel(prev, currentLevel.themeId, currentLevel.levelIndex, star);
      saveStars(next);
      return next;
    });
    setGameState('win');
  }, [engine, currentLevel]);

  const progress = useMemo(() => {
    if (!engine) return 0;
    return engine.getProgress();
  }, [engine, moveCount]);

  const groupCount = useMemo(() => {
    if (!engine) return 0;
    return engine.getGroupCount();
  }, [engine, moveCount]);

  const themeName = useMemo(
    () => THEMES.find((t) => t.id === currentTheme)?.name ?? '',
    [currentTheme],
  );

  const useMagnet = useCallback(() => {
    if (!engine) return;
    for (let id = 0; id < engine.totalPieces; id++) {
      const pos = engine.getPiece(id).currentPos;
      if (pos !== id) {
        engine.swap(pos, id);
        setMoveCount(engine.moveCount);
        setRenderTick((n) => n + 1);
        if (engine.isComplete) setTimeout(() => handleWin(), 400);
        break;
      }
    }
  }, [engine, handleWin]);

  const addThirtySeconds = useCallback(() => {
    setElapsedTime((t) => t + 30);
  }, []);

  const goNextLevel = useCallback(() => {
    if (!currentLevel || currentLevel.levelIndex >= 70) return;
    startGame(getLevelInfo(currentLevel.themeId, currentLevel.levelIndex + 1));
  }, [currentLevel, startGame]);

  const showBackButton = gameState === 'levelSelect' || gameState === 'playing';
  const onBack = gameState === 'levelSelect' ? handleBackFromLevelSelect : handleBackFromPlaying;

  return (
    <div
      className="w-full h-dvh min-h-[100dvh] max-h-dvh flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <header className="flex items-center justify-center py-2.5 sm:py-3 relative shrink-0">
        {showBackButton && (
          <button
            onClick={onBack}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              backgroundColor: 'rgba(232, 224, 208, 0.85)',
              boxShadow: '0 1px 4px rgba(60,50,40,0.1)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2C2C2C"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl tracking-widest"
          style={{ fontFamily: "'ZCOOL KuaiLe', cursive", color: '#2C2C2C' }}
        >
          图个完整
        </motion.h1>
      </header>

      <main
        className={`flex-1 flex flex-col items-center min-h-0 pb-4 sm:pb-6 ${gameState === 'levelSelect' ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        <AnimatePresence mode="wait">
          {gameState === 'themeSelect' && (
            <motion.div
              key="themeSelect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center gap-3 sm:gap-4 pt-1 sm:pt-2"
            >
              <ThemeSelect onSelect={handleThemeSelect} />
            </motion.div>
          )}

          {gameState === 'levelSelect' && currentTheme && (
            <motion.div
              key="levelSelect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex-1 flex flex-col items-center min-h-0 pt-1 sm:pt-2"
            >
              <LevelSelect
                themeId={currentTheme}
                themeName={themeName}
                levels={themeLevels}
                stars={stars}
                onSelect={handleLevelSelect}
                onBack={handleBackFromLevelSelect}
              />
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
                    <div
                      className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs"
                      style={{ color: '#8B8680' }}
                    >
                      <span>
                        步数：<span style={{ color: '#C4463A', fontWeight: 700 }}>{moveCount}</span>
                      </span>
                      <span style={{ color: '#D0C9BE' }}>|</span>
                      <span>
                        <span style={{ color: '#C4463A', fontWeight: 700 }}>
                          {formatTime(elapsedTime)}
                        </span>
                      </span>
                      <span style={{ color: '#D0C9BE' }}>|</span>
                      <span>
                        {currentLevel.zoneName} {currentLevel.gridSize}×{currentLevel.gridSize}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[500px] px-3 sm:px-4">
                <div className="flex gap-2 items-center">
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
                  <span
                    className="text-[11px] sm:text-xs font-semibold shrink-0"
                    style={{ color: '#C4463A', minWidth: 28 }}
                  >
                    {progress}%
                  </span>
                </div>
              </div>

              <PuzzleBoard
                engine={engine}
                imageUrl={currentLevel.imageUrl}
                showNumbers={showNumbers}
                onMove={handleMove}
                onWin={handleWin}
              />

              <div className="flex flex-wrap items-center gap-2 mt-0.5 sm:mt-1 max-w-[500px] px-3 sm:px-4">
                <button
                  onClick={useMagnet}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: 'rgba(232, 224, 208, 0.85)',
                    color: '#6B6560',
                    border: '1px solid rgba(139, 134, 128, 0.25)',
                    fontFamily: "'Noto Serif SC', serif",
                    boxShadow: '0 1px 3px rgba(60,50,40,0.08)',
                  }}
                  title="吸附一块到正确位置"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12h4v8H2z" />
                    <path d="M6 4v16" />
                    <path d="M18 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                    <path d="M14 12h8" />
                  </svg>
                  磁铁
                </button>
                <button
                  onClick={addThirtySeconds}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: 'rgba(232, 224, 208, 0.85)',
                    color: '#6B6560',
                    border: '1px solid rgba(139, 134, 128, 0.25)',
                    fontFamily: "'Noto Serif SC', serif",
                    boxShadow: '0 1px 3px rgba(60,50,40,0.08)',
                  }}
                  title="增加 30 秒"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v10l4 4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  沙漏
                </button>
                <button
                  onClick={() => setShowNumbers(!showNumbers)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: showNumbers ? '#C4463A' : 'rgba(232, 224, 208, 0.85)',
                    color: showNumbers ? '#FFF' : '#6B6560',
                    border: showNumbers ? '1px solid #C4463A' : '1px solid rgba(139, 134, 128, 0.25)',
                    fontFamily: "'Noto Serif SC', serif",
                    boxShadow: '0 1px 3px rgba(60,50,40,0.08)',
                  }}
                  title="图块序号角标"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  角标
                </button>
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all active:scale-95"
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

      <AnimatePresence>
        {gameState === 'win' && currentLevel && (
          <WinOverlay
            moveCount={moveCount}
            elapsedTime={elapsedTime}
            imageUrl={currentLevel.imageUrl}
            stars={computeStars(
              moveCount,
              currentLevel.gridSize,
            )}
            onRestart={handleRestart}
            onBackToLevels={handleBackFromPlaying}
            onNextLevel={currentLevel.levelIndex < 70 ? goNextLevel : undefined}
            hasNextLevel={currentLevel.levelIndex < 70}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
