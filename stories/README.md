# Writing Stories

How a story is written here, so every component's stories read alike and every one runs as a test. The commands and how the run works are in the root README's Storybook chapter; this file is the rules.

## Where a Story Lives

- One file per component, `stories/<kind>/<Component>.stories.tsx`, the folder mirroring `src/`: `chrome/`, `sections/`, `primitives/`, `components/`, `artifact/`, `routing/`, `email/`, `app/`. `foundations/` holds the stories that prove the setup itself (the layer order, the viewports).
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
- Decorators apply innermost first: the first in a story's `decorators` wraps the story directly, and each later one wraps the one before. A column or a frame the story sits in (a `.wrap`, a band, a page behind) goes last, so it is the outermost.
- Story names say the state, not the test: `GroupedOpenByClick`, `NoAddress`, `LongestContent`.

## What Stories a Component Needs

- **One per meaningfully different state**: every value of a prop that changes the shape (`variant`, `layout`, `surface`), the empty and placeholder states (no image, no address, a column with no links), and the longest realistic content (a long name, a long email, every entry filled).
- **A phone story wherever the layout changes by width**, pinned with `globals: pin("phone")`, and a tablet story when a breakpoint falls between (820 sits below the 900 and 1000 steps). A story that pins nothing runs at 1200 by 900 in the test run; pin `desktop` (1280) whenever the width matters.
- The nine widths are `phone` 390 by 844, `smallPhone` 320 by 640, the narrowest phone a site still meets, for a row that runs out of room before 390 does, `smallTablet` 768 by 1024, `tablet` 820 by 1180, `laptop` 1024 by 768, `wideTablet` 1099 by 800, just under the footer's 1100 step, `desktop` 1280 by 800, `narrowDesktop` 1180 by 800, the narrowest a bar holding groups shows them at, for a story about the mega panel's least room, and `smallDesktop` 900 by 800, the narrowest the desktop bar shows at, for a row with the least room a desktop gives it (`support/viewports.ts`). The run sizes the real page, so media queries, `window.innerWidth`, and a component's own measurements all see it.

## What a `play` Function Covers

A component with behavior gets a `play` function in each story that exercises it, split into `step`s that read as sentences:

- **Every way to open and every way to close**: a click, a second click, the keyboard, Escape, a click outside, following a link inside, the close button.
- **The keyboard paths**: Tab order, the arrows a widget answers to, and where focus lands after each (`toHaveFocus`).
- **The `aria-*` state** at every stop: `aria-expanded`, `aria-current`, the accessible names (`toHaveAttribute`, `toHaveAccessibleName`).
- **Layout that is the point**, as geometry: share a line (equal `getBoundingClientRect().top`), sit above or beside (`bottom <= top`), never overflow (`expectNoSidewaysScroll()` from `support/geometry.ts`, the one copy every group uses).

Find things the way a reader does: `canvas.getByRole` with a name first, `getByText` for words. Never assert on a class name or the markup's shape; a `play` that passes only because a class is there tests nothing a reader sees. The one allowance is an element with no role to find it by (an `aria-hidden` video), reached from a neighbor that has one.

Use `userEvent`, `expect`, `fn`, `spyOn`, and `waitFor` from `storybook/test`. What the test browser does not do for you:

- **A synthetic key never drives the platform.** Escape typed by `userEvent` reaches a component's own key handler but never closes a native `<dialog>`; call `dialog.requestClose()`, which runs the platform's Escape path. Nor does an arrow key scroll a focused scrolling region: prove the region takes focus, not that it scrolls.
- **A synthetic Tab ignores `inert` and a closed `<details>`.** `userEvent.tab()` moves focus onto a link the browser would never reach. Assert a refusal instead: call the link's `.focus()` and expect it not to have focus.
- **Following a `#` link closes the test frame's connection.** A story that clicks one holds the jump with `support/fragments.ts`'s `holdFragmentJumps` as its `beforeEach`, which scrolls the target into view the way the browser does.
- **A followed link stays in the story.** The preview cancels every click on a link that is not an in page `#` jump, after the component's handler runs, so a story can click a link and assert the panel closed.
- **Scroll is instant only when asked.** The base sheet sets `scroll-behavior: smooth`; scroll with `window.scrollTo({ top, behavior: "instant" })` and wait for scroll driven state with `waitFor`.
- **Reduced motion reaches only what the story turns on.** `support/motion.ts`'s `withReducedMotion`, as a story's `beforeEach`, answers `matchMedia` and copies the loaded sheets' reduced motion rules into the story's own document, so script and sheet both see the setting and no other file's stories do. It throws on a condition it cannot copy faithfully (a `no-preference` rule, an `or`, a `not`, a list), naming it.
- **A short transition can finish before a check looks.** To show one runs, or does not, listen for `transitionrun` or `animationstart` from before the action rather than polling for a running animation afterward. To wait for an entrance to end, wait for it to begin (or to have ended), then `await settled()` (`support/settle.ts`), which waits for every finite animation on the page. A Radix layer (a menu, a popover, a select's list, a dialog, a sheet) has its own forms in the same file, each waiting on what the layer is doing rather than a clock: `layerOpened(find)` waits for it to appear and its entrance to end and hands it back, `layerClosed(layer)` for its exit and its unmount, `settledLayer(layer)` for its own animations alone, `noneLeft(query)` until nothing answers, and `until(check)` for any other condition.

## The Frame a Story Gets

The first segment of the title decides it (`.storybook/decorators.tsx`):

- **Everything but `App/` and `Email/`** renders inside a `.atelic-ui` root wearing the toolbar's density, with every package sheet loaded in a site's order, then the practice's palette from the package's own theme sheet (`src/styles/theme.css`), then the fonts and the page ground (`.storybook/theme.css`). A component that renders its own root (`SiteShell`) sets `parameters: { root: false }` and passes `globals.density` through its render.
- **`App/`** renders inside `AppProvider` with the fixture app's config and nav, under a memory router at `parameters.app.path` (default `/`), with the app shell's Tailwind sheet mounted only while the story shows.
- **`Email/`** renders rows inside the email theme provider and a 680 column table on the email's ground. No sheet loads.

Fixed chrome needs a page behind it: `support/page.tsx`'s `PageBehind` (with `hero` or `tall`, and `flatHero` for a hero of one flat color, which the accessibility check can measure words over where it leaves a gradient unjudged). `support/geometry.ts` measures where words start (`textLeft`), how many lines they run to (`lines`), which words the browser broke inside themselves (`brokenWords`), and whether the page scrolls sideways (`expectNoSidewaysScroll`). Every group uses the helpers in `support/` rather than a copy of its own.

## Accessibility and Bugs

Every story's test runs axe after its `play` function, and a violation fails it (`a11y: { test: "error" }` in the preview). Never weaken that globally, and never edit `src/` to make a story pass. When a story exposes a bug:

1. **Add the story anyway**, written to what the component should do.
2. **Mark the story** with `tags: ["known-issue"]`, written as a literal on each marked story or meta (Storybook's indexer reads only a literal `tags`, so one inside a spread const is invisible to the sidebar and to `grep`), and the narrowest opt out:
   - An accessibility rule: add an entry to your group's file in `support/known-issues/` naming the rule and the failing elements, and spread it into the story's parameters, always as an object literal: `parameters: { ...knownIssues("primary-button-contrast") }`. A bare `parameters: knownIssues(...)` is silently dropped whenever the meta or story has a doc comment. The rule is lifted off the named elements and everything inside them (a background that fails takes its children with it), and stays on for the rest of the page. Any group's ids may be used in any story; an id is declared once, by the group whose components show it, and the index throws on a second declaration. One cause shared across components is one id, whose entry's selector lists every element the cause reaches, so the fix that ends the cause ends its marker everywhere at once. An entry sets `base` to the rule's own selector whenever axe's definition of the rule selects something other than `*` (read it in axe-core's rule definition): the opt out replaces the rule's selector, so it has to start from the real one. A selector list is split on its top level commas only, so `:not(a, b)` and `:is(...)` may be written as they are.
   - A rule on elements no selector can single out (an inline styled email row): `parameters: { a11y: { test: "todo" } }`, which reports without failing.
   - A behavior: wrap the check in `await knownBug("<id>", async () => { ... })` from `support/known-issues`. It expects the check to fail. A crash on render is caught for the check by wrapping the story in `support/boundary.tsx`'s `CrashBoundary`.

   Every marker fails the run the day its bug is gone, naming itself, so none can outlive the bug. A `knownBug` fails when its check passes. An accessibility entry is judged after each story that carries it, with its rule put back on its elements (`support/known-issues/stale.ts`, from the preview's `afterEach`): a story that shows the elements and passes the rule on them fails; a story that does not show them is not judged there, so a marker on a meta covers stories without the element; and an id that no story of a file ever shows violating fails the file once its last story has run. A story marked `todo` fails when its full check passes. An entry is judged against the whole page, never its elements alone, since a rule that compares an element with the rest of the page (`landmark-unique`, `heading-order`) answers differently on a part; only violations falling on its elements count. Two entries a story carries that lift one rule off one element cannot be told apart, so they are judged together and named together when they go stale; carry each cause alone in at least one story, or merge them into one id. `stories/foundations/StaleMarkers.stories.tsx` proves each of these. When one fails, delete the marker, the entry, and the findings line, and turn a `knownBug` into the plain assertion it wraps, so the story keeps testing the fix.
3. **Add a line to your group's findings file** in `stories/findings/`, under Accessibility or Behavior: the id, the component, the stories, what fails, and the rule id or the reproduction. A suspicion no story can show yet goes under Observed, Not Yet Marked; a limit of the test harness rather than the component goes under Checker Limits.

Mark a whole file in its meta only when every story in it shows the issue. `grep -rn known-issue stories` lists every marked story; the files in `stories/findings/` are the list a later pass fixes.

Never write a known bug's behavior as if it were correct outside a `knownBug`: an assertion that the broken thing happens (a name without its zone, a link to `#`) passes while the bug stands and has to be found and rewritten by hand the day it is fixed, where a `knownBug` names itself. Write the check the fixed component passes, and mark it.

## Who Writes Which Files

Three writers work in parallel, one per group, and each touches only its own files, so their branches never conflict:

| Group | Stories | Known issues | Findings | Fixtures and pictures |
|---|---|---|---|---|
| Sections | `stories/sections/` | `support/known-issues/sections.ts` | `findings/sections.md` | `fixtures/sections.ts`, `public/images/sections/` |
| Primitives, components, artifact | `stories/primitives/`, `stories/components/`, `stories/artifact/` | `support/known-issues/primitives.ts` | `findings/primitives.md` | `fixtures/primitives.ts`, `public/images/primitives/` |
| Email and app | `stories/email/`, `stories/app/` | `support/known-issues/email-app.ts` | `findings/email-app.md` | `fixtures/email-app.ts`, `public/images/email-app/` |

The chrome (`stories/chrome/`, `support/known-issues/chrome.ts`, `findings/chrome.md`) and the foundations belong to no group. Everything else is shared: `.storybook/`, `support/` (the known issue machinery and the helpers), `fixtures/bakery.ts` and `fixtures/app.ts`, this README, the root README and CLAUDE.md, `package.json`, and `bun.lock`. A pass's brief names the one writer who may edit them; every other writer names a change it needs (a helper, a fixture field, a package) in the handback instead of making it, and a new group fixture spreads the shared one (`{ ...site, nav: ... }`) rather than editing it.

## Every Component Has Stories

Every export that draws has its stories as of ATE-772. A new component brings its own in the same change (the root CLAUDE.md).

## Fixtures

- Every story is set in the one fictional business, Kestrel Hollow Bakehouse (`fixtures/bakery.ts`), and the app stories in its ops app (`fixtures/app.ts`). Build on those rather than inventing a second business: a group's own data goes in its fixture file above, and data only one story uses can sit in its story file.
- Fictional only: a name, a number, or an address on the page is made up. Phone numbers are `555-01xx`; email addresses and hosts are on `example.com` or `example.test`; towns are invented (Fairhaven). The repo is public, so no real business, person, email, phone, or host, ever.
- Pictures, the clip, and the fonts come from `stories/public/`, served at the root as a site serves its public folder: the shared pictures and the marks cut per surface in `/images/`, a group's own pictures in `/images/<group>/`, the clip in `/video/`, the fonts in `/fonts/`, and `robots.txt`, which keeps the served Storybook out of search.

## Templates

A static component:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProofStrip } from "../../src/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
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
		await expectNoSidewaysScroll();
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
