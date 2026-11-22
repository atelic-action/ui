# Findings: Primitives, Components, and Artifact

The bugs the stories of the primitives, the components, and the artifact pieces exposed (`stories/primitives/`, `stories/components/`, `stories/artifact/`), each fixed in `src/` by a later pass. Written only by that group's writer; the format is in `stories/README.md`. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css`. Every finding this file listed through the first browser pass was fixed in `src/` (ATE-772) and its marker removed, the story keeping the check as a plain assertion.

## Accessibility

None open.

## Behavior

None open.

## Observed, Not Yet Marked

None open.

## Checker Limits

- `checker-watermark-tiles`: `Watermark` (Tiled). The tiled layer is faint on purpose (1.07:1, `#f6e7db` on the surface) and `aria-hidden`, decoration WCAG exempts, but axe measures hidden text too. Not a bug; the marker lifts the rule off `.gate-wm-tile` alone.
- axe skips a single character (`shortTextContent`), so a one digit `Bubble` number is never measured; the stories use two.
- The test's click dispatches the press and the focus in one task, so Radix Tabs' activation on press and again on focus can both run before React renders, and `onSelect` may report the first pick twice. A real click renders between the two; the Click story asserts no new call on the open tab instead of an exact count.
- A synthetic key press does not scroll a focused scrolling region, as the browser's own arrow keys do, so `DataTable`'s `WidestOnTablet` proves the box is reachable (it takes focus by Tab) rather than that the arrows scroll it.
