/**
 * 片子级配置（唯一需要按主题改的文件之一；另一个是 script/narration.txt）。
 * 句 id（S01…）来自 scripts/tts_build.py 生成的 timeline.ts；章节数与标题来自 narration.txt 的 `# CHAPTER n 标题` 行。
 */
export type HudEntry = {fromS: string; toS: string; text: string; tech?: string; fromOffset?: number; toOffset?: number; w?: number};
export type RailSpec = {steps: string[]; switchS: string[]; fromS: string; toS: string};
export const VIDEO = {
  slug: 'icecube-neutrino', // 素材目录 public/assets/<slug>/（配音 audio.wav 由 tts_build 写到这里）
  lang: 'zh' as 'zh' | 'en',
  bg: 'dots' as 'stars' | 'dots',
  title: {big: 'ICECUBE', rest: '冰立方', en: 'IceCube Neutrino Observatory', tagline: '每秒 650 亿个穿过你，你却一个都逮不着'},
  credit: {kicker: '2026 NOBEL PRIZE IN PHYSICS', title: 'IceCube Neutrino Observatory', byline: 'Francis Halzen · UW–Madison · Nobel Foundation 2026', note: 'facts: nobelprize.org · PRL · Science; all visuals drawn in code'},
  builtBy: 'built by Anything2Explainer skill',
  // 单章片：无章节卡（章节卡从第 2 章起才出），chapterTech 仅留索引占位
  chapterTech: ['IceCube & High-energy Neutrinos'],
  hud: [
    {fromS: 'S01', toS: 'S04', text: '看不见的宇宙'},
    {fromS: 'S05', toS: 'S11', text: '中微子', tech: 'Neutrino'},
    {fromS: 'S12', toS: 'S22', text: '冰立方', tech: 'IceCube'},
    {fromS: 'S23', toS: 'S27', text: '三封信', tech: 'First Signals'},
    {fromS: 'S28', toS: 'S29', text: '候选源'},
    {fromS: 'S30', toS: 'S35', text: '2026 诺奖', tech: 'Nobel 2026'},
  ] as HudEntry[],
  // 本片机制是因果链而非有序步骤，不用流程轨
  rails: [] as RailSpec[],
  endingFade: 30,
  // 压黑起点锚点（默认 = LAST_TO − endingFade）。本片收尾大字「被看见了」GlitchIn 5615–5626 落位，
  // 分镜 SC12 停留栏要求「落位停 ≥45 帧」→ 压黑 5675 起；署名卡在压黑完成（5675+30=5705）后出。
  // SC12 镜头区间同步延长到 5675（内容保持、由片尾压黑接管淡出）。
  endingFadeFrom: 5675,
};
