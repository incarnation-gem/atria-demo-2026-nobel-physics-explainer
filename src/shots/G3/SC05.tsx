import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, easeOutCubic, kf, FONT_ORB, FONT_HEAVY, GlitchIn, rnd} from '../../common';
import {
  Svg, Box, Pill, CText, ClusterGrid, DOMSphere,
  WHITE, GREY, GREY_MID, GREY_LINE, GREY_LIGHT, PURPLE, TEXT_GLOW,
  fadeIn, slideUp, SoftIn, exitOp, exitAccel, fadeOut, glowOffK, abs,
} from '../../ui';
import {CameraRig, HeroGlow} from '../../fx';

/**
 * SC05 冰立方剖面 · N 1693–2480（S12–S16，分镜 v3）
 * 主角 = 左侧竖向剖面（冰面线 + 1450/2450 m 深度带 + 7 根缆绳 × 5 个 DOM，整体 ~370px 高，紫柔光呼吸）。
 * 节拍：1701 要抓它（剖面框自上而下 wipe 24f）/ 1710 全世界最大的靶子 / 1785 最亮的眼睛
 *      / 1826 冰盖下（深度标签 + 缆绳 2 帧错峰自下滑入）/ 1856–1990 DOM 逐串逐格点亮（带亮起白闪）
 *      / 2006 「86 根缆绳 × 60 = 5160 只」 / 2070 路灯阵列逐格点亮到 2114 + 2110 标签
 *      / 2140 概念 Pill 变灰下沉让位 / 2178 「1 km³」计数（S14 b4 一整块一立方公里的冰）
 *      / 2236 「≈ 十亿吨」Pill GlitchIn（本镜唯一闪烁·白名单）/ 2284/2306 「靶」「视网膜」双 Pill
 *      / 2351 深处冰高亮带（S16 b1）/ 2396 剖面局部 200 m 光路 inset + 推近 1→1.25（33f，末拍前停 46f）。
 * 持续：DOM 逐串逐格点亮 + 亮起白闪（1856–1990）；停留：末拍光路条 2429 落位 → 离场 2475 = 46f。
 * 事实依据 research §3 环节 5：86 根缆绳 × 60 DOM = 5160 只，深 1450–2450 m，间距 17 m；
 *      §3 环节 3：1 km³ 冰 ≈ 十亿吨；§3 环节 4：最深处吸收长度 ~200 m。
 */
export const F0 = 1693;
const TO = 2480; // = SC06 首句 S17.from−9，相邻镜头首尾相接
const EXIT_LEN = 6; // 末 6 帧归零（N=2480 为 0）

// ---- 节拍（分镜表 v3；容差 −6…+3）----
const T_WIPE = 1701; // S12 b1「要抓它」
const T_PILL1 = 1710; // S12 b2「全世界最大的靶子」（−4）
const T_PILL2 = 1785; // S12 b3「配最亮的眼睛」
const T_S13 = 1826; // S13 b1「冰盖下」→ 深度标签 + 缆绳入场
const T_DOM = 1856; // DOM 逐串逐格点亮起点（持续到 1990）
const T_LABEL = 2006; // 「86 根缆绳 × 60 = 5160 只」（S13 b4 2010 前 4）
const T_LAMP = 2070; // S14 b1「5160 只灯泡」→ 路灯阵列
const T_LAMP_LABEL = 2110; // 「一个小区的路灯数」
const T_PILLS_OUT = 2140; // 概念 Pill 变灰下沉，给 1 km³ 让位
const T_KM3 = 2178; // S14 b4「一整块一立方公里的冰」→ Counter
const T_GT = 2236; // S15 b1「这块冰重约十亿吨」→ GlitchIn（白名单）
const T_ROLES = 2284; // S15 b2「既是靶子」→ 「靶」Pill
const T_ROLES2 = 2306; // S15 b3「也是视网膜」→ 「视网膜」Pill
const T_DEEP = 2351; // S16 b1「深处的冰干净到」→ 深处高亮带
const T_PATH = 2396; // S16 b2「光跑两百米」→ 光路 inset + 推近
const EXIT_AT = TO;

