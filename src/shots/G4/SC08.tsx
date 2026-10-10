import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, kf, easeInOutPow, FONT_ORB, FONT_HEAVY, GlitchIn} from '../../common';
import {
  Svg, EnvelopeIcon, GalaxyIcon, LineArrow, NeutrinoDot, CText, Pill, TechText,
  WHITE, GREY, GREY_MID, PURPLE, PURPLE_LIGHT,
  fadeIn, SoftIn, exitOp, glowOffK,
} from '../../ui';
import {GlowBlob} from '../../fx';

/**
 * SC08 第一封与第二封信 · N 3524–3878（S23–S24，分镜 v3）
 * S23 3532–3682「2013 年 / 第一封，来自宇宙深处的信 / 能量是一千万亿电子伏级」（末块 53）
 * S24 3693–3856「2017 年 / 一个 290 万亿电子伏的中微子 / 指向远方一个 / 正在剧烈耀发的星系」（末块 38 短）
 * 画面：中央横轴时间线（x 180–1110，y 540；刻度 2013/2017/2022/2026 灰小字）→ 信 1（cx 280：EnvelopeIcon 240×180
 *      + 大年份「2013」Orbitron 128px 紫硬投影 + Pill「第一封」+「一千万亿 eV」）。3693 信 1 承接位移缩 0.6 左移 60
 *      （锚在时间轴节点）；信 2（cx 640 入场：2017 + Pill「第二封」+「290 万亿 eV」）→ 3794 指引线 draw-on 到
 *      右上星系图标（(1120,235) GalaxyIcon r32，前挂 3794 / 3819 白闪一次）+ 灰小字「TXS 0506+056」。
 * 主角 = 信卡组（信封白边框 240×180 + 大年份连通，量级 276px），年份数字紫硬投影 + 组后紫柔光斑。
 * 持续：指引线上光点持续向星系方向跑到末拍（26 帧一循环，r11 / 拖尾 68）。
 * 停留：星系图标 + TXS 标签前挂 3794、3830 落位 → 离场 3872 = 42 帧（末块 S24 38 帧短，按分镜前挂）。
 * 运镜：3693 信 1 承接位移（16 帧 easeInOutPow 2.5，运镜清单已计入）；3709 ≤ 离场起点−30。
 * 闪烁：本镜唯一 GlitchIn = 「一千万亿 eV」（白名单）；年份滚动计数、信卡、标签一律 SoftIn。
 */
const F0 = 3524;
const TO = 3878;
const EXIT_AT = 3872; // 末 6 帧归零（N=TO 为 0）
const EXIT_LEN = 6;

// 节拍（分镜 SC08 节拍列；容差 −6…+3）
const T_AXIS = 3532; // 时间线 draw-on + 「2013」计数起（S23 b1）
const T_Y1 = 3532; // 「2013」滚动落定（SoftIn + 计数，不闪）
const T_E1 = 3562; // 信 1 信封 slideUp（S23 b2「第一封」）
const T_STEM1 = 3568; // 信 1 茎线 draw-on
const T_P1 = 3575; // Pill「第一封」
const T_E1GLITCH = 3630; // 「一千万亿 eV」GlitchIn（S23 b3「能量是…」；本镜唯一闪烁）
const T_Y2 = 3693; // 信 1 承接位移 + 信 2 「2017」计数（S24 b1）
const T_E2 = 3699; // 信 2 信封 slideUp
const T_STEM2 = 3708; // 信 2 茎线
const T_P2 = 3720; // Pill「第二封」
const T_E2V = 3725; // 「290 万亿 eV」（S24 b2 ≈ 3723）
const T_GUIDE = 3794; // 指引线 draw-on + 星系图标 SoftIn 前挂（S24 b3「指向远方一个」；末块短按分镜前挂）
const T_GFLASH = 3819; // 星系白闪一次 + TXS 标签（S24 b4「正在剧烈耀发的星系」）

// 版面（内容主区 y110–620；x60–1220；无轨）
const AXIS_Y = 540;
const TICKS: Array<[number, string]> = [[280, '2013'], [640, '2017'], [880, '2022'], [1080, '2026']];
const ENV = {w: 240, h: 180};
const L1 = {cx: 280, envX: 160}; // 信 1（2013）
const L2 = {cx: 640, envX: 520}; // 信 2（2017）
const YEAR_CY = 360, YEAR_SIZE = 128;
const PILL_Y = 416, EVAL_CY = 490; // 标签与轴的净空：Pill 底 452 → 能量标 475 → 轴 532
const GLX = {cx: 1120, cy: 235, r: 32};
const GUIDE = {x0: 760, y0: 220, x1: 1086, y1: 235};
const STEM_LEN = 224; // 信封底(310) → 节点上(534)

