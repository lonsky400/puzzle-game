/**
 * useAudio — 水墨风音效 Hook
 * 
 * 使用 Web Audio API 生成音效：
 * - 选中：清脆的"叮"声（高频短音）
 * - 交换：木鱼/竹筒声（中频敲击）
 * - 合并：水滴汇入声（渐强共鸣）
 * - 胜利：编钟和弦（庄重悠长）
 */

import { useCallback, useRef, useEffect } from 'react';

export type SoundType = 'select' | 'swap' | 'merge' | 'win' | 'cancel';

interface AudioContextType extends AudioContext {}

export function useAudio() {
  const audioContextRef = useRef<AudioContextType | null>(null);
  const enabledRef = useRef(true);

  // 初始化 AudioContext（需要用户交互后才能播放）
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // 生成水墨风音效
  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;
    
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'select': {
        // 清脆的"叮"声 - 高频短音，像毛笔轻触宣纸
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'swap': {
        // 木鱼/竹筒声 - 中频敲击，像棋子落盘
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'merge': {
        // 水滴汇入声 - 渐强共鸣，像墨滴晕染
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(330, now); // E4
        osc1.frequency.linearRampToValueAtTime(440, now + 0.3);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.linearRampToValueAtTime(550, now + 0.3);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
        break;
      }

      case 'win': {
        // 编钟和弦 - 庄重悠长，五声音阶
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (宫商角徵)
        
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          
          gain.gain.setValueAtTime(0, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 1.5);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 1.5);
        });
        break;
      }

      case 'cancel': {
        // 取消声 - 低沉短促
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
    }
  }, []);

  // 切换音效开关
  const toggleSound = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    return enabledRef.current;
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  return {
    initAudio,
    playSound,
    toggleSound,
    isEnabled,
  };
}
