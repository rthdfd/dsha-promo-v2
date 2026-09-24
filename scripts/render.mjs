#!/usr/bin/env node
/**
 * DSHA 宣传片 v2 · 渲染入口（本地/CI 通用）
 * ============================================================
 * 用法：node scripts/render.mjs [review|master]（默认 review）
 *
 *   review → DSHA-Promo-Review 合成，out/dsha-promo-v2-review.mp4，crf=24
 *   master → DSHA-Promo-Master 合成，out/dsha-promo-v2-master.mp4，crf=17
 *
 * 编码契约（与 CI 一致）：h264 + yuv420p + 192k 音频。
 * 母版必须先过 scripts/validate-master.mjs 门禁（package.json render:master 已串联）。
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const TARGETS = {
  review: {comp: 'DSHA-Promo-Review', out: 'dsha-promo-v2-review.mp4', crf: '24'},
  master: {comp: 'DSHA-Promo-Master', out: 'dsha-promo-v2-master.mp4', crf: '17'},
};

const target = (process.argv[2] ?? 'review').toLowerCase();
const cfg = TARGETS[target];
if (!cfg) {
  console.error(`[render] 未知目标：${target}（仅支持 review|master）`);
  process.exit(2);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = [
  'remotion',
  'render',
  'src/index.ts',
  cfg.comp,
  path.join('out', cfg.out),
  '--codec=h264',
  '--pixel-format=yuv420p',
  `--crf=${cfg.crf}`,
  '--audio-bitrate=192k',
];

console.log(`[render] target=${target} comp=${cfg.comp} crf=${cfg.crf}`);
console.log(`[render] npx ${args.join(' ')}`);

const r = spawnSync('npx', args, {stdio: 'inherit', cwd: repoRoot});
if (r.error) {
  console.error(`[render] 无法启动 npx：${r.error.message}`);
  process.exit(1);
}
process.exit(r.status ?? 1);
