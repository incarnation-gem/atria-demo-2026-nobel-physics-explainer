#!/usr/bin/env python3
"""TTS 引擎模块——配音的「可替换零件层」。tts_build.py 是流水线（解说词 → 音频 → 时间轴），
引擎细节全部收在这里：加 / 换引擎只动本文件，流水线不动。

引擎契约：
  - 每个引擎是一个函数 synth(text) -> 音频文件路径；带词边界的引擎再返回
    words：[{'t': 起始秒, 'd': 时长秒, 'text': 词}, ...]
  - 有 words（目前只有 edge）→ 流水线走词边界对齐路径（chunk_starts），字幕节拍最准
  - 无 words → 流水线走逐字幕块合成路径（CHUNK_PAD 块间垫静音），块起点精确但块界断句略生硬
  - 自带缓存（cache_path，键含引擎参数与本地模型文件指纹），改一句只重合成一句
  - 加新引擎三步：① 实现 synth_xxx（含缓存与缺依赖时的报错提示）② 注册进 ENGINES
    （有词边界再进 WORD_BOUNDARY）③ 完事——tts_build.synth_sentence 无需改

未来候选（2026-10-09 实测，A/B 后暂不用、留档备查）：
  Qwen3-TTS-12Hz-1.7B-Base（本地 4.2G，mlx-audio 0.5.8 跑通）：照稿念（whisper 回转核对），
  中英混排正常，语速偏慢（同句 5.0s vs edge 3.14s），听感用户裁定仍 edge 略好。
  若未来启用：mlx-audio 合成 + mlx_whisper 词级强制对齐造 words 列表 → 走 edge 同款词边界
  路径，即可获得与 edge 同级的字幕对齐精度。edge 端点故障时的本地兜底首选（强于 MeloTTS：
  MeloTTS 中英混排直接崩、慢 12 倍、听感差）。
"""
import hashlib
import json
import os
import re
import subprocess
import asyncio
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ENGINE = os.environ.get('TTS_ENGINE', 'auto')
VOICE = os.environ.get('VOICE', 'zh-CN-YunxiNeural')
RATE = os.environ.get('RATE', '+0%')          # 原速：默认不给语音加速（用户裁定）。+8% 会把中文语速从 ≈5.5 抬到 ≈6 字/秒，听着赶
KOKORO_VOICE = os.environ.get('KOKORO_VOICE', 'am_liam')
KOKORO_LANG = os.environ.get('KOKORO_LANG', 'a')       # a=American English, b=British
KOKORO_SPEED = float(os.environ.get('KOKORO_SPEED', 1.0))
KOKORO_SR = 24000
# piper（TTS_ENGINE=piper）：本地/ARM 友好，模型路径经环境变量传入（无默认，缺省即报错提示）
PIPER_MODEL = os.environ.get('PIPER_MODEL', '')
PIPER_VOICE_NAME = os.path.basename(PIPER_MODEL).replace('.onnx', '') if PIPER_MODEL else 'piper'
# kokoro_onnx（TTS_ENGINE=kokoro_onnx）：onnxruntime 版 kokoro，无 torch/spacy
KOKORO_ONNX_MODEL = os.environ.get('KOKORO_ONNX_MODEL', '')     # 例：kokoro-v1.0.onnx
KOKORO_ONNX_VOICES = os.environ.get('KOKORO_ONNX_VOICES', '')  # 例：voices-v1.0.bin
KOKORO_ONNX_VOICE = os.environ.get('KOKORO_ONNX_VOICE', 'am_michael')
KOKORO_ONNX_LANG = os.environ.get('KOKORO_ONNX_LANG', 'en-us')
EDGE_TRIES = int(os.environ.get('EDGE_TRIES', 4))     # edge-tts 每句最多试几次（端点会间歇性返回空音频）
CACHE = f'{ROOT}/audio/cache'
os.makedirs(CACHE, exist_ok=True)


def _file_fp(path):
    """模型文件指纹（进缓存键）：真实路径 + 大小 + mtime + 前 1MB 内容的 sha1 前 12 位。
    换目录下的同名模型、原地替换模型文件都会让旧缓存失效；只按文件名区分会把不同声音的缓存混在一起。
    路径为空返回 'none'；路径设了但文件不存在返回 'missing:<路径>'（合成时另有报错）。"""
    if not path:
        return 'none'
    rp = os.path.realpath(path)
    try:
        st = os.stat(rp)
        with open(rp, 'rb') as f:
            head = f.read(1 << 20)
    except OSError:
        return f'missing:{rp}'
    return hashlib.sha1(f'{rp}|{st.st_size}|{st.st_mtime_ns}|'.encode() + head).hexdigest()[:12]


