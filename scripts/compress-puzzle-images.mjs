#!/usr/bin/env node
/**
 * 压缩拼图资源图片：resources/二次元美女、resources/漫画连载
 * 最长边 ≤ 1024px，PNG 压缩，JPEG quality 85，覆盖原文件并同步到 client/public
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const MAX_SIZE = 1024; // 最长边像素
const JPEG_QUALITY = 85;
const PNG_COMPRESSION = 9;
const WEBP_QUALITY = 82; // WebP 用于 client/public，体积更小、加载更快

const DIRS = [
  { src: path.join(ROOT, 'resources/二次元美女'), publicDir: 'erciyuan', publicExt: null },
  { src: path.join(ROOT, 'resources/漫画连载'), publicDir: 'comic', publicExt: 'png' },
];

async function compress() {
  const sharp = (await import('sharp')).default;

  for (const { src, publicDir, publicExt } of DIRS) {
    if (!fs.existsSync(src)) {
      console.warn('Skip (not found):', src);
      continue;
    }

    const publicOut = path.join(ROOT, 'client/public', publicDir);
    fs.mkdirSync(publicOut, { recursive: true });

    const names = fs.readdirSync(src).filter((n) => /\.(png|jpe?g|webp)$/i.test(n));
    console.log(`\n${path.basename(src)}: ${names.length} files`);

    for (const name of names) {
      const srcPath = path.join(src, name);
      const ext = path.extname(name).toLowerCase();
      const base = path.basename(name, ext);

      const originalSize = fs.statSync(srcPath).size;
      const num = base.match(/\d+/)?.[0] || base;
      try {
        const resized = sharp(srcPath)
          .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true });

        // 写回 resources：保持 png/jpeg 格式
        let bufSource;
        if (ext === '.jpg' || ext === '.jpeg') {
          bufSource = await resized.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
        } else {
          bufSource = await resized.clone().png({ compressionLevel: PNG_COMPRESSION, effort: 10 }).toBuffer();
        }
        fs.writeFileSync(srcPath, bufSource);

        // client/public 输出 WebP，体积更小、加载更快
        const bufWebp = await resized.webp({ quality: WEBP_QUALITY }).toBuffer();
        const publicPath = path.join(publicOut, `${publicDir === 'erciyuan' ? 'erciyuan' : 'comic'}-${num}.webp`);
        fs.writeFileSync(publicPath, bufWebp);

        const saved = originalSize > 0 ? ((1 - bufWebp.length / originalSize) * 100).toFixed(0) : 0;
        console.log(`  ${name} -> webp ${(bufWebp.length / 1024).toFixed(0)} KB (saved ~${saved}%)`);
      } catch (e) {
        console.warn('  skip', name, e.message);
      }
    }
  }

  console.log('\nDone. resources/ and client/public updated.');
}

compress().catch((e) => {
  console.error(e);
  process.exit(1);
});
