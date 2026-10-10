import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, easeOutCubic, easeInOutPow, kf, emphasisPulse, FONT_ORB, FONT_TECH, GlitchIn} from '../../common';
import {
  Svg, Pill, CText, TechText, DOMSphere, NeutrinoDot, MuonArrow, AtomNucleus, CherenkovCone,
  WHITE, GREY, GREY_MID, PURPLE, PURPLE_TECH, TEXT_GLOW,
  fadeIn, scaleIn, SoftIn, exitOp, glowOffK,
} from '../../ui';
import {CameraRig, GlowBlob} from '../../fx';

/**
 * SC06 切伦科夫光鞭 · N 2481–3145（S17–S20，分镜 v3）
 * 主角 = 蓝色 CherenkovCone 光锥（顶点随 μ 子、锥口向左下张开，长 420px，~204px 高，蓝紫柔光 + 白描边）。
 * 机制横向图：中微子 (150,380) 飞入 → 2489 撞 AtomNucleus (300,380)（白闪 4f）→ 2586 MuonArrow 沿轨道
 * kf 射出（24f 到 (700,292)，持续前冲到 (1160,190)）→ 2637 光锥绽放 20f（顶点钉在 μ 子尖端）
 * → 2774–2990 右侧 6×8 DOM 眼睛阵列按光锥扫过顺序（沿轨道投影，自左下向右上）逐格亮蓝
 * （复用 SC05 同图元同参数：DOMSphere r11/sw1.8/stemH0，仅颜色取切伦科夫蓝）
 * → 2730「冰中光速 0.764c」胶囊 GlitchIn（本镜唯一闪烁·白名单）/ 2863「光学的音爆」Pill
 * → 2901「5160 只眼睛」标签 / 3025 0.3° 紫锥角扇形 / 3079 满月 0.5° 灰虚线 + 灰月对照。
 * 持续：μ 子前冲（到 2800）+ 眼睛逐次点亮（到 2990）+ 光路波前扫过；停留：满月对照 3087 落位 → 离场 3140 = 53f。
 * 运镜：2637 推近 1→1.2 向光锥（33f，推完停 60f 到 2730；2670 ≤ 离场 3140−30）。
 * 事实依据 research §3 环节 4：冰 n≈1.31 → 冰中光速 ≈0.764c；吸收长度 ~200m、散射 ~50m；
 *      §4.3 常见误解 1：超的是冰中光速；§3 环节 5：5160 只 DOM；§7.1-10：径迹角分辨率 0.3°，满月约 0.5°。
 */
export const F0 = 2481;
const TO = 3145; // = SC07 首句 S21.from−9
const EXIT_LEN = 6; // 末 6 帧归零（N=3145 为 0）

// ---- 节拍（分镜表 v3；容差 −6…+3）----
const T_FLY = F0; // 中微子自画左飞入（镜头首 8 帧导引）
const T_HIT = 2489; // S17 b1「终于」→ 撞击白闪
const T_NUC = 2491; // 原子核缩放入场
const T_NUC_PULSE = 2531; // S17 b2「原子核」→ 落位脉冲
const T_MUON = 2586; // S17 b3「μ 子」→ 箭头射出
const T_CONE = 2637; // S18 b1「跑得快」→ 光锥绽放 + 推近
const T_CAP = 2730; // S18「注意，是冰里的光速」→ 0.764c 胶囊（分镜画面列）
const T_EYE = 2774; // 眼睛阵列逐格点亮起点（持续到 2990）
const T_SONIC = 2863; // S19 b2「像光学的音爆」
const T_EYES = 2901; // S19 b3「被 5160 只眼睛同时看见」
const T_ANG = 3025; // S20 b1「反推出信从哪来」→ 0.3° 锥角扇形 + 反推箭头
const T_MOON = 3079; // S20「满月」→ 满月对照
const T_REPLAY = 2995; // 眼睛阵列「到达时序复现」起点（S20 主动作，到 3115）
const EXIT_AT = TO;

