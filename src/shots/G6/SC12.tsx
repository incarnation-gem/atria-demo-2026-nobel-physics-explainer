import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, easeInOutPow, kf, emphasisPulse, GlitchIn} from '../../common';
import {
  Svg, EnvelopeIcon, GalaxyIcon, NeutrinoDot, Box, CText, LineArrow,
  WHITE, GREY, GREY_LINE, PURPLE, PURPLE_LIGHT, TEXT_GLOW,
  fadeIn, slideUp, firstOp,
} from '../../ui';
import {CameraRig, GlowBlob, HaloRing, Sparkle} from '../../fx';

/**
 * SC12 收尾回扣（高光时刻·象征物型）· N 5413–5639（S34–S35，分镜 v3）
 * 主角 = 中央信封（360×200，含打开封口整体 ~298px 高，紫柔光 + 脚下 HaloRing draw-on）；
 * 从封口抽出「履历单」卡（方向 → + 能量 290 万亿 eV 能量条）；左下角星系承接 SC09（同组件缩 0.35）；
 * NeutrinoDot 从星系飞向信封（幽灵信使送达）；封口光点循环上飘（持续到末拍）；
 * 结论大字「被看见了」Noto 900 60px 紫描边 GlitchIn（rgbSplit 6，本镜唯一闪烁）。
 * 象征物型变体不用扫光（扫光白名单仅 SC02）。运镜：1.0→1.05 慢推贯穿。
 * 停留：大字 5615 GlitchIn 落位脉冲 5627 → 片尾压黑（ENDING_RANGE 5607 起）接管淡出，本镜不硬切、不离场。
 */
const F0 = 5413;
const TO = 5639; // 分镜：末句 S35.to + 2；离场由片尾接管，本镜末帧不归零

// 节拍（分镜表 G6；容差 −6…+3）
const T_ENV = 5415; // 信封 slideUp Δ120/21（S34 c1「从只能看光」前 6 帧）
const T_RING = 5421; // HaloRing draw-on 20f（S34 c1）
const T_FLAP = 5430; // 封口打开 20f
const T_SPARK = 5430; // 封口光点循环上飘（持续到末拍）
const T_GALAXY = 5456; // 星系承接淡入（S34 c2「幽灵信使」）
const T_DOT = 5456; // NeutrinoDot 从星系飞向信封（30f + 16f 落入封口）
const T_CARD = 5504; // 履历单自封口抽出 18f（S34 c3「履历单」）
const T_ARR1 = 5512; // 「方向」箭头 draw-on（履历单落位后，16f）
const T_BAR = 5524; // 能量条充能 16f
const T_FLASH = 5609; // 信封白闪（S35 c2「第一次」）
const T_BIG = 5615; // 大字「被看见了」GlitchIn（S35 c3 前 6 帧）
const T_PULSE = 5627; // 大字落位脉冲

// 版面（分镜表坐标参考值，按版式安全区微调）
const ENV = {x: 460, y: 300, w: 360, h: 200}; // cx 640；封口尖 ~202 → 底 500
const RING = {cx: 640, cy: 505, rxo: 250, ryo: 56, rxi: 175, ryi: 30};
const GAL = {cx: 200, cy: 545, r: 49}; // 星系缩到 0.35（承接 SC09 r140）
const REC = {x: 880, y: 250, w: 250, h: 150}; // 履历单落位（信封右侧，净空 60px）
const REC_FROM = {x: 630, y: 300}; // 抽出起点 = 封口
const BIG = {cx: 640, cy: 140, size: 60};
const DOT_FROM = {x: 250, y: 535};
const DOT_TO = {x: 630, y: 292};

// 慢推 1.0→1.05 贯穿（推后内容留 x 89–1191 / y 122–607）
const KEYS = [
  {f: F0, x: 640, y: 360, s: 1},
  {f: TO, x: 640, y: 360, s: 1.05},
];

/** 三角脉冲 0→1→0（白闪用） */
const tri = (n: number, len = 8) => (n <= 0 || n >= len ? 0 : n < len / 2 ? n / (len / 2) : 1 - (n - len / 2) / (len / 2));

