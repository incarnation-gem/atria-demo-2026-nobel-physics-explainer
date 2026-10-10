#!/bin/zsh
# 从模板创建新项目：new_project.sh <目标目录> <slug> [风格包]
# 风格包 = 技能根下 styles/<name>/（QC 判据参数 style.json 必须有；默认 blackpurple 黑紫风）。
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
DEST=$1; SLUG=${2:-video}; STYLE=${3:-blackpurple}
[ -n "$DEST" ] || { echo "usage: new_project.sh <dest_dir> <slug> [style]"; exit 1; }
# 本脚本必须留在 template/scripts/ 里：$HERE 是下面 rsync 的源，脚本被单独拷到别处时
# $HERE 会指向无关目录（最坏是 /），rsync 就会去复制那整棵目录树
[ -f "$HERE/src/config.ts" ] && [ -d "$HERE/src/common" ] || { echo "找不到模板（$HERE 不像 template/），请从 template/scripts/ 里运行本脚本"; exit 1; }
# slug 会进文件名、sed 表达式与渲染命令行，只允许安全字符
case "$SLUG" in
  ''|*[!A-Za-z0-9_-]*) echo "slug 只能用字母/数字/-/_，收到：$SLUG"; exit 1;;
esac
mkdir -p "$DEST"
rsync -a --exclude node_modules --exclude 'build*' --exclude renders --exclude fin_frames --exclude stills --exclude 'audio/cache' "$HERE/" "$DEST/"
# portable in-place edit: `-i.bak` + rm works on both BSD/macOS and GNU/Linux sed
# (BSD `sed -i ''` breaks on GNU sed, which reads '' as the script and config.ts as a file)
sed -i.bak "s/slug: 'demo'/slug: '$SLUG'/" "$DEST/src/config.ts" && rm -f "$DEST/src/config.ts.bak"
mkdir -p "$DEST/public/assets/$SLUG" "$DEST/script" "$DEST/research" "$DEST/qc" "$DEST/stills" "$DEST/renders"
# 风格包：style.json（QC 判据参数 + 规范文档指针）进项目根，frame_metrics 等脚本读它
SKILL_ROOT=$(cd "$HERE/.." && pwd)
STYLE_DIR="$SKILL_ROOT/styles/$STYLE"
if [ ! -f "$STYLE_DIR/style.json" ]; then
  echo "✗ 未知风格包：$STYLE（可用：$(ls "$SKILL_ROOT/styles" | tr '\n' ' ')）"; exit 1
fi
cp "$STYLE_DIR/style.json" "$DEST/style.json"
echo "风格包：$STYLE"
cd "$DEST"
# node_modules 默认软链到模板的那一份（模板与项目的 package.json / lock 完全一致）：
# 每片省 ≈700MB 与 1–2 分钟 npm install。实测 webpack 打包与 tsc 均正常。
# ⚠ 项目里不要跑 `npm install / npm ci`：会写进软链目标（模板的共享安装），
#    要隔离改依赖用 NEW_PROJECT_INSTALL=1 建真实安装。
if [ "${NEW_PROJECT_INSTALL:-0}" = 1 ] || [ ! -d "$HERE/node_modules/remotion" ]; then
  [ -L node_modules ] && rm -f node_modules
  echo "⚠ npm install（未软链模板 node_modules 或 NEW_PROJECT_INSTALL=1）"
  npm install --silent
else
  ln -sfn "$HERE/node_modules" node_modules
fi
npx tsc --noEmit && echo "project ready: $DEST (slug=$SLUG)"
