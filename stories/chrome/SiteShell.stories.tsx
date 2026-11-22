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
 * The phone's page, with the footer's hours off, so the dock can be seen
 * riding above the footer; it never rises into the header, where a footer
 * longer than the room left holds it (`FullPagePhoneTallFooter`).
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
			// The bar slides in over a third of a second, longer on a loaded run.
			await waitFor(() => expect(box(call).bottom).toBeLessThanOrEqual(window.innerHeight), {
				timeout: 5000,
			});
			await waitFor(() => expect(box(launcher).bottom).toBeLessThanOrEqual(box(call).top), {
				timeout: 5000,
			});
		});
		await step("as the footer comes up the screen, the dock rides above it", async () => {
			const footer = canvas.getByRole("contentinfo");
			const footerTop = footer.getBoundingClientRect().top + window.scrollY;
			window.scrollTo({ top: footerTop - window.innerHeight / 2, behavior: "instant" });
			await waitFor(() => expect(box(launcher).bottom).toBeLessThanOrEqual(box(footer).top));
			await expect(box(launcher).bottom).toBeLessThanOrEqual(box(call).top);
		});
		await step("at the bottom it holds under the header, clear of the bar", async () => {
			toBottom();
			const header = canvas.getByRole("banner");
			await waitFor(() => expect(box(launcher).top).toBeGreaterThanOrEqual(box(header).bottom));
			await expect(box(launcher).bottom).toBeLessThanOrEqual(box(call).top);
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
 * With the hours in it, the phone's footer runs taller than the screen. At
 * every scroll position sampled, from the footer's top coming up the screen
 * to the foot of the page, the launcher never rises into the header: it
 * rides above the footer until it reaches the header, then holds just under
 * it, clear of the burger and of the sticky bar.
 */
export const FullPagePhoneTallFooter: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const launcher = canvas.getByRole("button", { name: "Talk to us" });
		const burger = canvas.getByRole("button", { name: "Open menu" });
		const header = canvas.getByRole("banner");
		const footer = canvas.getByRole("contentinfo");
		const apart = (a: DOMRect, b: DOMRect) =>
			a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
		const footerTop = footer.getBoundingClientRect().top + window.scrollY;
		const end = document.documentElement.scrollHeight - window.innerHeight;
		const stops = [0.9, 0.6, 0.3, 0.1, 0].map((share) =>
			Math.min(end, Math.max(0, Math.round(footerTop - window.innerHeight * share))),
		);
		for (const top of [...stops, end, end]) {
			window.scrollTo({ top, behavior: "instant" });
			// Two frames: the scroll's measure, then any change it made to the bar.
			await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
			await waitFor(() => {
				const own = box(launcher);
				expect(apart(own, box(burger))).toBe(true);
				expect(own.top).toBeGreaterThanOrEqual(box(header).bottom);
			});
		}
		// At the foot of the page the footer runs past the header, and the
		// launcher holds 16px under the header.
		await expect(box(footer).top).toBeLessThan(box(header).bottom);
		await waitFor(() =>
			expect(Math.round(box(launcher).top)).toBe(Math.round(box(header).bottom) + 16),
		);
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

/**
 * The config's phone options: the sticky bar's own words (`cta.stickyLabel`),
 * the burger's words (`menuLabel`), and the header's arrow (`cta.arrow`).
 */
export const PhoneOptionsFromTheConfig: Story = {
	args: {
		...visitPage,
		site: {
			...site,
			menuLabel: "Menu",
			cta: { ...site.cta, stickyLabel: "Order", arrow: true },
		},
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Menu" })).toBeVisible();
		const bar = canvas.getByRole("link", { name: "Call us" }).parentElement as HTMLElement;
		await waitFor(() =>
			expect(within(bar).getByRole("link", { name: "Order" })).toHaveAttribute("href", "/order"),
		);
	},
};

/** The sticky bar keeps the call to action's own words when the config gives no other. */
export const StickyLabelDefault: Story = {
	args: visitPage,
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("link", { name: "Call us" }).parentElement as HTMLElement;
		await expect(within(bar).getByRole("link", { name: site.cta.label })).toBeVisible();
	},
};

/**
 * The phone menu from the config: `menu.surface` sets the light sheet,
 * `cta.menuLabel` gives the menu's call to action its own words where the
 * sticky bar keeps the label, and a header number's `menuLabel` names its
 * card where the bar's pill keeps `label`.
 */
export const LightMenuFromTheConfig: Story = {
	args: {
		...visitPage,
		site: {
			...site,
			menu: { surface: "light" },
			cta: { ...site.cta, menuLabel: "Order ahead for Saturday", arrow: true },
			header: { phones: [{ ...phones[0], menuLabel: "Call the shop" }] },
		},
	},
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
		const dialog = canvas.getByRole("dialog", { name: "Menu" });
		const menu = within(dialog);
		await expect(menu.getByRole("link", { name: /Kestrel Hollow/ })).toHaveAttribute("href", "/");
		await expect(menu.getByRole("link", { name: /Order ahead for Saturday/ })).toBeVisible();
		await expect(
			menu.getByRole("link", { name: `Call the shop ${phones[0]?.display}` }),
		).toHaveAttribute("href", `tel:${phones[0]?.e164}`);
		const bar = canvas.getByRole("link", { name: "Call us" }).parentElement as HTMLElement;
		await expect(within(bar).getByRole("link", { name: site.cta.label })).toBeInTheDocument();
	},
};

