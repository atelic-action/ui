# Findings: Primitives, Components, and Artifact

The bugs the stories of the primitives, the components, and the artifact pieces exposed (`stories/primitives/`, `stories/components/`, `stories/artifact/`), each fixed in `src/` by a later pass. Written only by that group's writer; the format is in `stories/README.md`. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css` (`--primary` `#fc4a1a` on `--surface` `#f6f1e7`), which sets no `--on-primary`.

## Accessibility

- `primary-button-contrast`: `Button`, `PrimaryButton`, and every story elsewhere that renders a primary button (`SiteHeader`, `SiteMenu`, `StickyCTABar`, `SiteShell`, `Hero`). Rule `color-contrast`. `.btn-primary` sets `--on-primary` on `--primary`: 3.42:1 at 16 to 18px bold, under 4.5:1. Since 8.0.0 the color is a token, no longer a literal, so a theme can fix it by setting `--on-primary`; the default white fails on any bright primary, and the practice's palette sets none. Inside `.on-primary` the button flips to primary words on the surface, 3.04:1, which the same marker covers.
- `eyebrow-contrast`: `Eyebrow` inside `SectionHeading`, in `LinkColumns` (every story). Rule `color-contrast`. The eyebrow is colored `--primary`, 2.8:1 on `--surface-alt` at 11.8px. No text safe accent token exists for a theme to darken.

## Behavior

None yet.

## Observed, Not Yet Marked

- `ProseBlocks` lightbox: its backdrop reads `var(--shade)`, which only `styles/components.css` defines (on `:where(.atelic-ui)`). A site or app that loads `primitives.css` without `components.css` gets no `--shade`, and the backdrop paints nothing. Whether a `::backdrop` sees the custom property at all depends on the browser letting it inherit from its dialog (Chromium 122 and later). No story renders the lightbox yet; `ProseBlocks` is owed.