PIPER_FP = _file_fp(PIPER_MODEL)
KOKORO_ONNX_FP = f'{_file_fp(KOKORO_ONNX_MODEL)}+{_file_fp(KOKORO_ONNX_VOICES)}'


def cache_path(text, ext):
    # 本地模型引擎用文件指纹而不是文件名：不同目录下的同名 model.onnx、原地换掉的模型都要各自缓存
    sig = f'{ENGINE}|{VOICE}|{RATE}|{KOKORO_VOICE}|{KOKORO_ONNX_VOICE}|{KOKORO_ONNX_LANG}|{KOKORO_ONNX_FP}|{PIPER_FP}|{KOKORO_LANG}|{KOKORO_SPEED}|{text}'
    return f'{CACHE}/{hashlib.sha1(sig.encode()).hexdigest()[:16]}{ext}'


def write_wav(path, x, sr):
    """x：float32 单声道 (n,) 或立体声 (n,2) → 16bit PCM wav。"""
    import wave
    a = np.asarray(x, dtype=np.float32)
    pcm = (np.clip(a, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1 if a.ndim == 1 else a.shape[1]); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())


async def synth_edge(text):
    """edge-tts：整句合成 + 词级边界（会把 text 发送到微软云端端点）。
    boundary='WordBoundary' 必须显式传：edge-tts 7.2.0 起该参数默认 'SentenceBoundary'，
    不传就一个 WordBoundary 事件都收不到，chunk_starts() 会静默退化成按字数插值（字幕能偏半秒）。
    端点会间歇性返回空音频（NoAudioReceived）：50 句的片子里随机一两句中招，同一句重试多半就过，
    所以试 EDGE_TRIES 次；试完还拿不到就报错退出，不把空 mp3 当成品往下传。"""
    import edge_tts
    mp3 = cache_path(text, '.mp3'); js = cache_path(text, '.json')
    if os.path.exists(mp3) and os.path.exists(js):
        return mp3, json.load(open(js))
    for attempt in range(1, EDGE_TRIES + 1):
        audio = bytearray(); words = []
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary='WordBoundary')
            async for ch in comm.stream():
                if ch['type'] == 'audio':
                    audio += ch['data']
                elif ch['type'] == 'WordBoundary':
                    words.append({'t': ch['offset'] / 1e7, 'd': ch['duration'] / 1e7, 'text': ch['text']})
            if audio:
                break
            why = '端点返回空音频'
        except TypeError:                # boundary 参数是 edge-tts 7.2.0 才有的
            raise SystemExit("edge-tts 版本过旧：pip install 'edge-tts==7.2.8'")
        except Exception as e:
            why = f'{type(e).__name__}: {e}'
        if attempt == EDGE_TRIES:
            raise SystemExit(f'edge-tts 试了 {EDGE_TRIES} 次仍拿不到音频（{why}）：{text[:30]}…')
        print(f'  ⚠ edge-tts 第 {attempt} 次失败（{why}），{1.5 * attempt:.1f}s 后重试：{text[:16]}…')
        await asyncio.sleep(1.5 * attempt)
    open(mp3, 'wb').write(audio)
    json.dump(words, open(js, 'w'), ensure_ascii=False)
    return mp3, words


_kokoro = None

# kokoro 读音覆写（只影响送给 TTS 的文本，字幕仍显示原词）。语法是 kokoro/misaki 的 [词](/音标/)，
# **只对 `kokoro` 引擎生效**（piper / kokoro_onnx 走 espeak 音素化，不认这个语法，会把括号读出来）。
# 模板默认为空，按本片增补：kokoro 常把生僻缩写逐字母拼读、把 "v5.0" 读成 "v five zero"，合成前 dump 音素检查。
# 写法示例：'CUDA': '[CUDA](/kˈudə/)'，'v5.0': '[v5.0](/vˈi fˈIv pYnt ˈO/)'
PRONOUNCE = {}


def apply_pronounce(text):
    for k, v in PRONOUNCE.items():
        text = re.sub(r'(?<![A-Za-z0-9])' + re.escape(k) + r'(?![A-Za-z0-9])', v, text)
    return text


