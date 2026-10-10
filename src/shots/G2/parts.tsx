import React from 'react';
import {PURPLE, GREY, WHITE} from '../../ui';

/**
 * G2 组内图元（主题特有，不放 ui.tsx）：
 *   HandPart    简笔手掌（SC03「650 亿个中微子穿过你的指甲盖」）
 *   GlassShard  玻璃碎片（SC04「光学透明 ≠ 弱相互作用」对照组）
 * 都是 <Svg> 内使用的 <g>，动画量（opacity 等）由调用方按 N 算好传入。
 */

/** 四指：x 中心 / 指尖顶 / 是否高亮（食指 = 中微子穿过处） */
const FINGERS: Array<{c: number; top: number; hl?: boolean}> = [
  {c: -51, top: -112},
  {c: -17, top: -126},
  {c: 17, top: -126},
  {c: 51, top: -112, hl: true},
];

/**
 * 简笔手掌：圆角掌心 + 四指（中指略长）+ 左下斜出的拇指 + 指甲；食指指甲紫色高亮。
 * (cx,cy) 为掌心中心；原始外框约 194×206（SC03 用 s=0.9 → 约 175×185，配角尺寸）。
 * nailK 0→1 控制高亮指甲的光环强度。
 */
export const HandPart: React.FC<{cx: number; cy: number; s?: number; nailK?: number; sw?: number; opacity?: number}> = ({cx, cy, s = 1, nailK = 1, sw = 3, opacity = 1}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s.toFixed(4)})`} opacity={opacity}>
    {/* 拇指（先画，被掌心压住一角） */}
    <g transform={`translate(${-92} ${16}) rotate(32)`}>
      <rect x={-15} y={-39} width={30} height={78} rx={15} fill="#05070d" stroke={WHITE} strokeWidth={sw * 0.9} />
    </g>
    {/* 掌心 */}
    <rect x={-72} y={-48} width={144} height={120} rx={24} fill="#05070d" stroke={WHITE} strokeWidth={sw} />
    {FINGERS.map((f) => (
      <g key={f.c}>
        <rect x={f.c - 15} y={f.top} width={30} height={f.top === -126 ? 86 : 74} rx={15} fill="#05070d" stroke={WHITE} strokeWidth={sw} />
        {/* 指甲宽及指缘：甲缘与指侧描边重合 → 整只手在亮纹掩膜里是一个连通分量（避免粘连误报） */}
        <rect x={f.c - 15} y={f.top + 8} width={30} height={24} rx={8} fill={f.hl ? 'rgba(102,45,248,0.35)' : '#000'} stroke={f.hl ? PURPLE : GREY} strokeWidth={f.hl ? 3 : 2} />
        {f.hl && nailK > 0.02 ? (
          <circle cx={f.c} cy={f.top + 20} r={20} fill="none" stroke={PURPLE} strokeWidth={2} opacity={(0.45 * nailK).toFixed(3)} style={{filter: `drop-shadow(0 0 ${(8 * nailK).toFixed(1)}px rgba(102,45,248,${(0.9 * nailK).toFixed(2)}))`}} />
        ) : null}
      </g>
    ))}
  </g>
);

/** 玻璃碎片：斜切四边形（黑底白边）+ 两条反光线。外框约 62×56。 */
export const GlassShard: React.FC<{cx: number; cy: number; s?: number; opacity?: number}> = ({cx, cy, s = 1, opacity = 1}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s.toFixed(4)})`} opacity={opacity}>
    <path d="M-28,-34 L16,-42 L34,2 L-12,14 Z" fill="#060a10" stroke={WHITE} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M-16,-22 L2,6" fill="none" stroke={WHITE} strokeWidth={2} opacity={0.85} strokeLinecap="round" />
    <path d="M-4,-28 L12,0" fill="none" stroke={WHITE} strokeWidth={2} opacity={0.6} strokeLinecap="round" />
  </g>
);
