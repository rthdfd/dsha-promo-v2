import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as manifest from './media-manifest';
import {TIMELINE} from './timeline';
import {FONT_MONO, FONT_SANS, theme} from './theme';

/**
 * 审片叠层（仅 Review Composition 挂载，母版干净无此层）
 * ============================================================
 * 全局帧算当前场景（遍历 TIMELINE 找 from<=frame<to）：
 *   左上：场景名 + id + 序号        右上：DRAFT · 审片版
 *   右下：时间码 mm:ss:ff           左下：素材角标（占位空位/录屏缺失）
 *   顶部：TTS 失败横幅（manifest.TTS_FAILED 时）
 */
const pad = (n: number) => String(n).padStart(2, '0');

export const ReviewOverlay: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const span = TIMELINE.find((s) => frame >= s.from && frame < s.to) ?? TIMELINE[TIMELINE.length - 1];
  const {scene, index} = span;

  const totalSec = Math.floor(frame / fps);
  const timecode = `${pad(Math.floor(totalSec / 60))}:${pad(totalSec % 60)}:${pad(frame % fps)}`;

  const recExists = !!(scene.asset && manifest.RECORDINGS[scene.asset]?.exists);
  const badge =
    scene.source === 'placeholder'
      ? recExists
        ? null
        : '占位空位 · 素材待提供'
      : scene.source === 'recording' && !recExists
        ? '录屏缺失 · 素材待录入'
        : null;

  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: FONT_SANS}}>
      {/* 左上：当前场景 */}
      <div style={{position: 'absolute', top: 48, left: 32}}>
        <div style={{fontSize: 20, fontWeight: 700, color: theme.accent}}>{scene.name}</div>
        <div style={{fontFamily: FONT_MONO, fontSize: 13, color: theme.sub, marginTop: 4}}>
          {scene.id} · {index + 1}/{TIMELINE.length}
        </div>
      </div>

      {/* 右上：DRAFT */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 32,
          color: theme.warn,
          border: `1px solid ${theme.warn}`,
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 15,
          letterSpacing: 3,
          fontWeight: 600,
        }}
      >
        DRAFT · 审片版
      </div>

      {/* 右下：时间码 */}
      <div
        style={{
          position: 'absolute',
          right: 32,
          bottom: 28,
          color: theme.text,
          fontFamily: FONT_MONO,
          fontSize: 22,
          background: 'rgba(11,14,20,0.72)',
          padding: '6px 12px',
          borderRadius: 8,
        }}
      >
        {timecode}
      </div>

      {/* 左下：素材角标 */}
      {badge ? (
        <div
          style={{
            position: 'absolute',
            left: 32,
            bottom: 28,
            color: theme.warn,
            fontFamily: FONT_MONO,
            fontSize: 15,
            background: 'rgba(11,14,20,0.72)',
            padding: '6px 12px',
            borderRadius: 8,
          }}
        >
          {badge}
        </div>
      ) : null}

      {/* 顶部：TTS 失败横幅 */}
      {manifest.TTS_FAILED ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: theme.bad,
            color: '#fff',
            textAlign: 'center',
            padding: '8px 0',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          TTS 失败 · 静音占位
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
