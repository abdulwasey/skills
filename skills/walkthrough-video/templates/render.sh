#!/usr/bin/env bash
# Build the composition, render it with HyperFrames (telemetry off, local GSAP), mux the narration
# with ffmpeg at the scene timings, and write out/<name>.mp4 + out/<name>.srt.
# Usage: bash render.sh [--name walkthrough] [--draft] [--burn-subs] [--scenes scenes.yaml]
set -euo pipefail
cd "$(dirname "$0")"
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1 HF_CLI_TELEMETRY_DISABLED=1 HYPERFRAMES_SKIP_SKILLS=1

name=walkthrough quality=delivery burn=0 scenes=scenes.yaml
while [ $# -gt 0 ]; do
  case "$1" in
    --name) name="$2"; shift 2 ;;
    --draft) quality=draft; shift ;;
    --burn-subs) burn=1; shift ;;
    --scenes) scenes="$2"; shift 2 ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done
for bin in node ffmpeg ffprobe; do command -v "$bin" >/dev/null || { echo "missing $bin" >&2; exit 1; }; done
[ -d node_modules/hyperframes ] || { echo "run npm install first" >&2; exit 1; }

node build.mjs "$scenes"
npx --no-install hyperframes lint build
mkdir -p out
fps=$(node -p "require('./build/timeline.json').fps")
npx --no-install hyperframes render build --output "$PWD/out/.$name.silent.mp4" --fps "$fps" --quality "$quality" --quiet

# Narration: each clip delayed to its scene's voice start, mixed without normalisation (clips never overlap).
mix=()
while IFS= read -r line; do mix+=("$line"); done < <(node -e '
  const t = require("./build/timeline.json");
  const inputs = [], chains = [], labels = [];
  t.narration.forEach((n, i) => {
    inputs.push("-i", n.file);
    const ms = Math.round(n.start * 1000);
    chains.push(`[${i + 1}:a]aresample=48000,adelay=${ms}:all=1[v${i}]`);
    labels.push(`[v${i}]`);
  });
  let k = t.narration.length;
  if (t.music) {
    inputs.push("-stream_loop", "-1", "-i", t.music.file);
    chains.push(`[${k + 1}:a]aresample=48000,volume=${t.music.volume},afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, t.duration - 2.5)}:d=2.5[m]`);
    labels.push("[m]"); k++;
  }
  const graph = [...chains, `${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,apad,atrim=0:${t.duration},alimiter=limit=0.95[a]`].join(";");
  console.log([...inputs, "-filter_complex", graph].join("\n"));
')
ffmpeg -v error -y -i "out/.$name.silent.mp4" "${mix[@]}" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart -shortest "out/$name.mp4"
rm -f "out/.$name.silent.mp4"
cp build/captions.srt "out/$name.srt"

if [ "$burn" = 1 ]; then
  # Needs an ffmpeg built with libass (ffmpeg -filters | grep subtitles).
  ffmpeg -v error -y -i "out/$name.mp4" \
    -vf "subtitles=out/$name.srt:force_style='FontName=Helvetica,FontSize=13,PrimaryColour=&H00FFFFFF,BorderStyle=4,BackColour=&H99000000,Outline=0,Shadow=0,MarginV=22'" \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a copy -movflags +faststart "out/$name.subtitled.mp4"
  echo "out/$name.subtitled.mp4"
fi

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/$name.mp4")
size=$(du -h "out/$name.mp4" | cut -f1)
echo "out/$name.mp4  ${dur}s  $size"
echo "out/$name.srt"
echo "next: bash frames.sh out/$name.mp4   (then look at every frame before calling it done)"
