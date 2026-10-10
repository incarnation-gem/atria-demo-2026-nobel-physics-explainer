import type {ShotDef, BgSpec, FootageSpec} from '../../common';
import {SC11} from './SC11';
import {SC12} from './SC12';
// 组 G6：镜头表 / 背景覆写 / 实拍层。数组顺序即层序（后者在上）。帧区间见 分镜表.md 与 script/timeline.md。
// 镜头组件：const N = useCurrentFrame() + F0（F0 = 本镜头 from）；图元 import from '../../ui'，缓动/共用层 from '../../common'。
export const SHOTS_G6: ShotDef[] = [
  {id: 'SC11', from: 4636, to: 5412, Comp: SC11}, // 诺奖与一个人背后的 450 人（S30–S33；to = SC12 首段首句 from−9）
  {id: 'SC12', from: 5413, to: 5675, Comp: SC12}, // 收尾回扣·高光象征物型（S34–S35；to 延长到压黑锚点 5675：大字 5626 落位后停 ≥45 帧，内容保持、由片尾压黑接管淡出）
];
export const BG_G6: BgSpec[] = []; // 点阵波幕底（config.bg='dots'），无覆写
export const FOOTAGE_G6: FootageSpec[] = [];
