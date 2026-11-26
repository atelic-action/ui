import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, within } from "storybook/test";
import { Footer, type FooterColumn, type HoursRow, SiteHeader } from "../../src/chrome";
import { formatHoursRange } from "../../src/sections";
import { address, brand, email, marks, phone, site, wordmarkBrand } from "../fixtures/bakery";
import { brokenWords, expectNoSidewaysScroll, lines } from "../support/geometry";
import { pin } from "../support/viewports";

/** The default footer's four columns, as SiteShell derives them from the bakery's config. */
const columns: FooterColumn[] = [
	{ heading: "Company", links: site.nav.map((item) => ({ label: item.label, href: item.to })) },
	{ heading: "Resources", links: site.footerLinks ?? [] },
	{
		heading: "Social",
		links: (site.socialLinks ?? []).map((link) => ({ ...link, external: true })),
	},
	{ heading: "Legal", links: site.legalLinks ?? [] },
];

/** The bakery's hours as SiteShell formats them for the footer. */
const hours: HoursRow[] = site.hours.map((row) => ({
	label: row.labelShort,
	range: formatHoursRange(row),
}));

const profile = "https://maps.example.com/?q=418+Alder+Street";

/**
 * The words the browser broke inside themselves. An email address counts
 * too: it offers breaks after its @ and before each dot (each part its own
 * run of text), so a part broken inside itself is a word broken.
 */
const brokenLabels = (element: HTMLElement) => brokenWords(element);

/** The one footer shape every site wears (README, The Default Footer). */
const meta = {
	title: "Chrome/Footer",
	component: Footer,
	args: {
		brand: wordmarkBrand,
		rating: "4.9 on Google",
		address,
		addressHref: "https://maps.example.com/?q=418+Alder+Street",
		phone,
		email,
		columns,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, step }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await step("the brand column: the rating as text, the NAP as links", async () => {
			const rating = footer.getByText("4.9 on Google");
			await expect(rating.closest("a")).toBeNull();
			const place = footer.getByRole("link", { name: /418 Alder Street/ });
			await expect(place).toHaveAttribute("href", "https://maps.example.com/?q=418+Alder+Street");
			await expect(place).toHaveAttribute("target", "_blank");
			await expect(footer.getByRole("link", { name: phone.display })).toHaveAttribute(
				"href",
				`tel:${phone.e164}`,
			);
			const mail = footer.getByRole("link", { name: email });
			await expect(mail).toHaveAttribute("href", `mailto:${email}`);
			await expect(mail).not.toHaveAttribute("target");
		});
		await step("four link columns in order, each a named nav", async () => {
			const names = footer.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
			await expect(names).toEqual(["Company", "Resources", "Social", "Legal"]);
			await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute(
				"target",
				"_blank",
			);
		});
		await step("the brand column and the four columns share one row", async () => {
			const tops = [footer.getByText("kestrel hollow"), ...footer.getAllByRole("navigation")].map(
				(element) => Math.round(element.getBoundingClientRect().top),
			);
			const navTops = new Set(tops.slice(1));
			await expect(navTops.size).toBe(1);
		});
		await step("the closing bar follows, with the copyright and the credit", async () => {
			await expect(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/)).toBeVisible();
			await expect(canvas.getByRole("link", { name: "Atelic" })).toHaveAttribute(
				"href",
				"https://atelic.me",
			);
		});
	},
};

/** On a phone the brand column takes the full width and the link columns pair up beneath it. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const [company, resources, social] = footer.getAllByRole("navigation");
		const box = (element: HTMLElement) => element.getBoundingClientRect();
		await expect(Math.round(box(company).top)).toBe(Math.round(box(resources).top));
		await expect(box(social).top).toBeGreaterThan(box(company).bottom);
		await expect(box(footer.getByText("kestrel hollow")).bottom).toBeLessThanOrEqual(
			box(company).top,
		);
		await expectNoSidewaysScroll();
	},
};

/** A column with no links is left out, and the grid sizes itself to the columns shown. */
export const EmptyColumnLeftOut: Story = {
	args: {
		columns: columns.map((column) =>
			column.heading === "Resources" ? { ...column, links: [] } : column,
		),
	},
	play: async ({ canvas }) => {
		const navs = within(canvas.getByRole("contentinfo")).getAllByRole("navigation");
		await expect(navs.map((nav) => nav.getAttribute("aria-label"))).toEqual([
			"Company",
			"Social",
			"Legal",
		]);
	},
};

/** A service area business with no storefront: the phone and the email stand alone. */
export const NoAddress: Story = {
	args: { address: undefined, addressHref: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: /Alder Street/ })).toBeNull();
		await expect(canvas.getByRole("link", { name: phone.display })).toBeVisible();
	},
};

/** The footer's lockup image, reached from the words beside it (it is alt="", named by them). */
const lockupMark = (words: HTMLElement) =>
	words.closest(".footer-lockup")?.querySelector("img") ?? undefined;

