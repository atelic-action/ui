import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { SiteShell } from "../../src/chrome";
import type { Density } from "../../src/sections";
import { Hero, LinkColumns, ProofStrip } from "../../src/sections";
import { groupedNav, phones, site } from "../fixtures/bakery";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/** A home page's body: the hero, the proof strip, and enough sections to scroll past. */
function HomeBody() {
	return (
		<>
			<Hero
				eyebrow="Alder Street, since 2014"
				title="Bread worth the early line."
				subtitle="Sourdough, morning buns, and cakes to order, baked every day but Monday."
				image={{ src: "/images/bakery-band.svg", alt: "Loaves cooling on a rack" }}
				primaryCTA={{ label: "Order ahead", href: "/order" }}
				secondaryCTA={{ label: "See the menu", href: "/menu" }}
				scrollTarget="#bread"
			/>
			<ProofStrip
				ariaLabel="Why the line is long"
				items={[
					{ value: "4.9", label: "212 reviews" },
					{ value: "Since 2014", label: "On Alder Street" },
					{ value: "11 cafes", label: "Carry the morning bake" },
				]}
			/>
			{["Bread", "Pastry", "Cakes"].map((name) => (
				<section className="section" key={name} id={name.toLowerCase()}>
					<div className="wrap">
						<h2>{name}</h2>
						<p>Baked in the back of the shop before the doors open, and gone by the afternoon.</p>
						<LinkColumns
							columns={[
								{
									heading: `${name} every day`,
									links: [
										{ label: "Country sourdough", href: "/menu/sourdough", count: "7" },
										{ label: "Morning buns", href: "/menu/buns", count: "12" },
									],
								},
							]}
						/>
					</div>
				</section>
			))}
		</>
	);
}

/**
 * The page wrapper with everything it mounts: the skip link, the header, the
 * body, the phone's sticky bar, the footer and its closing bar, and the
 * contact dock. The shell renders its own `.atelic-ui` root, so these stories
 * opt out of the preview's and pass the density toolbar's setting through.
 */
const meta = {
	title: "Chrome/SiteShell",
	component: SiteShell,
	tags: ["known-issue"],
	parameters: {
		root: false,
		// A checker limit, not a bug (stories/findings/chrome.md, Checker Limits).
		...knownIssues("checker-transparent-header"),
	},
	args: {
		site: { ...site, nav: groupedNav, header: { phones } },
		currentPath: "/",
		heroNav: true,
		children: <HomeBody />,
	},
	render: (args, { globals }) => (
		<SiteShell {...args} density={args.density ?? (globals.density as Density | undefined)} />
	),
	globals: pin("desktop"),
} satisfies Meta<typeof SiteShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const box = (element: Element) => element.getBoundingClientRect();
const toBottom = () =>
	window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });

export const FullPage: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const launcher = canvas.getByRole("button", { name: "Talk to us" });
		await step("every landmark, once", async () => {
			await expect(canvas.getAllByRole("banner")).toHaveLength(1);
			await expect(canvas.getAllByRole("main")).toHaveLength(1);
			await expect(canvas.getAllByRole("contentinfo")).toHaveLength(1);
		});
		await step("the skip link is the first tab stop", async () => {
			await userEvent.tab();
			await expect(canvas.getByRole("link", { name: "Skip to content" })).toHaveFocus();
		});
		await step("the dock sits in its corner at the top of the page", async () => {
			await waitFor(() => expect(Math.round(window.innerHeight - box(launcher).bottom)).toBe(24));
		});
		await step("scrolled to the bottom, the dock rides above the footer", async () => {
			toBottom();
			const footer = canvas.getByRole("contentinfo");
			await waitFor(() => expect(box(launcher).bottom).toBeLessThanOrEqual(box(footer).top));
			await expect(box(footer).top).toBeLessThan(window.innerHeight);
		});
		await step("and comes back down to its corner on the way up", async () => {
			window.scrollTo({ top: 0, behavior: "instant" });
			await waitFor(() => expect(Math.round(window.innerHeight - box(launcher).bottom)).toBe(24));
		});
	},
};

/**
 * The phone's page, with the footer held shorter than the screen (its hours
 * off) so the dock can be seen clearing it; a footer taller than the screen
 * leaves the launcher at the top edge instead (`FullPagePhoneTallFooter`).
 */
