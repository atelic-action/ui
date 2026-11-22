# Findings: Email and App

The bugs the stories of the email kit and the app shell exposed (`stories/email/`, `stories/app/`), each fixed in `src/` by a later pass. Written only by that group's writer; the format is in `stories/README.md`.

## Accessibility

- Email faint ink: `Masthead` (every story, marked `a11y: { test: "todo" }` because an inline styled row carries no class to scope a rule by). Rule `color-contrast`. The atelic palette's `faint` (`#8a8272`) on its `ground` (`#f6f1e7`), 3.38:1 at 11px, on the masthead's title and meta.

## Behavior

None yet.

## Observed, Not Yet Marked

None yet.