/**
 * A mark image with the wordmark: the footer draws the header's lockup, the
 * mark and the live words beside it on one line, the picture silent since
 * the words name it.
 */
export const ImageLogo: Story = {
	args: { brand },
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const words = footer.getByText("Kestrel Hollow");
		const mark = lockupMark(words);
		await expect(mark).toBeVisible();
		await expect(mark).toHaveAttribute("alt", "");
		const [image, text] = [mark as HTMLElement, words].map((element) =>
			element.getBoundingClientRect(),
		);
		// Side by side, centered on one line.
		await expect(image.right).toBeLessThanOrEqual(text.left);
		await expect(
			Math.abs((image.top + image.bottom) / 2 - (text.top + text.bottom) / 2),
		).toBeLessThan(3);
	},
};

/** Artwork that already spells the name (`wordmark: false`) stands alone, named by its alt. */
export const ImageLogoAlone: Story = {
	args: {
		brand: {
			...brand,
			logo: { src: "/images/kestrel-mark-light.svg", alt: "Kestrel Hollow", wordmark: false },
		},
	},
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await expect(footer.getByRole("img", { name: "Kestrel Hollow" })).toBeVisible();
		await expect(footer.queryByText("Kestrel Hollow Bakehouse")).toBeNull();
	},
};

/** The practice's own site turns the credit off; the copyright still prints. */
export const CreditOff: Story = {
	args: { credit: false },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: "Atelic" })).toBeNull();
		await expect(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/)).toBeVisible();
	},
};

/** A site's own note stands in the credit's place. */
export const Note: Story = {
	args: { note: "Baked in Fairhaven since 2014", attribution: "A family bakery" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Baked in Fairhaven since 2014")).toBeVisible();
		await expect(canvas.getByText(/Kestrel Hollow Bakehouse · A family bakery/)).toBeVisible();
	},
};

/** The longest realistic content: a long name, a long email, and full columns. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		brand: {
			name: "Kestrel Hollow Bakehouse and Wholesale Kitchen",
			logo: { wordmark: "kestrel hollow bakehouse" },
		},
		email: "wholesale.orders.and.catering@kestrelhollowbakehouse.example.com",
		columns: columns.map((column) => ({
			...column,
			links: [
				...column.links,
				{ label: "Standing orders for cafes and grocers", href: "/wholesale/standing" },
			],
		})),
	},
	play: async () => {
		// A long address breaks rather than pushing the page sideways on a phone.
		await expectNoSidewaysScroll();
	},
};

/** The file a picture draws, by its path. */
const file = (img: HTMLImageElement | undefined) => (img ? new URL(img.src).pathname : undefined);

/**
 * A brand cut per surface: the dark band draws the cut for a dark ground
 * (`resolveMark`'s dark choice), beside the wordmark, as the dark header does.
 */
export const MarkCutForTheDarkBand: Story = {
	args: {
		brand: {
			...brand,
			logo: {
				onLight: marks.glyphOnLight,
				onDark: marks.glyphOnDark,
				alt: "Kestrel Hollow",
				wordmark: "Kestrel Hollow",
			},
		},
	},
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const mark = lockupMark(footer.getByText("Kestrel Hollow"));
		await expect(file(mark)).toBe(marks.glyphOnDark);
	},
};

/** The wide cut alone (`wordmark: false`): the dark ground's artwork, named for the business. */
export const MarkCutForTheDarkBandAlone: Story = {
	args: {
		brand: {
			...brand,
			logo: {
				onLight: marks.wideOnLight,
				onDark: marks.wideOnDark,
				alt: "Kestrel Hollow",
				wordmark: false,
			},
		},
	},
	play: async ({ canvas }) => {
		const mark = canvas.getByRole("img", { name: "Kestrel Hollow" }) as HTMLImageElement;
		await expect(file(mark)).toBe(marks.wideOnDark);
	},
};

/**
 * One config, two surfaces that are both dark: the dark header and the
 * footer resolve the logo by the same order, so both draw `src`.
 */
export const SameConfigAsTheDarkHeader: Story = {
	args: {
		brand: {
			...brand,
			logo: { src: marks.glyphOnDark, onLight: marks.glyphOnLight, alt: "Kestrel Hollow" },
		},
	},
	render: (args) => (
		<>
			<SiteHeader brand={args.brand} variant="dark" />
			<div style={{ height: "40vh" }} />
			<Footer {...args} />
		</>
	),
	play: async ({ canvas }) => {
		const header = canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
		const headerMark = Array.from(header.querySelectorAll("img")).find(
			(img) => getComputedStyle(img).display !== "none",
		);
		const footer = within(canvas.getByRole("contentinfo"));
		const footerMark = lockupMark(footer.getByText("Kestrel Hollow Bakehouse"));
		await expect(file(headerMark)).toBe(file(footerMark));
		await expect(file(footerMark)).toBe(marks.glyphOnDark);
	},
};

