/**
 * ThemeSelect — 四大主题选择
 * 国潮水墨风，与现有界面风格一致
 */

import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import type { ThemeId } from '@/lib/levelConfig';
import { THEMES } from '@/lib/levelConfig';

interface ThemeSelectProps {
  onSelect: (themeId: ThemeId) => void;
}

const THEME_LABELS: Record<ThemeId, string> = {
  retro: '年代感',
  marvel: '漫画连载',
  guofeng: '国风动画',
  landscape: '风景大片',
};

export default function ThemeSelect({ onSelect }: ThemeSelectProps) {
  const [failedCoverIds, setFailedCoverIds] = useState<Set<string>>(new Set());

  const handleCoverError = useCallback((themeId: string) => {
    setFailedCoverIds((prev) => new Set(prev).add(themeId));
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-5 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg sm:text-xl tracking-wider"
        style={{ fontFamily: "'ZCOOL KuaiLe', cursive", color: '#2C2C2C' }}
      >
        选择主题
      </motion.h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-[420px]">
        {THEMES.map((theme, index) => {
          const coverFailed = failedCoverIds.has(theme.id);
          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -3 }}
              onClick={() => onSelect(theme.id)}
              className="relative overflow-hidden rounded-xl text-left"
              style={{ boxShadow: '0 3px 16px rgba(60, 50, 40, 0.15)' }}
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#E8E0D0] relative">
                {!coverFailed && (
                  <img
                    src={theme.coverImageUrl}
                    alt={THEME_LABELS[theme.id]}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={() => handleCoverError(theme.id)}
                  />
                )}
                {coverFailed && (
                  <div
                    className="absolute inset-0 w-full h-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(196,70,58,0.12), rgba(139,105,20,0.08))',
                    }}
                  >
                    <span
                      className="text-lg font-bold"
                      style={{
                        fontFamily: "'ZCOOL KuaiLe', cursive",
                        color: '#2C2C2C',
                      }}
                    >
                      {THEME_LABELS[theme.id]}
                    </span>
                  </div>
                )}
                <div
                  className="absolute right-0 bottom-0 w-full h-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.55) 100%)',
                  }}
                />
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 py-2.5 px-3"
                style={{
                  background: 'linear-gradient(transparent, rgba(44, 44, 44, 0.85))',
                }}
              >
                <span
                  className="text-white text-sm font-semibold"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  {THEME_LABELS[theme.id]}
                </span>
                <span className="text-white/80 text-xs ml-2">70 关</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