/** 单封信卡组：信封 + 茎线 + 大年份（滚动计数）+ 标签。shiftK = 承接位移进度（信 1 用）。 */
const Letter: React.FC<{
  N: number;
  cx: number;
  envX: number;
  yearFrom: number;
  yearTo: number;
  yearAt: number;
  envAt: number;
  stemAt: number;
  pillAt: number;
  pillText: string;
  shiftK: number;
  glowK: number;
}> = ({N, cx, envX, yearFrom, yearTo, yearAt, envAt, stemAt, pillAt, pillText, shiftK, glowK}) => {
  const envN = N - envAt;
  const envOp = envN < 0 ? 0 : fadeIn(envN, 8);
  const envY = 130 + 50 * Math.pow(1 - clamp01(envN / 22), 2.5); // slideUp Δ50（≤120，不穿字幕带）
  const year = Math.round(kf(N, [[yearAt, yearFrom], [yearAt + 16, yearTo]]));
  const yearOp = N < yearAt ? 0 : fadeIn(N - yearAt, 8);
  const stemP = clamp01((N - stemAt) / 18);
  // 承接位移：缩 0.6 + 左移 60，锚在时间轴节点 (cx, AXIS_Y)
  const tf = `translate(${(-60 * shiftK).toFixed(1)}px,0px) scale(${(1 - 0.4 * shiftK).toFixed(3)})`;
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: `${cx}px ${AXIS_Y}px`, transform: shiftK > 0 ? tf : undefined}}>
      {/* 主角光斑（呼吸，离场先灭；放在年份/标签带后方，不被信封黑底遮住） */}
      <GlowBlob cx={cx} cy={365} r={150} N={N} k={glowK} alpha={0.24} />
      {/* 茎线：信封底 → 时间轴节点（draw-on，画在文字之下） */}
      <Svg bloom={false}>
        <line
          x1={cx}
          y1={130 + ENV.h}
          x2={cx}
          y2={AXIS_Y - 6}
          stroke={GREY_MID}
          strokeWidth={1.5}
          pathLength={STEM_LEN}
          strokeDasharray={STEM_LEN}
          strokeDashoffset={STEM_LEN * (1 - stemP)}
        />
      </Svg>
      {/* 信封（闭合，白边黑底） */}
      <div style={{position: 'absolute', inset: 0, opacity: envOp}}>
        <EnvelopeIcon x={envX} y={envY} w={ENV.w} h={ENV.h} sw={2.5} />
      </div>
      {/* 大年份：Orbitron 128px 白 + 紫硬投影（SoftIn + 16 帧滚动落定，不闪） */}
      <div style={{position: 'absolute', inset: 0, opacity: yearOp}}>
        <CText
          cx={cx}
          cy={YEAR_CY}
          size={YEAR_SIZE}
          weight={700}
          family={FONT_ORB}
          letterSpacing={2}
          color={WHITE}
          dy={-2}
          shadow={`6px 6px 0 ${PURPLE}, 0 0 28px rgba(102,45,248,.45)`}
          style={{fontVariantNumeric: 'tabular-nums'}}
        >
          {year}
        </CText>
      </div>
      {/* 标签：Pill「第 N 封」+ 能量标签（承接位移时随组缩小并淡出，信 1 让位给信 2 后由信 2 的标签接棒） */}
      <SoftIn N={N} f0={pillAt} style={{opacity: 1 - shiftK}}>
        <Pill x={cx - 65} y={PILL_Y} w={130} h={36} fill={PURPLE} sw={2} text={pillText} fontSize={22} weight={700} />
      </SoftIn>
    </div>
  );
};