// ---- 左：剖面（主角，整体 ~370px 高）----
const SEC = {x: 200, y: 300, w: 350, h: 262}; // 仪器化冰体 1450–2450 m
const SURF_X0 = 200, SURF_X1 = 550, SURF_Y = 210; // 冰面线
const DEPTH_LABELS: Array<[string, number]> = [['1450 m', SEC.y], ['2450 m', SEC.y + SEC.h]];
const HATCH_X = [216, 240, 312, 336, 408, 432, 496, 520]; // 冰面雪纹（避开 IceTop 站点）
const ICETOP_X = [286, 375, 464]; // 冰面 IceTop 小站
const STRINGS_X = [246, 287, 328, 369, 410, 451, 492]; // 7 根缆绳示意（真实 86 根）
const STRING_Y0 = 314, STRING_Y1 = 546; // 缆绳竖线（深度带内，不贴合 300/562 尺线）
const DOM_YS = [330, 383, 436, 489, 542]; // 每串 5 个 DOM（真实 60 只，17 m 间距示意）
const DOM_R = 11;
const DEEP_BAND = {y: 468, h: 92}; // 深处冰高亮带

// ---- 右上：1 km³ / 十亿吨 / 靶·视网膜 ----
const KM3 = {x: 620, y: 186, w: 280};
const GT_PILL = {x: 680, y: 296, w: 160, h: 40};
const ROLES = [
  {text: '靶', x: 655, w: 90},
  {text: '视网膜', x: 790, w: 130},
];
const ROLE_Y = 352, ROLE_H = 38;

// ---- 右下：路灯阵列（一个小区的路灯数）----
const LAMP = {x: 620, y: 412, cols: 10, rows: 8, cell: 10, gap: 12, lit: 57};
const LAMP_RAMP = 44; // 逐格点亮时长：2070 起到 2114 填满 57 盏（分镜节拍）
/** 复刻 ClusterGrid(seed=7, scatter) 的点亮顺序：LAMP_ORDER[k] = 第 k 盏被点亮的格序号（用于白闪定位） */
const LAMP_ORDER: number[] = (() => {
  const n = LAMP.cols * LAMP.rows;
  const ord = Array.from({length: n}, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd(7, i) * (i + 1));
    const t = ord[i]; ord[i] = ord[j]; ord[j] = t;
  }
  return ord;
})();
const LAMP_LABEL_CY = 598;

// ---- 末拍：剖面局部 200 m 光路 inset ----
const PATH_BOX = {x: 940, y: 385, w: 260, h: 140};
const TRACK_X0 = 960, TRACK_X1 = 1180, TRACK_Y = 430;
const DOT_CYCLE = 48; // 跑 34f + 熄 8f + 间歇

const CAM_KEYS = [
  {f: F0, x: 640, y: 360, s: 1},
  {f: T_PATH, x: 640, y: 360, s: 1},
  {f: T_PATH + 33, x: 1080, y: 440, s: 1.25}, // 推近到光路条（2429 ≤ 离场 2475−30）
];

/** 第 i 根缆绳第 j 个 DOM 的亮起帧：逐串（i 主）逐格（j 次） */
const domT = (i: number, j: number) => T_DOM + 6 + i * 19 + j * 3;

