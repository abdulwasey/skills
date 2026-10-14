---
name: walkthrough-video
description: Use when the user wants a short narrated video that walks through an app - "make a walkthrough video", "demo video", "onboarding video", "tutorial video", "narrated screen tour", "explain this feature in a video", "feature video for the README", "help-centre video". Produces a 30-60 s MP4 plus an .srt from screenshots (web via Playwright, iOS simulator, Android emulator, or supplied images), with free local TTS, Ken Burns zooms, highlights, a clicking cursor, captions and title/end cards, rendered with HyperFrames and checked frame by frame.
---

# Walkthrough video

Make a short narrated product walkthrough from still screenshots. The pipeline is deterministic:
**scene file → per-scene voiceover → durations → HyperFrames composition → MP4 + SRT → frame and
sync check**. Every scene lasts exactly as long as its narration plus padding, so changing the
words never desyncs the picture.

This skill is the workflow and the craft. For HyperFrames API details (data attributes, GSAP
rules, Studio, lint), use the official HyperFrames skills (`npx skills add heygen-com/hyperframes`,
then `/hyperframes-core` and `/hyperframes-cli`) or `npx hyperframes docs <topic>`. If the user
wants a punchy promo rather than a tutorial, that's HyperFrames' `/product-launch-video`, not this.

Reference files:
- `scene-format.md`: every field of `scenes.yaml`, coordinates and the timing model.
- `craft.md`: story and pacing, narration rules, captions, the per-platform export table.
- `templates/`: the scripts you copy into the user's project.
- `sources.md`: where the craft rules come from.

## Prerequisites

