# 冰立方：抓住宇宙的幽灵信使

2026 年诺贝尔物理学奖科普讲解视频 —— 用动画讲清楚 Francis Halzen 与冰立方中微子天文台如何"抓住"宇宙中最难捉摸的粒子。

- **时长**：3 分 14 秒（5821 帧 @ 30fps）
- **画面**：1280×720，黑紫 MG（Motion Graphics）风格
- **配音**：中文解说 + 同步字幕（edge-tts，词级时间戳对齐）
- **工程**：Remotion（React 驱动的程序化视频）

## 视频结构

12 个镜头分 6 组，叙事线：

1. **两种信使** —— 光和宇宙线都会被遮挡，中微子不会（为什么需要它）
2. **650 亿个** —— 每秒每平方厘米穿过你的中微子数量
3. **冰立方剖面** —— 5160 只"眼睛"埋在南极 1.5 公里深的冰里
4. **切伦科夫光** —— 中微子撞原子核，μ 子跑得比冰里的光速快，炸出蓝色光锥
5. **NGC 1068** —— 第一封"宇宙来信"来自 4600 万光年外的活跃星系核
6. **诺奖** —— 2026 年 10 月，哈尔岑因此获诺贝尔物理学奖

## 技术栈

- **Remotion** —— 程序化视频，每个镜头是一个 React 组件
- **edge-tts** —— 中文 TTS，词级时间戳驱动时间轴
- **ffmpeg** —— 成片编码
- **Python** —— QC 脚本（运动判据、构图量化、气口检查）

## 目录结构

```
src/
  shots/G1-G6/        # 12 个镜头（每组 2 个）+ BUILD_NOTES.md 记录构建决策
  overlay/            # 片头标题、章节卡、字幕、HUD、进度条、片尾署名
  ui.tsx              # SVG 图元库（黑洞、地球、中微子点、信封……）
  common/             # 缓动、时间轴、章节定义
script/               # 解说词定稿、分镜表源文件、时间轴 JSON
research/             # 事实调研文档
scripts/              # 渲染、TTS、QC 全流程脚本（render.sh / motion_check.py / frame_metrics.py / pause_check.py）
分镜表.md              # 12 镜头分镜表（叙事/节拍/动效/停留/坐标）
public/assets/        # 配音 audio.wav + 字体
```

## 使用方式

```bash
# 安装依赖
npm install

# 生成配音（从 script/narration.txt 合成 audio.wav + 时间轴）
python3 scripts/tts_build.py

# 预览（实时调参数）
npm run studio

# 整片渲染 → renders/icecube-neutrino_v1.mp4
VER=v1 scripts/render.sh

# QC 量化检查（运动判据 / 构图 / 气口）
python3 scripts/motion_check.py --frames fin_frames
python3 scripts/frame_metrics.py --out qc/frame_metrics_v1.md
```

渲染需要联网获取 edge-tts 服务；成片 h264 crf16 ≈ 38MB。

## 质量控制

成片通过三层量化闸门（判据见 `scripts/motion_check.py` 顶部常量）：

- **运动判据**：每个镜头最长静止 ≤3 秒（防止画面"卡住"），落位 hold ≥30 帧 —— 12/12 通过
- **构图量化**： frame_metrics 抽帧检查强调色碎片、主体尺度等构图异常 —— 11/12 通过（SC12 收尾光点碎片计数为已知的装饰性观察项）
- **气口检查**：解说稿断句校验（`pause_check.py`），配音后气口断句全绿
- **类型检查**：`npx tsc --noEmit` 0 错误

## 作者

**incarnation-gem**

## 许可

视频内容（解说词、分镜、画面）采用 CC BY 4.0；代码采用 MIT。
