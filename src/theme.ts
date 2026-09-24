/**
 * DSHA 宣传片 v2 · 视觉主题（深色）
 * ============================================================
 * 唯一色板/字体出处；组件禁止散落硬编码颜色（改配色只改本文件）。
 * 中文字体依赖 CI 安装的 fonts-noto-cjk（render.yml 有apt 步骤）。
 */
export const theme = {
  /** 页面底色 */
  bg: '#0b0e14',
  /** 面板底 */
  panel: '#121826',
  /** 主题强调色 */
  accent: '#4d9fff',
  /** 主文字 */
  text: '#e8eefc',
  /** 次要文字 */
  sub: '#9aa7c7',
  /** 正向状态 */
  good: '#3ddc97',
  /** 警示状态 */
  warn: '#ffb020',
  /** 危险状态 */
  bad: '#ff5c6c',
} as const;

/** 中文无衬线（正文/字幕/标题） */
export const FONT_SANS = '"Noto Sans CJK SC", "Noto Sans SC", sans-serif';

/** 中文等宽（终端 / 时间码 / 口径小字） */
export const FONT_MONO = '"Noto Sans Mono CJK SC", "Noto Sans Mono", monospace';