/** Steps through opening and closing the menu, the launcher hidden only while it shows. */
async function dockStepsAside(
	canvas: ReturnType<typeof within>,
	userEvent: { click: (element: Element) => Promise<void> },
) {
	const launcher = canvas.getByRole("button", { name: "Talk to us" });
	await expect(launcher).toBeVisible();
	const at = box(launcher);
	await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
	const dialog = canvas.getByRole("dialog", { name: "Menu" });
	await waitFor(() => expect(launcher).not.toBeVisible());
	// What a tap where the launcher sat lands on is the sheet, never the launcher.
	await waitFor(() => {
		const hit = document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2);
		expect(dialog.contains(hit)).toBe(true);
	});
	await userEvent.click(within(dialog).getByRole("button", { name: "Close menu" }));
	await waitFor(() => expect(launcher).toBeVisible());
}

/**
 * While the phone menu is open the contact dock's launcher steps aside, so
 * it never sits over the menu's foot: on the dark sheet, where the sheet
 * always covered it from the top layer, and now hidden outright too.
 */
export const DockStepsAsideForTheMenu: Story = {
	args: visitPage,
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await dockStepsAside(canvas, userEvent);
	},
};

/** The same on the light sheet, whose foot holds the call to action and the numbers. */
export const DockStepsAsideForTheLightMenu: Story = {
	args: { ...visitPage, site: { ...site, menu: { surface: "light" }, header: { phones } } },
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await dockStepsAside(canvas, userEvent);
	},
};

/**
 * A page with a hero under a solid bar (`heroNav` off) whose config sets
 * `cta.stickyFromTop: false`: the phone's sticky bar waits until the page
 * scrolls, where by default such a page shows it from the first paint.
 */
export const StickyBarSlidesInUnderASolidBar: Story = {
	args: {
		...visitPage,
		site: { ...site, cta: { ...site.cta, stickyFromTop: false } },
		children: <HomeBody />,
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const call = canvas.getByRole("link", { name: "Call us" });
		await expect(box(call).top).toBeGreaterThanOrEqual(window.innerHeight);
		window.scrollTo({ top: 900, behavior: "instant" });
		await waitFor(() => expect(box(call).bottom).toBeLessThanOrEqual(window.innerHeight), {
			timeout: 5000,
		});
	},
};
