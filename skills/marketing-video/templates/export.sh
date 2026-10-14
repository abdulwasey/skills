#!/usr/bin/env bash
# Render one Remotion composition to MP4 + poster + size-budgeted GIF, check the loop seam, and
# extract stills to look at.
# Usage: bash export.sh <CompositionId> [name] [--poster <frame>] [--gif-width 960] [--gif-fps 15] [--budget-mb 5] [--no-loop]
# Env: SKIP_RENDER=1 reuses an existing out/<name>.mp4 (re-export the GIF only).
set -euo pipefail
cd "$(dirname "$0")"

id="${1:?usage: export.sh <CompositionId> [name] [options]}"; shift
name="$id"; if [ $# -gt 0 ] && [ "${1#--}" = "$1" ]; then name="$1"; shift; fi
poster="" width=960 fps=15 budget=5 loop=1
while [ $# -gt 0 ]; do
  case "$1" in
    --poster) poster="$2"; shift 2 ;;
    --gif-width) width="$2"; shift 2 ;;
    --gif-fps) fps="$2"; shift 2 ;;
    --budget-mb) budget="$2"; shift 2 ;;
    --no-loop) loop=0; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done
mkdir -p out/frames
mp4="out/$name.mp4" gif="out/$name.gif"

if [ "${SKIP_RENDER:-0}" != 1 ]; then
  npx remotion render "$id" "$mp4" --codec=h264 --crf=18
fi
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$mp4")
if [ -z "$poster" ]; then
  poster=$(ffprobe -v error -select_streams v -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$mp4")
  poster=$(( poster * 2 / 5 ))  # 40% in: usually the payoff moment; pass --poster to choose
fi
npx remotion still "$id" "out/$name-poster.png" --frame="$poster"

# GIF: palette per clip; step colours down, then width, until it fits the budget.
limit=$(( budget * 1024 * 1024 ))
for w in "$width" $(( width * 5 / 6 )) $(( width * 2 / 3 )); do
  for colors in 256 192 128 96; do
    ffmpeg -loglevel error -y -i "$mp4" -filter_complex \
      "fps=${fps},scale=${w}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
      -loop 0 "$gif"
    size=$(stat -f%z "$gif" 2>/dev/null || stat -c%s "$gif")
    [ "$size" -le "$limit" ] && break 2
  done
done
echo "$gif  $((size / 1024)) KB  (${w}px, ${colors} colours, ${fps} fps)"
[ "$size" -le "$limit" ] || echo "WARNING: GIF still over ${budget} MB. Shorten the clip or lower --gif-fps." >&2

# Loop seam: the first and last frames should be near-identical for a seamless loop.
if [ "$loop" = 1 ]; then
  ffmpeg -loglevel error -y -i "$mp4" -frames:v 1 "out/frames/$name-first.png"
  ffmpeg -loglevel error -y -sseof -0.05 -i "$mp4" -frames:v 1 -update 1 "out/frames/$name-last.png"
  ssim=$(ffmpeg -i "out/frames/$name-first.png" -i "out/frames/$name-last.png" -lavfi ssim -f null - 2>&1 | sed -n 's/.*All:\([0-9.]*\).*/\1/p')
  echo "loop seam SSIM $ssim (want >= 0.98)"
  awk -v s="$ssim" 'BEGIN { exit !(s < 0.98) }' && echo "WARNING: the loop will visibly jump. End the story in the start state." >&2
fi

# Stills at 0, 20, 40, 60, 80% and the end, plus a contact sheet. Look at them.
for p in 0 20 40 60 80 98; do
  t=$(awk -v d="$dur" -v p="$p" 'BEGIN { printf "%.2f", d * p / 100 }')
  ffmpeg -loglevel error -y -ss "$t" -i "$mp4" -frames:v 1 "out/frames/$name-$(printf '%02d' "$p").png"
done
ffmpeg -loglevel error -y -pattern_type glob -i "out/frames/$name-??.png" -vf "scale=640:-2,tile=3x2:padding=6:color=black" -frames:v 1 "out/frames/$name-sheet.png"
echo "$mp4  ${dur}s  $(du -h "$mp4" | cut -f1)"
echo "out/$name-poster.png (frame $poster)"
echo "look at: out/frames/$name-sheet.png and the full-size stills"
