import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { SiteShell } from "../../src/chrome";
import type { Density } from "../../src/sections";
import { Hero, LinkColumns, ProofStrip } from "../../src/sections";
import { groupedNav, phones, site } from "../fixtures/bakery";
import { knownBug, knownIssues } from "../support/known-issues";
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
		...knownIssues(
			"primary-button-contrast",
			"dock-on-primary-contrast",
			"checker-transparent-header",
		),
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

export const FullPagePhone: Story = {
	tags: ["known-issue"],
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
		await step(
			"the closing bar scrolls clear of the sticky bar (stories/findings/chrome.md)",
			async () => {
				const copyright = canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/);
				await knownBug("sticky-bar-covers-closing-bar", async () => {
					await expect(box(copyright).bottom).toBeLessThanOrEqual(box(call).top - 12);
				});
			},
		);
	},
};

/** An interior page: the bar is solid, `<main>` clears it, and the sticky bar is there from the top. */
export const InteriorPagePhone: Story = {
	parameters: {
		...knownIssues("primary-button-contrast", "dock-on-primary-contrast", "footer-heading-order"),
	},
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
