import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, kf, easeInOutPow, FONT_ORB, FONT_TECH, GlitchIn} from '../../common';
import {
  Svg, GalaxyIcon, NeutrinoDot, LineArrow, Cross, Box, CText, TechText,
  WHITE, GREY, PURPLE, CORAL,
  fadeIn, scaleIn, SoftIn, exitOp, glowOffK, glowPurple, abs,
} from '../../ui';
import {CameraRig, GlowBlob} from '../../fx';

/**
 * SC09 NGC 1068：光出不来，中微子出得来 · N 3879–4363（S25–S27，分镜 v3）
 * 主角 = 中央 GalaxyIcon 280px + 3 层灰云（同心椭圆并入同一视觉体，主体尺度 ≥170px），紫色 GlowBlob 常亮。
 * 3887 定点推近 1→1.15 绕星系（分镜 30 帧 → 实际 71 帧至 3958，否则推完到标签 4026 之间 3.6s 全静；
 *   推完保持 ~68f；运镜不进末拍：3958 ≤ 灭光起点 4345−30）。
 * 两路对照：光子箭头（白色虚线）向左上方画到中层云边缘被红 Cross 挡下（弹回 4px）；
 * 中微子（NeutrinoDot 白点+尾迹）沿 −16° 直线穿透三层云向右上跑出画面，五颗持续涌出到末拍。
 * 本镜唯一 GlitchIn = 「NGC 1068」标签（闪烁白名单）；「11.4 PeV」胶囊 SoftIn（白名单无此词，不闪）。
 * 持续：中微子流 4060/4130/4190/4250/4310 到末拍（4060 首颗 kf 30 帧穿云 + 云层破洞 8 帧；4190 尾迹加粗脉冲）。
 * 停留：「11.4 PeV」4250 入场、20 帧计数 4270 落位 → 离场 4357，≈87f（末块 S27 短，前挂到 b2「最高能」）。
 */
export const F0 = 3879;
export const TO = 4363; // = SC10 首句 S28.from − 9
const EXIT_LEN = 6; // 末 6 帧归零（N=TO 为 0）

// 节拍（分镜表 SC09；容差 −6…+3）
const T_GAL = 3884; // 星系 21 帧缩放入场（S25 c1 3887 前 3）
const T_PUSH0 = 3887; // 推近起点（S25 c1；分镜 30 帧 → 实际延长到 71 帧，避免推完后 3.6s 全静）
const T_PUSH1 = 3958; // 推近终点（71 帧；推完停 ~68f 到标签 glitch）
const T_NGC = 4026; // 「NGC 1068」标签 GlitchIn（白名单；S25 b1 词尾/b2 起）
const T_CLOUD = 4060; // 三层云 wipe 18 帧（S25 b3「被厚厚的气体裹住」；首颗中微子同时 kf 30 帧穿云）
const T_HOLE = 4090; // 云层破洞透光 8 帧（首颗穿出外层云的一刻）
const T_PHOTON = 4109; // 光子箭头 draw-on 18 帧（S25 b4「光根本出不来」）
const T_CROSS = 4127; // 红 Cross 12 帧落定（b4 内）
const T_PEV = 4250; // 「11.4 PeV」胶囊 SoftIn + 20 帧计数（S27 b2「最高能」，末块 S27 短前挂）
const T_PEV_SUB = 4258; // 小字打字机（每 2 帧 1 字）
const LAUNCHES = [4060, 4130, 4190, 4250, 4310]; // 中微子发射时刻；4190 = 尾迹强调那颗
const NU_EMPH = 2;

