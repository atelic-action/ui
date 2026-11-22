# Findings: Sections

The bugs the sections' stories exposed (`stories/sections/`), each fixed in `src/` by a later pass. Written only by the sections' writer; the format is in `stories/README.md`. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css` (`--primary` `#fc4a1a` on `--surface` `#f6f1e7`), which sets no `--on-primary`.

## Accessibility

- `on-primary-field-contrast`: `CalloutPanel` (every story), `Hero` (`Split`, `SplitPhone`, `SplitNoPhoto`). Rule `color-contrast`. Words on the primary field (`.on-primary`), now `--on-primary` and mixes of it: the callout titles (3.1:1 at 21.6px) and subtitles (2.93:1), the split hero's eyebrow (2.87:1), subtitle (3.1:1), and ghost button (3.42:1). Worst: the title's `em.serif` accent reads `--primary-bright` on the primary field, 1.38:1, nearly invisible, and no token a theme sets reaches it. The rest a theme can now lift by setting `--on-primary`.

## Behavior

None yet.

## Observed, Not Yet Marked

None yet.

## Checker Limits (Not Bugs)

- `FullBleedVideo`'s fetch margin: a story runs in an iframe, which clips what lies past its own edge, so an observer's `rootMargin` never reaches beyond it. The clip's arrival within a screen of the viewport cannot be shown in a story; its arrival on screen is (`PosterFirst`).
