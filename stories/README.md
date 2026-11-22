# Writing Stories

How a story is written here, so every component's stories read alike and every one runs as a test. The commands and how the run works are in the root README's Storybook chapter; this file is the rules.

## Where a Story Lives

- One file per component, `stories/<kind>/<Component>.stories.tsx`, the folder mirroring `src/`: `chrome/`, `sections/`, `primitives/`, `components/`, `artifact/`, `email/`, `app/`. `foundations/` holds the stories that prove the setup itself (the layer order, the viewports).
- The title is written out, never derived: `title: "<Kind>/<Component>"`, the kind in Title Case matching the folder (`Chrome/SiteHeader`, `App/Breadcrumbs`). The first segment picks the frame the story is mounted in (below), so it must be right.
- Import the component from `src/` by relative path (`../../src/chrome`), never from the package name.

## The Shape

CSF 3, a typed meta, and one named export per story:

```tsx
const meta = {
	title: "Sections/ProofStrip",
	component: ProofStrip,
	args: { items },
} satisfies Meta<typeof ProofStrip>;

export default meta;
type Story = StoryObj<typeof meta>;
```

- Every component gets a docs page: `tags: ["autodocs"]` is set once in `.storybook/preview.tsx`, so a file never repeats it. A doc comment on the meta is the docs page's lead; one on a story is that story's caption. Write both as plain sentences saying what the reader sees.
- Shared args go in the meta; a story sets only what it changes.
- Story names say the state, not the test: `GroupedOpenByClick`, `NoAddress`, `LongestContent`.

## What Stories a Component Needs

- **One per meaningfully different state**: every value of a prop that changes the shape (`variant`, `layout`, `surface`), the empty and placeholder states (no image, no address, a column with no links), and the longest realistic content (a long name, a long email, every entry filled).
- **A phone story wherever the layout changes by width**, pinned with `globals: pin("phone")`, and a tablet story when a breakpoint falls between (820 sits below the 900 and 1000 steps). A story that pins nothing runs at 1200 by 900 in the test run; pin `desktop` (1280) whenever the width matters.
- The three widths are `phone` 390 by 844, `tablet` 820 by 1180, and `desktop` 1280 by 800 (`support/viewports.ts`). The run sizes the real page, so media queries, `window.innerWidth`, and a component's own measurements all see it.

## What a `play` Function Covers

A component with behavior gets a `play` function in each story that exercises it, split into `step`s that read as sentences:

- **Every way to open and every way to close**: a click, a second click, the keyboard, Escape, a click outside, following a link inside, the close button.
- **The keyboard paths**: Tab order, the arrows a widget answers to, and where focus lands after each (`toHaveFocus`).
- **The `aria-*` state** at every stop: `aria-expanded`, `aria-current`, the accessible names (`toHaveAttribute`, `toHaveAccessibleName`).
- **Layout that is the point**, as geometry: share a line (equal `getBoundingClientRect().top`), sit above or beside (`bottom <= top`), never overflow (`document.documentElement.scrollWidth <= window.innerWidth`).

Find things the way a reader does: `canvas.getByRole` with a name first, `getByText` for words. Never assert on a class name or the markup's shape; a `play` that passes only because a class is there tests nothing a reader sees. The one allowance is an element with no role to find it by (an `aria-hidden` video), reached from a neighbor that has one.

Use `userEvent`, `expect`, `fn`, `spyOn`, and `waitFor` from `storybook/test`. Three things the test browser does not do for you:

- **A synthetic key never drives the platform.** Escape typed by `userEvent` reaches a component's own key handler but never closes a native `<dialog>`; call `dialog.requestClose()`, which runs the platform's Escape path.
- **A followed link stays in the story.** The preview cancels every click on a link that is not an in page `#` jump, after the component's handler runs, so a story can click a link and assert the panel closed.
- **Scroll is instant only when asked.** The base sheet sets `scroll-behavior: smooth`; scroll with `window.scrollTo({ top, behavior: "instant" })` and wait for scroll driven state with `waitFor`.

## The Frame a Story Gets

The first segment of the title decides it (`.storybook/decorators.tsx`):

- **Everything but `App/` and `Email/`** renders inside a `.atelic-ui` root wearing the toolbar's density, with every package sheet loaded in a site's order and the practice's theme last (`.storybook/theme.css`). A component that renders its own root (`SiteShell`) sets `parameters: { root: false }` and passes `globals.density` through its render.
- **`App/`** renders inside `AppProvider` with the fixture app's config and nav, under a memory router at `parameters.app.path` (default `/`), with the app shell's Tailwind sheet mounted only while the story shows.
- **`Email/`** renders rows inside the email theme provider and a 680 column table on the email's ground. No sheet loads.