// 版面（世界坐标；相机终点 (560,380) s=1.15 → 星系落屏中央 (640,360)）
const G = {cx: 560, cy: 380, r: 140}; // 星系盘 280 宽
// 三层厚气体云（同心椭圆，内密外疏；填充分档低于分镜 .3/.25/.2 以保星系可见性）
const CLOUDS = [
  {rx: 170, ry: 72, a: 0.2, sw: 2},
  {rx: 200, ry: 86, a: 0.12, sw: 1.75},
  {rx: 230, ry: 100, a: 0.08, sw: 1.5},
];
// 中微子直线：星系核 (560,380) → 屏幕右缘世界坐标 (1116.5,220.4)，角度 −16°
const NU_DIR = Math.atan2(-159.7, 556.5);
const NU_END = {x: 1116.5, y: 220.4};
const NU_HOLE = {x: 750.4, y: 325.3, r: 9}; // 外层云边缘的穿出点
// 光子：星系核 → 左上方中层云边缘（被挡下处）
const PH_TIP = {x: 515.5, y: 296.2};
// 标签（世界坐标 → 屏幕落点：NGC 胶囊 (1000,138)；距离小字 (1000,182)）
const NGC = {cx: 873, cy: 188, w: 170, h: 46};
const DIST = {cx: 873, cy: 225}; // 「4600 万光年」
// 「11.4 PeV」胶囊 + 小字（世界坐标 → 屏幕落点 (1040,520) / (1040,585)）
const PEV = {cx: 908, cy: 519, w: 210, h: 56};
const PEV_SUB = {cx: 908, cy: 577};
// 事实（调研.md ★★★ PRL 136 (2026) 121002）：11.4 PeV = 11400 万亿 eV（S23 已建立 1 PeV = 一千万亿 eV）
const PEV_SUB_TEXT = '= 11400 万亿 eV · 人类最高能';

/** 单颗中微子的飞行进度（f=0 星系核 → 1 屏幕右缘）；首颗 30 帧穿云、再 40 帧出画 */
const nuFrac = (i: number, N: number) => {
  const t = N - LAUNCHES[i];
  if (t < 0) return -1;
  if (i === 0) return kf(t, [[0, 0], [30, 0.342], [70, 1]], easeInOutPow(2));
  return clamp01(t / 62);
};

