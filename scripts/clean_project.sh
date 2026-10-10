#!/bin/zsh
# 验收后清理：clean_project.sh [accept|deep]   默认 accept
#   accept  删掉可再生的中间产物（bundle / stills / fin_frames / 旧版本成片 / TTS 缓存），
#           并把 node_modules 换成指向模板的软链（≈700MB → 0）。src / 分镜 / 解说词 /
#           调研 / qc 报告 / 交付说明 / 最高版本成片全部保留，随时能重新渲染。
#   deep    在 accept 基础上再删 qc contact sheet 与 chapters 分段，只留必要交付物。
# DRY=1 只打印不删；KEEP_NODE_MODULES=1 保留真实 node_modules。
# 恢复手段（清掉的都能重建）：
#   fin_frames : ffmpeg -i renders/<slug>_vN.mp4 -q:v 4 fin_frames/f_%04d.jpg
#   stills     : scripts/still.sh <Gn> <帧> stills/<Gn> g<n>
#   audio/cache: python3 scripts/tts_build.py（缓存会重新生成）
#   node_modules: 真实安装用 `npm install`（软链项目请直接用模板的那份）
set -e
setopt nullglob          # 通配符无匹配时当空（否则 zsh 会报 "no matches found" 中断）
ROOT=$(cd "$(dirname "$0")/.." && pwd); cd "$ROOT"
MODE=${1:-accept}
[ "$MODE" = accept -o "$MODE" = deep ] || { echo "usage: clean_project.sh [accept|deep]"; exit 1; }

SLUG=$(python3 -c "import re;print(re.search(r\"slug:\\s*'([^']+)'\", open('src/config.ts').read()).group(1))")

# 找最高版本的成片（v2 优先于 v1；唯一一个 mp4 也算）
FINAL=""
for V in v9 v8 v7 v6 v5 v4 v3 v2 v1; do
  [ -f "renders/${SLUG}_${V}.mp4" ] && { FINAL="renders/${SLUG}_${V}.mp4"; break; }
done
if [ -z "$FINAL" ]; then
  MP4S=($(ls renders/*.mp4 2>/dev/null))
  [ ${#MP4S} -ge 1 ] && FINAL="${MP4S[-1]}"
fi
[ -n "$FINAL" ] || { echo "⚠ renders/ 下没有成片 mp4，验收完成前不要清理。退出。"; exit 1; }
echo "保留成片：$FINAL"

du_sh() { du -sh "$1" 2>/dev/null | cut -f1; }
TOTAL_BEFORE=$(du -sk . 2>/dev/null | cut -f1)

drop() {  # drop <路径> <说明>
  if [ -e "$1" ] || [ -L "$1" ]; then
    SZ=$(du_sh "$1")
    [ "${DRY:-0}" = 1 ] && echo "  [dry] 删 $1 ($SZ) — $2" && return
    echo "  删 $1 ($SZ) — $2"
    rm -rf "$1"
  fi
}

echo "== 清理可再生产物 =="
for B in build_dev_* build_full build_prev; do
  [ -d "$B" ] && drop "$B" "webpack bundle，改码后 still.sh 自动重建"
done
drop stills "构建期 still 自检图，scripts/still.sh 可重出"
drop fin_frames "成片 JPEG 序列，ffmpeg 一条命令可重建"
drop audio/cache "TTS 逐句缓存，tts_build.py 会重新合成"
drop fin_count.txt "渲染计数"

# 旧版本成片：accept 保留（源码已被覆盖，旧版 mp4 是修复前画面的唯一存档），
# deep 模式才删，只留最高版本
if [ "$MODE" = deep ]; then
  for F in renders/${SLUG}_v*.mp4; do
    [ -f "$F" ] && [ "$F" != "$FINAL" ] && drop "$F" "旧版本成片"
  done
  drop renders/chapters "分段 mp4"
  drop qc/sheets "QC contact sheet（qc/*.md 报告保留）"
fi

echo "== node_modules → 软链 =="
if [ "${KEEP_NODE_MODULES:-0}" != 1 ]; then
  # 本脚本被 rsync 进项目后无法从自身路径反推 skill 位置，按候选找模板：
  TMPL="${A2E_TEMPLATE:-}"
  if [ -z "$TMPL" ] || [ ! -d "$TMPL/node_modules/remotion" ]; then
    for C in "$HOME/.zcode/skills/anything2explainer/template" \
             "$HOME/.agents/skills/anything2explainer/template"; do
      [ -d "$C/node_modules/remotion" ] && TMPL="$C" && break
    done
  fi
  if [ -n "$TMPL" ] && [ ! -L node_modules ]; then
    SZ=$(du_sh node_modules)
    [ "${DRY:-0}" = 1 ] && echo "  [dry] node_modules ($SZ) → 软链 $TMPL/node_modules" || {
      mv node_modules node_modules_trash && ln -sfn "$TMPL/node_modules" node_modules
      rm -rf node_modules_trash
      echo "  node_modules ($SZ) → 软链（版本与模板一致，实测 tsc/webpack 正常）"
    }
  elif [ -L node_modules ]; then
    echo "  node_modules 已是软链，跳过"
  else
    echo "  ⚠ 找不到模板 node_modules（设 A2E_TEMPLATE=<skill>/template 指定），保留本地安装"
  fi
fi

TOTAL_AFTER=$(du -sk . 2>/dev/null | cut -f1)
DRYN="${DRY:-0}"
echo "== 完成：$(python3 -c "
b,a=$TOTAL_BEFORE,$TOTAL_AFTER
print(f'{b/1048576:.2f}GB → {a/1048576:.2f}GB，释放 {(b-a)/1048576:.2f}GB' + ('（dry-run，未真删）' if $DRYN else ''))") =="
echo "保留：src/ script/ research/ qc/*.md 交付说明.md $FINAL"
