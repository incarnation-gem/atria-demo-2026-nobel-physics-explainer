import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, FONT_HEAVY, FONT_TECH, GlitchIn, emphasisPulse} from '../../common';
import {CText, Pill, Svg, NeutrinoDot, SoftIn, WHITE, GREY, PURPLE, fadeIn, slideUp, exitOp, exitAccel, glowPurpleS, glowOffK, abs} from '../../ui';
import {LightSweep, StageLine, GhostText, setPiece, GlowBlob, ghostOpacity} from '../../fx';

/**
 * SC02 中微子登场（高光时刻·登场型，扫光白名单 #1）· N 667–1028（S05–S06，分镜 v3 +8% 配音）
 * 严格按 fx.tsx 的 SET_PIECE 相对帧：T0=675（S05 c1）→ 三轮扫光 679/697/715 → StageLine 693
 * → GhostText 712 预示 → 白闪 + 「中微子」Noto 900 132px 白 + 紫硬投影 GlitchIn（rgbSplit 8）
 * → emphasisPulse → 副标「Neutrino」slideUp → 三枚拆词 Pill SoftIn 2 帧错峰。
 * S06 b3「沿着直线」(918)：白线自左 draw-on 出画面 + NeutrinoDot 沿线循环跑到末拍。
 * 持续：Pill 轮流微亮 + 直线光点循环；停留：大字脉冲落位 880 → 离场 1002 = 122 帧。
 */
const F0 = 667;
const TO = 1028; // 分镜 v3：= SC03 首句 S07.from−9（吃满段末停顿）
/** 离场归零锚定在 S06 句末之后（1002–1008）：末拍停留已 122 帧（≥目标 30–45），不再延长；
 *  1009–1028 保持「已离场归零」的空帧（纯幕底），同时让字幕带 1007 句末消失落在离场窗口内、不破坏 hold 判定 */
const EXIT_AT = 1008;
const EXIT_LEN = 6; /* 末 6 帧归零（分镜「末 6–8 帧」），N=EXIT_AT 为 0 */
const T0 = 675; // 清场后第一拍（S05 c1，分镜节拍列）；N 667–674 为清场
const T1 = 838; // 主角节拍「它叫中微子」（S06 c1，分镜节拍列）
const sp = setPiece(T0, T1); // sweeps [679,697,715] line 693 ghost 712 flash 838 pulse 850 sub 854 pills 862

// 版式：大字 (640,350) → 副标 416 → Pill 行 431 纵向压成一个连通整体（frame_metrics 按连通物体
// 计主体尺度：大字 132px 单独只 ~141px < hero 170，整体块 ~198px）；直线 492 在 Pill 行下方作独立细线
const BIG = {cx: 640, cy: 350, size: 132};
const SUB = {cx: 640, cy: 416};
const LINE_Y = 500; // 独立细线，不参与主体块（918 才入场）；v4：Pill 行（底 477）下方净空 15→23px
const PILL_Y = 431; // 与副标间距 ≤12px → 大字 / 副标 / Pill 成一个连通整体
const T_LINE = 918; // 直线 draw-on（S06 b3，分镜节拍列「沿着直线」）
const T_GLOW_CYCLE = 922; // Pill 轮流微亮周期起点（pills 862 + 60 保持相对关系）
const PILLS: Array<{text: string; cx: number; w: number}> = [
  {text: '不带电', cx: 420, w: 150},
  {text: '不转弯', cx: 640, w: 150},
  {text: '直奔地球', cx: 860, w: 172},
];

