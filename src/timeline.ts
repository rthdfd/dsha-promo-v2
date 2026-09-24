/**
 * DSHA 宣传片 v2 · 时间轴唯一真源
 * ============================================================
 * 纪律（任务书 §3 / §10）：改叙事只改本文件 + Scenes.tsx，禁止把帧数/时间写散。
 * 本文件只有 Lead 可改。任何代理发现 UI 事实与此不符，先报 Lead 统一。
 *
 * 画面来源（scene.source）：
 *   'recording'  → public/recordings/ 下的真实录屏（manifest 登记存在性，缺失时组件回退 mock）
 *   'mock'       → PhoneFrame.tsx 内按 v0.1.7-alpha2 当前实测重画的界面
 *   'generated'  → 代码生成画面（star 曲线 / 二维码 / logo 等，prepare-assets.mjs 产物）
 *   'placeholder'→ 占位空位：素材由委托人安排外部录制，到位前审片版显示占位框
 *
 * 字幕口径（scene.captionNote）：每个上字幕的数字必须带来源与口径日期，
 * 口径台账见 docs/facts.md；渲染日晚于口径超 3 天时由质检用 GitHub API 刷新。
 */
import narrationScript from './narration.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export type SceneSource = 'recording' | 'mock' | 'generated' | 'placeholder';

export interface Scene {
  /** 场景 id，同时是旁白 scripts→src/narration.json 里的键 */
  id: string;
  /** 场景显示名（分镜表 / 审片层标注用） */
  name: string;
  durationInFrames: number;
  source: SceneSource;
  /** public/ 下的相对路径，如 'recordings/01-coldstart.mp4' */
  asset?: string;
  /** 主字幕（与场景同起止，帧级对齐） */
  caption: string;
  /** 字幕小字：数字口径 / 来源 / 日期；无口径需求的场景留空 */
  captionNote?: string;
  narration: string;
  /** 分镜备注（制作说明，不上画面） */
  note?: string;
}

const N: Record<string, string> = Object.fromEntries(
  (narrationScript as { id: string; text: string }[]).map((n) => [n.id, n.text]),
);

