import type {FC} from 'react';
import {Composition} from 'remotion';
import {Promo} from './Promo';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './timeline';

/**
 * DSHA 宣传片 v2 · 根组件
 * ============================================================
 * 双 Composition（沿用老工程"审片兜底、母版门禁"模式）：
 *   DSHA-Promo-Review —— 审片版：DRAFT 叠层 + 时间码 + 占位标注，缺素材也能渲
 *   DSHA-Promo-Master —— 母版：干净成片；CI 侧由 validate-master.mjs 门禁把关
 *
 * 帧数/尺寸唯一真源是 src/timeline.ts，此处只做注册，禁手写帧数。
 */
const PromoReview: FC = () => <Promo review />;
const PromoMaster: FC = () => <Promo />;

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id="DSHA-Promo-Review"
        component={PromoReview}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="DSHA-Promo-Master"
        component={PromoMaster}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
