import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, emphasisPulse, powOutRemain, GlitchIn} from '../../common';
import {
  Svg, MedalIcon, PersonIcon, Pill, Box, CText, TechSub, LineArrow,
  WHITE, GREY, GREY_LINE, GREY_LIGHT, PURPLE, PURPLE_LIGHT, ORANGE,
  fadeIn, slideUp, SoftIn, mixHex, glowPurpleS, softOp, firstOp,
} from '../../ui';
import {CameraRig, GlowBlob, BigNumber, countTo} from '../../fx';

/**
 * SC11 诺奖与一个人背后的 450 人 · N 4636–5412（S30–S33，分镜 v3 +8% 配音）
 * 出处/人物 + 群像。主角 = 左侧诺奖奖章（MedalIcon r78 + 挂带，整体 202px 高，紫柔光呼吸）；
 * 右侧人物卡（来源卡）= Francis Halzen / 弗兰西斯·哈尔岑 / UW–Madison / 首席研究员 PI；
 * 其下「34 年来首次独享」Pill（重点紫）、S32 履历 chips（理论物理学家 → 牵头十几年 → 1 km³）、
 * 人形阵列 10×5 = 50 个小人（逐排点亮，矩阵式表现「多」）、引言卡（Halzen 自陈，打字机）。
 * 闪烁白名单：本镜唯一 GlitchIn = 「2026」（BigNumber + 18 帧计数 2016→2026）；
 * 年份计数/人形逐排点亮/引言打字机一律 SoftIn/计数/打字机，不闪。
 * 运镜：4658–4686 推近 1→1.12 向奖章 → 4944–4981 拉远 1.12→0.9 露出人形阵列（分镜运镜清单 SC11 推近+拉远）。
 * 持续：人形阵列逐排点亮到 5248、奖章紫光呼吸；停留：引言打字机落定 5342 → 离场 5407 = 65 帧。
 */
const F0 = 4636;
const TO = 5412; // 分镜：= SC12 首句 S34.from−9
const EXIT_LEN = 8; // 末 8 帧归零（N=TO 为 0）

// 节拍（分镜表 G6；容差 −6…+3）
const T_MEDAL = 4638; // 奖章 scaleX 翻转入场（8f；S30 c1「2026 年 10 月」前 6 帧）
const T_YEAR = 4644; // 「2026」GlitchIn + 计数（S30 c1）
const T_NOBEL = 4690; // 「诺贝尔物理学奖」Pill（S30 c2 容差内；推近 4656–4684 后 6 帧）
const T_CARD = 4779; // 人物卡 slideUp（S30 c4「弗兰西斯·哈尔岑」）
const T_PILL34 = 4839; // 「34 年来首次独享」（S31 c1；4884 c2 落位脉冲）
const T_PULSE34 = 4884;
const T_CHIP1 = 4931; // 「理论物理学家」（S32 c1 −6）
const T_CHIP2 = 5007; // 「牵头十几年」（S32 c2；拉远 4960–4997 后 10 帧）
const T_CHIP3 = 5083; // 「1 km³」（S32 c4「做成了一立方公里」）
const T_ARR = 5000; // 人形阵列容器淡入（拉远后、S32 c2「牵头造」时成团）
const T_ARRLBL = 5152; // 「~450 人 · 14 国」（S33 c2「这个奖属于 14 国近 450 人的团队」−0）
const T_ROW = 5154; // 逐排点亮起点（排距 16f，排内 1f 错峰、5f 变色 → 末格亮于 5244）
const T_QUOTE = 5267; // 引言卡（S33 c4「如果一开始就知道…」前挂；末块短按分镜停留栏前挂）
const T_QDONE = T_QUOTE + 75; // 打字机 3f/字 × 25 字落定
const T_EXIT = TO - EXIT_LEN; // 5405
const T_GLOWOFF = 5390; // 主角光 16 帧二次缓灭（平滑末步，避免 hold 判定被打断）

