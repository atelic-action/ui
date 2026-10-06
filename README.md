# @atelic-action/ui

Shared UI for the Atelic templates: the site chrome (header, menu, footer, sticky CTA bar, and credit band), the not found page and the routing that keeps it alive, the scroll spy hook, and the one base stylesheet. The marketing and artifact templates install it instead of carrying their own copies, so a chrome fix lands once and every site picks it up with `bun update`.

The package ships source, not a build. Its TSX and CSS arrive as written and compile inside each site's own Vite.

## Install

```bash
bun add @atelic-action/ui
```

Peer dependencies: `react` and `react-dom` at `^19.0.0`, and `lucide-react` at `^1.23.0`.

## Vite Config

Prerendering and server rendering have to compile the package too, so keep it out of Vite's SSR externals. That is the one line a consumer adds:

```ts
// vite.config.ts
export default defineConfig({
	ssr: { noExternal: ["@atelic-action/ui"] },
});
```

## CSS Import Order

Import the stylesheets in this order, from the root route or the site's base sheet:

1. The site's fonts (`fonts.css`)
2. `@atelic-action/ui/styles/base.css`
3. `@atelic-action/ui/styles/chrome.css`
4. `@atelic-action/ui/styles/components.css`
5. The site's own CSS
6. The site's `theme.css`, last

The package sheets sit inside `@layer atelic-ui`, so any rule a site writes outside a layer wins over them whatever its specificity. The package reads the theme tokens (`--ink`, `--surface`, `--primary`, `--nav-height`, and the rest) and defines none, so `theme.css` stays the one file a site edits to rebrand. The chrome's buttons wear the site's own `.btn` classes.

## What Is Inside

