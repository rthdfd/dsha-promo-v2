import type {FC} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from './timeline';
import {FONT_MONO, FONT_SANS, theme} from './theme';

/**
 * 主字幕（下三分之一位）+ 口径小字（captionNote）。
 * ============================================================
 * 与所在 Sequence 同起止：本组件只在 Sequence 内渲染，useCurrentFrame 即
 * 序列内帧，spring 入场从第 0 帧起算 —— 字幕与场景帧级对齐，无手写帧数。
 */
export const CaptionTrack: FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 16, mass: 0.7, stiffness: 110}});
  const y = interpolate(enter, [0, 1], [48, 0]);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 96, pointerEvents: 'none'}}>
      <div style={{transform: `translateY(${y}px)`, opacity: enter, textAlign: 'center', maxWidth: 1500}}>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 54,
            fontWeight: 700,
            color: theme.text,
            textShadow: '0 2px 18px rgba(0,0,0,0.65)',
            letterSpacing: 1,
          }}
        >
          {scene.caption}
        </div>
        {scene.captionNote ? (
          <div style={{fontFamily: FONT_MONO, fontSize: 22, color: theme.sub, marginTop: 12}}>{scene.captionNote}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