// ---- 机制几何 ----
const HIT = {x: 300, y: 380}; // 撞击点 / 轨道起点
const MUON_END = {x: 1160, y: 190}; // μ 子终点（持续前冲的落点）
const MU_D = {dx: MUON_END.x - HIT.x, dy: MUON_END.y - HIT.y}; // 轨道向量
const MU_LEN = Math.hypot(MU_D.dx, MU_D.dy);
const MU_U = {x: MU_D.dx / MU_LEN, y: MU_D.dy / MU_LEN}; // 单位向量
const MU_DIR = Math.atan2(MU_D.dy, MU_D.dx); // 轨道方向（约 −12.5°）
const CONE_DIR = Math.atan2(-MU_D.dy, -MU_D.dx); // 锥口反向（约 167.5°，向左下张开）
const CONE_LEN = 420, CONE_HALF = 0.28;
const SHOOT_U = 400 / MU_LEN; // 24 帧射出到 (700,~292)

/** μ 子尖端进度：24f 快射出 → 190f 持续前冲（小面积持续动作） */
const tipU = (N: number) =>
  N < T_MUON + 24
    ? kf(N, [[T_MUON, 0], [T_MUON + 24, SHOOT_U]], easeOutCubic)
    : kf(N, [[T_MUON + 24, SHOOT_U], [T_MUON + 214, 1]], easeInOutPow(2.2));
const tipAt = (N: number) => ({x: HIT.x + MU_U.x * MU_LEN * tipU(N), y: HIT.y + MU_U.y * MU_LEN * tipU(N)});

// ---- 右侧 DOM 眼睛阵列 6×8（x 945–1165 / y 272–538；与 SC05 同图元同参数）----
const EYE_XS = [945, 989, 1033, 1077, 1121, 1165];
const EYE_YS = [272, 310, 348, 386, 424, 462, 500, 538];
const EYE_R = 11;
const EYE_ACCENT = '#58C8FF'; // 切伦科夫蓝（内容色，非 glow；柔光仍只用紫）
const PERP = {x: -MU_U.y, y: MU_U.x}; // 波前方向（垂直轨道、指向阵列）
/** 光锥扫过顺序 = 沿轨道投影（自左下向右上），点亮窗口 2774–2990 */
const proj = (x: number, y: number) => (x - HIT.x) * MU_U.x - (y - HIT.y) * MU_U.y;
type Eye = {x: number; y: number; p: number; t: number};
const EYES: Eye[] = [];
{
  const ps = EYE_XS.flatMap((x) => EYE_YS.map((y) => ({x, y, p: proj(x, y)})));
  const pMin = Math.min(...ps.map((q) => q.p));
  const span = (Math.max(...ps.map((q) => q.p)) - pMin) || 1;
  ps
    .sort((a, b) => a.p - b.p)
    .forEach((q, i) => EYES.push({x: q.x, y: q.y, p: q.p, t: T_EYE + (i * 216) / 47}));
}
/** 波前：沿轨道投影推进的光前（212–2990），与眼睛点亮同序 */
const frontProj = (N: number) => kf(N, [[T_CONE + 20, 560], [T_EYE + 216, 890]]);

// ---- 顶部文字 ----
const CAP = {x: 350, y: 127, w: 240, h: 42}; // 「冰中光速 0.764c」白边胶囊
const SONIC = {x: 670, y: 108, w: 180, h: 40}; // 「光学的音爆」

// ---- 末拍：角分辨率对照（底部中央，避开光锥/阵列/字幕带）----
const ANG_V = {x: 520, y: 552}; // 扇形顶点
const ANG_LEN = 85;
const PURPLE_HALF = 0.14; // 视觉夸大：0.3° → 8° 半角
const MOON_HALF = 0.23; // 视觉夸大：0.5° → 13° 半角
const MOON = {cx: 680, cy: 542, r: 12};

const CAM_KEYS = [
  {f: F0, x: 640, y: 360, s: 1},
  {f: T_CONE, x: 640, y: 360, s: 1},
  {f: T_CONE + 33, x: 700, y: 330, s: 1.2}, // 推近向光锥（2670 ≤ 离场 3140−30）
];

