# Demo 说明：《冰立方：抓住宇宙的幽灵信使》

## 创意

2026 年 10 月，诺贝尔物理学奖颁给了冰立方中微子天文台首席科学家 Francis Halzen。本 Demo 是一支 3 分 14 秒的科普讲解视频，用黑紫 Motion Graphics 风格把这件事讲清楚：为什么中微子值得一个诺奖，以及科学家到底是怎么"看见"一种几乎不与物质发生任何作用的粒子的。

核心叙事策略是**反直觉制造钩子 + 机制可视化**：

- 开篇先用"两种信使都会被困住"建立问题（光被尘埃吞、宇宙线被磁场甩），再引出唯一能穿越宇宙的"幽灵信使"；
- 机制段落不用示意图式说教，而是把抽象量做成视觉主体（"650 亿个/秒/平方厘米"用粒子流压满屏幕、冰立方 5160 只眼睛逐格点亮、μ 子超光速炸出切伦科夫光锥）；
- 收尾落在"第一封信来自 4600 万光年外的 NGC 1068"和诺奖本身，让知识有时事落点。

全片中文配音，字幕与配音词级时间戳对齐。

## 主要功能 / 特点

1. **程序化视频工程**：基于 Remotion，12 个镜头各自是独立 React 组件，每帧由代码计算生成，可参数化复现、可版本控制。
2. **词级时间轴驱动**：解说经 edge-tts 合成并返回逐词时间戳，镜头切换、字幕换行、章节卡时机全部从音频时间戳自动推导，改词只需重跑 TTS。
3. **三层量化 QC 闸门**：
   - `motion_check.py`：镜头级运动判据（最长静止 ≤3s、落位 hold ≥30f），本片 12/12 镜头通过；
   - `frame_metrics.py`：抽帧构图量化（强调色碎片、主体尺度），11/12 通过；
   - `pause_check.py`：解说稿断句气口校验，配音全绿。
4. **可复用的图元库**：黑洞喷流、地球、中微子轨迹、切伦科夫光锥、光学模块（DOM）等 SVG 图元，参数化绘制，可跨镜头复用。
5. **完整制作流水线脚本**：从解说稿 → TTS → 时间轴 → 分镜渲染 → 成片编码 → 量化 QC 全链路脚本化（`scripts/` 下），包括基于 JPEG 帧序列的成片复测。

## 使用方式

### 直接看成片

压缩包内 `atria-demo-2026-nobel-physics-explainer/icecube-neutrino_demo.mp4`（1280×720，h264，约 15MB），任意视频播放器打开即可。完整源码与高清原版（38MB，crf16）见邮件正文 GitHub 仓库链接的 Release。

### 从源码运行

```bash
git clone <仓库地址>
cd atrie-demo-2026-nobel-physics-explainer
npm install

# 生成配音与时间轴（从 script/narration.txt）
python3 scripts/tts_build.py

# 实时预览（调参数立即看效果）
npm run studio

# 整片渲染（约 5821 帧，并发 6 约 5-8 分钟）
VER=v1 scripts/render.sh
```

渲染产物：`renders/icecube-neutrino_v1.mp4` + `fin_frames/`（JPEG 序列）+ `renders/sheet_v1.html`（98 格 contact sheet 速览）。

### 复用这套工程做其他科普视频

这套流水线（分镜表格式 → 时间轴生成 → 镜头构建 → 量化 QC）本身与具体题材无关。`分镜表.md` 是镜头编排的合同格式；`scripts/` 下的脚本架在 any-topic 的解说稿上都能跑：写好 `script/narration.txt`、按分镜表填镜头组件即可。

## 技术栈

Remotion（程序化视频）/ React + TypeScript / edge-tts（中文 TTS 词级时间戳）/ Python + numpy（QC 量化）/ ffmpeg（h264 编码）

## 作者

incarnation-gem
