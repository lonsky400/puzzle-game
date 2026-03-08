/**
 * 关卡进度存储（星级）
 * 开发环境：所有关卡默认已解锁，不设门槛
 */

import type { ThemeId } from './levelConfig';

const STORAGE_KEY = 'puzzle_level_stars';

export type StarsMap = Record<string, Record<number, number>>;

export function loadStars(): StarsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as StarsMap;
    return typeof data === 'object' && data !== null ? data : {};
  } catch {
    return {};
  }
}

export function saveStars(stars: StarsMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stars));
  } catch {
    // ignore
  }
}

export function getStarForLevel(stars: StarsMap, themeId: ThemeId, levelIndex: number): number {
  return stars[themeId]?.[levelIndex] ?? 0;
}

export function setStarForLevel(
  stars: StarsMap,
  themeId: ThemeId,
  levelIndex: number,
  star: number,
): StarsMap {
  const next = { ...stars };
  if (!next[themeId]) next[themeId] = {};
  next[themeId] = { ...next[themeId], [levelIndex]: Math.max(star, next[themeId][levelIndex] ?? 0) };
  return next;
}

/** 开发环境：所有关卡视为已解锁 */
export function isLevelUnlocked(
  _stars: StarsMap,
  _themeId: ThemeId,
  levelIndex: number,
): boolean {
  return levelIndex >= 1 && levelIndex <= 70;
}