/** 履历单（位置/缩放按 kf 抽出；内部坐标为卡本地） */
const RecordCard: React.FC<{x: number; y: number; s: number; op: number; N: number}> = ({x, y, s, op, N}) => (
  <div style={{position: 'absolute', left: x, top: y, width: REC.w, height: REC.h, transformOrigin: '0 0', transform: `scale(${s.toFixed(4)})`, opacity: op}}>
    <Box x={0} y={0} w={REC.w} h={REC.h} r={10} fill="#000" stroke={WHITE} sw={2.5} />
    <CText cx={44} cy={20} size={22} weight={700} color={GREY}>
      履历单
    </CText>
    <div style={{position: 'absolute', left: 18, right: 18, top: 38, height: 1.5, background: GREY_LINE}} />
    <CText cx={44} cy={66} size={24} weight={700} color={WHITE}>
      方向
    </CText>
    <Svg bloom={false}>
      <LineArrow x0={82} y0={66} x1={218} y1={66} p={clamp01((N - T_ARR1) / 16)} rodW={2.5} headL={16} headW={16} color={PURPLE_LIGHT} />
    </Svg>
    <CText cx={125} cy={102} size={24} weight={800} color={WHITE} shadow={TEXT_GLOW} style={{fontVariantNumeric: 'tabular-nums'}}>
      290 万亿 eV
    </CText>
    <div style={{position: 'absolute', left: 18, top: 122, width: REC.w - 36, height: 10, border: `1.5px solid ${GREY_LINE}`, borderRadius: 2}} />
    <div style={{position: 'absolute', left: 18, top: 122, width: (REC.w - 36) * clamp01((N - T_BAR) / 16), height: 10, background: PURPLE, borderRadius: 2, boxShadow: '0 0 10px 2px rgba(102,45,248,.55)'}} />
  </div>
);

