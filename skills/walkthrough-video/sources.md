# Sources

What each source contributed. Everything is paraphrased; check the originals for detail.

## Tools

- https://github.com/heygen-com/hyperframes: the HyperFrames CLI (`render`, `lint`, `tts`, `docs`), its data attributes and timeline registration, and the official skills install.
- https://hyperframes.heygen.com/llms.txt: the docs index used to confirm the CLI flags and rendering options.
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/product-launch-video/SKILL.md: the closest official skill (a promo, not a tutorial). Taken from it: get the script approved before building, treat the real screenshot as the source of truth, and check contact sheets before rendering.
- https://hyperframes.heygen.com/guides/voice-and-audio.md: time visuals to the real audio, not to estimated scene lengths.
- https://github.com/OHF-Voice/piper1-gpl: the Piper CLI (`-m`, `-f`, `--length-scale`) and `piper.download_voices`, both verified locally.
- https://skills.sh/affaan-m/everything-claude-code/ui-demo and https://github.com/sickn33/agentic-awesome-skills/tree/HEAD/skills/screenstudio-alt: existing demo-recording skills. They cover recording and auto-zoom but not narration, sync checks, privacy or export specs, which this skill adds.

## Craft

- https://www.moonb.io/blog/product-launch-video: one job per video, open on the problem rather than a feature list, show the real UI large, design for sound-off viewing from the start.
- https://for.you.com/posts/meta-ad-hook-rules-clash-over-3-seconds-vs-7-seconds-1b7a4958: the opening 1.5–3 s decides whether a social viewer stays.
- https://breadnbeyond.com/how-many-words-does-a-60-seconds-explainer-video-needs/: about 150 wpm for explainer narration.
- https://www.stimme24.com/en/guide/explainer-video-script/: faster bands for product demos; cut words rather than speed up the read.
- https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide: 42 characters per line, 2 lines, reading-speed limits, and line-break rules.
- https://clevercast.com/bbc-subtitling-guidelines: BBC subtitle pace (secondary summary).
- https://digiday.com/media/silent-world-facebook-video/: large share of feed video watched muted (older, self-reported figure).
- https://daveswift.com/screen-studio/: Screen Studio-style smooth zoom to the click and back.

## Platform specs

- https://docs.x.com/x-api/media/quickstart/best-practices: X video and GIF limits, aspect range, codec settings.
- https://www.linkedin.com/help/linkedin/answer/a548372: LinkedIn video length, size, aspect and frame-rate ranges.
- https://help.producthunt.com/en/articles/479557-how-to-post-a-product: Product Hunt gallery size, GIF thumbnail limit, YouTube-only video.
- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files: GitHub attachment size limits and video formats.
- https://support.google.com/youtube/answer/1722171: YouTube encoding settings (fast start, H.264 High, AAC 48 kHz).