export const SC05: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, EXIT_AT, EXIT_LEN);
  const glowK = fadeIn(N - T_WIPE, 12) * glowOffK(N, EXIT_AT, 6, EXIT_LEN); // 带光元素先灭光再淡出

  const wipeP = easeOutCubic(clamp01((N - T_WIPE) / 24)); // 剖面自上而下 wipe
  const depthOp = fadeIn(N - T_S13, 10);
  const kmV = kf(N, [[T_KM3, 0], [T_KM3 + 26, 1]], easeOutCubic);
  const kmText = kmV >= 0.995 ? '1' : kmV.toFixed(1);
  // 路灯阵列逐格点亮（2070–2114 到 57 格）
  const litCount = Math.round(clamp01((N - T_LAMP) / LAMP_RAMP) * LAMP.lit);
  // 光路 inset：一束光跑 200 米，末端被吸收，循环到离场
  const cyc = Math.max(0, N - T_PATH) % DOT_CYCLE;
  const dotX = TRACK_X0 + clamp01(cyc / 34) * (TRACK_X1 - TRACK_X0);
  const dotOp = cyc < 34 ? 0.95 : Math.max(0, 1 - (cyc - 34) / 8);

  // 概念 Pill 变灰下沉（12f）
  const po = N < T_PILLS_OUT ? 1 : fadeOut(N - T_PILLS_OUT, 12);
  const pdy = N < T_PILLS_OUT ? 0 : exitAccel(N - T_PILLS_OUT, 0.08);

  return (
    <CameraRig N={N} keys={CAM_KEYS} style={{opacity: exOp}}>
      {/* 主角光：剖面紫柔光（30 帧呼吸，离场前 6 帧先灭） */}
      <HeroGlow x={SEC.x} y={SEC.y} w={SEC.w} h={SEC.h} r={14} N={N} k={glowK} />
      {/* 末拍光路条的光（推近后的主角，离场前 3 帧灭光、6 帧归零淡出） */}
      <HeroGlow x={PATH_BOX.x} y={PATH_BOX.y} w={PATH_BOX.w} h={PATH_BOX.h} r={14} N={N} k={fadeIn(N - T_PATH, 10) * glowOffK(N, EXIT_AT, 3, EXIT_LEN)} color="#8fb9ff" />

      <Svg bloom={false}>
        <defs>
          <clipPath id="sc05-wipe">
            <rect x={SEC.x - 14} y={SURF_Y - 16} width={SEC.w + 28} height={(SEC.y + SEC.h + 8 - (SURF_Y - 16)) * wipeP} />
          </clipPath>
        </defs>

        {/* ---- 剖面框（wipe 内；左右壁实线、上下深度界虚线）---- */}
        <g clipPath="url(#sc05-wipe)">
          {/* 冰面线 + 雪纹 + IceTop 小站 */}
          <line x1={SURF_X0} y1={SURF_Y} x2={SURF_X1} y2={SURF_Y} stroke={WHITE} strokeWidth={2.5} />
          {HATCH_X.map((x, i) => (
            <line key={i} x1={x} y1={SURF_Y - 10} x2={x + 9} y2={SURF_Y} stroke={GREY_LINE} strokeWidth={1.5} opacity={0.8} />
          ))}
          {ICETOP_X.map((x, i) => (
            <rect key={i} x={x - 6} y={SURF_Y - 12} width={12} height={12} fill="#000" stroke={WHITE} strokeWidth={1.8} />
          ))}
          {/* 仪器化冰体：左右壁 */}
          <line x1={SEC.x} y1={SEC.y} x2={SEC.x} y2={SEC.y + SEC.h} stroke={WHITE} strokeWidth={2.5} />
          <line x1={SEC.x + SEC.w} y1={SEC.y} x2={SEC.x + SEC.w} y2={SEC.y + SEC.h} stroke={WHITE} strokeWidth={2.5} />
          {/* 深度界（1450 / 2450）：虚线尺，不与缆绳贴合 */}
          {[SEC.y, SEC.y + SEC.h].map((y, i) => (
            <line key={i} x1={SEC.x - 6} y1={y} x2={SEC.x + SEC.w + 6} y2={y} stroke={GREY} strokeWidth={1.5} strokeDasharray="7 6" opacity={0.85} />
          ))}
          {/* 深处干净冰高亮带（2351） */}
          <rect x={SEC.x + 6} y={DEEP_BAND.y} width={SEC.w - 12} height={DEEP_BAND.h} fill={PURPLE} opacity={0.09 * fadeIn(N - T_DEEP, 12)} />
        </g>

        {/* ---- 钻孔虚线（冰面 → 缆绳顶，静态）---- */}
        {N >= T_S13
          ? STRINGS_X.map((sx, i) => (
              <line key={i} x1={sx} y1={SURF_Y + 2} x2={sx} y2={STRING_Y0 - 1} stroke={GREY_LINE} strokeWidth={1.5} strokeDasharray="5 7" opacity={0.75 * depthOp} />
            ))
          : null}

        {/* ---- 7 根缆绳 × 5 个 DOM：2 帧错峰自下滑入 + 逐串逐格点亮 ---- */}
        {STRINGS_X.map((sx, i) => {
          const nS = N - (T_S13 + 2 * i);
          if (nS < 0) return null;
          const dy = slideUp(nS, 80, 22);
          return (
            <g key={i} transform={`translate(0 ${dy.toFixed(1)})`} opacity={fadeIn(nS, 8)}>
              <line x1={sx} y1={STRING_Y0} x2={sx} y2={STRING_Y1} stroke={GREY_MID} strokeWidth={2} />
              {DOM_YS.map((cy, j) => {
                const nD = N - domT(i, j);
                const lit = clamp01(Math.max(0, nD) / 6);
                const fp = easeOutCubic(clamp01(nD / 8));
                return (
                  <g key={j}>
                    {nD > 0 && nD < 9 ? <circle cx={sx} cy={cy} r={DOM_R + 22 * fp} fill={WHITE} opacity={0.5 * (1 - fp)} /> : null}
                    <DOMSphere cx={sx} cy={cy} r={DOM_R} lit={lit} stemH={0} accent={WHITE} sw={1.8} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </Svg>

      {/* 深度标签（1450 / 2450 m） + 冰面/IceTop 标签 */}
      {DEPTH_LABELS.map(([t, y], i) => (
        <SoftIn key={t} N={N} f0={T_S13 + i * 2}>
          <CText cx={122} cy={y} size={22} weight={600} family={FONT_ORB} color={GREY} letterSpacing={1} dy={0}>
            {t}
          </CText>
        </SoftIn>
      ))}
      <SoftIn N={N} f0={T_WIPE + 6} dy={6}>
        <CText cx={222} cy={SURF_Y - 32} size={22} weight={600} color={GREY} dy={-1}>
          冰面
        </CText>
      </SoftIn>
      <SoftIn N={N} f0={T_WIPE + 10} dy={6}>
        <CText cx={464} cy={SURF_Y - 32} size={22} weight={600} color={GREY} dy={-1}>
          IceTop
        </CText>
      </SoftIn>

      {/* 缆绳/DOM 计数标签（S13 b4「挂上 5160 只灯泡」） */}
      <SoftIn N={N} f0={T_LABEL} dy={8}>
        <CText cx={SEC.x + SEC.w / 2} cy={SEC.y + SEC.h + 26} size={24} weight={700} color={WHITE} letterSpacing={0.5} shadow={TEXT_GLOW}>
          86 根缆绳 × 60 = 5160 只
        </CText>
      </SoftIn>

      {/* ---- 右上：概念 Pill（S12），让位给 1 km³ ---- */}
      <div style={{position: 'absolute', inset: 0, opacity: po}}>
        {[
          {t: '全世界最大的靶子', f: T_PILL1, y: 180, w: 210},
          {t: '最亮的眼睛', f: T_PILL2, y: 245, w: 170},
        ].map((p) => (
          <SoftIn key={p.t} N={N} f0={p.f} dy={8}>
            <Pill x={760 - p.w / 2} y={p.y + pdy} w={p.w} h={40} fill="#000" stroke={WHITE} sw={2} text={p.t} fontSize={24} weight={700} />
          </SoftIn>
        ))}
      </div>

      {/* ---- 右上：1 km³ 大数字（Orbitron + 紫硬投影，计数 0.0→1）---- */}
      {N >= T_KM3 ? (
        <div style={{...abs(KM3.x, KM3.y, KM3.w, 110), display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, opacity: fadeIn(N - T_KM3, 8)}}>
          <span style={{fontFamily: FONT_ORB, fontWeight: 700, fontSize: 96, lineHeight: 1, color: WHITE, letterSpacing: 1, fontVariantNumeric: 'tabular-nums', textShadow: `6px 6px 0 ${PURPLE}, 0 0 28px rgba(102,45,248,.45)`}}>
            {kmText}
          </span>
          <span style={{fontFamily: FONT_HEAVY, fontWeight: 700, fontSize: 34, lineHeight: 1, color: WHITE, textShadow: TEXT_GLOW}}>km³</span>
        </div>
      ) : null}

      {/* 「≈ 十亿吨」Pill：本镜唯一 GlitchIn（闪烁白名单） */}
      <GlitchIn N={N} f0={T_GT}>
        <Pill x={GT_PILL.x} y={GT_PILL.y} w={GT_PILL.w} h={GT_PILL.h} fill={PURPLE} stroke={WHITE} sw={2} text="≈ 十亿吨" fontSize={24} weight={800} />
      </GlitchIn>

      {/* 「靶」「视网膜」双 Pill（这块冰既是靶子也是视网膜） */}
      {ROLES.map((r, i) => (
        <SoftIn key={r.text} N={N} f0={T_ROLES + (i === 1 ? 22 : 0)} dy={6}>
          <Pill x={r.x} y={ROLE_Y} w={r.w} h={ROLE_H} fill="#000" stroke={WHITE} sw={2} text={r.text} fontSize={24} weight={700} />
        </SoftIn>
      ))}

      {/* ---- 右下：路灯阵列 + 标签（一个小区的路灯数 > 5160）---- */}
      <SoftIn N={N} f0={T_LAMP} dy={8}>
        <ClusterGrid x={LAMP.x} y={LAMP.y} cols={LAMP.cols} rows={LAMP.rows} cell={LAMP.cell} gap={LAMP.gap} lit={litCount} accent={WHITE} seed={7} scatter opacity={1} />
        {/* 逐格点亮的「亮起」白闪：格 10px 太小，逐格点亮在采样上不足 0.35（2011–2110 判静止 3.3s）；
            按 §7「加大幅度不加元素」给每盏新亮的灯加 12 帧白闪（与本镜 DOM 亮起白闪同 idiom，r ≥ cell+24、α 渐隐） */}
        <Svg bloom={false}>
          {Array.from({length: LAMP.lit}, (_, k) => {
            const age = N - (T_LAMP + (LAMP_RAMP * (k + 0.5)) / LAMP.lit); // 第 k 盏的点亮帧（litCount 中点反解）
            if (age < 0 || age >= 12) return null;
            const fp = easeOutCubic(clamp01(age / 12));
            const i = LAMP_ORDER[k];
            const c = i % LAMP.cols;
            const r = Math.floor(i / LAMP.cols);
            const cx = LAMP.x + c * (LAMP.cell + LAMP.gap) + LAMP.cell / 2 + 0.5;
            const cy = LAMP.y + r * (LAMP.cell + LAMP.gap) + LAMP.cell / 2 + 0.5;
            return <circle key={k} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={(LAMP.cell * 0.55 + 24 * fp).toFixed(1)} fill={WHITE} opacity={(0.5 * (1 - fp)).toFixed(3)} />;
          })}
        </Svg>
      </SoftIn>
      <SoftIn N={N} f0={T_LAMP_LABEL} dy={6}>
        <CText cx={LAMP.x + (LAMP.cols * (LAMP.cell + LAMP.gap) - LAMP.gap) / 2} cy={LAMP_LABEL_CY} size={22} weight={600} color={GREY} dy={-1}>
          一个小区的路灯数
        </CText>
      </SoftIn>

      {/* ---- 末拍：剖面局部「200 m 光路」inset（2396）---- */}
      {N >= T_PATH ? (
        <div style={{position: 'absolute', inset: 0, opacity: fadeIn(N - T_PATH, 8)}}>
          <Box x={PATH_BOX.x} y={PATH_BOX.y} w={PATH_BOX.w} h={PATH_BOX.h} fill="#000" stroke={GREY} sw={1.8} r={10} dashed />
          <CText cx={(PATH_BOX.x + PATH_BOX.x + PATH_BOX.w) / 2} cy={PATH_BOX.y + 18} size={22} weight={600} color={GREY} dy={-1}>
            剖面局部
          </CText>
          <Svg bloom={false}>
            <line x1={TRACK_X0} y1={TRACK_Y - 6} x2={TRACK_X0} y2={TRACK_Y + 6} stroke={WHITE} strokeWidth={2.5} />
            <line x1={TRACK_X1} y1={TRACK_Y - 6} x2={TRACK_X1} y2={TRACK_Y + 6} stroke={WHITE} strokeWidth={2.5} />
            <line x1={TRACK_X0} y1={TRACK_Y} x2={TRACK_X1} y2={TRACK_Y} stroke={WHITE} strokeWidth={3} opacity={0.9} style={{filter: 'drop-shadow(0 0 5px rgba(255,255,255,.8))'}} />
            {dotOp > 0.02 ? <circle cx={dotX} cy={TRACK_Y} r={6.5} fill={WHITE} opacity={dotOp} style={{filter: 'drop-shadow(0 0 6px rgba(255,255,255,.9))'}} /> : null}
            {dotOp > 0.02 ? <line x1={Math.max(TRACK_X0, dotX - 26)} y1={TRACK_Y} x2={dotX} y2={TRACK_Y} stroke={WHITE} strokeWidth={3} opacity={0.35 * dotOp} /> : null}
          </Svg>
          <CText cx={(PATH_BOX.x + PATH_BOX.x + PATH_BOX.w) / 2} cy={TRACK_Y + 34} size={24} weight={700} color={WHITE} shadow={TEXT_GLOW}>
            光跑 200 米
          </CText>
          <CText cx={(PATH_BOX.x + PATH_BOX.x + PATH_BOX.w) / 2} cy={TRACK_Y + 66} size={22} weight={600} color={GREY} dy={-1}>
            才被吸收一次
          </CText>
        </div>
      ) : null}
    </CameraRig>
  );
};
