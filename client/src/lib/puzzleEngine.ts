/**
 * PuzzleEngine — 核心拼图游戏引擎
 * 
 * 实现"你今天拼图了吗"的核心机制：
 * 1. 图片切割与打散
 * 2. 拖拽交换（单块 ↔ 单块，组 ↔ 组，单块 ↔ 组中的单块）
 * 3. 自动合并（并查集）
 * 4. 组的整体移动
 * 5. 数字角标
 * 6. 胜利检测
 */

export interface PuzzlePiece {
  id: number;           // 原始索引 (0 ~ n*n-1)
  currentPos: number;   // 当前在网格中的位置索引
  row: number;          // 原始行
  col: number;          // 原始列
}

export class UnionFind {
  parent: number[];
  rank: number[];
  size: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.size = new Array(n).fill(1);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) return false;
    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
      this.size[py] += this.size[px];
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
      this.size[px] += this.size[py];
    } else {
      this.parent[py] = px;
      this.size[px] += this.size[py];
      this.rank[px]++;
    }
    return true;
  }

  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }

  getGroupMembers(x: number): number[] {
    const root = this.find(x);
    const members: number[] = [];
    for (let i = 0; i < this.parent.length; i++) {
      if (this.find(i) === root) {
        members.push(i);
      }
    }
    return members;
  }

  getGroupSize(x: number): number {
    return this.size[this.find(x)];
  }
}

export class PuzzleEngine {
  gridSize: number;
  pieces: PuzzlePiece[];
  positionMap: number[];  // positionMap[pos] = pieceId
  uf: UnionFind;
  moveCount: number;
  isComplete: boolean;
  totalPieces: number;

  constructor(gridSize: number) {
    this.gridSize = gridSize;
    this.totalPieces = gridSize * gridSize;
    this.pieces = [];
    this.positionMap = [];
    this.uf = new UnionFind(this.totalPieces);
    this.moveCount = 0;
    this.isComplete = false;
    this.init();
  }

  init() {
    this.pieces = [];
    for (let i = 0; i < this.totalPieces; i++) {
      this.pieces.push({
        id: i,
        currentPos: i,
        row: Math.floor(i / this.gridSize),
        col: i % this.gridSize,
      });
    }

    this.shuffle();

    this.uf = new UnionFind(this.totalPieces);
    this.rebuildPositionMap();
    this.checkAllMerges();
    this.moveCount = 0;
    this.isComplete = false;
  }

  shuffle() {
    const positions = Array.from({ length: this.totalPieces }, (_, i) => i);
    
    // Fisher-Yates shuffle, ensure enough disorder
    let attempts = 0;
    do {
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      attempts++;
    } while (this.countCorrect(positions) > Math.max(1, this.totalPieces * 0.2) && attempts < 100);

    for (let i = 0; i < this.totalPieces; i++) {
      this.pieces[i].currentPos = positions[i];
    }
  }

