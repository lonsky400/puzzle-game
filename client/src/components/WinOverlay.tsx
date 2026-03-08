/**
 * WinOverlay — 胜利庆祝弹窗
 * 
 * 国潮水墨风：画卷展开效果，印章"完成"标记，烟花粒子
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playWin } from '@/lib/puzzleSound';

interface WinOverlayProps {
  moveCount: number;
  elapsedTime: number;
  imageUrl: string;
  stars: number;
  onRestart: () => void;
  onBackToLevels: () => void;
  onNextLevel?: () => void;
  hasNextLevel?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 简单的烟花粒子
function Particles() {
  const [particles] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 50 + (Math.random() - 0.5) * 80,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.5,
      color: ['#C4463A', '#D4A574', '#8B6914', '#2C7A4A', '#C4463A'][Math.floor(Math.random() * 5)],
    }));
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.5],
            x: `${p.x}%`,
            y: `${p.y}%`,
          }}
          transition={{
            duration: 1.5,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

function StarDisplay({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5 justify-center">
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={i <= count ? '#D4A017' : 'rgba(139, 134, 128, 0.3)'}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function WinOverlay({
  moveCount,
  elapsedTime,
  imageUrl,
  stars,
  onRestart,
  onBackToLevels,
  onNextLevel,
  hasNextLevel,
}: WinOverlayProps) {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    playWin();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowParticles(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(44, 44, 44, 0.6)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative flex flex-col items-center gap-5 p-8 mx-4 rounded-xl max-w-[360px] w-full"
        style={{
          backgroundColor: '#F5F0E8',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        {showParticles && <Particles />}

        {/* 印章"完成" */}
        <motion.div
          initial={{ rotate: -30, scale: 0 }}
          animate={{ rotate: -8, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          className="absolute -top-6 -right-3 flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            border: '3px solid #C4463A',
            borderRadius: 6,
            color: '#C4463A',
            fontFamily: "'ZCOOL KuaiLe', cursive",
            fontSize: 22,
            backgroundColor: 'rgba(245, 240, 232, 0.95)',
          }}
        >
          完成
        </motion.div>

        {/* 完成图片 */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-52 h-52 rounded-lg overflow-hidden"
          style={{ boxShadow: '0 4px 16px rgba(60, 50, 40, 0.2)' }}
        >
          <img src={imageUrl} alt="完成" className="w-full h-full object-cover" />
        </motion.div>

        {/* 统计 */}
        <div className="text-center">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl mb-3"
            style={{ fontFamily: "'ZCOOL KuaiLe', cursive", color: '#2C2C2C' }}
          >
            拼图成功！
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-2"
          >
            <StarDisplay count={stars} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#C4463A' }}>{moveCount}</p>
              <p className="text-xs" style={{ color: '#8B8680' }}>步数</p>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: '#D0C9BE' }} />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#C4463A' }}>{formatTime(elapsedTime)}</p>
              <p className="text-xs" style={{ color: '#8B8680' }}>用时</p>
            </div>
          </motion.div>
        </div>

        {/* 按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-2 w-full"
        >
          <button
            onClick={onBackToLevels}
            className="flex-1 min-w-[80px] py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: '#E8E0D0',
              color: '#2C2C2C',
              border: '1px solid rgba(60, 50, 40, 0.15)',
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            选关
          </button>
          {hasNextLevel && onNextLevel && (
            <button
              onClick={onNextLevel}
              className="flex-1 min-w-[80px] py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: '#2C7A4A',
                color: '#FFF',
                fontFamily: "'Noto Serif SC', serif",
                boxShadow: '0 2px 8px rgba(44, 122, 74, 0.3)',
              }}
            >
              下一关
            </button>
          )}
          <button
            onClick={onRestart}
            className="flex-1 min-w-[80px] py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: '#C4463A',
              color: '#FFF',
              fontFamily: "'Noto Serif SC', serif",
              boxShadow: '0 2px 8px rgba(196, 70, 58, 0.3)',
            }}
          >
            再来一局
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
