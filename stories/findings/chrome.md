# Findings: Chrome

The bugs the chrome's stories exposed (`stories/chrome/`, and the setup's in `stories/foundations/`), each fixed in `src/` by a later pass. Written only by the chrome's writer; the format is in `stories/README.md`. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css` (`--primary` `#fc4a1a` on `--surface` `#f6f1e7`), which sets no `--on-primary`, so the package's default white stands.

## Accessibility

- `dock-on-primary-contrast`: `ContactDock` (every story), `SiteShell` (every story). Rule `color-contrast`. The launcher (`.cd-launch`) and the panel head (`.cd-head`, `.cd-title`, `.cd-sub`) set `--on-primary` on `--primary`: 3.42:1 for the words, 3.02:1 for the subtitle's 90% mix. Since 8.0.0 the color is a token, so a theme can fix it by setting `--on-primary`; the default white fails on any bright primary, and the practice's palette sets none.
- `nav-current-contrast`: `SiteHeader` (every grouped story). Rule `color-contrast`. Small text colored `--primary` on `--surface`: the group control holding the current page (`.nav-group-btn.is-current`) at 3.04:1, and the same token on `.nav-links > a.active` and a current panel link. The contract has no text safe accent token a theme can darken, so a bright primary cannot be both the fill and the words.
- `nav-badge-contrast`: `SiteHeader` (the sectioned stories). Rule `color-contrast`. A panel link's badge (`.nav-mega-badge`) is `--on-primary` on `--primary` at 10.5px: 3.42:1.
- `nav-feature-eyebrow-contrast`: `SiteHeader` (the sectioned stories). Rule `color-contrast`. The feature card's eyebrow reads `--primary-bright` on the card's deep primary: 1.89:1.
- `nav-row-highlight-contrast`: `SiteHeader` (the sectioned stories). Rule `color-contrast`. The highlighted icon row's label and line are `--on-primary` on `--primary`: 3.42:1.
- `tile-lockup-name`: `BrandLockup` (`Tile`). Rule `label-content-name-mismatch`. With `logo.tile`, the tile's letter runs into the wordmark in the visible text ("KKestrel Hollow"), which the link's name ("Kestrel Hollow Bakehouse home") does not contain, so a voice user saying what they see misses.
- `footer-heading-order`: `Footer` inside `SiteShell` (`InteriorPagePhone`). Rule `heading-order`. The column headings are always `h4`, so a page whose last heading is an `h1` or `h2` skips levels into the footer.

## Behavior

- `sticky-bar-covers-closing-bar`: `SiteShell` (`FullPagePhone`). On a phone scrolled to the bottom, the sticky CTA bar sits over the closing bar, so the copyright and the practice's credit can never be read or tapped: nothing pads the page's foot by the bar's height. Reproduce: a phone width page with the sticky bar showing, scrolled to the end; the copyright's box ends below the bar's top.
- `flat-current-link-unmarked`: `SiteHeader` (`FlatNav`). A flat bar link on the current page carries `aria-current="page"` and no visual mark, while a group holding the current page turns primary (`.is-current`) and a current panel link does too. No rule in `styles/chrome.css` reads `.nav-links > a[aria-current]`. Probably an omission; confirm the intent before fixing.
- `panel-picture-card-current`: `SiteHeader` (`CurrentPictureAndCard`). On the desktop panel a picture link and a card link never set `aria-current`, though the group control turns current for their pages (`groupHrefs` counts them) and a link column's links and icon rows do set it.
- `unknown-section-kind-crashes`: `SiteHeader` (`UnknownSectionKind`). A panel section whose `kind` is none of the four (a typo, or a kind a newer package adds) falls through to the cards' drawing, reads `section.cards.map` of undefined, and crashes the whole header, on every page, at prerender.
- `one-cut-mark-untinted`: `BrandLockup` (`OneCutOnTheDarkBar`). A logo given one cut alone (`onLight` only, or `onDark` only) is drawn as given on every surface, so the ink cut stands untinted on the dark bar and over a hero, and a light cut on the light bar.
- `header-footer-mark-disagree`: `Footer` (`SameConfigAsTheDarkHeader`). One logo config resolves differently in the two places: the header uses the cuts and ignores `src` once one is set, while the footer draws `onDark ?? src ?? onLight`. With `src` and `onLight` the dark header draws the ink cut and the dark footer draws `src`, two different marks on two dark surfaces.
- `empty-lockup`: `BrandLockup` (`NoWordmarkAndNoMark`). `wordmark: false` with no mark (no `src`, no cut, no tile) leaves the header's link with nothing on screen: a named link a sighted reader cannot see or tap.
- `artifact-sheet-mark-height`: `BrandLockup` (`WideWordmarkImage`). `styles/artifact.css` still pins `.atelic-ui .nav-logo .mark` at `height: 20px`, a rule from before `--brand-mark-height`, so on any site that imports the artifact sheet (every artifacts site) every header mark is 20px and the theme's mark height does nothing. The fix is in the artifact sheet, owned by the primitives, components, and artifact writer.

## Observed, Not Yet Marked

- `ContactDock`: while open, the launcher's words become "Close" and the panel's own close button is also named "Close", so a screen reader lists two controls with one name. The stories tell them apart by `aria-expanded`. A distinct name for one (the launcher's `closeLabel` default, say "Close the contact panel") fixes it.
- `NavMegaPanel`: the section minimums can overflow the card at narrow desktop widths when a picture, cards, and the feature card sit together. `SiteHeader`'s `CrowdedPanel` holds all of them and stays inside the card at 1280; the narrowest desktop the bar shows its groups at is 1180, between the stories' tablet (820) and desktop (1280) pins, so no story reaches the width where it would show.
- `SiteMenu` duplicate keys: a child sharing its parent's href renders no duplicate key (`ChildSharesParentHref` asserts none), since the parent and its children are not siblings in one list. Two children, or two links in one column, sharing an href do clash, keyed by `href` in both `SiteMenu` and `NavMegaPanel`; a config that does that is unlikely but not guarded.

## Checker Limits (Not Bugs)

- `checker-transparent-header`: `SiteShell` (every story). On a page taller than the screen, axe scrolls the page as it measures, synchronously, so the transparent header never hears the scroll and is judged, still clear, against the page below the hero (1.12:1). The header's contrast over a hero is checked where it is true, in `SiteHeader`'s `Transparent` story, which is one hero tall.
