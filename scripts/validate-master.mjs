#!/usr/bin/env node
/**
 * DSHA 宣传片 v2 · 母版门禁（纯 node 无依赖，本地可跑 / CI 实跑）
 * ============================================================
 * 用法：node scripts/validate-master.mjs
 *
 * 门禁五项（全过 exit 0 打印 PASS；任一不过 exit 1 并打印缺项清单）：
 *   ① 素材齐全：正则解析 src/timeline.ts 的全部 asset 路径，逐个检查
 *      public/ 下存在（缺一即 FAIL 并点名；recordings/06-vscreen.mp4 必须在内）
 *   ② 无占位场景：timeline.ts 文本不得出现 source: 'placeholder'
 *   ③ 旁白齐全：public/assets/voice-report.json 的 failed/silent 必须为空
 *   ④ 生成物有效：media-manifest.ts 的 VOICE 全部 exists=true、SFX_FILES 非空
 *   ⑤ 字幕无 TODO：扫 timeline.ts
 */
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

// ---- ① timeline.ts 素材存在性 ----
const timelinePath = path.join(repoRoot, 'src', 'timeline.ts');
let timelineSrc = '';
try {
  timelineSrc = readFileSync(timelinePath, 'utf8');
} catch (err) {
  problems.push(`无法读取 src/timeline.ts：${err.message}`);
}

const assets = [...new Set([...timelineSrc.matchAll(/asset:\s*'([^']+)'/g)].map((m) => m[1]))];
if (assets.length === 0) {
  problems.push('timeline.ts 未解析到任何 asset 路径（正则失配？）');
}
if (!assets.includes('recordings/06-vscreen.mp4')) {
  problems.push('timeline.ts 的 asset 列表中缺少 recordings/06-vscreen.mp4（母版必须包含虚拟屏素材位）');
}
for (const a of assets) {
  if (!existsSync(path.join(repoRoot, 'public', a))) {
    problems.push(`素材缺失：${a}（public/${a} 不存在）`);
  }
}

// ---- ② 母版不允许占位场景 ----
if (/source:\s*'placeholder'/.test(timelineSrc)) {
  problems.push("timeline.ts 仍含 source: 'placeholder'（母版不允许占位场景；素材到位后由 Lead 改为 'recording'）");
}

// ---- ③ voice-report.json：failed/silent 必须为空 ----
const reportPath = path.join(repoRoot, 'public', 'assets', 'voice-report.json');
if (!existsSync(reportPath)) {
  problems.push('public/assets/voice-report.json 缺失（generate_voice.py 未跑？）');
} else {
  try {
    const rep = JSON.parse(readFileSync(reportPath, 'utf8'));
    const failed = Array.isArray(rep.failed) ? rep.failed : [];
    const silent = Array.isArray(rep.silent) ? rep.silent : [];
    for (const id of failed) problems.push(`旁白 TTS 失败：${id}（voice-report.json failed）`);
    for (const id of silent) problems.push(`旁白为静音占位：${id}（voice-report.json silent）`);
  } catch (err) {
    problems.push(`voice-report.json 解析失败：${err.message}`);
  }
}

// ---- ④ media-manifest.ts：VOICE 全 exists=true + SFX_FILES 非空（正则解析）----
const manifestPath = path.join(repoRoot, 'src', 'media-manifest.ts');
if (!existsSync(manifestPath)) {
  problems.push('src/media-manifest.ts 缺失（prepare-assets.mjs 未跑？）');
} else {
  const src = readFileSync(manifestPath, 'utf8');
  const voiceBlock = src.match(/export const VOICE[\s\S]*?\n};/)?.[0] ?? '';
  const voiceEntries = [...voiceBlock.matchAll(/'([^']+)':\s*\{file:\s*'([^']+)',\s*exists:\s*(true|false)\}/g)];
  if (voiceEntries.length === 0) {
    problems.push('media-manifest.ts 的 VOICE 解析为空（格式漂移？）');
  }
  for (const [, id, file, exists] of voiceEntries) {
    if (exists !== 'true') {
      problems.push(`旁白非真实语音：${id}（manifest VOICE exists=false，file=${file}）`);
    }
  }
  const sfxBlock = src.match(/export const SFX_FILES[^\]]*\]/)?.[0] ?? '';
  const sfxFiles = [...sfxBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (sfxFiles.length === 0) {
    problems.push('SFX_FILES 为空（public/assets/sfx/ 无 .wav，generate_sfx.py 未跑？）');
  }
}

// ---- ⑤ 字幕无 TODO ----
if (/TODO/.test(timelineSrc)) {
  problems.push('timeline.ts 残留 TODO（字幕/旁白定稿前不许渲母版）');
}

// ---- 汇总 ----
if (problems.length > 0) {
  console.error('========================================');
  console.error(' MASTER GATE FAIL（母版门禁未通过，拒渲）');
  console.error('========================================');
  for (const p of problems) console.error(` ❌ ${p}`);
  console.error(`----------------------------------------`);
  console.error(` 共 ${problems.length} 项待解决`);
  process.exit(1);
}

console.log('========================================');
console.log(' MASTER GATE PASS（母版门禁全部通过）');
console.log('========================================');
console.log(` 素材 ${assets.length} 段齐全（含 06-vscreen.mp4）· 无占位场景 · 旁白全真 · 音效非空 · 字幕无 TODO`);
process.exit(0);
