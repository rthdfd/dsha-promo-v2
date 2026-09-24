import type {FC, ReactNode} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FONT_SANS, theme} from './theme';

/**
 * 场景外壳：深色底 + 缓慢漂移的渐变光晕 + 细网格 + 暗角，children 居中。
 * 所有场景（PhoneFrame / Scenes）均包在本组件内，保证全片底色一致。
 * 动效只用场景内帧（Sequence 内 useCurrentFrame 即序列内帧），天然同步。
 */
export const SceneShell: FC<{children: ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  // 光晕水平位置：240 帧一个来回（任何场景时长内都有缓慢运动感）
  const glowX = interpolate((frame % 240) / 240, [0, 0.5, 1], [22, 78, 22]);
  const glow = `radial-gradient(55% 70% at ${glowX}% -10%, rgba(77,159,255,0.16), transparent 62%)`;
  const grid =
    'repeating-linear-gradient(0deg, rgba(154,167,199,0.05) 0 1px, transparent 1px 64px),' +
    'repeating-linear-gradient(90deg, rgba(154,167,199,0.05) 0 1px, transparent 1px 64px)';
  const vignette = 'radial-gradient(120% 100% at 50% 45%, transparent 58%, rgba(0,0,0,0.38) 100%)';
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, fontFamily: FONT_SANS}}>
      <AbsoluteFill style={{backgroundImage: `${glow}, ${grid}, ${vignette}`}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
