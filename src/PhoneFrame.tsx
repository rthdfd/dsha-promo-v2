import type {CSSProperties, FC} from 'react';
import {OffthreadVideo, staticFile} from 'remotion';
import * as manifest from './media-manifest';
import type {Scene} from './timeline';
import {FONT_MONO, FONT_SANS, theme} from './theme';

/**
 * DSHA 宣传片 v2 · 手机外壳 + P0 占位 mock
 * ============================================================
 * 结构（P3 整块替换重画的接缝）：
 *   PhoneFrame       —— bezel/刘海/缩放定位，只负责外壳与视频嵌入
 *   MOCK_SCREENS     —— 按 scene.id 注册的 mock 映射表；P3 重画时只换这张表里的
 *                       组件（或整表替换），PhoneFrame 与 Promo 不用动
 *
 * 视频优先：manifest.RECORDINGS[scene.asset]?.exists 为 true 时嵌入真实录屏
 * （OffthreadVideo），否则回退当前 scene.id 的 mock。
 *
 * ⚠️ P0 mock 全部脱敏：假对话 / 假路径 / 假文件名，无 API Key、token、邮箱、
 *    个人路径、真实文件名。P3 按上游实测重画时保持同纪律。
 */

/** 手机内容区设计尺寸（逻辑 px，等比缩放后上屏） */
const SCREEN_W = 390;
const SCREEN_H = 844;
const SCALE = 0.94; // → 366.6 × 793.4，1080p 画布下留足字幕区
const BEZEL = 14;

const bezelStyle: CSSProperties = {
  width: SCREEN_W * SCALE + BEZEL * 2,
  height: SCREEN_H * SCALE + BEZEL * 2,
  borderRadius: 54,
  background: '#05070c',
  border: '2px solid #232b3d',
  boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(154,167,199,0.08)',
  position: 'relative',
  padding: BEZEL,
  boxSizing: 'border-box',
};

const screenStyle: CSSProperties = {
  width: SCREEN_W * SCALE,
  height: SCREEN_H * SCALE,
  borderRadius: 42,
  overflow: 'hidden',
  position: 'relative',
  background: theme.panel,
};

const notchStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 116,
  height: 26,
  borderRadius: 13,
  background: '#05070c',
  zIndex: 5,
};

// ---------------------------------------------------------------- mock 公共样式

const screenBase: CSSProperties = {
  width: SCREEN_W,
  height: SCREEN_H,
  background: theme.panel,
  color: theme.text,
  fontFamily: FONT_SANS,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

/** P0 占位标记：小字标注场景名，P3 重画后移除 */
const devBadge: CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 10,
  color: 'rgba(154,167,199,0.55)',
  letterSpacing: 1,
  padding: '6px 16px 0',
  flexShrink: 0,
};

const statusBar: CSSProperties = {
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 22px',
  fontSize: 12,
  color: theme.sub,
  fontFamily: FONT_MONO,
  flexShrink: 0,
};

const appTitle: CSSProperties = {
  padding: '8px 20px 12px',
  fontSize: 20,
  fontWeight: 700,
  color: theme.text,
  flexShrink: 0,
};

const body: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '4px 20px 20px',
  overflow: 'hidden',
};

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'rgba(232,238,252,0.04)',
  border: '1px solid rgba(154,167,199,0.14)',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  color: theme.text,
};

const monoLine: CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 12.5,
  lineHeight: 1.7,
  color: theme.sub,
  whiteSpace: 'pre-wrap',
};

const chip = (color: string): CSSProperties => ({
  fontFamily: FONT_MONO,
  fontSize: 12,
  color,
  border: `1px solid ${color}`,
  borderRadius: 999,
  padding: '3px 10px',
});

const btn = (color: string): CSSProperties => ({
  fontFamily: FONT_SANS,
  fontSize: 14,
  fontWeight: 600,
  color,
  border: `1px solid ${color}`,
  borderRadius: 10,
  padding: '8px 18px',
  background: 'transparent',
});