/**
 * The column headings are `h2` by default: the footer sits beside the page's
 * main content, so a page whose outline ends on its `h1` never skips a level
 * into it. Each heading names its column's nav.
 */
export const HeadingsAfterAPageTitle: Story = {
	render: (args) => (
		<>
			<main>
				<h1>Visit the shop</h1>
			</main>
			<Footer {...args} />
		</>
	),
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const headings = footer.getAllByRole("heading", { level: 2 });
		await expect(headings.map((heading) => heading.textContent)).toEqual([
			"Company",
			"Resources",
			"Social",
			"Legal",
		]);
		await expect(footer.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
	},
};

/** A footer set inside a deeper outline takes its own level, `headingLevel` 2 to 6. */
export const HeadingLevelThree: Story = {
	args: { headingLevel: 3 },
	render: (args) => (
		<>
			<main>
				<h1>The bakehouse</h1>
				<h2>Wholesale</h2>
			</main>
			<Footer {...args} />
		</>
	),
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await expect(footer.getAllByRole("heading", { level: 3 })).toHaveLength(4);
		await expect(footer.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
	},
};

/**
 * A site's own bare `h2` rule, written for its page's section titles and
 * unlayered, so it beats any rule in the package's layer whatever its
 * weight: the footer's headings keep their look under it, since they are
 * headings by role and match no element rule, while the page's own `h2`
 * takes the site's rule.
 */
export const UnderASiteHeadingRule: Story = {
	render: (args) => (
		<>
			<main>
				<h1>The bakehouse</h1>
				<h2>Wholesale</h2>
			</main>
			<Footer {...args} />
		</>
	),
	beforeEach: () => () => document.querySelector("style[data-story='site-h2']")?.remove(),
	play: async ({ canvas, step }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const heading = footer.getAllByRole("heading", { level: 2 })[0] as HTMLElement;
		const look = (element: Element) => {
			const style = getComputedStyle(element);
			return [
				style.fontSize,
				style.fontFamily,
				style.textTransform,
				style.color,
				style.marginBottom,
			];
		};
		const before = look(heading);
		await step("the site's rule lands", async () => {
			const rule = document.createElement("style");
			rule.dataset.story = "site-h2";
			rule.textContent =
				"h2 { font-size: 48px; font-family: Georgia, serif; text-transform: none; color: rgb(0, 0, 255); margin: 0 0 40px; }";
			document.head.append(rule);
			await expect(
				getComputedStyle(canvas.getByRole("heading", { name: "Wholesale" })).fontSize,
			).toBe("48px");
		});
		await step("the footer's headings look as they did", async () => {
			await expect(look(heading)).toEqual(before);
		});
	},
};

/**
 * The hours, when the site gives them, where they sit by default: inside the
 * brand column under the address, the phone, and the email, as a compact list
 * under a small Hours label, each day's range by its days.
 */
export const WithHours: Story = {
	args: { hours },
	play: async ({ canvas }) => {
		const footer = canvas.getByRole("contentinfo");
		const heading = within(footer).getByRole("heading", { name: "Hours", level: 2 });
		const nap = footer.querySelector("address") as HTMLElement;
		await expect(nap.parentElement).toContainElement(heading);
		await expect(heading.getBoundingClientRect().top).toBeGreaterThan(
			nap.getBoundingClientRect().bottom - 1,
		);
		const list = heading.parentElement as HTMLElement;
		await expect(
			within(list)
				.getAllByRole("term")
				.map((term) => term.textContent),
		).toEqual(["Tue to Fri", "Sat and Sun", "Mon"]);
		await expect(brokenLabels(footer)).toEqual([]);
	},
};

/** The same on a phone. */
export const WithHoursPhone: Story = {
	...WithHours,
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const footer = canvas.getByRole("contentinfo");
		const heading = within(footer).getByRole("heading", { name: "Hours" });
		await expect(footer.querySelector("address")?.parentElement).toContainElement(heading);
		await expect(brokenLabels(footer)).toEqual([]);
		await expectNoSidewaysScroll();
	},
};

/**
 * The hours as a column of their own (`hoursPlacement: "column"`), headed
 * Hours, beside the link columns and on their row.
 */
export const HoursColumn: Story = {
	args: { hours, hoursPlacement: "column" },
	play: async ({ canvas, step }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const heading = footer.getByRole("heading", { name: "Hours", level: 2 });
		await step("each row's days and its range", async () => {
			const column = heading.parentElement as HTMLElement;
			const terms = within(column).getAllByRole("term");
			const definitions = within(column).getAllByRole("definition");
			await expect(terms.map((term) => term.textContent)).toEqual([
				"Tue to Fri",
				"Sat and Sun",
				"Mon",
			]);
			await expect(definitions.map((definition) => definition.textContent)).toEqual([
				"7:00\u00a0am to 3:00\u00a0pm",
				"8:00\u00a0am to 2:00\u00a0pm",
				"Closed",
			]);
		});
		await step("the hours share the link columns' row, and nothing is crowded", async () => {
			const top = (element: HTMLElement) => Math.round(element.getBoundingClientRect().top);
			const navs = footer.getAllByRole("navigation");
			await expect(new Set([heading, ...navs].map(top)).size).toBe(1);
			await expect(brokenLabels(canvas.getByRole("contentinfo"))).toEqual([]);
		});
	},
};

