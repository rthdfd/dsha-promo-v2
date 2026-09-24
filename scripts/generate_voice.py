#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DSHA 宣传片 v2 · 旁白生成（edge-tts 在线 TTS）
============================================================
读 src/narration.json，逐段生成 public/assets/voice/<id>.mp3
（zh-CN-XiaoxiaoNeural）。每段失败重试 1 次；仍失败则写等长静音占位
<id>.wav（wave 模块，时长按 4.5 字/秒估算），并记录到
public/assets/voice-report.json（{failed:[...], silent:[...]}）。
全部成功时也写报告（空列表）。

纪律：任何情况 exit 0 —— 审片不阻断；母版门禁 validate-master.mjs
靠 voice-report.json 识别失败/静音段（failed/silent 必须为空）。
"""
import asyncio
import json
import math
import os
import sys
import wave

VOICE = 'zh-CN-XiaoxiaoNeural'
CHARS_PER_SEC = 4.5      # 静音占位时长估算：中文约 4.5 字/秒
SAMPLE_RATE = 44100
ATTEMPT_TIMEOUT = 90     # 单次 TTS 超时（秒），防 CI 挂死
RETRIES = 1              # 失败重试次数

try:
    import edge_tts
except ImportError:      # 本地未装 edge-tts 时优雅降级为全静音占位
    edge_tts = None


def repo_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def write_silent_wav(path: str, seconds: float) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    n = max(1, int(seconds * SAMPLE_RATE))
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(b'\x00\x00' * n)


async def tts_save(text: str, path: str) -> None:
    communicate = edge_tts.Communicate(text, VOICE)
    await asyncio.wait_for(communicate.save(path), timeout=ATTEMPT_TIMEOUT)


async def main() -> int:
    root = repo_root()
    narration_path = os.path.join(root, 'src', 'narration.json')
    voice_dir = os.path.join(root, 'public', 'assets', 'voice')
    report_path = os.path.join(root, 'public', 'assets', 'voice-report.json')
    os.makedirs(voice_dir, exist_ok=True)

    with open(narration_path, encoding='utf-8') as f:
        narration = json.load(f)

    failed = []
    for entry in narration:
        sid = entry['id']
        text = entry['text']
        mp3 = os.path.join(voice_dir, f'{sid}.mp3')
        wav = os.path.join(voice_dir, f'{sid}.wav')

        ok = False
        if edge_tts is None:
            print(f'[warn] edge_tts 未安装，{sid} 直接走静音占位')
        else:
            for attempt in range(1, RETRIES + 2):
                try:
                    await tts_save(text, mp3)
                    ok = True
                    break
                except Exception as e:
                    print(f'[warn] {sid} 第 {attempt} 次 TTS 失败：{e}')
                    if attempt <= RETRIES:
                        await asyncio.sleep(2)
        if ok:
            if os.path.exists(wav):
                os.remove(wav)  # 清掉历史静音占位，避免 VOICE 解析到旧 wav
            print(f'[ok] {sid} → {os.path.relpath(mp3, root)}')
        else:
            seconds = max(1.0, math.ceil(len(text) / CHARS_PER_SEC * 10) / 10)
            write_silent_wav(wav, seconds)
            failed.append(sid)
            print(f'[fallback] {sid} → 静音占位 {seconds:.1f}s（{os.path.relpath(wav, root)}）')

    # silent 以磁盘终态为准：mp3 缺失且 wav 存在 = 静音占位段
    silent = [
        e['id'] for e in narration
        if not os.path.exists(os.path.join(voice_dir, f"{e['id']}.mp3"))
        and os.path.exists(os.path.join(voice_dir, f"{e['id']}.wav"))
    ]

    report = {'failed': failed, 'silent': silent}
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
        f.write('\n')

    ok_count = len(narration) - len(silent)
    print(f'[generate_voice] 完成：成功 {ok_count} / {len(narration)}，静音占位 {len(silent)} 段'
          f'（报告：{os.path.relpath(report_path, root)}）')
    if failed:
        print(f'[generate_voice] 失败段：{failed}（母版门禁将因此拒渲）')
    return 0


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as e:  # 顶层兜底：审片不阻断
        print(f'[error] generate_voice 顶层异常：{e}')
    sys.exit(0)
