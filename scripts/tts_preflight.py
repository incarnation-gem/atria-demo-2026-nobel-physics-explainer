#!/usr/bin/env python3
"""edge-tts 开工预检（≈5 秒）：合成一句测试音频，验证云端端点与依赖都可用。

为什么存在：edge 是免费**非官方**端点（模拟 Edge 浏览器朗读），无 SLA、会间歇性故障；
而按流程它要到文案写完、跑 tts_build 时才第一次被调用——那时项目已进行约 40 分钟。
建完项目（阶段 0）就跑本脚本，把「中途断供」变成「开工即知」。

用法：python3 scripts/tts_preflight.py [zh|en]
退出码：0 = 可用；1 = 不可用（换 TTS_ENGINE，或等恢复再开工）。
英文片默认引擎是本地 kokoro（无云端风险），除非显式选了 edge 才需要预检。
"""
import asyncio
import sys

LANG = sys.argv[1] if len(sys.argv) > 1 else 'zh'
SENT = '开工预检，配音通道正常。' if LANG == 'zh' else 'Preflight: voice channel is up.'
VOICE = 'zh-CN-YunxiNeural' if LANG == 'zh' else 'en-US-AriaNeural'
TRIES = 2  # edge 端点会间歇性返回空音频，失败先重试一次再判死


async def probe():
    import edge_tts
    for k in range(TRIES):
        n = 0
        try:
            async for chunk in edge_tts.Communicate(SENT, VOICE).stream():
                if chunk['type'] == 'audio':
                    n += len(chunk['data'])
        except Exception as e:
            print(f'  第 {k + 1} 次失败：{type(e).__name__}: {e}')
            continue
        if n >= 2000:  # 正常一句约 30–60KB；空返回只有几百字节
            return n
        print(f'  第 {k + 1} 次返回异常（音频仅 {n} 字节，疑似空返回）')
    return 0


async def main():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print('✗ edge-tts 未安装（pip install edge-tts）——现在装好再开工')
        return 1
    n = await probe()
    if not n:
        print(f'✗ edge 端点不可用（{VOICE}，重试 {TRIES} 次均失败）——换 TTS_ENGINE（本地 kokoro/piper）或稍后再开工')
        return 1
    print(f'✓ edge 端点正常（{VOICE}，测试音频 {n // 1024}KB）')
    return 0


sys.exit(asyncio.run(main()))