/**
 * As a column on a phone the hours take the row's whole width under the brand column,
 * their rows two across, and the link columns pair up under them, where a
 * column of hours beside a taller link column left a hole under the hours.
 */
export const HoursColumnPhone: Story = {
	args: { hours, hoursPlacement: "column" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const box = (element: HTMLElement) => element.getBoundingClientRect();
		const hoursHeading = footer.getByRole("heading", { name: "Hours" });
		const hoursColumn = hoursHeading.parentElement as HTMLElement;
		const [company, resources] = footer.getAllByRole("navigation") as HTMLElement[];
		await expect(box(hoursColumn).bottom).toBeLessThanOrEqual(box(company as HTMLElement).top);
		await expect(Math.round(box(company as HTMLElement).top)).toBe(
			Math.round(box(resources as HTMLElement).top),
		);
		// The rows two across: the second row starts beside the first.
		const [first, second] = within(hoursColumn).getAllByRole("term");
		await expect(Math.round(box(first as HTMLElement).top)).toBe(
			Math.round(box(second as HTMLElement).top),
		);
		await expect(brokenLabels(canvas.getByRole("contentinfo"))).toEqual([]);
		await expectNoSidewaysScroll();
	},
};

/**
 * The rating linked to the Google profile: the stars and the words one link,
 * opening in a new tab, named by the words alone since the stars are hidden.
 */
export const RatingLinked: Story = {
	args: { ratingHref: profile },
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const rating = footer.getByRole("link", { name: "4.9 on Google" });
		await expect(rating).toHaveAttribute("href", profile);
		await expect(rating).toHaveAttribute("target", "_blank");
		await expect(rating).toHaveAttribute("rel", expect.stringContaining("noopener"));
		// The stars ride inside the link, hidden from assistive technology.
		const stars = rating.querySelector("[aria-hidden='true']");
		await expect(stars?.querySelectorAll("svg")).toHaveLength(5);
	},
};

/** A site's own accessible name for the linked rating, saying where it leads. */
export const RatingLinkedWithItsOwnName: Story = {
	args: { ratingHref: profile, ratingLabel: "4.9 on Google, opens the Google profile" },
	play: async ({ canvas }) => {
		const rating = within(canvas.getByRole("contentinfo")).getByRole("link", {
			name: "4.9 on Google, opens the Google profile",
		});
		await expect(rating).toHaveTextContent("4.9 on Google");
	},
};

/**
 * Everything the footer can hold: the lockup, the rating linked to the
 * profile, the linked address, the phone, the email, the hours, and the four
 * link columns.
 */
export const Full: Story = {
	args: { brand, ratingHref: profile, hours },
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await expect(lockupMark(footer.getByText("Kestrel Hollow"))).toBeVisible();
		await expect(footer.getByRole("link", { name: "4.9 on Google" })).toBeVisible();
		await expect(footer.getByRole("heading", { name: "Hours" })).toBeVisible();
		await expect(brokenLabels(canvas.getByRole("contentinfo"))).toEqual([]);
		await expectNoSidewaysScroll();
	},
};

/** The same footer on a phone. */
export const FullPhone: Story = {
	...Full,
	globals: pin("phone"),
};

/**
 * The full footer under wider type than the stories' font: a wide fallback
 * face and a little letter spacing, the kind of difference another
 * machine's font metrics make. No label breaks inside a word, an icon stays
 * with its label, the email breaks only at its @ or a dot, and when the row
 * cannot hold every column at its longest word, a column wraps to the next
 * row rather than squeeze.
 */
