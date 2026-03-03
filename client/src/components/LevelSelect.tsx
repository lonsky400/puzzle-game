/**
 * LevelSelect — 关卡选择界面
 * 
 * 国潮水墨风：印章式关卡卡片，水墨晕染背景
 */

import { motion } from 'framer-motion';

export interface LevelConfig {
  id: number;
  name: string;
  imageUrl: string;
  gridSize: number;
  thumbnailUrl: string;
}

interface LevelSelectProps {
  levels: LevelConfig[];
  onSelect: (level: LevelConfig) => void;
}

export default function LevelSelect({ levels, onSelect }: LevelSelectProps) {
  return (
    <div className="w-full flex flex-col items-center gap-5 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl tracking-wider"
        style={{ fontFamily: "'ZCOOL KuaiLe', cursive", color: '#2C2C2C' }}
      >
        选择关卡
      </motion.h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-[420px]">
        {levels.map((level, index) => (
          <motion.button
            key={level.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -3 }}
            onClick={() => onSelect(level)}
            className="relative group overflow-hidden rounded-xl"
            style={{
              boxShadow: '0 3px 16px rgba(60, 50, 40, 0.15)',
            }}
          >
            {/* 图片 */}
            <div className="aspect-square overflow-hidden">
              <img
                src={level.thumbnailUrl}
                alt={level.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>

            {/* 底部信息栏 */}
            <div
              className="absolute bottom-0 left-0 right-0 py-2.5 px-3 flex items-center justify-between"
              style={{
                background: 'linear-gradient(transparent, rgba(44, 44, 44, 0.85))',
              }}
            >
              <span
                className="text-white text-sm font-semibold"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {level.name}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-sm font-semibold"
                style={{
                  backgroundColor: 'rgba(196, 70, 58, 0.92)',
                  color: '#fff',
                }}
              >
                {level.gridSize}×{level.gridSize}
              </span>
            </div>

            {/* 印章装饰 */}
            <div
              className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-sm"
              style={{
                border: '2px solid rgba(196, 70, 58, 0.85)',
                color: '#C4463A',
                fontSize: '10px',
                fontFamily: "'Noto Serif SC', serif",
                fontWeight: 700,
                transform: 'rotate(-6deg)',
                backgroundColor: 'rgba(245, 240, 232, 0.75)',
              }}
            >
              第{level.id}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
