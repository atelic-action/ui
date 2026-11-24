# Atelic Marketing

The components of an Atelic marketing site, from `@atelic-action/ui`: the page sections, the primitives a page is set in, the site chrome, and the few report components a page can carry. A page is a stack of full width sections between a header and a footer. Content arrives as props; a component holds no copy, no brand value, and no business fact of its own.

This system is produced from the code. `bun run design:build` in `atelic-action/ui` writes every file here, and the session publishes them; a change is made in the package and resynced, never edited on this page.

## The Styles Need the `atelic-ui` Class

Every style and token in this system answers only inside an element with the class `atelic-ui`. Outside it a component falls back to the browser's default fonts and unstyled boxes. There is no wrapper component for this; do one of two things:

- **A whole page:** render it inside `SiteShell`, which puts the class on the page and brings the skip link, the header, the footer, the phone's booking bar, and the contact dock. It takes the site as one `site` object (its name, nav, call to action, phone, address, and hours) and the `currentPath`.
- **Anything less than a page:** put the class on your own root element.

```jsx
const { Hero, FeatureGrid, CTASection } = window.AtelicMarketing;

<div className="atelic-ui">
  <Hero
    eyebrow="Alder Street, since 2014"
    title={<>Bread worth the <em className="serif">early line</em>.</>}
    subtitle="Sourdough, morning buns, and cakes to order."
    primaryCTA={{ label: "Order ahead", href: "/order" }}
  />
  <FeatureGrid eyebrow="What we bake" title="Made in the back of the shop" items={items} />
  <CTASection site={site} title="Come by before we sell out." />
</div>
```

## Compose Sections; Never Rebuild Them

Reach for a section before writing markup. `Hero` opens the home page and `PageHero` an interior page. `SplitSection`, `FeatureGrid`, `FeatureDetail`, `ProcessSteps`, `PricingBand`, `PricingCard`, `ReviewCarousel`, `ReviewWall`, `Gallery`, `FAQBrowser`, `ContactSection`, and `LocationSection` carry the body, and `CTASection` closes every page. `SectionHeading` (eyebrow, title, lead) opens a custom section. Most new sections are `SplitSection`, `SectionHeading`, and primitives together; a new component is earned only by real behavior of its own.

Read a component's README and its `Props` in `index.d.ts` before using it: a wrong prop key renders silently wrong. Acronyms are capitalized in every prop name: `primaryCTA`, `secondaryCTA`, `sourceURL`, never `primaryCta`.

## Styling Your Own Layout Glue

There are no utility classes and no Tailwind. Style with the tokens as CSS variables, inline or in your own CSS, never with a raw hex value.

| Family | Tokens |
|---|---|
| Surfaces | `--surface`, `--surface-alt`, `--surface-inset`, `--surface-dark`, `--card` |
| Text | `--ink`, `--ink-soft`, `--neutral-500`, `--neutral-600` |
| Brand | `--primary`, `--primary-fill`, `--primary-ink`, `--primary-deep`, `--primary-bright`, `--primary-tint`, `--secondary`, `--tertiary` |
| On a ground | `--on-primary`, `--on-dark`, `--on-dark-quiet`, `--on-dark-faint` |
| Tone | `--tone-good`, `--tone-warn`, `--tone-bad`, each with a `-fill` and a `-bg` |
| Type | `--font-sans` (body and headings), `--font-serif` (the italic accent), `--font-mono` (eyebrows, labels, figures), `--font-script` (a sign off) |
| Weight | `--weight-regular`, `--weight-medium`, `--weight-semibold`, `--weight-bold`, `--weight-heavy`, and the rest |
| Shape | `--radius-sm` to `--radius-xl`, `--radius-pill`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--hairline`, `--hairline-strong` |
| Layout | `--max-width`, `--gutter`, `--nav-height` |

A custom section uses the system's own frame: `<section className="section">` for the vertical rhythm, with `<div className="wrap">` inside it for the centered column at the site's `--max-width`. Add `surface-alt` to the section for the alternate band, and `tight-top` or `tight-bottom` to close a gap against its neighbor. A component that draws no band of its own (`FeatureDetail`, `PricingCard`, `ExpandList`, `ComparisonTable`, `RevealSlider`, and every primitive) goes inside that pair. A component never sets a column width of its own; width comes from `.wrap`. The italic serif accent inside a headline is `<em className="serif">`.

## The Primary Does Three Jobs

Each job has its own token, and using the wrong one fails contrast:

- `--primary` is the brand color as a mark: rules, focus rings, icons, stars, dots, and accents that carry no words.
- `--primary-fill` is the primary as a field that carries words: the primary button, the split hero and callout bands, the price band, a badge. The words on it read `--on-primary`.
- `--primary-ink` is the primary as words on `--surface` and `--surface-alt`: the eyebrow, a serif accent, the current nav entry, an inline accent link.

The practice's theme sets them apart (`#fc4a1a`, `#d63a10`, `#b8300b`): white on the fill reads 4.70 to 1, and the ink reads 5.38 to 1 on `--surface`.