// 版面（分镜表坐标参考值，按版式安全区微调）
const MEDAL = {cx: 315, cy: 360, r: 78}; // 整体 235.2–438 = 202px 高（含挂带）
const YEAR = {cx: 315, cy: 155, size: 96};
const CARD = {x: 600, y: 108, w: 420, h: 200};
const PORTRAIT = {cx: 662, cy: 190, size: 96};
const CHIP_Y = 376;
const AC = {x: 906, y: 478, cols: 10, rows: 5, size: 23, step: 29}; // 格距 6px、人形 23px
const QUOTE_BOX = {x: 140, y: 520, w: 400, h: 100};
const QUOTE = '若一开始就知道冰里全是气泡，这事儿根本起不来'; // 事实清单允许（Halzen 自陈，The Sciences 1999）

// 运镜：推近 1→1.12 向奖章（28f）→ 拉远 1.12→0.9 露出人形阵列（37f）
const KEYS = [
  {f: F0, x: 640, y: 360, s: 1},
  {f: 4656, x: 640, y: 360, s: 1},
  {f: 4684, x: 480, y: 330, s: 1.12}, // 推近 1→1.12 向奖章（28f）
  {f: 4960, x: 480, y: 330, s: 1.12},
  {f: 4997, x: 640, y: 360, s: 0.9}, // 拉远 1.12→0.9 露出人形阵列（37f）
  {f: 5264, x: 640, y: 340, s: 1.0}, // 慢推 0.9→1.0 压向人物卡+人形阵列（267f，S32/S33 持续动作，结束 ≤ 离场起点 −30）
];

/** 人形阵列单元（圆头 + 肩线，无 filter，50 枚共用一个 Svg） */
const PersonGlyph: React.FC<{cx: number; cy: number; s: number; color: string}> = ({cx, cy, s, color}) => (
  <g transform={`translate(${(cx - s / 2).toFixed(2)} ${(cy - s / 2).toFixed(2)})`}>
    <path d={`M1.5,${(s - 1.5).toFixed(2)} V${(s * 0.78).toFixed(2)} A${(s / 2 - 1.5).toFixed(2)},${(s * 0.3).toFixed(2)} 0 0 1 ${(s - 1.5).toFixed(2)},${(s * 0.78).toFixed(2)} V${(s - 1.5).toFixed(2)} Z`} fill="#08080d" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    <circle cx={(s / 2).toFixed(2)} cy={(s * 0.27).toFixed(2)} r={(s * 0.19).toFixed(2)} fill="#08080d" stroke={color} strokeWidth={1.6} />
  </g>
);

/** 三角脉冲 0→1→0（行闪光用） */
const tri = (n: number, len = 14) => (n <= 0 || n >= len ? 0 : n < len / 2 ? n / (len / 2) : 1 - (n - len / 2) / (len / 2));

/** 履历 chip（配角标签：黑底白边 + 23px 字；重点 chip 紫边 + 单处 GLOW_PURPLE_S） */
const Chip: React.FC<{x: number; y: number; w: number; text: string; accent?: boolean; glowK?: number}> = ({x, y, w, text, accent = false, glowK = 0}) => (
  <Pill x={x} y={y} w={w} h={44} r={8} fill="#000" stroke={accent ? PURPLE_LIGHT : WHITE} sw={accent ? 2.5 : 2} text={text} fontSize={23} weight={700} glow={accent && glowK > 0.02 ? glowPurpleS(glowK * 0.8) : undefined} />
);

/** 侧滑入场 chip（Δ100 / 22f + 8 帧淡入；落地处白闪 1→1.5→1，落定的「事件」闪烁） */
const SlideChip: React.FC<{N: number; f0: number; x: number; y: number; w: number; text: string; accent?: boolean; glowK?: number}> = ({N, f0, x, y, w, text, accent = false, glowK = 0}) => {
  const n = N - f0;
  if (n < 0) return null;
  const dx = 100 * powOutRemain(n, 22, 2.5);
  const land = n < 22 ? 0 : (1 - clamp01((n - 22) / 8)); // 落地后紫柔光 8 帧亮起再收
  return (
    <div style={{position: 'absolute', left: x - dx, top: y, opacity: softOp(n, 8)}}>
      <Chip x={0} y={0} w={w} text={text} accent={accent} glowK={Math.max(glowK ?? 0, 0.85 * land * tri(n - 22, 24))} />
    </div>
  );
};