export const FullWiderMetrics: Story = {
	...Full,
	decorators: [
		(Story) => (
			<div
				style={
					{
						"--font-sans": 'Verdana, "DejaVu Sans", sans-serif',
						fontFamily: 'Verdana, "DejaVu Sans", sans-serif',
						letterSpacing: "0.04em",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const footer = canvas.getByRole("contentinfo");
		await expect(brokenLabels(footer)).toEqual([]);
		// The icon and its one word label share a line: the word in one line
		// box, its middle level with the icon's.
		const instagram = within(footer).getByRole("link", { name: "Instagram" });
		const word = document.createRange();
		word.selectNodeContents(instagram.lastChild as Node);
		const boxes = Array.from(word.getClientRects());
		await expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
		const icon = (instagram.querySelector("svg") as SVGElement).getBoundingClientRect();
		const text = boxes[0] as DOMRect;
		await expect(icon.right).toBeLessThanOrEqual(text.left);
		await expect(Math.abs(icon.top + icon.height / 2 - (text.top + text.height / 2))).toBeLessThan(
			4,
		);
		await expectNoSidewaysScroll();
	},
};

/** The same at the narrowest desktop with the hours on one row. */
export const FullWiderMetricsNarrow: Story = {
	...FullWiderMetrics,
	globals: pin("narrowDesktop"),
};

/** A long email address in the brand column at 1280 breaks at its @ or a dot, never inside a word. */
export const LongEmailDesktop: Story = {
	args: { email: "wholesale.orders.and.catering@kestrelhollowbakehouse.example.com", hours },
	play: async ({ canvas }) => {
		const mail = within(canvas.getByRole("contentinfo")).getByRole("link", {
			name: "wholesale.orders.and.catering@kestrelhollowbakehouse.example.com",
		});
		await expect(brokenWords(mail)).toEqual([]);
		await expectNoSidewaysScroll();
	},
};

/** Six links a column, the longest labels a design gives, three words among them. */
const fullColumns: FooterColumn[] = [
	{
		heading: "Company",
		links: [
			{ label: "Our story", href: "/about" },
			{ label: "The morning bake", href: "/bake" },
			{ label: "Wholesale", href: "/wholesale" },
			{ label: "Careers", href: "/jobs" },
			{ label: "Visit the shop", href: "/visit" },
			{ label: "Contact", href: "/contact" },
		],
	},
	{
		heading: "Resources",
		links: [
			{ label: "Order for Saturday", href: "/order" },
			{ label: "Allergen guide", href: "/allergens" },
			{ label: "Cake ordering", href: "/cakes" },
			{ label: "Price sheet", href: "/prices" },
			{ label: "Gift cards", href: "/gifts" },
			{ label: "Questions", href: "/faq" },
		],
	},
	{
		heading: "Social",
		links: [
			{
				label: "Instagram",
				href: "https://instagram.example.com/kh",
				icon: "instagram",
				external: true,
			},
			{
				label: "Facebook",
				href: "https://facebook.example.com/kh",
				icon: "facebook",
				external: true,
			},
			{ label: "YouTube", href: "https://youtube.example.com/kh", icon: "youtube", external: true },
			{
				label: "LinkedIn",
				href: "https://linkedin.example.com/kh",
				icon: "linkedin",
				external: true,
			},
			{ label: "Reviews", href: "https://reviews.example.com/kh", icon: "star", external: true },
			{ label: "Newsletter", href: "/news", icon: "mail" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ label: "Privacy", href: "/privacy" },
			{ label: "Terms of sale", href: "/terms" },
			{ label: "Accessibility", href: "/accessibility" },
			{ label: "Cookie settings", href: "/cookies" },
			{ label: "Refund policy", href: "/refunds" },
			{ label: "Site map", href: "/sitemap" },
		],
	},
];

/** No label in the footer breaks inside a word. */
async function expectWholeWords(canvas: ReturnType<typeof within>) {
	await expect(brokenLabels(canvas.getByRole("contentinfo"))).toEqual([]);
	await expectNoSidewaysScroll();
}

/** The hours as their own column beside four full link columns, at 1280. */
export const CrowdedHoursColumn: Story = {
	args: { hours, columns: fullColumns, hoursPlacement: "column" },
	play: async ({ canvas }) => {
		await expectWholeWords(canvas);
	},
};

/** The same at 820. */
export const CrowdedHoursColumnTablet: Story = {
	...CrowdedHoursColumn,
	globals: pin("tablet"),
};

/** The same at 390. */
export const CrowdedHoursColumnPhone: Story = {
	...CrowdedHoursColumn,
	globals: pin("phone"),
};

/**
 * The hours inside the brand column (the default placement), under the
 * address, the phone, and the email as a compact list under a small label,
 * so four full link columns keep the row: at 1280 every three word label
 * holds one line, and no label breaks inside a word. The footer is set 4%
 * wider than its font draws it (letter spacing), standing in for another
 * machine's wider font, so the layout has room to spare rather than just
 * enough.
 */
export const CrowdedHoursInBrand: Story = {
	args: { hours, columns: fullColumns, hoursPlacement: "brand" },
	decorators: [
		(Story) => (
			<div style={{ letterSpacing: "0.04em" }}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const hoursHeading = footer.getByRole("heading", { name: "Hours" });
		const nap = canvas.getByRole("contentinfo").querySelector("address") as HTMLElement;
		await expect(hoursHeading.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			nap.getBoundingClientRect().bottom,
		);
		await expect(nap.parentElement).toContainElement(hoursHeading);
		for (const label of [
			"Order for Saturday",
			"The morning bake",
			"Visit the shop",
			"Terms of sale",
		]) {
			await expect(lines(footer.getByRole("link", { name: label })), label).toBe(1);
		}
		// The days and the ranges side by side, a row a line.
		const [day] = footer.getAllByRole("term");
		const [range] = footer.getAllByRole("definition");
		await expect(Math.round((day as HTMLElement).getBoundingClientRect().top)).toBe(
			Math.round((range as HTMLElement).getBoundingClientRect().top),
		);
		await expectWholeWords(canvas);
	},
};

/** The brand placement at 820. */
export const CrowdedHoursInBrandTablet: Story = {
	args: CrowdedHoursInBrand.args,
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		await expectWholeWords(canvas);
	},
};

/** The brand placement at 390. */
export const CrowdedHoursInBrandPhone: Story = {
	args: CrowdedHoursInBrand.args,
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expectWholeWords(canvas);
	},
};

/**
 * `--footer-link-size` sets the column links' size and `--footer-brand-width`
 * the brand column's share of the row, a link column's being 1.
 */
export const LinkSizeAndBrandShare: Story = {
	args: { columns: fullColumns },
	decorators: [
		(Story) => (
			<div style={{ "--footer-link-size": "15px", "--footer-brand-width": "2" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await expect(getComputedStyle(footer.getByRole("link", { name: "Our story" })).fontSize).toBe(
			"15px",
		);
		const brand = (canvas.getByRole("contentinfo").querySelector("address") as HTMLElement)
			.parentElement as HTMLElement;
		const [company] = footer.getAllByRole("navigation") as HTMLElement[];
		const ratio =
			brand.getBoundingClientRect().width / (company as HTMLElement).getBoundingClientRect().width;
		await expect(ratio).toBeGreaterThan(1.7);
	},
};

/** Unset, the links take the footer's own size and the brand column its 1.4 share, as before. */
export const LinkSizeAndBrandShareDefaults: Story = {
	args: { columns: fullColumns },
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const link = footer.getByRole("link", { name: "Our story" });
		await expect(getComputedStyle(link).fontSize).toBe(
			getComputedStyle(canvas.getByRole("contentinfo")).fontSize,
		);
	},
};

/**
 * Checks the brand placement's rows: the brand column shares the row with
 * every link column or stands on a row of its own, never beside some; the
 * link columns sit four across or two by two, never three and one; no label
 * breaks inside a word; and the rating and the email each hold one line.
 */
async function expectBrandRows(
	canvas: ReturnType<typeof within>,
	layout?: "one row" | "brand above four" | "brand above two by two",
	{ rating = true }: { rating?: boolean } = {},
) {
	const footer = within(canvas.getByRole("contentinfo"));
	const top = (element: Element) => Math.round(element.getBoundingClientRect().top);
	const brand = (canvas.getByRole("contentinfo").querySelector("address") as HTMLElement)
		.parentElement as HTMLElement;
	const columns = footer.getAllByRole("navigation");
	const rows = new Set(columns.map(top));
	const besideBrand = columns.filter((column) => top(column) === top(brand)).length;
	await expect([0, columns.length]).toContain(besideBrand);
	await expect([1, 2]).toContain(rows.size);
	if (layout === "one row") await expect(besideBrand).toBe(columns.length);
	if (layout === "brand above four") {
		await expect(besideBrand).toBe(0);
		await expect(rows.size).toBe(1);
	}
	if (layout === "brand above two by two") await expect(rows.size).toBe(2);
	if (rows.size === 2) {
		const counts = [...rows].map((row) => columns.filter((column) => top(column) === row).length);
		await expect(counts).toEqual([2, 2]);
	}
	// One line: no taller than one line of its own text (the rating's stars
	// sit beside its words, so its rects' tops differ by a few pixels).
	const oneLine = (element: HTMLElement) =>
		element.getBoundingClientRect().height <
		1.5 * Number.parseFloat(getComputedStyle(element).lineHeight);
	if (rating) await expect(oneLine(footer.getByText("4.9 on Google"))).toBe(true);
	const mail = footer.getByRole("link", { name: /@/ });
	await expect(oneLine(mail)).toBe(true);
	await expectWholeWords(canvas);
}

/** Hours in the brand column just under 1100: the brand column takes its own row when the floors outrun the row. */
export const HoursInBrandAt1099: Story = {
	args: { hours, columns: fullColumns, hoursPlacement: "brand" },
	globals: pin("wideTablet"),
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "brand above four");
	},
};

/** The same at 1024. */
export const HoursInBrandAt1024: Story = {
	...HoursInBrandAt1099,
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "brand above four");
	},
	globals: pin("laptop"),
};

