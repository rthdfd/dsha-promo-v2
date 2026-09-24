#!/usr/bin/env node
/**
 * DSHA 宣传片 v2 · 素材预备（CI 管线最后一步，渲染前执行）
 * ============================================================
 * 顺序契约（render.yml 与 package.json prepare:media 均已对齐）：
 *   generate_sfx.py → generate_voice.py → prepare-assets.mjs
 *   （manifest 要扫描 voice/sfx 产物，本脚本必须最后跑）
 *
 * 产物：
 *   ① src/media-manifest.ts（gitignored 生成物；组件只从它读素材存在性）
 *   ② public/assets/logo.png（上游 DSHA 仓库品牌图；失败→本地占位 logo）
 *   ③ public/assets/qr.png（qrcode 库，透明底 + 深色码点）
 *
 * logo 策略：git/trees API 发现候选（png/webp 优先，SVG 无法本地栅格化故跳过）
 *   → raw.githubusercontent.com 抓取；API 限流/失败时退回内置候选清单
 *   （2026-09-24 实测仓库布局）；全部失败→生成本地占位 logo 并标注。
 */
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import QRCode from 'qrcode';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(repoRoot, 'public');
const assetsDir = path.join(publicDir, 'assets');
const srcDir = path.join(repoRoot, 'src');

const REPO = 'DSH-APP/DSHA';
const QR_URL = `https://github.com/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main/`;

/** 内置 logo 候选：2026-09-24 查 git/trees API 实测的仓库布局（API 限流时兜底） */
const BUILTIN_LOGO_CANDIDATES = [
  'app/src/main/res/drawable-nodpi/dsha_brand.png',
  'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
  'app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
];

// ---------------------------------------------------------------- PNG 编码器
// （纯手写，无 sharp 等原生依赖：CI 只需 node 内置 zlib）

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** pixelFn(x, y) -> [r, g, b, a]（各 0-255） */
function encodePng(width, height, pixelFn) {
  const bpp = 4;
  const raw = Buffer.alloc((width * bpp + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, {level: 9})),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- logo

async function fetchWithTimeout(url, ms, headers) {
  const res = await fetch(url, {headers, signal: AbortSignal.timeout(ms)});
  return res;
}

async function discoverLogoCandidates() {
  const headers = {'User-Agent': 'dsha-promo-v2-prepare-assets', Accept: 'application/vnd.github+json'};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetchWithTimeout(`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`, 20000, headers);
    if (!res.ok) {
      console.warn(`[prepare-assets] git/trees API 返回 HTTP ${res.status}，改用内置候选清单`);
      return [];
    }
    const json = await res.json();
    const score = (p) => {
      const n = p.toLowerCase();
      if (!n.endsWith('.png') && !n.endsWith('.webp')) return 99; // SVG 无法本地栅格化
      if (/brand/.test(n)) return 0;
      if (/logo/.test(n)) return 1;
      if (/ic_launcher/.test(n) && n.includes('xxxhdpi')) return 2;
      if (/ic_launcher/.test(n)) return 3;
      return 4;
    };
    return (json.tree ?? [])
      .filter((t) => t.type === 'blob')
      .map((t) => t.path)
      .filter((p) => score(p) < 5)
      .sort((a, b) => score(a) - score(b) || a.length - b.length);
  } catch (err) {
    console.warn(`[prepare-assets] git/trees API 失败（${err.message}），改用内置候选清单`);
    return [];
  }
}

function writePlaceholderLogo() {
  const W = 512;
  const H = 512;
  const R = 112;
  const INSET = 96;
  const IR = 72;
  const accent = [0x4d, 0x9f, 0xff, 0xff]; // theme.accent
  const dark = [0x0b, 0x0e, 0x14, 0xff]; // theme.bg
  const png = encodePng(W, H, (x, y) => {
    const dx = Math.max(R - x, x - (W - 1 - R), 0);
    const dy = Math.max(R - y, y - (H - 1 - R), 0);
    if (dx * dx + dy * dy > R * R) return [0, 0, 0, 0];
    const ix = Math.max(IR - (x - INSET), x - INSET - (W - 1 - INSET - IR), 0);
    const iy = Math.max(IR - (y - INSET), y - INSET - (H - 1 - INSET - IR), 0);
    if (ix * ix + iy * iy <= IR * IR) return dark;
    return accent;
  });
  writeFileSync(path.join(assetsDir, 'logo.png'), png);
  console.warn('[prepare-assets] ⚠️ 未取到上游品牌图，已生成本地占位 logo（纯色圆角方形，标注：占位 logo）');
}

