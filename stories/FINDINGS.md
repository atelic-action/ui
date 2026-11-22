# Findings

The bugs the stories exposed, each fixed in `src/` by a later pass. A line names the issue id the stories carry (`knownIssues("<id>")` for an accessibility rule scoped off the failing elements, `knownBug("<id>", ...)` for a behavior check expected to fail), the component, the stories, what fails, and the rule id or the reproduction. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css` (`--primary` `#fc4a1a` on `--surface` `#f6f1e7`). When a fix lands, delete the line, the entry in `support/known-issues.ts`, and every marker; `grep -rn known-issue stories` lists them.

## Accessibility

- `white-on-primary`: `Button`, `PrimaryButton`, `SiteHeader`, `SiteMenu`, `StickyCTABar`, `ContactDock`, `SiteShell`, `Hero` (every story rendering a primary button or the dock). Rule `color-contrast`. `.btn-primary` paints its words a literal `#fff` (`styles/primitives.css`), as do the dock's launcher `.cd-launch` and its panel head `.cd-head`, `.cd-title`, `.cd-sub` (`styles/chrome.css`, the subtitle `color-mix(#fff 90%)`): 3.42:1 on the primary at 16 to 18px bold, under 4.5:1, and the literal breaks Component Rule 3, so no theme can fix it. Inside `.on-primary` the button flips to primary words on the surface, 3.04:1, which the same marker covers.
- `primary-text-contrast`: `SiteHeader` (every grouped story), `LinkColumns` (the heading's eyebrow). Rule `color-contrast`. Small text colored `var(--primary)` on the page surfaces: the group control holding the current page (`.nav-group-btn.is-current`) at 3.04:1 on `--surface`, the eyebrow at 2.8:1 on `--surface-alt`, and the same token on `.nav-links > a.active` and a current panel link. The contract has no text safe accent token (a `--primary-text` a theme can darken), so a bright brand primary cannot be both the fill and the words.
- `on-primary-contrast`: `CalloutPanel` (every story), `Hero` (`Split`, `SplitPhone`, `SplitNoPhoto`). Rule `color-contrast`. White and near white words on the primary field: the callout titles (`#fff` literal, 3.1:1 at 21.6px) and subtitles (`color-mix(#fff 88%)`, 2.93:1), the split hero's eyebrow (2.87:1), subtitle (3.1:1), and ghost button (3.42:1). Worst: the title's `em.serif` accent reads `--primary-bright` on the primary field, 1.38:1, nearly invisible.
- `tile-lockup-name`: `BrandLockup` (`Tile`). Rule `label-content-name-mismatch`. With `logo.tile`, the tile's letter runs into the wordmark in the visible text ("KKestrel Hollow"), which the link's name ("Kestrel Hollow Bakehouse home") does not contain, so a voice user saying what they see misses.
- `footer-heading-order`: `Footer` inside `SiteShell` (`InteriorPagePhone`). Rule `heading-order`. The column headings are always `h4`, so a page whose last heading is an `h1` or `h2` skips levels into the footer.
- Email faint ink: `Masthead` (every story, marked `a11y: { test: "todo" }` because an inline styled row carries no class to scope a rule by). Rule `color-contrast`. The atelic palette's `faint` (`#8a8272`) on its `ground` (`#f6f1e7`), 3.38:1 at 11px, on the masthead's title and meta.

## Behavior

- `sticky-bar-covers-closing-bar`: `SiteShell` (`FullPagePhone`). On a phone scrolled to the bottom, the sticky CTA bar sits over the closing bar, so the copyright and the practice's credit can never be read or tapped: nothing pads the page's foot by the bar's height. Reproduce: a phone width page with the sticky bar showing, scrolled to the end; the copyright's box ends below the bar's top.
- `flat-current-link-unmarked`: `SiteHeader` (`FlatNav`). A flat bar link on the current page carries `aria-current="page"` and no visual mark, while a group holding the current page turns primary (`.is-current`) and a current panel link does too. No rule in `styles/chrome.css` reads `.nav-links > a[aria-current]`; the scroll spy's `.active` is the only state styled. Probably an omission; confirm the intent before fixing.

## Observed, Not Yet Marked

- `ContactDock`: while open, the launcher's words become "Close" and the panel's own close button is also named "Close", so a screen reader lists two controls with one name. The stories tell them apart by `aria-expanded`. A distinct name for one of them (the launcher's `closeLabel` default, say "Close the contact panel") fixes it.

## Checker Limits (Not Bugs)

- `checker-transparent-header`: `SiteShell` (every story). On a page taller than the screen, axe scrolls the page as it measures, synchronously, so the transparent header never hears the scroll and is judged, still clear, against the page below the hero (1.12:1). The header's contrast over a hero is checked where it is true, in `SiteHeader`'s `Transparent` story, which is one hero tall.
