import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, kf, easeInOutPow, FONT_ORB, FONT_HEAVY, powOutRemain, GlitchIn, emphasisPulse} from '../../common';
import {
  Svg, GalaxyIcon, NeutrinoDot, LineArrow, Box, CText,
  WHITE, GREY, PURPLE, RED_DEEP, mixHex,
  fadeIn, scaleIn, slideUp, SoftIn, exitOp, glowOffK,
} from '../../ui';
import {CameraRig, GlowBlob} from '../../fx';

/**
 * SC10 候选源：还没人跨过线 · N 4364–4635（S28–S29，分镜 v3）
 * 主角 = 门槛上方的「?」Orbitron 180px（白 + 紫硬投影）+ 其下「未转正」印章（红底白边）——
 * 两者间距 ≤12px，frame_metrics 按连通物体并成 ~217px 的主体块，紫色 GlowBlob 常亮。
 * 中央虚线门槛（y386，x300–980，draw-on 16 帧 4372）+「5σ 发现线」灰小字；
 * 门槛下三枚候选徽章（圆卡 r45 虚线灰边 + 小星系 + 「候选」）2 帧错峰 slideUp；
 * 徽章头顶各一枚白色小箭头弹起又落下（14 帧 ×2 循环到 4590）——试图跨线、始终差几像素；
 * 4514 中间徽章边框由虚变实、灰→紫（GLOW_PURPLE_S 唯一当前重点）；
 * 4579「未转正」印章 GlitchIn（本镜唯一闪烁，白名单）+ 缩放入场（前挂 S29 c2，落位 4591）；
 * 4590 中间徽章箭头最后一次弹跳失败落回（离线 5px）；持续：门槛上光点循环跑到末拍。
 * 运镜：1.0→1.05 慢推贯穿（例外允许进末拍）；停留：印章落位 4591 → 灭光 4623，≈32f。
 */
export const F0 = 4364;
export const TO = 4635; // = SC11 首句 S30.from − 9
const EXIT_LEN = 6; // 末 6 帧归零（N=TO 为 0）

// 节拍（分镜表 SC10；容差 −6…+3）
const T_LINE = 4372; // 门槛虚线 draw-on 16 帧（S28 b1「听起来，」）
const T_QMARK = 4372; // 大「?」缩放入场 16 帧（主角 b1 入场，避免线段空场；4399 b2 脉冲）
const T_QPULSE = 4399; // 「?」轻微脉冲（S28 b2「…找到源头了？」关键词节拍）
const T_LINE_LABEL = 4384; // 「5σ 发现线」SoftIn
const T_PATROL = 4388; // 门槛光点循环跑（线画完即开跑，90 帧一周期）
const T_BADGE = 4490; // 三枚徽章 slideUp（2 帧错峰；S28 b4「只是"候选"」−3）
const T_COLOR = 4514; // 中间徽章边框虚→实、灰→紫 11 帧（分镜 4493；徽章落位后起）
const T_BOUNCE = 4518; // 箭头弹跳循环（14 帧弹起 + 14 帧落下 ×2）
const T_PULSE = 4544; // 大「?」第二次轻微脉冲（S29 b1「发现的门槛」）
const T_TAG = 4579; // 「未转正」印章 GlitchIn + 缩放入场（前挂 S29 c2；落位 4591）
const T_FINAL = 4590; // 中间徽章箭头最后弹跳失败落回（S29 b3「还没人跨过去」）

// 版面（世界坐标；相机 1.0→1.05 居中贯穿，x 89–1191 / y 122–607 均合规）
// 注：Orbitron「?」的钩与点是分离图元（约 14px 间隙），竖直堆叠无法连成 ≥170px 主体——
// 改为「? + 印章」左右并置且边缘轻叠（~10px），连成 ~431px 宽的主体块（size ≈ 188px），点保留在钩下自然位置。
const LINE = {x0: 300, x1: 980, y: 386}; // 门槛虚线
const LINE_LABEL = {cx: 960, cy: 352}; // 「5σ 发现线」（线上右段）
const QMARK = {cx: 505, cy: 225, size: 230}; // 大「?」墨迹屏 x ≈ 424–581 / y ≈ 128–266（钩），点 453–486 / 292–331
const STAMP = {x: 575, y: 195, w: 250, h: 58}; // 「未转正」印章（? 右侧轻叠，屏 x 572–834 / y 197–258）
const BADGES = [420, 640, 860]; // 三枚候选徽章 cx（cy 516，r 45）
const BADGE_CY = 516;
const BADGE_R = 45;
const ARROW = {rootY: 461, apexY: 410, amp: 16}; // 徽章头顶箭头：静态顶点 410；弹跳幅度 16
const LABEL_CY = 580; // 「候选」灰字

