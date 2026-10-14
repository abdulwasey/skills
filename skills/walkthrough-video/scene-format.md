# Scene file reference (`scenes.yaml`)

One YAML file drives everything: `capture.mjs` reads `capture:`, `tts.mjs` reads `voice:` and the
narration, `build.mjs` reads the rest. Paths are relative to the file.

## Full example

```yaml
# Audience: new team admins. Goal: invite a teammate in under a minute.
video:
  title: Inviting your team        # project name in HyperFrames Studio
  width: 1920                      # 1920x1080 landscape, 1080x1920 vertical, 1080x1080 square
  height: 1080
  fps: 30
  frame: browser                   # browser | window | phone | none (per-scene override allowed)
  url: app.example.com             # shown in the browser frame's address bar
  logo: shots/logo.png             # title card logo (PNG with transparency looks best)
  progress: true                   # thin progress bar along the bottom edge
  music: audio-src/bed.mp3         # optional, looped and faded; keep it quiet
  musicVolume: 0.12
  theme:
    background: "#0b0d17"
    accent: "#6d5dfc"              # step badge, highlight ring, cursor ripple
    accent2: "#16b3a8"             # second glow and gradient stop
    font: '"Inter", ui-sans-serif, system-ui, sans-serif'
    fontFile: shots/Inter.woff2    # optional: embed a font so renders match everywhere

voice:
  engine: say                      # say | piper | kokoro (or: node tts.mjs --engine piper)
  say: { voice: Samantha, rate: 160, sentencePause: 280 }
  piper: { model: ~/.local/share/piper/en_US-lessac-medium.onnx, lengthScale: 1.05 }
  kokoro: { voice: af_heart, speed: 1.0, python: ~/.venvs/kokoro/bin/python }

timing:
  lead: 0.5                        # seconds of picture before the narration starts
  tail: 0.7                        # seconds after it ends, before the cut
  transition: 0.5                  # cross-fade length between parts
  style: fade                      # default transition: fade | slide | zoom | none
  minScene: 2.5

capture:                           # optional, for node capture.mjs
  viewport: [1440, 900]
  scale: 2
  colorScheme: light
  hide: [".intercom-launcher", "#cookie-banner"]
  shots:
    - name: members
      url: http://localhost:3000/settings/members
      waitFor: "text=Members"
    - name: invite
      url: http://localhost:3000/settings/members
      steps:
        - click: "button:has-text('Invite')"
        - fill: ["input[name=email]", "sam@example.com"]

intro:
  title: Inviting your team
  subtitle: Two minutes, three clicks
  eyebrow: Getting started         # optional small label above the title
  narration: Here's how to invite a teammate to your workspace.

scenes:
  - id: members                    # lowercase, digits, dashes; names the audio file
    image: shots/members.png
    caption: Open Members          # short on-screen label (2-5 words)
    narration: Open Settings, then Members. Everyone in the workspace is listed here.
    focus: [0.55, 0.05, 0.42, 0.3] # region to zoom into (Ken Burns target)
    highlight: [0.82, 0.07, 0.14, 0.06]
    click: [0.89, 0.1]             # cursor glides in and clicks here
    clickAt: 0.6                   # when, as a fraction of the narration (default 0.5)

  - id: invite
    image: shots/invite.png
    caption: Send the invite
    narration: Type their email, choose a role, and press Send.
    speak: Type their e-mail, choose a role, and press Send.   # what the TTS says, if different
    focus: [0.3, 0.25, 0.4, 0.45]
    highlight: [0.33, 0.62, 0.34, 0.08]
    highlightAt: 0.7
    transition: slide
    hold: 0.5                      # extra seconds on this scene

outro:
  title: You're all set
  subtitle: Invites expire after 7 days
  cta: docs.example.com/team       # pill under the subtitle
  narration: That's it. Your teammate gets an email right away.
```

## Coordinates

`focus`, `highlight`, `click` and `cursorFrom` are in the screenshot's own space, as
`[x, y, w, h]` (or `[x, y]` for points).

- **All values ≤ 1 → fractions** of the image width/height. This is the easy one to read off a
  downscaled preview: `bash frames.sh --grid shots/x.png` overlays a 10% grid.
- **Any value > 1 → pixels** of the PNG as saved (a device-scale-2 capture is twice the CSS size).

Ground every coordinate in an image you have actually looked at. If a highlight sits off its
target in the frame check, fix the numbers, don't nudge the CSS.

## Field reference

| Field | Where | Default | Notes |
|---|---|---|---|
| `image` | scene | required | PNG or JPEG. |
| `caption` | scene | none | Numbered step pill, top left. Keep it under ~32 characters. |
| `narration` | scene, intro, outro | none | One idea, 1–2 short sentences. Becomes the subtitles. |
| `speak` | scene, intro, outro | `narration` | TTS-only spelling: "P R", "C I", "e-mail", "dot com". |
| `focus` | scene | none | Without it the scene only gets a slow 3.5% push. |
| `zoom` / `maxZoom` | scene | auto / 2.4 | Auto fits the focus to ~88% of the stage. |
| `highlight` | scene | none | Accent ring plus a dimmed surround (spotlight). |
| `highlightAt` | scene | after zoom | Fraction of the narration; after the click when there is one. |
| `click` / `clickAt` | scene | none / 0.5 | Click lands no earlier than 0.9 s after the zoom settles. |
| `cursorFrom` | scene | below-right of target | Where the cursor enters from. |
| `frame` | video, scene | `window` | `phone` for simulator/device captures. |
| `transition` | scene | `timing.style` | The first part always cuts in. |
| `lead` / `tail` / `hold` | scene | timing values | Per-scene overrides. |

## Timing model

Each part lasts `lead + narration + tail` (at least `minScene`), plus `hold`. The voice starts
`lead` seconds into its part. Parts overlap by `transition` so the next one fades in over the
previous one. Scene length always follows the audio: change the words, re-run `tts.mjs`, and
everything downstream moves. Never hand-edit times in `build/`.

## Outputs of `build.mjs`

- `build/index.html`, `build/assets/`: a self-contained HyperFrames project. Preview it with
  `npx hyperframes preview build`.
- `build/timeline.json`: per-part start/end, narration start/duration, click times.
- `build/captions.srt`: cues of at most 2×42 characters, split at sentence and clause boundaries
  and timed in proportion to the characters within each narration clip.
