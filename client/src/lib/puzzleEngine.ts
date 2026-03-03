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
   * 核心交换逻辑：
   * 
   * 整组拖拽交换规则：
   * 1. 获取拖拽起点所在的组 A
   * 2. 按偏移量 (rowOff, colOff) 计算组 A 的新位置
   * 3. 收集目标区域（新位置覆盖的范围）内所有被占据的位置及其拼图块
   * 4. 将组 A 整体移动到新位置，将目标区域的块移动到组 A 的原位置
   * 5. 如果越界、内部重叠或槽位不足，退化为单块交换
   */
  swap(fromPos: number, toPos: number): boolean {
    const fromPieceId = this.positionMap[fromPos];
    const toPieceId = this.positionMap[toPos];

    if (fromPieceId === -1 || toPieceId === -1) return false;
    if (this.uf.connected(fromPieceId, toPieceId)) return false;

    const fromGroup = this.uf.getGroupMembers(fromPieceId);
    
    // 计算偏移量
    const fromRow = Math.floor(fromPos / this.gridSize);
    const fromCol = fromPos % this.gridSize;
    const toRow = Math.floor(toPos / this.gridSize);
    const toCol = toPos % this.gridSize;
    const rowOff = toRow - fromRow;
    const colOff = toCol - fromCol;

    // 尝试整组交换（组大小 > 1 时才尝试）
    if (fromGroup.length > 1) {
      const fromPositions = fromGroup.map(id => this.pieces[id].currentPos);
      
      // 计算组 A 的新位置
      const newFromPositions = fromPositions.map(p => {
        const r = Math.floor(p / this.gridSize) + rowOff;
        const c = (p % this.gridSize) + colOff;
        if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) return -1;
        return r * this.gridSize + c;
      });

      // 检查是否有越界
      if (newFromPositions.every(p => p !== -1)) {
        // 收集目标区域内的所有拼图块（去重，同一组的只算一次）
        const targetPieceIds = new Set<number>();
        const newFromPosSet = new Set(newFromPositions);
        
        for (const newPos of newFromPositions) {
          const pieceId = this.positionMap[newPos];
          if (pieceId !== -1 && !this.uf.connected(pieceId, fromPieceId)) {
            targetPieceIds.add(this.uf.find(pieceId)); // 用根节点代表整组
          }
        }

        // 收集目标组的所有块及其位置
        const targetGroups: number[][] = [];
        for (const rootId of Array.from(targetPieceIds)) {
          targetGroups.push(this.uf.getGroupMembers(rootId));
        }

        // 计算目标组需要移动到的位置（组 A 的原位置）
        const targetOldPositions: number[] = [];
        for (const group of targetGroups) {
          for (const pieceId of group) {
            targetOldPositions.push(this.pieces[pieceId].currentPos);
          }
        }

        // 检查：目标组的总块数必须等于组 A 的块数（位置一一对应）
        if (targetOldPositions.length === fromGroup.length) {
          // 检查新位置是否有重叠（组 A 的新位置之间不能重叠）
          const newPosSet = new Set(newFromPositions);
          if (newPosSet.size === newFromPositions.length) {
            // 执行整组交换
            // 1. 移动组 A 到新位置
            for (let i = 0; i < fromGroup.length; i++) {
              this.pieces[fromGroup[i]].currentPos = newFromPositions[i];
            }
            
            // 2. 移动目标组到组 A 的原位置
            let posIdx = 0;
            for (const group of targetGroups) {
              for (const pieceId of group) {
                this.pieces[pieceId].currentPos = fromPositions[posIdx++];
              }
            }

            this.rebuildPositionMap();
            this.rebuildUnionFind();
            this.moveCount++;
            this.checkWin();
            return true;
          }
        }
      }
    }

    // 退化为单块交换：直接交换 fromPos 和 toPos 上的两个块
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