async function fetchLogo() {
  const discovered = await discoverLogoCandidates();
  const ordered = [...discovered, ...BUILTIN_LOGO_CANDIDATES];
  const tried = new Set();
  for (const p of ordered) {
    if (tried.has(p)) continue;
    tried.add(p);
    try {
      const res = await fetchWithTimeout(RAW_BASE + p, 20000, {'User-Agent': 'dsha-promo-v2-prepare-assets'});
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 256 || buf.length > 8 * 1024 * 1024) continue;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const isWebp = buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
      if (!isPng && !isWebp) continue;
      writeFileSync(path.join(assetsDir, 'logo.png'), buf);
      console.log(`[prepare-assets] logo 已抓取：${p}（${(buf.length / 1024).toFixed(1)}KB）→ public/assets/logo.png`);
      return;
    } catch (err) {
      console.warn(`[prepare-assets] logo 候选失败：${p}（${err.message}）`);
    }
  }
  writePlaceholderLogo();
}

// ---------------------------------------------------------------- 二维码

async function makeQr() {
  const qr = QRCode.create(QR_URL, {errorCorrectionLevel: 'M'});
  const mods = qr?.modules;
  const size = mods?.size;
  const data = mods?.data;
  if (typeof size !== 'number' || !data) {
    throw new Error(`qrcode.create 返回结构异常（modules.size=${size}）`);
  }
  const scale = 12; // 每模块像素
  const quiet = 4; // QR 规范静默边
  const dim = (size + quiet * 2) * scale;
  const dark = [0x0b, 0x0e, 0x14, 0xff]; // 深色码点（theme.bg）
  const png = encodePng(dim, dim, (x, y) => {
    const mx = Math.floor(x / scale) - quiet;
    const my = Math.floor(y / scale) - quiet;
    if (mx < 0 || my < 0 || mx >= size || my >= size) return [0, 0, 0, 0]; // 透明底
    return data[my * size + mx] ? dark : [0, 0, 0, 0];
  });
  writeFileSync(path.join(assetsDir, 'qr.png'), png);
  console.log(`[prepare-assets] 二维码已生成：public/assets/qr.png（${size}×${size} 模块 → ${dim}px，内容 ${QR_URL}）`);
}

// ---------------------------------------------------------------- manifest

const quote = (s) => `'${String(s).replace(/'/g, "\\'")}'`;

