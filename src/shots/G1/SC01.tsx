import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, easeInOutPow, kf, rnd, emphasisPulse, FONT_ORB, GlitchIn} from '../../common';
import {
  Svg, EarthIcon, LineArrow, Cross, CText, Pill,
  WHITE, GREY, PURPLE, PURPLE_LIGHT, TEXT_GLOW,
  fadeIn, scaleIn, SoftIn, exitOp, glowOffK,
} from '../../ui';
import {CameraRig, GlowBlob} from '../../fx';

/**
 * SC01 盲区：两种信使都指不了路 · N 33–666（S01–S04，分镜 v3 +8% 配音）
 * 主角 = 左侧黑洞喷流（整体 239px，紫柔光），地球是配角靶标；两路尝试（光子 → 雾团吞 / 宇宙线 → 磁场甩弯）
 * 全程 1.0→1.05 慢推贯穿（运镜清单未列本镜，慢推给持续动作上保险）；喷流粒子持续推进到末拍。
 * 本镜唯一 glitch = 「？」Orbitron 96px 白（闪烁白名单），其余文字一律 SoftIn。
 *
 * v4 视觉清理（「线条与图像粘连」）：帧区间 / 节拍 / 闪烁白名单 / 离场锚点全部不变，只改净空与清晰度——
 *  1) 喷流粒子 12×2 → 5×2 颗、步距 16px（≥1.5×直径）、拖尾缩短到不与相邻粒子相接、改白色（避免强调色碎片）；
 *  2) 喷流锥改为「视界边缘细颈 → 1.25r 外张开」的梯形（LocalJet），锥体主体与吸积盘/视界净空分离；
 *     粒子起点距圆心 1.25r，与锥壁/视界墨迹净空 ≥15px（旧版粒子从 r·0.5 深入视界内部）；
 *  3) 磁力线改成 3 条同心弧（间距 32px、不共弧不并行），宇宙线直指地球 → 抵磁场左缘 → 向下甩出，
 *     全程位于弧群左侧（x ≤ 786）不与磁力线相交；各功能组净空见 BUILD_NOTES。
 *  幅度补偿：粒子 3.0 步/帧 + 路径 80px（旧 1.6 步/帧 + 42px），跑得更远而不是更密。
 */
const F0 = 33;
const TO = 666; // 分镜 v3：= SC02 首句 S05.from−9，吃满段末停顿
const EXIT_LEN = 6; // 末 6 帧归零（分镜「末 6–8 帧离场归零」：N=TO 为 0；6 帧后亮度落在 0.9·ref 下，hold 回溯不卡）

// 节拍（分镜表 v3 · SC01；容差 −6…+3）——v4 未动
const T_JET = 46; // 喷流 21 帧缩放入场。v1 终检：原 35 与延长到 62 帧的片头标题（离场 51–62）同框，黑洞小图顶到标题左缘；推到 46 后入场在标题走后展开，且更贴 S01 b1「猛烈加速器」的语气
const T_LABEL = 85; // 「黑洞喷流」标签（S01 b2「藏在黑洞喷流里」）
const T_AMPLY = 142; // 「100 万倍」（S01 b4，分镜节拍列）
const T_FOG = 229; // 气体尘埃雾团（S02 b1「但它的光」，分镜节拍列）
const T_PHOTON = 237; // 光子箭头 draw-on（分镜动效列）
const T_CROSS = 262; // 雾团上的红叉（b3「尘埃吞掉」268 前 6 起、12 帧落定）
const T_EARTH = 342; // 地球配角（S03 b1）
const T_RAY = 354; // 宇宙线直线路径 draw-on
const T_MAG = 383; // 磁力线 draw-on（分镜节拍列「带电」）
const T_BEND = 406; // 宇宙线被甩弯（kf 26 帧，分镜节拍列「甩了一路」）
const T_QTAIL = 434; // 末端灰「?」SoftIn（甩弯落定后）
const T_BIGQ = 543; // 大「？」GlitchIn（末块 S04 仅 29 帧：分镜停留栏前挂到上一拍）
const T_PULSE = 555; // 「？」落位（567）后 emphasisPulse；567 → 离场 660 保持 93f

