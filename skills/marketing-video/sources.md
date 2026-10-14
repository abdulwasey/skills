# Sources

What each source contributed. Everything is paraphrased; check the originals for detail.

## Tools and existing skills

- https://github.com/remotion-dev/skills and https://www.remotion.dev/docs/ai/skills: Remotion's official agent skills (install command, `/remotion-best-practices`). They cover the API well but not the workflow. This skill defers API detail to them.
- https://www.remotion.dev/docs/render-as-gif: Remotion's native GIF codec, `--every-nth-frame` and loop count, kept as the alternative to the ffmpeg palette route.
- https://github.com/heygen-com/hyperframes: HyperFrames CLI and composition model, used for the optional launch cut.
- https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/product-launch-video/SKILL.md: the official launch-video workflow (capture, storyboard, contact-sheet checks). It has no loops, GIF budgets, privacy rules or live components, which this skill adds.
- https://raw.githubusercontent.com/anthropics/skills/main/skills/slack-gif-creator/SKILL.md: GIF fps, colour and dimension budgets, and validating the output.
- https://www.skills.sh/amplitude/builder-skills/launch-video: choose video when the flow matters and a GIF or loop for a single interaction.
- https://github.com/sickn33/agentic-awesome-skills/tree/HEAD/skills/screenstudio-alt: synthetic smoothed cursor, click ripples, zoom on click clusters.

## Craft

- https://www.moonb.io/blog/product-launch-video: one job per video, open on the problem, show the real UI large, plan cutdowns up front, design for sound-off viewing; Linear and Raycast examples.
- https://for.you.com/posts/meta-ad-hook-rules-clash-over-3-seconds-vs-7-seconds-1b7a4958: the first 1.5–3 s decide whether a feed viewer stays; lead with the payoff, not the logo.
- https://www.adstellar.ai/blog/video-ad-length-best-practices: 15–30 s for social, and build the short version first.
- https://digiday.com/media/silent-world-facebook-video/: a large share of feed video plays muted (older figure).
- https://daveswift.com/screen-studio/ and https://www.superchargebrowser.com/features/auto-zoom-recording/: smooth zoom toward the click, anticipatory camera, merge nearby clicks.

## Platform specs

- https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files: GitHub image/GIF and video attachment limits and formats.
- https://docs.x.com/x-api/media/quickstart/best-practices: X video and GIF limits, aspect range, codec settings.
- https://www.linkedin.com/help/linkedin/answer/a548372: LinkedIn video length, size, aspect and frame-rate ranges.
- https://help.producthunt.com/en/articles/479557-how-to-post-a-product: Product Hunt gallery size, thumbnail GIF limit and hover-only playback, YouTube-only video.
- https://support.google.com/youtube/answer/1722171: YouTube encoding settings.
- https://compresto.app/blog/youtube-shorts-size: square or vertical uploads up to 3 min count as Shorts (third-party).
