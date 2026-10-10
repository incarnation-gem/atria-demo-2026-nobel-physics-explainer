import type {ShotDef, BgSpec, FootageSpec} from '../../common';
import {SC05} from './SC05';
import {SC06} from './SC06';
// 组 G3：镜头表 / 背景覆写 / 实拍层。数组顺序即层序（后者在上）。帧区间见 分镜表.md 与 script/timeline.md。
// 镜头组件：const N = useCurrentFrame() + F0（F0 = 本镜头 from）；图元 import from '../../ui'，缓动/共用层 from '../../common'。
export const SHOTS_G3: ShotDef[] = [
  {id: 'SC05', from: 1693, to: 2480, Comp: SC05}, // 冰立方剖面（S12–S16；to = SC06 首句 S17.from−9）
  {id: 'SC06', from: 2481, to: 3145, Comp: SC06}, // 切伦科夫光鞭（S17–S20；to = SC07 首句 S21.from−9）
];
export const BG_G3: BgSpec[] = []; // 点阵波幕底（config.bg='dots'），无覆写
export const FOOTAGE_G3: FootageSpec[] = [];