export const SC02: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, EXIT_AT, EXIT_LEN);
  const exUp = -exitAccel(Math.max(0, N - (EXIT_AT - EXIT_LEN)), 0.35); // 6 帧归零 + 加速上出 22px（锚定在 EXIT_AT）
  const bigGlowK = fadeIn(N - T1, 8) * glowOffK(N, EXIT_AT, 6, EXIT_LEN); // 大字光：8 帧渐亮，离场前先灭
  /** 舞台光斑强度：镜头首帧起 8 帧亮起（清场+扫光段 667–692 有大柔光、不算空场），主角 GlitchIn 后 12 帧让位 */
  const stageGlowK = (n: number) => clamp01((n - F0) / 8) * (1 - clamp01((n - sp.flash) / 12));

  // 幽灵轮廓：12 帧淡入到 0.10 并呼吸，pulse 起撤掉（登场型专用，只随扫光出现）
  const ghost = ghostOpacity(N, sp.ghost, sp.pulse);
  const pulse = emphasisPulse(N - sp.pulse, {peak: 1.11});
  const subN = N - sp.sub;
  const subY = SUB.cy + slideUp(subN, 80, 22);

  // 直线 draw-on（24 帧）与沿线光点（45 帧一周期循环到末拍）
  const lineP = clamp01((N - T_LINE) / 24);
  const dotT = (N - T_LINE) % 45;
  const dotX = 180 + (dotT / 45) * 1100; // 180 → 1280，跑出右侧出画

  const pillGlow = (i: number) => {
    const t = N - T_GLOW_CYCLE;
    if (t < 0) return 0;
    const u = (t + i * 30) % 90; // 30 帧窗口，三 Pill 轮流
    return 0.75 * (u < 30 ? Math.sin(Math.PI * (u / 30)) : 0) * glowOffK(N, EXIT_AT, 6, EXIT_LEN);
  };

  return (
    <div style={{position: 'absolute', inset: 0, opacity: exOp, transform: exUp === 0 ? undefined : `translateY(${exUp.toFixed(1)}px)`}}>
      {/* 三轮紫光横扫 */}
      <LightSweep N={N} rounds={sp.sweeps} dy={BIG.cy - 335} />
      {/* 中央舞台光线：展宽 → 呼吸 → 节拍帧白闪 3 帧后消失 */}
      <StageLine N={N} f0={sp.line} flashAt={sp.flash} cx={BIG.cx} cy={BIG.cy} />

      {/* 舞台光斑：扫光/预示阶段（693→850）中央大柔光，避免清场期近黑屏（样片 SC08 QC 修复方向） */}
      <GlowBlob cx={BIG.cx} cy={BIG.cy} r={180} N={N} k={stageGlowK(N)} alpha={0.42} />
      {/* 主角大字脚下的紫柔光斑（≥3000px²，呼吸 + 离场先灭） */}
      <GlowBlob cx={BIG.cx} cy={BIG.cy} r={210} N={N} k={bigGlowK} alpha={0.34} />

      {/* 「中微子」白描边轮廓 10% 预示（只随扫光出现，登场型专用） */}
      <GhostText cx={BIG.cx} cy={BIG.cy} size={BIG.size} weight={900} family={FONT_HEAVY} letterSpacing={8} scaleX={0.85} dy={-2} opacity={ghost}>
        中微子
      </GhostText>

      {/* 直线 draw-on（S06 b3「沿着直线」）+ NeutrinoDot 沿线循环跑出右侧 */}
      <div style={{...abs(180, LINE_Y - 1.5, 1040, 3), overflow: 'hidden', boxShadow: '0 0 8px rgba(255,255,255,.55)', opacity: clamp01(N >= T_LINE ? 1 : 0)}}>
        <div style={{width: 1040, height: 3, background: WHITE, transform: `scaleX(${lineP.toFixed(4)})`, transformOrigin: '0 50%'}} />
      </div>
      <Svg bloom={false}>
        {N >= T_LINE ? <NeutrinoDot x={dotX} y={LINE_Y} dir={0} tail={46} dotR={7} /> : null}
      </Svg>

      {/* 白闪后主角登场：Noto 900 132px 白 + 紫硬投影 + GlitchIn（rgbSplit 8），落位脉冲 */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${BIG.cx}px ${BIG.cy}px`, transform: pulse === 1 ? undefined : `scale(${pulse.toFixed(4)})`}}>
        <GlitchIn N={N} f0={sp.flash} rgbSplit={8} slices={20} sliceBands={4} seed={2}>
          <CText cx={BIG.cx} cy={BIG.cy} size={BIG.size} weight={900} scaleX={0.85} letterSpacing={8} color={WHITE} dy={-2} shadow={`6px 6px 0 ${PURPLE}, 0 0 28px rgba(102,45,248,.45)`}>
            中微子
          </CText>
        </GlitchIn>
      </div>

      {/* 副标「Neutrino」Exo 2 灰小字（不与主体同色同大小）自下滑入 Δ80 */}
      {subN >= 0 ? (
        <CText cx={SUB.cx} cy={subY} size={26} weight={600} family={FONT_TECH} italic scaleX={0.8} letterSpacing={2} color={GREY} dy={0} opacity={fadeIn(subN, 8)}>
          Neutrino
        </CText>
      ) : null}

      {/* 三枚拆词 Pill：SoftIn 2 帧错峰（本镜唯一 glitch 已用在大字，Pill 无光），之后轮流微亮 ≤1 处 */}
      {PILLS.map((p, i) => (
        <SoftIn key={p.text} N={N} f0={sp.pills + 2 * i} dy={6}>
          <Pill x={p.cx - p.w / 2} y={PILL_Y} w={p.w} h={46} fill="#000" stroke={WHITE} sw={2} text={p.text} fontSize={24} weight={700} glow={glowPurpleS(pillGlow(i))} />
        </SoftIn>
      ))}
    </div>
  );
};
