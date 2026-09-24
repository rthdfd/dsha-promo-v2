# 分镜表（DSHA 宣传片 v2 · 审片版）

> 真源：`src/timeline.ts`（帧数/场景/旁白起止唯一出处）。本表是人读版，改帧数必须同步改 timeline.ts。
> 规格：1920×1080 / 30fps / 2700 帧 = 90.0s（时长无硬性上下限，按素材充实度弹性伸缩；高潮段 ADB+虚拟屏占最长时段）。
> 字幕口径：`docs/facts.md`。占位空位：s3-vscreen（素材由委托人安排他人录制）。

| # | 场景 id | 帧区间 | 时长 | 画面来源 | 字幕（主） | 字幕小字（口径） | 旁白 |
|---|---|---|---|---|---|---|---|
| 1 | s0-hook | 0–150 | 5.0s | 录屏 01-coldstart（缺→mock） | 免 ROOT · 免 Termux · 装完即用 | — | 免 Root、免 Termux，装完即用。 |
| 2 | s1a-webgui | 150–300 | 5.0s | 录屏 02-webgui（缺→mock） | 完整 Ubuntu 24.04 · apt 随便用 | README · 2026-09 | 完整 Ubuntu 24.04，apt 随便用。 |
| 3 | s1b-terminal | 300–450 | 5.0s | 录屏 03-terminal（缺→mock） | proroot 零 ptrace 开销，关键项实测 +58% | README（vivo V2352A / Android 14）· 2026-09 | proroot 零 ptrace 开销，关键项实测快百分之五十八。 |
| 4 | s1c-floating | 450–600 | 5.0s | 录屏 04-floating（缺→mock） | AI 输出，实时上屏 | — | AI 的输出，实时贴上屏幕顶。 |
| 5 | s2-adb | 600–1050 | 15.0s | 录屏 05-adb + C 方案截屏序列（缺→mock） | 配一次 ADB，agent 直接操作这台手机 | README · 2026-09 | 配一次 ADB，智能体直接操作这台手机：点击、滑动、截屏、装应用，不需要 Shizuku。 |
| 6 | s3-vscreen | 1050–1500 | 15.0s | **★占位空位**（06-vscreen.mp4 外部录制，待提供） | 实验性虚拟屏：AI 在另一块屏幕替你操作 App | v0.1.7-alpha2 · 2026-09-23 | 还有实验性虚拟屏：AI 在另一块屏幕上，替你打开并操作另一个应用。 |
| 7 | s4a-guard | 1500–1650 | 5.0s | 录屏 07-guard（缺→mock） | 危险操作，你说了算 | — | 危险操作，你说了算。 |
| 8 | s4b-backup | 1650–1800 | 5.0s | 录屏 08-backup（缺→mock） | 卸载重装，数据不丢 | README · 2026-09 | 卸载重装，数据不丢。 |
| 9 | s4c-selfcheck | 1800–1950 | 5.0s | 录屏 09-selfcheck（缺→mock） | 23 项自检，一键修补 | README · 2026-09 | 坏了，它说清哪坏了。 |
| 10 | s5a-plugins | 1950–2250 | 10.0s | 录屏 10-plugins（缺→mock） | 插件生态，全部在 App 内完成 | dsh-web-mobile 3.0.1 · 2026-09 | 插件生态，浏览、安装、启停，全部在 App 内完成。 |
| 11 | s5b-cta | 2250–2700 | 15.0s | 代码生成（star 曲线 + 仓库名 + 二维码） | DSHA v0.1.7-alpha2 · 616★ · MIT 开源 | 截至 2026-09-24 · github.com/DSH-APP/DSHA | 六百一十六颗星，MIT 开源。在 GitHub 搜索 DSH-APP 斜杠 DSHA，在手机上跑起 DeepSeek Harness。 |

## 结构说明

- **Hook（1）**：黑场字幕 → 点图标 → READY 页。
- **能力三连击（2-4）**：Web GUI 对话 → 终端/proroot 性能 → 流式悬浮条贴顶。
- **高潮（5-6，共 30s，全片最长）**：ADB 配对 → agent 远程操作本机 → 转场虚拟屏（AI 在独立屏操作另一个 App，展示 frameSeq 防旧帧）。虚拟屏为占位空位。
- **信任点（7-9）**：守门人拦截→批准；分范围备份+恢复前体检；23 项自检一键修。
- **生态与收尾（10-11）**：插件市场 → star 曲线 + 仓库名 + 二维码 CTA。

## 审片版 vs 母版

- 审片版（Review Composition）：带 DRAFT 叠层、时间码、占位框标注（缺素材/占位场景一目了然），缺素材也能渲。
- 母版（Master Composition）：干净成片；`validate-master.mjs` 门禁实跑通过才渲（必需录屏齐全含 06-vscreen.mp4、旁白齐全非静音占位、音效齐全、帧数自洽、字幕无 TODO）。
