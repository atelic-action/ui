# @atelic-action/ui

Shared UI for the Atelic templates: the site chrome (header, menu, footer, sticky CTA bar, and closing bar), the not found page and the routing that keeps it alive, the scroll spy hook, and the one base stylesheet. The marketing and artifact templates install it instead of carrying their own copies, so a chrome fix lands once and every site picks it up with `bun update @atelic-action/ui --latest`.

The package ships source, not a build. Its TSX and CSS arrive as written and compile inside each site's own Vite. The one exception is the access gate's server side, which ships compiled (see [The Access Gate](#the-access-gate)).

## Component Index

Every export, grouped by the entry it is imported from. The gallery column links the section of [ui.atelic.me](https://ui.atelic.me) that shows it; none marks an export that draws nothing. The composed documents (the writeup, the read, the monthly page, the note, and the sealed document) are not here: since 2.0.0 they live in [`@atelic-action/artifact`](https://github.com/atelic-action/artifact), which builds them from the pieces this package exports.

| Export | Entry | What it is | Gallery |
|---|---|---|---|
| `SiteHeader` | `@atelic-action/ui/chrome` | The fixed bar: the lockup, the nav or a page's own stops, the call to action, the burger; transparent, solid, or dark. A nav entry with `columns` is a group that opens a mega menu panel of link columns (nested links, badges), a picture, icon rows, and cards beside a ticked feature card, and `phones` puts up to two tel links in the bar (8.0.0) | [#site-header](https://ui.atelic.me/#site-header) |
| `SiteMenu` | `@atelic-action/ui/chrome` | The phone's full screen menu, on a native modal dialog; a group is an accordion that opens one at a time, every group closed when the menu opens (8.0.0) | [#site-menu](https://ui.atelic.me/#site-menu) |
| `ContactDock` | `@atelic-action/ui/chrome` | The floating Get in Touch launcher and its panel of ways to reach the business, inset alike from the right and the bottom, lifting over the phone's sticky bar and riding above the footer; `SiteShell` mounts it from `site.contactDock` (8.0.0) | [#contact-dock](https://ui.atelic.me/#contact-dock) |
| `Footer` | `@atelic-action/ui/chrome` | The default footer: the brand column (logo, Google rating, linked address, phone, email), the link columns, and the closing bar | [#footer](https://ui.atelic.me/#footer) |
| `ClosingBar`, `Copyright`, `Credit` | `@atelic-action/ui/chrome` | The line that closes every page, in two sides that each take anything: by default `Copyright` with the business's name on the left and `Credit`, the practice's made with line, on the right | [#closing-bar](https://ui.atelic.me/#closing-bar) |
| `StickyCTABar` | `@atelic-action/ui/chrome` | The phone's bottom bar: the call to action and a call shortcut, there from the top on an interior page (`fromTop`) and sliding in after a scroll on a hero page | [#sticky-cta-bar](https://ui.atelic.me/#sticky-cta-bar) |
| `BrandLockup` | `@atelic-action/ui/chrome` | The header's identity as one link, with the recipient's mark on a sent document; the brand's own mark per surface (`onLight`, `onDark`), never recolored, at `--brand-mark-height` (8.0.0) | [#brand-lockup](https://ui.atelic.me/#brand-lockup) |
| `SkipLink` | `@atelic-action/ui/chrome` | The keyboard user's jump past the chrome | [#skip-link](https://ui.atelic.me/#skip-link) |
| `Brand`, `BrandLogo`, `CallToAction`, `HoursRow`, `MenuContact`, `NavLink`, `NavPanelSection`, `NavGroupColumn`, `NavGroupLink`, `NavGroupChildLink`, `NavPictureSection`, `NavIconRowsSection`, `NavIconRow`, `NavIcon`, `NavCardsSection`, `NavCard`, `NavFeature`, `HeaderPhone`, `ContactDockConfig`, `ContactDockItem`, `ContactDockIcon`, `Phone`, `PostalAddress`, `SiteLink`, `SocialLink`, `PageStop`, `FooterColumn`, `FooterColumnLink`, `FooterIcon` | `@atelic-action/ui/chrome` | The shapes the chrome renders from (types) | none |
| `NotFound` | `@atelic-action/ui/components` | The body of the page an unknown path renders | [#not-found](https://ui.atelic.me/#not-found) |
| `Checklist` | `@atelic-action/ui/components` | A short list of checks, each passed or failed | [#checklist](https://ui.atelic.me/#checklist) |
| `IconList` | `@atelic-action/ui/components` | A list whose bullets are icons, one for the list or one per item, each in a tone | [#icon-list](https://ui.atelic.me/#icon-list) |
| `DataTable` | `@atelic-action/ui/components` | A table whose first column names each row, sortable, stacking on a phone | [#data-table](https://ui.atelic.me/#data-table) |
| `Hint` | `@atelic-action/ui/components` | An info icon that opens a short explainer beside a word, or beside a table heading | [#hint](https://ui.atelic.me/#hint) |
| `ReportCard` | `@atelic-action/ui/components` | A name, a grade, and a line per row, in labeled groups, each row a link to its section | [#report-card](https://ui.atelic.me/#report-card) |
| `reportCardLabels`, `ReportCardLabels` | `@atelic-action/ui/components` | The words a screen reader hears around a report card's letters by default, and their type | none |
| `Rank` | `@atelic-action/ui/components` | A figure with its badge in a tone, for a table cell: a rank, a place in an answer, or a dash | [#rank](https://ui.atelic.me/#rank) |
| `StatRow` | `@atelic-action/ui/components` | A row of large figures with periods, deltas, and trends; a share's denominator set small after the figure (`outOf`) and a change set small beside it with a triangle (`change`), 3.14.0 | [#stat-row](https://ui.atelic.me/#stat-row) |
| `Callout` | `@atelic-action/ui/components` | One finding: an icon in its tone, the title, the explainer (not `CalloutPanel`, the business's headline claims) | [#callout](https://ui.atelic.me/#callout) |
| `Disclosure` | `@atelic-action/ui/components` | A section that folds: controlled, an app's card; uncontrolled, a native details fold that prints open | [#disclosure](https://ui.atelic.me/#disclosure) |
| `Tabs`, `TabsItem` | `@atelic-action/ui/components` | Panels behind a row of tabs, every panel kept in the page: a hash opens the tab or the panel holding what it names, and it prints every panel under its label | [#tabs](https://ui.atelic.me/#tabs) |
| `StackedBar` | `@atelic-action/ui/components` | One bar split into the parts of a whole, with a key | [#stacked-bar](https://ui.atelic.me/#stacked-bar) |
| `ColumnChart` | `@atelic-action/ui/components` | A bar a period, the periods in labeled groups | [#column-chart](https://ui.atelic.me/#column-chart) |
| `ThresholdScale` | `@atelic-action/ui/components` | Zones on a scale and a pin for each reading | [#threshold-scale](https://ui.atelic.me/#threshold-scale) |
| `StarRating`, `describeStarRating` | `@atelic-action/ui/components` | A row of stars in half steps, read only or editable, and its spoken name | [#star-rating](https://ui.atelic.me/#star-rating) |
| `GateLogin` | `@atelic-action/ui/components` | The access gate's sign in screen | [#gate-login](https://ui.atelic.me/#gate-login) |
| `Watermark` | `@atelic-action/ui/components` | The signed in reader's confidential stamp, pill or tiled | [#watermark](https://ui.atelic.me/#watermark) |
| `readCookie`, `Tone` | `@atelic-action/ui/components` | The cookie reader the watermark uses, and the tone type | none |
| `Button`, `PrimaryButton`, `SecondaryButton`, `Chip`, `Eyebrow`, `Lead`, `SectionHeading` | `@atelic-action/ui/primitives` | The small pieces a page is set in; the two named buttons are the only call to action shapes a page uses | [#primitives](https://ui.atelic.me/#primitives) |
| `GradeChip`, `gradeLabel`, `WriteupGrade` | `@atelic-action/ui/artifact` | A section's grade, A to D, as a chip in its color, the letter alone, and the grade type | [#grade-chip](https://ui.atelic.me/#grade-chip) |
| `SignOff`, `WriteupPerson` | `@atelic-action/ui/artifact` | The close a document ends on, and the person it names | [#sign-off](https://ui.atelic.me/#sign-off) |
| `Shot`, `WriteupShot` | `@atelic-action/ui/artifact` | The owner's own screen, opening the full picture, over its caption; a portrait crop is marked `data-portrait` and held to 200px (1.8in in print) | [#shot](https://ui.atelic.me/#shot) |
| `Paragraph`, `Runs`, `ArtifactAnchor`, `isEmpty`, `isQuery`, `ArtifactLink`, `ArtifactQuery`, `ArtifactRun`, `ArtifactParagraph` | `@atelic-action/ui/artifact` | Plain data text a routine can write as JSON: a paragraph, its runs alone, one link, the empty test, the query test, and the four types | [#paragraph](https://ui.atelic.me/#paragraph) |
| `ArtifactShell` | `@atelic-action/ui/artifact` | The chrome around a document page: skip link, dark header, the closing bar with the sender's copyright and the credit, watermark | [#site-header](https://ui.atelic.me/#site-header) (its dark bar) |
| `AppErrorBoundary`, `ErrorFallback` | `@atelic-action/ui/artifact` | The error boundary and the page it falls back to | none |
| `buildPageHead`, `canonicalURL`, `newTabProps`, the `ArtifactConfig` types | `@atelic-action/ui/artifact` | A page's head, a link's new tab props, and a site's contract | none |
| `whoIsReading` | `@atelic-action/ui/artifact` and `@atelic-action/ui/artifact/readers` | Who opened a document, by the email they signed in with; the second entry is the same function, built, for what Node runs | none |
| `Masthead`, `TitleCard`, `Footer`, `FailurePage` | `@atelic-action/ui/email` | An email's frame: the wordmark row, the title card, the foot, the failure page (plain, or structured by a step and a fix) | [#email](https://ui.atelic.me/#email) |
| `Card`, `Row`, `FoldRow`, `Eyebrow`, `SubEyebrow`, `Fold`, `BigFold` | `@atelic-action/ui/email` | The containers and labels an email's sections sit in | [#email](https://ui.atelic.me/#email) |
| `Item`, `TitleLine`, `Note`, `EmptyRow`, `Stat`, `StatsRow`, `List`, `ListRow`, `LeadRow`, `ReadBlock`, `Badge` | `@atelic-action/ui/email` | The rows inside a card | [#email](https://ui.atelic.me/#email) |
| `Scoreboard`, `GroupRow`, `TargetRow`, `Bar`, `DayStrip` | `@atelic-action/ui/email` | Targets against what was logged, and the week by day | [#email](https://ui.atelic.me/#email) |
| `RecordStack`, `RecordTimelineStrip`, `Records` | `@atelic-action/ui/email` | Records stacked for a phone, their timeline, and the fixed column table | [#email](https://ui.atelic.me/#email) |
| `EmailThemeProvider`, `useEmailTheme`, `eyebrowStyle`, the plain text helpers (`recordStackText`, `wrap`, `textTable`, and the rest) | `@atelic-action/ui/email` | The palette context and the plain text twin (see [Email](#email)) | [#email](https://ui.atelic.me/#email) (the text twin) |
| `renderEmail`, `renderFailureEmail` | `@atelic-action/ui/email/render` | The whole email document, and the failure page's | [#email](https://ui.atelic.me/#email) |
| `atelicPalette`, `atelicFonts`, `toThemeCSS`, `themeTokenMap`, `Palette`, `Fonts` | `@atelic-action/ui/tokens` | The palette and font stacks, with no React | none |
| `useScrollSpy` | `@atelic-action/ui/hooks` | Which section is in the reading band; the header's stops use it | [#site-header](https://ui.atelic.me/#site-header) (the dark bar's stops) |
| `staticNotFoundRouting` | `@atelic-action/ui/routing` | The router options that keep a prerendered not found page alive | none |
| `signToken`, `verifyToken`, `safeNext`, `needsSession` | `@atelic-action/ui/gate` | The access gate's tokens, the safe post sign in path, and the wall's test | none |
| `POST`, `createRequestLink` | `@atelic-action/ui/gate/request-link` | The function that emails a sign in link | none |
| `GET` | `@atelic-action/ui/gate/verify` | The function that turns a link into a session | none |
| default, `createMiddleware` | `@atelic-action/ui/gate/middleware` | The middleware that holds a host behind the gate | none |
| `artifactConfig`, `artifactPages` | `@atelic-action/ui/vite` | An artifact site's whole Vite configuration, and its page list | none |
| `privateChunks`, `isPrivateContent`, `DOC_DIR` | `@atelic-action/ui/vite` and `@atelic-action/ui/vite/private-chunks` | The plugin that keeps private content behind the wall; the second entry loads neither optional peer | none |
| `base.css`, `chrome.css`, `components.css`, `primitives.css`, `gate.css`, `artifact.css`, `star-rating.css` | `@atelic-action/ui/styles/*` | The stylesheets, in the order under [CSS Import Order](#css-import-order) | every section |
| `BlogIndex` | `@atelic-action/ui/sections` | The post listing as a readable stack | [#blog-index](https://ui.atelic.me/#blog-index) |
| `BlogPost` | `@atelic-action/ui/sections` | One article: back link, title, byline and dateline, body | [#blog-post](https://ui.atelic.me/#blog-post) |
| `CalloutPanel` | `@atelic-action/ui/sections` | Short callouts on the primary field, a heavy title over a subtitle each, four across and two by two below, titles and subtitles each on a shared line (8.0.0) | [#callout-panel](https://ui.atelic.me/#callout-panel) |
| `CTASection` | `@atelic-action/ui/sections` | The standard closer: the site's own primary action and an optional ghost second | [#c-t-a-section](https://ui.atelic.me/#c-t-a-section) |
| `ComparisonTable` | `@atelic-action/ui/sections` | A graded before and after that scrolls sideways on a phone rather than reflowing; a row's label can link to what explains it (`stageHref`, 3.14.0) | [#comparison-table](https://ui.atelic.me/#comparison-table) |
| `ContactForm` | `@atelic-action/ui/sections` | Validated form with a honeypot that posts to `endpoint` (or hands off to mail); `onLead` replaces the default GA4 `generate_lead` event | [#contact-form](https://ui.atelic.me/#contact-form) |
| `ContactInfoCard` | `@atelic-action/ui/sections` | A dark card of direct contact rows: call, email, visit, portal | [#contact-info-card](https://ui.atelic.me/#contact-info-card) |
| `CredentialList` | `@atelic-action/ui/sections` | Credential cards with a mono code before each | [#credential-list](https://ui.atelic.me/#credential-list) |
| `ExpandList` | `@atelic-action/ui/sections` | A light accordion of numbered rows whose bodies stay in the HTML while closed | [#expand-list](https://ui.atelic.me/#expand-list) |
| `FAQBrowser` | `@atelic-action/ui/sections` | The help page: live search, a sticky `JumpRail` of categories with scroll spy, expand all, deep links; `contactHref` sets where the no match line points | [#f-a-q-browser](https://ui.atelic.me/#f-a-q-browser) |
| `FeatureDetail` | `@atelic-action/ui/sections` | Alternating copy and media rows with tags and a tick list | [#feature-detail](https://ui.atelic.me/#feature-detail) |
| `FeatureGrid` | `@atelic-action/ui/sections` | Numbered cards with a hover lift under a heading and an optional `lead`; a card is a link or holds one, never both | [#feature-grid](https://ui.atelic.me/#feature-grid) |
| `FullBleedVideo` | `@atelic-action/ui/sections` | A silent looping clip edge to edge: the poster at once, the clip once it is on screen and only while on screen, the poster alone under reduced motion (8.0.0) | [#full-bleed-video](https://ui.atelic.me/#full-bleed-video) |
| `Gallery` | `@atelic-action/ui/sections` | A captioned wall of the business's own work, a shot brief where a photo is missing | [#gallery](https://ui.atelic.me/#gallery) |
| `Hero` | `@atelic-action/ui/sections` | The home page opener: a full bleed image (or the token gradient), a headline with a serif accent, a pair of actions, trust figures, and a scroll cue; `layout="split"` sets the copy on the primary field beside the photo (8.0.0) | [#hero](https://ui.atelic.me/#hero), [#hero-split](https://ui.atelic.me/#hero-split) |
| `HoursTable` | `@atelic-action/ui/sections` | Day rows with dashed rules and mono times | [#hours-table](https://ui.atelic.me/#hours-table) |
| `JumpRail` | `@atelic-action/ui/sections` | Sticky in page pill tabs with scroll spy, used by `FAQBrowser` and on its own | [#jump-rail](https://ui.atelic.me/#jump-rail) |
| `LegalPage` | `@atelic-action/ui/sections` | A legal document from data, its last revised date first | [#legal-page](https://ui.atelic.me/#legal-page) |
| `LinkColumns` | `@atelic-action/ui/sections` | Columns of links under a section heading, each a heading over its links, a link's figure (`count`) set right aligned in tabular numerals (8.0.0) | [#link-columns](https://ui.atelic.me/#link-columns) |
| `LocationSection` | `@atelic-action/ui/sections` | The local search section: service areas as prose, hours, directions, and the map | [#location-section](https://ui.atelic.me/#location-section) |
| `Locations` | `@atelic-action/ui/sections` | More than one address: the flagship's map beside a card for each location | [#locations](https://ui.atelic.me/#locations) |
| `LogoMarquee` | `@atelic-action/ui/sections` | A dark band of chips scrolling without end: credentials, clients, or press | [#logo-marquee](https://ui.atelic.me/#logo-marquee) |
| `MapEmbed` | `@atelic-action/ui/sections` | The map: a screenshot linking to directions, or a click to load facade over the live embed | [#map-embed](https://ui.atelic.me/#map-embed) |
| `PageHero` | `@atelic-action/ui/sections` | The interior page opener on the alternate band; children sit under the lead | [#page-hero](https://ui.atelic.me/#page-hero) |
| `ProofStrip` | `@atelic-action/ui/sections` | One row of short proof facts under a hero, a figure over its label each, wrapping to a grid on a phone (8.0.0) | [#proof-strip](https://ui.atelic.me/#proof-strip) |
| `PricingBand` | `@atelic-action/ui/sections` | A brand colored band with the price in a card beside it, informational by design | [#pricing-band](https://ui.atelic.me/#pricing-band) |
| `PricingCard` | `@atelic-action/ui/sections` | A standalone price card with a tick list and its booking action | [#pricing-card](https://ui.atelic.me/#pricing-card) |
| `ProcessSteps` | `@atelic-action/ui/sections` | A dark band of numbered steps beside a frame, landing on its `id` | [#process-steps](https://ui.atelic.me/#process-steps) |
| `ProfileCards` | `@atelic-action/ui/sections` | Equal weight cards of media beside a short bio | [#profile-cards](https://ui.atelic.me/#profile-cards) |
| `RevealSlider` | `@atelic-action/ui/sections` | Drag or arrow keys to compare two frames, each with its own toned shot brief before photography | [#reveal-slider](https://ui.atelic.me/#reveal-slider) |
| `ReviewCarousel` | `@atelic-action/ui/sections` | The aggregate beside one large review at a time, stepped by dots and arrows, each review linking to its source | [#review-carousel](https://ui.atelic.me/#review-carousel) |
| `ReviewWall` | `@atelic-action/ui/sections` | The reviews page: tag filter and sort when the data carries them, clamped quotes behind Read more | [#review-wall](https://ui.atelic.me/#review-wall) |
| `SplitSection` | `@atelic-action/ui/sections` | The two column band: copy beside copy, or media beside copy | [#split-section](https://ui.atelic.me/#split-section) |
| `SiteConfig` and its member types (`Density` among them), `Surface` (the band every section's `surface` takes, 8.0.0), `formatClock`, `formatHoursRange`, `isClosed`, `isHoneypotFilled`, `trackEvent` | `@atelic-action/ui/sections` | The site contract the sections read, and the hours, honeypot, and lead event helpers | none |
| `Bubble`, `ImageFrame`, `ProseBlocks`, `QuoteCard`, `StarRow`, `TickList` | `@atelic-action/ui/primitives` | The marketing primitives: a round tile holding an icon or a step number, a framed image, prose blocks (headings at two levels, paragraphs, lists, and figures: small captioned tiles in rows, an image or a silent looping clip played only while on screen, each opening large in a dialog), a quote card, a row of filled stars, a tick list | [#marketing-primitives](https://ui.atelic.me/#marketing-primitives) |
| `SiteShell` | `@atelic-action/ui/chrome` | A marketing page's whole chrome: skip link, header, main, footer, sticky bar, the contact dock when configured, mounting the base path provider and setting the section density | none |
| `BasePathProvider`, `useBasePath`, `useWithBase`, `joinBase`, `stripBase`, `hasBase`, `normalizeBasePath` | `@atelic-action/ui/routing` | The base path a site is served under, read by Button, Chip, and every section that builds a link | none |
| `joinBase`, `stripBase`, `hasBase`, `normalizeBasePath` | `@atelic-action/ui/routing/base-path` | The same four pure helpers, built, for what Node runs (a Playwright spec, a script) | none |
| `marketingConfig` | `@atelic-action/ui/vite` | A marketing site's whole Vite configuration as one call | none |
| `sections.css` | `@atelic-action/ui/styles/sections.css` | Styles for everything under `sections`, imported after `primitives.css` | none |
| `AppProvider`, `AppConfigProvider`, `useAppConfig`, `useNav`, `useUser`, `configureApp`, `getAppConfig`, `AppConfig`, `NavItem`, `AppUser`, `Register` | `@atelic-action/ui/app` | The app shell's seam: the app hands in its config and nav, registers its user type, and reads them back | [app](https://ui.atelic.me/app.html) |
| `AppLayout`, `AppPage`, `AppPageToolbar`, `Breadcrumbs`, `SectionCards`, `DesktopRail`, `MobileTabBar`, `MobileMenu`, `UserMenu`, `PageSkeleton`, `PageError`, `ActionButton`, `FormActionButtons`, `activeSection` | `@atelic-action/ui/app` | The app frame: the rails, the tab bar, the page scaffold with its toolbar and right rail | [app](https://ui.atelic.me/app.html) |
| `AuthGuard`, `ErrorFallback`, `GoogleGlyph`, `useAuthStore`, `useUnitsStore`, `apiFetch`, `publicFetch`, `session`, the hooks and the wire types | `@atelic-action/ui/app` | Auth, transport, the two shell stores, and the helpers the shell runs on | [app](https://ui.atelic.me/app.html) |
| The shadcn kit (`Button`, `Dialog`, `Select`, `OptionSelect`, `SearchInput`, `BadgeList`, `Callout`, and the rest) | `@atelic-action/ui/app/ui` | The kit the shell is set in; a new kit component lands here, never in an app | [app](https://ui.atelic.me/app.html) |
| `app.css` | `@atelic-action/ui/styles/app.css` | The shell's Tailwind sheet: the token mapping, the default tokens, the base layer, the `ap-*` scaffold, and the `@source` that points Tailwind at the shell | none |
| The eleven `atelic-*` commands | the `bin` map | The build guard, health stamp, link and wall checks, reader link, static server, print, sealing, and the marketing site's sitemap clean, base path check, and contact canary | none |


## Install

```bash
bun add @atelic-action/ui
```

From 1.0.0 a caret range admits every minor and patch, so a plain `bun update @atelic-action/ui` takes them; a new major still needs `--latest`. A site still on a `^0.x` range takes 1.0 with `--latest` once.

Peer dependencies: `react` and `react-dom` at `^19.0.0`, and `lucide-react` at `^1.23.0`. Three more are optional, needed only by a site whose `vite.config.ts` imports `@atelic-action/ui/vite`: `vite`, `@tanstack/react-start`, and `@vitejs/plugin-react`. The commands the package installs run under `bun`, with `node` for the sealing command.

## Vite Config

Prerendering and server rendering have to compile the package too, so keep it out of Vite's SSR externals. That is the one line a consumer adds:

```ts
// vite.config.ts
export default defineConfig({
	ssr: { noExternal: ["@atelic-action/ui", "@atelic-action/artifact"] },
});
```

A site that renders a document needs `@atelic-action/artifact` kept internal the same way, since it too ships TSX and CSS as written; a site that renders none lists `@atelic-action/ui` alone.

## CSS Import Order

Import the stylesheets in this order, from the root route or the site's base sheet:

1. The site's fonts (`fonts.css`)
2. `@atelic-action/ui/styles/base.css`
3. `@atelic-action/ui/styles/chrome.css`
4. `@atelic-action/ui/styles/components.css`
5. `@atelic-action/ui/styles/primitives.css`
6. `@atelic-action/ui/styles/gate.css`, on a site that mounts the access gate
7. `@atelic-action/ui/styles/artifact.css`, on a site that hosts the artifact documents
8. `@atelic-action/artifact/styles/documents.css`, on the same site, for the documents themselves
9. The site's own CSS
10. The site's `theme.css`, last

Every rule in the package sheets is scoped under `.atelic-ui`, the one root class a consumer wears: a site puts it on its outermost wrapper, an app on the region that holds a package component. Which sheets it imports decides what it gets, so a site importing `base.css` gets the resets and typography under that class and an app importing `components.css` alone gets none of them.

The package sheets sit inside `@layer atelic-ui`, so any rule a site writes outside a layer wins over them whatever its specificity. The package reads the theme tokens (`--ink`, `--surface`, `--primary`, `--nav-height`, and the rest) and defines none of them, so `theme.css` stays the one file a site edits to rebrand; the only values it declares are the defaults of its own optional tokens, on a selector that weighs nothing (see [Tokens](#tokens)). The chrome's buttons wear the `.btn` classes, which `primitives.css` defines and a site may restyle.

## Rendering From Props

Every component renders from props alone. None reads a config file or a router, so a site maps its own config onto the props in its shell:

```tsx
import { Footer, SiteHeader, SkipLink, StickyCTABar } from "@atelic-action/ui/chrome";

<div className="atelic-ui">
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
height as the sender's, `--brand-mark-height`.

The mark is the brand's own artwork. A site whose logo is cut once per
surface passes `logo.onLight` (drawn on the light bar) and `logo.onDark`
(drawn on the dark bar, over a hero, and in the footer), and the chrome
recolors neither; either alone serves every surface. A site that passes
`logo.src` alone keeps what it had: a light mark that the header tints to
ink with a filter on the light bar. Every header mark stands at
`--brand-mark-height` (30px unless the theme sets it) and runs as wide as
its own ratio, so a wide wordmark reads at a height the theme picks, and
`logo.wordmark: false` drops the live name beside artwork that already
spells it.

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

`PrimaryButton` and `SecondaryButton` (3.13.0) are the two buttons a marketing page uses, by name: the primary is the large primary button with the arrow, the shape `CTASection` closes every page with, and the secondary is the large ghost beside it, always second. A page reaches for those and never picks a variant and a size by hand, so no two pages drift; the header's compact button is the header's own. `Button` stays underneath for the few other shapes (a form's submit, a dark surface).

`Button` is an anchor when it has an `href` and a real button otherwise. It puts the base path from `BasePathProvider` on a root path `href` (0.19.0), so a site served under a prefix needs no wrapper; with no provider above it the `href` renders as given. Its arrow is hidden from the name a screen reader hears.

`Bubble` (3.11.0) is the round tile set beside a heading or a numbered step, holding either a lucide icon the caller sizes (`icon`) or a short mono index (`num`, such as "01"); given both, the icon sits inside and the number rides a small badge on the lower right rim, the way an unread count sits on an app icon. It comes in three sizes (`sm`, `md`, `lg`: 36, 48, and 60 pixels across, `md` by default) and lifts its fill for a dark band with `onDark`, the way `Chip` does. It is decoration and wears `aria-hidden`, so the heading beside it carries the meaning, the step's number included.

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
| `GATE_ALLOWLIST` | all three | Comma separated entries that may receive a link. An address matches itself exactly; the business's domain, written `example.com` or `@example.com`, admits every address on it but none on its subdomains. Case never matters, and an empty entry or a word with no dot matches nothing. Taking an entry off, then redeploying, refuses its outstanding links and ends their sessions |
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

What it does not do, by having no store: a link can be used more than once until it expires, and the code does not rate limit link requests. That is handled outside the code, by a Vercel firewall rule on `/api/auth/request-link`. Rotating the secret ends every session at once. The `gate_email` and `gate_wm` cookies that feed the watermark are readable and unsigned on purpose: the watermark is drawn in the reader's own browser, so it deters and attributes nothing a reader set on removing it could not already remove.

This is one of the two corners of the package that ship compiled (the other is the Vite entry, under [The Artifact Vite Config](#the-artifact-vite-config)). Vercel runs a function's and a middleware's package imports as shipped and compiles nothing inside `node_modules`, so `bun run build` emits `src/gate/` to `dist/gate/`, and `prepack` runs it before every publish.

### A Marketing Site's Matcher

A website's other functions (the contact relay) are public by design, so a marketing site keeps all of `api/` and the login page away from the middleware and leaves the rest of the deciding to it (0.19.0):

```ts
// middleware.ts
export { default } from "@atelic-action/ui/gate/middleware";

// Everything but api/ and the login page reaches the middleware, which lets a
// request through with no session only when the wall's open paths name it.
export const config = { matcher: ["/((?!api/|login$|login/).*)"] };
```

The default middleware holds by allowlist: with the wall armed, a request passes with no session only when the wall's open exact paths and open prefixes name it (`OPEN_PATHS` in `@atelic-action/ui/gate`), which covers what a login page loads (its hashed assets, fonts, and favicon). Anything else is held, so a page whose last path segment carries a dot (`/blog/release-2.0`) or one asked for by its file name (`/about/index.html`) stays behind the wall, where the old matcher let any path with a file extension through. A site with an open file of its own adds it, and never opens the held corner by doing so:

```ts
import { createMiddleware } from "@atelic-action/ui/gate/middleware";
export default createMiddleware({ open: { exact: ["/apple-touch-icon.png"], prefixes: ["/icons/"] } });
```

`createNeedsSession` in `@atelic-action/ui/gate` is the same test on its own. A `needsSession` a site passes still wins over both, for a matcher that already leaves its open paths out.

### The Screen and the Watermark

The two pieces a reader sees are ordinary components, in `@atelic-action/ui/components`, styled by `@atelic-action/ui/styles/gate.css` (import it after `components.css`):

```tsx
// src/routes/login.tsx: the screen alone inside the site's scope, no header
<div className="atelic-ui">
	<GateLogin
		brandName={site.recipient.name}
		eyebrow={site.gate?.eyebrow}
		headline={site.gate?.headline}
		lead={site.gate?.lead}
		builtBy={site.sender.name}
		contactEmail={site.sender.email}
	/>
</div>;

// the site's shell, once, inside its `.atelic-ui` wrapper, so every page behind
// the gate wears it (the styles are scoped there, like every sheet's)
<Watermark />;
```

`GateLogin` posts to `/api/auth/request-link`; a site served under a base path passes its own `endpoint`. Its button wears the site's `.btn` classes, as the chrome's do. `Watermark` reads the `gate_email` cookie and draws nothing without one. `readCookie`, exported beside them, is the reader `Watermark` uses and a site's own code can: empty during prerender, for a missing cookie, and for one that will not decode. `GateLogin` says so when an address is not an email, holds a second submit while the first is in flight, and announces each outcome to a screen reader.

## The Artifact Documents

`@atelic-action/ui/artifact` is the pieces an artifact document is built from and the site around it, so a fix to a piece reaches every business's documents with one version bump. The composed documents themselves (`Writeup`, `Read`, `Report`, `Note`, and the sealed `Gate`, with their content types and their stylesheet) live in [`@atelic-action/artifact`](https://github.com/atelic-action/artifact) since 2.0.0, which depends on this package for everything below:

- **The pieces:** `GradeChip` and `gradeLabel` with the `WriteupGrade` type, `SignOff` with the `WriteupPerson` type, `Shot` with the `WriteupShot` type (a crop taller than it is wide is measured in the browser, marked `data-portrait`, and held to 200px wide on screen and 1.8in in print; a layout that sizes its shots itself sets `--op-shot-portrait-max: none` to opt out, on screen and in print alike), and the plain data text (`Paragraph`, `Runs`, `ArtifactAnchor`, `isEmpty`, and `isQuery`, with the `ArtifactLink`, `ArtifactQuery`, `ArtifactRun`, and `ArtifactParagraph` types: a paragraph is a string or runs of text, `{ text, href }` links, and `{ query, href? }` search queries, so a routine can write a document as JSON). A query renders as `<em class="query">` around the words in curly quotes, which the component adds, so content passes the bare words; with an `href`, the link sits inside the `em` around the quoted words.
- **The shell:** `ArtifactShell`, the `.atelic-ui` scope with the skip link, the dark header, the closing bar, and the watermark around a page. The closing bar is the one line after a document's sign off, and it closes the way a site does: `Copyright` with the sender's name on the left and `Credit` on the right (7.2.0; before it the credit stood alone, centered). Print drops it with the header and the skip link.
- **The contract and the head:** the `ArtifactConfig` types, and `buildPageHead` and `canonicalURL` with their `PageMeta` type.
- **Who opened it:** `whoIsReading`, the email a reader signed in with at the wall, by the form or by the sign in a send carried, and nobody on the sender's own domain. It is also built and exported alone as `@atelic-action/ui/artifact/readers`, because a Playwright spec runs under Node, which compiles nothing inside `node_modules`.
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

The pieces import no stylesheet of their own. A site imports `@atelic-action/ui/styles/artifact.css` in its base sheet after `gate.css`, then `@atelic-action/artifact/styles/documents.css`, and then its `theme.css`, so every page carries the rules whichever route it is. This sheet holds the pieces alone (the sign off, the shot, and the shell's logo rule; the grade chip's rules sit in `components.css`, since `ReportCard` wears it) and sets no `@page`; both `@page` rules, the monthly page's and then the writeup's, moved with the documents into their sheet, where their order stays load bearing.

### The Artifact Vite Config

`@atelic-action/ui/vite` holds the whole Vite configuration of an artifact site, so a site's `vite.config.ts` is one call that names its pages:

```ts
// vite.config.ts
import { artifactConfig } from "@atelic-action/ui/vite";

export default artifactConfig({ pages: ["/the-read", "/proposal", "/report"] });
```

`artifactConfig` returns the TanStack Start plugin with prerendering on, the crawler following links but kept out of `/images/` (where a prerendered page would overwrite a real file), one prerendered page for `/`, for each path the site names, and for `/404`, and no sitemap; the React plugin; `privateChunks()`; the `@` alias to the site's `src`, resolved from the directory Vite is run in; and `ssr.noExternal: ["@atelic-action/ui", "@atelic-action/artifact"]`, so the documents compile too. Nothing links to an artifact page, so a page a site leaves out of `pages` ships with no HTML in it. `artifactPages` is the list alone.

A site with a real need of its own passes `extend`, which is merged over the result with Vite's `mergeConfig`:

```ts
export default artifactConfig({
	pages: ["/the-read"],
	extend: { server: { port: 5180 } },
});
```

`privateChunks` is the plugin inside it, exported for a site that writes its own configuration: it writes every chunk carrying private content to `/assets/doc/`, where the access wall holds it, and fails the build when one lands anywhere else.

A `vite.config.ts` is run by Node as shipped, so `src/vite/` is built to `dist/vite/` like the gate. `@atelic-action/ui/vite` imports `@tanstack/react-start` and `@vitejs/plugin-react` when it loads, so a site that imports anything from it has both installed. A site that writes its own configuration and wants only the plugin imports it from `@atelic-action/ui/vite/private-chunks` (0.18.0), which loads nothing from Vite but its types and needs neither peer:

```ts
import { privateChunks } from "@atelic-action/ui/vite/private-chunks";
```

### The Commands

The package installs the scripts every artifact site used to carry as files, so a site's `package.json` calls a command by name and holds no script of its own. Each reads the site it is run in from the working directory: `src/site.config.ts`, `public/`, and `dist/client` are the site's, found from where the command is run, which is the site's root.

| Command | What It Does | Where a Site Calls It |
|---|---|---|
| `atelic-check-access` | Fails the build when `src/site.config.ts` says `access: "private"`, the build is on Vercel, and the wall's three variables are not set; warns on a local build of a private site | First step of `build` |
| `atelic-stamp-health` | Writes `dist/client/health.json` with the status, the commit, and the build time | Last step of `build` |
| `atelic-check-links` | Asks for every external link in the prerendered pages and exits 1 when one is dead | `check:links`, after a build |
| `atelic-check-wall <host> [path ...]` | Asks a deployed host for each document and held file with no cookie, and passes only when the wall answers every one and the sign in functions respond | `check:wall`, before any private link goes out |
| `atelic-reader-link <email> [path] [--days <n>]` | Mints the sign in a send carries: a link that signs the reader in at the wall and lands them on the page (query kept), good on every open for 14 days by default and 30 at most. Signs with `GATE_SESSION_SECRET` and refuses an address `GATE_ALLOWLIST` would not admit, both read from the environment | `reader` |
| `atelic-serve-static` | Serves `dist/client` on `127.0.0.1` the way Vercel does, on `PORT` or 4173 | The `webServer` command in `playwright.config.ts` |
| `atelic-print-sheets <url or dist/client> <out.pdf> [sheets] [page] [port]` | Prints a page to PDF with headless Chrome, reports the sheet count, and fails when a count is given and missed | `print` |
| `atelic-seal-document <config.json> [out.json]` | Seals a document into the payload that `@atelic-action/artifact`'s `Gate` reads, one wrapped key for each reader. The payload names no one: no address, and readers numbered `r1`, `r2` whatever the config calls them | `seal` |
| `atelic-clean-sitemap` | Strips fragment and trailing slash duplicates out of `dist/client/sitemap.xml`; says so and passes when a based build wrote none | A marketing site's `build`, after vite |
| `atelic-check-base-path` | Fails the build when a root path in `dist/client` lacks the base path, or `vercel.json` lacks (or strays from) the two rewrites a based cut needs; a `VITE_BASE_PATH` rehearsal only warns about `vercel.json` off Vercel | Last step of a marketing site's `build` |
| `atelic-check-images` | Fails the build when `public/images` holds an image over 250 KB, a PNG over 64 KB, or a JPEG that is not a sharing card (`og.jpg` or `<name>-og.jpg`): every photo ships as WebP at about 2x its rendered width (template-marketing's CLAUDE.md, Image budget) | First step of a marketing site's `build` |
| `atelic-contact-canary` | Posts a token bearing test message to `$SITE_URL/api/contact` and passes only on a Resend id and the expected destination (`CONTACT_EXPECTED_TO`, `CONTACT_CANARY_TOKEN`); a `.invalid` `SITE_URL` is the off switch | `check:contact`, run daily by the canary workflow |

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

The logic lives in `src/scripts/` as modules with their functions exported, which is what the tests import, and each file in `bin/` only reads the command line and calls one. The TypeScript commands open on `#!/usr/bin/env bun` and run as source, since `bun` runs TypeScript inside `node_modules`. The sealing command is plain `.mjs` under `#!/usr/bin/env node`, its logic in `src/scripts/seal-document.mjs` (named `build-gate-payload.mjs` before 0.18.0), and the print command is `bash`; it needs Chrome (the `CHROME` variable names another binary), `python3`, and `curl`.

## Sections

`@atelic-action/ui/sections` is the marketing template's page library, moved here in 0.19.0 (ATE-643) so a fix reaches every website with one version bump. A section renders from props alone: the copy, the images, and the links come in as data, and the business's facts come in through a `site` prop typed from the `SiteConfig` contract, which the entry exports. A section that reads the config takes only the keys it uses (`MapEmbedSite`, `LocationSectionSite`, `ContactInfoCardSite`, `Pick<SiteConfig, "cta">` for `CTASection`), so a whole `SiteConfig` passes as it is and an app can pass less. No section imports a router, a site file, or a stylesheet.

```tsx
import { SiteShell } from "@atelic-action/ui/chrome";
import { CTASection, Hero } from "@atelic-action/ui/sections";

<SiteShell site={site} currentPath={pathname} heroNav>
	<Hero title="Bread worth the early line." primaryCTA={site.cta} />
	<CTASection site={site} title="Skip the line, keep the bread." />
</SiteShell>;
```

### The Stylesheet

Every rule sits in `@layer atelic-ui` and answers to `.atelic-ui`. A site imports `@atelic-action/ui/styles/sections.css` in its base sheet right after `primitives.css` and before its own sheets, so the order runs fonts, `base.css`, `chrome.css`, `components.css`, `primitives.css`, `sections.css`, `gate.css`, the site's own CSS, then `theme.css`. The five marketing primitives' styles joined `primitives.css`. A section that composes another sits after it in the sheet, the order the template's bundle gave them. One change against the template: a contact card's value column may break a long email address rather than push the page wider than a phone.

Moving into the layer changes one thing for a site: a rule in its own unlayered CSS now wins over a section's rule whatever the specificity, where before the section's rule could win by being more specific or later. Polish a site made to a section moves to `patterns.css` and keeps working; a site rule that only ever lost to a section's should be checked against the page.

### The Base Path

A site served under a prefix (`/proto`) says so once. `BasePathProvider` (from `@atelic-action/ui/routing`, a React context whose default base is "") hands the base to everything below it, and `Button`, `Chip`, `ImageFrame`, and every section that builds a link or an image source read it through `useBasePath` and `useWithBase`. A root absolute path gets the prefix; an external URL, a protocol link, a fragment, and a path that already carries the base pass through. `SiteShell` mounts the provider from its `basePath` prop, which defaults to `site.basePath`, so a page rendered inside the shell needs nothing more. The pure helpers (`normalizeBasePath`, `joinBase`, `stripBase`, `hasBase`) are exported beside it for a site's own code.

`@atelic-action/ui/routing` is TypeScript source like the rest, so Node cannot load it, and a Playwright spec runs under Node. The four helpers are therefore also built and exported alone as `@atelic-action/ui/routing/base-path` (1.0.0), the way the readers are, and a site's `e2e/` imports them from there:

```ts
// e2e/base.ts
import { marketingBasePath } from "@atelic-action/ui/vite";
export { hasBase } from "@atelic-action/ui/routing/base-path";
```

The provider stays in the source entry on purpose. A built copy of it would be a second React context, and a site mounting that copy would hand its base to none of the sections, which read the source one.

### SiteShell

`SiteShell` (in `@atelic-action/ui/chrome`) is the page wrapper: the `.atelic-ui` scope around the skip link, the header, `<main>`, the sticky CTA bar, the footer with its closing bar, and the watermark, all mapped from the `SiteConfig`. It takes `site`, `currentPath` (the package imports no router), `basePath`, and `nav` (defaults to `site.nav`), plus `heroNav`, `stickyCTA`, `footer`, `pageNav`, `navOnDark`, `hideNavCTA`, `density` (defaults to `site.density`; see [Density](#density)), `contactDock` (on by default; mounts the dock when `site.contactDock` is set), and `credit` (the practice's credit on the closing bar's right side; the copyright prints either way). 5.0.0 renames `CreditBar` to `ClosingBar` with no alias, replaces `.credit-bar` and `.footer-bottom` with `.closing-bar`, and `footer.note` prints at the far right of the closing bar. Since 6.0.0 the closing bar is two sides, `left` and `right`, that each take anything: left out, they are `Copyright` with the business's name and `Credit`, the practice's made with line; `null` empties a side. `credit` off empties the right side and keeps the copyright, and a `footer.note` stands in place of the credit whether `credit` is on or off. A site keeps a wrapper a few lines long:

```tsx
import { SiteShell as Shell, type SiteShellProps } from "@atelic-action/ui/chrome";
import { useLocation } from "@tanstack/react-router";

export function SiteShell(props: Omit<SiteShellProps, "currentPath" | "basePath">) {
	const currentPath = useLocation({ select: (location) => location.pathname });
	return <Shell {...props} currentPath={currentPath} basePath={import.meta.env.BASE_URL} />;
}
```

### The Default Footer

Every site's footer has one shape, and `Footer` draws it (7.0.0):

- **The brand column:** the logo, then the Google rating as plain text beside five stars (never a link), then the one address, the headquarters, linked to the business's Google profile, then the phone and the email, each a link.
- **Four link columns:** Company, Resources, Social, and Legal, in that order. A Social link carries its icon in front of its words. A column with no links is left out, and the grid sizes itself to the columns shown.
- **The closing bar:** `ClosingBar` under it all, `Copyright` with the business's name on the left and `Credit` on the right.

The rating's five stars read `--star-fill`, the same token `StarRating`'s filled star reads, and fall back to `--review-gold` (`#f5b301`) when a theme sets none, so one line in `theme.css` recolors every star on a site (8.0.0). The logo is the mark cut for a dark surface (`logo.onDark`) when the site gives one, else `logo.src`.

The header carries the services and the service areas, so the footer does not repeat them. It holds no blurb, no hours, no call to action, and no credential badges; a site that needs one of those puts it on a page.

`SiteShell` fills the footer from the `SiteConfig`, so a site names nothing twice:

| The footer shows | From the config |
|---|---|
| The rating | `footer.rating`, as printed (`"4.8 on Google"`) |
| The address and its link | `address` and `mapLinkURL`; `footer.showAddress: false` drops the address |
| The phone and the email | `phone`, `email` |
| Company | `nav` |
| Resources | `footerLinks` |
| Social | `socialLinks`, each with its `icon` (`facebook`, `github`, `instagram`, `linkedin`, `mail`, `star`, `user`, `youtube`) |
| Legal | `legalLinks` |
| The closing bar's right side | the practice's credit, or `footer.note` in its place |

A site whose footer genuinely needs other columns names them outright in `footer.columns`, which replaces the derived four. Rendering `Footer` directly, a site passes `columns` itself.

Moving to 7.0.0: `footerBlurb` and `footer.contactHeading` are gone from the config, and `Footer` no longer takes `blurb`, `socialLinks`, `links`, `extraLinks`, `contactHeading`, `hours`, or `legalLinks`. Delete `footerBlurb` from the site config; the rest carries over through the mapping above. The hours stay in the config for the structured data and the page sections that print them.

### The Mega Menu

A nav entry in the config is a page or a group. A group is an entry with `columns`, its panel's sections from left to right; its `to` is the group's own page. On a desktop the label is a control that opens a panel under the bar, as wide as the page's wrap whatever it holds, and every panel opens to the same height (440px), the feature card's, so moving along the bar never makes it jump. A mouse hover or a keyboard focus opens a group, a click pins it open, and Escape, a click outside, or focus leaving it closes it; left and right walk the bar, the down arrow steps into the panel, and up and down walk every link in it, whatever section holds it. A closed panel stays in the HTML, `inert`.

A section is one of four kinds, named by `kind`; a section without one is a link column:

| Kind | What it draws | Its data |
|---|---|---|
| link column (`kind` left out, or `"links"`) | A mono heading over its links. The heading is itself a link when it has an `href`. A link may carry a `description` under it, a `badge` ("Popular") in a pill after its label, and `children`, drawn indented under it with an elbow, each with its own `badge` | `{ heading, href?, links: [{ label, href, description?, badge?, external?, children? }] }` |
| `"picture"` | One photo filling the section, its caption over a wash at the foot, the whole of it a link named by the caption | `{ kind: "picture", image: { src, alt? }, caption, href }` |
| `"rows"` | Icon rows two across under an optional heading: a lucide icon by name, a label, and a short line, one row (`highlight`) set on the primary | `{ kind: "rows", heading?, rows: [{ label, description?, icon, href, highlight? }] }` |
| `"cards"` | Small cards under an optional heading, set off by a rule: a kicker, a title, and a meta line beside a square picture, or a quiet tile without one | `{ kind: "cards", heading?, cards: [{ kicker?, title, meta?, image?, href }] }` |

A row's `icon` is one of `calculator`, `calendar`, `card`, `chat`, `document`, `help`, `home`, `mail`, `map`, `phone`, `pin`, `play`, `shield`, `star`, `tool`, `truck`, and `users` (the `NavIcon` type), each a lucide icon. `feature` is the card at the panel's right, 340px wide on `--primary-deep`: a picture taking the height the words leave, an eyebrow, a headline, a line (`text`), ticked `points` (`TickList`), and its action as a `Button` with the arrow, which turns light on the card (`.on-primary`). `allLabel` is off unless given; given, it links the group's own page first in the panel at a column link's weight.

On a phone and a tablet the menu opens each group as an accordion, one at a time, and every group starts closed whenever the menu opens, the one holding the current page included. It draws the same data: each section's heading, a link's children indented under it with the same elbow, the badges kept, icon rows and cards as plain links of their labels and titles, and a picture left out, since its link is a desktop flourish and the menu pins its own action at the foot. A plain entry wears a number, and the numbers count plain entries alone, so a group between them leaves no gap.

```ts
// src/site.config.ts
nav: [
	{
		label: "Menu",
		to: "/menu",
		columns: [
			{
				heading: "Bread",
				href: "/menu/bread",
				links: [
					{
						label: "Country sourdough",
						href: "/menu/sourdough",
						children: [{ label: "Seeded", href: "/menu/seeded" }],
					},
					{ label: "Morning buns", href: "/menu/buns", badge: "Popular" },
				],
			},
		],
		feature: {
			eyebrow: "Order ahead",
			title: "Skip the Saturday line.",
			points: ["Order by Friday noon", "Pick a pickup time", "Pay at the counter"],
			cta: { label: "Order ahead", href: "/order" },
			image: { src: "/images/menu-feature.jpg", alt: "The ovens at dawn" },
		},
	},
	{
		label: "Visit",
		to: "/visit",
		columns: [
			{ kind: "picture", image: { src: "/images/menu-shop.jpg" }, caption: "Bread from the back of the shop.", href: "/visit" },
			{
				kind: "rows",
				heading: "Plan a visit",
				rows: [
					{ label: "Order ahead", description: "Pick a loaf and a time", icon: "calendar", href: "/order", highlight: true },
					{ label: "Questions", description: "Plain answers", icon: "help", href: "/faq" },
				],
			},
			{ kind: "cards", heading: "Latest", cards: [{ kicker: "From the blog", title: "Why the rye takes three days", meta: "4 min", href: "/blog/rye" }] },
		],
	},
	{ label: "About", to: "/about" },
],
header: { phones: [{ e164: "+15555550100", display: "(555) 555-0100", label: "The shop" }] },
```

`SiteShell` puts the base path on every link and picture a section holds. The footer's Company column lists the entries themselves and never a group's links. A bar holding a group or a number keeps the burger up to 1180px instead of 900px, since it needs the room; the second of two numbers shows from 1360px, and the menu lists both. `header.phones` takes up to two, each a tel link; the first is also the round call button beside the burger on a phone.

`contactDock` in the config turns on the floating launcher: `label` is the launcher's words, `title` and `subtitle` the panel's head, `footnote` its foot, and `items` the ways to reach the business, each `{ label, description, icon, href }` or, for something already on the page such as a chat vendor's window, `{ label, description, icon, onSelect }`: the type takes one or the other and never neither. A dock item always points at the business's own flow. The dock lifts over the phone's sticky bar while it shows and rides above the footer as it scrolls in. It finds the bar by the `data-dock-lift` attribute `StickyCTABar` wears, which keeps `data-showing` current (`lift` names another selector), and the footer by `avoid`, a ref or a selector, which `SiteShell` fills with a ref to its own footer. It finds both again only when the page's elements change (a route change, a bar that mounts late) and measures again when either, or the page, changes size, never querying the page on a scroll frame. Rendered with `track={false}` it sets no inset of its own and sits in the stylesheet's corner, 24px in from the right and the bottom, 16px on a phone.

### Density

The space a section leaves above and below itself is one token, `--section-space`, with three settings chosen by `data-density` on the `.atelic-ui` root. `SiteShell` sets it from its `density` prop, which defaults to `site.density`:

| Setting | `--section-space` | `--block-gap` | `--card-min` |
|---|---|---|---|
| `default` | `clamp(36px, 4.6vw, 64px)` | 28px | 0 |
| `comfortable` | `clamp(56px, 9vw, 120px)` | 44px | 240px |
| `compact` | `clamp(24px, 3.2vw, 44px)` | 20px | 0 |

`.section` pads with it, and the steps derived from it keep their old proportion to it: `.section-md` 0.7, `.section-sm` 0.6, `tight-top` and `tight-bottom` a third, the `PricingBand` 0.84, `PageHero` and the not found opener 0.72 on top and 0.5 below, and the `FeatureDetail` rows 0.6, whose first and last rows now sit flush with the section around them. `--block-gap` is the space between a section's heading and the grid under it (`FeatureGrid`, `ProfileCards`, `LinkColumns`, `CalloutPanel`, and `Gallery` at 0.77 of it), and `--card-min` the least a `FeatureGrid` card stands. A site that wants its own value sets the property on `.atelic-ui` in its own sheet, outside the layer. `ArtifactShell` pins `comfortable`, so a document reads as it did; the app shell reads none of these.

### Moving to 8.0.0

- **The spacing default tightened.** Every section pads by the table above, so a site's pages run shorter. A site that wants its old look sets `density: "comfortable"` in its config. Check any section a site padded by hand in its own sheet against the new rhythm.
- **`.nav-links a` became `.nav-links > a`** so a panel's links keep their own styling. A site rule written against the old selector should be checked against the bar.
- **Surfaces:** `BlogIndex`, `BlogPost`, `LegalPage`, `LocationSection`, `Locations`, `ProfileCards`, and `ReviewCarousel` take `surface` like the sections that had it, and `PageHero` takes it defaulting to `alt`. Nothing alternates on its own except the `FAQBrowser`'s subject bands, every second one now on the alternate surface.
- **Eleven components are gone**, none of them used by any site, app, or runner: the sections `DeviceShowcase`, `MediaBand`, `CTABanner`, `PressQuotes` (with `sortPress` and the `PressItem` type), `SocialStrip`, and `MenuList`; the app shell's `CardErrorBoundary`; and the email pieces `MonoTable`, `StatStrip`, `WhatMoved`, and `RecordTimelineLegend`. Their props types and their styles (`.cta-banner`, `.device-*`, `.media-band`, `.menu-list`, `.press-quotes`, `.social-strip`) went with them. A page that still imports one fails to build: a banner moves to `CTASection` or a site's own `SplitSection`, a press row to `ReviewCarousel` or `LogoMarquee`, a photo strip to `Gallery`. The template's example pages that use `CTABanner`, `PressQuotes`, and `SocialStrip` are repointed in the template.
- **The mega menu takes more than link columns.** `columns` is now the panel's sections (`NavPanelSection`): a link column as before, or a `picture`, `rows`, or `cards` section; a link takes `badge` and `children`, and the feature card takes `points`. The panel is the wrap's width and 440px tall whatever it holds, the feature card is 340px on `--primary-deep`, and its action is the `Button` primitive. `allLabel` stays off unless given and now reads as a plain link at a column link's weight, where it was a bold primary line with an arrow. Existing groups render with the new spacing (a link at 17px, the panel's padding 36 by 40) and nothing to change in the config.
- **The brand mark.** `logo.onLight` and `logo.onDark` take the brand's own artwork per surface, never recolored, and `logo.wordmark: false` drops the live name. A site passing `logo.src` alone changes in one way: its mark is as tall as `--brand-mark-height` (30px) and as wide as its own ratio, where the header squeezed every mark into a 30 by 30 box, so a square mark looks exactly as it did and a wider one stops being squashed. The light bar still tints it to ink. The footer draws `logo.onDark` when it is given.
- **Every raw color and weight in the sheets is a token**, each defaulting to the value it replaced (see [Tokens](#tokens)), so a site that sets none looks the same, with one rounding exception: the reveal slider's before label and line read `--scrim` (`#140f0b`) where they had `rgb(20 16 12)`, one step lighter in green and blue. A theme sets `--on-primary` for a primary light enough to want dark words, and the weight tokens for a font kit that lacks 500, 600, or 800. A site that styled against `#fff` in its own sheet is unaffected.
- **`ContactDockItem` is a union:** an item has an `href` or an `onSelect`, and a config with neither no longer compiles. `ContactDock`'s `avoid` takes a ref as well as a selector, `lift` names the bar it rides over (default `[data-dock-lift]`, which `StickyCTABar` now wears), and with `track={false}` it sets no inset of its own. `SiteShell` hands the dock a ref to its footer, so a page's own `footer` element can no longer be mistaken for it. `Footer` and `ClosingBar` take a `ref`.
- **Smaller changes:** the sections' `surface` props share one exported type, `Surface`; `ProcessSteps` takes `id`; `FeatureGrid` takes `lead`; `Button` calls `onClick` on a link as well as a button; `SiteMenu` numbers plain entries alone, so a group no longer leaves a gap in the count; a `StatRow` figure given as words wraps instead of pushing the page sideways; `FullBleedVideo` mounts its video, and fetches the clip, only once the band is within a screen of the viewport; the split hero's copy starts where a `.wrap`'s content does at any width; and the FAQ's icon buttons hover with a wash of the text color, which shows on an alternate band.
- **Fixes the package now owns:** a primary button or an eyebrow inside `.on-primary` (the split hero, the callout panel, the menu's feature card, or a site band wearing the class) turns light, and the footer's stars read `--star-fill`.

### Every Section

| Section | What it is |
|---|---|
| `Hero` | The home page opener: a full bleed image (or the token gradient), a headline with a serif accent, a pair of actions, trust figures, and a scroll cue; `layout="split"` sets the copy on the primary field beside the photo, stacking photo first on a phone |
| `ProofStrip` | One row of short proof facts under a hero, a figure over its label each |
| `FullBleedVideo` | A silent looping clip edge to edge, the poster first and the clip only while on screen |
| `CalloutPanel` | Short callouts on the primary field, titles and subtitles each on a shared line |
| `LinkColumns` | Columns of links under a heading, a link's figure right aligned in tabular numerals |
| `PageHero` | The interior page opener on the alternate band; children sit under the lead |
| `LogoMarquee` | A dark band of chips scrolling without end: credentials, clients, or press |
| `SplitSection` | The two column band: copy beside copy, or media beside copy. `ratio` is `even`, `narrow-first`, or `media`, a fixed 420px shot column and the gap a card row uses, so a photo beside copy lines up with a case study entry above it; `even` and `narrow-first` stack below 920px, `media` below 761px |
| `PricingBand` | A brand colored band with the price in a card beside it, informational by design |
| `CTASection` | The standard closer: the site's own primary action and an optional ghost second |
| `FeatureGrid` | Numbered cards with a hover lift; a card is a link or holds one, never both |
| `FeatureDetail` | Alternating copy and media rows with tags and a tick list |
| `ProcessSteps` | A dark band of numbered steps beside a frame |
| `PricingCard` | A standalone price card with a tick list and its booking action |
| `ExpandList` | A light accordion of numbered rows whose bodies stay in the HTML while closed |
| `ComparisonTable` | A graded before and after that scrolls sideways on a phone rather than reflowing |
| `RevealSlider` | Drag or arrow keys to compare two frames, each with its own toned shot brief before photography |
| `ReviewCarousel` | The aggregate beside one large review at a time, stepped by dots and arrows, each review linking to its source |
| `ReviewWall` | The reviews page: tag filter and sort when the data carries them, clamped quotes behind Read more |
| `ProfileCards` | Equal weight cards of media beside a short bio |
| `Gallery` | A captioned wall of the business's own work, a shot brief where a photo is missing |
| `CredentialList` | Credential cards with a mono code before each |
| `LocationSection` | The local search section: service areas as prose, hours, directions, and the map |
| `Locations` | More than one address: the flagship's map beside a card for each location |
| `MapEmbed` | The map: a screenshot linking to directions, or a click to load facade over the live embed |
| `HoursTable` | Day rows with dashed rules and mono times |
| `ContactForm` | Validated form with a honeypot that posts to `endpoint` (or hands off to mail); `onLead` replaces the default GA4 `generate_lead` event |
| `ContactInfoCard` | A dark card of direct contact rows: call, email, visit, portal |
| `FAQBrowser` | The help page: live search, a sticky `JumpRail` of categories with scroll spy, expand all, deep links; `contactHref` sets where the no match line points |
| `JumpRail` | Sticky in page pill tabs with scroll spy, used by `FAQBrowser` and on its own |
| `BlogIndex` | The post listing as a readable stack |
| `BlogPost` | One article: back link, title, byline and dateline, body |
| `LegalPage` | A legal document from data, its last revised date first |

The primitives that came with them, in `@atelic-action/ui/primitives`: `ImageFrame`, `ProseBlocks`, `QuoteCard`, `StarRow`, and `TickList`, with `Bubble` (see Primitives) shown beside them in the gallery. `StarRow` stays beside `StarRating` on purpose: it draws only the filled stars a review shows, in whole steps and the brand color, named "4 out of 5 stars", where `StarRating` draws the whole scale with outlines in half steps and can take a rating.

The entry also exports the helpers the sections use, for a site's own code: `formatClock`, `formatHoursRange`, and `isClosed` for hours, `isHoneypotFilled`, and `trackEvent`.

Hours print on the 12 hour clock unless the site's config sets `clock: "24h"`, which turns "9a to 5p" into "09:00 to 17:00" everywhere hours appear: `LocationSection` and `HoursTable` (which takes `clock` as a prop when used on its own). `formatClock` and `formatHoursRange` take the same `clock` option for a site's own code.

### The Marketing Vite Config and Commands

```ts
// vite.config.ts
import { marketingConfig } from "@atelic-action/ui/vite";
import { site } from "./src/site.config";

export default marketingConfig({ site, pages: [{ path: "/blog/first-post" }] });
```

`marketingConfig` carries what the template's `vite.config.ts` did: Vite's `base` and the router's `basepath` from `site.basePath` (or a `VITE_BASE_PATH` rehearsal), a refusal when a based `site.url` does not end with its base, TanStack Start prerendering with the crawler and the 404 page (copied to `404.html` by the build), the pages a site names, a sitemap on the origin of `site.url` (`sitemapHost` to change it) and none for a based cut, React, the `@` alias, and `ssr.noExternal`. `extend` merges a site's own needs over it. It leaves `build.cssCodeSplit` at Vite's default (1.0.0): every sheet rides in the site's one base sheet, so no component imports a stylesheet, and with the flag forced off TanStack Start fails the build looking for a `style.css` that is never written. A site that gives a component its own stylesheet again passes `extend: { build: { cssCodeSplit: false } }`. A site's scripts:

```json
{
	"build": "tsc -b && vite build && cp dist/client/404/index.html dist/client/404.html && atelic-clean-sitemap && atelic-stamp-health && atelic-check-base-path",
	"check:links": "atelic-check-links",
	"check:contact": "atelic-contact-canary"
}
```

`playwright.config.ts` serves the build with `atelic-serve-static`, which serves a based build both under its prefix and without it, as the template's copy did.

### Thinning a Marketing Site

A site that takes 0.19.0 deletes its copies and repoints its own files. The template's `src/components/sections/`, the five primitives and their sheets, the `Button` and `Chip` wrappers, `chrome/SiteShell.tsx`'s body, `siteConfig.ts`, and the scripts all go; a route or section the site added that imports one of them repoints:

| Old import | New import |
|---|---|
| `@/components/sections/<Name>` (all 35, their types included) | `@atelic-action/ui/sections` |
| `@/components/primitives/Button`, `Chip` | `@atelic-action/ui/primitives` (the wrappers die; the base comes from `BasePathProvider`) |
| `@/components/primitives/ImageFrame`, `ProseBlocks`, `QuoteCard`, `StarRow`, `TickList` | `@atelic-action/ui/primitives` |
| `@/components/chrome/SiteShell` | The site's few line wrapper above, around `SiteShell` from `@atelic-action/ui/chrome` |
| `@/components/siteConfig` | `@atelic-action/ui/sections` (`SiteConfig`, `NavItem`, `CTA`, `OpeningHours`, `Address`, `Founder`, `GateConfig`, `SiteLink`, `SocialLink`) |
| `@/components/newTabProps` | `@atelic-action/ui/artifact` (`newTabProps`) |
| `@/shared/lib/hours` | `@atelic-action/ui/sections` (`formatClock`, `formatHoursRange`, `isClosed`) |
| `@/shared/lib/honeypot` | `@atelic-action/ui/sections` in a component; `api/contact.ts` keeps its own copy, since Vercel runs a function's package imports uncompiled |
| `@/shared/lib/analytics` (`trackEvent` only) | `@atelic-action/ui/sections`; the rest of the module, the click listener, stays in the site |
| `@/shared/lib/basePath` (`normalizeBasePath`, `joinBase`, `stripBase`, `hasBase`) | `@atelic-action/ui/routing`; in a component, `useWithBase()` in place of `withBase`; in `e2e/`, `@atelic-action/ui/routing/base-path` |
| `@/shared/lib/basePathAudit`, `@/shared/lib/sitemap` | Gone, inside `atelic-check-base-path` and `atelic-clean-sitemap` |
| `scripts/clean-sitemap.ts`, `check-base-path.ts`, `contact-canary.ts`, `stamp-health.ts`, `check-links.ts`, `serve-static.ts` | `atelic-clean-sitemap`, `atelic-check-base-path`, `atelic-contact-canary`, `atelic-stamp-health`, `atelic-check-links`, `atelic-serve-static` |
| `vite.config.ts` | `marketingConfig`, above |
| The `import "./<name>.css"` in each component | `@atelic-action/ui/styles/sections.css` in the base sheet, after `primitives.css` |
| `middleware.ts` | The marketing matcher in [The Access Gate](#a-marketing-sites-matcher) |

The `.mkt` wrapper a site's own routes render becomes `.atelic-ui`, the scope every package sheet answers to.

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

The Company Cards additions (0.7.0, from the `Company Cards IA` design, 2026-09-29) ride on the same item and change nothing for a record without them. `badges` is a list of further pills after `badge`, each with a `tone`: `faint` is the quiet stage word, `ink` a bold pill in ink on a 1.5px border (the next touch), `accent` the same in the accent (New). `timeline` (`{ days, touches, opens }`, each day count back from today) draws the record's recent days between the title and the meta line as one table cell per marked day and one per run of empty days between them (seven cells for three marks, never thirty, since Gmail clips a message past about 100 KB), an 8px ink square on each send day and a 5px accent dot on each known open day, the two stacked when they share a day, all standing on a `line` hairline with a 1.5px ink tick at today's edge and an axis row beneath (`30d` on the left, `today` on the right); nothing is positioned, so it survives Gmail. `RecordTimelineStrip` renders one on its own. `aside` (`{ text, strong, tone }`) sets a fact right on the meta line with its number in bold and colored by tone: `up` fresh, `warm` cooling, `accent` cold. In the text twin every pill follows the title in brackets, the timeline is one character per day (`10d [#······@·o|]`: `#` a send, `o` an open, `@` both, `·` nothing, `|` today), and the aside ends the meta line; `recordTimelineText` and `recordBadges` are the helpers it uses.

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
	<Row last>
		<RecordStack records={records} />
	</Row>
</Card>;

const text = recordStackText(records);
```

`renderEmail` builds the document shell itself and puts only the rows through React, because React emits no doctype, React 19 hoists and reorders head tags, and it would escape the `>` in `details>summary`. `renderFailureEmail` is the same shell around `FailurePage`. Both live at `@atelic-action/ui/email/render`, apart from the components, so a site that mounts a component on a page never pulls React's server renderer into its browser bundle.

The failure page takes two optional strings (4.1.0): `step`, what failed as a short label (`"Claude model call"`), and `fix`, what to do in a sentence or two that may hold a command. Given either, the reason line under the headline becomes a labelled block, one row per fact on a hairline with a faint eyebrow over its value: What Failed (the step), Why (the reason), and What to Do (the fix, its label in the accent and its value in mono), then the log tail under its own Log eyebrow. A row whose value is empty or only whitespace is left out, so an empty reason leaves no bare Why. The preheader leads with the step when there is one (`Claude model call: OAuth token revoked`). Given neither, the page is byte for byte what it was before, held by a frozen copy in `tst/email/frozen/`.

```ts
renderFailureEmail({
	runnerTitle: "Brief",
	eyebrowText: "Week 47",
	step: "Claude model call",
	reason: "OAuth token revoked, status 401",
	fix: "Run claude setup-token, then push the new token to the vault.",
	logTail,
});
```

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
| `bar` | `Bar` | `logged`, `target` |
| `group_row` | `GroupRow` | `text`, `first` |
| `target_row` | `TargetRow` | `text`, `logged`, `target` (null is a count with nothing to measure it against), `note`, `last` |
| `scoreboard` | `Scoreboard` | `children`, the `GroupRow` and `TargetRow` rows |
| `read_block` | `ReadBlock` | `text`, `divider` |
| `sub_eyebrow` | `SubEyebrow` | `text` |
| `badge` | `Badge` | `letter` |
| `day_strip` | `DayStrip` | `days`, `last` |
| none | `RecordStack` | `records`, each with an optional `badge`, `callout`, and since 0.7.0 `badges`, `timeline` and `aside` (born here on 2026-09-24, with no jq counterpart) |
| `records` | `Records` | `columns`, `rows`; a cell's `html` is a `ReactNode` |
| `masthead` | `Masthead` | `title`, `wordmark` (defaults to `atelic`), `meta` (added 0.5.0, no jq counterpart) |
| `title_card` | `TitleCard` | `eyebrowText`, `headlineLines`, `lede`, `stats` (the rows under the lede, in place of the jq's `$stats_html`) |
| `footer` | `Footer` | `meta` |
| `page` | `renderEmail` | `title`, `preheader`, `children`, `palette`, `fonts` |
| `failure_page` | `renderFailureEmail`, or `FailurePage` as body rows | `runnerTitle`, `eyebrowText`, `reason`, `logTail`, and since 4.1.0 the optional `step` and `fix` (no jq counterpart) |

The plain text alternative part ports as plain functions with no React anywhere in them: `spaces`, `rpad`, `lpad`, `wrap`, `textRule`, `textSection`, `textRead`, `textBar`, `textTarget`, `textTableGrid`, `textTable`, `recordStackText`, `textWidth`, plus `asciiUpcase` and `asciiDowncase`. Every width counts Unicode codepoints, the way jq's `length` does.

`tst/email/expected/` holds frozen goldens generated from the jq library, and the component tests compare the rendered DOM against them. See that folder's README before touching one.

### Tokens

The sheets read a set of tokens beyond the theme's palette, type, radii, and layout. Each has a default, declared once in `components.css` on `:where(.atelic-ui)`, which weighs nothing, so a theme's own `.atelic-ui` rule wins and sets one only to change it; every default is the value the sheets used before it was a token, so a site that sets none looks as it did (8.0.0). No layered sheet paints a raw color anywhere else: `tst/no-raw-colors.test.ts` fails on a hex, a color function, or a named color outside a token's declaration, with its few exceptions listed in the test, each with its reason.

| Token | Default | What it colors or sets |
|---|---|---|
| `--on-primary` | `#fff` | Anything set on the primary color: a primary button's words, the dock's head and lead icon, the split hero's copy, the callout panel, the price band, a step bubble's badge, a menu badge, a highlighted menu row, the feature card |
| `--on-dark` | `#fff` | Anything on a dark band or over a photograph: the skip link, the transparent header, the dark header's text (mixed with `--surface`), the phone menu's rules, the footer's headings and links, a hero's headline, the contact card, the process band, a ghost button and a chip on dark, the reveal slider's handle |
| `--on-dark-chip` | `#efe7da` | A chip's words on a dark band (the credentials chips, `Chip onDark`) |
| `--on-dark-quiet` | `rgb(248 244 237 / 0.74)` | Quiet text on the dark process band |
| `--shade` | `#000` | Pure shadow: a lightbox backdrop, a caption's wash, a headline's text shadow, the dark button's press, and the fallbacks behind `--hairline` and `--shadow-md` |
| `--scrim` | `#140f0b` | The warm wash a hero lays over its photograph, and the reveal slider's before label |
| `--placeholder-ink` | `#8a7c68` | The hatching and ring of a placeholder before photography exists |
| `--hover-tint` | `rgb(33 28 23 / 0.06)` | The light bar's hover behind a nav entry |
| `--review-gold` | `#f5b301` | The footer rating's stars when the theme sets no `--star-fill` |
| `--grade-a` to `--grade-d`, each with `-line` and `-bg` | A `#1b7f3b`, B `#9a6b00` on `#c99a1a`, C `#a84500` on `#e8650a`, D `#b3261e`, grounds `#eaf6ee`, `#fdf5dc`, `#fff0e3`, `#fdecea` | The grade chip's words, rule, and ground, green to red whatever the brand is |
| `--weight-light`, `--weight-regular`, `--weight-medium`, `--weight-semibold`, `--weight-strong`, `--weight-bold`, `--weight-heavy` | 300, 400, 500, 600, 650, 700, 800 | Every font weight in every layered sheet. A font kit with only 400 and 700 maps each name to one of those (medium to 400, semibold, strong, and heavy to 700), so the browser synthesizes no weight |
| `--brand-mark-height` | `30px` | The header mark's height, and a sent document's recipient mark; the width follows the image's own ratio |
| `--section-space`, `--block-gap`, `--card-min` | `clamp(56px, 9vw, 120px)`, `44px`, `240px` | The section rhythm where no `base.css` sets it (an app importing `components.css` alone); with `base.css` the settings under [Density](#density) win |

Two more read a fallback in place: `--star-fill` colors every filled star (`StarRating`'s, which falls back to the text color, and the footer's rating, which falls back to `--review-gold`), and `--font-condensed` sets a `CalloutPanel` title's face. The tone palette (`--tone-good` and its kin) is under [Page Components](#page-components).

`@atelic-action/ui/tokens` carries the palette and the font stacks with no React import, so a build script or a plain text renderer can read them. `toThemeCSS(palette)` writes the palette out as the site token declarations (`--surface`, `--surface-dark`, `--card`, `--ink`, `--primary`), and `themeTokenMap` exposes which palette key each token takes.

The palette carries three optional keys beyond the jq's eight: `up` (`#2F7A4B`, a calm green) and `down` (`#B23A2E`, a calm red, kept well apart from the orange accent), the colors a record's aside or a change wears by its direction, and `warm` (`#B7791F`, an amber between `up` and the accent) for a record's aside that is cooling but not cold. All three read on the cream card. They are optional so a client palette written before 0.5.0 still compiles, and a palette without them borrows the Atelic values. None maps to a site token.

## Page Components

The blocks a page composes, each styled in `styles/components.css` inside the `atelic-ui` layer, so a site's own unlayered rule resizes or recolors any of them. They were cut from the SkySpec baseline writeup on 2026-10-02 (ATE-600), which is the worked example of them on one page.

| Component | What it is | Notes |
|---|---|---|
| `Checklist` | A short list of checks, each passed or failed | Two columns when there is room, one on a phone. `passLabel` and `failLabel` name the icons for a screen reader |
| `IconList` | A list whose bullets are icons | `icon` and `tone` on the list set every bullet; an item's own override them. The bullet is decoration, so a screen reader hears only the items. A dot when no icon is set; the text's color when no tone is |
| `ReportCard` | A name, a grade, and one line on it per row, in labeled groups, each row's parts centered on it | A row with `href` is a link from edge to edge with a chevron at its end; a link inside `line` still goes where it points. `before` sets the earlier grade faded beside the grade; no `grade` draws a dash read as not graded. `legend` explains the letters beside the `title`, or under the card with `legendAt="foot"`; `labels` sets the screen reader's words. The grade is `GradeChip` |
| `Rank` | A figure with its badge, for a table cell | `figure` is the rank, the place, or a dash for none; `tone` colors the badge and `meaning` names it for a screen reader; `href` links the figure, in a new tab with `newTab`. The figure's slot is a fixed width, so the badges line up down a column |
| `DataTable` | A table whose first column names each row, sortable by any column marked `sortable` | A click on a heading sorts on a wide screen. On a phone each row stacks, every fact wearing its column's label, and a dropdown sorts. A cell is a node, or `{ display, sort }` when what it shows is not what it sorts by; a formatted number in a string (`"$12,047"`, `"0.24%"`) sorts as a number. It renders in `defaultSort` on the server. Every other row sits on a tinted ground; `striped={false}` turns that off. A column marked `fit` hugs its content, for a swatch or a mark beside a figure. A column with a `hint` draws a `Hint` beside its heading, before the label when the column is right aligned; on a phone the heading row is hidden, so the hint is too. A cell given as `null` or `undefined`, or left out of a short row, is empty: it draws a short gray rule, the `.data-table-empty` class, which a screen reader hears as "None" or as the column's `emptyLabel`, and it sorts last whichever way the column runs. The first cell names the row, so it is never drawn as empty; give every row a name. A typed string is always content, a dash included, so type nothing for an empty cell. A document may wear `.data-table-empty` for its own neutral mark, so every empty cell reads the same |
| `Hint` | An info icon that opens a short explainer beside a word | Opens on hover or focus, stays open on a click or a tap, closes on Escape or a tap elsewhere. The bubble opens from the icon's left edge and slides left when it would run off the screen. `side="before"` puts the icon before its word, for a right aligned heading. `label` is what a screen reader calls the button; the bubble is its description. Print hides it |
| `StatRow` | A row of large figures, each over what it counts and its `period`. `variant="quiet"` is the glance row for a working page: a light figure in the text color over a small capitalized label, hairlines between; `unit` sets a figure's unit small beside it | `trend` draws an arrow before a figure that is itself a change. `deltas` list comparisons beneath: an arrow, how far, against what (`basis`), and the earlier figure (`was`), each in its own tone, since a spend falling and a cost falling read differently |
| `Callout` | One finding: an icon in its tone beside the title, the explainer under it | `variant="box"` sets it apart on a tinted ground, for something missing or owed |
| `Disclosure` | A section the reader opens and closes, in two forms chosen by whether `open` is passed | Controlled (`open` and `onToggle`), it is an app's card: the caller remembers what was folded, a closed body is not rendered, the label is the toggle, `meta` (a count, a flag) sits beside it outside its name, and `headingLevel` makes the label a real heading. Uncontrolled, it is a document's fold: a native `details` with a `summary` line that carries the point and `defaultOpen`, so it works before any script loads, find in page opens it, and it prints open. `Collapsible`, the fold's old name, was folded in at 0.18.0 |
| `Tabs` | Panels behind a row of tabs, on Radix for the arrow keys and the roles | Each tab's `id` names it in the URL: the tab is `<id>-tab`, its panel `<id>-panel`. A hash of `#<id>` opens the tab and scrolls to the tab row, and a hash naming any element inside a panel opens that panel and scrolls to it, on load, on a hash change, and on a click of a link to the hash already in the address bar, so a link in one panel lands on a finding in another. Every panel stays in the page: the inactive ones carry `hidden="until-found"`, so find in page reveals one and the tab follows. `defaultId` picks the first tab open; `selectedId` and `onSelect` hold it in the caller; either one naming no tab opens the first. Radix Tabs is a dependency of the package, so a site installs nothing for it. `ariaLabel` names the list and has no default. On paper the list is hidden and every panel prints under its label, as a heading at `headingLevel` (2 by default) |
| `StackedBar` | One bar split into the parts of a whole, with a key | A part of zero is keyed and not drawn |
| `ColumnChart` | A bar a period, the periods in groups that carry a label and a total | Months in quarters is the case it was cut for: a quarter reads against the one before it and the same one a year earlier |
| `ThresholdScale` | Zones on a scale and a pin for each reading | For a number judged against lines, like a load time against good and poor |
| `StarRating` | A row of stars showing a rating in half star steps, and taking one when given `onChange` | Each star is two hit targets; picking the current rating clears it. Editable, it is one slider to a keyboard and a screen reader; read only, a picture named by the rating. `fillColor` and `outlineColor` take any CSS color, `size` and `max` set the star and the scale |

**StarRating outside a site.** It is the one component that does not sit under `.atelic-ui` or read a theme token: its styles are in `styles/star-rating.css`, and its two colors are the `--star-fill` and `--star-outline` custom properties, falling back to the text color and a faint tint of it. An app that installs the package for this component alone imports that one sheet, not `components.css`.

**A part's own color.** `StackedBar` takes a `color` on a segment, any CSS color, for parts that are not good or bad (the protein, carbs, and fat of a meal), and it wins over `tone`. `showKey={false}` draws the bar alone for a page that keys the parts its own way; the bar keeps its spoken summary.

**Tones.** `good`, `warn`, `bad`, `info`, and `muted` are the one palette the package carries, because good, a warning, and broken read green, amber, and red whatever the brand is. A component sets `data-tone`, and `--tone`, `--tone-fill`, and `--tone-bg` follow for whatever sits inside. A site's theme may restate `--tone-good` and the rest on `.atelic-ui`; `info` and `muted` come from the theme's own primary and neutral tokens.

## In an App

The page components also work in an app that has its own base styles (Tailwind, shadcn) and wears none of the site chrome. Three things make that so (0.10.0):

1. **The same root class, without the site base.** Every rule in `styles/components.css` answers to `.atelic-ui`. An app imports no `base.css`, so the class brings no resets with it, and an app puts the class on the region that holds a package component and nothing else in it restyles. Prefer a region to `body`: the components use plain class names (`.stat .num`, `.callout`, `.note`), and an app with markup of its own under those names would have a page wide scope reach it. `body` is right only for an app that has checked it has none, and it is the one way to cover a component rendered in a portal.
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

## The App Shell

`@atelic-action/ui/app` is the shell every signed in Atelic app is built on, moved here from `template-application`'s `src/shared` and its two stores in 1.0.0: the mobile first frame (the desktop rail, the tab bar, the menu sheet), the `AppPage` scaffold and its toolbar, the auth guard, Google sign in with a JWT and refresh session against a JSON api, the transport and query layers, the auth and units stores, and the helpers the template carried (dates, phrasing, units, search, envelopes). `@atelic-action/ui/app/ui` is the shadcn kit the shell is set in. Unlike the rest of the package the shell imports TanStack Router and is styled with Tailwind, since an app is built on both. [ui.atelic.me/app](https://ui.atelic.me/app) shows all of it running a made up bakery.

### The Provider

The shell reads nothing from the app's files. The app hands it its facts once, through `AppProvider`, rendered around the router so the stores are hydrated before the first route loads:

```tsx
// src/main.tsx
import { AppProvider, ErrorFallback } from "@atelic-action/ui/app";
import { appConfig } from "@/app/config";
import { navItems } from "@/app/nav";

createRoot(rootElement).render(
	<StrictMode>
		<Sentry.ErrorBoundary
			fallback={(props) => <ErrorFallback {...props} showDetails={import.meta.env.DEV} />}
		>
			<AppProvider config={appConfig} nav={navItems}>
				<RouterProvider router={router} />
			</AppProvider>
		</Sentry.ErrorBoundary>
	</StrictMode>,
);

// src/routes/__root.tsx
function RootLayout() {
	return (
		<AuthGuard>
			<AppLayout>
				<Outlet />
			</AppLayout>
		</AuthGuard>
	);
}
```

| Prop | What it is |
|---|---|
| `config` | An `AppConfig`: `name` (aria labels), `mark` (the wordmark), `storagePrefix` (every storage key and cookie), `publicRoutes` (exact paths a signed out visitor may load), `publicPages` (prefix patterns ending in `/*`, rendered in the public chrome), and `apiBaseURL`, which the app resolves itself (`env.VITE_API_BASE_URL ?? "https://api.example.com"`), since the package never reads `import.meta.env` |
| `nav` | The `NavItem[]` every nav surface reads, sub pages as `children`; the one place a destination is declared |
| `queryClient` | Optional; defaults to the shell's, whose mutation cache raises `meta.toast` |
| `toaster` | Optional; sonner's `Toaster` at the top right by default, `false` for none |

Inside it, `useAppConfig()` and `useNav()` read the two facts, and `useUser()` the signed in user. The transport and the stores run outside React, so the provider also records the config where they read it; code that calls the api before the provider first renders calls `configureApp(appConfig)` itself. `AppConfigProvider` is the config and nav alone, for a test that mounts one surface.

**The user type.** The shell knows the fields it reads (`AppUser`: the name, the avatar, the username, the unit preferences). An app registers its own user once, and `useUser`, `useAuthStore`, and `session.me` hand it back typed in full:

```ts
// src/app/types.ts
declare module "@atelic-action/ui/app" {
	interface Register {
		user: User;
	}
}
```

**The stores moved with the shell**, because the transport cannot work without the auth store and the user context keeps the units store in step with the account. Both persist under the app's prefix exactly as before (`<storagePrefix>-auth`, `<storagePrefix>-units`), so a signed in browser stays signed in across the move. An app's own stores (`cookingStore` in pinole) stay in the app.

### The Stylesheet

The shell is Tailwind and shadcn, shipped as source like everything else here. `@atelic-action/ui/styles/app.css` carries the shadcn token mapping (`@theme`), the default light and dark token values, the base layer, and the `ap-*` scaffold; the app imports it straight after Tailwind, in its own Tailwind entry, and overrides any value in its own theme after it:

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "@atelic-action/ui/styles/app.css";

@plugin "tailwindcss-animate";
@plugin "@tailwindcss/typography";

/* The app's @font-face rules (it serves the files), then its own tokens. */
```

The import has to come before any other rule, or it is dropped without a word: the build passes and the shell renders unstyled. Tailwind never scans `node_modules`, so the sheet carries `@source "../app";`, which points Tailwind at the shell's components relative to the sheet, and the app adds nothing. An app that keeps its own tokens and does not import the sheet adds the equivalent line from its own stylesheet instead:

```css
@source "../../node_modules/@atelic-action/ui/src/app";
```

Proven on a copy of pinole-app thinned onto a packed tarball: with the line or the import, the built CSS holds every utility the shell uses; with neither, 165 of them are missing. The sheet sits outside the `atelic-ui` layer on purpose: its tokens and resets are in Tailwind's base layer and the scaffold is unlayered, as the template carried them, so the shell renders as it did.

### The Kit

`@atelic-action/ui/app/ui` exports the shadcn components the template carried: `Accordion`, `Alert`, `AlertDialog`, `Avatar`, `Badge`, `BadgeList`, `Button`, `Callout`, `Card`, `Checkbox`, `ClearButton`, `Command`, `CountryDropdown`, `Dialog`, `DropdownMenu`, `Form`, `Input`, `Label`, `OptionSelect`, `Pagination`, `Popover`, `Progress`, `SearchInput`, `Select`, `Separator`, `Sheet`, `Slider`, `Switch`, `Textarea`, and `Tooltip`, each with its parts. A new kit component lands here, not in an app, and it is written by hand into `src/app/ui/` and exported from its `index.ts`: the package carries no `components.json`, because `bunx shadcn add` writes its imports through the `@/` aliases the package never uses (consumers resolve none of ours), so a component taken from the shadcn registry has its imports made relative before it lands. The main entry adds the frame and its pieces (`AppLayout`, `AppPage`, `AppPageToolbar`, `Breadcrumbs`, `SectionCards`, `ActionButton`, `FormActionButtons`, `PageSkeleton`, `PageError`, `AuthGuard`, `ErrorFallback`, `GoogleGlyph`).

The app's stack is optional peer dependencies, so a marketing site installs none of it: TanStack Router and Query, Tailwind, `sonner`, `zustand`, `zod`, `react-hook-form`, `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, the Radix primitives the kit uses, `country-data-list`, and `react-circle-flags`, at the ranges `template-application` already pins. An app that imports the shell has them all already.

### Thinning an App onto It

Delete `src/shared/`, `src/stores/authStore.ts`, `src/stores/unitsStore.ts`, and their tests (`tst/shared/`, `tst/stores/authStore.test.ts`, `tst/stores/unitsStore.test.ts`), then repoint every import:

| Old Path | New Path |
|---|---|
| `@/shared/components/layout` and every file in it | `@atelic-action/ui/app` |
| `@/shared/components/ui/<name>` | `@atelic-action/ui/app/ui` |
| `@/shared/components/AuthGuard`, `CardErrorBoundary`, `ErrorFallback`, `GoogleGlyph` | `@atelic-action/ui/app` |
| `@/shared/context/SidebarContext`, `@/shared/context/UserContext` | `@atelic-action/ui/app` |
| `@/shared/hooks/useDebounce`, `useIsDesktop`, `useWakeLock` | `@atelic-action/ui/app` |
| `@/shared/lib/<name>`, every file but `env` | `@atelic-action/ui/app` |
| `@/shared/lib/env` | The app's own `src/app/env.ts`: `export const env = parseEnv(import.meta.env);` |
| `@/shared/types`, `@/shared/types/query` | `@atelic-action/ui/app` |
| `@/stores/authStore`, `@/stores/unitsStore` | `@atelic-action/ui/app` |

Then the handful of edits the seam asks for:

1. **`src/app/config.ts`** resolves `apiBaseURL` itself (`env.VITE_API_BASE_URL ?? "https://api.example.com"`).
2. **`src/app/types.ts`** registers its `User` (above).
3. **`src/main.tsx`** wraps the router in `AppProvider`, and passes `showDetails={import.meta.env.DEV}` to `ErrorFallback`, which no longer reads the environment.
4. **`src/routes/__root.tsx`** keeps only `AuthGuard` and `AppLayout` around the `Outlet`; the query client, the rail state, the user, and the toaster are the provider's.
5. **`src/styles/globals.css`** keeps Tailwind, its plugins, its fonts, and any token of its own, and imports `app.css` in place of the `@theme` block, the token sets, the base layer, and the `ap-*` scaffold.
6. **`activeSection(pathname)`** takes the items now: `activeSection(pathname, navItems)`.
7. **`components.json`** no longer has a `src/shared` to add to; a new kit component is written by hand in the package's `src/app/ui/` (see [The Kit](#the-kit)).

**Tests.** Mocking `@atelic-action/ui/app` replaces what the app's own code imports from it, and nothing the shell imports from itself. A component that calls `session.me` sees a mock written over the entry (`vi.mock(import("@atelic-action/ui/app"), async (original) => ({ ...(await original()), session: mockSession }))`), but the transport reads the auth store, the token refresh, and the config through its own relative imports, so a mocked `useAuthStore` or `ensureValidToken` never reaches `apiFetch`. A test that runs through the transport (a feature's api module, a query hook) therefore drives the real shell and mocks only `fetch`:

```ts
import { configureApp, useAuthStore } from "@atelic-action/ui/app";
import { appConfig } from "@/app/config";

beforeEach(() => {
	configureApp(appConfig);
	useAuthStore.setState({
		token: "test-token",
		refreshToken: "test-refresh",
		expiresAt: Date.now() + 60 * 60 * 1000,
		user: testUser, // the app's own fixture user
		isAuthenticated: true,
	});
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [] })));
});
```

An `expiresAt` an hour out keeps the refresh path quiet; one inside five minutes sends the transport to the refresh endpoint first, through the same mocked `fetch`.

## The Gallery

`gallery/` is two static pages. The Components shows everything the package exports that draws (the chrome, the page components, the sections, the pieces a document is built from, and the email) on its own with made up data for a fictional bakery, wearing the practice's own palette and type. It lives at [ui.atelic.me](https://ui.atelic.me), noindexed and disallowed in its `robots.txt`, since it is for the people building with the package and never search inventory. It imports the components and stylesheets from `src/` by relative path rather than from npm, so it always shows the code in the repo, and it reads the package name and version from `package.json` at build time. It sits outside `src/`, so it is never published. The second page, [ui.atelic.me/app](https://ui.atelic.me/app) (`gallery/app.html`), runs the app shell for a made up bakery's ops app, on Tailwind through `@tailwindcss/vite`, with its own stylesheet set up the way an app's `globals.css` is; the plugin leaves The Components' plain sheets as they are.

```bash
bun run gallery:dev    # a dev server on the repo's own source
bun run gallery:build  # the static page, written to gallery/dist
```

`vercel.json` builds it the same way and serves `gallery/dist`. Typecheck and lint cover it, and CI builds it, so a component change that breaks the gallery fails CI. **A new component gets a gallery section in the same change**, with each of its meaningfully different forms shown. `gallery/parts.tsx` holds the frame pieces (`Piece`, `Example`, and `Frame`, which holds a fixed piece inside the page), and a group of pieces lives in a file of its own beside `Gallery.tsx` (`chrome.tsx`, `artifact.tsx`, `email.tsx`), mounted there with one element. The composed documents are shown by `@atelic-action/artifact`, through its own stubs.

## Releasing

1. Bump `version` in `package.json` and merge it to `main`: patch for a fix, minor for a new component or prop, major for a breaking prop or class rename.
2. Tag the merged commit `vX.Y.Z` with the same version and push the tag:

   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

3. The Publish workflow checks that the tag matches the version, runs the gates, and publishes to npm with provenance. It authenticates through npm trusted publishing (the package's Trusted Publisher names this repo and `publish.yml`, and its allowed actions must permit direct `npm publish`, since a configuration created after 2026-09-03 allows only `npm stage publish` by default), so no token is stored, and it needs npm 11.5.1 or later, which Node 24 ships.