export const FullPagePhone: Story = {
	args: {
		site: {
			...site,
			nav: groupedNav,
			header: { phones },
			footer: { ...site.footer, showHours: false },
		},
	},
	globals: pin("phone"),
	play: async ({ canvas, step }) => {
		const launcher = canvas.getByRole("button", { name: "Talk to us" });
		const call = canvas.getByRole("link", { name: "Call us" });
		await step("at the top the bar waits and the dock sits at its phone inset", async () => {
			await expect(box(call).top).toBeGreaterThanOrEqual(window.innerHeight);
			await waitFor(() => expect(Math.round(window.innerHeight - box(launcher).bottom)).toBe(16));
		});
		await step("once the sticky bar shows, the dock lifts above it", async () => {
			window.scrollTo({ top: 900, behavior: "instant" });
			await waitFor(() => expect(box(call).bottom).toBeLessThanOrEqual(window.innerHeight));
			await waitFor(() => expect(box(launcher).bottom).toBeLessThanOrEqual(box(call).top));
		});
		await step("scrolled to the bottom, it clears the footer and the bar both", async () => {
			toBottom();
			const footer = canvas.getByRole("contentinfo");
			await waitFor(() => expect(box(launcher).bottom).toBeLessThanOrEqual(box(footer).top));
			await expect(box(launcher).bottom).toBeLessThanOrEqual(box(call).top);
			await expect(box(launcher).top).toBeGreaterThanOrEqual(0);
		});
		await step("the closing bar scrolls clear of the sticky bar, its words in reach", async () => {
			const copyright = canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/);
			await waitFor(() => expect(box(copyright).bottom).toBeLessThanOrEqual(box(call).top - 12));
			// What a tap at the credit's middle lands on is the credit, not the bar.
			const credit = canvas.getByRole("link", { name: "Atelic" });
			const middle = box(credit);
			const hit = document.elementFromPoint(
				middle.left + middle.width / 2,
				middle.top + middle.height / 2,
			);
			await expect(credit.contains(hit)).toBe(true);
		});
	},
};

/**
 * With the hours in it, the phone's footer and its closing bar run taller
 * than the screen, so at the bottom of the page the launcher stops at the
 * screen's top edge, still in reach and still clear of the sticky bar.
 */
export const FullPagePhoneTallFooter: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const launcher = canvas.getByRole("button", { name: "Talk to us" });
		const call = canvas.getByRole("link", { name: "Call us" });
		toBottom();
		// The sticky bar slides in and the closing bar pads its foot by it.
		await waitFor(() => expect(box(call).bottom).toBeLessThanOrEqual(window.innerHeight));
		const footer = canvas.getByRole("contentinfo");
		// The footer's top has scrolled past the screen's.
		await waitFor(() => {
			toBottom();
			return expect(box(footer).top).toBeLessThan(0);
		});
		await waitFor(() => expect(Math.round(box(launcher).top)).toBe(16));
		await expect(box(launcher).bottom).toBeLessThanOrEqual(box(call).top);
	},
};

/** An interior page: the bar is solid, `<main>` clears it, and the sticky bar is there from the top. */
export const InteriorPagePhone: Story = {
	args: {
		heroNav: false,
		currentPath: "/visit",
		children: (
			<section className="section">
				<div className="wrap">
					<h1>Visit the shop</h1>
					<p>418 Alder Street, by the old mill. Street parking out front.</p>
				</div>
			</section>
		),
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("banner");
		await expect(box(canvas.getByRole("heading", { level: 1 })).top).toBeGreaterThanOrEqual(
			box(bar).bottom,
		);
		await waitFor(() =>
			expect(box(canvas.getByRole("link", { name: "Call us" })).bottom).toBeLessThanOrEqual(
				window.innerHeight,
			),
		);
	},
};

/** A page that closes on its own ask: no footer, no sticky bar, no dock; the closing bar stays. */
export const ClosesOnItsOwnAsk: Story = {
	args: { footer: false, stickyCTA: false, contactDock: false },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("contentinfo")).toBeNull();
		await expect(canvas.queryByRole("button", { name: "Talk to us" })).toBeNull();
		await expect(canvas.queryByRole("link", { name: "Call us" })).toBeNull();
		await expect(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/)).toBeVisible();
	},
};

/** Served under a prefix: every link the chrome builds carries it. */
export const BasePath: Story = {
	args: { basePath: "/proto", currentPath: "/proto/" },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" }),
		).toHaveAttribute("href", "/proto/");
		const company = within(canvas.getByRole("navigation", { name: "Company" }));
		await expect(company.getByRole("link", { name: "Visit" })).toHaveAttribute(
			"href",
			"/proto/visit",
		);
	},
};