  countCorrect(positions: number[]): number {
    let count = 0;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] === i) count++;
    }
    return count;
  }

  getPieceAtPos(pos: number): number {
    return this.positionMap[pos] ?? -1;
  }

  getPiece(id: number): PuzzlePiece {
    return this.pieces[id];
  }

  rebuildPositionMap() {
    this.positionMap = new Array(this.totalPieces).fill(-1);
    for (const piece of this.pieces) {
      this.positionMap[piece.currentPos] = piece.id;
    }
  }

  /**
   * 将组偏移量钳位到网格内，使组内所有块的目标坐标不越界。
   * 用于「吸附到最近合法位置」的越界保护。
   */
  private clampGroupOffset(fromPositions: number[], rowOff: number, colOff: number): { rowOff: number; colOff: number } {
    if (fromPositions.length === 0) return { rowOff: 0, colOff: 0 };
    let minR = this.gridSize, maxR = -1, minC = this.gridSize, maxC = -1;
    for (const p of fromPositions) {
      const r = Math.floor(p / this.gridSize);
      const c = p % this.gridSize;
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minC = Math.min(minC, c);
      maxC = Math.max(maxC, c);
    }
    let ro = rowOff;
    let co = colOff;
    if (minR + ro < 0) ro = -minR;
    if (maxR + ro >= this.gridSize) ro = this.gridSize - 1 - maxR;
    if (minC + co < 0) co = -minC;
    if (maxC + co >= this.gridSize) co = this.gridSize - 1 - maxC;
    return { rowOff: ro, colOff: co };
  }

  /**
   * 按偏移量计算组的目标网格坐标；若有越界则返回 null。
   */
  getGroupTargetPositions(fromPositions: number[], rowOff: number, colOff: number): number[] | null {
    const out: number[] = [];
    for (const p of fromPositions) {
      const r = Math.floor(p / this.gridSize) + rowOff;
      const c = (p % this.gridSize) + colOff;
      if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) return null;
      out.push(r * this.gridSize + c);
    }
    return out;
  }

  /**
   * 曼哈顿距离（用于独立块空位分配：最近优先）
   */
  private manhattan(posA: number, posB: number): number {
    const ra = Math.floor(posA / this.gridSize), ca = posA % this.gridSize;
    const rb = Math.floor(posB / this.gridSize), cb = posB % this.gridSize;
    return Math.abs(ra - rb) + Math.abs(ca - cb);
  }

  /**
   * 核心交换逻辑（对齐 Untitled-1.ini 图块组移动规则 — Group-Segmented Evacuation）：
   *
   * 主动组保持完整形状整体进入目标位置；被动组仅「重叠区」的块被剥离为独立块填入空位，
   * 「非重叠区」的块保留在原位（连通性在 rebuildUnionFind 后自然形成保留组/新子组）。
   */
  swap(fromPos: number, toPos: number): boolean {
    return this.swapWithFallback(fromPos, toPos);
  }

  /**
   * 滑入空位（经典滑动拼图规则）：仅当落点为空且起点与空位四方向相邻、且起点为单块时，该块滑入空位。
   * 对应关键帧场景：网格中有一个空槽，只有与空位相邻的那一块可以移入空位。
   */
  private slideIntoEmpty(fromPos: number, emptyPos: number, fromPieceId: number): boolean {
    const fromGroup = this.uf.getGroupMembers(fromPieceId);
    if (fromGroup.length !== 1) return false;
    if (this.manhattan(fromPos, emptyPos) !== 1) return false;

    this.pieces[fromPieceId].currentPos = emptyPos;
    this.rebuildPositionMap();
    this.rebuildUnionFind();
    this.moveCount++;
    this.checkWin();
    return true;
  }

  /** 越界或目标自交时退化为单块交换 */
  swapSingle(fromPos: number, toPos: number): boolean {
    const fromPieceId = this.positionMap[fromPos];
    const toPieceId = this.positionMap[toPos];
    if (fromPieceId === -1 || toPieceId === -1) return false;
    if (this.uf.connected(fromPieceId, toPieceId)) return false;

    const fromPiece = this.pieces[fromPieceId];
    const toPiece = this.pieces[toPieceId];
    const tempPos = fromPiece.currentPos;
    fromPiece.currentPos = toPiece.currentPos;
    toPiece.currentPos = tempPos;

    this.rebuildPositionMap();
    this.rebuildUnionFind();
    this.moveCount++;
    this.checkWin();
    return true;
  }

  /**
   * 图块组移动（Group-Segmented Evacuation，对齐 Untitled-2.ini）：
   *
   * STEP 1 目标占用 targetSlots = newFromPositions；STEP 2 识别碰撞 → coveredBlocks=stripped（孤儿块），其余=保留块。
   * 2.2.1–2.2.3 被覆盖块剥离为孤儿；保留块留在原位（连通性由 rebuildUnionFind 体现：单连通保留同组，多段拆成新组，空则组注销）。
   * 2.2.4 空位池 = 主动组「离开且未再占」的格（fromPositions \ newFromPositions）。被动目标块数少于主动组且不越界时，主动组会部分仍占原位，只释放非重叠格；保证主动组连续成组，被挤块独立填入上述空位。2.2.5 仅当孤儿数 === 空位数时执行，保证移动后无空位。
   * 场景2 主动组部分悬空：目标越界或自交时操作无效(return false)，不执行单块交换。步骤6 主动组落位；步骤7 合并检测。
   */
  swapWithFallback(fromPos: number, toPos: number): boolean {
    const fromPieceId = this.positionMap[fromPos];
    const toPieceId = this.positionMap[toPos];
    if (fromPieceId === -1) return false;

    if (toPieceId === -1) {
      return this.slideIntoEmpty(fromPos, toPos, fromPieceId);
    }

    const fromGroup = this.uf.getGroupMembers(fromPieceId);
    const fromPositions = fromGroup.map(id => this.pieces[id].currentPos);
    const toRow = Math.floor(toPos / this.gridSize);
    const toCol = toPos % this.gridSize;
    // 主动组视为整体：用组外接左上角为锚点计算偏移，与点击具体哪一块无关
    let anchorRow = this.gridSize, anchorCol = this.gridSize;
    for (const p of fromPositions) {
      anchorRow = Math.min(anchorRow, Math.floor(p / this.gridSize));
      anchorCol = Math.min(anchorCol, p % this.gridSize);
    }
    let rowOff = toRow - anchorRow;
    let colOff = toCol - anchorCol;
    const clamped = this.clampGroupOffset(fromPositions, rowOff, colOff);
    rowOff = clamped.rowOff;
    colOff = clamped.colOff;
    const newFromPositions = this.getGroupTargetPositions(fromPositions, rowOff, colOff);
    if (newFromPositions === null) return false;
    if (new Set(newFromPositions).size !== newFromPositions.length) return false;

    const stripped: number[] = [];
    for (const pos of newFromPositions) {
      const pieceId = this.positionMap[pos];
      if (pieceId === -1 || this.uf.connected(pieceId, fromPieceId)) continue;
      stripped.push(pieceId);
    }

    const newFromSet = new Set(newFromPositions);
    const freeSlots = fromPositions.filter(p => !newFromSet.has(p)).sort((a, b) => a - b);
    if (stripped.length > freeSlots.length) return false;
    if (stripped.length !== freeSlots.length) return false;

    const assigned = new Set<number>();
    const assignSlot = (pieceId: number): number => {
      const cur = this.pieces[pieceId].currentPos;
      let best = -1;
      let bestDist = Infinity;
      for (let i = 0; i < freeSlots.length; i++) {
        if (assigned.has(i)) continue;
        const d = this.manhattan(cur, freeSlots[i]);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    };
    const strippedWithSlots: { pieceId: number; slotIdx: number }[] = [];
    for (const pieceId of stripped) {
      const slotIdx = assignSlot(pieceId);
      if (slotIdx === -1) return false;
      assigned.add(slotIdx);
      strippedWithSlots.push({ pieceId, slotIdx });
    }
    for (const { pieceId, slotIdx } of strippedWithSlots) {
      this.pieces[pieceId].currentPos = freeSlots[slotIdx];
    }
    for (let i = 0; i < fromGroup.length; i++) {
      this.pieces[fromGroup[i]].currentPos = newFromPositions[i];
    }

    this.rebuildPositionMap();
    this.rebuildUnionFind();
    this.moveCount++;
    this.checkWin();
    return true;
  }

  /**
   * 完全重建并查集
   * 在每次交换后调用，确保合并状态正确
   */
  rebuildUnionFind() {
    this.uf = new UnionFind(this.totalPieces);
    this.checkAllMerges();
  }

  checkAllMerges() {
    let merged = true;
    while (merged) {
      merged = false;
      for (let pos = 0; pos < this.totalPieces; pos++) {
        const pieceId = this.positionMap[pos];
        if (pieceId === -1) continue;

        const row = Math.floor(pos / this.gridSize);
        const col = pos % this.gridSize;

        // 检查右邻
        if (col < this.gridSize - 1) {
          const rightPos = pos + 1;
          const rightPieceId = this.positionMap[rightPos];
          if (rightPieceId !== -1 && !this.uf.connected(pieceId, rightPieceId)) {
            const piece = this.pieces[pieceId];
            const rightPiece = this.pieces[rightPieceId];
            if (piece.row === rightPiece.row && piece.col + 1 === rightPiece.col) {
              this.uf.union(pieceId, rightPieceId);
              merged = true;
            }
          }
        }

        // 检查下邻
        if (row < this.gridSize - 1) {
          const downPos = pos + this.gridSize;
          const downPieceId = this.positionMap[downPos];
          if (downPieceId !== -1 && !this.uf.connected(pieceId, downPieceId)) {
            const piece = this.pieces[pieceId];
            const downPiece = this.pieces[downPieceId];
            if (piece.col === downPiece.col && piece.row + 1 === downPiece.row) {
              this.uf.union(pieceId, downPieceId);
              merged = true;
            }
          }
        }
      }
    }
  }

  shouldShowBorder(pos1: number, pos2: number): boolean {
    const pieceId1 = this.positionMap[pos1];
    const pieceId2 = this.positionMap[pos2];
    if (pieceId1 === -1 || pieceId2 === -1) return true;
    return !this.uf.connected(pieceId1, pieceId2);
  }

  checkWin(): boolean {
    for (const piece of this.pieces) {
      if (piece.currentPos !== piece.id) {
        this.isComplete = false;
        return false;
      }
    }
    this.isComplete = true;
    return true;
  }

  getProgress(): number {
    let correct = 0;
    for (const piece of this.pieces) {
      if (piece.currentPos === piece.id) correct++;
    }
    return Math.round((correct / this.totalPieces) * 100);
  }

  getGroupCount(): number {
    const roots = new Set<number>();
    for (let i = 0; i < this.totalPieces; i++) {
      roots.add(this.uf.find(i));
    }
    return roots.size;
  }
}
