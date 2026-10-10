import type {ShotDef, BgSpec, FootageSpec} from '../../common';
import {SC07} from './SC07';
import {SC08} from './SC08';
// 组 G4：镜头表 / 背景覆写 / 实拍层。数组顺序即层序（后者在上）。帧区间见 分镜表.md 与 script/timeline.md。
// 镜头组件：const N = useCurrentFrame() + F0（F0 = 本镜头 from）；图元 import from '../../ui'，缓动/共用层 from '../../common'。
export const SHOTS_G4: ShotDef[] = [
  {id: 'SC07', from: 3146, to: 3523, Comp: SC07}, // 十万挑一百（S21–S22；to = SC08 首句 from−9）
  {id: 'SC08', from: 3524, to: 3878, Comp: SC08}, // 第一封与第二封信（S23–S24；to = SC09 首句 from−9）
];
export const BG_G4: BgSpec[] = []; // 点阵波幕底（config.bg='dots'），无覆写
export const FOOTAGE_G4: FootageSpec[] = [];
