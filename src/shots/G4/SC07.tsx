import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, kf, easeInOutPow, powIn, easeOutCubic, emphasisPulse, rnd, FONT_ORB, GlitchIn} from '../../common';
import {
  Svg, Trap, LineArrow, Cross, CText, TechText,
  WHITE, GREY, PURPLE, PURPLE_LIGHT, ORANGE, CORAL,
  fadeIn, SoftIn, exitOp, glowOffK, mixHex,
} from '../../ui';
import {GlowBlob, CameraRig} from '../../fx';

/**
 * SC07 十万挑一百 · N 3146–3523（S21–S22，分镜 v3）
 * S21 3154–3339「大气里的 μ 子 / 每秒钟敲响三千次 / 只收从地底钻上来的 / 噪声就几乎没了」
 * S22 3350–3501「一年约 100 个真正的天体中微子 / 就这样从十万个背景里 / 被挑了出来」（末块 24 帧短）
 * 画面：中央紫填充 Trap 漏斗（白描边，主角）→ 顶端一排灰小卡逐个落下穿层（被漏斗遮住）；
 *      大部分被拒卡变灰加速下落、向两侧甩出淡出；少数（6 张）从底下钻出落成紫点簇；
 *      底部 BigNumber「~100」橙 88px 计数 + 橙光脉冲；左侧小 veto 图（地球半圆截面 + 向下大气 μ 子箭头被红 X 挡 / 向上白箭头通过）。
 * 主角 = 漏斗（白描边梯形，连通外框 560×110 → min(w,4h)/2.5 ≈ 184px），紫柔光常驻。
 * 持续：卡片持续落下到 S22.c2（最后一张 3410 落下，末批 3445 前全部淡出）。
 * 停留：「~100」+ 紫点簇 3428 落位（分镜停留栏：前挂到 3428）→ 离场 3517 = 89 帧。
 * 运镜：3350 整组上移 110px（20 帧 easeInOutPow，相机 y 250→360）露出底部「100」；3710 之前结束，不进末拍。
 * 闪烁：本镜唯一 GlitchIn = 「~100」（白名单）；标签 / 计数 / veto 图一律 SoftIn。
 */
const F0 = 3146;
const TO = 3523;
const EXIT_AT = 3517; // 末 6 帧归零（N=TO 为 0；EXIT_AT+6=3523）
const EXIT_LEN = 6;

// 节拍（分镜 SC07 节拍列；容差 −6…+3）
const T_TRAP = 3154; // 漏斗 slideUp + 顶标签（S21 b1「大气里的 μ 子」）
const T_3K = 3188; // 「3,000 次 / 秒」徽标（S21 b2「每秒钟敲响三千次」）
const T_CARDS = 3158; // 小卡开始落下（1 张 / 3 帧）
const T_VETO = 3250; // veto 小图 SoftIn（S21 b3「只收从地底钻上来的」）
const T_VARR = 3256; // 向下大气 μ 子箭头 draw-on
const T_X = 3300; // 红 X draw-on（S21 b4「噪声就几乎没了」，3304 前 4 起）
const T_UP = 3312; // 向上白箭头 draw-on（通过）
const T_CAM0 = 3350; // 整组上移起点（S22 b1）
const T_CAM1 = T_CAM0 + 20; // 上移完成
const T_100 = 3350; // 「~100」GlitchIn + 计数起点（S22 b1「100 个」）
const T_100_LAND = 3428; // 计数落定（分镜停留栏：前挂到 3428）
const T_PULSE = 3432; // 「~100」落位脉冲
const T_UNIT = T_CAM1 + 4; // 「个 / 年」单位字（相机停稳后出，避开字幕带）
const T_LAB2 = 3410; // 顶标签换成「背景 ~10 万 / 年」（S22 c2 ≈ 3415，−5 在容差内）
const T_LAB2_PULSE = 3478; // 顶标签脉冲（S22 末块「被挑了出来」的可察觉变化，非新元素）

// 版面（内容主区 y110–620；x60–1220；无轨）
const ROW_Y = 178; // 小卡排（bbox 178–224，与漏斗顶 250 净空 26）
const CW = 34, CH = 46, NCOL = 11, PITCH = 48; // 列内净空 14px ≥12
const colX = (i: number) => 424 + PITCH * (i % NCOL); // 424…904，落在漏斗顶口 360–920 内
const TRAP = {cx: 640, y: 250, wTop: 560, wBot: 220, h: 110}; // 底口 530–750，底缘 360
const CLU_CY = 416; // 紫点簇中心（与漏斗底缘净空 ≈ 30，与「~100」墨迹净空 ≈ 55）
const NC = 85; // 卡片总数：最后一张 3410 落下（持续到 S22.c2）
const keptJ = (i: number) => (i % 15 === 3 ? i / 15 : -1); // 3/18/33/48/63/78 → 6 张真信号
const cluPos = (j: number): [number, number] => [640 + (j - 2.5) * 22, CLU_CY + ((j % 2) ? 9 : -5)];
const easeMove = easeInOutPow(2);
const easeFall = powIn(1.7);