## Rules That Bite

- **A page's call to action is `PrimaryButton`, and the one beside it is `SecondaryButton`.** Never pick a `Button` variant and size by hand for a page's action; `Button` stays for a form's submit, a dark surface, and a header's compact button.
- **Media is optional.** A media component takes a `placeholder` shot brief and renders a labeled block when no image is given; `Hero` falls back to a token gradient. Use the placeholder; never invent an image URL.
- **Dark grounds are a prop.** `Chip`, `Eyebrow`, `Bubble`, `Button`, and `SectionHeading` take `onDark` when they sit on `--surface-dark`.
- **A phone number or an email address is always a link.** `PhoneLink` and `EmailLink` build them; never set either as plain text.
- **Icons come from the components.** No emoji and no hand drawn icons; a component brings its own.
- **Links are plain anchors.** Pass `href`; there is no router, and the current page arrives as `currentPath`. A booking or contact action is a link out.
- **No entrance animations.** Nothing fades or slides in on scroll, by decision.
- **The chrome is phone aware.** `StickyCTABar` shows only under 900px wide. `SiteHeader` is fixed to the top of the page and opens `SiteMenu`, the full screen menu, from its burger.

## Where the Truth Lives

The package's own README is the source: its Theme table holds every token with the practice's value and what it colors, and its Tokens section holds every optional token with its default. `components/bundle.css` holds every component style and the practice's theme under `.atelic-ui`, layered so a site's own unlayered rule wins. Each component's card renders its primary story from the package's Storybook, so a card shows exactly what the package's tests run.

## The Producer

`design/` in `atelic-action/ui` holds the producer. A card's story is the first story in the component's story file unless `design/cards.json` names another, in the shape `{"<Component>": {"story": "<StoryExport>", "args": {…}, "group": "<group>", "height": <px>, "width": <px>}}`, every key optional, `args` laid over the story's own; an entry is added only where the first story makes a poor card. A card's width is the viewport its story pins (1280 desktop, 820 tablet, 390 phone, else 1200), and its height is measured by the render check, or held at that viewport's height when the story's height follows the viewport.

### Publishing a Sync

The system in Claude is the Design System artifact at `claude.ai/artifact/XjFif4GuiTgDxvZk8EcdTh`, and the session publishes it with the Artifact tool after `bun run design:build` and `bun run design:check` are green; `design/out/publish-plan.json` names every file. The mechanics that bit on the first sync (2026-11-24):

1. Read the artifact by its URL right before publishing, even after reading its files by path; a publish to a version the session has not read is refused.
2. Publish in batches of at most 255 paths, removals counted, with `root` set to `design/out` and every path under `project/`. `components/index.d.ts` goes with `contentType` `text/plain`, since a `.ts` name is not served on its own.
3. Removals are `null` entries against the live file listing, never against a map of where files were meant to go; the first sync deleted the old two level layout (`components/<group>/<Name>/…`, `_preview/`, `_vendor/`, `_ds_bundle.*`, the old fonts) this way.
4. The index, `project/design-system.json`, goes once, as the `file_path` of the last call: the live one read back, `source` removed, `namespace`, `libraries`, `lastChange`, and `"editing": "code"` set, every other key kept. The build empties `design/out`, so write the merged index after the build, from `design/out/index.proposed.json`.

A canvas uses the system by installing it under its own `project/ds/<folder>/` with a record in its `canvas.json`, as the Design type prescribes; the canvas runtime is React 18, which drops a `ref` prop, so a component that takes one (`Footer`, `ClosingBar`) is laid out by hand there until ATE-854 lands.
