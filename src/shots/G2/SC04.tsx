import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, easeInOutPow, emphasisPulse, FONT_ORB, GlitchIn} from '../../common';
import {
  Svg, CText, Pill, NeutrinoDot, EarthIcon,
  WHITE, GREY, GREY_LIGHT, PURPLE, PURPLE_DEEP, PURPLE_LIGHT,
  fadeIn, scaleIn, firstOp, exitOp, exitAccel, glowOffK, SoftIn,
} from '../../ui';
import {GlowBlob} from '../../fx';
import {GlassShard} from './parts';

/**
 * SC04 地球如保鲜膜 · N 1351–1692（S09–S11）
 * 主角 = 中央地球（r130 = 260px，紫柔光）+ 外裹半透明「保鲜膜」椭圆环带。
 * NeutrinoDot 从左外 (150,370) 穿地球到右外 (1120,370)，来回穿 2 次（每次 30 帧带尾迹），
 * 第二穿入膜时膜上波纹环 draw-on；之后第二颗点在膜内绕行到末拍（「拦不住」的动词，不为静止加漂浮）。
 * 右侧对照组：玻璃片（光学透明·灰）≠ 中微子点（弱相互作用·白）——「≠」本镜唯一 glitch（白名单）。
 * 再下「质量」Pill + 「? eV」Orbitron 88px：1568 承接位移 16 帧把地球队缩到 0.7 移到左侧让位
 * （运镜不进末拍：1568+16 ≤ 离场 1686−30）。「? eV」1568 前挂（末块 S11 仅 35 帧短）。
 * 事实依据：research §2（地球对中微子近乎透明）、§4（质量绝对值未测得）。
 */
const F0 = 1351;
const TO = 1692; // = SC05 首句 S12.from−9（吃满段末停顿）
const EXIT_LEN = 6; // 末 6 帧归零（1686–1692，N=1692 为 0）

// 节拍（分镜表 SC04；容差 −6…+3）
const T_EARTH = 1353; // 地球 21 帧缩放入场（1359「地球」前 6）
const T_MEMB = 1400; // 保鲜膜 wipe 14 帧（1400「保鲜膜」）
const T_C1 = 1436; // 第一穿 L→R 30 帧（1442「拦不住」前 6）
const T_C2 = 1472; // 第二穿 R→L 30 帧（来回 2 次）
const T_RIP = 1444; // 膜波纹环（第一穿入膜时：x150→395 约 8 帧；波纹连续环形到末拍）
const T_CMP = 1485; // 对照组 SoftIn 2 帧错峰（1485「两码事」）
const T_NE = 1487; // 「≠」GlitchIn（白名单）
const T_HO = 1568; // 承接位移 16 帧（S11 b1「质量」；地球队缩 0.7 移左）
const T_EV = 1568; // 「? eV」21 帧缩放入场 + 柔光（末块 1688–1692 短 → 前挂一拍）
const T_EVP = 1592; // 「? eV」落位脉冲
const T_C3 = 1618; // 第三穿 L→R（「拦不住」的动词延续到末拍；收尾 1648 → 稳定期 38f ≥30）
const T_ORB = T_C2 + 30; // 第二颗点入膜绕行（1502，到末拍）

// 版面（分镜表坐标参考值；内容主区 x60–1220 / y110–620）
const EARTH = {cx: 560, cy: 370, r: 130};
const MEMB = {rx: 165, ry: 152}; // 保鲜膜：紫边半透明椭圆，裹在地球外
const RIPPLE = {rx0: 132, rx1: 170, ry0: 122, ry1: 158, life: 26, every: 30}; // 膜上波纹（第二穿起连续环形：前一圈未灭下一圈已生）
const ORBIT = {rx: 146, ry: 136, lap: 66}; // 膜内绕行椭圆（贴近膜内侧）
const LINE_Y = 370; // 穿越直线
const CROSS = {x0: 150, x1: 1120, len: 30}; // 每穿 30 帧
const CMP = {glass: {cx: 930, cy: 255}, ne: {cx: 1105, cy: 257}, labelY: 320, neq: {cx: 1018, cy: 253}};
const EV = {cx: 1080, cy: 458, size: 88};
const EV_PILL = {x: 802, y: 434, w: 112, h: 48};

