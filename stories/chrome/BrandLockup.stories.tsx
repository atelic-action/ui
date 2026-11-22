import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { type Brand, BrandLockup, SiteHeader, type SiteHeaderVariant } from "../../src/chrome";
import { brand, marks, wordmarkBrand } from "../fixtures/bakery";
import { knownBug, knownIssues } from "../support/known-issues";
import { PageBehind } from "../support/page";
import { pin } from "../support/viewports";

/** The header's identity as one link: the mark, the wordmark, and the trailing run. */
const meta = {
	title: "Chrome/BrandLockup",
	component: BrandLockup,
	parameters: { layout: "padded" },
	args: { brand },
} satisfies Meta<typeof BrandLockup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A mark picture beside the wordmark; the picture is silent, the link names the business. */
export const MarkAndWordmark: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
		await expect(link).toHaveAttribute("href", "/");
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** A wordmark with the trailing run and no picture. */
export const WordmarkWithRun: Story = {
	args: { brand: wordmarkBrand },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" }),
		).toHaveTextContent("kestrel hollow");
	},
};

/**
 * A glyph tile in place of a picture. The tile's letter runs into the
 * wordmark's in the visible text ("KKestrel Hollow"), which the link's name
 * does not contain (stories/findings/chrome.md).
 */
export const Tile: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("tile-lockup-name") },
	args: {
		brand: { name: "Kestrel Hollow Bakehouse", logo: { tile: "K", wordmark: "Kestrel Hollow" } },
	},
};

/** A sent document's lockup: the sender, a times sign, then the recipient's mark. */
export const WithRecipient: Story = {
	args: {
		brand: {
			name: "atelic",
			logo: { wordmark: "atelic", run: true },
			recipient: { src: "/images/kestrel-mark-light.svg", alt: "Kestrel Hollow Bakehouse" },
		},
	},
	decorators: [
		(Story) => (
			<div style={{ background: "var(--surface-dark)", padding: 16 }}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("link", { name: "atelic × Kestrel Hollow Bakehouse home" }),
		).toBeVisible();
	},
};

/** The site sets the link's name when "<name> home" will not do. */
export const AriaLabel: Story = {
	args: { ariaLabel: "Kestrel Hollow, the front page" },
	play: async ({ canvas }) => {
		// The name keeps the visible wordmark in it, so a voice user can say what they see.
		await expect(
			canvas.getByRole("link", { name: "Kestrel Hollow, the front page" }),
		).toBeVisible();
	},
};

/** The longest realistic name, set as the wordmark too. */
export const LongName: Story = {
	args: {
		brand: {
			name: "Kestrel Hollow Bakehouse and Wholesale Kitchen",
			logo: { wordmark: "Kestrel Hollow Bakehouse and Wholesale Kitchen", run: true },
		},
	},
};

/**
 * The lockup in a real bar, so the bar's surface picks the cut. The marks
 * carry empty alt text (the link names the business), so they have no role
 * to find them by; the ones showing are read off the link.
 */
function inBar(variant: SiteHeaderVariant, logo: Brand["logo"]) {
	return () => (
		<>
			<SiteHeader brand={{ ...brand, logo }} variant={variant} />
			<PageBehind hero={variant === "transparent"} />
		</>
	);
}

/** The marks the link is showing, as the file each draws. */
function shownMarks(link: HTMLElement) {
	return Array.from(link.querySelectorAll("img"))
		.filter((img) => getComputedStyle(img).display !== "none")
		.map((img) => ({ file: new URL(img.src).pathname, filter: getComputedStyle(img).filter, img }));
}

const cuts = { onLight: marks.glyphOnLight, onDark: marks.glyphOnDark, wordmark: "Kestrel Hollow" };
const lockup = (canvas: { getByRole: (role: string, options: object) => HTMLElement }) =>
	canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });

/** A brand cut per surface: the light bar shows the cut for a light ground, as given. */
export const CutsOnTheLightBar: Story = {
	render: inBar("solid", cuts),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const [mark, ...rest] = shownMarks(lockup(canvas));
		await expect(rest).toHaveLength(0);
		await expect(mark?.file).toBe(marks.glyphOnLight);
		await expect(mark?.filter).toBe("none");
	},
};

/** The dark bar shows the cut for a dark ground. */
export const CutsOnTheDarkBar: Story = {
	render: inBar("dark", cuts),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const [mark, ...rest] = shownMarks(lockup(canvas));
		await expect(rest).toHaveLength(0);
		await expect(mark?.file).toBe(marks.glyphOnDark);
	},
};

/** Over a hero, the clear bar shows the cut for a dark ground too. */
export const CutsOverAHero: Story = {
	render: inBar("transparent", cuts),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const [mark, ...rest] = shownMarks(lockup(canvas));
		await expect(rest).toHaveLength(0);
		await expect(mark?.file).toBe(marks.glyphOnDark);
	},
};

/**
 * Artwork that already spells the name: `wordmark: false` drops the live
 * name, and the wide mark stands at `--brand-mark-height` (30px), as wide as
 * its own ratio.
 */
export const WideWordmarkImage: Story = {
	tags: ["known-issue"],
	render: inBar("solid", { onLight: marks.wideOnLight, onDark: marks.wideOnDark, wordmark: false }),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const link = lockup(canvas);
		const [mark] = shownMarks(link);
		await expect(mark?.file).toBe(marks.wideOnLight);
		await waitFor(() => expect(mark?.img.naturalWidth).toBeGreaterThan(0));
		const box = mark?.img.getBoundingClientRect() as DOMRect;
		// As wide as its own ratio (168 by 30), never squeezed into a square.
		await expect(box.width / box.height).toBeCloseTo(168 / 30, 1);
		await expect(link).toHaveTextContent(/^$/);
		// artifact.css pins every header mark at 20px, so a site that hosts the
		// documents loses the theme's mark height (stories/findings/chrome.md).
		await knownBug("artifact-sheet-mark-height", async () => {
			await expect(Math.round(box.height)).toBe(30);
		});
	},
};

/**
 * A mark cut for one surface alone is drawn as given on every surface: the
 * ink cut stands untinted on the dark bar (stories/findings/chrome.md).
 */
export const OneCutOnTheDarkBar: Story = {
	tags: ["known-issue"],
	render: inBar("dark", { onLight: marks.glyphOnLight, wordmark: "Kestrel Hollow" }),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const [mark] = shownMarks(lockup(canvas));
		await knownBug("one-cut-mark-untinted", async () => {
			const inkAsGiven = mark?.file === marks.glyphOnLight && mark?.filter === "none";
			await expect(inkAsGiven).toBe(false);
		});
	},
};

/**
 * `wordmark: false` with no mark leaves the header's link with nothing to
 * see: a named link, empty (stories/findings/chrome.md).
 */
export const NoWordmarkAndNoMark: Story = {
	tags: ["known-issue"],
	args: { brand: { name: "Kestrel Hollow Bakehouse", logo: { wordmark: false } } },
	play: async ({ canvas }) => {
		const link = lockup(canvas);
		await knownBug("empty-lockup", async () => {
			await expect(link.textContent?.trim() || shownMarks(link).length > 0).toBeTruthy();
		});
	},
};