/** 撞击白闪：4 帧实心白盘 + 扩散环，56 帧后一次余波环（S17 段的唯一持续动作） */
const Flash: React.FC<{N: number}> = ({N}) => {
  const n = N - T_HIT;
  if (n < 0 || n > 72) return null;
  if (n > 18) {
    // 余波光晕（弱）：实心柔光圆盘，S17「原子核」段唯一可察觉变化
    const m = n - 56;
    if (m < 0) return null;
    const p = easeOutCubic(clamp01(m / 16));
    return <circle cx={HIT.x} cy={HIT.y} r={30 + 45 * p} fill={WHITE} opacity={0.32 * (1 - p)} />;
  }
  const p = easeOutCubic(clamp01(n / 8));
  return (
    <g>
      {n < 5 ? <circle cx={HIT.x} cy={HIT.y} r={30} fill={WHITE} opacity={0.75 * (1 - n / 5)} /> : null}
      <circle cx={HIT.x} cy={HIT.y} r={26 + 44 * p} fill="none" stroke={WHITE} strokeWidth={4} opacity={1 - p} />
    </g>
  );
};

export const SC06: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, EXIT_AT, EXIT_LEN);
  const coneGlowK = fadeIn(N - T_CONE, 10) * glowOffK(N, EXIT_AT, 6, EXIT_LEN);
  // 撞击余辉：白闪后留一团紫柔光在撞击点（S17 段主体），μ 子射出后随光锥接管而熄。
  // v1 终检：原为单调淡入淡出，2494–2587 整段帧间灰度均值 <0.35（motion_check 静止判据）成 3.1s 真静止 →
  // 让余辉真正"呼吸"（±20%、45 帧周期），注释里写的呼吸此前并未实现
  const impactK = fadeIn(N - T_HIT, 10) * (0.8 + 0.2 * Math.sin((N / 45) * Math.PI)) * (1 - clamp01((N - 2600) / 60));
  const tip = tipAt(N);
  // 光锥 Mouth 中心（顶点反向 CONE_LEN）——用于主角柔光斑定位
  const mouth = {x: tip.x + CONE_LEN * Math.cos(CONE_DIR), y: tip.y + CONE_LEN * Math.sin(CONE_DIR)};
  const coneP = easeOutCubic(clamp01((N - T_CONE) / 20)); // 光锥绽放 20f
  const front = frontProj(N);
  const fc = {x: HIT.x + MU_U.x * front, y: HIT.y + MU_U.y * front}; // 波前与轨道交点
  const angP = easeOutCubic(clamp01((N - T_ANG) / 16)); // 角度扇形 draw-on
  const nucScale = N < T_NUC ? 0 : scaleIn(N - T_NUC, 21);
  // v1 终检：peak 1.12/30 帧的脉冲只动细描边、缩图后均值差 <0.35，压不住 2494–2587 的真静止；加到 1.3/46 帧把该窗劈成 ≤37f（1.23s）+ ≤10f 两段
  const nucPulse = emphasisPulse(N - T_NUC_PULSE, {peak: 1.3, up: 16, hold: 8, down: 22});

  return (
    <CameraRig N={N} keys={CAM_KEYS} style={{opacity: exOp}}>
      {/* 主角光：光锥紫柔光斑（30 帧呼吸，离场前 6 帧先灭） */}
      <GlowBlob cx={(tip.x + mouth.x) / 2} cy={(tip.y + mouth.y) / 2} r={150} N={N} k={coneGlowK} alpha={0.3} />
      {/* 撞击余辉（光锥登场前 S17 段的主体光） */}
      <GlowBlob cx={HIT.x} cy={HIT.y} r={110} N={N} k={impactK} alpha={0.45} />

      <Svg bloom={false}>
        {/* 中微子飞入 → 撞击点（被吸收） */}
        {N < T_HIT ? (
          <NeutrinoDot x={150 + clamp01((N - T_FLY) / 8) * (HIT.x - 150)} y={HIT.y} dir={0} tail={46} dotR={7} />
        ) : null}
        <Flash N={N} />

        {/* 原子核（缩放入场 + 落位脉冲） */}
        {nucScale > 0 ? (
          <g transform={`translate(${HIT.x} ${HIT.y}) scale(${(nucScale * nucPulse).toFixed(4)}) translate(${-HIT.x} ${-HIT.y})`} opacity={clamp01(0.2 + 1.2 * nucScale)}>
            <AtomNucleus cx={HIT.x} cy={HIT.y} r={34} sw={2} />
          </g>
        ) : null}

        {/* μ 子箭头（自根部长出 + 白光，持续前冲） */}
        {N >= T_MUON ? (
          <g style={{filter: 'drop-shadow(0 0 6px rgba(255,255,255,.8))'}}>
            <MuonArrow x0={HIT.x} y0={HIT.y} x1={tip.x} y1={tip.y} p={1} rodW={3.5} headW={24} color={WHITE} />
          </g>
        ) : null}

        {/* 切伦科夫光锥（顶点随 μ 子、锥口向左下，蓝紫渐变 + 白描边） */}
        {N >= T_CONE ? <CherenkovCone apexX={tip.x} apexY={tip.y} dir={CONE_DIR} len={CONE_LEN} halfAngle={CONE_HALF} p={coneP} sw={2.5} /> : null}

        {/* 波前（光锥扫过的光前，与眼睛点亮同序；沿垂直轨道方向扫过阵列） */}
        {N >= T_CONE + 20 ? (
          <g>
            <line x1={fc.x + 20 * PERP.x} y1={fc.y + 20 * PERP.y} x2={fc.x + 175 * PERP.x} y2={fc.y + 175 * PERP.y} stroke={EYE_ACCENT} strokeWidth={16} opacity={0.2} strokeLinecap="round" />
            <line x1={fc.x + 20 * PERP.x} y1={fc.y + 20 * PERP.y} x2={fc.x + 175 * PERP.x} y2={fc.y + 175 * PERP.y} stroke="#cfeeff" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
          </g>
        ) : null}

        {/* 5160 只眼睛：6×8 阵列，按投影顺序逐格亮蓝 + 亮起蓝闪 */}
        {EYES.map((e, i) => {
          const nD = N - e.t;
          const lit = clamp01(Math.max(0, nD) / 6);
          const fp = easeOutCubic(clamp01(nD / 8));
          // S20「靠光到达的先后反推」：全亮后按同一顺序复现到达时序（2.4× 速），实心蓝闪，到 3115
          const nR = N - (T_REPLAY + i * 2.5);
          const rp = easeOutCubic(clamp01(nR / 7));
          return (
            <g key={i}>
              {nD > 0 && nD < 9 ? <circle cx={e.x} cy={e.y} r={EYE_R + 22 * fp} fill={EYE_ACCENT} opacity={0.5 * (1 - fp)} /> : null}
              {nR > 0 && nR < 8 ? <circle cx={e.x} cy={e.y} r={EYE_R + 19 * rp} fill={EYE_ACCENT} opacity={0.45 * (1 - rp)} /> : null}
              <DOMSphere cx={e.x} cy={e.y} r={EYE_R} lit={Math.max(lit, 0.55 * clamp01(nR / 4))} stemH={0} accent={EYE_ACCENT} sw={1.8} />
            </g>
          );
        })}

        {/* S20「反推出信从哪来」：自阵列向左回指的虚线箭头 + 循环光点（指向中微子来的方向） */}
        {N >= T_ANG ? (
          <g>
            <line
              x1={920}
              y1={470}
              x2={560 + 360 * (1 - easeOutCubic(clamp01((N - T_ANG) / 20)))}
              y2={470}
              stroke={WHITE}
              strokeWidth={2.5}
              strokeDasharray="8 8"
              opacity={0.85}
            />
            {(N - T_ANG) % 40 < 30 ? (
              <circle cx={920 - 360 * clamp01(((N - T_ANG) % 40) / 30)} cy={470} r={5.5} fill={WHITE} opacity={0.9} style={{filter: 'drop-shadow(0 0 5px rgba(255,255,255,.9))'}} />
            ) : null}
          </g>
        ) : null}
      </Svg>

      {/* 「μ 子」标签（固定在轨道终点上方，避开光锥覆盖区） */}
      <SoftIn N={N} f0={T_MUON} dy={6}>
        <CText cx={1000} cy={152} size={24} weight={700} color={WHITE} dy={-1} shadow={TEXT_GLOW}>
          μ 子
        </CText>
      </SoftIn>

      {/* 「冰中光速 0.764c」白边胶囊：本镜唯一 GlitchIn（闪烁白名单；0.764c 为 Exo 2 紫斜体） */}
      <GlitchIn N={N} f0={T_CAP}>
        <Pill
          x={CAP.x}
          y={CAP.y}
          w={CAP.w}
          h={CAP.h}
          fill="#000"
          stroke={WHITE}
          sw={2}
          fontSize={24}
          weight={700}
          textDy={-2}
          text={
            <>
              {'冰中光速 '}
              <span style={{fontFamily: FONT_TECH, fontStyle: 'italic', fontWeight: 700, color: PURPLE_TECH, letterSpacing: 1}}>0.764c</span>
            </>
          }
        />
      </GlitchIn>

      {/* 「光学的音爆」Pill（S19 b2） */}
      <SoftIn N={N} f0={T_SONIC} dy={8}>
        <Pill x={SONIC.x} y={SONIC.y} w={SONIC.w} h={SONIC.h} fill="#000" stroke={WHITE} sw={2} text="光学的音爆" fontSize={24} weight={700} />
      </SoftIn>

      {/* 「5160 只眼睛」标签（阵列左下，两行） */}
      <SoftIn N={N} f0={T_EYES} dy={6}>
        <CText cx={882} cy={378} size={30} weight={700} family={FONT_ORB} color={WHITE} letterSpacing={1} shadow={TEXT_GLOW}>
          5160
        </CText>
        <CText cx={882} cy={410} size={22} weight={600} color={GREY} dy={-1}>
          只眼睛
        </CText>
      </SoftIn>

      {/* ---- 末拍：角分辨率对照（0.3° 紫锥角 vs 满月 0.5° 灰虚线，视觉夸大）---- */}
      {N >= T_ANG ? (
        <div style={{position: 'absolute', inset: 0, opacity: fadeIn(N - T_ANG, 8)}}>
          <Svg bloom={false}>
            <g transform={`translate(${ANG_V.x} ${ANG_V.y}) scale(${angP.toFixed(4)}) translate(${-ANG_V.x} ${-ANG_V.y})`}>
              {/* 紫锥角 0.3°（实心 + 紫描边） */}
              <polygon
                points={`${ANG_V.x},${ANG_V.y} ${ANG_V.x - ANG_LEN * Math.tan(PURPLE_HALF)},${ANG_V.y - ANG_LEN} ${ANG_V.x + ANG_LEN * Math.tan(PURPLE_HALF)},${ANG_V.y - ANG_LEN}`}
                fill={PURPLE}
                fillOpacity={0.35}
                stroke={PURPLE}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* 满月 0.5°（灰虚线扇形） */}
              <polygon
                points={`${ANG_V.x},${ANG_V.y} ${ANG_V.x - ANG_LEN * Math.tan(MOON_HALF)},${ANG_V.y - ANG_LEN} ${ANG_V.x + ANG_LEN * Math.tan(MOON_HALF)},${ANG_V.y - ANG_LEN}`}
                fill="none"
                stroke={GREY}
                strokeWidth={2}
                strokeDasharray="6 6"
                strokeLinejoin="round"
              />
            </g>
            {/* 满月小圆（对照物） */}
            {N >= T_MOON ? (
              <g opacity={fadeIn(N - T_MOON, 8)}>
                <circle cx={MOON.cx} cy={MOON.cy} r={MOON.r} fill="#0c0d12" stroke={GREY} strokeWidth={2} />
                <circle cx={MOON.cx - 4} cy={MOON.cy - 3} r={2.5} fill={GREY_MID} />
                <circle cx={MOON.cx + 4} cy={MOON.cy + 4} r={2} fill={GREY_MID} />
              </g>
            ) : null}
          </Svg>
          <TechText cx={600} cy={508} text="0.3°" fontSize={24} color={PURPLE_TECH} weight={700} glow={false} />
          <CText cx={MOON.cx} cy={MOON.cy + 34} size={22} weight={600} color={GREY} opacity={fadeIn(N - T_MOON, 8)} dy={-1}>
            满月 0.5°
          </CText>
        </div>
      ) : null}
    </CameraRig>
  );
};
