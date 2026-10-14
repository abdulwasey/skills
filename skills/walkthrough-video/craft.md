# Craft: story, narration, captions, export

Rules for making the walkthrough worth watching. The sources behind them are in `sources.md`.

## Story and pacing

- **One job per video.** "Invite a teammate", not "tour of settings". If the brief has two jobs,
  make two videos.
- **The first 2–3 seconds carry the payoff.** The title card says what the viewer will be able to
  do, not just the product name ("Invite your team in 30 seconds"). Social viewers decide within
  a few seconds.
- **Open on the user's problem or goal, not a feature list.** Feature-list openings are the most
  common weak start.
- **4–8 scenes, 30–60 s.** Each scene shows one screen state and makes one point. At 150 wpm,
  30 s is about 70 words and 45 s about 110, *including* the intro and outro lines.
- **Show the real UI, large.** Zoom to the part that matters. A whole 1440 px page shrunk into a
  1080p frame is unreadable on a phone.
- **Every zoom has a reason.** It lands on the thing the narration names, then holds. Use one
  zoom per scene. Don't ping-pong.
- **The cursor moves with intent.** One glide, one click, at the moment the voice says the verb
  ("…and press **Send**"). Use `clickAt` to line it up. Never show a click the narration doesn't
  mention.
- **End on the outcome, then the next step.** The outro is the finished state plus where to go
  next (a docs URL, the next video). Leave no dead air after the last word, just the `tail`.

## Writing narration

- About **150 words per minute** for a steady tutorial read. `tts.mjs` measures speech-only wpm
  (pauses trimmed), which reads 10–15% higher. Above ~190 it flags the line: cut words, don't
  speed up the voice.
- **Short sentences, active voice, second person:** "Click Members." not "The Members page can
  be accessed by clicking…".
- **One idea per scene, at most two sentences.** If a line runs past ~8 s, split the scene.
- **Name exactly what is on screen**, using the UI's own label and case. If the button says
  "Add member", don't say "invite".
- **Describe the UI, not the data.** Say "your open pull requests", not "Sam's PR about billing".
  The data is fake and may change.
- **Fix pronunciation with `speak:`**, never by misspelling the subtitles. Typical fixes are
  acronyms ("P R", "C I", "S Q L"), product names, "e-mail", URLs ("example dot com") and
  version numbers.
- **Read it aloud once.** If you run out of breath, so will the TTS.

## Captions and subtitles

Many viewers watch with the sound off, especially in social feeds, so the video must make sense
muted. Two layers do that:

1. **On-screen step caption** (`caption:`): 2–5 words, numbered, always visible during its scene.
   It's the muted viewer's narration.
2. **Subtitles** (`.srt`, optionally burned in with `--burn-subs`):
   - at most 42 characters per line and 2 lines per cue;
   - break at punctuation or before a conjunction or preposition, never between an article and
     its noun;
   - aim for 17 characters per second or fewer (20 at most).

   `build.mjs` follows these rules. Check the output anyway when a narration line is long.

Upload the sidecar `.srt` where the platform accepts it (YouTube, LinkedIn, X). Burn it in for
places that don't (README, Slack, Product Hunt GIFs).

## Export table

| Destination | Shape | Format and limits | Notes |
|---|---|---|---|
| Docs / help centre | 1920×1080 | MP4 H.264, `+faststart` | Sidecar `.srt`. This is the default render. |
| YouTube | 1920×1080 | MP4 H.264 High, AAC 48 kHz, fast start | Upload the `.srt`. Square or vertical ≤ 3 min counts as a Short. |
| X | 1280×720, 720×720 or 720×1280 | MP4 H.264 High, yuv420p, AAC ≥ 128 kbps, ≤ 60 fps | Aspect between 1:3 and 3:1. Burn the subtitles in. |
| LinkedIn | 1920×1080 or 1080×1080 | MP4, 3 s – 15 min, ≤ 5 GB | Keep text away from the edges, where the UI overlays it. Upload the `.srt`. |
| Product Hunt | gallery 1270×760 | Video = YouTube link only. GIF thumbnail < 3 MB | Use stills from `frames.sh` for the gallery. |
| GitHub README | 640–960 px wide | GIF or MP4 ≤ 10 MB on free plans | Only a GIF autoplays reliably. An MP4 attachment shows as a click-to-play player. |

Re-render for a different shape: change `video.width/height` (e.g. 1080×1080), re-check the
focus regions, and re-run `render.sh`. Don't crop a landscape render.

### Commands

```bash
# README GIF: an 8-12 s excerpt, 12 fps, palette per clip; step the width down until <= 3-5 MB
ffmpeg -ss 6.7 -t 10.6 -i out/walkthrough.subtitled.mp4 -filter_complex \
  "fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 out/walkthrough.gif

# X: 1280x720 from the 1080p master
ffmpeg -i out/walkthrough.subtitled.mp4 -vf scale=1280:-2 -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 20 -c:a aac -b:a 160k -movflags +faststart out/walkthrough-x.mp4

# Poster / Product Hunt still
ffmpeg -ss 14.7 -i out/walkthrough.mp4 -frames:v 1 out/poster.png
```