// veto 小图（左侧配角：地球半圆截面 + 向下箭头被红 X 挡 + 向上白箭头通过）
const VETO = {cx: 175, surfY: 430, r: 67, downX: 140, upX: 210};

const Big100: React.FC<{N: number}> = ({N}) => {
  const c = Math.round(kf(N, [[T_100, 0], [T_100_LAND, 100]], (u) => 1 - Math.pow(1 - u, 1.3)));
  const pulse = emphasisPulse(N - T_PULSE, {peak: 1.11});
  const glowK = fadeIn(N - T_100, 8) * glowOffK(N, EXIT_AT, 6, EXIT_LEN);
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: '640px 514px', transform: pulse === 1 ? undefined : `scale(${pulse.toFixed(4)})`}}>
      <GlitchIn N={N} f0={T_100} rgbSplit={6} slices={14} sliceBands={3} seed={3}>
        <CText
          cx={640}
          cy={514}
          size={88}
          weight={700}
          family={FONT_ORB}
          letterSpacing={2}
          color={ORANGE}
          dy={-2}
          shadow={`6px 6px 0 rgba(240,95,65,.5), 0 0 ${Math.round(22 + 12 * glowK)}px rgba(240,95,65,${(0.55 + 0.35 * glowK).toFixed(2)})`}
          style={{fontVariantNumeric: 'tabular-nums'}}
        >
          ~{c}
        </CText>
      </GlitchIn>
    </div>
  );
};

/** 单张落下的小卡（纯函数）；11 列车道 → 4 条定宽流道（pitch 46、卡 34 宽，净空 12px）收敛进底口，
 *  被拒卡变灰加速下落、自中心向外侧甩开并快速淡出，保留卡落成紫点簇成员。 */
const FallCard: React.FC<{N: number; i: number}> = ({N, i}) => {
  const dropAt = T_CARDS + 3 * i;
  const n = N - dropAt;
  if (n < 0) return null;
  const j = keptJ(i);
  const slotX = 562 + 46 * (i % 4); // 定宽流道：562/608/654/700，底口 530–750 内距边缘 ≥15px
  const u = clamp01(n / 34); // 行 → 漏斗底口（y 178→364）
  let x = colX(i) + (slotX - colX(i)) * easeMove(u);
  let y = ROW_Y + (364 - ROW_Y) * easeFall(u);
  let w = CW, h = CH, op = fadeIn(n, 5);
  let greyK = clamp01((y - 300) / 60); // 进漏斗即开始变灰
  let purK = 0;
  if (j >= 0) {
    // 保留卡：底口 → 紫点簇，缩成点、变紫
    const t = clamp01((n - 34) / 26);
    const [cxj, cyj] = cluPos(j);
    x = slotX + (cxj - slotX) * t;
    y = 364 + (cyj - 364) * easeOutCubic(t);
    w = CW * (1 - t * 0.72);
    h = CH * (1 - t * 0.72);
    purK = clamp01((n - 34) / 12);
    greyK = 0;
  } else if (n > 34) {
    // 被拒卡：加速下落 + 自中心向外侧甩开（让开紫点簇 x 590–690）+ 快速淡出（y≤415 前 opacity=0，不触字幕带）
    const v = clamp01((n - 34) / 22);
    y = 364 + 106 * powIn(1.5)(v);
    const dir = slotX >= 640 ? 1 : -1;
    x += (dir * (150 + rnd(31, i) * 80) + (rnd(51, i) - 0.5) * 24) * powIn(1.2)(v);
    op = 1 - clamp01((y - 370) / 45);
  }
  if (op <= 0.02) return null;
  const fill = mixHex('#111116', PURPLE, purK);
  const stroke = mixHex(mixHex('#e6e6ea', '#6a6a6e', greyK), PURPLE_LIGHT, purK);
  return <rect key={i} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={purK > 0.5 ? 5 : 3} fill={fill} stroke={stroke} strokeWidth={2} opacity={op} />;
};

/** 顶标签：3154「大气 μ 子」+ 3188「3,000 次 / 秒」→ 3410 换成「背景 ~10 万 / 年」 */
const TopLabels: React.FC<{N: number}> = ({N}) => {
  const outA = 1 - clamp01((N - T_LAB2) / 6);
  const pulse = emphasisPulse(N - T_LAB2_PULSE, {peak: 1.06, up: 8, hold: 3, down: 10});
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: outA}}>
        <SoftIn N={N} f0={T_TRAP}>
          <CText cx={560} cy={130} size={26} weight={700} color={GREY} dy={-1}>
            大气 μ 子
          </CText>
        </SoftIn>
        <SoftIn N={N} f0={T_3K}>
          <CText cx={785} cy={130} size={26} weight={600} color={GREY} dy={-1} style={{fontVariantNumeric: 'tabular-nums'}}>
            <span style={{fontFamily: FONT_ORB, fontWeight: 700}}>3,000</span> 次 / 秒
          </CText>
        </SoftIn>
      </div>
      {N >= T_LAB2 ? (
        <div style={{position: 'absolute', inset: 0, transformOrigin: '640px 130px', transform: pulse === 1 ? undefined : `scale(${pulse.toFixed(4)})`}}>
          <SoftIn N={N} f0={T_LAB2} len={7}>
            <CText cx={640} cy={130} size={26} weight={700} color={GREY} dy={-1}>
              背景 <span style={{fontFamily: FONT_ORB, fontWeight: 700}}>~10 万</span> / 年
            </CText>
          </SoftIn>
        </div>
      ) : null}
    </>
  );
};