function renderManifest({recordings, voice, sfx, ttsFailed}) {
  const lines = [];
  lines.push('// AUTO-GENERATED by scripts/prepare-assets.mjs — 请勿手改（已被 .gitignore 忽略）');
  lines.push(`// 生成时间：${new Date().toISOString()}`);
  lines.push('// 契约：组件只从本文件读素材存在性；重建 = 重跑 node scripts/prepare-assets.mjs');
  lines.push('');
  lines.push('export const RECORDINGS: Record<string, {file: string; exists: boolean}> = {');
  for (const [k, v] of Object.entries(recordings)) {
    lines.push(`  ${quote(k)}: {file: ${quote(v.file)}, exists: ${v.exists}},`);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const VOICE: Record<string, {file: string; exists: boolean}> = {');
  for (const [k, v] of Object.entries(voice)) {
    lines.push(`  ${quote(k)}: {file: ${quote(v.file)}, exists: ${v.exists}},`);
  }
  lines.push('};');
  lines.push('');
  lines.push(`export const SFX_FILES: string[] = [${sfx.map(quote).join(', ')}];`);
  lines.push(`export const LOGO_FILE: string = ${quote('assets/logo.png')};`);
  lines.push(`export const QR_FILE: string = ${quote('assets/qr.png')};`);
  lines.push(`export const TTS_FAILED: boolean = ${ttsFailed};`);
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------- 主流程

async function main() {
  mkdirSync(assetsDir, {recursive: true});

  // ① timeline.ts 的 asset 路径（正则解析，与组件自动同步）
  const timelineSrc = readFileSync(path.join(srcDir, 'timeline.ts'), 'utf8');
  const recordingAssets = [...new Set([...timelineSrc.matchAll(/asset:\s*'([^']+)'/g)].map((m) => m[1]))];

  // ② narration.json 的场景 id 列表
  const narration = JSON.parse(readFileSync(path.join(srcDir, 'narration.json'), 'utf8'));
  const sceneIds = narration.map((n) => n.id);

  // ③ RECORDINGS：public/ 下存在性（key = timeline.ts 的 asset 路径）
  const recordings = {};
  for (const a of recordingAssets) {
    recordings[a] = {file: a, exists: existsSync(path.join(publicDir, a))};
  }

  // ④ VOICE：<id>.mp3 优先，其次 <id>.wav（generate_voice.py 的静音占位）
  const voice = {};
  for (const id of sceneIds) {
    const mp3 = `assets/voice/${id}.mp3`;
    const wav = `assets/voice/${id}.wav`;
    if (existsSync(path.join(publicDir, mp3))) voice[id] = {file: mp3, exists: true};
    else if (existsSync(path.join(publicDir, wav))) voice[id] = {file: wav, exists: true};
    else voice[id] = {file: mp3, exists: false};
  }

  // ⑤ SFX：扫 public/assets/sfx/*.wav
  const sfxDir = path.join(assetsDir, 'sfx');
  const sfx = existsSync(sfxDir)
    ? readdirSync(sfxDir)
        .filter((f) => f.toLowerCase().endsWith('.wav'))
        .sort()
        .map((f) => `assets/sfx/${f}`)
    : [];

  // ⑥ voice-report.json → TTS_FAILED（failed 或 silent 非空即视为 TTS 未全成，
  //    审片横幅"TTS 失败 · 静音占位"据此显示；母版门禁要求两者皆空）
  let ttsFailed = false;
  const reportPath = path.join(assetsDir, 'voice-report.json');
  if (existsSync(reportPath)) {
    try {
      const rep = JSON.parse(readFileSync(reportPath, 'utf8'));
      const failed = Array.isArray(rep.failed) ? rep.failed : [];
      const silent = Array.isArray(rep.silent) ? rep.silent : [];
      ttsFailed = failed.length > 0 || silent.length > 0;
      if (ttsFailed) {
        console.warn(`[prepare-assets] TTS 未全成：failed=${JSON.stringify(failed)} silent=${JSON.stringify(silent)}`);
      }
    } catch (err) {
      console.warn(`[prepare-assets] voice-report.json 解析失败（${err.message}），TTS_FAILED=false`);
    }
  } else {
    console.warn('[prepare-assets] voice-report.json 不存在（generate_voice.py 未跑？），TTS_FAILED=false');
  }

  // ⑦ logo + ⑧ 二维码
  await fetchLogo();
  await makeQr();

  // ⑨ 写 manifest（生成物，gitignored）
  writeFileSync(path.join(srcDir, 'media-manifest.ts'), renderManifest({recordings, voice, sfx, ttsFailed}));

  const recOk = Object.values(recordings).filter((r) => r.exists).length;
  const voiceOk = Object.values(voice).filter((v) => v.exists).length;
  console.log('[prepare-assets] manifest 已生成：src/media-manifest.ts');
  console.log(
    `  录屏 ${recOk}/${recordingAssets.length} · 旁白 ${voiceOk}/${sceneIds.length} · 音效 ${sfx.length} 个 · TTS_FAILED=${ttsFailed}`,
  );
}

main().catch((err) => {
  console.error(`[prepare-assets] 失败：${err?.stack ?? err}`);
  process.exit(1);
});
