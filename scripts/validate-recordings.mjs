#!/usr/bin/env node
/**
 * DSHA 宣传片 v2 · 录屏素材入库校验（素材官负责维护）
 * ============================================================
 * 用法：
 *   node scripts/validate-recordings.mjs [recordingsDir]
 *   （不带参数时默认校验 <repo>/public/recordings/）
 *
 * 校验内容（入库四查 + 收集进度报告）：
 *   ① 命名白名单：目录中的 .mp4 必须命中清单命名（与 src/timeline.ts 的 asset 一致）
 *   ② 存在且非空：白名单内逐个检查存在性；空文件（0 字节）判异常
 *   ③ 大小 sanity：> 200KB 且 < 300MB（过小多为损坏/截断，过大多为误传）
 *   ④ 扩展名：白名单外仅允许 .gitkeep；其余文件判异常
 *   另：目录中的子目录（如 c-adb/）跳过、仅信息提示，不参与判定
 *
 * 输出：通过 / 缺失 / 异常三张清单 + 汇总行。
 * exit code：0 = 全部通过（含 06-vscreen 外部素材到位）
 *            1 = 存在缺失文件（素材未齐）
 *            2 = 无缺失，但存在异常（命名/大小/扩展名不符）
 *
 * ⚠️ 深度检查不在此脚本（本地无 ffmpeg，且禁重活）：
 *   分辨率（1080p+/竖屏）、时长（12-20s/段）、有无声轨、帧率/编码
 *   由 CI 用 ffprobe 审计（工程师的 CI 管线负责），本脚本只做
 *   文件系统层面的入库校验 + 收集进度报告。
 *
 * 说明：06-vscreen.mp4 为外部提供素材（委托人安排他人录制），
 * 未到位时按"缺失"正常报告——母版门禁要求素材齐，审片版不强制。
 */

import { statSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** 白名单：与 docs/录屏清单.md 及 src/timeline.ts 的 asset 字段一一对应 */
const EXPECTED_FILES = [
  '01-coldstart.mp4',
  '02-webgui.mp4',
  '03-terminal.mp4',
  '04-floating.mp4',
  '05-adb.mp4',
  '06-vscreen.mp4', // 外部提供，等待中（委托人安排他人录制）
  '07-guard.mp4',
  '08-backup.mp4',
  '09-selfcheck.mp4',
  '10-plugins.mp4',
];

/** 非白名单但允许存在的文件（目录占位等） */
const ALLOWED_EXTRA = new Set(['.gitkeep']);

const MIN_BYTES = 200 * 1024; // 200KB
const MAX_BYTES = 300 * 1024 * 1024; // 300MB

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const recordingsDir = path.resolve(process.argv[2] ?? path.join(repoRoot, 'public', 'recordings'));

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

const pass = []; // { name, size }
const missing = []; // name
const invalid = []; // { name, reason }
const skippedDirs = []; // name

if (!existsSync(recordingsDir)) {
  console.error(`[FATAL] 目录不存在：${recordingsDir}`);
  process.exit(2);
}

// ---- ①④ 扫描目录：清单外文件 / 异物 / 子目录 ----
let entries;
try {
  entries = readdirSync(recordingsDir, { withFileTypes: true });
} catch (err) {
  console.error(`[FATAL] 无法读取目录 ${recordingsDir}：${err.message}`);
  process.exit(2);
}

const expectedSet = new Set(EXPECTED_FILES);
for (const entry of entries) {
  if (entry.isDirectory()) {
    skippedDirs.push(entry.name);
    continue;
  }
  const name = entry.name;
  if (ALLOWED_EXTRA.has(name)) continue;
  if (expectedSet.has(name)) continue; // 白名单文件在下面按存在性逐个查
  const ext = path.extname(name).toLowerCase();
  if (ext === '.mp4') {
    invalid.push({ name, reason: '清单外文件：命名不在白名单（疑似误传/旧素材，请删除或改名）' });
  } else {
    invalid.push({ name, reason: `不允许的文件：扩展名 ${ext || '(无)'}（仅接受 .mp4 与 .gitkeep）` });
  }
}

// ---- ②③ 白名单逐个校验 ----
for (const name of EXPECTED_FILES) {
  const full = path.join(recordingsDir, name);
  let st;
  try {
    st = statSync(full);
  } catch {
    missing.push(name);
    continue;
  }
  if (!st.isFile()) {
    invalid.push({ name, reason: '不是普通文件（是目录？）' });
    continue;
  }
  if (st.size === 0) {
    invalid.push({ name, reason: '空文件（0 字节，上传可能中断）' });
    continue;
  }
  if (st.size < MIN_BYTES) {
    invalid.push({ name, reason: `过小：${humanSize(st.size)} < 200KB（可能损坏/截断）` });
    continue;
  }
  if (st.size > MAX_BYTES) {
    invalid.push({ name, reason: `过大：${humanSize(st.size)} > 300MB（超过 sanity 上限，确认是否误传）` });
    continue;
  }
  pass.push({ name, size: st.size });
}

// ---- 输出 ----
console.log(`录屏素材入库校验：${recordingsDir}`);
console.log('');

console.log(`✅ 通过（${pass.length}/${EXPECTED_FILES.length}）`);
for (const p of pass) console.log(`   ${p.name}  ${humanSize(p.size)}`);
if (pass.length === 0) console.log('   （无）');

console.log(`❌ 缺失（${missing.length}）`);
for (const m of missing) console.log(`   ${m}`);
if (missing.length === 0) console.log('   （无）');

console.log(`⚠️  异常（${invalid.length}）`);
for (const i of invalid) console.log(`   ${i.name} —— ${i.reason}`);
if (invalid.length === 0) console.log('   （无）');

if (skippedDirs.length > 0) {
  console.log(`ℹ️  子目录（跳过，不参与判定）：${skippedDirs.join(', ')}`);
}

console.log('');
console.log('提示：深度检查（分辨率/时长/有声/编码）本地无 ffmpeg 不在此脚本，由 CI ffprobe 审计负责。');

// ---- exit code：缺失优先 ----
if (missing.length > 0) {
  console.log(`[结果] 素材未齐：缺 ${missing.length} 段（母版门禁不会放行）。`);
  process.exit(1);
}
if (invalid.length > 0) {
  console.log(`[结果] 素材齐全但有 ${invalid.length} 个异常，请修正后重跑。`);
  process.exit(2);
}
console.log('[结果] 全部通过：10 段素材齐全且符合入库规范。');
process.exit(0);
