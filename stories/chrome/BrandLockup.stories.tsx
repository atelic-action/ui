import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import {
	type Brand,
	BrandLockup,
	Footer,
	SiteHeader,
	type SiteHeaderVariant,
} from "../../src/chrome";
import { brand, marks, wordmarkBrand } from "../fixtures/bakery";
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
 * A glyph tile in place of a picture. The stylesheet draws the tile's letter,
 * so the link's visible text is the wordmark alone, which its name holds.
 */
export const Tile: Story = {
	args: {
		brand: { name: "Kestrel Hollow Bakehouse", logo: { tile: "K", wordmark: "Kestrel Hollow" } },
	},
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
		await expect(link.textContent).toBe("Kestrel Hollow");
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
	render: inBar("solid", { onLight: marks.wideOnLight, onDark: marks.wideOnDark, wordmark: false }),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const link = lockup(canvas);
		const [mark] = shownMarks(link);
		await expect(mark?.file).toBe(marks.wideOnLight);
		// The picture's load waits on the run's other files; give it time.
		await waitFor(() => expect(mark?.img.naturalWidth).toBeGreaterThan(0), { timeout: 5000 });
		const box = mark?.img.getBoundingClientRect() as DOMRect;
		// As wide as its own ratio (168 by 30), never squeezed into a square.
		await expect(box.width / box.height).toBeCloseTo(168 / 30, 1);
		await expect(link).toHaveTextContent(/^$/);
		// The theme's mark height stands, though the artifact sheet is loaded too.
		await expect(Math.round(box.height)).toBe(30);
	},
};

/**
 * A mark cut for the light bar alone, on the dark bar: drawn as a white
 * silhouette, never ink on near black.
 */
export const OneCutOnTheDarkBar: Story = {
	render: inBar("dark", { onLight: marks.glyphOnLight, wordmark: "Kestrel Hollow" }),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const [mark, ...rest] = shownMarks(lockup(canvas));
		await expect(rest).toHaveLength(0);
		await expect(mark?.file).toBe(marks.glyphOnLight);
		await expect(mark?.filter).toContain("invert(1)");
	},
};

/**
 * `wordmark: false` with no mark to stand in keeps the name, so the home link
 * is never empty.
 */
export const NoWordmarkAndNoMark: Story = {
	args: { brand: { name: "Kestrel Hollow Bakehouse", logo: { wordmark: false } } },
	play: async ({ canvas }) => {
		const link = lockup(canvas);
		await expect(link).toHaveTextContent("Kestrel Hollow Bakehouse");
	},
};

/*
 * The mark each surface draws for every mix of the three fields (README,
 * Rendering From Props): the surface's own cut as given; failing that `src`,
 * as given on a dark surface and tinted to ink on the light bar; failing that
 * the other surface's cut, flattened to the surface's silhouette. One story
 * per surface, a row per mix, each bar or footer in its own frame.
 */
const INK = "brightness(0) saturate(1)";
const WHITE = "brightness(0) invert(1)";
const files = { src: marks.glyphOnDark, onLight: marks.glyphOnLight, onDark: marks.wideOnDark };
type Drawn = { file: string; filter: string } | null;
const table: { label: string; logo: Brand["logo"]; light: Drawn; dark: Drawn }[] = [
	{
		label: "Both cuts and src",
		logo: { src: files.src, onLight: files.onLight, onDark: files.onDark },
		light: { file: files.onLight, filter: "none" },
		dark: { file: files.onDark, filter: "none" },
	},
	{
		label: "Light cut and src",
		logo: { src: files.src, onLight: files.onLight },
		light: { file: files.onLight, filter: "none" },
		dark: { file: files.src, filter: "none" },
	},
	{
		label: "Light cut alone",
		logo: { onLight: files.onLight },
		light: { file: files.onLight, filter: "none" },
		dark: { file: files.onLight, filter: WHITE },
	},
	{
		label: "Dark cut and src",
		logo: { src: files.src, onDark: files.onDark },
		light: { file: files.src, filter: INK },
		dark: { file: files.onDark, filter: "none" },
	},
	{
		label: "Dark cut alone",
		logo: { onDark: files.onDark },
		light: { file: files.onDark, filter: INK },
		dark: { file: files.onDark, filter: "none" },
	},
	{
		label: "Src alone",
		logo: { src: files.src },
		light: { file: files.src, filter: INK },
		dark: { file: files.src, filter: "none" },
	},
	{ label: "No mark", logo: {}, light: null, dark: null },
];

/** A frame that holds a fixed bar to itself, as the top of a page holds it. */
const frame = (dark: boolean) => ({
	position: "relative" as const,
	transform: "translateZ(0)",
	height: 72,
	overflow: "hidden",
	marginBottom: 8,
	background: dark ? "var(--surface-dark)" : "var(--surface)",
});

function barTable(variant: SiteHeaderVariant) {
	return () => (
		<div>
			{table.map((row) => (
				<section key={row.label} aria-label={row.label} style={frame(variant !== "solid")}>
					<SiteHeader
						brand={{ name: row.label, logo: { ...row.logo, wordmark: false } }}
						variant={variant}
					/>
				</section>
			))}
		</div>
	);
}

async function expectBarTable(
	canvas: { getByRole: (role: string, options: object) => HTMLElement },
	surface: "light" | "dark",
) {
	for (const row of table) {
		const link = canvas.getByRole("link", { name: `${row.label} home` });
		const shown = shownMarks(link);
		const want = row[surface];
		if (want === null) {
			await expect(shown).toHaveLength(0);
			await expect(link).toHaveTextContent(row.label);
			continue;
		}
		await expect(shown, row.label).toHaveLength(1);
		await expect(shown[0]?.file, row.label).toBe(want.file);
		await expect(shown[0]?.filter, row.label).toBe(want.filter);
	}
}

/** The light bar: a light cut as given, anything else flattened to ink. */
export const MarkTableLightBar: Story = {
	render: barTable("solid"),
	globals: pin("desktop"),
	play: async ({ canvas }) => expectBarTable(canvas, "light"),
};

/** The dark bar: a dark cut or `src` as given, a light cut alone as a white silhouette. */
export const MarkTableDarkBar: Story = {
	render: barTable("dark"),
	globals: pin("desktop"),
	play: async ({ canvas }) => expectBarTable(canvas, "dark"),
};

/** Over a hero, the clear bar is a dark surface too. */
export const MarkTableOverAHero: Story = {
	render: barTable("transparent"),
	globals: pin("desktop"),
	play: async ({ canvas }) => expectBarTable(canvas, "dark"),
};

/** The footer band resolves by the dark bar's own order, so the two always agree. */
export const MarkTableFooter: Story = {
	render: () => (
		<div>
			{table.map((row) => (
				<section key={row.label} aria-label={row.label}>
					<Footer brand={{ name: row.label, logo: { ...row.logo, alt: row.label } }} />
				</section>
			))}
		</div>
	),
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		for (const row of table) {
			const region = within(canvas.getByRole("region", { name: row.label }));
			if (row.dark === null) {
				await expect(region.queryByRole("img")).toBeNull();
				await expect(region.getByText(row.label)).toBeVisible();
				continue;
			}
			const img = region.getByRole("img", { name: row.label }) as HTMLImageElement;
			await expect(new URL(img.src).pathname, row.label).toBe(row.dark.file);
			await expect(getComputedStyle(img).filter, row.label).toBe(row.dark.filter);
		}
	},
};