/** veto 小图（配角，无光）：3250 SoftIn；箭头 / X / 地球截面 */
const Veto: React.FC<{N: number}> = ({N}) => {
  const io = fadeIn(N - T_VETO, 8);
  if (io <= 0) return null;
  return (
    <g opacity={io}>
      {/* 地球半圆截面（冰面线 + 下半圆：地球在冰面之下） */}
      <path d={`M${VETO.cx - VETO.r},${VETO.surfY} A${VETO.r},${VETO.r} 0 0 0 ${VETO.cx + VETO.r},${VETO.surfY} Z`} fill="#080812" stroke={GREY} strokeWidth={2} />
      <line x1={VETO.cx - VETO.r} y1={VETO.surfY} x2={VETO.cx + VETO.r} y2={VETO.surfY} stroke={WHITE} strokeWidth={2.5} />
      {/* 向下大气 μ 子箭头（灰）→ 被红 X 挡在冰面 */}
      <LineArrow x0={VETO.downX} y0={346} x1={VETO.downX} y1={414} p={clamp01((N - T_VARR) / 16)} color={GREY} rodW={2.5} headL={16} headW={15} />
      <Cross cx={VETO.downX} cy={428} size={30} color={CORAL} sw={6} p={clamp01((N - T_X) / 12)} />
      {/* 从地底上来的白箭头（通过，尖端白点） */}
      <LineArrow x0={VETO.upX} y0={500} x1={VETO.upX} y1={348} p={clamp01((N - T_UP) / 18)} color={WHITE} rodW={2.5} headL={16} headW={15} />
      {N >= T_UP + 16 ? <circle cx={VETO.upX} cy={344} r={4} fill={WHITE} /> : null}
    </g>
  );
};

export const SC07: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, EXIT_AT, EXIT_LEN);
  const trapOp = N < T_TRAP ? 0 : fadeIn(N - T_TRAP, 6);
  const trapY = TRAP.y + (N < T_TRAP ? 0 : 60 * Math.pow(1 - clamp01((N - T_TRAP) / 22), 2.5));
  const trapGlowK = fadeIn(N - T_TRAP, 10) * glowOffK(N, EXIT_AT, 6, EXIT_LEN);
  const cards = Array.from({length: NC}, (_, i) => <FallCard key={i} N={N} i={i} />);

  return (
    <CameraRig
      N={N}
      keys={[
        {f: F0, x: 640, y: 250, s: 1}, // 相机先压低：整组落在屏幕下段（底口 y≈470，不触字幕带）
        {f: T_CAM0, x: 640, y: 250, s: 1},
        {f: T_CAM1, x: 640, y: 360, s: 1}, // 整组上移 110px 露出底部「100」
      ]}
      style={{opacity: exOp}}
    >
      {/* 主角光：漏斗紫柔光斑（呼吸，离场前 6 帧先灭） */}
      <GlowBlob cx={TRAP.cx} cy={trapY + TRAP.h / 2} r={190} N={N} k={trapGlowK} alpha={0.3} />

      <Svg bloom={false}>
        {cards}
        <Veto N={N} />
      </Svg>

      {/* 主角：紫填充漏斗（白描边连通外框，文字「背景筛选」） */}
      <div style={{position: 'absolute', inset: 0, opacity: trapOp}}>
        <Trap cx={TRAP.cx} y={trapY} wTop={TRAP.wTop} wBot={TRAP.wBot} h={TRAP.h} k={1} text="背景筛选" fontSize={34} />
      </div>

      <TopLabels N={N} />

      {/* veto 标签（一律 SoftIn，无光） */}
      <SoftIn N={N} f0={T_VETO}>
        <TechText cx={VETO.cx} cy={294} text="veto" fontSize={22} color={GREY} glow={false} />
        <CText cx={VETO.downX} cy={326} size={22} weight={600} color={GREY} dy={-1}>
          大气 μ 子
        </CText>
        <CText cx={VETO.upX} cy={326} size={22} weight={600} color={WHITE} dy={-1}>
          地底钻上来
        </CText>
      </SoftIn>

      {/* 底部结果：「~100」橙计数（本镜唯一 GlitchIn） + 单位 */}
      <Big100 N={N} />
      <SoftIn N={N} f0={T_UNIT} len={7}>
        <CText cx={640} cy={581} size={24} weight={600} color={GREY}>
          个 / 年
        </CText>
      </SoftIn>
    </CameraRig>
  );
};
