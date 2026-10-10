import type {ShotDef, BgSpec, FootageSpec} from '../../common';
import {SC09} from './SC09';
import {SC10} from './SC10';
// 组 G5：镜头表 / 背景覆写 / 实拍层。数组顺序即层序（后者在上）。帧区间见 分镜表.md 与 script/timeline.md。
// 镜头组件：const N = useCurrentFrame() + F0（F0 = 本镜头 from）；图元 import from '../../ui'，缓动/共用层 from '../../common'。
export const SHOTS_G5: ShotDef[] = [
  {id: 'SC09', from: 3879, to: 4363, Comp: SC09}, // NGC 1068：光出不来，中微子出得来（S25–S27；to = S28.from−9）
  {id: 'SC10', from: 4364, to: 4635, Comp: SC10}, // 候选源：还没人跨过线（S28–S29；to = S30.from−9）
];
export const BG_G5: BgSpec[] = []; // 点阵波幕底（config.bg='dots'），无覆写
export const FOOTAGE_G5: FootageSpec[] = [];
