import type {ShotDef, BgSpec, FootageSpec} from '../../common';
import {SC01} from './SC01';
import {SC02} from './SC02';
// 组 G1：镜头表 / 背景覆写 / 实拍层。数组顺序即层序（后者在上）。帧区间见 分镜表.md 与 script/timeline.md。
// 镜头组件：const N = useCurrentFrame() + F0（F0 = 本镜头 from）；图元 import from '../../ui'，缓动/共用层 from '../../common'。
export const SHOTS_G1: ShotDef[] = [
  {id: 'SC01', from: 33, to: 666, Comp: SC01}, // 盲区：两种信使都指不了路（S01–S04；to = SC02 首句 from−9）
  {id: 'SC02', from: 667, to: 1028, Comp: SC02}, // 中微子登场·高光登场型（扫光白名单 #1，S05–S06；to = SC03 首句 from−9）
];
export const BG_G1: BgSpec[] = []; // 点阵波幕底（config.bg='dots'），无覆写
export const FOOTAGE_G1: FootageSpec[] = [];
