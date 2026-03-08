/**
 * LevelSelect — 关卡选择（1-70 关，按五区：新手村、进阶区、挑战区、大师区、王者区）
 * 国潮水墨风，与现有界面风格一致
 */

import { motion } from 'framer-motion';
import type { LevelInfo } from '@/lib/levelConfig';
import { getGridSizeForLevel, getZoneName } from '@/lib/levelConfig';
import type { StarsMap } from '@/lib/progressStorage';
import { getStarForLevel } from '@/lib/progressStorage';

export type { LevelInfo };

/** 五区关卡范围（含首含尾）：新手村 1-10、进阶区 11-25、挑战区 26-40、大师区 41-55、王者区 56-70 */
const ZONE_RANGES: { start: number; end: number }[] = [
  { start: 1, end: 10 },
  { start: 11, end: 25 },
  { start: 26, end: 40 },
  { start: 41, end: 55 },
  { start: 56, end: 70 },
];

interface LevelSelectProps {
  themeId: string;
  themeName: string;
  levels: LevelInfo[];
  stars: StarsMap;
  onSelect: (level: LevelInfo) => void;
  onBack: () => void;
}

function StarIcons({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          width="12"
          height="12"
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

/** 每组预览：首关缩略图 + N×N 网格线叠层，提示该组难度 */
function GroupPreview({ level, gridSize }: { level: LevelInfo; gridSize: number }) {
  const pct = 100 / gridSize;
  const vert = `repeating-linear-gradient(90deg, transparent 0, transparent calc(${pct}% - 0.5px), rgba(0,0,0,0.4) ${pct}%, transparent calc(${pct}% + 0.5px))`;
  const horz = `repeating-linear-gradient(0deg, transparent 0, transparent calc(${pct}% - 0.5px), rgba(0,0,0,0.4) ${pct}%, transparent calc(${pct}% + 0.5px))`;
  const bg = `${vert}, ${horz}`;
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-[#E8E0D0]" style={{ aspectRatio: '1' }}>
      <img
        src={level.thumbnailUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
      />
      <div
        className="absolute inset-0 pointer-events-none border border-[rgba(0,0,0,0.4)] rounded-lg"
        style={{ backgroundImage: bg, backgroundSize: '100% 100%' }}
      />
      <div
        className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
        style={{ backgroundColor: 'rgba(44,44,44,0.75)', color: '#fff' }}
      >
        {gridSize}×{gridSize}
      </div>
    </div>
  );
}

export default function LevelSelect({ themeName, levels, stars, onSelect, onBack }: LevelSelectProps) {
  const groups: LevelInfo[][] = ZONE_RANGES.map(({ start, end }) =>
    levels.filter((l) => l.levelIndex >= start && l.levelIndex <= end),
  );

  return (
    <div className="w-full flex flex-col items-center min-h-0 flex-1 gap-4 px-4 pb-4">
      <div className="flex items-center gap-2 w-full max-w-[500px] shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 shrink-0"
          style={{ backgroundColor: 'rgba(232, 224, 208, 0.85)', boxShadow: '0 1px 4px rgba(60,50,40,0.1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl tracking-wider flex-1 text-center"
          style={{ fontFamily: "'ZCOOL KuaiLe', cursive", color: '#2C2C2C' }}
        >
          {themeName} · 选择关卡
        </motion.h2>
        <div className="w-8 shrink-0" />
      </div>

      <div
        className="w-full max-w-[500px] flex-1 min-h-0 min-h-[50vh] overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-col gap-6 w-full pb-6">
          {groups.map((group, groupIndex) => {
            const first = group[0];
            const gridSize = getGridSizeForLevel(first.levelIndex);
            const zoneName = getZoneName(first.levelIndex);
            const rangeLabel = `第 ${first.levelIndex}-${first.levelIndex + group.length - 1} 关`;

            return (
              <motion.section
                key={`group-${first.levelIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#2C2C2C', fontFamily: "'Noto Serif SC', serif" }}>
                    {zoneName} · {rangeLabel}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(196,70,58,0.15)', color: '#C4463A' }}>
                    {gridSize}×{gridSize}
                  </span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_2fr] sm:grid-cols-[minmax(0,1.2fr)_2fr] gap-3 items-start">
                  <GroupPreview level={first} gridSize={gridSize} />
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {group.map((level, idx) => {
                      const starCount = getStarForLevel(stars, level.themeId, level.levelIndex);
                      return (
                        <motion.button
                          key={`${level.themeId}-${level.levelIndex}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: groupIndex * 0.05 + idx * 0.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onSelect(level)}
                          className="relative flex flex-col items-center rounded-lg overflow-hidden"
                          style={{
                            boxShadow: '0 2px 10px rgba(60, 50, 40, 0.12)',
                            backgroundColor: 'rgba(232, 224, 208, 0.6)',
                            border: '1px solid rgba(139, 134, 128, 0.2)',
                          }}
                        >
                          <div className="aspect-square w-full overflow-hidden">
                            <img
                              src={level.thumbnailUrl}
                              alt={level.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                            />
                          </div>
                          <div className="w-full py-0.5 px-1 flex items-center justify-between">
                            <span className="text-[10px] font-bold" style={{ color: '#2C2C2C' }}>
                              {level.levelIndex}
                            </span>
                            <StarIcons count={starCount} />
                          </div>
                          {level.isBoss && (
                            <div className="absolute top-0 right-0 text-[8px] px-1 rounded-bl" style={{ backgroundColor: '#C4463A', color: '#fff' }}>
                              BOSS
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