// 版面（v4 清理重排：净空优先，分镜坐标为参考值）
const JET = {cx: 300, cy: 340, size: 140, jetL: 32}; // r=70；锥尖 = 1.25r+jetL = 119.5 → 整体 239px
const EARTH = {cx: 1060, cy: 430, r: 62};
const FOG = {cx: 620, cy: 250, w: 150, h: 80};
const PHOTON = {x0: 356, y0: 224, x1: 546, y1: 268}; // 上锥尖外 → 雾团左缘外 ≈10px 净空（入射方向与椭圆交点 (556,271)；「被吞」由雾团红叉表达，避免箭头没入椭圆造成粘连）
const RAY = {x0: 357, y0: 463, s2a: [786, 444], s2b: [786, 545]}; // 下锥尖外 → 直线指地球（s2a 在喷流→地球线上）→ 甩弯指向灰「?」
const RAY_STRAIGHT_C = [571.5, 453.5]; // 直线段中点（控制点取中点 → 二次贝塞尔即直线）
const RAY_BEND_C = [700, 520]; // 甩弯控制点：向左下兜出磁场弧群
const Q_TAIL = {cx: 800, cy: 590};
const Q_BIG = {cx: 450, cy: 155};
const PILL = {x: 110, y: 216, w: 120, h: 34}; // 喷流标签移到左上（原位正上方被上喷流粒子流占用）
const AMPLY = {cx: 300, cy: 545}; // 「100 万倍」下移，避开下喷流粒子流末端

/** 喷流粒子：沿喷流轴自 1.25r（锥体基座）向远端持续推进，确定性纯函数（v4：少而清）。
 *  5×2 颗、步距 16px（≥1.5×直径 8–10）、拖尾长 = 半径（与后方相邻粒子净空 ≥ 6px，不相接）；
 *  白色（紫色粒子逐颗会被 frame_metrics 计成强调色碎片）；3.0 步/帧 + 80px 路径 = 幅度补偿。 */
const JetParticle: React.FC<{N: number; i: number; s: 1 | -1}> = ({N, i, s}) => {
  if (N < T_JET + 8) return null;
  const pCy = N - T_JET - 8;
  const r = JET.size / 2;
  const apex = JET.cy - s * r * 1.25; // 上喷流 252.5 / 下喷流 427.5（距圆心 1.25r）
  const L = 80; // 单侧路径长（旧 42）
  const PITCH = 16; // 步距 = L/5 ≥ 1.5×直径
  const SPEED = 3.0; // 步/帧（旧 1.6）
  const d = (pCy * SPEED + i * PITCH) % L; // 等距相位 → 任意时刻粒子间距恒为 16px
  if (d < 18 || d > 74) return null; // 18px 内为「引擎段」（锥颈处锥宽不足）不露头；62→74 淡出，74 后不可见
  const off = (rnd(12, i) - 0.5) * 10; // ±5px 横向扰动（锥体内净空充足：d=18 处锥半宽 38.5）
  const px = JET.cx + off;
  const py = apex - s * d;
  const rad = 4 + rnd(14, i); // 4–5 → 直径 8–10，1.5× = 12–15 ≤ 16 ✓
  let op = 0.55 + 0.45 * rnd(13, i);
  if (d > 62) op *= 1 - (d - 62) / 12;
  if (op <= 0.02) return null;
  const trail = rad; // 拖尾 = 半径：后方 16px 的相邻粒子圆顶（16-rad=11.5）与拖尾末端（rad=5）净空 6.5px
  return (
    <g key={`${s}${i}`}>
      <rect
        x={px - rad * 0.5}
        y={s === 1 ? py : py - trail}
        width={rad}
        height={trail}
        rx={rad * 0.4}
        fill={WHITE}
        opacity={op * 0.3}
      />
      <circle cx={px} cy={py} r={rad} fill={WHITE} opacity={op} />
    </g>
  );
};

/** 磁力线（v4）：3 条同心弧（圆心 (760,400)，半径 90/122/154，间距 32px），
 *  只画右侧 ±60° 段 → 弧群左缘 x≈805，与宇宙线（x ≤ 786）全程不相交、不并行。 */
const MAG_LINES = ['M805,322 Q895,400 805,478', 'M821,294 Q943,400 821,506', 'M837,267 Q991,400 837,533'];

/** SC01 专属喷流图元（LocalJet）：与 ui.tsx BlackHoleJet 同款式（同色 / 同描边 / 同吸积盘与视界），
 *  差别仅喷流锥：自视界边缘 1.0r 出发的细颈（半宽 3）→ 1.25r 外张开的锥体（半宽 r·0.75），
 *  锥体主体与吸积盘（顶 0.71r）/视界边缘净空分离；细颈保留与视界的连接（主角连通 239px 不退化）。
 *  任务约束只能改 src/shots/G1/**，故在组内文件实现变体（BlackHoleJet 仅本镜使用，无跨镜复用）。 */