// ---------------------------------------------------------------- mock 组件（P0 占位，P3 重画）

type MockProps = {scene: Scene};

/** s0-hook 冷启动：图标 → 解压进度 → READY */
const MockColdstart: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>DSHA</span>
      <span>arm64 · Android 14</span>
    </div>
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: theme.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 1,
        }}
      >
        DSHA
      </div>
      <div style={{fontSize: 16, color: theme.text}}>DSHA</div>
      <div style={{fontSize: 12, color: theme.sub}}>正在解压运行时…</div>
      <div style={{width: 240, height: 8, borderRadius: 4, background: 'rgba(154,167,199,0.2)'}}>
        <div style={{width: '62%', height: '100%', borderRadius: 4, background: theme.accent}} />
      </div>
      <div style={{fontFamily: FONT_MONO, fontSize: 12, color: theme.sub}}>62%</div>
    </div>
    <div style={{...row, margin: '0 20px 24px', justifyContent: 'center', color: theme.good}}>
      ✓ 环境就绪 · READY
    </div>
  </div>
);

/** s1a-webgui：Web GUI 对话（127.0.0.1:3080），假对话 */
const MockWebgui: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>DeepSeek Harness</span>
      <span style={chip(theme.accent)}>127.0.0.1:3080</span>
    </div>
    <div style={appTitle}>Web GUI</div>
    <div style={body}>
      <div style={{...row, alignSelf: 'flex-end', maxWidth: '78%', background: 'rgba(77,159,255,0.14)', borderColor: 'rgba(77,159,255,0.4)'}}>
        帮我把这份周报汇总成表格
      </div>
      <div style={{...row, alignSelf: 'flex-start', maxWidth: '86%', flexDirection: 'column', alignItems: 'flex-start', gap: 6}}>
        <span style={{fontFamily: FONT_MONO, fontSize: 11, color: theme.accent}}>▸ 流式输出</span>
        <span>好的，我先读取目录…</span>
        <span>已汇总 3 张表，草稿在 输出/ 目录。</span>
      </div>
      <div style={{...row, color: theme.sub, fontFamily: FONT_MONO, fontSize: 12}}>输入消息…</div>
    </div>
  </div>
);

/** s1b-terminal：内置终端（假命令输出，无真实路径） */
const MockTerminal: FC<MockProps> = ({scene}) => (
  <div style={{...screenBase, background: '#0d1220'}}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>内置终端</span>
      <span>proroot</span>
    </div>
    <div style={{...body, gap: 4}}>
      <div style={monoLine}>
        {`$ apt install -y vim htop\nSetting up vim (2:9.1) ...\n$ uname -m\naarch64\n$ proroot --bench\n[proroot] 关键项 +58%（零 ptrace 开销）`}
      </div>
    </div>
  </div>
);

/** s1c-floating：流式悬浮条贴顶（假命令原文） */
const MockFloating: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={{...statusBar, justifyContent: 'flex-end'}}>
      <span>12:30</span>
    </div>
    {/* 背后：通用 App 列表（占位） */}
    <div style={{...body, opacity: 0.45}}>
      <div style={row}>公告</div>
      <div style={row}>日程</div>
      <div style={row}>文件</div>
    </div>
    {/* 悬浮条 */}
    <div
      style={{
        position: 'absolute',
        top: 52,
        left: 14,
        right: 14,
        background: 'rgba(11,14,20,0.92)',
        border: `1px solid ${theme.accent}`,
        borderRadius: 14,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{width: 8, height: 8, borderRadius: 4, background: theme.good, flexShrink: 0}} />
      <span style={{fontFamily: FONT_MONO, fontSize: 12.5, color: theme.text}}>正在执行：apt install -y htop</span>
    </div>
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 14,
        background: 'rgba(11,14,20,0.85)',
        borderRadius: 10,
        padding: '6px 12px',
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: theme.sub,
      }}
    >
      输出实时上屏
    </div>
  </div>
);