/** The same at 820. */
export const HoursInBrandAt820: Story = {
	...HoursInBrandAt1099,
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "brand above two by two");
	},
	globals: pin("tablet"),
};

/** The same at 768. */
export const HoursInBrandAt768: Story = {
	...HoursInBrandAt1099,
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "brand above two by two");
	},
	globals: pin("smallTablet"),
};

/** On a wide wrap (1200, a template's) at 1440 the brand column and the four link columns share one row. */
export const HoursInBrandOneRowWide: Story = {
	args: { hours, columns: fullColumns, hoursPlacement: "brand" },
	decorators: [
		(Story) => (
			<div className="atelic-ui" style={{ "--max-width": "1200px" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "one row");
	},
};

/**
 * Checks the phone's cells under the brand column pair up: every row holds
 * two cells, but for the hours spanning the whole row; the hours span it
 * beside an even count of link columns and stand as a half cell beside the
 * first link column beside an odd count.
 */
async function expectNoCellAlone(canvas: ReturnType<typeof within>, linkColumns: number) {
	const footer = within(canvas.getByRole("contentinfo"));
	const box = (element: Element) => element.getBoundingClientRect();
	const hoursCell = footer.getByRole("heading", { name: "Hours" }).parentElement as HTMLElement;
	const columns = footer.getAllByRole("navigation");
	await expect(columns).toHaveLength(linkColumns);
	const grid = hoursCell.parentElement as HTMLElement;
	const spans = box(hoursCell).width > box(grid).width * 0.9;
	await expect(spans).toBe(linkColumns % 2 === 0);
	if (!spans) {
		await expect(Math.round(box(hoursCell).top)).toBe(Math.round(box(columns[0] as Element).top));
	}
	const cells = spans ? columns : [hoursCell, ...columns];
	const rows = new Map<number, number>();
	for (const cell of cells) {
		const top = Math.round(box(cell).top);
		rows.set(top, (rows.get(top) ?? 0) + 1);
	}
	await expect([...rows.values()].every((count) => count === 2)).toBe(true);
	await expectNoSidewaysScroll();
}

/** Two link columns on a phone, the hours as a column: the hours span the row, the two columns pair under them. */
export const HoursPhoneTwoColumns: Story = {
	args: { hours, columns: columns.slice(0, 2), hoursPlacement: "column" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expectNoCellAlone(canvas, 2);
	},
};

/**
 * Three link columns on a phone: the hours stay a half cell beside the first
 * link column, as in 8.1.0, so the other two pair and none hangs alone.
 */
export const HoursPhoneThreeColumns: Story = {
	args: {
		hours,
		columns: [columns[0], columns[1], columns[3]] as FooterColumn[],
		hoursPlacement: "column",
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expectNoCellAlone(canvas, 3);
	},
};

/** Four link columns on a phone: the hours span the row, the four columns two by two under them. */
export const HoursPhoneFourColumns: Story = {
	args: { hours, columns, hoursPlacement: "column" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expectNoCellAlone(canvas, 4);
	},
};

/** Two link columns and the hours in the brand column at 1280: the brand column and both columns share one row. */
export const HoursInBrandTwoColumns: Story = {
	args: { hours, columns: fullColumns.slice(0, 2), hoursPlacement: "brand" },
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "one row");
	},
};