const LocalJet: React.FC<{
  cx: number;
  cy: number;
  size: number;
  jetL: number;
  sw?: number;
  color?: string;
  accent?: string;
  glowK?: number;
  opacity?: number;
}> = ({cx, cy, size, jetL, sw = 2.5, color = WHITE, accent = PURPLE_LIGHT, glowK = 1, opacity = 1}) => {
  const r = size / 2;
  const diskR = r * 2.1;
  const gk = clamp01(glowK);
  const tipD = r * 1.25 + jetL; // 锥尖距圆心
  const hw0 = 3; // 颈半宽（1.0r 处）
  const hw1 = r * 0.75; // 锥半宽（1.25r+jetL 处，同 BlackHoleJet）
  return (
    <g opacity={opacity}>
      {gk > 0.03 ? (
        <circle
          cx={cx}
          cy={cy}
          r={r * 1.15}
          fill="none"
          stroke={accent}
          strokeWidth={sw}
          opacity={0.35 * gk}
          style={{filter: `drop-shadow(0 0 ${10 * gk}px rgba(102,45,248,${0.8 * gk}))`}}
        />
      ) : null}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path
            d={`M${cx - hw0},${cy + s * r} L${cx + hw0},${cy + s * r} L${cx + hw1},${cy + s * tipD} L${cx - hw1},${cy + s * tipD} Z`}
            fill={accent}
            opacity={0.22}
          />
          {/* 描边用开口折线（去掉锥尖横线）：粒子越过锥尖平面时不再触碰墨迹，锥体外观不变 */}
          <path
            d={`M${cx - hw1},${cy + s * tipD} L${cx - hw0},${cy + s * r} L${cx + hw0},${cy + s * r} L${cx + hw1},${cy + s * tipD}`}
            fill="none"
            stroke={accent}
            strokeWidth={sw * 0.8}
            opacity={0.85}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      ))}
      <ellipse cx={cx} cy={cy} rx={diskR} ry={diskR * 0.34} fill="none" stroke={color} strokeWidth={sw * 0.8} opacity={0.85} />
      <ellipse cx={cx} cy={cy} rx={diskR * 0.62} ry={diskR * 0.2} fill="none" stroke={accent} strokeWidth={sw * 0.6} opacity={0.7} />
      <circle cx={cx} cy={cy} r={r} fill="#04040a" stroke={color} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r * 0.4} fill={accent} opacity={0.9} />
    </g>
  );
};

