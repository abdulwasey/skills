# skills

Opinionated [Agent Skills](https://agentskills.io) for reviewing code, shaping
it, and auditing UI. They work with Claude Code and any other agent that reads
`SKILL.md` skills.

| Skill | What it's for |
|---|---|
| [`react-review`](skills/react-review/SKILL.md) | Review and refactor checklist for React, React Native and TypeScript PRs. |
| [`backend-system-design`](skills/backend-system-design/SKILL.md) | Designing backend architecture: requirements first, one writer per field, few services, identity and token validation, scoped service credentials, versioned contracts and idempotency, data lifecycle and backups, durable at-least-once jobs and webhooks, cost-aware environments. |
| [`web-system-design`](skills/web-system-design/SKILL.md) | Designing web apps: rendering per route, a generated client, account-scoped query cache and URL state, cookie sessions with CSRF, a five-state session gate, capabilities, interaction patterns, accessibility, one-switch staging look, privacy-first telemetry. |
| [`app-system-design`](skills/app-system-design/SKILL.md) | Designing mobile apps: PKCE sign-in and one shared refresh, an approved offline allowlist wiped on logout, outbox writes, recoverable live updates and account-bound push, one link parser, a supported-version window, explicit environments per build. |
| [`code-design`](skills/code-design/SKILL.md) | The design principles behind that checklist: reuse, deletion, types as the source of truth, verification. |
| [`design-audit`](skills/design-audit/SKILL.md) | Read-only, flow-by-flow UI audit (readability, font, spacing, contrast, touch targets, network) on web, iOS simulator and Android emulator. |
| [`walkthrough-video`](skills/walkthrough-video/SKILL.md) | Narrated 30–60 s product walkthrough (MP4 + SRT) from screenshots: local TTS, zooms, highlights, cursor, HyperFrames render, frame and sync checks ([demo](skills/walkthrough-video/demo.gif)). |
| [`marketing-video`](skills/marketing-video/SKILL.md) | Seamless 10–20 s promo loops (MP4, GIF, poster; landscape, square, vertical) rendering the app's real React components with stubbed APIs, plus a launch cut. |

## Install

With the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add abdulwasey/skills
```

Or copy a skill folder by hand:

```bash
git clone https://github.com/abdulwasey/skills
cp -R skills/skills/react-review ~/.claude/skills/
```

## A note on opinions

These are my house rules, and they're opinionated on purpose: zero comments
in a diff, inline anything used fewer than three times, derive types from the
generated API client. Fork them and change what doesn't fit your codebase.

## License

[MIT](LICENSE)
