#!/usr/bin/env bash
# Extract stills for checking. With only a video, picks 3 moments per part from build/timeline.json
# (just after the transition, the click or mid-narration, just before the cut), writes a contact
# sheet, and runs the narration sync check.
# Usage: bash frames.sh out/walkthrough.mp4 [seconds ...]
#        bash frames.sh --grid shots/home.png      # 10% grid overlay to read focus/click coordinates
set -euo pipefail
cd "$(dirname "$0")"

if [ "${1:-}" = "--grid" ]; then
  img="$2"; out="out/grid-$(basename "${img%.*}").png"; mkdir -p out
  ffmpeg -v error -y -i "$img" -vf "drawgrid=w=iw/10:h=ih/10:t=2:c=red@0.55,drawgrid=w=iw/2:h=ih/2:t=5:c=yellow@0.7" "$out"
  echo "$out  (thin red lines every 0.1, thick yellow at 0.5; fractions work directly in scenes.yaml)"
  exit 0
fi

video="${1:?usage: frames.sh <video> [seconds...]}"; shift
name=$(basename "${video%.*}")
dir="out/frames/$name"; rm -rf "$dir"; mkdir -p "$dir"

if [ $# -gt 0 ]; then
  times=("$@")
else
  times=()
  while IFS= read -r line; do times+=("$line"); done < <(node -e '
    const t = require("./build/timeline.json");
    const pts = [];
    for (const s of t.scenes) {
      const v = t.narration.find((n) => n.id === s.id);
      pts.push(s.start + 0.6, s.click != null ? s.click + 0.15 : v ? v.start + v.dur * 0.6 : (s.start + s.end) / 2, s.end - 0.15);
    }
    console.log([...new Set(pts.map((x) => Math.max(0, Math.min(t.duration - 0.05, x)).toFixed(2)))].join("\n"));
  ')
fi

for t in "${times[@]}"; do
  ffmpeg -v error -y -ss "$t" -i "$video" -frames:v 1 "$dir/$(printf '%06.2f' "$t")s.png"
done
cols=3; rows=$(( (${#times[@]} + cols - 1) / cols ))
ffmpeg -v error -y -pattern_type glob -i "$dir/*s.png" -vf "scale=640:-2,tile=${cols}x${rows}:padding=6:color=black" -frames:v 1 "$dir/contact-sheet.png"
ls "$dir"/*.png
if [ -f build/timeline.json ]; then node check.mjs "$video"; fi
