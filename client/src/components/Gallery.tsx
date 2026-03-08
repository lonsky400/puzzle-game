/**
 * Gallery — 相册：按四主题分组展示已完成的拼图，支持点击查看大图
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeId } from '@/lib/levelConfig';
import type { LevelInfo } from '@/lib/levelConfig';
import { THEMES, getLevelInfo, TOTAL_LEVELS } from '@/lib/levelConfig';
import type { StarsMap } from '@/lib/progressStorage';
import { getStarForLevel } from '@/lib/progressStorage';

const THEME_ORDER: ThemeId[] = ['retro', 'marvel', 'guofeng', 'landscape'];

interface GalleryProps {
  stars: StarsMap;
}

function StarIcons({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={i <= count ? '#D4A017' : 'rgba(139, 134, 128, 0.35)'}
          className="shrink-0"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function Gallery({ stars }: GalleryProps) {
  const [viewing, setViewing] = useState<LevelInfo | null>(null);

  const completedByTheme = useMemo(() => {
    const map: Record<ThemeId, { levelIndex: number; starCount: number }[]> = {
      retro: [],
      marvel: [],
      guofeng: [],
      landscape: [],
    };
    for (const themeId of THEME_ORDER) {
      for (let levelIndex = 1; levelIndex <= TOTAL_LEVELS; levelIndex++) {
        const count = getStarForLevel(stars, themeId, levelIndex);
        if (count >= 1) map[themeId].push({ levelIndex, starCount: count });
      }
      map[themeId].sort((a, b) => a.levelIndex - b.levelIndex);
    }
    return map;
  }, [stars]);

  const totalCount = useMemo(
    () => Object.values(completedByTheme).reduce((s, arr) => s + arr.length, 0),
    [completedByTheme],
  );

  const themeName: Record<ThemeId, string> = useMemo(
    () => Object.fromEntries(THEMES.map((t) => [t.id, t.name])) as Record<ThemeId, string>,
    [],
  );

  if (totalCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex-1 flex flex-col items-center justify-center px-6 py-12"
      >
        <p
          className="text-center text-sm"
          style={{ color: '#8B8680', fontFamily: "'Noto Serif SC', serif" }}
        >
          暂无已完成关卡
        </p>
        <p
          className="text-center text-xs mt-2"
          style={{ color: '#A09A92', fontFamily: "'Noto Serif SC', serif" }}
        >
          完成拼图后会自动出现在相册
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[500px] px-4 py-4 overflow-y-auto flex-1 min-h-0"
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ fontFamily: "'ZCOOL KuaiLe', cursive", color: '#2C2C2C' }}
      >
        已完成 {totalCount} 张
      </h2>

      {THEME_ORDER.map((themeId) => {
        const list = completedByTheme[themeId];
        if (list.length === 0) return null;
        return (
          <section key={themeId} className="mb-6">
            <h3
              className="text-sm font-semibold mb-2"
              style={{ color: '#6B6560', fontFamily: "'Noto Serif SC', serif" }}
            >
              {themeName[themeId]}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {list.map(({ levelIndex, starCount }) => {
                const level = getLevelInfo(themeId, levelIndex);
                return (
                  <motion.button
                    key={`${themeId}-${levelIndex}`}
                    type="button"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewing(level)}
                    className="rounded-lg overflow-hidden bg-[#E8E0D0] shadow-sm border border-[rgba(139,134,128,0.2)] text-left w-full"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={level.thumbnailUrl}
                        alt={level.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 py-1 px-1.5 flex items-center justify-between"
                        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}
                      >
                        <span className="text-[10px] text-white font-medium truncate">
                          {levelIndex} 关
                        </span>
                        <StarIcons count={starCount} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* 点击查看大图 */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative max-w-full max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={viewing.imageUrl}
                alt={viewing.name}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              />
              <p
                className="mt-2 text-sm text-white/90"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {viewing.name} · {viewing.zoneName}
              </p>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white border border-white/40 hover:bg-white/10 transition-colors"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
