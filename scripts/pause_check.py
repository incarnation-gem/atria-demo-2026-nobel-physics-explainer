#!/usr/bin/env python3
"""气口量化体检（出稿即跑，把人耳闸门前移）：对成片 wav 做静音检测并对照 timeline 对账。

四类检查：
  1. `||` 句界：应 ≥0.18s 气口（无 = 并词，硬伤）
  2. 段末停顿（para=true 之后）：应 ≥0.6s（不足硬伤）
  3. 块内乱停：字幕块内部出现 ≥0.2s 停顿（edge 在无标点长块上节拍贪停；软警告）
  4. 语音区空停：>1.6s 的静音段（错停，硬伤）

用法：python3 scripts/pause_check.py [--root 项目根] [--min-inner 0.2]
退出：硬伤 >0 → 1；只有软警告 → 0。输出全部报告到 stdout。
依赖：numpy（读 wav 自带 wave 模块）。"""
import json, os, re, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if '--root' in sys.argv:
    i = sys.argv.index('--root'); ROOT = os.path.abspath(sys.argv[i + 1]); del sys.argv[i:i + 2]
MIN_INNER = 0.2
if '--min-inner' in sys.argv:
    i = sys.argv.index('--min-inner'); MIN_INNER = float(sys.argv[i + 1]); del sys.argv[i:i + 2]
FPS = 30

# ---------- 读 timeline.json ----------
tl = json.load(open(f'{ROOT}/script/timeline.json', encoding='utf-8'))
S = tl['sentences']
SLUG = tl.get('slug') or os.path.basename(ROOT)
wav_path = f'{ROOT}/public/assets/audio.wav'
if not os.path.exists(wav_path):
    # 约定路径 public/assets/<slug>/audio.wav
    for cand in [f'{ROOT}/public/assets/{tl.get("slug","")}/audio.wav']:
        if os.path.exists(cand): wav_path = cand; break
    else:
        for d in os.listdir(f'{ROOT}/public/assets') if os.path.isdir(f'{ROOT}/public/assets') else []:
            p = f'{ROOT}/public/assets/{d}/audio.wav'
            if os.path.exists(p): wav_path = p; break
        else:
            print('✗ 找不到成片 audio.wav'); sys.exit(2)

# ---------- 读 narration.txt 拿 || 位置（块序号） ----------
narr = f'{ROOT}/script/narration.txt'
lines = []
if os.path.exists(narr):
    with open(narr, encoding='utf-8') as f:
        for ln in f:
            ln = ln.rstrip('\n')
            if not ln or ln.lstrip().startswith('#'):
                continue
            lines.append(ln)
sent_blocks = []
for ln in lines:
    parts = re.split(r'(\|\|)', ln)
    blocks, seps, cur = [], [], None
    for i, p in enumerate(parts):
        if i % 2 == 0:
            for b in p.split('|'):
                if b != '':
                    blocks.append(b); seps.append(cur); cur = '|'
        else:
            cur = '||'
    sent_blocks.append((blocks, seps))

# ---------- wav 静音段 ----------
w = wave.open(wav_path, 'rb')
sr, nch = w.getframerate(), w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
if nch > 1:
    x = x.reshape(-1, nch).mean(1)
hop = int(sr * 0.01)
nfr = len(x) // hop
rms = np.sqrt((x[: nfr * hop].reshape(nfr, hop) ** 2).mean(1))
thr = max(rms.max() * 0.015, 1e-4)
sil = rms < thr
segs, st = [], None
for i, s in enumerate(sil):
    if s and st is None:
        st = i
    elif not s and st is not None:
        segs.append((st / 100.0, i / 100.0)); st = None
if st is not None:
    segs.append((st / 100.0, nfr / 100.0))
print(f'wav {len(x)/sr:.1f}s  静音帧占比={sil.mean():.0%}  阈值={thr:.5f}')

def near(point_s, win=0.25):
    """point 附近 ±win 内最长的静音段。||/段末的静音尾恰好压在下一句起点上，
    判定要容忍取整误差：与 point ±60ms 窗重叠 >30ms，或段尾在 point 前 80ms 内。"""
    best = None
    for a, b in segs:
        d = b - a
        if b < point_s - win or a > point_s + win:
            continue
        ov = min(b, point_s + 0.06) - max(a, point_s - 0.06)
        if ov > 0.03 or abs(b - point_s) < 0.08:
            if best is None or d > best[2]:
                best = (a, b, d)
    return best

hard, soft = [], []

# 1. || 句界
if len(sent_blocks) == len(S):
    for idx, sent in enumerate(S):
        blocks, seps = sent_blocks[idx]
        if len(blocks) != len(sent['subs']):
            continue
        for k in range(1, len(seps)):
            if seps[k] == '||':
                pt = sent['subs'][k]['from'] / FPS
                d = near(pt)[2] if near(pt) else 0.0
                if d < 0.18:
                    hard.append(f"✘ {sent['id']} || 无气口({d*1000:.0f}ms)：…{blocks[k-1][-8:]}‖{blocks[k][:8]}…")
                else:
                    print(f"  ✓ {sent['id']} || {d*1000:4.0f}ms  …{blocks[k-1][-8:]}‖{blocks[k][:8]}…")
else:
    print(f'⚠ narration 行数 {len(sent_blocks)} ≠ 句数 {len(S)}，跳过 || 检查')

# 2. 段末停顿
for i in range(len(S) - 1):
    if S[i].get('para'):
        design = (S[i + 1]['from'] - S[i]['to']) / FPS
        d = near(S[i]['to'] / FPS, win=0.6)[2] if near(S[i]['to'] / FPS, win=0.6) else 0.0
        if d < 0.6:
            hard.append(f"✘ 段末 {S[i]['id']} 停顿仅 {d*1000:.0f}ms（设计 {design:.2f}s）")
        else:
            print(f"  ✓ 段末 {S[i]['id']}→{S[i+1]['id']} {d*1000:4.0f}ms（设计 {design:.2f}s）")

# 3. 块内乱停（软）
inner = 0
for s in S:
    fs, fe, subs = s['from'], s['to'], s['subs']
    for a, b in segs:
        af, bf = a * 30, b * 30
        if bf < fs - 3 or af > fe + 3 or (b - a) < MIN_INNER:
            continue
        for k, sb in enumerate(subs):
            if af >= sb['from'] - 2 and bf <= sb['to'] + 2:
                inner += 1
                soft.append(f"△ {s['id']} 块{k+1}「{sb['text'][:14]}」内停 {(b-a)*1000:.0f}ms")
                break

# 4. 语音区空停
speech_hi = S[-1]['to'] / FPS
big = [(a, b, b - a) for a, b in segs if b - a > 1.6 and a > S[0]['from'] / FPS - 0.2 and b < speech_hi + 0.1]
for a, b, d in big:
    hard.append(f'✘ 空停 {d:.2f}s @{a:.1f}s')

print(f"\n块内乱停 {inner} 处（edge 在长块上自断；软警告，听感可接受就不改）")
print(f'硬伤 {len(hard)} / 软警告 {len(soft)}')
for line in hard:
    print('  ' + line)
for line in soft[:20]:
    print('  ' + line)
sys.exit(1 if hard else 0)
