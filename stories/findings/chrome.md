# Findings: Chrome

The bugs the chrome's stories exposed (`stories/chrome/`, and the setup's in `stories/foundations/`), each fixed in `src/` by a later pass. Written only by the chrome's writer; the format is in `stories/README.md`. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css` (`--primary` `#fc4a1a`, `--primary-fill` `#d63a10`, `--primary-ink` `#b8300b`, on `--surface` `#f6f1e7`), which sets no `--on-primary`, so the package's default white stands. Every finding this file listed through 8.0.0's first browser pass was fixed in `src/` (ATE-772), and its marker removed; a marker that outlives its bug now fails the run (`stories/README.md`, Accessibility and Bugs).

## Accessibility

None open.

## Behavior

None open.

## Observed, Not Yet Marked

None open.

## Checker Limits (Not Bugs)

- `checker-transparent-header`: `SiteShell` (every story). On a page taller than the screen, axe scrolls the page as it measures, synchronously, so the transparent header never hears the scroll and is judged, still clear, against the page below the hero (1.12:1). The header's contrast over a hero is checked where it is true, in `SiteHeader`'s `Transparent` story, which is one hero tall.
