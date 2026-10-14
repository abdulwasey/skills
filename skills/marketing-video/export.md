# Export: MP4, GIF, poster, per platform

`templates/export.sh <CompositionId> [name]` does the standard set in one go:
1. MP4 (H.264, CRF 18, PNG intermediate frames);
2. a poster still;
3. a GIF stepped down to a size budget;
4. a loop-seam SSIM check;
5. six stills and a contact sheet to look at.

## Commands it runs (and what to tweak)

```bash
# MP4: PNG frames keep UI text and flat colours clean (set in remotion.config.ts)
npx remotion render Hero out/hero.mp4 --codec=h264 --crf=18

# Poster: the payoff frame, not frame 0
npx remotion still Hero out/hero-poster.png --frame=110

# GIF: per-clip palette, 15 fps, 960 px; step colours 256 -> 96, then width, until it fits
ffmpeg -i out/hero.mp4 -filter_complex \
  "fps=15,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 out/hero.gif

# Loop seam: first vs last frame, want SSIM >= 0.98
ffmpeg -i out/hero.mp4 -frames:v 1 first.png
ffmpeg -sseof -0.05 -i out/hero.mp4 -frames:v 1 -update 1 last.png
ffmpeg -i first.png -i last.png -lavfi ssim -f null -
```

Remotion can also write a GIF directly (`--codec=gif --every-nth-frame=2
--number-of-gif-loops=0`), but the ffmpeg palette route gives smaller files for UI footage
because of `stats_mode=diff` and rectangle diffing.

Size levers, in order of least visible damage:
1. **shorten the loop;**
2. **cut the fps** (15, then 12);
3. **narrow the GIF** (960, then 800, then 640);
4. **use fewer colours** (UI gradients band below about 128).

Flat UI compresses well, while blurred wallpapers and big gradients compress badly. If a GIF
won't fit, simplify the background before you sacrifice the UI.

## Per-platform table

| Destination | Shape and size | Limits and format | Notes |
|---|---|---|---|
| GitHub README hero | GIF 800–960 px wide, ≤ 5 MB (hard limit 10 MB on free plans) | GIF autoplays and loops; an MP4 attachment only shows a click-to-play player | Keep it ≤ 15 s. First frame = a meaningful state (it's what shows while loading). |
| X | 1280×720, 720×720, 720×1280 | MP4 H.264 High, yuv420p, AAC, ≤ 60 fps; aspect 1:3–3:1; GIF ≤ 15 MB | Native MP4 loops when short. Hook in the first 1.5 s. |
| LinkedIn | 1080×1080 or 1920×1080 | MP4, 3 s–15 min, 10–60 fps | Square takes more feed space. Keep text away from the edges. |
| Product Hunt | gallery 1270×760, thumbnail 240×240 | Video must be a YouTube link; thumbnail GIF < 3 MB | Animated thumbnails play on hover only: no strobing, no tiny text. Use posters as gallery images. |
| YouTube / Shorts | 1920×1080; 1080×1920 for Shorts | MP4 H.264, AAC 48 kHz, fast start | Vertical or square ≤ 3 min is treated as a Short. |
| Website hero | MP4 or WebM, 1280–1920 wide | `<video autoplay muted loop playsinline poster>` | Far smaller than a GIF at the same quality. |

```bash
# X/LinkedIn-friendly MP4 from a master, with fast start
ffmpeg -i out/hero.mp4 -vf scale=1280:-2 -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 -movflags +faststart out/hero-x.mp4
# Website: WebM alongside the MP4
ffmpeg -i out/hero.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -an out/hero.webm
```