/** s2-adb：ADB 无线直连（假配对码） */
const MockAdb: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>设备能力</span>
      <span>agent</span>
    </div>
    <div style={appTitle}>ADB 无线直连</div>
    <div style={body}>
      <div style={{...row, flexDirection: 'column', gap: 8}}>
        <span style={{fontSize: 13, color: theme.sub}}>配对码（无线调试）</span>
        <span style={{fontFamily: FONT_MONO, fontSize: 34, letterSpacing: 8, color: theme.text}}>482913</span>
      </div>
      <div style={{...row, color: theme.good}}>● 已连接 · 本机（Android 14）</div>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        {['点击', '滑动', '截屏', '装应用'].map((t) => (
          <span key={t} style={chip(theme.accent)}>
            {t}
          </span>
        ))}
      </div>
      <div style={{fontSize: 12, color: theme.sub}}>配一次，agent 直接操作这台手机</div>
    </div>
  </div>
);

/** s3-vscreen：虚拟屏占位空位（素材由委托人安排外部录制） */
const MockVscreen: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>实验性功能</span>
      <span>v0.1.7-alpha2</span>
    </div>
    <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24}}>
      <div
        style={{
          width: '100%',
          height: '62%',
          border: `2px dashed ${theme.warn}`,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: theme.warn,
          textAlign: 'center',
        }}
      >
        <span style={{fontSize: 17, fontWeight: 700}}>实验性虚拟屏 · 效果示意</span>
        <span style={{fontSize: 12.5, color: theme.sub}}>素材由委托人安排外部录制</span>
        <span style={{fontSize: 12.5, color: theme.sub}}>到位前以本占位上审片</span>
      </div>
    </div>
  </div>
);

/** s4a-guard：危险命令守门人（假命令假路径） */
const MockGuard: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>安全守门人</span>
      <span style={chip(theme.bad)}>已拦截</span>
    </div>
    <div style={appTitle}>危险操作，你说了算</div>
    <div style={body}>
      <div style={{...row, borderColor: theme.bad, color: theme.bad, fontWeight: 700}}>⚠ 危险命令已被拦截</div>
      <div style={{...row, fontFamily: FONT_MONO, fontSize: 13}}>$ rm -rf ~/demo/old-logs</div>
      <div style={{fontSize: 12.5, color: theme.sub}}>三渠道批准（任一即可）：</div>
      {['通知批准', '前台弹窗批准', '悬浮条批准'].map((t) => (
        <div key={t} style={{...row, justifyContent: 'space-between'}}>
          <span style={{fontSize: 13.5}}>{t}</span>
          <span style={{display: 'flex', gap: 8}}>
            <span style={btn(theme.good)}>允许</span>
            <span style={btn(theme.bad)}>拒绝</span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

/** s4b-backup：分范围备份 + CRC 体检 */
const MockBackup: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>备份与恢复</span>
      <span>CRC</span>
    </div>
    <div style={appTitle}>卸载重装，数据不丢</div>
    <div style={body}>
      {[
        ['全量备份', true],
        ['仅对话', false],
        ['仅插件', false],
      ].map(([label, selected]) => (
        <div key={label as string} style={{...row, justifyContent: 'space-between'}}>
          <span style={{fontSize: 14}}>{label as string}</span>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              border: `2px solid ${selected ? theme.accent : 'rgba(154,167,199,0.4)'}`,
              background: selected ? theme.accent : 'transparent',
            }}
          />
        </div>
      ))}
      <div style={{...row, color: theme.good}}>✓ 恢复前 CRC 体检</div>
      <div style={{...btn(theme.accent), alignSelf: 'flex-start'}}>立即备份</div>
    </div>
  </div>
);

