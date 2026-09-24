# 事实清单与口径台账（字幕数字的唯一出处）

> 纪律：字幕/旁白中的每个数字必须能在本表找到，且带口径日期；没有来源的数字不许上字幕。
> 渲染日若晚于口径超 3 天，质检用 `gh GET /repos/DSH-APP/DSHA` 重新取数并更新本表 + timeline.ts 对应字幕。
> 本表由 Lead 维护；工程师重画 mock 的界面事实依据也登记在此。

## 1. 版本与数据（上字幕用）

| 事实 | 值 | 来源 | 口径日期 | 出现位置 |
|---|---|---|---|---|
| DSHA 最新版 | v0.1.7-alpha2（版本码 145，预发布） | GitHub Release | 2026-09-23 | s5b-cta 字幕 |
| DSHA star / fork | 616★ / 37 fork | GitHub API（`gh GET /repos/DSH-APP/DSHA`，2026-09-24 复核仍为 616★/37） | 2026-09-24 | s5b-cta 字幕 + 旁白 |
| 上游 harness | deepseek-ai/deepseek-harness（旁白口播"DeepSeek Harness"本体，不上星数字幕） | 上游 README | 2026-09-24 | s5b-cta 旁白 |
| proroot 性能 | 关键项实测 +58% | README（vivo V2352A / Android 14） | 2026-09 | s1b-terminal 字幕 |
| 自检项数 | 23 项自检 + 一键修补 + 15 个自愈脚本 | README | 2026-09 | s4c-selfcheck 字幕 |
| 移动端适配 | dsh-web-mobile 3.0.1（窄屏单栏 + 目录抽屉） | README / alpha2 notes | 2026-09 | s5a-plugins 字幕 |
| 系统要求 | Standard：Android 11+（虚拟屏需 API 30+）；Low：Android 6+；均 arm64-v8a | README | 2026-09 | 画面 mock 依据，不上字幕 |
| APK 体积 | Standard 260.29 MiB / Low 333.07 MiB | alpha2 release | 2026-09-23 | 备选字幕，默认不上 |
| 启动鉴权 | 3.43~3.66s（Android 16） | rc1 notes | 2026-09-10 | 默认不上字幕 |
| 质量 | rc2 各 383 单测、Lint 0 错；build142 平板 733 帧 0 jank / 均 114.1 FPS | CHANGELOG | 2026-09 | 默认不上字幕 |
| 维护者 | @ym2025szz（原作者 @qiannianhuanxiang） | 仓库 | 2026-09 | 默认不上字幕 |

**star 增长曲线（s5b-cta 画面，数据点）**：1★(08-14) → 43(08-15) → 103(08-21) → 500(09-16) → 594(09-23) → 616(09-24)。约 40 天破 600。（✅ GitHub API / star-history 快照，2026-09-24）

## 2. 界面 mock 校准依据（工程师重画 PhoneFrame 的事实来源）

> 规则：以下细节必须读 DSH-APP/DSHA 当前上游源码/README/release notes 实测校准，禁止凭记忆画；校准结论由工程师登记到本节。

| 界面 | 待校准细节 | 上游依据（工程师填写） |
|---|---|---|
| 冷启动 | 安装步骤名、解压进度页、READY 页结构 | 待填 |
| Web GUI | 端口 127.0.0.1:3080、页面结构、流式输出形态 | 待填 |
| 内置终端 | uname -m / node 版本 / curl :3090 等真实命令输出 | 待填 |
| 流式悬浮条 | 贴顶位置、命令原文显示、可调参数（底色/透明度/行数/停留） | 待填 |
| ADB 配对 | 配对入口、保活提示、授权三渠道 | 待填 |
| 虚拟屏 | 应用选择与启动、预览+悬浮预览、触控/键盘、frameSeq 防旧帧 | 待填（占位镜头，mock 仅兜底） |
| 插件管理 | 插件名 device-shell / screen-ocr-operator / dsh-web-mobile、启停UI | 待填 |
| 守门人 | 拦截提示形态、三渠道批准入口 | 待填 |
| 备份恢复 | 分范围选项、CRC 体检预览 | 待填 |
| 自检 | 23 项列表形态、一键修 | 待填 |

## 3. 红线（不得上画面/字幕）

- "完整 Ubuntu/glibc 环境"**不得当独家卖点**（上游 ROADMAP 2026-08-26 明示 Operit 等已具备）。主打差异只有四个：为 dsh 的一体化 / proroot 零 ptrace / ADB 无线直连 / 实验性虚拟屏，外加"数据不丢+自愈"。
- 隐私零容忍：无 API Key、token、邮箱、个人路径、真实文件名、日志密钥。
