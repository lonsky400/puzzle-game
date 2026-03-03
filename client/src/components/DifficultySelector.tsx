/**
 * DifficultySelector — 难度选择组件
 * 
 * 印章风格的难度按钮
 */

import { motion } from 'framer-motion';

interface DifficultySelectorProps {
  current: number;
  onChange: (size: number) => void;
}

const difficulties = [
  { size: 3, label: '三阶' },
  { size: 4, label: '四阶' },
  { size: 5, label: '五阶' },
];

export default function DifficultySelector({ current, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex gap-2">
      {difficulties.map((d) => {
        const isActive = current === d.size;
        return (
          <motion.button
            key={d.size}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(d.size)}
            className="relative px-3 py-1.5 rounded text-xs font-semibold transition-all"
            style={{
              backgroundColor: isActive ? '#C4463A' : 'rgba(232, 224, 208, 0.8)',
              color: isActive ? '#FFF' : '#8B8680',
              border: isActive ? '1px solid #C4463A' : '1px solid rgba(139, 134, 128, 0.3)',
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            {d.label}
          </motion.button>
        );
      })}
    </div>
  );
}
