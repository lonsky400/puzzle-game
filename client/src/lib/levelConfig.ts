/**
 * 关卡与主题配置 — 四大主题，每主题 70 关
 * 新手村 1-10(3×3)、进阶区 11-25(4×4)、挑战区 26-40(5×5)、大师区 41-55(6×6)、王者区 56-70(7×7)
 * 开发环境：无解锁门槛，道具无限量
 */

export type ThemeId = 'retro' | 'marvel' | 'guofeng' | 'landscape';

/** 每主题总关数 */
export const TOTAL_LEVELS = 70;

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  /** 主题选择页封面图 */
  coverImageUrl: string;
  /** 该主题下关卡使用的图片池（按关卡索引取） */
  imageUrls: string[];
}

/** 根据关卡序号(1-70)得到网格阶数 */
export function getGridSizeForLevel(levelIndex: number): number {
  if (levelIndex <= 10) return 3;
  if (levelIndex <= 25) return 4;
  if (levelIndex <= 40) return 5;
  if (levelIndex <= 55) return 6;
  return 7;
}

/** 关卡区间名称 */
export function getZoneName(levelIndex: number): string {
  if (levelIndex <= 10) return '新手村';
  if (levelIndex <= 25) return '进阶区';
  if (levelIndex <= 40) return '挑战区';
  if (levelIndex <= 55) return '大师区';
  return '王者区';
}

export function isBossLevel(levelIndex: number): boolean {
  return levelIndex % 10 === 0;
}

export function isPanoramaLevel(levelIndex: number): boolean {
  return levelIndex === 50;
}

/** 单关展示用信息（不依赖图片加载） */
export interface LevelInfo {
  themeId: ThemeId;
  levelIndex: number;
  gridSize: number;
  name: string;
  zoneName: string;
  isBoss: boolean;
  isPanorama: boolean;
  imageUrl: string;
  thumbnailUrl: string;
}

const GUOFENG_IMGS = [
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-1-f3jViPGAbKdjUnVhbmATvF.webp',
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-2-me66SyANWK8Dtp7wK3ytnN.webp',
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-3-N5zFytSfaCvy4N8ub7jMKv.webp',
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-4-NUqogFR4toNUZtpxpCABCg.webp',
];

/** 四大主题封面图（年代感/风景/漫画用本地图，国风用项目 CDN） */
const getBaseUrl = () => (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';

/** 漫画连载主题关卡图（15 张循环使用） */
const COMIC_IMGS = Array.from({ length: 15 }, (_, i) => `${getBaseUrl()}comic/comic-${i + 1}.png`);

const THEME_COVERS: Record<ThemeId, string> = {
  retro: `${getBaseUrl()}theme-cover-retro.png`,
  marvel: `${getBaseUrl()}theme-cover-comic.png`,
  guofeng:
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663028373717/gXcdKD4ijsoo6c6S8DJhhB/puzzle-img-3-N5zFytSfaCvy4N8ub7jMKv.webp',
  landscape: `${getBaseUrl()}theme-cover-landscape.jpg`,
};

/** 四大主题（开发环境用同一批图循环） */
export const THEMES: ThemeInfo[] = [
  { id: 'retro', name: '年代感', coverImageUrl: THEME_COVERS.retro, imageUrls: GUOFENG_IMGS },
  { id: 'marvel', name: '漫画连载', coverImageUrl: THEME_COVERS.marvel, imageUrls: COMIC_IMGS },
  { id: 'guofeng', name: '国风动画', coverImageUrl: THEME_COVERS.guofeng, imageUrls: GUOFENG_IMGS },
  { id: 'landscape', name: '风景大片', coverImageUrl: THEME_COVERS.landscape, imageUrls: GUOFENG_IMGS },
];

const LEVEL_NAMES: Record<ThemeId, string[]> = {
  retro: Array.from({ length: TOTAL_LEVELS }, (_, i) => `年代关 ${i + 1}`),
  marvel: Array.from({ length: TOTAL_LEVELS }, (_, i) => `漫画关 ${i + 1}`),
  guofeng: ['齐天大圣', '山水画卷', '祥龙腾云', '古街集市', ...Array.from({ length: TOTAL_LEVELS - 4 }, (_, i) => `国风关 ${i + 5}`)],
  landscape: Array.from({ length: TOTAL_LEVELS }, (_, i) => `风景关 ${i + 1}`),
};

/** 获取某一主题下某一关的 LevelInfo */
export function getLevelInfo(themeId: ThemeId, levelIndex: number): LevelInfo {
  const theme = THEMES.find((t) => t.id === themeId);
  const imageUrls = theme?.imageUrls ?? GUOFENG_IMGS;
  const imgIndex = (levelIndex - 1) % imageUrls.length;
  const imageUrl = imageUrls[imgIndex];
  const names = LEVEL_NAMES[themeId];
  const name = names[levelIndex - 1] ?? `第 ${levelIndex} 关`;
  return {
    themeId,
    levelIndex,
    gridSize: getGridSizeForLevel(levelIndex),
    name,
    zoneName: getZoneName(levelIndex),
    isBoss: isBossLevel(levelIndex),
    isPanorama: isPanoramaLevel(levelIndex),
    imageUrl,
    thumbnailUrl: imageUrl,
  };
}

/** 某主题下 1..70 关的 LevelInfo 列表 */
export function getLevelsForTheme(themeId: ThemeId): LevelInfo[] {
  return Array.from({ length: TOTAL_LEVELS }, (_, i) => getLevelInfo(themeId, i + 1));
}

/** 星级判定（基于步数，开发环境不扣使用道具） */
export function computeStars(moveCount: number, gridSize: number, _usedHint?: boolean): number {
  const base = gridSize * gridSize * 2;
  if (moveCount <= Math.max(3, base * 0.5)) return 3;
  if (moveCount <= base * 1.2) return 2;
  return 1;
}