export const SC09: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, TO, EXIT_LEN);

  // 星系缩放入场（首帧留底色）
  const gs = scaleIn(N - T_GAL, 21);
  const galOp = N < T_GAL ? 0 : clamp01(0.15 + 1.4 * gs);
  const galT = gs < 1 ? `translate(${G.cx} ${G.cy}) scale(${gs.toFixed(4)}) translate(${-G.cx} ${-G.cy})` : undefined;
  const cloudW = clamp01((N - T_CLOUD) / 18);
  // 光子箭头 draw-on 18 帧后弹回 4px（kf 幂缓入）
  const photoP = kf(N, [[T_PHOTON, 0], [T_PHOTON + 18, 1], [T_PHOTON + 24, 0.955]]);
  const crossP = clamp01((N - T_CROSS) / 12);
  const holeK = N >= T_HOLE ? 1 - clamp01((N - T_HOLE) / 8) : 0;
  // 主角紫光：入场上亮 → 4026「盯上」强调抬升 → 离场前 18 帧缓灭（r250 大光斑，6 帧灭光的步进 >1.5 会打断 hold 判定）
  const glowK = fadeIn(N - T_GAL, 12) * glowOffK(N, TO, 18, EXIT_LEN);
  const glowA = kf(N, [[T_GAL, 0.3], [T_NGC, 0.3], [T_NGC + 13, 0.44], [T_NGC + 36, 0.3], [T_CLOUD, 0.32], [TO, 0.32]]);

  // 「11.4 PeV」计数 + 小字打字机
  const pevN = N - T_PEV;
  const pevK = fadeIn(pevN, 8) * glowOffK(N, TO, 6, EXIT_LEN);
  const pevVal = (11.4 * (1 - Math.pow(1 - clamp01(pevN / 20), 2))).toFixed(1);
  const subChars = Math.max(0, Math.floor((N - T_PEV_SUB) / 2));

  return (
    <CameraRig
      N={N}
      keys={[
        {f: F0, x: 640, y: 360, s: 1},
        {f: T_PUSH0, x: 640, y: 360, s: 1},
        {f: T_PUSH1, x: G.cx, y: G.cy, s: 1.15},
      ]}
      style={{opacity: exOp}}
    >
      {/* 主角紫柔光（呼吸 30 帧；4026 强调抬升；离场前先灭） */}
      <GlowBlob cx={G.cx} cy={G.cy} r={250} N={N} k={glowK} alpha={glowA} />

      <Svg bloom={false}>
        <defs>
          <clipPath id="g5sc09-clouds">
            <rect x={330} y={268} width={(500 * cloudW).toFixed(1)} height={224} />
          </clipPath>
        </defs>
        {/* 三层厚气体云（自左 wipe 18 帧；虚线灰边） */}
        <g clipPath="url(#g5sc09-clouds)">
          {CLOUDS.map((c, i) => (
            <ellipse
              key={i}
              cx={G.cx}
              cy={G.cy}
              rx={c.rx}
              ry={c.ry}
              fill={`rgba(150,150,150,${c.a})`}
              stroke={GREY}
              strokeWidth={c.sw}
              strokeDasharray="6 7"
            />
          ))}
        </g>
        {/* 星系（缩放入场；白描边 + 亮核 coreGlow） */}
        <g transform={galT} opacity={galOp}>
          <GalaxyIcon cx={G.cx} cy={G.cy} r={G.r} sw={2.5} />
        </g>
        {/* 云层破洞：首颗中微子穿出外层云的一刻，透光 8 帧 */}
        {holeK > 0 ? (
          <circle cx={NU_HOLE.x} cy={NU_HOLE.y} r={NU_HOLE.r} fill={WHITE} opacity={holeK.toFixed(3)} style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,.9))'}} />
        ) : null}
        {/* 光子箭头：核 → 左上中层云边缘（虚线 draw-on + 弹回） */}
        <LineArrow x0={G.cx} y0={G.cy} x1={PH_TIP.x} y1={PH_TIP.y} p={photoP} rodW={2.5} headL={18} headW={18} dashed color={WHITE} opacity={fadeIn(N - T_PHOTON, 6)} />
        {/* 红 Cross：光子被挡下（12 帧落定） */}
        <Cross cx={PH_TIP.x} cy={PH_TIP.y} size={36} color={CORAL} sw={6} p={crossP} opacity={fadeIn(N - T_CROSS, 6)} />
        {/* 中微子流（压在星系/云之上：从核穿透云层向右上涌出到末拍） */}
        {LAUNCHES.map((L, i) => {
          const f = nuFrac(i, N);
          if (f < 0 || f >= 1) return null;
          const x = G.cx + (NU_END.x - G.cx) * f;
          const y = G.cy + (NU_END.y - G.cy) * f;
          const t = N - L;
          const emph = i === NU_EMPH ? kf(t, [[0, 0], [8, 1], [16, 1], [26, 0]]) : 0; // 4190 尾迹加粗脉冲一次
          return <NeutrinoDot key={L} x={x} y={y} dir={NU_DIR} tail={46 + 24 * emph} dotR={7 + 2.5 * emph} />;
        })}
      </Svg>

      {/* 「NGC 1068」标签（本镜唯一 GlitchIn；黑底白边胶囊 + Exo 2 紫斜体） */}
      <GlitchIn N={N} f0={T_NGC} seed={17}>
        <Box x={NGC.cx - NGC.w / 2} y={NGC.cy - NGC.h / 2} w={NGC.w} h={NGC.h} r={23} fill="#000" stroke={WHITE} sw={2} glow={glowPurple(0.35)} />
        <TechText cx={NGC.cx} cy={NGC.cy} text="NGC 1068" fontSize={27} weight={700} />
      </GlitchIn>
      <SoftIn N={N} f0={T_NGC + 8}>
        <CText cx={DIST.cx} cy={DIST.cy} size={24} weight={600} color={GREY} dy={-1} letterSpacing={1}>
          4600 万光年
        </CText>
      </SoftIn>

      {/* 「11.4 PeV」胶囊（紫边 + 当前重点紫光）+ Orbitron 计数 + 小字打字机 */}
      <SoftIn N={N} f0={T_PEV}>
        <Box x={PEV.cx - PEV.w / 2} y={PEV.cy - PEV.h / 2} w={PEV.w} h={PEV.h} r={12} fill="#000" stroke={PURPLE} sw={2.5} glow={glowPurple(pevK)} />
        <div style={{...abs(PEV.cx - PEV.w / 2, PEV.cy - PEV.h / 2, PEV.w, PEV.h), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10}}>
          <span style={{fontFamily: FONT_ORB, fontWeight: 700, fontSize: 34, color: WHITE, lineHeight: 1}}>{pevVal}</span>
          <span style={{fontFamily: FONT_TECH, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: WHITE, transform: 'scaleX(.85)', lineHeight: 1}}>PeV</span>
        </div>
      </SoftIn>
      <SoftIn N={N} f0={T_PEV_SUB}>
        <CText cx={PEV_SUB.cx} cy={PEV_SUB.cy} size={22} weight={600} color={GREY} dy={-1} letterSpacing={0.5}>
          {PEV_SUB_TEXT.slice(0, subChars)}
        </CText>
      </SoftIn>
    </CameraRig>
  );
};
