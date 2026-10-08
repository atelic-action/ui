# @atelic-action/ui

Shared UI for the Atelic templates: the site chrome (header, menu, footer, sticky CTA bar, and credit band), the not found page and the routing that keeps it alive, the scroll spy hook, and the one base stylesheet. The marketing and artifact templates install it instead of carrying their own copies, so a chrome fix lands once and every site picks it up with `bun update @atelic-action/ui --latest`.

The package ships source, not a build. Its TSX and CSS arrive as written and compile inside each site's own Vite. The one exception is the access gate's server side, which ships compiled (see [The Access Gate](#the-access-gate)).

## Install

```bash
bun add @atelic-action/ui
```

The package is below 1.0, where a caret range admits patches only, so a site takes a new minor with `bun update @atelic-action/ui --latest`: a plain `bun update` leaves it on the minor it has and reports nothing wrong.

Peer dependencies: `react` and `react-dom` at `^19.0.0`, and `lucide-react` at `^1.23.0`. Three more are optional, needed only by a site whose `vite.config.ts` imports `@atelic-action/ui/vite`: `vite`, `@tanstack/react-start`, and `@vitejs/plugin-react`. The commands the package installs run under `bun`, with `node` for the sealing command.

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
5. `@atelic-action/ui/styles/primitives.css`
6. `@atelic-action/ui/styles/gate.css`, on a site that mounts the access gate
7. `@atelic-action/ui/styles/artifact.css`, on a site that hosts the artifact documents
8. The site's own CSS
9. The site's `theme.css`, last

The package sheets sit inside `@layer atelic-ui`, so any rule a site writes outside a layer wins over them whatever its specificity. The package reads the theme tokens (`--ink`, `--surface`, `--primary`, `--nav-height`, and the rest) and defines none, so `theme.css` stays the one file a site edits to rebrand. The chrome's buttons wear the `.btn` classes, which `primitives.css` defines and a site may restyle.

## What Is Inside

| Import | Exports |
|---|---|
| `@atelic-action/ui/chrome` | `SiteHeader`, `SiteMenu`, `Footer`, `CreditBar`, `StickyCTABar`, `BrandLockup`, `SkipLink`, and their prop types |
| `@atelic-action/ui/components` | `NotFound`, the access gate's `GateLogin` and `Watermark` (with `readCookie`), and the page components (`Checklist`, `DataTable`, `StatRow`, `Callout`, `Collapsible`, `StackedBar`, `ColumnChart`, `ThresholdScale`, `StarRating`, `Disclosure`), with their prop types (see [The Not Found Page](#the-not-found-page) and [Page Components](#page-components)) |
| `@atelic-action/ui/artifact` | `Writeup`, `Report`, `Gate`, `GradeChip`, `SignOff`, `ArtifactShell`, the `ArtifactConfig` types, `buildPageHead`, the reader helpers, `AppErrorBoundary`, `newTabProps`, and their prop types (see [The Artifact Documents](#the-artifact-documents)) |
| `@atelic-action/ui/artifact/readers` | The reader helpers alone, built, for what Node runs as shipped: a site's browser tests |
| `@atelic-action/ui/primitives` | `Button`, `Chip`, `Eyebrow`, `Lead`, `SectionHeading`, and their prop types (see [Primitives](#primitives)) |
| `@atelic-action/ui/email` | The email components, the theme provider, the plain text helpers, and their prop types (see [Email](#email)) |
| `@atelic-action/ui/email/render` | `renderEmail` and `renderFailureEmail`, the only entry that imports `react-dom/server` |
| `@atelic-action/ui/tokens` | `Palette`, `atelicPalette`, `Fonts`, `atelicFonts`, `toThemeCSS`, `themeTokenMap` |
| `@atelic-action/ui/hooks` | `useScrollSpy` and its `PageStop` type |
| `@atelic-action/ui/styles/primitives.css` | Styles for everything under `primitives`, the `.btn` classes included |
| `@atelic-action/ui/styles/gate.css` | Styles for `GateLogin` and `Watermark` |
| `@atelic-action/ui/styles/artifact.css` | Styles for everything under `artifact`: the writeup, the monthly page, the sealed document stage, the grade chip, and the sign off |
| `@atelic-action/ui/vite` | `artifactConfig`, the whole Vite configuration of an artifact site as one call, with `artifactPages`; and `privateChunks`, the Vite plugin that keeps private content in `/assets/doc/`, with `isPrivateContent` and `DOC_DIR` (see [The Artifact Vite Config](#the-artifact-vite-config)) |
| The `bin` commands | Eight commands a site's `package.json` calls by name, from `atelic-check-access` to `atelic-seal-document` (see [The Commands](#the-commands)) |
| `@atelic-action/ui/gate` | `signToken`, `verifyToken`, `safeNext`, `needsSession`, and the token types |
| `@atelic-action/ui/gate/request-link` | `POST`, the handler that emails a sign in link, and `createRequestLink` |
| `@atelic-action/ui/gate/verify` | `GET`, the handler that turns a link into a session |
| `@atelic-action/ui/gate/middleware` | The routing middleware as the default export, and `createMiddleware` |
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

## Primitives

`Button`, `Chip`, `Eyebrow`, `Lead`, and `SectionHeading` are the small pieces a page is set in, the same in every template. Each renders from props and wears a class of the same name (`.btn`, `.chip`, `.eyebrow`, `.lead`, `.section-head`), styled by `primitives.css` from the theme tokens.

```tsx
import { Button, SectionHeading } from "@atelic-action/ui/primitives";

<SectionHeading eyebrow="Pricing" title="One number" lead="Flat and posted." />;
<Button href="/contact" size="lg" arrow>
	Book a visit
</Button>;
```

`Button` is an anchor when it has an `href` and a real button otherwise. It renders the `href` as given: a site served under a base path wraps it once and applies its own prefix there. Its arrow is hidden from the name a screen reader hears.

## The Access Gate

The gate puts a whole host behind an email sign in with no database: a reader on the allowlist asks for a link, the link starts a signed session cookie, and the middleware holds every page and file back from anyone without one. It is opt in and fails open, so a host with no `GATE_SESSION_SECRET` is fully public.

Vercel finds these three files by path, so a site keeps them, each a re export:

```ts
// api/auth/request-link.ts
export { POST } from "@atelic-action/ui/gate/request-link";

// api/auth/verify.ts
export { GET } from "@atelic-action/ui/gate/verify";

// middleware.ts
export { default } from "@atelic-action/ui/gate/middleware";

// The platform reads the matcher from this file and nowhere else. Only the
// two sign in functions skip the middleware; any other function is held.
export const config = { matcher: ["/((?!api/auth/).*)"] };
```

The default middleware holds back everything `needsSession` does: all of a host but the login page, what that page loads (`/assets/` apart from `/assets/doc/`, `/fonts/`, `/brand/`, the favicon and logo), everything under `/api/auth/` (the two sign in functions, and the one place under `/api/` where a host must add nothing private), `robots.txt`, `health.json`, and a website build proxied under `/proto`. A site whose matcher already leaves its open paths out passes its own test, and one whose link opens something other than a document names it:

```ts
import { createMiddleware } from "@atelic-action/ui/gate/middleware";
export default createMiddleware({ needsSession: () => true });

import { createRequestLink } from "@atelic-action/ui/gate/request-link";
export const POST = createRequestLink({ noun: "preview" });
```

| Env | Read by | What it does |
|---|---|---|
| `GATE_SESSION_SECRET` | all three | The signing secret, and the switch: unset, the gate is off. Use 32 random bytes or more |
| `GATE_ALLOWLIST` | all three | Comma separated emails that may receive a link. Taking an address off, then redeploying, refuses its outstanding link and ends its session |
| `RESEND_API_KEY` | request link | The sending only key the link goes out on |
| `GATE_BASE_URL` | request link | The host the link points at; a bare host is read as https, and plain http is refused unless it is local. Unset, production uses the project's own domain and a preview uses the deployment it was asked on |
| `GATE_FROM`, `GATE_SUBJECT`, `GATE_LINK_TTL_MIN` | request link | Sender, subject, and link lifetime in minutes (15, a day at most) |
| `GATE_SESSION_DAYS`, `GATE_WATERMARK_MODE` | verify | Session lifetime in days (7, a year at most), and `pill` or `tiled` |

What it holds to, each with a test in `tst/gate/`:

- Give each host its own secret. A token carries no host, so two hosts sharing a secret would accept each other's sessions.
- Tokens are compact JWTs under HS256, signed and verified by [jose](https://github.com/panva/jose). The algorithm is pinned, and a link token is never accepted as a session or a session as a link.
- The emailed link is never built from a forwarded header, since a caller can name any host there.
- A link request answers the same way after the same two second wait whether or not the address was on the allowlist, and a send still running shortly before then is given up. A send that fails says so in the function's log and nowhere else.
- The post sign in destination is held to a path on the same host, 512 characters at most (`safeNext`).
- An open path opens only as written; the held corner is held in any case. Under `/api/`, only `/api/auth/` is open.

What it does not do, by having no store: a link can be used more than once until it expires, and link requests are not rate limited. Rotating the secret ends every session at once. The `gate_email` and `gate_wm` cookies that feed the watermark are readable and unsigned on purpose: the watermark is drawn in the reader's own browser, so it deters and attributes nothing a reader set on removing it could not already remove.

This is one of the two corners of the package that ship compiled (the other is the Vite entry, under [The Artifact Vite Config](#the-artifact-vite-config)). Vercel runs a function's and a middleware's package imports as shipped and compiles nothing inside `node_modules`, so `bun run build` emits `src/gate/` to `dist/gate/`, and `prepack` runs it before every publish.

### The Screen and the Watermark

The two pieces a reader sees are ordinary components, in `@atelic-action/ui/components`, styled by `@atelic-action/ui/styles/gate.css` (import it after `components.css`):

```tsx
// src/routes/login.tsx: the screen alone inside the site's scope, no header
<div className="mkt">
	<GateLogin
		brandName={site.recipient.name}
		eyebrow={site.gate?.eyebrow}
		headline={site.gate?.headline}
		lead={site.gate?.lead}
		builtBy={site.sender.name}
		contactEmail={site.sender.email}
	/>
</div>;

// the site's shell, once, inside its `.mkt` wrapper, so every page behind
// the gate wears it (the styles are scoped there, like every sheet's)
<Watermark />;
```

`GateLogin` posts to `/api/auth/request-link`; a site served under a base path passes its own `endpoint`. Its button wears the site's `.btn` classes, as the chrome's do. `Watermark` reads the `gate_email` cookie and draws nothing without one. `readCookie`, exported beside them, is the reader `Watermark` uses and a site's own code can: empty during prerender, for a missing cookie, and for one that will not decode. `GateLogin` says so when an address is not an email, holds a second submit while the first is in flight, and announces each outcome to a screen reader.

## The Artifact Documents

`@atelic-action/ui/artifact` is everything the artifact template shared across its cuts, so a fix reaches every business's documents with one version bump:

- **The documents:** `Writeup`, `Report`, and `Gate` (the sealed document, with its `GatePayload` type; a reader's address is the key, so a payload never lists it, and the component identifies a reader to HubSpot by the address they typed), plus the `GradeChip` and `SignOff` the first two share, and every content type they take (`WriteupProps`, `ReportProps`, `GateProps`, and the rest).
- **The shell:** `ArtifactShell`, the `.mkt` scope with the skip link, the dark header, the credit band, and the watermark around a page.
- **The contract and the head:** the `ArtifactConfig` types, and `buildPageHead` and `canonicalUrl` with their `PageMeta` type.
- **Who opened it:** `mintToken`, `sealReader`, `openReader`, `readerId`, `readerLink`, and `whoIsReading`. The same six are also built and exported alone as `@atelic-action/ui/artifact/readers`, because a Playwright spec and a script run under Node, which compiles nothing inside `node_modules`.
- **The error boundary:** `AppErrorBoundary` and its `ErrorFallback`.
- **`newTabProps`,** for the links a content module writes.

The package imports no router, so `ArtifactShell` takes the path being read as its `currentPath` prop. A site keeps a wrapper a few lines long that reads the path from its own router and passes it down:

```tsx
import { ArtifactShell as Shell, type ArtifactShellProps } from "@atelic-action/ui/artifact";
import { useLocation } from "@tanstack/react-router";

export function ArtifactShell(props: Omit<ArtifactShellProps, "currentPath">) {
	const currentPath = useLocation({ select: (location) => location.pathname });
	return <Shell {...props} currentPath={currentPath} />;
}
```

The documents import no stylesheet of their own. A site imports `@atelic-action/ui/styles/artifact.css` in its base sheet after `gate.css` and before its `theme.css`, so every page carries the rules whichever route it is. The sheet holds two `@page` rules, the monthly page's and then the writeup's, and the later one wins for every page a site prints; the order inside the sheet is the order the template's build bundled them in and is load bearing.

### The Artifact Vite Config

`@atelic-action/ui/vite` holds the whole Vite configuration of an artifact site, so a site's `vite.config.ts` is one call that names its pages:

```ts
// vite.config.ts
import { artifactConfig } from "@atelic-action/ui/vite";

export default artifactConfig({ pages: ["/writeup", "/proposal", "/report"] });
```

`artifactConfig` returns the TanStack Start plugin with prerendering on, the crawler following links but kept out of `/images/` (where a prerendered page would overwrite a real file), one prerendered page for `/`, for each path the site names, and for `/404`, and no sitemap; the React plugin; `privateChunks()`; the `@` alias to the site's `src`, resolved from the directory Vite is run in; and `ssr.noExternal: ["@atelic-action/ui"]`. Nothing links to an artifact page, so a page a site leaves out of `pages` ships with no HTML in it. `artifactPages` is the list alone.

A site with a real need of its own passes `extend`, which is merged over the result with Vite's `mergeConfig`:

```ts
export default artifactConfig({
	pages: ["/writeup"],
	extend: { server: { port: 5180 } },
});
```

`privateChunks` is the plugin inside it, exported for a site that writes its own configuration: it writes every chunk carrying private content to `/assets/doc/`, where the access wall holds it, and fails the build when one lands anywhere else.

A `vite.config.ts` is run by Node as shipped, so `src/vite/` is built to `dist/vite/` like the gate. The entry imports `@tanstack/react-start` and `@vitejs/plugin-react` when it loads, so a site that imports anything from it has both installed; they are optional peers only because a site that never imports this entry needs neither.

### The Commands

The package installs the scripts every artifact site used to carry as files, so a site's `package.json` calls a command by name and holds no script of its own. Each reads the site it is run in from the working directory: `src/site.config.ts`, `public/`, and `dist/client` are the site's, found from where the command is run, which is the site's root.

| Command | What It Does | Where a Site Calls It |
|---|---|---|
| `atelic-check-access` | Fails the build when `src/site.config.ts` says `access: "private"`, the build is on Vercel, and the wall's three variables are not set; warns on a local build of a private site | First step of `build` |
| `atelic-stamp-health` | Writes `dist/client/health.json` with the status, the commit, and the build time | Last step of `build` |
| `atelic-check-links` | Asks for every external link in the prerendered pages and exits 1 when one is dead | `check:links`, after a build |
| `atelic-check-wall <host> [path ...]` | Asks a deployed host for each document and held file with no cookie, and passes only when the wall answers every one and the sign in functions respond | `check:wall`, before any private link goes out |
| `atelic-reader-link <email> [path] [--token <token>] [--qr \| --no-qr]` | Mints a named reader: prints the sealed line for `analytics.identify` and the link to send, and writes `public/images/qr.png` for a public writeup's first reader | `reader` |
| `atelic-serve-static` | Serves `dist/client` on `127.0.0.1` the way Vercel does, on `PORT` or 4173 | The `webServer` command in `playwright.config.ts` |
| `atelic-print-sheets <url or dist/client> <out.pdf> [sheets] [page] [port]` | Prints a page to PDF with headless Chrome, reports the sheet count, and fails when a count is given and missed | `print` |
| `atelic-seal-document <config.json> [out.json]` | Seals a document into the payload `Gate` reads, one wrapped key for each reader. The payload names no one: no address, and readers numbered `r1`, `r2` whatever the config calls them | `seal` |

A site's scripts, whole:

```json
{
	"build": "atelic-check-access && tsc -b && vite build && cp dist/client/404/index.html dist/client/404.html && atelic-stamp-health",
	"check:links": "atelic-check-links",
	"check:wall": "atelic-check-wall",
	"reader": "atelic-reader-link",
	"print": "atelic-print-sheets",
	"seal": "atelic-seal-document"
}
```

The logic lives in `src/scripts/` as modules with their functions exported, which is what the tests import, and each file in `bin/` only reads the command line and calls one. The TypeScript commands open on `#!/usr/bin/env bun` and run as source, since `bun` runs TypeScript inside `node_modules`. The sealing command is plain `.mjs` under `#!/usr/bin/env node`, and the print command is `bash`; it needs Chrome (the `CHROME` variable names another binary), `python3`, and `curl`.

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
| `StatRow` | A row of large figures, each over what it counts and its `period`. `variant="quiet"` is the glance row for a working page: a light figure in the text color over a small capitalized label, hairlines between; `unit` sets a figure's unit small beside it | `trend` draws an arrow before a figure that is itself a change. `deltas` list comparisons beneath: an arrow, how far, against what (`basis`), and the earlier figure (`was`), each in its own tone, since a spend falling and a cost falling read differently |
| `Callout` | One finding: an icon in its tone beside the title, the explainer under it | `variant="box"` sets it apart on a tinted ground, for something missing or owed |
| `Disclosure` | A section the page opens and closes: a header row that folds a body the caller controls | For an app. The caller holds `open`, so it can remember what was folded, and a closed body is not rendered. The label is the toggle; `meta` (a count, a flag) sits beside it, outside its name, and a tap on it still folds. `headingLevel` makes the label a real heading |
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
2. **The app imports one sheet**, `@atelic-action/ui/styles/components.css`, and neither `base.css` nor `chrome.css`. An app's own unlayered CSS always wins over the package. With Tailwind the app **must declare the layer order before any stylesheet loads**, in a `<style>` in the `<head>` of its `index.html`: `@layer properties, theme, base, atelic-ui, components, utilities;`. A layer ranks by where it is first named, and a bundler is free to name the package's first, which ranks it below Tailwind's reset; the reset then strips the padding, margins, and borders off every component, while colors and type still look right, so it is easy to miss. Named there, the package ranks above the reset and below the app's utilities.
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
	--primary-bright: hsl(var(--brand));
	--primary-tint: color-mix(in srgb, hsl(var(--brand)) 12%, transparent);
	--ui-card: hsl(var(--card));
}
```

**Unit tests.** The package ships TSX source, and Vitest compiles it like any other module. A file under `node_modules` has no tsconfig of its own to name a JSX runtime, so a test that renders a package component fails with `React is not defined` until the test config says which to use: `esbuild: { jsx: "automatic" }` at the top level of `vitest.config.ts`. The app build needs nothing, since the React plugin sets it for Vite.

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