- Node 20+, `ffmpeg` and `ffprobe` (with libass if you'll burn in subtitles). Check with
  `ffmpeg -filters | grep subtitles`.
- HyperFrames, GSAP and `yaml` come from `npm install` in the copied folder. HyperFrames is pinned
  and runs via `npx --no-install`. It downloads its own headless Chrome on the first render.
- TTS, pick one:
  - **`say`** (macOS built-in, zero install, robotic but clear). The default.
  - **Piper** (fast, natural, offline, any OS):
    ```bash
    python3 -m venv ~/.venvs/piper && ~/.venvs/piper/bin/pip install piper-tts
    ~/.venvs/piper/bin/python -m piper.download_voices --data-dir ~/.local/share/piper en_US-lessac-medium
    ```
    Then set `voice.piper: { model: ~/.local/share/piper/en_US-lessac-medium.onnx, bin: ~/.venvs/piper/bin/piper }`.
  - **Kokoro-82M** through `hyperframes tts` (most natural, about 300 MB of models on first use):
    ```bash
    python3 -m venv ~/.venvs/kokoro && ~/.venvs/kokoro/bin/pip install kokoro-onnx soundfile
    ```
    Keep this venv at a **short path**. espeak-ng fails with "phontab: No such file" when its
    data path is long, as it is inside deep temp or scratch directories.
- Optional, for web capture: `npx playwright install chromium`.

## Steps

### 1. Agree the story first. No capture until this is settled.

Ask, or propose and confirm:
- **audience:** new users, admins or developers;
- **the one job** the video teaches;
- **4–8 scenes**, each with one sentence of narration and the screen it needs;
- **shape:** 16:9 for docs and YouTube, 1:1 or 9:16 for social;
- **voice engine.**

Write the narration with `craft.md` rules: about 150 wpm, short active sentences, one idea per
scene, the UI's exact labels. 30 s is about 70 words in total. Show the user the script as a
table (scene, screen, narration, caption) and get a yes.

### 2. Capture clean screenshots

**Privacy first.** Tell the user plainly that everything on screen ends up in a public video.
Prefer a demo account or seed data. Check for real names, emails, avatars, customer records,
tokens, API keys, internal URLs, notifications and browser bookmarks. **Never type, store or
ask for credentials.** For signed-in pages, run `node capture.mjs --login <url>`: the user signs
in themselves in the browser that opens, and the session goes to `.auth.json`, which is
gitignored.

- **Web:** list the shots under `capture:` in `scenes.yaml` and run `node capture.mjs`. It uses a
  fixed viewport, device scale 2, network idle, loaded fonts, and no scrollbars, carets or
  animations. Use `hide:` for chat widgets and cookie banners and `steps:` to click or type demo
  values before the shot.
- **iOS simulator:** set a clean status bar first, then take the screenshot:
  ```bash
  xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100 --cellularBars 4
  xcrun simctl io booted screenshot shots/home.png
  ```
  Use `frame: phone`.
- **Android:** enable demo mode first, then take the screenshot:
  ```bash
  adb shell settings put global sysui_demo_allowed 1
  adb shell am broadcast -a com.android.systemui.demo -e command enter
  adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
  adb exec-out screencap -p > shots/home.png
  adb shell am broadcast -a com.android.systemui.demo -e command exit
  ```
  Use `frame: phone`.
- **User-supplied images:** crop away OS chrome and stray cursors, then look at every one for
  private data before using it.

Look at every screenshot (open the PNG) before moving on.

### 3. Set up the project and write the scene file

```bash
SKILL=<this skill's directory>
mkdir -p walkthrough && cp -R "$SKILL/templates/." walkthrough/ && mv walkthrough/gitignore walkthrough/.gitignore
cd walkthrough && npm install
```

Put the screenshots in `walkthrough/shots/` and write `walkthrough/scenes.yaml` (see
`scene-format.md`). For each scene, pick a `focus` region, a `highlight` and an optional `click`.
Read coordinates off the image: `bash frames.sh --grid shots/x.png` draws a 10% grid, and
fractions (0–1) work directly.

### 4. Voiceover

```bash
node tts.mjs                      # engine from scenes.yaml; or --engine piper|kokoro|say
node tts.mjs --only invite --force  # redo one line
```

This writes `audio/<id>.wav`, trimmed and loudness-normalised, and prints each duration and wpm.
Act on its warnings: cut words when a line is flagged as fast, and split the scene when a line
runs past about 9 s. Use `speak:` to fix pronunciation.

### 5. Build: durations become the timeline

```bash
node build.mjs
```

It measures every clip with ffprobe and writes `build/` (the HyperFrames project, with GSAP
vendored locally), `build/timeline.json` and `build/captions.srt`. It prints each part's start,
duration, voice window, zoom and click time. Sanity-check the total: 30–60 s.

The composition, in order:
- the title card;
- per scene: a cross-fade, a Ken Burns ease into `focus`, a slow push, the step caption, the
  cursor gliding in and clicking with a ripple, and a spotlight highlight;
- the end card with a CTA pill;
- a progress bar.

To change the look, edit `composition.html` (CSS and the timeline loop) or `theme:`. Don't edit
`build/`, which is regenerated on every build.

### 6. Render

```bash
bash render.sh --name invite-team            # add --burn-subs for social, --draft while iterating
```

The script runs these steps:
1. `build.mjs`;
2. `hyperframes lint`;
3. `hyperframes render` with telemetry off (`DO_NOT_TRACK`, `HYPERFRAMES_NO_TELEMETRY`,
   `HF_CLI_TELEMETRY_DISABLED`);
4. an ffmpeg mux that delays each narration clip to its scene (plus optional music);
5. writing `out/<name>.mp4` and `out/<name>.srt`, and `out/<name>.subtitled.mp4` with
   `--burn-subs`.

Lint warns `nested_structure_needs_subcomposition` for each scene. That warning only affects
Studio's timeline display, and the render is unaffected.

### 7. Verify. This is not optional.

```bash
bash frames.sh out/invite-team.mp4          # 3 stills per part + contact sheet + sync check
bash frames.sh out/invite-team.mp4 7.3 9.1  # specific moments
```

**Open and look at** `out/frames/<name>/contact-sheet.png`, then at full-size stills for every
zoom, click and highlight. Check:
- the zoom lands on the thing the narration names, and nothing important is cut off;
- the highlight ring sits exactly on its target, and the cursor tip lands on the control;
- captions and cards are legible, there are no overlaps, and no text is clipped;
- no private data is visible at full zoom (zooming reveals small text);
- the title card states the payoff, and the end card states the next step.

`check.mjs` (run by `frames.sh`) detects speech in the final MP4 and fails if any narration
starts more than 0.3 s off, runs past its scene's cut, or is missing.

Fix the cause in `scenes.yaml`, the narration or the template, then re-run steps 4–7. Repeat
until a full pass is clean. Only then report back, with:
- the MP4 and SRT paths, the duration and the size;
- 3–4 frame paths the user can open;
- the export variants they might want (see `craft.md`).

## Common mistakes

| Mistake | Fix |
|---|---|
| Hand-timing scenes, then changing a word | Timing comes only from audio durations. Re-run tts, build and render. |
| Narration longer than its scene, or speech cut at a transition | `check.mjs` catches it. Shorten the line, don't shrink `tail`. |
| Highlight or click a few pixels off | The coordinates came from a guess. Read them off the grid image, re-render, and look. |
| Rendering and declaring done | Always run frames.sh and open the PNGs. A clean render can still frame the wrong thing. |
| A 1440 px page shown whole at 1080p | Set a `focus` on every scene where text must be read. |
| Mispronounced product names | Use `speak:` with the phonetic spelling. Subtitles keep the real text. |
| `<script src="https://cdn...gsap">` in the composition | GSAP is copied from node_modules into `build/assets/`. Renders must not hit the network. |
| Telemetry or skill auto-install during renders | Always render through `render.sh`, which exports the opt-out variables. |
| Kokoro "phontab" error | The venv path is too long. Recreate the venv at `~/.venvs/kokoro`. |
| Stray real cursor or tooltip in a screenshot | Recapture (capture.mjs moves the mouse to 0,0) or crop. Don't paint over UI text. |
| A walkthrough of everything | One job per video. Split it. |

## Red flags. Stop and fix before going on.

- Real customer data, real names or emails, tokens, keys or internal hostnames in any shot,
  including in small text that becomes readable once zoomed.
- You are about to type or store the user's password, or `.auth.json` is about to be committed.
- Narration total over about 150 words, or a scene line over 9 s.
- `check.mjs` reports a sync problem and you're tempted to ship anyway.
- You haven't opened a single extracted frame.
- The composition loads anything from a CDN or URL.
- Captions or subtitles disagree with what is on screen.