// 承接位移：地球队中心 (560,370) → (400,380)，整体缩 0.7
const HO_TO = {s: 0.7, dx: -160, dy: 10, len: 16};

export const SC04: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, TO, EXIT_LEN);
  const exDy = exitAccel(Math.max(0, N - (TO - EXIT_LEN)), 0.2);
  const earthGlowK = fadeIn(N - T_EARTH, 10) * glowOffK(N, TO, 6, EXIT_LEN);
  const evGlowK = fadeIn(N - T_EV, 10) * glowOffK(N, TO, 6, EXIT_LEN);

  // 地球缩放入场
  const en = N - T_EARTH;
  const es = en < 0 ? 0 : scaleIn(en, 21);
  const eop = en < 0 ? 0 : firstOp(en, 8);

  // 保鲜膜 wipe（stroke draw-on + 填充渐显）
  const mp = clamp01((N - T_MEMB) / 14);
  const mFill = 0.07 * fadeIn(N - (T_MEMB + 4), 12);

  // 穿越 ×3（NeutrinoDot，与 SC02 同图元同参数 dotR 7 / tail 46；第三穿为「拦不住」的延续，见 T_C3 注释）
  const c1 = N - T_C1;
  const c2 = N - T_C2;
  const c3 = N - T_C3;
  const cross = (t: number, fromX: number, toX: number, dir: number) => {
    if (t < 0 || t > CROSS.len) return null;
    const x = fromX + (toX - fromX) * (t / CROSS.len);
    const op = Math.min(1, t / 2, (CROSS.len - t) / 2);
    return <NeutrinoDot x={x} y={LINE_Y} dir={dir} tail={46} dotR={7} opacity={op} />;
  };

  // 膜内绕行（第二穿结束后到末拍；速度 ≈ 周长/lap）
  const orb = (o: number) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * (o % ORBIT.lap)) / ORBIT.lap;
    return {x: EARTH.cx + ORBIT.rx * Math.cos(ang), y: EARTH.cy + ORBIT.ry * Math.sin(ang), dir: ang + Math.PI / 2};
  };
  const od = N - T_ORB;

  // 膜上波纹环（每 every 帧一圈、life 帧内扩开淡出；第二穿入膜起）
  const ripples: Array<{rx: number; ry: number; op: number}> = [];
  for (let k = 0; T_RIP + k * RIPPLE.every <= TO; k++) {
    const age = N - (T_RIP + k * RIPPLE.every);
    if (age < 0 || age > RIPPLE.life) continue;
    const t = age / RIPPLE.life;
    ripples.push({rx: RIPPLE.rx0 + (RIPPLE.rx1 - RIPPLE.rx0) * t, ry: RIPPLE.ry0 + (RIPPLE.ry1 - RIPPLE.ry0) * t, op: 0.7 * (1 - t) * fadeIn(N - T_RIP, 8)});
  }

  // 承接位移（地球队缩 0.7 移左，让「? eV」成为主角）
  const ho = easeInOutPow(2.5)(clamp01((N - T_HO) / HO_TO.len));
  const gS = 1 + (HO_TO.s - 1) * ho;
  const gDx = HO_TO.dx * ho;
  const gDy = HO_TO.dy * ho;

  // 「? eV」
  const evN = N - T_EV;
  const evS = evN < 0 ? 0 : scaleIn(evN, 21);
  const evPulse = emphasisPulse(N - T_EVP, {peak: 1.11});

  return (
    <div style={{position: 'absolute', inset: 0, opacity: exOp, transform: exDy ? `translateY(${exDy.toFixed(1)}px)` : undefined}}>
      {/* 地球队（紫柔光 + 地球 + 膜 + 波纹 + 绕行点；承接位移整组缩移） */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${EARTH.cx}px ${EARTH.cy}px`, transform: ho > 0 ? `translate(${gDx.toFixed(1)}px,${gDy.toFixed(1)}px) scale(${gS.toFixed(4)})` : undefined}}>
        <GlowBlob cx={EARTH.cx} cy={EARTH.cy} r={180} N={N} k={earthGlowK * eop} alpha={0.34} />
        <Svg bloom={false}>
          {/* 地球缩放入场（es 套在 EarthIcon 外） */}
          {eop > 0 ? (
            <g transform={`translate(${EARTH.cx} ${EARTH.cy}) scale(${Math.max(0.01, es).toFixed(4)}) translate(${-EARTH.cx} ${-EARTH.cy})`} opacity={eop}>
              <EarthIcon cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} sw={3} />
            </g>
          ) : null}
          {/* 保鲜膜：椭圆环带 stroke draw-on + 半透明填充 */}
          {mp > 0 ? (
            <g opacity={eop}>
              <ellipse cx={EARTH.cx} cy={EARTH.cy} rx={MEMB.rx} ry={MEMB.ry} fill={`rgba(102,45,248,${mFill.toFixed(3)})`} stroke={PURPLE} strokeWidth={2.5} pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - mp)} opacity={0.85} />
              {/* 膜上波纹环 */}
              {ripples.map((r, i) => (
                <ellipse key={i} cx={EARTH.cx} cy={EARTH.cy} rx={r.rx.toFixed(1)} ry={r.ry.toFixed(1)} fill="none" stroke={PURPLE_LIGHT} strokeWidth={3} opacity={r.op.toFixed(3)} />
              ))}
            </g>
          ) : null}
          {/* 膜内绕行的第二颗中微子（到末拍） */}
          {od >= 0 ? <NeutrinoDot x={Math.round(orb(od).x * 10) / 10} y={Math.round(orb(od).y * 10) / 10} dir={orb(od).dir} tail={30} dotR={7} opacity={od < 4 ? fadeIn(od, 4) : 1} /> : null}
        </Svg>
      </div>

      {/* 穿越 ×3（世界坐标，不随承接位移缩移——发生在位移之前/之后各一） */}
      <Svg bloom={false}>
        {cross(c1, CROSS.x0, CROSS.x1, 0)}
        {cross(c2, CROSS.x1, CROSS.x0, Math.PI)}
        {cross(c3, CROSS.x0, CROSS.x1, 0)}
      </Svg>

      {/* 右侧对照组：玻璃 ≠ 中微子（SoftIn 2 帧错峰；「≠」本镜唯一 GlitchIn） */}
      <SoftIn N={N} f0={T_CMP} dy={6}>
        <Svg bloom={false} style={{opacity: 1}}>
          <GlassShard cx={CMP.glass.cx} cy={CMP.glass.cy} s={1} />
          <NeutrinoDot x={CMP.ne.cx} y={CMP.ne.cy} dir={0} tail={26} dotR={6} />
        </Svg>
      </SoftIn>
      <SoftIn N={N} f0={T_CMP + 2} dy={6}>
        <CText cx={CMP.glass.cx} cy={CMP.labelY} size={24} weight={600} color={GREY}>
          光学透明
        </CText>
        <CText cx={CMP.ne.cx} cy={CMP.labelY} size={24} weight={600} color={WHITE}>
          弱相互作用
        </CText>
      </SoftIn>
      <GlitchIn N={N} f0={T_NE}>
        <CText cx={CMP.neq.cx} cy={CMP.neq.cy} size={46} weight={900} scaleX={0.85} color={WHITE} dy={-2}>
          ≠
        </CText>
      </GlitchIn>

      {/* 「质量」+ 「? eV」（1568 前挂；承接位移让位后成为画面焦点） */}
      <SoftIn N={N} f0={T_EV} dy={6}>
        <Pill x={EV_PILL.x} y={EV_PILL.y} w={EV_PILL.w} h={EV_PILL.h} fill={PURPLE} text="质量" fontSize={28} weight={800} sw={2.5} />
      </SoftIn>
      <GlowBlob cx={EV.cx} cy={EV.cy} r={105} N={N} k={evGlowK} alpha={0.3} />
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${EV.cx}px ${EV.cy + 4}px`, transform: evPulse === 1 ? `scale(${evS.toFixed(4)})` : `scale(${(evS * evPulse).toFixed(4)})`}}>
        {evN >= 0 ? (
          <CText cx={EV.cx} cy={EV.cy} size={EV.size} weight={700} family={FONT_ORB} color={GREY_LIGHT} letterSpacing={2} dy={0} shadow={`6px 6px 0 ${PURPLE_DEEP}, 0 0 28px rgba(102,45,248,.45)`} opacity={firstOp(evN, 8)}>
            ? eV
          </CText>
        ) : null}
      </div>
    </div>
  );
};
