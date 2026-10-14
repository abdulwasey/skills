# Story beats and loop design

## Beat template: a 10–20 s loop

Write the beats as a frame table before touching code (30 fps):

| Beat | Frames (16 s loop) | What happens | Rule |
|---|---|---|---|
| 0. Rest | 0–24 | Start state: product at rest, cursor parked, caption fading in | Must equal the last frame |
| 1. Hook | by 45 (1.5 s) | The first visible change: a badge ticks, a notification lands, a panel opens | Something moves in the first 1.5 s |
| 2. Action | ~60–200 | The user does the one thing (click, approve, type a search) | One action per beat, cursor arrives ~10 frames before the click |
| 3. Payoff | ~200–360 | The result the product exists for: green check, merged, list cleared | Hold ≥ 1 s on it; it's the poster frame |
| 4. Second proof (optional) | ~360–420 | The same value again with different data | Only if it adds information |
| 5. Return | last 40–60 | Close the panel, park the cursor, restore the start state | No cuts: animate back |

One caption, **the value in ≤ 7 words**, on screen the whole loop (sound-off viewing is the
default in feeds). It's the line a viewer remembers ("Your PRs and CI, one click away.").

## Making the loop seamless

- **The last frame equals the first frame.** Same data, same counts, same cursor position, same
  open/closed state. `export.sh` measures SSIM between them; aim for **≥ 0.98**.
- Design the data so the story *naturally* returns: the badge that went 3 → 2 goes back to 3
  because a new item arrives; the panel that opened closes. Don't jump-cut back.
- Things that break seams: a caption that fades out at the end but is fully visible at frame 0
  (fade it in at frame 0 too, or keep it static), "updated Ns ago" counters (derive them from the
  last event, not the frame), spinners (make their period divide the loop length), a toast still
  sliding out on the last frame.
- Frame-driven cycles (pulses, spinners): choose periods that divide the duration (a 16 s loop
  with a 1.6 s pulse and 0.8 s spinner).
- Check the seam by eye too: put `-first.png` and `-last.png` side by side.

## Pacing and motion

- Cursor: ease-in-out (bezier 0.45, 0, 0.2, 1), 15–25 frames per move, never straight lines at
  constant speed. Park it off the content during the payoff.
- Clicks: a 3-frame press, an 8-frame release and a 14-frame ripple. The app's own pressed state
  comes from `.fake-active`.
- Panels and toasts: springs (damping ~20) in, short eased-cubic out. Nothing linear except
  progress bars.
- Zoom (screenshot scenes): one push per beat, toward what changes. Hold, then ease back out
  before the return beat so the loop restarts wide.
- Leave 6–10 frames of stillness after each change, so a GIF at 15 fps still shows it.

## Shapes

Build one scene component that lays out from `useVideoConfig()` and register a `Composition`
per shape:
- landscape (1280×800 or 1920×1080) for the README and X;
- square (1080×1080) for LinkedIn and X;
- vertical (1080×1920) for Shorts, Reels and Stories.

For vertical, don't just stretch the frame: scale the app up (CSS `zoom` on the LiveApp wrapper,
or a phone frame) and crop to the part that moves, or the UI ends up small in a tall empty
window. Re-check caption and toast placement per shape, keeping them out of platform UI zones
near the edges.

## The launch cut (30–45 s)

A combined cut stitches the loops (or several features) with title and end cards:

1. **0–3 s:** title card with the payoff line, not just the product name. The logo can come
   later.
2. **3–35 s:** 2–4 feature clips, 7–10 s each, trimmed into their action → payoff, cross-faded
   (0.5 s).
3. **Last 4–5 s:** end card with the URL or install command and one CTA.

HyperFrames does this assembly well, with no React needed. Render the clips first, then build an
`index.html` with `<video data-start data-duration data-media-start muted>` per clip, GSAP fades
and the cards. Vendor `gsap.min.js` into `assets/`, never the CDN. Render with telemetry off:

```bash
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1 HF_CLI_TELEMETRY_DISABLED=1 HYPERFRAMES_SKIP_SKILLS=1
cp node_modules/gsap/dist/gsap.min.js cut/assets/
npx hyperframes render cut --output "$PWD/out/launch.mp4" --fps 30 --quality delivery --quiet
```

Alternatively, use a Remotion composition with `<Series>` or `<OffthreadVideo>` if you'd rather
stay in one tool. For a narrated version, hand over to the walkthrough-video skill.