| Import | Exports |
|---|---|
| `@atelic-action/ui/chrome` | `SiteHeader`, `SiteMenu`, `Footer`, `CreditBar`, `StickyCTABar`, `BrandLockup`, `SkipLink`, and their prop types |
| `@atelic-action/ui/components` | `NotFound` and the page components (`Checklist`, `DataTable`, `StatRow`, `Callout`, `Collapsible`, `StackedBar`, `ColumnChart`, `ThresholdScale`, `StarRating`), with their prop types (see [The Not Found Page](#the-not-found-page) and [Page Components](#page-components)) |
| `@atelic-action/ui/email` | The email components, the theme provider, the plain text helpers, and their prop types (see [Email](#email)) |
| `@atelic-action/ui/email/render` | `renderEmail` and `renderFailureEmail`, the only entry that imports `react-dom/server` |
| `@atelic-action/ui/tokens` | `Palette`, `atelicPalette`, `Fonts`, `atelicFonts`, `toThemeCSS`, `themeTokenMap` |
| `@atelic-action/ui/hooks` | `useScrollSpy` and its `PageStop` type |
| `@atelic-action/ui/routing` | `staticNotFoundRouting`, the router options behind the not found page |
| `@atelic-action/ui/styles/base.css` | Resets, the `.mkt` canvas, typography, and layout helpers |
| `@atelic-action/ui/styles/chrome.css` | Styles for everything under `chrome` |
| `@atelic-action/ui/styles/components.css` | Layout defaults for everything under `components` |
| `@atelic-action/ui/styles/star-rating.css` | `StarRating`'s styles alone, for an app that wears none of the site chrome; `components.css` already imports it |

Every component renders from props alone. None reads a config file or a router, so a site maps its own config onto the props in its shell:

```tsx
import { Footer, SiteHeader, SkipLink, StickyCTABar } from "@atelic-action/ui/chrome";

<div className="mkt">
	<SkipLink />
	<SiteHeader
		brand={{ name: site.name, logo: site.logo }}
		links={site.nav.map((item) => ({ label: item.label, href: item.to }))}
		primaryCTA={site.cta}
		variant="transparent"
		currentPath={pathname}
	/>
	<main id="main">{children}</main>
	<StickyCTABar primaryCTA={site.cta} phone={site.phone} />
	<Footer brand={{ name: site.name, logo: site.logo }} email={site.email} />
</div>;
```

A sent artifact's header names who the document is for as well as who it is
from: pass `recipient: { src, alt }` on the `brand` (added 0.6.0) and the
lockup reads "atelic × <their mark>", the sender's wordmark and run first, a
quiet times sign, then the recipient's mark at wordmark height. Cut the mark
for the surface the header wears (a light mark for the dark bar) and keep it
an image; the chrome draws no second wordmark. A marketing site's lockup
passes no recipient. The run after the wordmark reads `--brand-accent` when
the theme sets it (a client branded host pins the sender's orange there) and
falls back to `--primary` (0.6.1), and the recipient's mark sits at the same
30 pixel height as the sender's.

The menu is a native `<dialog>` opened with `showModal()`, so Escape, focus containment, and focus return come from the browser.

## The Not Found Page

`NotFound` is the page an unknown path renders: a headline, a row of popular pages, and the closing call to action. It renders the body only, so a site wraps it in its own shell, and it wears the site's own classes (`.page-hero`, `.eyebrow`, `.lead`, `.final-cta`, `.btn`).

On a statically prerendered TanStack Start site the markup is the easy part. The host serves the `/404` prerender for every miss, and the page survives hydration only with three pieces in the site:

1. **A catch all route**, `src/routes/$.tsx`, rendering the site's page (noindexed). Never a dedicated `/404` route: an unknown path then matches only the root, TanStack's hydrate throws, and the page goes blank.
2. **The router options:** `createRouter({ routeTree, ...staticNotFoundRouting(NotFoundPage) })`. A miss hydrates through its pending state first, so pending has to render the same page or React reports a mismatch.
3. **The build:** a `{ path: "/404", prerender: { enabled: true }, sitemap: { exclude: true } }` entry in the Vite `pages` list, and a copy of `dist/client/404/index.html` to `dist/client/404.html`.

```tsx
// src/shared/components/NotFoundPage.tsx
import { NotFound } from "@atelic-action/ui/components";

export function NotFoundPage() {
	return (
		<SiteShell site={site}>
			<NotFound
				title="This page wandered off."
				lead="The link may be old, or the page may have moved."
				links={site.nav.filter((item) => item.to !== "/").map(({ label, to }) => ({ label, href: to }))}
				closing={{ eyebrow: "Back on Track", title: "Let's get you where you were headed." }}
				primaryCTA={site.cta}
			/>
		</SiteShell>
	);
}
```

`staticNotFoundRouting` is for prerendered sites only. On a live app the pending state is a real loading moment and the page would flash through every slow load, so an app sets `defaultNotFoundComponent` alone. A browser test is the only proof any of this works; template-marketing's `e2e/not-found.spec.ts` is the one to copy.

## Email

`@atelic-action/ui/email` is the runner email design as React components, ported one to one from the jq library the runners compose their mail from (homebase `runners/lib/email.jq`). The components are born inline: every layout is a table, every style is an inline style object, and there is no CSS file and no `className`, because Gmail strips a style block and ignores media queries on some accounts. The same components therefore mount on a web page as happily as they render into a mail client.

Colors and fonts come from context, so a client branded email passes its own palette:

```tsx
import { Card, Eyebrow, Footer, Item, Masthead, TitleCard } from "@atelic-action/ui/email";
import { renderEmail } from "@atelic-action/ui/email/render";
import { atelicPalette } from "@atelic-action/ui/tokens";

const html = renderEmail({
	title: "Week 40 Recruiter",
	preheader: "Three roles cleared every filter.",
	palette: { ...atelicPalette, accent: "#0B6E4F" },
	children: (
		<>
			<Masthead title="Recruiter" />
			<TitleCard
				eyebrowText="Week 40"
				headlineLines={["Three cleared", "every filter."]}
				lede="Two of them are remote."
			/>
			<Eyebrow text="Shortlist" />
			<Card>
				<Item
					name="Pinewood Cabinetry"
					right="4.5"
					subparts={["Staff engineer", "Remote"]}
					body="They answered inside a day."
					linkText="Posting"
					url="https://example.test/posting"
					last
				/>
			</Card>
			<Footer meta="Run 2026-10-05" />
		</>
	),
});
```

### Mobile First

Runner emails are mobile first. A layout that squashes on a phone is fixed here, in the components every runner shares, never in a report page. A fixed column table is for numbers alone and never carries a name; names go in a `RecordStack`.

`RecordStack` takes `records`, each a `RecordStackItem` (`title`, `url`, `meta`, `note`, `badge`, `callout`), and renders one table row per record: the title on its own line at 15px, bold and wrapping freely, linked when `url` is set; a mono meta line beneath it with the items joined by middle dots (empty items drop); an optional note beneath that; a hairline between records and none after the last. No cell carries a width, so a name of any length wraps at 320 pixels instead of squashing. An optional `badge` (a stage word such as `"Contacted"`) sits on the title line in a small mono uppercase pill on a `line` hairline, in its own right aligned unbroken cell, so the title keeps wrapping beside it and the badge stays on the title's first line. An optional `callout` (`{ eyebrow, text }`) sets a short task under the meta and the note in the accented `Note` idiom: the eyebrow in the accent, the text at 13px, and a 2px accent rule down its left edge. A record with neither renders exactly as it did before. `recordStackText(records)` is its plain text twin: each title on its own line under a two space indent with any badge after it in square brackets (`Blue Heron Plumbing [Contacted]`), the meta and the note wrapped under a four space indent, any callout as its eyebrow in upper case over its text under that same indent, a blank line between records, and no line past `textWidth` (68 columns, indent included).

The Company Cards additions (0.7.0, from the `Company Cards IA` design, 2026-09-29) ride on the same item and change nothing for a record without them. `badges` is a list of further pills after `badge`, each with a `tone`: `faint` is the quiet stage word, `ink` a bold pill in ink on a 1.5px border (the next touch), `accent` the same in the accent (New). `timeline` (`{ days, touches, opens }`, each day count back from today) draws the record's recent days between the title and the meta line as one table cell per marked day and one per run of empty days between them (seven cells for three marks, never thirty, since Gmail clips a message past about 100 KB), an 8px ink square on each send day and a 5px accent dot on each known open day, the two stacked when they share a day, all standing on a `line` hairline with a 1.5px ink tick at today's edge and an axis row beneath (`30d` on the left, `today` on the right); nothing is positioned, so it survives Gmail. `RecordTimelineStrip` renders one on its own and `RecordTimelineLegend` names the marks once above a list. `aside` (`{ text, strong, tone }`) sets a fact right on the meta line with its number in bold and colored by tone: `up` fresh, `warm` cooling, `accent` cold. In the text twin every pill follows the title in brackets, the timeline is one character per day (`10d [#······@·o|]`: `#` a send, `o` an open, `@` both, `·` nothing, `|` today), and the aside ends the meta line; `recordTimelineText` and `recordBadges` are the helpers it uses.

`StatStrip` lays its stats out as inline block cells with an 88 pixel floor inside one centered cell, so six or seven stats flow onto a second row on a phone rather than shrinking. Each stat takes an optional `delta` (`"+3 (12%)"`), set small under its label and colored by its sign: one that opens on `+` wears the palette's `up`, one that opens on `-` its `down`, and anything else stays muted.

`Masthead` takes an optional `meta` (`"Week 39 · 09/21 to 09/27"`) set in the eyebrow style at the right end of the row, so the title card no longer carries the week. It is a right aligned, unbroken block floated after the wordmark and title: on the same line while the row has room, and dropped under the title on its own line, still right aligned, when it does not (checked at 320 pixels). `Eyebrow` takes `strong`, which sets the label at 15px and weight 700 in ink rather than faint, with a slightly tighter tracking, so a section such as `MQL · 15` reads as a heading on a phone.

```tsx
const records = [
	{
		title: "Pinewood Cabinetry",
		url: "https://example.test",
		meta: ["Lead", "Longmont", "fit 14"],
		note: "Answered the audit inside a day.",
		badge: "Contacted",
		callout: { eyebrow: "Next", text: "Walk the Business Profile findings Thursday." },
	},
];

<Masthead title="Pipeline" meta="Week 39 · 09/21 to 09/27" />;
<Eyebrow text="MQL · 15" strong />;

<Card>
	<Row last={false}>
		<StatStrip stats={[{ n: 6, label: "Lead", delta: "+3 (12%)" }, { n: 2, label: "MQL", delta: "-1 (4%)" }]} />
	</Row>
	<Row last>
		<RecordStack records={records} />
	</Row>
</Card>;

const text = recordStackText(records);
```

`renderEmail` builds the document shell itself and puts only the rows through React, because React emits no doctype, React 19 hoists and reorders head tags, and it would escape the `>` in `details>summary`. `renderFailureEmail` is the same shell around `FailurePage`. Both live at `@atelic-action/ui/email/render`, apart from the components, so a site that mounts a component on a page never pulls React's server renderer into its browser bundle.

### The Mapping

Where the jq takes a pre rendered html string (`$rows`, `$body_html`, `$cells_html`, a records cell's `html`, a stat's caption), the React prop is `children` or a `ReactNode`. Where the jq escapes a string argument, the prop is a plain string and React does the escaping.

| jq Function | Component | Props |
|---|---|---|
| `eyebrow` | `Eyebrow` | `text`, `strong` (added 0.5.0, no jq counterpart) |
| `card` | `Card` | `children` |
| `fold` | `Fold` | `summary`, `children` |
| `big_fold` | `BigFold` | `summary`, `count` (a `ReactNode`, absent for the jq's `""`), `children` |
| `title_line` | `TitleLine` | `name`, `right` |
| `item` | `Item` | `name`, `right`, `subparts`, `body`, `foldLabel`, `foldBody`, `linkText`, `url`, `last` |
| `note` | `Note` | `eyebrowText`, `text`, `accented`, `last` |
| `empty_row` | `EmptyRow` | `text` |
| `stat` | `Stat` | `n`, `caption` (a `ReactNode`: the jq takes raw html here) |
| `stats_row` | `StatsRow` | `children`, the `Stat` cells |
| `list` | `List` | `fontSize`, `children` |
| `list_row` | `ListRow` | `children` |
| `lead_row` | `LeadRow` | `lead`, `rest` |
| `row` | `Row` | `last`, `children` |
| `fold_row` | `FoldRow` | `last`, `children` |
| `mono_table` | `MonoTable` | `headers`, `rows` |
| `bar` | `Bar` | `logged`, `target` |
| `group_row` | `GroupRow` | `text`, `first` |
| `target_row` | `TargetRow` | `text`, `logged`, `target` (null is a count with nothing to measure it against), `note`, `last` |
| `scoreboard` | `Scoreboard` | `children`, the `GroupRow` and `TargetRow` rows |
| `what_moved` | `WhatMoved` | `items`, `note` |
| `read_block` | `ReadBlock` | `text`, `divider` |
| `sub_eyebrow` | `SubEyebrow` | `text` |
| `badge` | `Badge` | `letter` |
| `day_strip` | `DayStrip` | `days`, `last` |
| `stat_strip` | `StatStrip` | `stats`, each with an optional `delta` colored by its sign (the component wraps where the jq does not) |
| none | `RecordStack` | `records`, each with an optional `badge`, `callout`, and since 0.7.0 `badges`, `timeline` and `aside` (born here on 2026-09-24, with no jq counterpart) |
| `records` | `Records` | `columns`, `rows`; a cell's `html` is a `ReactNode` |
| `masthead` | `Masthead` | `title`, `wordmark` (defaults to `atelic`), `meta` (added 0.5.0, no jq counterpart) |
| `title_card` | `TitleCard` | `eyebrowText`, `headlineLines`, `lede`, `stats` (the rows under the lede, in place of the jq's `$stats_html`) |
| `footer` | `Footer` | `meta` |
| `page` | `renderEmail` | `title`, `preheader`, `children`, `palette`, `fonts` |
| `failure_page` | `renderFailureEmail`, or `FailurePage` as body rows | `runnerTitle`, `eyebrowText`, `reason`, `logTail` |

The plain text alternative part ports as plain functions with no React anywhere in them: `spaces`, `rpad`, `lpad`, `wrap`, `textRule`, `textSection`, `textRead`, `textBar`, `textTarget`, `textTableGrid`, `textTable`, `recordStackText`, `textWidth`, plus `asciiUpcase` and `asciiDowncase`. Every width counts Unicode codepoints, the way jq's `length` does.

`tst/email/expected/` holds frozen goldens generated from the jq library, and the component tests compare the rendered DOM against them. See that folder's README before touching one.

### Tokens

`@atelic-action/ui/tokens` carries the palette and the font stacks with no React import, so a build script or a plain text renderer can read them. `toThemeCSS(palette)` writes the palette out as the site token declarations (`--surface`, `--surface-dark`, `--card`, `--ink`, `--primary`), and `themeTokenMap` exposes which palette key each token takes.

The palette carries three optional keys beyond the jq's eight: `up` (`#2F7A4B`, a calm green) and `down` (`#B23A2E`, a calm red, kept well apart from the orange accent), the colors a `StatStrip` delta wears by its sign, and `warm` (`#B7791F`, an amber between `up` and the accent) for a record's aside that is cooling but not cold. All three read on the cream card. They are optional so a client palette written before 0.5.0 still compiles, and a palette without them borrows the Atelic values. None maps to a site token.

## Page Components

The blocks a page composes, each styled in `styles/components.css` inside the `atelic-ui` layer, so a site's own unlayered rule resizes or recolors any of them. They were cut from the SkySpec baseline writeup on 2026-10-02 (ATE-600), which is the worked example of all eight on one page.

| Component | What it is | Notes |
|---|---|---|
| `Checklist` | A short list of checks, each passed or failed | Two columns when there is room, one on a phone. `passLabel` and `failLabel` name the icons for a screen reader |
| `DataTable` | A table whose first column names each row, sortable by any column marked `sortable` | A click on a heading sorts on a wide screen. On a phone each row stacks, every fact wearing its column's label, and a dropdown sorts. A cell is a node, or `{ display, sort }` when what it shows is not what it sorts by; a formatted number in a string (`"$12,047"`, `"0.24%"`) sorts as a number. It renders in `defaultSort` on the server |
| `StatRow` | A row of large figures, each over what it counts and its `period` | `trend` draws an arrow before a figure that is itself a change. `deltas` list comparisons beneath: an arrow, how far, against what (`basis`), and the earlier figure (`was`), each in its own tone, since a spend falling and a cost falling read differently |
| `Callout` | One finding: an icon in its tone beside the title, the explainer under it | `variant="box"` sets it apart on a tinted ground, for something missing or owed |
| `Collapsible` | A labeled line the reader opens for the detail behind it | A native `details`, so it works before any script loads and find in page opens it. `summary` carries the point, so the detail needs no explaining once open. It prints open |
| `StackedBar` | One bar split into the parts of a whole, with a key | A part of zero is keyed and not drawn |
| `ColumnChart` | A bar a period, the periods in groups that carry a label and a total | Months in quarters is the case it was cut for: a quarter reads against the one before it and the same one a year earlier |
| `ThresholdScale` | Zones on a scale and a pin for each reading | For a number judged against lines, like a load time against good and poor |
| `StarRating` | A row of stars showing a rating in half star steps, and taking one when given `onChange` | Each star is two hit targets; picking the current rating clears it. Editable, it is one slider to a keyboard and a screen reader; read only, a picture named by the rating. `fillColor` and `outlineColor` take any CSS color, `size` and `max` set the star and the scale |

**StarRating outside a site.** It is the one component that does not sit under `.mkt` or read a theme token: its styles are in `styles/star-rating.css`, and its two colors are the `--star-fill` and `--star-outline` custom properties, falling back to the text color and a faint tint of it. An app that installs the package for this component alone imports that one sheet, not `components.css`.

**A part's own color.** `StackedBar` takes a `color` on a segment, any CSS color, for parts that are not good or bad (the protein, carbs, and fat of a meal), and it wins over `tone`. `showKey={false}` draws the bar alone for a page that keys the parts its own way; the bar keeps its spoken summary.

**Tones.** `good`, `warn`, `bad`, `info`, and `muted` are the one palette the package carries, because good, a warning, and broken read green, amber, and red whatever the brand is. A component sets `data-tone`, and `--tone`, `--tone-fill`, and `--tone-bg` follow for whatever sits inside. A site's theme may restate `--tone-good` and the rest on `.mkt`; `info` and `muted` come from the theme's own primary and neutral tokens.

## In an App

The page components also work in an app that has its own base styles (Tailwind, shadcn) and wears none of the site chrome. Three things make that so (0.10.0):

1. **A second scope.** Every rule in `styles/components.css` answers to `.atelic-ui` as well as `.mkt`. `.atelic-ui` has no resets behind it, so an app puts the class on the region that holds a package component and nothing else in it restyles. Prefer a region to `body`: the components use plain class names (`.stat .num`, `.callout`, `.note`), and an app with markup of its own under those names would have a page wide scope reach it. `body` is right only for an app that has checked it has none, and it is the one way to cover a component rendered in a portal.
2. **The app imports one sheet**, `@atelic-action/ui/styles/components.css`, and neither `base.css` nor `chrome.css`. An app's own unlayered CSS always wins over the package. With Tailwind, where the app can declare the layer order before Tailwind loads, `@layer theme, base, atelic-ui, components, utilities;` keeps utilities winning over the package too; where it cannot, the package's layer lands last and wins over utilities set on a package element, which only matters to a caller styling one with a utility class.
3. **The app maps its tokens** onto the ones the components read, in its own stylesheet on the same scope:

| Token | What it colors |
|---|---|
| `--ink`, `--ink-soft` | Text and quieter text |
| `--neutral-100`, `--neutral-200`, `--neutral-500` | Hairlines, tracks, and captions |
| `--surface-alt` | The quiet ground behind a muted tone |
| `--ui-primary` (falls back to `--primary`), `--primary-bright`, `--primary-tint` | The accent, its brighter fill, and its tint |
| `--ui-card` (falls back to `--card`) | A raised surface |
| `--font-sans`, `--font-mono`, `--radius-sm` | Type and the small radius |
| `--tone-good`, `--tone-warn`, `--tone-bad`, each with `-fill` and `-bg` | Optional: the package defines these, and a dark theme restates them |

`--ui-primary` and `--ui-card` exist because an app's own `--primary` and `--card` may hold something else: shadcn keeps bare HSL channels there, which are not a color on their own. A site sets neither and nothing changes.

```css
/* app.css */
.atelic-ui {
	--ink: hsl(var(--foreground));
	--ink-soft: hsl(var(--muted-foreground));
	--neutral-500: hsl(var(--muted-foreground));
	--neutral-200: hsl(var(--border));
	--neutral-100: hsl(var(--muted));
	--surface-alt: hsl(var(--muted));
	--ui-primary: hsl(var(--brand));
	--ui-card: hsl(var(--card));
}
```

`StarRating` needs none of this: its sheet is unscoped and reads no token. The chrome (`SiteHeader`, `Footer`, and the rest) and `NotFound` remain site shaped and are not meant for a signed in app.

## The Gallery

`gallery/` is one static page, The Components, that shows every page component on its own with made up data for a fictional bakery, wearing the practice's own palette and type. It lives at [ui.atelic.me](https://ui.atelic.me), noindexed and disallowed in its `robots.txt`, since it is for the people building with the package and never search inventory. It imports the components and stylesheets from `src/` by relative path rather than from npm, so it always shows the code in the repo, and it reads the package name and version from `package.json` at build time. It sits outside `src/`, so it is never published.

```bash
bun run gallery:dev    # a dev server on the repo's own source
bun run gallery:build  # the static page, written to gallery/dist
```

`vercel.json` builds it the same way and serves `gallery/dist`. Typecheck and lint cover it, and CI builds it, so a component change that breaks the gallery fails CI. **A new page component gets a gallery section in the same change**, with each of its meaningfully different forms shown.

## Releasing

1. Bump `version` in `package.json` and merge it to `main`: patch for a fix, minor for a new component or prop, major for a breaking prop or class rename.
2. Tag the merged commit `vX.Y.Z` with the same version and push the tag:

   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

3. The Publish workflow checks that the tag matches the version, runs the gates, and publishes to npm with provenance. It authenticates through npm trusted publishing (the package's Trusted Publisher names this repo and `publish.yml`, and its allowed actions must permit direct `npm publish`, since a configuration created after 2026-09-03 allows only `npm stage publish` by default), so no token is stored, and it needs npm 11.5.1 or later, which Node 24 ships.