export const SCENES: Scene[] = [
  {
    id: 's0-hook',
    name: 'Hook · 装完即用',
    durationInFrames: 150, // 5.0s
    source: 'recording',
    asset: 'recordings/01-coldstart.mp4',
    caption: '免 ROOT · 免 Termux · 装完即用',
    captionNote: '',
    narration: N['s0-hook'],
    note: '黑场字幕 → 点 DSHA 图标 → 解压进度 → READY 页。录屏缺失时回退 mock 冷启动流程。',
  },
  {
    id: 's1a-webgui',
    name: '能力一击 · Web GUI',
    durationInFrames: 150, // 5.0s
    source: 'recording',
    asset: 'recordings/02-webgui.mp4',
    caption: '完整 Ubuntu 24.04 · apt 随便用',
    captionNote: 'README · 2026-09',
    narration: N['s1a-webgui'],
    note: 'Web GUI（127.0.0.1:3080）对话与流式输出。界面细节以当前上游实测重画。',
  },
  {
    id: 's1b-terminal',
    name: '能力二击 · proroot 性能',
    durationInFrames: 150, // 5.0s
    source: 'recording',
    asset: 'recordings/03-terminal.mp4',
    caption: 'proroot 零 ptrace 开销，关键项实测 +58%',
    captionNote: 'README（vivo V2352A / Android 14）· 2026-09',
    narration: N['s1b-terminal'],
    note: '内置终端 apt install / vim / htop 真跑；+58% 数字必须带上游口径。',
  },
  {
    id: 's1c-floating',
    name: '能力三击 · 流式悬浮条',
    durationInFrames: 150, // 5.0s
    source: 'recording',
    asset: 'recordings/04-floating.mp4',
    caption: 'AI 输出，实时上屏',
    captionNote: '',
    narration: N['s1c-floating'],
    note: '流式悬浮条贴屏幕顶，显示执行中的命令原文。',
  },
  {
    id: 's2-adb',
    name: '高潮 · ADB 直连',
    durationInFrames: 450, // 15.0s
    source: 'recording',
    asset: 'recordings/05-adb.mp4',
    caption: '配一次 ADB，agent 直接操作这台手机',
    captionNote: 'README · 2026-09',
    narration: N['s2-adb'],
    note: 'ADB 配对 → agent 远程点击/截屏本机。C 方案截屏序列（public/recordings/c-adb/）可作补充画面。',
  },
  {
    id: 's3-vscreen',
    name: '高潮 · 实验性虚拟屏（占位空位）',
    durationInFrames: 450, // 15.0s
    source: 'placeholder',
    asset: 'recordings/06-vscreen.mp4',
    caption: '实验性虚拟屏：AI 在另一块屏幕替你操作 App',
    captionNote: 'v0.1.7-alpha2 · 2026-09-23',
    narration: N['s3-vscreen'],
    note: '★素材由委托人安排他人录制（本机为 Low 版构建，实测不支持虚拟屏）。到位前审片版显示占位框；母版门禁点名该文件，未到位不渲母版。',
  },
  {
    id: 's4a-guard',
    name: '信任 · 危险命令守门人',
    durationInFrames: 150, // 5.0s
    source: 'recording',
    asset: 'recordings/07-guard.mp4',
    caption: '危险操作，你说了算',
    captionNote: '',
    narration: N['s4a-guard'],
    note: 'rm -rf 被拦 → 通知/前台弹窗/悬浮条三渠道批准。',
  },
  {
    id: 's4b-backup',
    name: '信任 · 数据不丢',
    durationInFrames: 150, // 5.0s
    source: 'recording',
    asset: 'recordings/08-backup.mp4',
    caption: '卸载重装，数据不丢',
    captionNote: 'README · 2026-09',
    narration: N['s4b-backup'],
    note: '分范围备份（全量/只对话/只插件）+ 恢复前 CRC 体检。',
  },
  {
    id: 's4c-selfcheck',
    name: '信任 · 自检与自愈',
    durationInFrames: 150, // 5.0s
    source: 'recording',
    asset: 'recordings/09-selfcheck.mp4',
    caption: '23 项自检，一键修补',
    captionNote: 'README · 2026-09',
    narration: N['s4c-selfcheck'],
    note: '23 项自检 + 一键修补 + 15 个自愈脚本；Web 起不来直接点名插件。',
  },
  {
    id: 's5a-plugins',
    name: '生态 · 插件市场',
    durationInFrames: 300, // 10.0s
    source: 'recording',
    asset: 'recordings/10-plugins.mp4',
    caption: '插件生态，全部在 App 内完成',
    captionNote: 'dsh-web-mobile 3.0.1 · 2026-09',
    narration: N['s5a-plugins'],
    note: '插件管理页浏览/安装/启停 + dsh-web-mobile 移动端 UI（窄屏单栏+目录抽屉）。',
  },
  {
    id: 's5b-cta',
    name: '收尾 · CTA',
    durationInFrames: 450, // 15.0s
    source: 'generated',
    caption: 'DSHA v0.1.7-alpha2 · 616★ · MIT 开源',
    captionNote: '截至 2026-09-24 · github.com/DSH-APP/DSHA',
    narration: N['s5b-cta'],
    note: 'star 增长曲线 + 仓库名 + 二维码。star 为快照，上字幕必须带口径日期；口径过期由质检刷新。',
  },
];

export interface SceneSpan {
  scene: Scene;
  index: number;
  /** 起始帧（含） */
  from: number;
  durationInFrames: number;
  /** 结束帧（不含） */
  to: number;
}

/** 由 SCENES 的 durationInFrames 派生，禁止手写起始帧 */
export const TIMELINE: SceneSpan[] = (() => {
  let cursor = 0;
  return SCENES.map((scene, index) => {
    const span: SceneSpan = {
      scene,
      index,
      from: cursor,
      durationInFrames: scene.durationInFrames,
      to: cursor + scene.durationInFrames,
    };
    cursor += scene.durationInFrames;
    return span;
  });
})();

export const TOTAL_FRAMES = TIMELINE.reduce((sum, s) => sum + s.durationInFrames, 0);
export const DURATION_SECONDS = TOTAL_FRAMES / FPS;

// fail-fast：每个场景必须有一条旁白（CI 渲染期即暴露，不允许静默缺旁白）
SCENES.forEach((s) => {
  if (!s.narration) {
    throw new Error(`timeline.ts: 场景 ${s.id} 缺少旁白（src/narration.json）`);
  }
});

// fail-fast：帧数自洽（TOTAL_FRAMES 与 TIMELINE 末段一致）
const last = TIMELINE[TIMELINE.length - 1];
if (last.to !== TOTAL_FRAMES) {
  throw new Error(`timeline.ts: 帧数不自洽（last.to=${last.to}, TOTAL_FRAMES=${TOTAL_FRAMES}）`);
}