export const SC11: React.FC = () => {
  const N = useCurrentFrame() + F0;
  // 离场归零（末 8 帧线性）：亮尾内容多时 ^1.5 的 7% 首步会让 hold 回溯卡 0，线性 12.5%/帧且末帧恰为 0
  const exN = N - (TO - EXIT_LEN);
  const exOp = exN <= 0 ? 1 : Math.max(0, 1 - exN / EXIT_LEN);
  const gOff = N <= T_GLOWOFF ? 1 : Math.max(0, 1 - Math.pow(clamp01((N - T_GLOWOFF) / 16), 2)); // 带光元素 16 帧二次缓灭，离场前归零

  // 奖章：scaleX 翻转入场（8f，1→0→1 同面翻转）
  const mn = N - T_MEDAL;
  const flip = mn < 0 ? 0 : Math.abs(Math.cos(Math.PI * clamp01(mn / 8)));
  const medalOp = mn < 0 ? 0 : softOp(mn, 8);
  const medalTf =
    flip >= 1 ? undefined : `translate(${MEDAL.cx} ${MEDAL.cy}) scale(${flip.toFixed(4)} 1) translate(${-MEDAL.cx} ${-MEDAL.cy})`;

  // 「2026」计数 + 脉冲
  const year = countTo(N - T_YEAR, 2016, 2026, 18);
  const yearK = fadeIn(N - T_YEAR, 8) * gOff;

  // 人物卡 slideUp
  const cn = N - T_CARD;
  const cardY = CARD.y + (cn < 0 ? 0 : slideUp(cn, 60, 22));
  const cardOp = cn < 0 ? 0 : firstOp(cn, 6); // 首帧即 ≈57%，不空帧

  // 「34 年」Pill：入场 → 4884 落位脉冲 → 5083 让位给「1 km³」（重点转移，8 帧灭光）
  const g34 = clamp01((N - T_PILL34) / 8) * (1 - clamp01((N - T_CHIP3) / 8));
  const p34 = emphasisPulse(N - T_PULSE34, {peak: 1.06});
  const g3 = clamp01((N - T_CHIP3) / 8);

  // 引言卡打字机（3f/字）
  const qt = Math.max(0, N - T_QUOTE);
  const typed = QUOTE.slice(0, Math.floor(qt / 3));
  const qPulse = emphasisPulse(N - T_QDONE, {peak: 1.04, up: 9, hold: 3, down: 11});

  return (
    <CameraRig N={N} keys={KEYS} style={{opacity: exOp}}>
      {/* 主角光：奖章脚下紫柔光斑（30 帧呼吸，离场前先灭） */}
      <GlowBlob cx={MEDAL.cx} cy={MEDAL.cy} r={115} N={N} k={yearK} alpha={0.42} />

      <Svg bloom={false}>
        {/* 主角：诺奖奖章（缩放翻转入场；glowK 呼吸 + 离场前灭光） */}
        <g transform={medalTf} opacity={medalOp}>
          <MedalIcon cx={MEDAL.cx} cy={MEDAL.cy} r={MEDAL.r} sw={2.5} accent={ORANGE} glowK={Math.max(fadeIn(N - T_MEDAL, 12) * gOff, 0)} />
        </g>
        {/* 人形阵列：10×5 = 50（容器 5000 淡入；逐排点亮 5154 起，排距 18f、排内 2f 错峰） */}
        {N >= T_ARR ? (
          <g opacity={firstOp(N - T_ARR, 8)}>
            {/* 行闪光条：逐排点亮时该行整条紫光脉冲后收（把「点亮」做成可察觉的大面积动作） */}
            {Array.from({length: AC.rows}, (_, r) => {
              const fl = tri(N - T_ROW - r * 16, 14);
              if (fl <= 0.01) return null;
              return <rect key={`f${r}`} x={AC.x} y={AC.y + r * AC.step} width={AC.cols * AC.step - 6} height={AC.step - 6} rx={4} fill={PURPLE_LIGHT} opacity={0.7 * fl} />;
            })}
            {Array.from({length: AC.cols * AC.rows}, (_, i) => {
              const r = Math.floor(i / AC.cols);
              const c = i % AC.cols;
              const lit = N - (T_ROW + r * 16 + c);
              const k = lit < 0 ? 0 : clamp01(lit / 5); // 灰描边 → 白描边
              return <PersonGlyph key={i} cx={AC.x + (c + 0.5) * AC.step} cy={AC.y + (r + 0.5) * AC.step} s={AC.size} color={mixHex(GREY_LINE, WHITE, k)} />;
            })}
          </g>
        ) : null}
        {/* S32 履历 chips 之间的箭头（draw-on 16f，自根部长出） */}
        <LineArrow x0={804} y0={CHIP_Y + 22} x1={848} y1={CHIP_Y + 22} p={clamp01((N - (T_CHIP1 + 4)) / 16)} rodW={2.5} headL={16} headW={16} color={GREY} />
        <LineArrow x0={1048} y0={CHIP_Y + 22} x1={1092} y1={CHIP_Y + 22} p={clamp01((N - (T_CHIP2 + 4)) / 16)} rodW={2.5} headL={16} headW={16} color={GREY} />
      </Svg>

      {/* 「2026」：本镜唯一 GlitchIn（闪烁白名单）+ 18 帧计数 2016→2026 + 紫硬投影 */}
      <GlitchIn N={N} f0={T_YEAR} rgbSplit={5}>
        <BigNumber cx={YEAR.cx} cy={YEAR.cy} value={year} size={YEAR.size} />
      </GlitchIn>

      {/* 「诺贝尔物理学奖」标签（S30 c2；小下滑入 Δ18） */}
      <div style={{position: 'absolute', left: 215, top: 450 + (N < T_NOBEL ? 0 : 18 * powOutRemain(N - T_NOBEL, 16, 2.5)), opacity: N < T_NOBEL ? 0 : softOp(N - T_NOBEL, 8)}}>
        <Pill x={0} y={0} w={200} h={40} fill="#000" stroke={WHITE} sw={2} text="诺贝尔物理学奖" fontSize={22} weight={700} />
      </div>

      {/* 人物卡（来源卡）：slideUp Δ60/22 + 8 帧淡入；内部元素 2 帧错峰 SoftIn */}
      {/* 「牵头造了十几年」(5007) 焦点回到 Halzen：卡背紫柔光一次性亮起后收 */}
      {N >= T_CHIP2 - 2 ? (
        <div style={{position: 'absolute', left: CARD.x - 14, top: cardY - 14, width: CARD.w + 28, height: CARD.h + 28, borderRadius: 16, background: `radial-gradient(circle, rgba(102,45,248,${(0.5 * tri(N - (T_CHIP2 - 2), 34)).toFixed(3)}) 0%, rgba(102,45,248,0) 72%)`}} />
      ) : null}
      <div style={{position: 'absolute', left: CARD.x, top: cardY, width: CARD.w, height: CARD.h, opacity: cardOp}}>
        <Box x={0} y={0} w={CARD.w} h={CARD.h} r={10} fill="#000" stroke={WHITE} sw={2.5} />
        <SoftIn N={N} f0={T_CARD + 2}>
          <PersonIcon cx={PORTRAIT.cx - CARD.x} cy={PORTRAIT.cy - CARD.y} size={PORTRAIT.size} sw={2.5} />
        </SoftIn>
        <SoftIn N={N} f0={T_CARD + 4}>
          <CText cx={738 - CARD.x} cy={146 - CARD.y} size={30} weight={800} color={WHITE} letterSpacing={0.5}>
            Francis Halzen
          </CText>
        </SoftIn>
        <SoftIn N={N} f0={T_CARD + 6}>
          <CText cx={738 - CARD.x} cy={186 - CARD.y} size={24} weight={600} color={GREY_LIGHT}>
            弗兰西斯·哈尔岑
          </CText>
        </SoftIn>
        <SoftIn N={N} f0={T_CARD + 8}>
          <TechSub cx={738 - CARD.x} cy={224 - CARD.y} text="UW–Madison" size={24} />
        </SoftIn>
        <SoftIn N={N} f0={T_CARD + 10}>
          <Pill x={700 - CARD.x} y={250 - CARD.y} w={200} h={36} r={8} fill="#000" stroke={WHITE} sw={2} text="首席研究员 PI" fontSize={22} weight={700} letterSpacing={1} />
        </SoftIn>
      </div>

      {/* 「34 年来首次独享」（S31 c1；下滑入 Δ30；c2 落位脉冲；重点随后让位给 1 km³） */}
      <div
        style={{position: 'absolute', left: 596, top: 322 + (N < T_PILL34 ? 0 : 30 * powOutRemain(N - T_PILL34, 18, 2.5)), opacity: N < T_PILL34 ? 0 : softOp(N - T_PILL34, 8), transformOrigin: '450px 23px', transform: p34 === 1 ? undefined : `scale(${p34.toFixed(4)})`}}
      >
        <Pill x={0} y={0} w={280} h={46} fill={PURPLE} sw={2} text="34 年来首次独享" fontSize={25} weight={800} glow={glowPurpleS(g34)} />
      </div>

      {/* S32 履历 chips：理论物理学家 → 牵头十几年 → 1 km³（侧滑入场；当前重点唯一紫光在 1 km³） */}
      <SlideChip N={N} f0={T_CHIP1} x={596} y={CHIP_Y} w={196} text="理论物理学家" />
      <SlideChip N={N} f0={T_CHIP2} x={860} y={CHIP_Y} w={176} text="牵头十几年" />
      <SlideChip N={N} f0={T_CHIP3} x={1104} y={CHIP_Y} w={114} text="1 km³" accent glowK={g3} />

      {/* 人形阵列标签 */}
      <SoftIn N={N} f0={T_ARRLBL} dy={4}>
        <CText cx={1048} cy={447} size={22} weight={700} color={GREY}>
          ~450 人 · 14 国
        </CText>
      </SoftIn>

      {/* 引言卡（末拍，前挂 S33 c4）：打字机 3f/字 → 5342 落定脉冲 */}
      <div style={{position: 'absolute', left: QUOTE_BOX.x, top: QUOTE_BOX.y, width: QUOTE_BOX.w, height: QUOTE_BOX.h, transformOrigin: `${QUOTE_BOX.w / 2}px ${QUOTE_BOX.h / 2}px`, transform: qPulse === 1 ? undefined : `scale(${qPulse.toFixed(4)})`}}>
        <SoftIn N={N} f0={T_QUOTE} dy={10}>
          <Box x={0} y={0} w={QUOTE_BOX.w} h={QUOTE_BOX.h} r={10} fill="#000" stroke={WHITE} sw={2.5} glow="0 0 14px 3px rgba(102,45,248,.18)" />
          <CText cx={QUOTE_BOX.w / 2} cy={23} size={23} weight={700} color={WHITE} letterSpacing={0.5}>
            {typed.slice(0, 15)}
          </CText>
          <CText cx={QUOTE_BOX.w / 2} cy={55} size={23} weight={700} color={WHITE} letterSpacing={0.5}>
            {typed.slice(15)}
          </CText>
          <CText cx={QUOTE_BOX.w / 2} cy={86} size={22} weight={500} color={GREY} letterSpacing={1} opacity={fadeIn(N - (T_QDONE - 6), 10)}>
            — Halzen 自陈 · The Sciences 1999
          </CText>
        </SoftIn>
      </div>
    </CameraRig>
  );
};
