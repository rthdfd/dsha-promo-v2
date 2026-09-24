#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DSHA 宣传片 v2 · 程序化音效生成（纯 Python wave，禁外部音频文件）
============================================================
输出 public/assets/sfx/{whoosh,pop,rise,click,success}.wav
规格：16bit / 44.1kHz / 单声道；随机种子固定（CI 可复现）。
用途（Promo.tsx 消费）：
  whoosh  —— 场景切换音效（index>0 的 Sequence 起始处挂载）
  pop/rise/click/success —— 备用交互音（generate 类画面可挂）
"""
import math
import os
import random
import struct
import wave

SAMPLE_RATE = 44100
PEAK = 0.7          # 归一化峰值，预留 headroom 避免削波
SEED = 20260924     # 确定性随机：同一 seed 产出逐字节一致，CI 可复现


def write_wav(path: str, samples) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1.0, min(1.0, s)) * 32767)) for s in samples))


def normalize(samples, peak: float = PEAK):
    m = max(abs(s) for s in samples) or 1.0
    g = peak / m
    samples = [s * g for s in samples]
    fade = min(len(samples), int(0.005 * SAMPLE_RATE))  # 尾部 5ms 淡出，防端点爆音
    for i in range(fade):
        samples[len(samples) - 1 - i] *= i / fade
    return samples


def whoosh(dur: float = 0.55):
    """滤波噪声 + 低→高→低扫频（场景切换）"""
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n
    lp = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        cutoff = 300 + 4200 * math.sin(math.pi * t / dur)
        alpha = 1 - math.exp(-2 * math.pi * cutoff / SAMPLE_RATE)
        lp += alpha * (random.uniform(-1, 1) - lp)  # 一阶低通
        env = min(1.0, t / 0.08) * max(0.0, 1.0 - t / dur) ** 1.5
        out[i] = lp * env * 3.0
    return out


def pop(dur: float = 0.14):
    """短促下滑音（UI 反馈）"""
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n
    phase = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        f = 180 + 520 * math.exp(-t / 0.03)
        phase += 2 * math.pi * f / SAMPLE_RATE
        out[i] = math.sin(phase) * math.exp(-t / 0.045)
    return out


def rise(dur: float = 0.45):
    """上行扫频（进度/揭示）"""
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n
    phase = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        f = 180 + 940 * (t / dur)
        phase += 2 * math.pi * f / SAMPLE_RATE
        env = (t / dur) ** 0.8
        out[i] = math.sin(phase) * env
    return out


def click(dur: float = 0.05):
    """极短点击（按键/落点）"""
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.008)
        out[i] = (0.5 * random.uniform(-1, 1) + math.sin(2 * math.pi * 2200 * t)) * env
    return out


def success(dur: float = 0.65):
    """双音叮当（完成/成功）"""
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n
    for f, t0, t1 in ((587.33, 0.0, 0.30), (880.0, 0.24, 0.65)):  # D5 → A5
        i0 = int(t0 * SAMPLE_RATE)
        i1 = min(n, int(t1 * SAMPLE_RATE))
        phase = 0.0
        for i in range(i0, i1):
            t = (i - i0) / SAMPLE_RATE
            phase += 2 * math.pi * f / SAMPLE_RATE
            out[i] += math.sin(phase) * math.exp(-t / 0.18) * 0.6
    return out


SOUNDS = {
    'whoosh.wav': whoosh,
    'pop.wav': pop,
    'rise.wav': rise,
    'click.wav': click,
    'success.wav': success,
}


def main() -> None:
    random.seed(SEED)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sfx_dir = os.path.join(root, 'public', 'assets', 'sfx')
    os.makedirs(sfx_dir, exist_ok=True)
    for name, fn in SOUNDS.items():
        samples = normalize(fn())
        path = os.path.join(sfx_dir, name)
        write_wav(path, samples)
        print(f'[sfx] {name}  {len(samples) / SAMPLE_RATE:.2f}s  {os.path.getsize(path)}B')
    print(f'[generate_sfx] 完成：{len(SOUNDS)} 个音效 → {os.path.relpath(sfx_dir, root)}')


if __name__ == '__main__':
    main()
