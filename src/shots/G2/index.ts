import type {ShotDef, BgSpec, FootageSpec} from '../../common';
import {SC03} from './SC03';
import {SC04} from './SC04';
// 组 G2：镜头表 / 背景覆写 / 实拍层。数组顺序即层序（后者在上）。帧区间见 分镜表.md 与 script/timeline.md。
// 镜头组件：const N = useCurrentFrame() + F0（F0 = 本镜头 from）；图元 import from '../../ui'，缓动/共用层 from '../../common'。
export const SHOTS_G2: ShotDef[] = [
  {id: 'SC03', from: 1029, to: 1350, Comp: SC03}, // 650 亿（高光·大数字型，S07–S08；to = SC04 首句 S09.from−9）
  {id: 'SC04', from: 1351, to: 1692, Comp: SC04}, // 地球如保鲜膜（S09–S11；to = SC05 首句 S12.from−9）
];
export const BG_G2: BgSpec[] = []; // 点阵波幕底（config.bg='dots'），无覆写
export const FOOTAGE_G2: FootageSpec[] = [];
