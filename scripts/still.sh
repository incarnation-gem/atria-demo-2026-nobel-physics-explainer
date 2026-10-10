#!/bin/zsh
# 出 still：still.sh <Comp: Video|Overlay|G1..G8> <帧号列表 1 起,逗号分隔> <输出目录(绝对路径)> [tag]
# ⚠ 每个构建组只用一个 tag（如 g3），不要每次换新 tag（每个 bundle ≈40MB）。
# 源码变了会自动重建 bundle（内容指纹比对）；SRCHASH=0 可关掉（强制复用旧 bundle，仅排错用）。
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); cd "$ROOT"
COMP=$1; FRAMES=$2; OUT=$3; TAG=${4:-$COMP}
[ -n "$COMP" ] && [ -n "$FRAMES" ] && [ -n "$OUT" ] || { echo "usage: still.sh <Comp> <frames> <out_dir_abs> [tag]"; exit 1; }
B=build_dev_$TAG

# 源码指纹：src/ + public/ + 两个配置文件，逐文件 sha1 后再汇总成一个哈希。
# 用内容而不是 mtime：git checkout / touch 不会误触发重建，真改了代码一定重建。
src_hash() {
  { find src public -type f -exec shasum -a 1 {} + 2>/dev/null; shasum -a 1 remotion.config.ts tsconfig.json 2>/dev/null; } \
    | sed "s|  $ROOT/|  |" | sort | shasum -a 1 | cut -d' ' -f1
}

if [ -d "$B" ]; then
  if [ "${SRCHASH:-1}" = 0 ]; then
    echo "⚠ SRCHASH=0：复用旧 bundle（$B），源码改动不会生效"
  else
    OLD=$(cat "$B/.srchash" 2>/dev/null || echo none)
    NEW=$(src_hash)
    if [ "$OLD" != "$NEW" ]; then
      echo "↻ 源码已变（$OLD → $NEW），重建 $B"
      rm -rf "$B"
    fi
  fi
fi
[ -d "$B" ] || { npx remotion bundle src/index.ts --out-dir "$B" --log=error && src_hash > "$B/.srchash"; }
mkdir -p "$OUT"
for N in ${(s:,:)FRAMES}; do
  npx remotion still "$B" "$COMP" "$OUT/f_$(printf %04d $N).png" --frame=$((N-1)) --log=error
done
# 清理 4 小时以上没动过的 remotion 临时 bundle（只清明显已死的：这台机器上可能有别的
# remotion 项目/agent 正在渲染，短阈值会删掉别人正在用的 bundle）。CLEAN_TMP=0 可关闭。
[ "${CLEAN_TMP:-1}" = 1 ] && find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'remotion-webpack-bundle-*' -mmin +240 -exec rm -rf {} + 2>/dev/null
ls "$OUT" | wc -l
