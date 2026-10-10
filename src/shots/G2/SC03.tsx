import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, emphasisPulse, FONT_ORB, GlitchIn, rnd} from '../../common';
import {Svg, Box, CText, WHITE, GREY, ORANGE, fadeIn, scaleIn, firstOp, exitAccel, glowOffK, SoftIn} from '../../ui';
import {CameraRig, countTo} from '../../fx';
import {HandPart} from './parts';

/**
 * SC03 650 亿（高光·大数字型）· N 1029–1350（S07–S08）
 * 主角 = 左侧大数字「650 亿」Orbitron 104px + 橙柔光（BigNumber 20 帧计数 + 单位行，
 * 与单位行压成一簇连通主体 ~210px）。右侧简笔手掌（配角，无光）+ 食指指甲紫高亮；
 * 密集白点成股从左向右穿过手掌（持续到末拍 = 「不跟任何东西发生作用」的动词）。
 * 下角小卡「你的一生 · 命中 0 次」：末块 S08 仅 33 帧 → 按分镜停留栏前挂到 1258。
 * 本镜唯一 glitch = 「650 亿」（闪烁白名单）；其余文字一律 SoftIn。
 * 运镜：1066 推近 1→1.2 向大数字（33 帧 easeInOut，推完保持到末拍外；运镜不进末拍）。
 * 数字依据：research §环境 2（太阳中微子通量约 650 亿个/秒/cm²，★ 二手标准值）。
 */
const F0 = 1029;
const TO = 1350; // = SC04 首句 S09.from−9（吃满段末停顿）
const EXIT_LEN = 6; // 末 6 帧归零（1344–1350，N=1350 为 0）

// 节拍（分镜表 SC03；容差 −6…+3）
const T_HAND = 1031; // 手掌 21 帧缩放入场（S07 b1「代价是」1037 前 6）
const T_STREAM = 1100; // 点流启动（S07 b2「不跟任何东西发生作用」段，1156 起加密）
const T_COUNT = 1156; // 大数字 GlitchIn + 20 帧计数 0→650（S08 b2「650 亿」）
const T_UNIT = 1158; // 单位行 SoftIn
const T_PULSE = 1168; // 数字落位脉冲（GlitchIn 结束帧）
const T_CARD = 1258; // 「你的一生 · 命中 0 次」卡 SoftIn（末块 1296 仅 33 帧 → 前挂一拍）
const T_ZERO = 1258; // 「0」12 帧倒计数 3→0（落 0 = 命中 0 次）
const T_ZP = 1270; // 「0」脉冲（落位后）

// 版面（分镜表坐标参考值；内容主区 y110–620）
const BIG = {cx: 470, cy: 306, size: 104}; // 数字「650」与「亿」整体中心 (470,306)
const NUM_CX = 431; // 「650」墨迹中心
const YI_CX = 590; // 「亿」墨迹中心
const UNIT = {cx: 470, cy: 374}; // 单位行（与数字行间距 30px → 成连通主体，frame_metrics 主体尺度 ~210px）
const HAND = {cx: 950, cy: 410, s: 0.9}; // 手掌配角（整体 ~175×185）
const CARD = {x: 330, y: 470, w: 320, h: 80};

// 点流：9 条 lane（间隔 16px ≥12px 规则），从手掌左侧 780 穿到右侧 1060
const LANES = [305, 321, 337, 353, 369, 385, 401, 417, 433];
const X0 = 780, X1 = 1060, SPD = 13, LIFE = 24;

const CAM = [
  {f: F0, x: 640, y: 360, s: 1},
  {f: 1066, x: 640, y: 360, s: 1}, // 推近前停住（先入场停 35 帧再动）
  {f: 1099, x: 575, y: 345, s: 1.2}, // 推近 1→1.2 向大数字，33 帧；之后保持（≤ 离场 1344−30）
];

const ORANGE_GLOW = '0 0 30px rgba(240,95,69,.7), 0 0 10px rgba(240,95,69,.55)';

