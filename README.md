# skills

Opinionated [Agent Skills](https://agentskills.io) for reviewing code, shaping
it, and auditing UI. They work with Claude Code and any other agent that reads
`SKILL.md` skills.

| Skill | What it's for |
|---|---|
| [`react-review`](skills/react-review/SKILL.md) | Review and refactor checklist for React, React Native and TypeScript PRs. |
| [`code-design`](skills/code-design/SKILL.md) | The design principles behind that checklist: reuse, deletion, types as the source of truth, verification. |
| [`design-audit`](skills/design-audit/SKILL.md) | Read-only, flow-by-flow UI audit (readability, font, spacing, contrast, touch targets, network) on web, iOS simulator and Android emulator. |

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