Fixed chrome needs a page behind it: `support/page.tsx`'s `PageBehind` (with `hero` or `tall`). `support/geometry.ts` measures where words start and how many lines they run to.

## Accessibility and Bugs

Every story's test runs axe after its `play` function, and a violation fails it (`a11y: { test: "error" }` in the preview). Never weaken that globally, and never edit `src/` to make a story pass. When a story exposes a bug:

1. **Add the story anyway**, written to what the component should do.
2. **Mark the story** with `tags: ["known-issue"]` and the narrowest opt out:
   - An accessibility rule: add an entry to your group's file in `support/known-issues/` naming the rule and the failing elements, and spread it into the story's parameters, always as an object literal: `parameters: { ...knownIssues("primary-button-contrast") }`. A bare `parameters: knownIssues(...)` is silently dropped whenever the meta or story has a doc comment. The rule stays on for everything else on the page. Any group's ids may be used in any story; an id is declared once, by the group whose component the fix lands in, and the index throws on a second declaration.
   - A rule on elements no selector can single out (an inline styled email row): `parameters: { a11y: { test: "todo" } }`, which reports without failing.
   - A behavior: wrap the check in `await knownBug("<id>", async () => { ... })` from `support/known-issues`. It expects the check to fail, so the run stays green while the bug stands and goes red, naming the marker, the day it is fixed. A crash on render is caught for the check by wrapping the story in `support/boundary.tsx`'s `CrashBoundary`.
3. **Add a line to your group's findings file** in `stories/findings/`, under Accessibility or Behavior: the id, the component, the stories, what fails, and the rule id or the reproduction. A suspicion no story can show yet goes under Observed, Not Yet Marked; a limit of the test harness rather than the component goes under Checker Limits.

Mark a whole file in its meta only when every story in it shows the issue. `grep -rn known-issue stories` lists every marked story; the files in `stories/findings/` are the list a later pass fixes.

## Who Writes Which Files

Three writers work in parallel, one per group, and each touches only its own files, so their branches never conflict:

| Group | Stories | Known issues | Findings | Fixtures and pictures |
|---|---|---|---|---|
| Sections | `stories/sections/` | `support/known-issues/sections.ts` | `findings/sections.md` | `fixtures/sections.ts`, `public/images/sections/` |
| Primitives, components, artifact | `stories/primitives/`, `stories/components/`, `stories/artifact/` | `support/known-issues/primitives.ts` | `findings/primitives.md` | `fixtures/primitives.ts`, `public/images/primitives/` |
| Email and app | `stories/email/`, `stories/app/` | `support/known-issues/email-app.ts` | `findings/email-app.md` | `fixtures/email-app.ts`, `public/images/email-app/` |

The chrome (`stories/chrome/`, `support/known-issues/chrome.ts`, `findings/chrome.md`) and the foundations are done and belong to no writer in this pass. Everything else is shared and read only while the three work: `.storybook/`, `support/known-issues/index.ts` and `types.ts`, the other files in `support/`, `fixtures/bakery.ts` and `fixtures/app.ts`, this README, the root README and CLAUDE.md, `package.json`, and `bun.lock`. A writer who needs a change there (a helper, a fixture field, a package) names it in the handback instead of making it; a new group fixture spreads the shared one (`{ ...site, nav: ... }`) rather than editing it.

## Components Still Owed

Read from the source barrels; each still needs its stories. The chrome is complete, and the eleven components cut in 8.0.0 are gone and owe nothing.

