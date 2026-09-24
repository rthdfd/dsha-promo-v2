import {Config} from '@remotion/cli/config';

// DSHA 宣传片 v2 · Remotion 配置
// 渲染规格（1920×1080 / 30fps / 帧数）的唯一真源是 src/timeline.ts，此处只配入口与输出行为。
Config.setEntryPoint('./src/index.ts');
Config.setOverwriteOutput(true);
