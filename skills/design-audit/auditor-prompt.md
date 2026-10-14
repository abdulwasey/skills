# Auditor prompt template

Fill every `{{PLACEHOLDER}}`, write the result to a scratch file, and launch
one copy per platform. Keep the platform-specific block that applies and
delete the others.

---

You are running a READ-ONLY design, readability and network audit of the
{{FLOW}} flow of {{APP_NAME}} on {{PLATFORM}}. This is one flow of a
flow-by-flow audit. Produce the full findings list for {{FLOW}} only, then stop.

## Environment (already up: verify, do not rebuild)

<!-- Web -->
- The web app is served at {{WEB_URL}}. Do not restart it.
- Use headless Playwright. Load the authenticated session with
  `storageState: '{{STORAGE_STATE_PATH}}'`. If any page lands on a sign-in
  screen, STOP and report that the operator must sign in again.
- Capture at 375, 834 and 1440 px wide. Record network and console per screen
  (`page.on('request' | 'response' | 'console')`).
- Use `page.route('**/*', ...)` to abort every non-GET/HEAD/OPTIONS request
  except these read-only endpoints: {{READ_ONLY_POST_ALLOWLIST}}. Do not
  defeat it.

<!-- iOS simulator -->
- Simulator {{DEVICE_ID}} ({{DEVICE_NAME}}) is booted and signed in. If you
  ever land on a sign-in screen, STOP and report it.
- Interact ONLY via `idb` (tap/swipe/text) and deep links
  (`xcrun simctl openurl {{DEVICE_ID}} "{{URL_SCHEME}}://..."`). Screenshot
  with `xcrun simctl io {{DEVICE_ID}} screenshot <path>`.

<!-- Android emulator -->
- Emulator {{DEVICE_ID}} is booted and signed in. If you ever land on a sign-in
  screen, STOP and report it.
- Interact ONLY via `adb shell input` and deep links
  (`adb shell am start -a android.intent.action.VIEW -d "{{URL_SCHEME}}://..."`).
  Screenshot with `adb exec-out screencap -p > <path>`.

- NEVER automate the host machine's mouse or keyboard (AppleScript, cliclick,
  xdotool...).
- Do NOT run git or switch branches. Do NOT edit source files.

## What to audit: every screen and state of {{FLOW}}

{{SCREENS_AND_STATES}}

## Hard read-only rules

- NEVER send, submit, create, join, react, edit, delete, or sign out.
- You MAY type sample text to show a focused/keyboard state, but MUST NOT
  submit it. Clear the field afterwards.
- Open a picker or menu to inspect it, then dismiss WITHOUT committing a
  selection.
- Do not confirm any alert, confirm or delete dialog. Avoid triggering them.
- Never type credentials.

## Audit lens

Apply every rule in `{{CHECKLIST_PATH}}`. Use the design tokens in
`{{TOKENS_PATH}}` as the source of truth for colors, spacing, radii and type.
Read the flow's components and data-fetching code under `{{SOURCE_DIRS}}` to
tie each finding to a `file:line`.

Report each of these known recurring findings as PRESENT or ABSENT in this flow,
naming the screen (and viewport on web):

{{KNOWN_RECURRING_FINDINGS}}

## Deliverables

- Screenshots: `{{OUTPUT_DIR}}/{{FLOW}}/{{PLATFORM_SLUG}}/<descriptive-name>.png`,
  cited in the doc by the path relative to it (`{{FLOW}}/{{PLATFORM_SLUG}}/<name>.png`)
  (web: `<name>-<viewport>.png`, plus `<name>-<viewport>.json` network logs).
  Plain screenshots, no annotation.
- Findings doc: `{{FINDINGS_PATH}}`. Write ONLY this file; another auditor owns
  the other platform's file.
  - Header paragraph: date ({{DATE}}), device/viewports, signed-in user role,
    that the run was read-only (list what you did NOT do), screens covered vs
    unreachable and why.
  - `## Findings` table:
    `Severity | Area | Screen | Finding | Evidence (screenshot + src file:line) | Suggested fix`.
    Severity HIGH / MEDIUM / LOW.
  - Every finding has a real screenshot filename AND a source `file:line`.
    Every contrast finding has the computed ratio and both hex values.
  - `## Known recurring findings`: each one PRESENT / ABSENT with the screen.
- Be precise and conservative. Report only what the pixels or the source
  actually show. Before reporting any HIGH, re-open its screenshot and confirm.

Work autonomously to completion, then print the full findings table as your
final message.