/** The same at 1024. */
export const HoursInBrandTwoColumnsAt1024: Story = {
	...HoursInBrandTwoColumns,
	globals: pin("laptop"),
};

/** Three link columns at 1280: one row, the floors measured for three. */
export const HoursInBrandThreeColumns: Story = {
	args: { hours, columns: fullColumns.slice(0, 3), hoursPlacement: "brand" },
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "one row");
	},
};

/** The same at 1024. */
export const HoursInBrandThreeColumnsAt1024: Story = {
	...HoursInBrandThreeColumns,
	globals: pin("laptop"),
};

/** A short brand block: no rating, a short street, a short email, one row of hours. */
const shortBrand = {
	rating: undefined,
	email: "hi@kh.example.com",
	address: { ...address, street: "4 Elm" },
	hours: [{ label: "Daily", range: "7:00\u00a0am to 2:00\u00a0pm" }],
	hoursPlacement: "brand" as const,
};

/** The brand column and how wide its content needs it: its longest line, set whole. */
function brandBox(canvas: ReturnType<typeof within>) {
	const brand = (canvas.getByRole("contentinfo").querySelector("address") as HTMLElement)
		.parentElement as HTMLElement;
	// The words' own boxes, never their elements' (a block runs the column's
	// full width whatever its words need).
	let right = 0;
	const walker = document.createTreeWalker(brand, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const range = document.createRange();
		range.selectNodeContents(node);
		for (const rect of range.getClientRects()) right = Math.max(right, rect.right);
	}
	const need = right - brand.getBoundingClientRect().left;
	return { brand, width: brand.getBoundingClientRect().width, need };
}

/** A wide wrap (1200, a template's) at 1280, where the row holds every column. */
const wideWrap = (vars: Record<string, string> = {}): Decorator[] => [
	(Story) => (
		<div className="atelic-ui" style={{ "--max-width": "1200px", ...vars } as CSSProperties}>
			<Story />
		</div>
	),
];