export const SC03: React.FC = () => {
  const N = useCurrentFrame() + F0;
  // 离场淡出改 sqrt 起步：exitOp 的 ^1.5 曲线起步太慢（淡出第 2 个采样帧不透明度仍 0.93，亮度 24.3 ≥
  // 0.9·尾段中位 23.4，被判“未离场”），而该帧 diff 1.72 ≥ 1.5 把 hold 回溯直接压成 0。快下后亮度跌破判据线，
  // 回溯从淡出前起算 → hold ≈ 72f。落位帧区间（1344–1350、N=1350 归零）不变。
  const exN = N - (TO - EXIT_LEN);
  const exOp = exN <= 0 ? 1 : Math.max(0, 1 - Math.sqrt(clamp01(exN / EXIT_LEN)));
  const exDy = exitAccel(Math.max(0, N - (TO - EXIT_LEN)), 0.2);
  const glowK = fadeIn(N - T_COUNT, 10) * glowOffK(N, TO, 6, EXIT_LEN); // 带光元素先灭光再淡出

  // 手掌
  const hn = N - T_HAND;
  const hs = hn < 0 ? 0 : scaleIn(hn, 21);
  const hop = hn < 0 ? 0 : firstOp(hn, 8);
  const nailK = fadeIn(N - T_HAND, 14);

  // 点流（纯函数按 N 生成；1156 大数字落位后加密一倍）
  type Dot = {x: number; y: number; r: number; op: number};
  const dots: Dot[] = [];
  if (N >= T_STREAM) {
    for (let sp = T_STREAM; sp <= Math.min(N, TO); sp += 3) {
      const cnt = sp >= T_COUNT ? 2 : 1;
      for (let k = 0; k < cnt; k++) {
        const age = N - sp;
        if (age > LIFE) continue;
        const x = X0 + age * SPD;
        if (x > X1 + 6) continue;
        const lane = LANES[Math.floor(rnd(sp, k, 7) * LANES.length)];
        const r = 2.6 + rnd(sp, k, 11) * 1.4;
        const edge = x > X1 - 34 ? Math.max(0, 1 - (x - (X1 - 34)) / 40) : 1;
        dots.push({x, y: lane, r, op: Math.min(1, age / 2) * edge});
      }
    }
  }

  // 大数字
  const nc = N - T_COUNT;
  const val = nc < 0 ? '0' : countTo(nc, 0, 650, 20);
  const pulse = emphasisPulse(N - T_PULSE, {peak: 1.11});

  // 「命中 0 次」倒计数
  const nz = N - T_ZERO;
  const zero = nz < 0 ? '3' : countTo(nz, 3, 0, 12);
  const zPulse = emphasisPulse(N - T_ZP, {peak: 1.12});

  // 主角橙光斑（呼吸 30 帧 ±15%；幅度受控：离场前 6 帧灭光的逐帧变化须 <1.5，否则 hold 判定被打穿）
  const ogA = 0.28 * glowK * (1 + 0.15 * Math.sin((2 * Math.PI * N) / 30));

  return (
    <CameraRig N={N} keys={CAM} style={{opacity: exOp}}>
      <div style={{position: 'absolute', inset: 0, transform: exDy ? `translateY(${exDy.toFixed(1)}px)` : undefined}}>
        {/* 主角光：橙色径向光斑（离场前 6 帧先灭） */}
        {ogA > 0.005 ? (
          <div style={{position: 'absolute', left: BIG.cx - 128, top: BIG.cy - 128, width: 256, height: 256, borderRadius: '50%', background: `radial-gradient(circle, rgba(240,95,69,${ogA.toFixed(3)}) 0%, rgba(240,95,69,${(ogA * 0.55).toFixed(3)}) 34%, rgba(240,95,69,0) 70%)`}} />
        ) : null}

        <Svg bloom={false}>
          {/* 手掌（配角，无光；食指指甲紫高亮 = 中微子穿过处） */}
          {hop > 0 ? <HandPart cx={HAND.cx} cy={HAND.cy} s={Math.max(0.01, hs)} nailK={nailK} opacity={hop} /> : null}
          {/* 点流：穿手掌而过（白点 + 弱晕，无 filter 实例） */}
          {dots.map((d, i) => (
            <g key={i} opacity={d.op.toFixed(3)}>
              <circle cx={d.x.toFixed(1)} cy={d.y} r={d.r + 3.5} fill={WHITE} opacity={0.22} />
              <circle cx={d.x.toFixed(1)} cy={d.y} r={d.r.toFixed(1)} fill={WHITE} />
            </g>
          ))}
        </Svg>

        {/* 大字块：脉冲包「650」+「亿」；GlitchIn 本镜唯一闪烁（白名单） */}
        <div style={{position: 'absolute', inset: 0, transformOrigin: `${BIG.cx}px ${BIG.cy}px`, transform: pulse === 1 ? undefined : `scale(${pulse.toFixed(4)})`}}>
          <GlitchIn N={N} f0={T_COUNT}>
            <CText cx={NUM_CX} cy={BIG.cy} size={BIG.size} weight={700} family={FONT_ORB} color={WHITE} letterSpacing={2} dy={0} shadow={ORANGE_GLOW} style={{fontVariantNumeric: 'tabular-nums'}}>
              {val}
            </CText>
            <CText cx={YI_CX} cy={BIG.cy + 8} size={72} weight={900} scaleX={0.85} color={WHITE} shadow={ORANGE_GLOW}>
              亿
            </CText>
          </GlitchIn>
        </div>

        {/* 单位行（SoftIn；与数字行成连通主体） */}
        <SoftIn N={N} f0={T_UNIT} dy={6}>
          <CText cx={UNIT.cx} cy={UNIT.cy} size={26} weight={600} color={GREY} letterSpacing={6}>
            个 · 每秒 · 每平方厘米
          </CText>
        </SoftIn>

        {/* 「你的一生 · 命中 0 次」小卡（末块短 → 前挂 1258） */}
        <SoftIn N={N} f0={T_CARD} dy={8}>
          <Box x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={10} stroke={WHITE} sw={2} fill="#000" />
          <CText cx={445} cy={CARD.y + 42} size={24} weight={600} color={GREY}>
            你的一生 · 命中
          </CText>
          <div style={{position: 'absolute', inset: 0, transformOrigin: `585px ${CARD.y + 38}px`, transform: zPulse === 1 ? undefined : `scale(${zPulse.toFixed(4)})`}}>
            <CText cx={585} cy={CARD.y + 38} size={64} weight={700} family={FONT_ORB} color={ORANGE} letterSpacing={-1} dy={-2} shadow="0 0 16px rgba(240,95,69,.55)" style={{fontVariantNumeric: 'tabular-nums'}}>
              {zero}
            </CText>
          </div>
          <CText cx={622} cy={CARD.y + 42} size={24} weight={600} color={GREY}>
            次
          </CText>
        </SoftIn>
      </div>
    </CameraRig>
  );
};