/** s4c-selfcheck：23 项自检 + 一键修补（假列表） */
const MockSelfcheck: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>自检与自愈</span>
      <span>23 项</span>
    </div>
    <div style={appTitle}>坏了，它说清哪坏了</div>
    <div style={body}>
      {['运行时完整性', 'Web 服务端口', '插件签名校验', '存储空间'].map((t) => (
        <div key={t} style={{...row, justifyContent: 'space-between'}}>
          <span style={{fontSize: 13.5}}>{t}</span>
          <span style={{color: theme.good, fontFamily: FONT_MONO, fontSize: 13}}>✓ 正常</span>
        </div>
      ))}
      <div style={{fontSize: 12, color: theme.sub}}>共 23 项；异常项可一键修补，15 个自愈脚本待命。</div>
      <div style={{...btn(theme.accent), alignSelf: 'flex-start'}}>一键修补</div>
    </div>
  </div>
);

/** s5a-plugins：插件市场（公开产品名，无隐私信息） */
const MockPlugins: FC<MockProps> = ({scene}) => (
  <div style={screenBase}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={statusBar}>
      <span>插件市场</span>
      <span>dsh-web-mobile 3.0.1</span>
    </div>
    <div style={appTitle}>浏览 · 安装 · 启停</div>
    <div style={body}>
      {[
        ['device-shell', '运行中', true],
        ['screen-ocr-operator', '已启用', true],
        ['dsh-web-mobile', '3.0.1 · 运行中', true],
        ['plugin-sdk-example', '未启用', false],
      ].map(([name, state, on]) => (
        <div key={name as string} style={{...row, justifyContent: 'space-between'}}>
          <span style={{display: 'flex', flexDirection: 'column', gap: 2}}>
            <span style={{fontFamily: FONT_MONO, fontSize: 13, color: theme.text}}>{name as string}</span>
            <span style={{fontSize: 11, color: on ? theme.good : theme.sub}}>{state as string}</span>
          </span>
          <span
            style={{
              width: 40,
              height: 22,
              borderRadius: 11,
              background: on ? theme.accent : 'rgba(154,167,199,0.25)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: on ? 20 : 2,
                width: 18,
                height: 18,
                borderRadius: 9,
                background: '#fff',
              }}
            />
          </span>
        </div>
      ))}
    </div>
  </div>
);

/** 未注册 id 的兜底 mock */
const DefaultMock: FC<MockProps> = ({scene}) => (
  <div style={{...screenBase, alignItems: 'center', justifyContent: 'center', gap: 14}}>
    <div style={devBadge}>{scene.name} · P0 占位</div>
    <div style={{fontSize: 18, fontWeight: 700, color: theme.text}}>{scene.name}</div>
    <div style={{fontSize: 13, color: theme.sub}}>P0 占位 mock · P3 按实测重画</div>
  </div>
);

// ---------------------------------------------------------------- 注册表（P3 替换点）

/** 按 scene.id 注册 mock；P3 重画 = 替换本表组件（或整表），外壳不动 */
export const MOCK_SCREENS: Record<string, FC<MockProps>> = {
  's0-hook': MockColdstart,
  's1a-webgui': MockWebgui,
  's1b-terminal': MockTerminal,
  's1c-floating': MockFloating,
  's2-adb': MockAdb,
  's3-vscreen': MockVscreen,
  's4a-guard': MockGuard,
  's4b-backup': MockBackup,
  's4c-selfcheck': MockSelfcheck,
  's5a-plugins': MockPlugins,
};

// ---------------------------------------------------------------- 外壳

/**
 * 手机 bezel（圆角 + 刘海），内容区 390×844 等比缩放、居中偏左。
 * 录屏存在 → OffthreadVideo 嵌入；否则按 scene.id 渲染 mock。
 */
export const PhoneFrame: FC<{scene: Scene}> = ({scene}) => {
  const rec = scene.asset ? manifest.RECORDINGS[scene.asset] : undefined;
  const Mock = MOCK_SCREENS[scene.id] ?? DefaultMock;
  return (
    <div style={{transform: 'translateX(-180px)'}}>
      <div style={bezelStyle}>
        <div style={notchStyle} />
        <div style={screenStyle}>
          {rec?.exists ? (
            <OffthreadVideo src={staticFile(rec.file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <div
              style={{
                width: SCREEN_W,
                height: SCREEN_H,
                transform: `scale(${SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <Mock scene={scene} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