export const SC12: React.FC = () => {
  const N = useCurrentFrame() + F0;

  // 信封 slideUp + 白闪（S35 c2「第一次」）
  const en = N - T_ENV;
  const envDy = en < 0 ? 0 : slideUp(en, 120, 21);
  const envOp = en < 0 ? 0 : firstOp(en, 6); // 首帧 ≈57%，不空帧
  const flash = 1 + 0.45 * tri(N - T_FLASH, 8);

  const openK = clamp01((N - T_FLAP) / 20);
  const envGlow = fadeIn(N - T_ENV, 12);

  // HaloRing draw-on + 紫渐变填充 + 3 圈虚线波纹（2 帧一相位）
  const ringP = clamp01((N - T_RING) / 20);
  const ringFill = 0.8 * clamp01((N - (T_RING + 12)) / 12);
  const phase = Math.floor(Math.max(0, N - T_RING) / 2) * 5;

  // NeutrinoDot：星系 → 封口（30f easeInOut）→ 落入封口收缩（16f）
  const dN = N - T_DOT;
  const t1 = clamp01(dN / 30);
  const e1 = easeInOutPow(2.5)(t1);
  const t2 = clamp01((dN - 30) / 16);
  const dotX = DOT_FROM.x + (DOT_TO.x - DOT_FROM.x) * e1 + (640 - DOT_TO.x) * 0.4 * t2;
  const dotY = DOT_FROM.y + (DOT_TO.y - DOT_FROM.y) * e1 + (336 - DOT_TO.y) * 0.4 * t2;
  const dotR = 7 - 3.5 * t2;
  const dotOp = dN < 0 ? 0 : dN > 46 ? 0 : (1 - 0.7 * t2) * fadeIn(dN, 4);
  const dotDir = Math.atan2(DOT_TO.y - DOT_FROM.y, DOT_TO.x - DOT_FROM.x);

  // 履历单自封口 kf 抽出 18f
  const cardT = kf(N, [[T_CARD, 0], [T_CARD + 18, 1]], easeInOutPow(2.5));
  const recX = REC_FROM.x + (REC.x - REC_FROM.x) * cardT;
  const recY = REC_FROM.y + (REC.y - REC_FROM.y) * cardT;
  const recS = 0.82 + 0.18 * cardT;

  // 封口光点：3 颗循环上飘（42f 一周期），持续到末拍
  const sparks = Array.from({length: 3}, (_, i) => {
    const ph = (N - T_SPARK + i * 14) % 42;
    const t = ph / 42;
    return {x: 600 + i * 40, y: 292 - 58 * t, op: Math.sin(Math.PI * t) * 0.85, r: 3.1 + 0.7 * Math.sin(Math.PI * t)};
  });

  const bigPulse = emphasisPulse(N - T_PULSE, {peak: 1.06, up: 9, hold: 3, down: 12});

  return (
    <CameraRig N={N} keys={KEYS}>
      {/* 主角光：信封紫柔光（呼吸） */}
      <GlowBlob cx={640} cy={400} r={160} N={N} k={envGlow} alpha={0.4} />

      {/* 光环后半（主体之后） */}
      <HaloRing cx={RING.cx} cy={RING.cy} rxo={RING.rxo} ryo={RING.ryo} rxi={RING.rxi} ryi={RING.ryi} p={ringP} fillOp={ringFill} phase={phase} half="back" opacity={envOp} />

      {/* 主角：信封（slideUp + 封口打开 + 白闪） */}
      <div style={{position: 'absolute', inset: 0, opacity: envOp, transform: `translateY(${envDy.toFixed(2)}px)`, filter: `brightness(${flash.toFixed(3)})`}}>
        <EnvelopeIcon x={ENV.x} y={ENV.y} w={ENV.w} h={ENV.h} openK={openK} accent={PURPLE_LIGHT} sw={2.5} />
      </div>

      {/* 光环前半（主体之前，夹住信封） */}
      <HaloRing cx={RING.cx} cy={RING.cy} rxo={RING.rxo} ryo={RING.ryo} rxi={RING.rxi} ryi={RING.ryi} p={ringP} fillOp={ringFill} phase={phase} half="front" opacity={envOp} />

      <Svg bloom={false}>
        {/* 左下角星系承接 SC09（同组件缩 0.35，淡入） */}
        <g opacity={fadeIn(N - T_GALAXY, 14)}>
          <GalaxyIcon cx={GAL.cx} cy={GAL.cy} r={GAL.r} sw={2} />
        </g>
        {/* 幽灵信使：NeutrinoDot 从星系飞向信封封口 */}
        {dotOp > 0.02 ? <NeutrinoDot x={dotX} y={dotY} dir={dotDir} tail={44 - 20 * t2} dotR={dotR} opacity={dotOp} /> : null}
        {/* 封口光点循环上飘（持续到末拍） */}
        {N >= T_SPARK
          ? sparks.map((p, i) => <circle key={i} cx={p.x} cy={p.y.toFixed(1)} r={p.r.toFixed(2)} fill={PURPLE_LIGHT} opacity={(p.op * envOp).toFixed(3)} style={{filter: 'drop-shadow(0 0 4px rgba(161,117,241,.9))'}} />)
          : null}
      </Svg>

      {/* 履历单（自封口抽出） */}
      {cardT >= 0 ? <RecordCard x={recX} y={recY} s={recS} op={firstOp(N - T_CARD, 6)} N={N} /> : null}

      {/* 结论大字「被看见了」（本镜唯一 GlitchIn；紫描边白填心）+ 落位脉冲 + 两颗小星 */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${BIG.cx}px ${BIG.cy}px`, transform: bigPulse === 1 ? undefined : `scale(${bigPulse.toFixed(4)})`}}>
        <Sparkle cx={498} cy={118} r={14} opacity={0.9 * fadeIn(N - T_BIG, 10)} />
        <Sparkle cx={788} cy={126} r={10} opacity={0.8 * fadeIn(N - T_BIG, 10)} />
        <GlitchIn N={N} f0={T_BIG} rgbSplit={6}>
          <CText cx={BIG.cx} cy={BIG.cy} size={BIG.size} weight={900} scaleX={0.85} letterSpacing={5} color={WHITE} dy={-2} shadow="0 0 18px rgba(102,45,248,.75), 0 0 6px rgba(255,255,255,.55)" style={{WebkitTextStroke: `2.5px ${PURPLE}`, paintOrder: 'stroke fill'}}>
            被看见了
          </CText>
        </GlitchIn>
      </div>
    </CameraRig>
  );
};
