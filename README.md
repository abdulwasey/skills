# skills

Opinionated [Agent Skills](https://agentskills.io) for reviewing and shaping
code, designing backends, web apps and mobile apps, designing admin tools, app
looks and landing pages, documenting codebases,
clearing security alerts, releasing to environment branches, and auditing and
filming UI. They work with Claude Code and any other agent that reads
`SKILL.md` skills.

### Code

Reviewing and shaping code.

| Skill | What it's for |
|---|---|
| [`react-review`](skills/react-review/SKILL.md) | Review and refactor checklist for React, React Native and TypeScript PRs. |
| [`code-design`](skills/code-design/SKILL.md) | The design principles behind that checklist: reuse, deletion, types as the source of truth, verification. |

### System design

Designing new systems, one skill per layer. Each ends with the design doc to write and a list of red flags.

| Skill | What it's for |
|---|---|
| [`backend-system-design`](skills/backend-system-design/SKILL.md) | Services: data ownership, service boundaries, identity and tokens, service-to-service trust, contracts, data lifecycle and backups, jobs and webhooks, environments and cost. |
| [`web-system-design`](skills/web-system-design/SKILL.md) | Web apps: rendering, backend integration, sessions and CSRF, state and cache isolation, access, interaction patterns, accessibility, environments and telemetry. |
| [`app-system-design`](skills/app-system-design/SKILL.md) | Mobile apps: native sign-in and refresh, offline data and writes, live updates and push, deep links, installed-version compatibility and environments per build. |

### Shipping and upkeep

Docs, dependencies and releases across one or many repos.

| Skill | What it's for |
|---|---|
| [`codebase-docs`](skills/codebase-docs/SKILL.md) | Turn one or more codebases into a linked Markdown docs repo for new developers and AI agents: sliced parallel agents, a cross-service connections map, diagrams, `AGENTS.md` and `llms.txt`, plus link, Mermaid and sensitive-data checks. |
| [`dependency-alerts`](skills/dependency-alerts/SKILL.md) | Clear npm, Yarn and pnpm security alerts: one verified PR per repo moving each vulnerable copy to the smallest compatible safe version, checked against a recorded local baseline, with what's left and why. |
| [`env-branch-release`](skills/env-branch-release/SKILL.md) | Ship a PR, branch or the default branch to a long-lived environment branch (qa, staging, team1…): confirm the source, carry exactly that change in the repo's own naming and allowed merge method, and verify each service's deploy before releasing the next. |

### UI design

Creating interfaces that look like one family.

| Skill | What it's for |
|---|---|
| [`admin-ui-design`](skills/admin-ui-design/SKILL.md) | Staff and admin tools: page types, shared components, the four data states, tables, filters, inline editing, status and charts, and the `DESIGN.md` rule book with its review checklist. |
| [`mobile-ui-design`](skills/mobile-ui-design/SKILL.md) | A mobile app's visual system derived from the brand site and sibling products, with cited sources: palette, type, shape, elevation, core components, and what to keep from a legacy app. |
| [`landing-page-design`](skills/landing-page-design/SKILL.md) | Marketing and product landing pages that sell: slides-not-a-page bands, a three-layer story, band recipes from hero to final CTA, blended imagery, mobile, motion and performance, and turning client mocks into a spec. |

### UI and video

Auditing interfaces and showing them off.

| Skill | What it's for |
|---|---|
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
generated API client. The system design skills are defaults, not laws: each
one says when it applies, and stack names in them are examples. Fork them and
change what doesn't fit your codebase.

## License

[MIT](LICENSE)