- **Sections** (`@atelic-action/ui/sections`): BlogIndex, BlogPost, CTASection, ComparisonTable, ContactForm, ContactInfoCard, CredentialList, ExpandList, FAQBrowser, FeatureDetail, FeatureGrid, Gallery, HoursTable, JumpRail, LegalPage, LocationSection, Locations, LogoMarquee, MapEmbed, PageHero, PricingBand, PricingCard, ProcessSteps, ProfileCards, RevealSlider, ReviewCarousel, ReviewWall, SplitSection. Done: CalloutPanel, FullBleedVideo, Hero, LinkColumns, ProofStrip.
- **Primitives** (`@atelic-action/ui/primitives`): Bubble, Chip, Eyebrow, ImageFrame, Lead, ProseBlocks, QuoteCard, SectionHeading, StarRow, TickList. Done: Button, PrimaryButton, SecondaryButton.
- **Components** (`@atelic-action/ui/components`): Callout, Checklist, ColumnChart, DataTable, Disclosure, GateLogin, Hint, IconList, NotFound, Rank, ReportCard, StackedBar, StarRating, StatRow, Tabs, ThresholdScale, Watermark.
- **Artifact** (`@atelic-action/ui/artifact`): AppErrorBoundary, ArtifactAnchor, ArtifactShell, ErrorFallback, GradeChip, Paragraph, Runs, Shot, SignOff.
- **Email** (`@atelic-action/ui/email`): Badge, Bar, BigFold, Card, DayStrip, EmptyRow, Eyebrow, FailurePage, Fold, FoldRow, Footer, GroupRow, Item, LeadRow, List, ListRow, Note, ReadBlock, RecordStack, RecordTimelineStrip, Records, Row, Scoreboard, Stat, StatsRow, SubEyebrow, TargetRow, TitleCard, TitleLine. Done: Masthead.
- **App shell** (`@atelic-action/ui/app`): AuthGuard, ErrorFallback, GoogleGlyph, and the layout: ActionButton, AppLayout, AppPage, AppPageToolbar, FormActionButtons, PageError, PageSkeleton, SectionCards. Done: Breadcrumbs (AppPage appears only as its host).
- **App kit** (`@atelic-action/ui/app/ui`), one file per module: accordion, alert, alert-dialog, avatar, badge, badge-list, button, callout, card, checkbox, clear-button, command, country-dropdown, dialog, dropdown-menu, form, input, label, option-select, pagination, popover, progress, search-input, select, separator, sheet, slider, switch, textarea, tooltip.

## Fixtures

- Every story is set in the one fictional business, Kestrel Hollow Bakehouse (`fixtures/bakery.ts`), and the app stories in its ops app (`fixtures/app.ts`). Build on those rather than inventing a second business: a group's own data goes in its fixture file above, and data only one story uses can sit in its story file.
- Fictional only: a name, a number, or an address on the page is made up. Phone numbers are `555-01xx`; email addresses and hosts are on `example.com` or `example.test`; towns are invented (Fairhaven). The repo is public, so no real business, person, email, phone, or host, ever.
- Pictures and the clip come from the static folders, served at the root as a site serves its public folder: the gallery's (`/images/...`, `/video/...`, `/fonts/...`) and the stories' own (`stories/public/`, the marks cut per surface in `/images/`, a group's own pictures in `/images/<group>/`).

## Templates

A static component:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ProofStrip } from "../../src/sections";
import { pin } from "../support/viewports";

/** One row of short proof facts under a hero. */
const meta = {
	title: "Sections/ProofStrip",
	component: ProofStrip,
	args: {
		items: [
			{ value: "Since 2014", label: "On Alder Street" },
			{ value: "11 cafes", label: "Carry the morning bake" },
		],
	},
	globals: pin("desktop"),
} satisfies Meta<typeof ProofStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AltSurface: Story = { args: { surface: "alt" } };

/** A phone wraps the facts and never scrolls sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
```

An interactive component:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ContactDock } from "../../src/chrome";
import { dock } from "../fixtures/bakery";
import { knownIssues } from "../support/known-issues";
import { PageBehind } from "../support/page";
import { pin } from "../support/viewports";

const meta = {
	title: "Chrome/ContactDock",
	component: ContactDock,
	tags: ["known-issue"],
	parameters: { ...knownIssues("dock-on-primary-contrast") },
	args: { ...dock, avoid: null },
	decorators: [
		(Story) => (
			<>
				<PageBehind />
				<Story />
			</>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ContactDock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const launcher = canvas.getByRole("button", { name: "Talk to us" });
		await step("the launcher opens the panel and focus moves into it", async () => {
			await userEvent.click(launcher);
			const panel = within(canvas.getByRole("region", { name: "How can we help?" }));
			await expect(panel.getByRole("button", { name: "Close" })).toHaveFocus();
		});
		await step("Escape closes it and focus returns to the launcher", async () => {
			await userEvent.keyboard("{Escape}");
			await expect(launcher).toHaveAttribute("aria-expanded", "false");
			await expect(launcher).toHaveFocus();
		});
	},
};
```