/**
 * The density reaches every section through the root's spacing token: at
 * 1280 pixels a band pads by 4.6vw by default, 3.2vw compact, and 9vw
 * comfortable (README, Density).
 */
const sectionPadding = (canvas: ReturnType<typeof within>) => {
	const band = canvas.getByRole("heading", { name: "Bread" }).closest("section") as HTMLElement;
	return Number.parseFloat(getComputedStyle(band).paddingTop);
};

export const DefaultDensity: Story = {
	play: async ({ canvas }) => {
		await expect(sectionPadding(canvas)).toBeCloseTo(1280 * 0.046, 0);
	},
};

export const Compact: Story = {
	args: { density: "compact" },
	play: async ({ canvas }) => {
		await expect(sectionPadding(canvas)).toBeCloseTo(1280 * 0.032, 0);
	},
};

export const Comfortable: Story = {
	args: { density: "comfortable" },
	play: async ({ canvas }) => {
		await expect(sectionPadding(canvas)).toBeCloseTo(1280 * 0.09, 0);
	},
};

/**
 * The hero's scroll cue and the contact dock both live at the foot of a
 * desktop's first screen; on a page that wears the dock the cue moves to the
 * middle, so the launcher never covers it.
 */
export const HeroCueBesideTheDock: Story = {
	play: async ({ canvas }) => {
		const cue = canvas.getByRole("link", { name: "Scroll down" });
		const launcher = canvas.getByRole("button", { name: "Talk to us" });
		await waitFor(() => expect(Math.round(window.innerHeight - box(launcher).bottom)).toBe(24));
		const [a, b] = [box(cue), box(launcher)];
		const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
		await expect(apart).toBe(true);
		// What a click at the cue's middle lands on is the cue.
		const hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2);
		await expect(cue.contains(hit)).toBe(true);
	},
};

/** An interior page whose short body puts the footer on the first screen. */
const visitPage = {
	heroNav: false,
	currentPath: "/visit",
	children: (
		<section className="section">
			<div className="wrap">
				<h1>Visit the shop</h1>
				<p>418 Alder Street, by the old mill. Street parking out front.</p>
			</div>
		</section>
	),
};

/**
 * The footer the config fills by default: the hours the config already holds
 * for its structured data, as their own column, and the rating linked to the
 * Google profile (`mapLinkURL`) the address links to.
 */
export const FooterFromTheConfig: Story = {
	args: visitPage,
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await expect(footer.getByRole("heading", { name: "Hours" })).toBeVisible();
		await expect(footer.getByText("Tue to Fri")).toBeVisible();
		await expect(footer.getByText("7a to 3p")).toBeVisible();
		const rating = footer.getByRole("link", { name: "4.9 on Google" });
		await expect(rating).toHaveAttribute("href", site.mapLinkURL);
		await expect(rating).toHaveAttribute("target", "_blank");
	},
};

/** The same on a phone. */
export const FooterFromTheConfigPhone: Story = {
	...FooterFromTheConfig,
	globals: pin("phone"),
};

/**
 * `footer.showHours: false` keeps the hours out of the footer; the config's
 * hours still feed the structured data and the sections that print them.
 */
export const FooterHoursOff: Story = {
	args: { ...visitPage, site: { ...site, footer: { ...site.footer, showHours: false } } },
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await expect(footer.queryByRole("heading", { name: "Hours" })).toBeNull();
		await expect(footer.queryByText("Tue to Fri")).toBeNull();
		await expect(footer.getAllByRole("navigation").length).toBeGreaterThan(0);
	},
};

/** Hours off on a phone. */
export const FooterHoursOffPhone: Story = {
	...FooterHoursOff,
	globals: pin("phone"),
};

/** A rating with its own link and accessible name, set in the config. */
export const FooterRatingOwnLink: Story = {
	args: {
		...visitPage,
		site: {
			...site,
			footer: {
				...site.footer,
				ratingHref: "https://reviews.example.com/kestrel-hollow",
				ratingLabel: "4.9 on Google, opens the reviews",
			},
		},
	},
	play: async ({ canvas }) => {
		const rating = within(canvas.getByRole("contentinfo")).getByRole("link", {
			name: "4.9 on Google, opens the reviews",
		});
		await expect(rating).toHaveAttribute("href", "https://reviews.example.com/kestrel-hollow");
	},
};