/**
 * A short brand block with the hours in it: the brand column's floor is its
 * content, not a fixed width, so it is no wider than its longest line plus
 * its share of the row's spare room (1.4 to each link column's 1), well
 * under the 17em it was once held at, and the link columns take the rest.
 */
export const HoursInBrandShortBrandBlock: Story = {
	args: shortBrand,
	decorators: wideWrap(),
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "one row", { rating: false });
		const footer = within(canvas.getByRole("contentinfo"));
		const { width, need } = brandBox(canvas);
		const company = footer.getAllByRole("navigation")[0] as HTMLElement;
		const [link] = within(company).getAllByRole("link");
		const floor = 10 * Number.parseFloat(getComputedStyle(link as HTMLElement).fontSize);
		const column = company.getBoundingClientRect();
		const share = column.width - floor;
		await expect(share).toBeGreaterThan(0);
		await expect(width).toBeLessThanOrEqual(need + 1.4 * share + 1);
		const em = Number.parseFloat(getComputedStyle(canvas.getByRole("contentinfo")).fontSize);
		await expect(width).toBeLessThan(17 * em);
	},
};

/** With `--footer-brand-width: 0` the short brand block is exactly as wide as its content. */
export const HoursInBrandShortBrandBlockNoShare: Story = {
	args: shortBrand,
	decorators: wideWrap({ "--footer-brand-width": "0" }),
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "one row", { rating: false });
		const { width, need } = brandBox(canvas);
		await expect(Math.abs(width - need)).toBeLessThanOrEqual(1);
	},
};

/** At 1024, a short brand block and the link columns' floors at the footer's own size: the brand column takes its own row. */
export const HoursInBrandShortBrandBlockAt1024: Story = {
	args: shortBrand,
	globals: pin("laptop"),
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "brand above four", { rating: false });
	},
};

/**
 * The link columns' floor is measured in the link text's own size, so a
 * smaller `--footer-link-size` (13px) lowers it, and at 1024 the same short
 * brand block and the four link columns share one row.
 */
export const HoursInBrandLinkSizeScalesTheFloor: Story = {
	args: shortBrand,
	globals: pin("laptop"),
	decorators: [
		(Story) => (
			<div style={{ "--footer-link-size": "13px" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "one row", { rating: false });
		for (const column of within(canvas.getByRole("contentinfo")).getAllByRole("navigation")) {
			await expect(column.getBoundingClientRect().width).toBeGreaterThanOrEqual(130);
		}
	},
};

/** The same at 820: the brand column above, the four link columns across under it at the smaller floor. */
export const HoursInBrandLinkSizeScalesTheFloorAt820: Story = {
	...HoursInBrandLinkSizeScalesTheFloor,
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		await expectBrandRows(canvas, "brand above four", { rating: false });
	},
};

/** The full columns with one label longer than the link columns' floor. */
const longLabelColumns: FooterColumn[] = fullColumns.map((column) =>
	column.heading === "Resources"
		? {
				...column,
				links: [{ label: "Financing and insurance claims", href: "/financing" }, ...column.links],
			}
		: column,
);

/**
 * A label wider than the link columns' floor, beside the hours in the brand
 * column at a brand share of 2, across every width from 760 to 1100 (9.7.0).
 * Before, the label held its column wider than the floor the row was laid
 * out for, so in narrow bands (about 769 to 772 and 1020 to 1023 on a real
 * site) three columns sat across with the fourth alone under them. Now the
 * footer measures the widest column and the columns sit four across or two
 * by two at every width, each wide enough for its longest label.
 */
export const HoursInBrandLongLabelEveryWidth: Story = {
	args: { hours, columns: longLabelColumns, hoursPlacement: "brand" },
	globals: pin("desktop"),
	decorators: [
		(Story) => (
			<div
				data-testid="frame"
				style={{ "--footer-brand-width": "2", width: "1100px" } as CSSProperties}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const frame = canvas.getByTestId("frame");
		const footer = canvas.getByRole("contentinfo");
		const columns = within(footer).getAllByRole("navigation");
		const top = (element: Element) => Math.round(element.getBoundingClientRect().top);
		const settle = () =>
			new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const bad: string[] = [];
		for (let width = 760; width <= 1100; width++) {
			frame.style.width = `${width}px`;
			await settle();
			const rows = [...new Set(columns.map(top))];
			const counts = rows.map((row) => columns.filter((column) => top(column) === row).length);
			const shape = counts.join("+");
			if (shape !== "4" && shape !== "2+2") bad.push(`${width}: ${shape}`);
			for (const column of columns) {
				if (column.scrollWidth > column.clientWidth + 1) {
					bad.push(`${width}: ${column.getAttribute("aria-label")} overflows`);
				}
			}
		}
		await expect(bad).toEqual([]);
	},
};
