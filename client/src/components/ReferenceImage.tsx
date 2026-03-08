/**
 * ReferenceImage — 参考图预览组件
 * 
 * 点击可展开/收起参考图
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferenceImageProps {
  imageUrl: string;
}

export default function ReferenceImage({ imageUrl }: ReferenceImageProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* 小缩略图 */}
      <button
        onClick={() => setExpanded(true)}
        className="relative overflow-hidden rounded transition-all active:scale-95"
        style={{
          width: 52,
          height: 52,
          boxShadow: '0 2px 8px rgba(60, 50, 40, 0.15)',
          border: '2px solid rgba(196, 70, 58, 0.4)',
        }}
      >
        <img src={imageUrl} alt="参考图" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        </div>
      </button>

      {/* 展开的大图 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(44, 44, 44, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative rounded-lg overflow-hidden mx-8"
              style={{
                maxWidth: 320,
                boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={imageUrl} alt="参考图" className="w-full h-auto" />
              <div
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => setExpanded(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 py-2 text-center text-xs"
                style={{ backgroundColor: 'rgba(44, 44, 44, 0.7)', color: '#E8E0D0' }}
              >
                点击任意处关闭
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
