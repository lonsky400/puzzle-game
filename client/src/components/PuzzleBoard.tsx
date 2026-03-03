/**
 * PuzzleBoard — 拼图游戏画板组件
 * 
 * 交互模式：
 * - 点击选中 → 再点击目标 → 交换
 * - 按住拖动 → 释放到目标 → 交换
 * 
 * 使用 mousedown/mouseup/mousemove + touch 事件
 * 不使用 setPointerCapture（会干扰 click 事件）
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PuzzleEngine } from '@/lib/puzzleEngine';
import { useAudio } from '@/hooks/useAudio';

interface PuzzleBoardProps {
  engine: PuzzleEngine;
  imageUrl: string;
  showNumbers: boolean;
  onMove: () => void;
  onWin: () => void;
}

export default function PuzzleBoard({ engine, imageUrl, showNumbers, onMove, onWin }: PuzzleBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const rafRef = useRef<number>(0);
  const [, forceRender] = useState(0);

  // 音效
  const { initAudio, playSound } = useAudio();
  const audioInitializedRef = useRef(false);

  // 选中状态
  const selectedPosRef = useRef<number>(-1);
  const prevGroupCountRef = useRef<number>(0);

  // 拖拽状态
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef(-1);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragCurrentXRef = useRef(0);
  const dragCurrentYRef = useRef(0);
  const dragGroupRef = useRef<number[]>([]);
  const dragGroupPosRef = useRef<number[]>([]);
  const dragHoverPosRef = useRef(-1);
  const dragThresholdMetRef = useRef(false);

  const getCanvasSize = useCallback(() => {
    return Math.min(window.innerWidth - 32, 500);
  }, []);

  const [canvasSize, setCanvasSize] = useState(getCanvasSize);

  useEffect(() => {
    const handleResize = () => setCanvasSize(getCanvasSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getCanvasSize]);

  // 加载图片
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => {
        imageRef.current = img2;
        setImageLoaded(true);
      };
      img2.src = imageUrl;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // 屏幕坐标转网格位置
  const screenToGrid = useCallback((clientX: number, clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const gridSize = engine.gridSize;
    const gap = Math.max(3, Math.round(canvasSize * 0.008));
    const cellSize = (canvasSize - gap * (gridSize + 1)) / gridSize;

    const col = Math.floor((x - gap / 2) / (cellSize + gap));
    const row = Math.floor((y - gap / 2) / (cellSize + gap));

    if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) return -1;
    return row * gridSize + col;
  }, [canvasSize, engine]);

  // 将屏幕像素偏移转换为 canvas 逻辑坐标偏移
  const screenToCanvasOffset = useCallback((screenDx: number, screenDy: number): { dx: number; dy: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { dx: screenDx, dy: screenDy };
    const rect = canvas.getBoundingClientRect();
    return {
      dx: screenDx * (canvasSize / rect.width),
      dy: screenDy * (canvasSize / rect.height),
    };
  }, [canvasSize]);

  const doSwap = useCallback((fromPos: number, toPos: number) => {
    const groupCountBefore = engine.getGroupCount();
    const success = engine.swap(fromPos, toPos);
    if (success) {
      const groupCountAfter = engine.getGroupCount();
      
      // 播放交换音效
      playSound('swap');
      
      // 检测是否有合并发生（组数减少）
      if (groupCountAfter < groupCountBefore) {
        setTimeout(() => playSound('merge'), 50);
      }
      
      onMove();
      forceRender(n => n + 1);
      if (engine.isComplete) {
        setTimeout(() => {
          playSound('win');
          onWin();
        }, 400);
      }
    }
    return success;
  }, [engine, onMove, onWin, playSound]);

  // 统一的交互处理
  const handleInteractionStart = useCallback((clientX: number, clientY: number) => {
    // 初始化音频（首次用户交互时）
    if (!audioInitializedRef.current) {
      initAudio();
      audioInitializedRef.current = true;
    }

    if (engine.isComplete) return;

    const pos = screenToGrid(clientX, clientY);
    if (pos === -1) return;

    const pieceId = engine.getPieceAtPos(pos);
    if (pieceId === -1) return;

    const groupMembers = engine.uf.getGroupMembers(pieceId);
    const groupPositions = groupMembers.map(id => engine.getPiece(id).currentPos);

    isDraggingRef.current = true;
    dragStartPosRef.current = pos;
    dragStartXRef.current = clientX;
    dragStartYRef.current = clientY;
    dragCurrentXRef.current = clientX;
    dragCurrentYRef.current = clientY;
    dragGroupRef.current = groupMembers;
    dragGroupPosRef.current = groupPositions;
    dragHoverPosRef.current = pos;
    dragThresholdMetRef.current = false;
  }, [engine, screenToGrid, initAudio]);

  const handleInteractionMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const dx = clientX - dragStartXRef.current;
    const dy = clientY - dragStartYRef.current;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      dragThresholdMetRef.current = true;
    }

    dragCurrentXRef.current = clientX;
    dragCurrentYRef.current = clientY;
    dragHoverPosRef.current = screenToGrid(clientX, clientY);
  }, [screenToGrid]);

  const handleInteractionEnd = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) {
      return;
    }

    const startPos = dragStartPosRef.current;
    const upPos = screenToGrid(clientX, clientY);

    if (dragThresholdMetRef.current) {
      // 拖拽模式：释放到目标位置
      if (upPos !== -1 && upPos !== startPos) {
        doSwap(startPos, upPos);
      } else {
        // 拖拽取消，播放取消音效
        playSound('cancel');
      }
      selectedPosRef.current = -1;
    } else {
      // 点击模式
      const clickedPos = upPos !== -1 ? upPos : startPos;
      const currentSel = selectedPosRef.current;
      
      if (currentSel >= 0 && currentSel !== clickedPos) {
        doSwap(currentSel, clickedPos);
        selectedPosRef.current = -1;
      } else if (currentSel === clickedPos) {
        // 取消选中
        playSound('cancel');
        selectedPosRef.current = -1;
      } else {
        // 新选中
        playSound('select');
        selectedPosRef.current = clickedPos;
      }
    }

    // 重置拖拽状态
    isDraggingRef.current = false;
    dragStartPosRef.current = -1;
    dragGroupRef.current = [];
    dragGroupPosRef.current = [];
    dragHoverPosRef.current = -1;
    dragThresholdMetRef.current = false;

    forceRender(n => n + 1);
  }, [screenToGrid, doSwap, playSound]);

  // 处理纯 click 事件（兼容 CDP 自动化和某些浏览器）
  const handleClick = useCallback((clientX: number, clientY: number) => {
    // 初始化音频
    if (!audioInitializedRef.current) {
      initAudio();
      audioInitializedRef.current = true;
    }

    if (engine.isComplete) return;

    const pos = screenToGrid(clientX, clientY);
    if (pos === -1) {
      selectedPosRef.current = -1;
      forceRender(n => n + 1);
      return;
    }

    const pieceId = engine.getPieceAtPos(pos);
    if (pieceId === -1) return;

    const currentSel = selectedPosRef.current;

    if (currentSel >= 0 && currentSel !== pos) {
      doSwap(currentSel, pos);
      selectedPosRef.current = -1;
    } else if (currentSel === pos) {
      playSound('cancel');
      selectedPosRef.current = -1;
    } else {
      playSound('select');
      selectedPosRef.current = pos;
    }

    forceRender(n => n + 1);
  }, [engine, screenToGrid, doSwap, playSound, initAudio]);

  // 标记是否通过mousedown/mouseup完成了交互
  const mouseHandledRef = useRef(false);

  // Mouse 事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      mouseHandledRef.current = true;
      handleInteractionStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      handleInteractionMove(e.clientX, e.clientY);
    };

    const onMouseUp = (e: MouseEvent) => {
      handleInteractionEnd(e.clientX, e.clientY);
    };

    const onClick = (e: MouseEvent) => {
      if (mouseHandledRef.current) {
        mouseHandledRef.current = false;
        return;
      }
      handleClick(e.clientX, e.clientY);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleInteractionStart, handleInteractionMove, handleInteractionEnd, handleClick]);

  // Touch 事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleInteractionStart(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleInteractionMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length < 1) return;
      const touch = e.changedTouches[0];
      handleInteractionEnd(touch.clientX, touch.clientY);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleInteractionStart, handleInteractionMove, handleInteractionEnd]);

  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvasSize;

    if (canvas.width !== Math.round(size * dpr) || canvas.height !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gridSize = engine.gridSize;
    const gap = Math.max(3, Math.round(size * 0.008));
    const cellSize = (size - gap * (gridSize + 1)) / gridSize;

    // 背景 - 宣纸暖白
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#E8E0D0';
    const bgR = 8;
    ctx.beginPath();
    ctx.moveTo(bgR, 0); ctx.lineTo(size - bgR, 0);
    ctx.quadraticCurveTo(size, 0, size, bgR);
    ctx.lineTo(size, size - bgR);
    ctx.quadraticCurveTo(size, size, size - bgR, size);
    ctx.lineTo(bgR, size);
    ctx.quadraticCurveTo(0, size, 0, size - bgR);
    ctx.lineTo(0, bgR);
    ctx.quadraticCurveTo(0, 0, bgR, 0);
    ctx.closePath();
    ctx.fill();

    // 绘制网格底色（空位指示）
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = gap + c * (cellSize + gap);
        const y = gap + r * (cellSize + gap);
        ctx.fillStyle = 'rgba(215, 208, 195, 0.4)';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    const isDragging = isDraggingRef.current && dragThresholdMetRef.current;
    const dragPosSet = new Set(isDragging ? dragGroupPosRef.current : []);
    const currentSelectedPos = selectedPosRef.current;

    // 高亮选中的块（朱砂红边框）
    if (currentSelectedPos >= 0 && !isDragging) {
      const selPieceId = engine.getPieceAtPos(currentSelectedPos);
      if (selPieceId !== -1) {
        const selGroup = engine.uf.getGroupMembers(selPieceId);
        for (const memberId of selGroup) {
          const memberPos = engine.getPiece(memberId).currentPos;
          const sr = Math.floor(memberPos / gridSize);
          const sc = memberPos % gridSize;
          const sx = gap + sc * (cellSize + gap);
          const sy = gap + sr * (cellSize + gap);
          ctx.fillStyle = 'rgba(196, 70, 58, 0.10)';
          ctx.fillRect(sx - 1, sy - 1, cellSize + 2, cellSize + 2);
          ctx.strokeStyle = '#C4463A';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(sx - 1, sy - 1, cellSize + 2, cellSize + 2);
        }
      }
    }

    // 拖拽时高亮目标位置
    if (isDragging && dragHoverPosRef.current >= 0 && dragHoverPosRef.current !== dragStartPosRef.current) {
      const hoverPieceId = engine.getPieceAtPos(dragHoverPosRef.current);
      if (hoverPieceId !== -1 && !dragGroupRef.current.includes(hoverPieceId)) {
        const hoverGroup = engine.uf.getGroupMembers(hoverPieceId);
        for (const memberId of hoverGroup) {
          const memberPos = engine.getPiece(memberId).currentPos;
          const hr = Math.floor(memberPos / gridSize);
          const hc = memberPos % gridSize;
          const hx = gap + hc * (cellSize + gap);
          const hy = gap + hr * (cellSize + gap);
          ctx.fillStyle = 'rgba(196, 70, 58, 0.08)';
          ctx.fillRect(hx, hy, cellSize, cellSize);
          ctx.strokeStyle = 'rgba(196, 70, 58, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(hx, hy, cellSize, cellSize);
          ctx.setLineDash([]);
        }
      }
    }

    // 绘制拼图块
    const drawPieceAt = (
      pieceId: number,
      pos: number,
      offsetX: number,
      offsetY: number,
      alpha: number = 1,
      scale: number = 1,
    ) => {
      const piece = engine.getPiece(pieceId);
      const row = Math.floor(pos / gridSize);
      const col = pos % gridSize;

      const baseX = gap + col * (cellSize + gap) + offsetX;
      const baseY = gap + row * (cellSize + gap) + offsetY;

      const srcW = img.naturalWidth / gridSize;
      const srcH = img.naturalHeight / gridSize;
      const srcX = piece.col * srcW;
      const srcY = piece.row * srcH;

      // 合并检测 — 相邻正确块之间消除间隙
      const mergedRight = col < gridSize - 1 && !engine.shouldShowBorder(pos, pos + 1);
      const mergedDown = row < gridSize - 1 && !engine.shouldShowBorder(pos, pos + gridSize);
      const mergedLeft = col > 0 && !engine.shouldShowBorder(pos, pos - 1);
      const mergedUp = row > 0 && !engine.shouldShowBorder(pos, pos - gridSize);

      const drawX = mergedLeft ? baseX - gap : baseX;
      const drawY = mergedUp ? baseY - gap : baseY;
      const drawW = cellSize + (mergedLeft ? gap : 0) + (mergedRight ? gap : 0);
      const drawH = cellSize + (mergedUp ? gap : 0) + (mergedDown ? gap : 0);

      const gapRatio = gap / cellSize;
      const sSrcX = srcX - (mergedLeft ? srcW * gapRatio : 0);
      const sSrcY = srcY - (mergedUp ? srcH * gapRatio : 0);
      const sSrcW = srcW + (mergedLeft ? srcW * gapRatio : 0) + (mergedRight ? srcW * gapRatio : 0);
      const sSrcH = srcH + (mergedUp ? srcH * gapRatio : 0) + (mergedDown ? srcH * gapRatio : 0);

      ctx.save();
      ctx.globalAlpha = alpha;

      if (scale !== 1) {
        const cx = drawX + drawW / 2;
        const cy = drawY + drawH / 2;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
      }

      // 圆角裁剪
      ctx.beginPath();
      const r = 3;
      ctx.moveTo(drawX + r, drawY);
      ctx.lineTo(drawX + drawW - r, drawY);
      ctx.quadraticCurveTo(drawX + drawW, drawY, drawX + drawW, drawY + r);
      ctx.lineTo(drawX + drawW, drawY + drawH - r);
      ctx.quadraticCurveTo(drawX + drawW, drawY + drawH, drawX + drawW - r, drawY + drawH);
      ctx.lineTo(drawX + r, drawY + drawH);
      ctx.quadraticCurveTo(drawX, drawY + drawH, drawX, drawY + drawH - r);
      ctx.lineTo(drawX, drawY + r);
      ctx.quadraticCurveTo(drawX, drawY, drawX + r, drawY);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sSrcX, sSrcY, sSrcW, sSrcH, drawX, drawY, drawW, drawH);
      ctx.restore();

      // 未合并边框 — 细线分隔
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(60, 50, 40, 0.15)';
      ctx.lineWidth = 0.8;
      if (!mergedUp) {
        ctx.beginPath(); ctx.moveTo(drawX, drawY); ctx.lineTo(drawX + drawW, drawY); ctx.stroke();
      }
      if (!mergedDown) {
        ctx.beginPath(); ctx.moveTo(drawX, drawY + drawH); ctx.lineTo(drawX + drawW, drawY + drawH); ctx.stroke();
      }
      if (!mergedLeft) {
        ctx.beginPath(); ctx.moveTo(drawX, drawY); ctx.lineTo(drawX, drawY + drawH); ctx.stroke();
      }
      if (!mergedRight) {
        ctx.beginPath(); ctx.moveTo(drawX + drawW, drawY); ctx.lineTo(drawX + drawW, drawY + drawH); ctx.stroke();
      }
      ctx.restore();

      // 数字角标
      if (showNumbers) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const numSize = Math.max(14, cellSize * 0.22);
        ctx.fillStyle = 'rgba(196, 70, 58, 0.92)';
        ctx.beginPath();
        ctx.arc(baseX + numSize * 0.8, baseY + numSize * 0.8, numSize * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${Math.round(numSize * 0.7)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(pieceId + 1), baseX + numSize * 0.8, baseY + numSize * 0.85);
        ctx.restore();
      }
    };

    // 绘制非拖拽块
    for (let pos = 0; pos < engine.totalPieces; pos++) {
      if (dragPosSet.has(pos)) continue;
      const pieceId = engine.getPieceAtPos(pos);
      if (pieceId === -1) continue;
      drawPieceAt(pieceId, pos, 0, 0);
    }

    // 绘制拖拽中的块（ghost + floating）
    if (isDragging && dragGroupRef.current.length > 0) {
      // 半透明 ghost 留在原位
      for (let i = 0; i < dragGroupRef.current.length; i++) {
        drawPieceAt(dragGroupRef.current[i], dragGroupPosRef.current[i], 0, 0, 0.2);
      }

      // 浮动块跟随鼠标/手指 — 使用 canvas 逻辑坐标偏移
      const screenDx = dragCurrentXRef.current - dragStartXRef.current;
      const screenDy = dragCurrentYRef.current - dragStartYRef.current;
      const { dx: canvasDx, dy: canvasDy } = screenToCanvasOffset(screenDx, screenDy);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      for (let i = 0; i < dragGroupRef.current.length; i++) {
        drawPieceAt(dragGroupRef.current[i], dragGroupPosRef.current[i], canvasDx, canvasDy, 1, 1.04);
      }

      ctx.restore();
    }

    // 完成状态 — 金色边框
    if (engine.isComplete) {
      ctx.strokeStyle = '#D4A017';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, size - 4, size - 4);
    }
  }, [canvasSize, engine, imageLoaded, showNumbers, screenToCanvasOffset]);

  // 动画循环
  useEffect(() => {
    const animate = () => {
      draw();
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="touch-none select-none"
        style={{
          width: canvasSize,
          height: canvasSize,
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(60, 50, 40, 0.18), inset 0 0 0 1px rgba(60, 50, 40, 0.06)',
        }}
      />
      {/* Loading 状态 */}
      {!imageLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(232, 224, 208, 0.9)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
              style={{ borderColor: '#C4463A', borderTopColor: 'transparent' }}
            />
            <span
              className="text-xs"
              style={{ color: '#8B8680', fontFamily: "'Noto Serif SC', serif" }}
            >
              画卷展开中...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