export const SC08: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, EXIT_AT, EXIT_LEN);
  const shiftK = clamp01((N - T_Y2) / 16); // 信 1 承接位移进度
  const glow1K = fadeIn(N - T_Y1, 10) * (1 - shiftK) * glowOffK(N, EXIT_AT, 6, EXIT_LEN);
  const glow2K = N < T_E2 ? 0 : fadeIn(N - T_E2, 10) * glowOffK(N, EXIT_AT, 6, EXIT_LEN);

  // 时间线 draw-on（20 帧）
  const axisP = clamp01((N - T_AXIS) / 20);
  // 星系图标：SoftIn 前挂 3794；3819 白闪一次（6 帧三角脉冲 1→1.8→1）
  const glxOp = N < T_GUIDE ? 0 : fadeIn(N - T_GUIDE, 10);
  const gf = N - T_GFLASH;
  const flash = gf < 0 || gf >= 6 ? 1 : 1 + 0.8 * (gf < 3 ? gf / 3 : (6 - gf) / 3);
  // 指引线光点：26 帧一循环跑完整条线（旧 45 帧循环 + tail24/dotR5 的移动幅度在采样上不足 0.35，
  // 3730–3865 判静止 4.5s；按 §7「小面积动作 → 加大幅度」加大半径/拖尾并缩短周期，单步幅度 ×2.2）
  const dotT = N >= T_GUIDE + 4 ? ((N - T_GUIDE - 4) % 26) / 26 : -1;
  const dotX = dotT < 0 ? -1 : GUIDE.x0 + (GUIDE.x1 - GUIDE.x0) * dotT;
  const dotY = dotT < 0 ? -1 : GUIDE.y0 + (GUIDE.y1 - GUIDE.y0) * dotT;

  return (
    <div style={{position: 'absolute', inset: 0, opacity: exOp}}>
      <Svg bloom={false}>
        {/* 时间线主轴（右端箭头，draw-on 20 帧） */}
        <LineArrow x0={180} y0={AXIS_Y} x1={1110} y1={AXIS_Y} p={axisP} rodW={3} headL={22} headW={22} />
        {/* 刻度：竖线 + 年份（灰小字，2 帧错峰淡入） */}
        {TICKS.map(([tx, ty], i) => {
          const tp = clamp01((N - T_AXIS - 8 - 4 * i) / 10);
          if (tp <= 0) return null;
          return (
            <g key={tx} opacity={tp}>
              <line x1={tx} y1={AXIS_Y - 8} x2={tx} y2={AXIS_Y + 8} stroke={GREY} strokeWidth={2} />
              <text x={tx} y={AXIS_Y + 34} textAnchor="middle" fontFamily={FONT_HEAVY} fontSize={22} fontWeight={600} fill={GREY} style={{fontVariantNumeric: 'tabular-nums'}}>
                {ty}
              </text>
            </g>
          );
        })}
        {/* 信 1 / 信 2 的轴上节点（紫，激活时凸显） */}
        {[[L1.cx, glow1K], [L2.cx, glow2K]].map(([tx, gk], i) => {
          const np = clamp01((N - (i === 0 ? T_STEM1 : T_STEM2)) / 12);
          if (np <= 0) return null;
          return <circle key={i} cx={tx} cy={AXIS_Y} r={5 + 2 * gk} fill={PURPLE} stroke={WHITE} strokeWidth={2} opacity={np} />;
        })}
        {/* 指引线：信 2 信封 → 星系（draw-on 16 帧，紫色虚线） */}
        <LineArrow x0={GUIDE.x0} y0={GUIDE.y0} x1={GUIDE.x1} y1={GUIDE.y1} p={clamp01((N - T_GUIDE) / 16)} color={PURPLE_LIGHT} rodW={2.5} headL={16} headW={16} dashed />
        {/* 沿线光点（循环跑到末拍；r11/拖尾68，移动幅度覆盖整条指引线） */}
        {dotT >= 0 ? <NeutrinoDot x={dotX} y={dotY} dir={Math.atan2(GUIDE.y1 - GUIDE.y0, GUIDE.x1 - GUIDE.x0)} tail={68} dotR={11} /> : null}
        {/* 星系图标（漩涡盘简笔；3819 白闪时 brightness 抬升） */}
        {glxOp > 0 ? (
          <g style={{filter: flash > 1.001 ? `brightness(${flash.toFixed(2)})` : undefined}} opacity={glxOp}>
            <GalaxyIcon cx={GLX.cx} cy={GLX.cy} r={GLX.r} />
          </g>
        ) : null}
      </Svg>

      {/* 信 1（2013，3693 起承接位移缩 0.6 左移让位） */}
      <Letter
        N={N}
        cx={L1.cx}
        envX={L1.envX}
        yearFrom={2009}
        yearTo={2013}
        yearAt={T_Y1}
        envAt={T_E1}
        stemAt={T_STEM1}
        pillAt={T_P1}
        pillText="第一封"
        shiftK={shiftK}
        glowK={glow1K}
      />
      {/* 信 2（2017） */}
      <Letter
        N={N}
        cx={L2.cx}
        envX={L2.envX}
        yearFrom={2013}
        yearTo={2017}
        yearAt={T_Y2}
        envAt={T_E2}
        stemAt={T_STEM2}
        pillAt={T_P2}
        pillText="第二封"
        shiftK={0}
        glowK={glow2K}
      />

      {/* 「一千万亿 eV」：本镜唯一 GlitchIn（信 1 的能量标签，3630；承接位移时淡出让位） */}
      {N >= T_E1GLITCH ? (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - shiftK}}>
          <GlitchIn N={N} f0={T_E1GLITCH} rgbSplit={5} slices={12} sliceBands={3} seed={5}>
            <CText cx={L1.cx} cy={EVAL_CY} size={30} weight={900} scaleX={0.85} color={WHITE} dy={-1} shadow="0 0 16px rgba(102,45,248,.8)">
              一千万亿 eV
            </CText>
          </GlitchIn>
        </div>
      ) : null}

      {/* 「290 万亿 eV」：信 2 能量标签（SoftIn，不闪） */}
      <SoftIn N={N} f0={T_E2V}>
        <CText cx={L2.cx} cy={EVAL_CY} size={30} weight={900} scaleX={0.85} color={WHITE} dy={-1} shadow="0 0 12px rgba(161,117,241,.6)">
          290 万亿 eV
        </CText>
      </SoftIn>

      {/* 星系标签（灰小字，3819） */}
      <SoftIn N={N} f0={T_GFLASH}>
        <TechText cx={GLX.cx} cy={276} text="TXS 0506+056" fontSize={20} color={GREY} scaleX={0.85} glow={false} />
      </SoftIn>
    </div>
  );
};
