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
| `@atelic-action/ui/components` | `NotFound` and its prop types (see [The Not Found Page](#the-not-found-page)) |
| `@atelic-action/ui/email` | The email components, the theme provider, the plain text helpers, and their prop types (see [Email](#email)) |
| `@atelic-action/ui/email/render` | `renderEmail` and `renderFailureEmail`, the only entry that imports `react-dom/server` |
| `@atelic-action/ui/tokens` | `Palette`, `atelicPalette`, `Fonts`, `atelicFonts`, `toThemeCSS`, `themeTokenMap` |
| `@atelic-action/ui/hooks` | `useScrollSpy` and its `PageStop` type |
| `@atelic-action/ui/routing` | `staticNotFoundRouting`, the router options behind the not found page |
| `@atelic-action/ui/styles/base.css` | Resets, the `.mkt` canvas, typography, and layout helpers |
| `@atelic-action/ui/styles/chrome.css` | Styles for everything under `chrome` |
| `@atelic-action/ui/styles/components.css` | Layout defaults for everything under `components` |

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

`renderEmail` builds the document shell itself and puts only the rows through React, because React emits no doctype, React 19 hoists and reorders head tags, and it would escape the `>` in `details>summary`. `renderFailureEmail` is the same shell around `FailurePage`. Both live at `@atelic-action/ui/email/render`, apart from the components, so a site that mounts a component on a page never pulls React's server renderer into its browser bundle.

### The Mapping

Where the jq takes a pre rendered html string (`$rows`, `$body_html`, `$cells_html`, a records cell's `html`, a stat's caption), the React prop is `children` or a `ReactNode`. Where the jq escapes a string argument, the prop is a plain string and React does the escaping.

| jq Function | Component | Props |
|---|---|---|
| `eyebrow` | `Eyebrow` | `text` |
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
| `stat_strip` | `StatStrip` | `stats` |
| `records` | `Records` | `columns`, `rows`; a cell's `html` is a `ReactNode` |
| `masthead` | `Masthead` | `title`, `wordmark` (defaults to `atelic`) |
| `title_card` | `TitleCard` | `eyebrowText`, `headlineLines`, `lede`, `stats` (the rows under the lede, in place of the jq's `$stats_html`) |
| `footer` | `Footer` | `meta` |
| `page` | `renderEmail` | `title`, `preheader`, `children`, `palette`, `fonts` |
| `failure_page` | `renderFailureEmail`, or `FailurePage` as body rows | `runnerTitle`, `eyebrowText`, `reason`, `logTail` |

The plain text alternative part ports as plain functions with no React anywhere in them: `spaces`, `rpad`, `lpad`, `wrap`, `textRule`, `textSection`, `textRead`, `textBar`, `textTarget`, `textTableGrid`, `textTable`, plus `asciiUpcase` and `asciiDowncase`. Every width counts Unicode codepoints, the way jq's `length` does.

`tst/email/expected/` holds frozen goldens generated from the jq library, and the component tests compare the rendered DOM against them. See that folder's README before touching one.

### Tokens

`@atelic-action/ui/tokens` carries the palette and the font stacks with no React import, so a build script or a plain text renderer can read them. `toThemeCSS(palette)` writes the palette out as the site token declarations (`--surface`, `--surface-dark`, `--card`, `--ink`, `--primary`), and `themeTokenMap` exposes which palette key each token takes.

## Releasing

1. Bump `version` in `package.json` and merge it to `main`: patch for a fix, minor for a new component or prop, major for a breaking prop or class rename.
2. Tag the merged commit `vX.Y.Z` with the same version and push the tag:

   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

3. The Publish workflow checks that the tag matches the version, runs the gates, and publishes to npm with provenance. It authenticates through npm trusted publishing (the package's Trusted Publisher names this repo and `publish.yml`, and its allowed actions must permit direct `npm publish`, since a configuration created after 2026-09-03 allows only `npm stage publish` by default), so no token is stored, and it needs npm 11.5.1 or later, which Node 24 ships.