export const SC01: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, TO, EXIT_LEN);
  // v1 终检：567–660 长稳定期仅粒子流（均值差 0.22–0.39）压在静止阈值 0.35 线上，换采样相位/编码噪声即 3.1s 挂 →
  // 叠 ±30% / 56 帧周期呼吸在既有柔光上（同片 SC06 余辉呼吸惯用法），抬到 ≈0.5 过阈
  const jetGlowK = fadeIn(N - T_JET, 12) * glowOffK(N, TO, 6, EXIT_LEN) * (0.7 + 0.3 * Math.sin((N / 56) * Math.PI * 2));

  // 喷流缩放入场 + 前几帧留底色（首帧不空）
  const js = N < T_JET ? 0 : scaleIn(N - T_JET, 21);
  const jetOp = N < T_JET ? 0 : clamp01(0.15 + 1.4 * js);
  const jetG = `translate(${JET.cx} ${JET.cy}) scale(${js.toFixed(4)}) translate(${-JET.cx} ${-JET.cy})`;

  // 宇宙线：直线段指向地球（控制点取直线段中点 → 二次贝塞尔即直线）→ 26 帧甩成向下大弯，末端指向灰「?」
  const bend = kf(N, [[T_BEND, 0], [T_BEND + 26, 1]], easeInOutPow(2.5));
  const pcx = RAY_STRAIGHT_C[0] + (RAY_BEND_C[0] - RAY_STRAIGHT_C[0]) * bend;
  const pcy = RAY_STRAIGHT_C[1] + (RAY_BEND_C[1] - RAY_STRAIGHT_C[1]) * bend;
  const p2x = RAY.s2a[0] + (RAY.s2b[0] - RAY.s2a[0]) * bend;
  const p2y = RAY.s2a[1] + (RAY.s2b[1] - RAY.s2a[1]) * bend;
  const rayD = `M${RAY.x0},${RAY.y0} Q${pcx},${pcy} ${p2x},${p2y}`;
  const rayP = clamp01((N - T_RAY) / 20);

  // 大「？」：GlitchIn + 落位脉冲
  const qPulse = emphasisPulse(N - T_PULSE, {peak: 1.11});

  return (
    <CameraRig
      N={N}
      keys={[
        {f: F0, x: 640, y: 360, s: 1},
        {f: 600, x: 640, y: 360, s: 1.05}, // 慢推 600 结束并保持（运镜不进末拍：≤ 离场起点 660−30）
      ]}
      style={{opacity: exOp}}
    >
      {/* 主角光：圆斑柔光（呼吸 30 帧，离场前 6 帧先灭） */}
      <GlowBlob cx={JET.cx} cy={JET.cy} r={120} N={N} k={jetGlowK} alpha={0.34} />

      <Svg bloom={false}>
        {/* 气体尘埃雾团（S02） */}
        <ellipse
          cx={FOG.cx}
          cy={FOG.cy}
          rx={FOG.w / 2}
          ry={FOG.h / 2}
          fill="rgba(176,176,176,0.10)"
          stroke={GREY}
          strokeWidth={2}
          strokeDasharray="5 6"
          opacity={fadeIn(N - T_FOG, 10)}
        />
        {/* 光子箭头：上锥尖外 → 雾团（虚线 draw-on；末端没入雾团 = 被吞） */}
        <LineArrow x0={PHOTON.x0} y0={PHOTON.y0} x1={PHOTON.x1} y1={PHOTON.y1} p={clamp01((N - T_PHOTON) / 18)} dashed rodW={2.5} headL={18} headW={18} />
        {/* 雾团吞掉光子：红叉 12 帧 */}
        <Cross cx={FOG.cx} cy={FOG.cy} size={40} color={WHITE} sw={5} p={clamp01((N - T_CROSS) / 12)} opacity={fadeIn(N - T_CROSS, 6)} />
        {/* 磁力线 3 条同心弧（灰，2 帧错峰 draw-on） */}
        {MAG_LINES.map((d, i) => {
          const p = clamp01((N - T_MAG - 2 * i) / 20);
          if (p <= 0) return null;
          return <path key={i} d={d} fill="none" stroke={GREY} strokeWidth={2} pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - p)} />;
        })}
        {/* 宇宙线路径：直线指地球 → 被磁场甩弯（全程留在弧群左侧 x≤786，末端指向灰「?」） */}
        <path
          d={rayD}
          fill="none"
          stroke={WHITE}
          strokeWidth={2.5}
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 * (1 - rayP)}
          opacity={N >= T_RAY ? 0.9 : 0}
        />
        {/* 地球（配角靶标，S03 起淡入） */}
        <g opacity={N >= T_EARTH ? fadeIn(N - T_EARTH, 10) : 0}>
          <EarthIcon cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} sw={2.5} />
        </g>
        {/* 主角：黑洞喷流（缩放入场 + 粒子持续推进） */}
        <g transform={js < 1 ? jetG : undefined} opacity={jetOp}>
          <LocalJet cx={JET.cx} cy={JET.cy} size={JET.size} jetL={JET.jetL} sw={2.5} glowK={jetGlowK} />
          {[1, -1].map((s) => Array.from({length: 5}, (_, i) => <JetParticle key={`${s}-${i}`} N={N} i={i} s={s as 1 | -1} />))}
        </g>
      </Svg>

      {/* 标签 + 文字（一律 SoftIn，本镜唯一 glitch 给「？」） */}
      <SoftIn N={N} f0={T_LABEL}>
        <Pill x={PILL.x} y={PILL.y} w={PILL.w} h={PILL.h} fill="#000" sw={2} text="黑洞喷流" fontSize={22} weight={700} />
      </SoftIn>
      <SoftIn N={N} f0={T_FOG}>
        <CText cx={FOG.cx} cy={318} size={24} weight={600} color={GREY} dy={-1}>
          气体尘埃
        </CText>
      </SoftIn>
      <SoftIn N={N} f0={T_AMPLY}>
        <CText cx={AMPLY.cx} cy={AMPLY.cy} size={40} weight={900} scaleX={0.85} letterSpacing={1} color={WHITE} shadow={TEXT_GLOW}>
          100 万倍
        </CText>
      </SoftIn>
      <SoftIn N={N} f0={T_QTAIL} dy={6}>
        <CText cx={Q_TAIL.cx} cy={Q_TAIL.cy} size={42} weight={700} family={FONT_ORB} color={GREY} letterSpacing={-0.5}>
          ?
        </CText>
      </SoftIn>

      {/* 大「？」：本镜唯一 GlitchIn（rgbSplit 8）+ 落位脉冲；末 8 帧随整组归零 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${Q_BIG.cx}px ${Q_BIG.cy}px`,
          transform: qPulse === 1 ? undefined : `scale(${qPulse.toFixed(4)})`,
        }}
      >
        <GlitchIn N={N} f0={T_BIGQ} rgbSplit={8} slices={20} sliceBands={4} seed={1}>
          <CText cx={Q_BIG.cx} cy={Q_BIG.cy} size={96} weight={700} family={FONT_ORB} color={WHITE} letterSpacing={-1} shadow={`6px 6px 0 ${PURPLE}, 0 0 28px rgba(102,45,248,.45)`}>
            ?
          </CText>
        </GlitchIn>
      </div>
    </CameraRig>
  );
};
