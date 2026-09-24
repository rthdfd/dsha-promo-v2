import type {FC} from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as manifest from './media-manifest';
import type {Scene} from './timeline';
import {FONT_MONO, FONT_SANS, theme} from './theme';

/**
 * DSHA 宣传片 v2 · 'generated' 类场景画面（代码生成，无录屏依赖）
 * ============================================================
 * P0 仅 s5b-cta：star 增长曲线 + 仓库名 + 二维码 + 版本号。
 * 其余 generated id 走 GeneratedFallback（P1/P3 扩展时按 id 加分支）。
 */

/** star 增长数据点（口径：docs/facts.md —— GitHub API / star-history 快照，截至 2026-09-24） */
const STAR_POINTS: {date: string; stars: number; day: number}[] = [
  {date: '08-14', stars: 1, day: 0},
  {date: '08-15', stars: 43, day: 1},
  {date: '08-21', stars: 103, day: 7},
  {date: '09-16', stars: 500, day: 33},
  {date: '09-23', stars: 594, day: 40},
  {date: '09-24', stars: 616, day: 41},
];
const MAX_STARS = 650; // 曲线纵向上限（sqrt 缩放仅为可视；数值以各点标注为准）
const DAY_SPAN = 41; // 08-14 → 09-24

// 曲线几何（chart 面板内坐标）
const CH_W = 860;
const CH_H = 430;
const PAD_L = 76;
const PAD_R = 36;
const PAD_T = 46;
const PAD_B = 64;

const xOf = (day: number) => PAD_L + (day / DAY_SPAN) * (CH_W - PAD_L - PAD_R);
const yOf = (stars: number) => PAD_T + (1 - Math.sqrt(stars / MAX_STARS)) * (CH_H - PAD_T - PAD_B);

const polyPoints = STAR_POINTS.map((p) => `${xOf(p.day)},${yOf(p.stars)}`).join(' ');

const CtaScene: FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // 曲线绘制：pathLength=1 归一化后动画 strokeDashoffset
  const draw = interpolate(frame, [10, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeIn = (delay: number) =>
    spring({frame: Math.max(0, frame - delay), fps, config: {damping: 18, mass: 0.8, stiffness: 90}});

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 56, padding: '0 90px'}}>
      {/* 左：star 增长曲线 */}
      <div
        style={{
          width: CH_W + 72,
          background: 'rgba(18,24,38,0.86)',
          border: '1px solid rgba(154,167,199,0.16)',
          borderRadius: 28,
          padding: 36,
          opacity: fadeIn(0),
          transform: `translateY(${interpolate(fadeIn(0), [0, 1], [36, 0])}px)`,
        }}
      >
        <div style={{fontFamily: FONT_SANS, fontSize: 30, fontWeight: 700, color: theme.text}}>Star 增长 · 40 天破 600</div>
        <div style={{fontFamily: FONT_MONO, fontSize: 16, color: theme.sub, marginTop: 6, marginBottom: 10}}>
          {scene.captionNote}
        </div>
        <svg width={CH_W} height={CH_H} style={{display: 'block'}}>
          {/* 网格线 */}
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <line
              key={r}
              x1={PAD_L}
              x2={CH_W - PAD_R}
              y1={PAD_T + r * (CH_H - PAD_T - PAD_B)}
              y2={PAD_T + r * (CH_H - PAD_T - PAD_B)}
              stroke="rgba(154,167,199,0.12)"
              strokeWidth={1}
            />
          ))}
          {/* 基线 */}
          <line x1={PAD_L} x2={CH_W - PAD_R} y1={CH_H - PAD_B} y2={CH_H - PAD_B} stroke="rgba(154,167,199,0.3)" strokeWidth={1.5} />
          {/* 曲线 */}
          <polyline
            points={polyPoints}
            fill="none"
            stroke={theme.accent}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
          {/* 数据点 */}
          {STAR_POINTS.map((p, i) => {
            const pop = spring({frame: Math.max(0, frame - (24 + i * 8)), fps, config: {damping: 14, mass: 0.6, stiffness: 140}});
            const last = i === STAR_POINTS.length - 1;
            return (
              <g key={p.date} opacity={pop}>
                <circle cx={xOf(p.day)} cy={yOf(p.stars)} r={last ? 9 : 6} fill={last ? theme.good : theme.accent} />
                <text
                  x={xOf(p.day)}
                  y={yOf(p.stars) - 16}
                  textAnchor="middle"
                  fill={last ? theme.good : theme.text}
                  fontFamily={FONT_MONO}
                  fontSize={last ? 26 : 19}
                  fontWeight={last ? 700 : 400}
                >
                  {p.stars}★
                </text>
                <text
                  x={xOf(p.day)}
                  y={CH_H - PAD_B + 26}
                  textAnchor="middle"
                  fill={theme.sub}
                  fontFamily={FONT_MONO}
                  fontSize={15}
                >
                  {p.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 右：仓库名 + 版本 + 二维码 */}
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: fadeIn(14), transform: `translateY(${interpolate(fadeIn(14), [0, 1], [36, 0])}px)`}}>
        <div style={{fontFamily: FONT_SANS, fontSize: 46, fontWeight: 800, color: theme.text, letterSpacing: 1}}>DSH-APP / DSHA</div>
        <div style={{fontFamily: FONT_MONO, fontSize: 22, color: theme.accent}}>v0.1.7-alpha2 · MIT 开源</div>
        {/* 二维码卡片：浅色底托深色码点（qr.png 为透明底） */}
        <div style={{background: '#f5f7fb', borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
          <Img src={staticFile(manifest.QR_FILE)} style={{width: 240, height: 240}} />
          <span style={{fontFamily: FONT_SANS, fontSize: 17, color: '#0b0e14', fontWeight: 600}}>扫码前往仓库</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 其他 generated 场景的兜底（P0 无） */
const GeneratedFallback: FC<{scene: Scene}> = ({scene}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 16}}>
    <div style={{fontFamily: FONT_SANS, fontSize: 40, fontWeight: 700, color: theme.text}}>{scene.name}</div>
    <div style={{fontFamily: FONT_MONO, fontSize: 22, color: theme.sub}}>generated 场景 · 画面待接（Scenes.tsx）</div>
  </AbsoluteFill>
);

/** 'generated' 类场景入口：按 scene.id 分分支 */
export const Scenes: FC<{scene: Scene}> = ({scene}) => {
  if (scene.id === 's5b-cta') return <CtaScene scene={scene} />;
  return <GeneratedFallback scene={scene} />;
};
