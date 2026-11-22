# Findings: Sections

The bugs the sections' stories exposed (`stories/sections/`), each fixed in `src/` by a later pass. Written only by the sections' writer; the format is in `stories/README.md`. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css` (`--primary` `#fc4a1a` on `--surface` `#f6f1e7`), which sets no `--on-primary`.

## Accessibility

## Behavior

None yet.

## Observed, Not Yet Marked

None yet.

## Checker Limits (Not Bugs)

- `FullBleedVideo`'s fetch margin: a story runs in an iframe, which clips what lies past its own edge, so an observer's `rootMargin` never reaches beyond it. The clip's arrival within a screen of the viewport cannot be shown in a story; its arrival on screen is (`PosterFirst`).
