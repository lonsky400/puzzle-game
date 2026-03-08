#!/usr/bin/env node
/**
 * 将 client/public 下 comic、erciyuan 的 png/jpeg 转为 webp（体积更小，加载更快）
 * 当 resources 源目录不存在时可用此脚本从现有 public 图生成 webp
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'client/public');
const WEBP_QUALITY = 82;

async function run() {
  const sharp = (await import('sharp')).default;

  for (const dirName of ['comic', 'erciyuan']) {
    const dir = path.join(PUBLIC, dirName);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((n) => /\.(png|jpe?g)$/i.test(n) && !n.endsWith('.webp'));
    console.log(`\n${dirName}: ${files.length} files -> webp`);

    for (const name of files) {
      const srcPath = path.join(dir, name);
      const base = path.basename(name, path.extname(name));
      const outPath = path.join(dir, `${base}.webp`);

      try {
        const buf = await sharp(srcPath).webp({ quality: WEBP_QUALITY }).toBuffer();
        fs.writeFileSync(outPath, buf);
        console.log(`  ${name} -> ${base}.webp (${(buf.length / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.warn('  skip', name, e.message);
      }
    }
  }

  console.log('\nDone. Use .webp in levelConfig.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
