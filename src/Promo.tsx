import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import * as manifest from './media-manifest';
import {CaptionTrack} from './CaptionTrack';
import {PhoneFrame} from './PhoneFrame';
import {ReviewOverlay} from './ReviewOverlay';
import {Scenes} from './Scenes';
import {SceneShell} from './SceneShell';
import {TIMELINE} from './timeline';

/**
 * DSHA 宣传片 v2 · 主组件
 * ============================================================
 * 遍历 TIMELINE（唯一真源）出 Sequence：场景画面 + 字幕 + 旁白 + 切换音效。
 *   - 画面：generated → Scenes.tsx；其余 → PhoneFrame（录屏优先，缺失回退 mock）
 *   - 字幕：CaptionTrack 与 Sequence 同起止（序列内帧驱动，帧级对齐）
 *   - 旁白：manifest.VOICE[id].exists 才挂 <Audio>（静音占位段不挂）
 *   - 音效：index>0 的场景切换处挂 whoosh（SFX_FILES 里有才挂）
 *   - 审片层：review 为 true 时挂 ReviewOverlay（母版干净无此层）
 */

/** 场景切换音效：generate_sfx.py 产物里的 whoosh */
const WHOOSH = manifest.SFX_FILES.find((f) => f.toLowerCase().includes('whoosh'));

export const Promo: FC<{review?: boolean}> = ({review = false}) => {
  return (
    <AbsoluteFill>
      {TIMELINE.map(({scene, index, from, durationInFrames}) => {
        const voice = manifest.VOICE[scene.id];
        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames} name={scene.name}>
            <SceneShell>
              {scene.source === 'generated' ? <Scenes scene={scene} /> : <PhoneFrame scene={scene} />}
            </SceneShell>
            <CaptionTrack scene={scene} />
            {voice?.exists ? <Audio src={staticFile(voice.file)} /> : null}
            {index > 0 && WHOOSH ? <Audio src={staticFile(WHOOSH)} /> : null}
          </Sequence>
        );
      })}
      {review ? <ReviewOverlay /> : null}
    </AbsoluteFill>
  );
};