export const SC10: React.FC = () => {
  const N = useCurrentFrame() + F0;
  const exOp = exitOp(N, TO, EXIT_LEN);

  const lineW = clamp01((N - T_LINE) / 16);
  const qN = N - T_QMARK;
  const qs = scaleIn(qN, 16);
  const qOp = qN < 0 ? 0 : clamp01(0.15 + 1.4 * qs);
  // 两次轻微脉冲：4399（问句关键词节拍）+ 4544（「发现的门槛」），peak 1.06
  const qPulse = 1 + (emphasisPulse(N - T_QPULSE, {peak: 1.06}) - 1) + (emphasisPulse(N - T_PULSE, {peak: 1.06}) - 1);
  // 印章：GlitchIn + 1.28→1 缩放入场（落位 4591）；红柔光 8 帧亮起、离场前 6 帧灭
  const tagN = N - T_TAG;
  const tagS = tagN < 0 ? 0 : 1 + 0.28 * powOutRemain(tagN, 12, 2.2);
  const tagK = fadeIn(tagN, 8) * glowOffK(N, TO, 6, EXIT_LEN);

  // 门槛光点：90 帧一周期沿虚线左→右跑，末段淡出避免回跳
  const pf = N >= T_PATROL ? ((N - T_PATROL) % 90) / 90 : -1;
  const patrolX = LINE.x0 + (LINE.x1 - LINE.x0) * pf;
  const patrolOp = pf < 0 ? 0 : fadeIn(N - T_PATROL, 6) * (pf > 0.88 ? 1 - (pf - 0.88) / 0.12 : 1);

  return (
    <CameraRig
      N={N}
      keys={[
        {f: F0, x: 640, y: 360, s: 1},
        {f: TO, x: 640, y: 360, s: 1.05}, // 1.0→1.05 慢推贯穿（例外允许进末拍）
      ]}
      style={{opacity: exOp}}
    >
      {/* 主角紫柔光（?+印章一体，呼吸 30 帧；离场前 6 帧先灭） */}
      <GlowBlob cx={640} cy={225} r={160} N={N} k={fadeIn(qN, 12) * glowOffK(N, TO, 6, EXIT_LEN)} alpha={0.34} />

      <Svg bloom={false}>
        <defs>
          <clipPath id="g5sc10-line">
            <rect x={LINE.x0 - 4} y={LINE.y - 7} width={((LINE.x1 - LINE.x0 + 8) * lineW).toFixed(1)} height={14} />
          </clipPath>
        </defs>
        {/* 门槛虚线（draw-on 16 帧） */}
        <line x1={LINE.x0} y1={LINE.y} x2={LINE.x1} y2={LINE.y} stroke={WHITE} strokeWidth={2.5} strokeDasharray="10 8" clipPath="url(#g5sc10-line)" />
        {/* 门槛光点（跨线的尝试，循环跑到末拍） */}
        {patrolOp > 0 ? <NeutrinoDot x={patrolX} y={LINE.y} dir={0} tail={40} dotR={6} opacity={patrolOp} /> : null}

        {/* 三枚候选徽章 + 头顶箭头 */}
        {BADGES.map((bx, i) => {
          const bn = N - (T_BADGE + 2 * i);
          if (bn < 0) return null;
          const dy = slideUp(bn, 80, 22);
          const op = fadeIn(bn, 8);
          // 中间徽章：边框虚→实、灰→紫 11 帧（唯一当前重点光）
          const colK = i === 1 ? clamp01((N - T_COLOR) / 11) : 0;
          const stroke = colK > 0 ? mixHex(GREY, PURPLE, colK) : GREY;
          // 箭头弹跳：|sin| 循环（14 帧弹起 + 14 帧落下 ×2，56 帧一周期）；中间徽章 4590 起改走「最后失败」kf
          const cyc = Math.abs(Math.sin(Math.PI * (N - T_BOUNCE - 9 * i) / 28));
          const fin = kf(N, [[T_FINAL, 0], [T_FINAL + 6, 19], [T_FINAL + 9, 15], [T_FINAL + 19, 0]], easeInOutPow(2));
          const h = i !== 1 || N < T_FINAL ? ARROW.amp * cyc : fin;
          return (
            <g key={bx} transform={`translate(0 ${dy.toFixed(2)})`} opacity={op}>
              {/* 圆卡（虚线灰边；中间那枚 4514 起变实变紫，唯一当前重点光） */}
              <circle cx={bx} cy={BADGE_CY} r={BADGE_R} fill="#060812" stroke={GREY} strokeWidth={2.5} strokeDasharray="6 6" />
              {colK > 0 ? (
                <circle
                  cx={bx}
                  cy={BADGE_CY}
                  r={BADGE_R}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2.5}
                  opacity={colK.toFixed(3)}
                  style={{filter: `drop-shadow(0 0 ${8 * colK}px rgba(102,45,248,${(0.8 * colK).toFixed(2)}))`}}
                />
              ) : null}
              {/* 小星系简笔（候选源意象，配角不发光） */}
              <GalaxyIcon cx={bx} cy={BADGE_CY} r={21} sw={1.5} coreGlow={false} />
              {/* 头顶箭头：弹起又落下，顶点始终差几像素够不到门槛线 */}
              <g transform={`translate(0 ${(-h).toFixed(2)})`}>
                <LineArrow x0={bx} y0={ARROW.rootY} x1={bx} y1={ARROW.apexY} p={1} rodW={2.5} headL={16} headW={16} color={WHITE} />
              </g>
            </g>
          );
        })}
      </Svg>

      {/* 大「?」Orbitron 180px 白 + 紫硬投影（缩放入场 + 4544 轻微脉冲） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: qOp,
          transformOrigin: `${QMARK.cx}px ${QMARK.cy}px`,
          transform: qs < 1 || qPulse !== 1 ? `scale(${(qs * qPulse).toFixed(4)})` : undefined,
        }}
      >
        <CText
          cx={QMARK.cx}
          cy={QMARK.cy}
          size={QMARK.size}
          weight={700}
          family={FONT_ORB}
          color={WHITE}
          letterSpacing={-2}
          dy={-2}
          shadow={`6px 6px 0 ${PURPLE}, 0 0 28px rgba(102,45,248,.45)`}
          style={{WebkitTextStroke: '8px #fff', paintOrder: 'stroke fill'}}
        >
          ?
        </CText>
      </div>

      {/* 「未转正」印章（红底白边 + 红柔光；GlitchIn 本镜唯一闪烁 + 缩放入场） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${STAMP.x + STAMP.w / 2}px ${STAMP.y + STAMP.h / 2}px`,
          transform: tagS !== 1 && tagS > 0 ? `scale(${tagS.toFixed(4)})` : undefined,
        }}
      >
        <GlitchIn N={N} f0={T_TAG} seed={23}>
          <Box x={STAMP.x} y={STAMP.y} w={STAMP.w} h={STAMP.h} r={8} fill={RED_DEEP} stroke={WHITE} sw={2.5} glow={`0 0 28px 10px rgba(236,8,31,${(0.42 * tagK).toFixed(3)})`} />
          <CText cx={STAMP.x + STAMP.w / 2} cy={STAMP.y + STAMP.h / 2} size={44} weight={900} scaleX={0.8} color={WHITE} letterSpacing={-1} dy={-2} family={FONT_HEAVY}>
            未转正
          </CText>
        </GlitchIn>
      </div>

      {/* 「5σ 发现线」灰小字（SoftIn） */}
      <SoftIn N={N} f0={T_LINE_LABEL}>
        <CText cx={LINE_LABEL.cx} cy={LINE_LABEL.cy} size={24} weight={600} color={GREY} dy={-1} letterSpacing={1}>
          5σ 发现线
        </CText>
      </SoftIn>

      {/* 「候选」灰字（随各徽章同 dy/opacity 入场） */}
      {BADGES.map((bx, i) => {
        const bn = N - (T_BADGE + 2 * i);
        if (bn < 0) return null;
        return (
          <div key={bx} style={{position: 'absolute', inset: 0, transform: `translateY(${slideUp(bn, 80, 22).toFixed(2)}px)`, opacity: fadeIn(bn, 8)}}>
            <CText cx={bx} cy={LABEL_CY} size={24} weight={700} color={GREY} dy={-1} letterSpacing={2}>
              候选
            </CText>
          </div>
        );
      })}
    </CameraRig>
  );
};