def synth_kokoro(text):
    """kokoro-82m：本地推理，24kHz，无词边界。"""
    global _kokoro
    text = apply_pronounce(text)
    au = cache_path(text, '.wav')
    if os.path.exists(au):
        return au
    if _kokoro is None:
        try:
            from kokoro import KPipeline
        except ImportError:
            raise SystemExit('TTS_ENGINE=kokoro 需要 kokoro：pip install kokoro soundfile；英文 G2P 另需 espeak-ng（macOS brew / Linux apt install espeak-ng）。'
                             'ARM / Python 3.13 上装不动 kokoro 就换 TTS_ENGINE=kokoro_onnx 或 piper（见 tts_build.py 文件头）')
        _kokoro = KPipeline(lang_code=KOKORO_LANG)
    parts = []
    for r in _kokoro(text, voice=KOKORO_VOICE, speed=KOKORO_SPEED):
        a = getattr(r, 'audio', None)
        if a is None:
            a = r[2]                                    # 旧版 yield (graphemes, phonemes, audio)
        if hasattr(a, 'detach'):
            a = a.detach().cpu().numpy()                # torch tensor
        parts.append(np.asarray(a, dtype=np.float32).reshape(-1))
    if not parts:
        raise SystemExit(f'kokoro 没有产出音频：{text[:24]}…')
    write_wav(au, np.concatenate(parts), KOKORO_SR)
    return au


_piper = None


def synth_piper(text):
    """piper-tts：本地推理（onnxruntime，Linux/ARM/树莓派友好，无 torch/spacy），无词边界 → 逐块合成。
    模型原生采样率写 wav；decode() 再用 ffmpeg 重采样到 SR。需 PIPER_MODEL 指向一个 .onnx 语音。
    不套 PRONOUNCE 读音覆写（那是 kokoro/misaki 语法，piper 会把括号读出来）。"""
    global _piper
    if not PIPER_MODEL:
        raise SystemExit('TTS_ENGINE=piper 需要 PIPER_MODEL 指向一个 piper .onnx 语音'
                         '（pip install piper-tts；语音见 github.com/rhasspy/piper voices）')
    au = cache_path(text, '.wav')
    if os.path.exists(au):
        return au
    if _piper is None:
        try:
            from piper import PiperVoice
        except ImportError:
            raise SystemExit('TTS_ENGINE=piper 需要 piper：pip install piper-tts')
        _piper = PiperVoice.load(PIPER_MODEL)
    import wave
    with wave.open(au, 'wb') as w:
        _piper.synthesize_wav(text, w)
    return au


_kokoro_onnx = None


def synth_kokoro_onnx(text):
    """kokoro-onnx：onnxruntime 版 kokoro（Linux/ARM 友好，无 torch/spacy；比 `kokoro` 引擎好装、音色自然），
    24kHz，无词边界 → 逐块合成。需 KOKORO_ONNX_MODEL / KOKORO_ONNX_VOICES 两个模型文件。
    不套 PRONOUNCE 读音覆写（kokoro-onnx 用 espeak 音素化，不认 misaki 的 [词](/音标/) 语法）。"""
    global _kokoro_onnx
    if not (KOKORO_ONNX_MODEL and KOKORO_ONNX_VOICES):
        raise SystemExit('TTS_ENGINE=kokoro_onnx 需要 KOKORO_ONNX_MODEL 与 KOKORO_ONNX_VOICES'
                         '（pip install kokoro-onnx；模型见 github.com/thewh1teagle/kokoro-onnx releases）')
    au = cache_path(text, '.wav')
    if os.path.exists(au):
        return au
    if _kokoro_onnx is None:
        try:
            from kokoro_onnx import Kokoro
        except ImportError:
            raise SystemExit('TTS_ENGINE=kokoro_onnx 需要 kokoro-onnx：pip install kokoro-onnx')
        _kokoro_onnx = Kokoro(KOKORO_ONNX_MODEL, KOKORO_ONNX_VOICES)
    s, sr = _kokoro_onnx.create(text, voice=KOKORO_ONNX_VOICE, speed=KOKORO_SPEED, lang=KOKORO_ONNX_LANG)
    write_wav(au, np.asarray(s, dtype=np.float32).reshape(-1), sr)
    return au


# 引擎注册表：synth(text) -> 路径 或 (路径, words)。WORD_BOUNDARY 里的引擎返回 words，
# 流水线据此选词边界对齐路径；其余走逐块合成路径。
ENGINES = {
    'edge': synth_edge,
    'kokoro': synth_kokoro,
    'piper': synth_piper,
    'kokoro_onnx': synth_kokoro_onnx,
}
WORD_BOUNDARY = {'edge'}
