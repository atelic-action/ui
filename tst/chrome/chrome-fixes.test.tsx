import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Profiler } from "react";
import { renderToString } from "react-dom/server";
import {
	ContactDock,
	Footer,
	SiteHeader,
	SiteMenu,
	SiteShell,
	StickyCTABar,
} from "../../src/chrome";
import { barShowing } from "../../src/chrome/ContactDock";
import { groupHrefs, isGroup, panelSections } from "../../src/chrome/navSections";
import type { SiteConfig } from "../../src/sections/siteConfig";
import type { NavLink, NavPanelSection } from "../../src/types";
import { brand, primaryCTA } from "../fixtures";
import { testSite } from "../sections/site-fixture";

/*
 * The chrome's fixes from its first browser tests and its review (ATE-772):
 * a section kind the version does not know, keys that two links sharing an
 * href could collide on, the current page marked on every panel link, the
 * footer's heading level, the dock's two close controls, the sticky bar's
 * room at the foot of the page, and the dock's watch on the page. The sheet
 * rules are read as text, since jsdom applies none of them.
 */

const sheet = (name: string) =>
	readFileSync(join(import.meta.dirname, "..", "..", "src", "styles", name), "utf8");

/** A section from a later version's config, or a typo JSON let through. */
const unknown = { kind: "carousel", slides: [] } as unknown as NavPanelSection;

const group: NavLink = {
	label: "Services",
	href: "/services",
	allLabel: "All services",
	columns: [
		unknown,
		{
			heading: "Repair",
			href: "/services/repair",
			links: [
				// A child sharing its parent's href, two children sharing one, and
				// two links in the column sharing one.
				{
					label: "Roofs",
					href: "/services/roofs",
					children: [
						{ label: "Roofs overview", href: "/services/roofs" },
						{ label: "Shingle", href: "/services/shingle" },
						{ label: "Shingle again", href: "/services/shingle" },
					],
				},
				{ label: "Roofs, by another name", href: "/services/roofs" },
			],
		},
		{
			kind: "picture",
			image: { src: "/images/crew.jpg" },
			caption: "Meet the crew.",
			href: "/about",
		},
		{
			kind: "cards",
			heading: "Latest",
			cards: [{ title: "A storm season note", href: "/blog/storms" }],
		},
	],
};

function withoutKeyWarnings(run: () => void): string[] {
	const errors: string[] = [];
	const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
		errors.push(args.map(String).join(" "));
	});
	try {
		run();
	} finally {
		spy.mockRestore();
	}
	return errors.filter((line) => line.includes("same key"));
}

describe("a section of a kind this version does not know", () => {
	it("is left out of the panel's sections and its hrefs, and counts for nothing", () => {
		expect(panelSections(group)).toHaveLength(3);
		expect(groupHrefs(group)).not.toContain(undefined);
		expect(isGroup({ label: "Odd", href: "/odd", columns: [unknown] })).toBe(false);
	});

	it("prerenders the shell with it in the config, the rest of the group intact", () => {
		const site: SiteConfig = {
			...testSite,
			nav: [
				{
					label: "Services",
					to: "/services",
					columns: group.columns,
				},
				{ label: "Odd", to: "/odd", columns: [unknown] },
			],
		};
		const html = renderToString(
			<SiteShell site={site} currentPath="/">
				<p>Page</p>
			</SiteShell>,
		);
		expect(html).toContain("Meet the crew.");
		// A group holding only the unknown kind is a plain link.
		expect(html).toMatch(/<a[^>]*href="\/odd"[^>]*>Odd<\/a>/);
	});

	it("renders in the header and the phone's menu without it", () => {
		render(<SiteHeader brand={brand} links={[group]} />);
		expect(document.querySelectorAll(".nav-mega-sec")).toHaveLength(3);
		const menu = render(<SiteMenu open links={[group]} onClose={() => {}} />);
		fireEvent.click(within(menu.container).getByRole("button", { name: "Services" }));
		expect(
			within(menu.container).getByRole("link", { name: "Meet the crew." }),
		).toBeInTheDocument();
	});
});

describe("keys when links share an href", () => {
	it("warns of no duplicate key in the desktop panel or the phone's menu", () => {
		const warnings = withoutKeyWarnings(() => {
			render(<SiteHeader brand={brand} links={[group]} />);
			render(<SiteMenu open links={[group]} onClose={() => {}} />);
		});
		expect(warnings).toEqual([]);
	});
});

describe("the current page in the mega panel", () => {
	it("marks a picture, a card, a column heading, and the group's own link", () => {
		const at = (path: string) => {
			const { container, unmount } = render(
				<SiteHeader brand={brand} links={[group]} currentPath={path} />,
			);
			const current = [...container.querySelectorAll(".nav-mega [aria-current='page']")];
			const classes = current.map((node) => node.className);
			unmount();
			return classes;
		};
		expect(at("/about")).toEqual(["nav-mega-sec is-picture"]);
		expect(at("/blog/storms")).toEqual(["nav-mega-card-link"]);
		expect(at("/services/repair")).toEqual(["nav-mega-head"]);
		expect(at("/services")).toEqual(["nav-mega-all"]);
	});

	it("marks one link current when the panel links the page several times, the first in reading order", () => {
		const at = (path: string) => {
			const { container, unmount } = render(
				<SiteHeader brand={brand} links={[group]} currentPath={path} />,
			);
			const current = [...container.querySelectorAll(".nav-mega [aria-current]")].map(
				(node) => node.textContent,
			);
			unmount();
			return current;
		};
		// A parent, its own child, and a second link in the column all go to /services/roofs.
		expect(at("/services/roofs")).toEqual(["Roofs"]);
		// Two children share /services/shingle.
		expect(at("/services/shingle")).toEqual(["Shingle"]);
		expect(at("/nowhere")).toEqual([]);
	});

	it("styles a flat link on the current page as the bar marks a current group", () => {
		const chrome = sheet("chrome.css");
		expect(chrome).toMatch(
			/\.nav-links > a\.active,\s*\.atelic-ui \.nav-links > a\[aria-current="page"\],\s*\.atelic-ui \.nav-links \.nav-group-btn\.is-current \{\s*color: var\(--primary-ink, var\(--primary\)\);/,
		);
		expect(chrome).toMatch(/\.nav\.nav-dark \.nav-links > a\[aria-current="page"\]/);
		render(
			<SiteHeader
				brand={brand}
				links={[
					{ label: "Home", href: "/" },
					{ label: "About", href: "/about" },
				]}
				currentPath="/about"
			/>,
		);
		expect(
			within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", {
				name: "About",
			}),
		).toHaveAttribute("aria-current", "page");
	});

	it("lets the panel's sections wrap rather than overflow the card", () => {
		const chrome = sheet("chrome.css");
		expect(chrome).toMatch(/\.nav-mega-sections \{[^}]*flex-wrap: wrap;/);
		expect(chrome).toMatch(/\.nav-mega-sec\.is-picture \{[^}]*min-width: min\(220px, 100%\);/);
		// The text sections' least width is their floor or their longest word,
		// whichever is wider, so a crowded row wraps before a word breaks.
		expect(chrome).toMatch(/\.nav-mega-card \{[^}]*overflow-wrap: break-word;/);
		expect(chrome).toMatch(
			/\.nav-mega-sec:is\(\.is-links, \.is-rows, \.is-cards\) \{[^}]*min-width: auto;/,
		);
		// Each floor yields to a panel narrower than itself.
		expect(chrome).toMatch(/\.nav-mega-cards \{[^}]*min-width: min\(208px, 100%\);/);
		expect(chrome).toMatch(
			/\.nav-mega-rows \{[^}]*minmax\(min-content, 1fr\)[^}]*min-width: min\(320px, 100%\);/,
		);
		expect(chrome).toMatch(/\.nav-mega-sec\.is-links > ul \{[^}]*min-width: min\(120px, 100%\);/);
	});
});

describe("the footer's headings", () => {
	const columns = [
		{ heading: "Company", links: [{ label: "About", href: "/about" }] },
		{ heading: "Legal", links: [{ label: "Privacy", href: "/privacy" }] },
	];

	it("are headings by role, never by element, so a site's bare h2 rule cannot restyle them", () => {
		const { container } = render(<Footer brand={brand} columns={columns} />);
		expect(container.querySelectorAll(".footer h2, .footer h3, .footer h4")).toHaveLength(0);
		const headings = [...container.querySelectorAll(".footer-heading")];
		expect(
			headings.map((h) => [h.tagName, h.getAttribute("role"), h.getAttribute("aria-level")]),
		).toEqual([
			["DIV", "heading", "2"],
			["DIV", "heading", "2"],
		]);
		// The look an h2 took from the base sheet is the class's own now.
		expect(sheet("chrome.css")).toMatch(
			/\.footer \.footer-heading \{[^}]*line-height: 1\.04;[^}]*margin: 0 0 14px;/,
		);
	});

	it("are h2 by default, whatever the page's outline ends on", () => {
		render(<Footer brand={brand} columns={columns} />);
		expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
			"Company",
			"Legal",
		]);
		expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
	});

	it("take the level a site passes, and name their nav either way", () => {
		render(<Footer brand={brand} columns={columns} headingLevel={3} />);
		expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
		expect(screen.getByRole("navigation", { name: "Legal" })).toBeInTheDocument();
	});

	it("are styled by class, never by element", () => {
		const chrome = sheet("chrome.css");
		expect(chrome).toMatch(/\.footer \.footer-heading \{/);
		expect(chrome).not.toMatch(/\.footer h4/);
	});
});

describe("the contact dock's controls", () => {
	const items = [{ label: "Call", href: "tel:+15555550100" }];

	it("gives the launcher and the panel's button distinct names while open", () => {
		render(<ContactDock label="Talk to us" items={items} defaultOpen />);
		const names = screen
			.getAllByRole("button")
			.map((button) => button.getAttribute("aria-label") ?? button.textContent);
		expect(names).toContain("Close");
		expect(names).toContain("Close panel");
		expect(new Set(names).size).toBe(names.length);
	});

	it("takes both names from props", () => {
		render(
			<ContactDock
				label="Talk to us"
				items={items}
				defaultOpen
				closeLabel="Done"
				panelCloseLabel="Hide the ways to reach us"
			/>,
		);
		expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Hide the ways to reach us" })).toBeInTheDocument();
	});
});

describe("the bar the dock lifts over", () => {
	it("is showing by data-showing when it keeps one, else by the old show class", () => {
		const bar = document.createElement("div");
		document.body.append(bar);
		bar.dataset.showing = "true";
		expect(barShowing(bar)).toBe(true);
		bar.dataset.showing = "false";
		bar.classList.add("show");
		expect(barShowing(bar)).toBe(false);
		delete bar.dataset.showing;
		expect(barShowing(bar)).toBe(true);
		bar.classList.remove("show");
		expect(barShowing(bar)).toBe(false);
		expect(barShowing(null)).toBe(false);
		bar.remove();
	});

	it("lifts over a site's own bar that wears only .sticky-cta.show", async () => {
		const width = window.innerWidth;
		Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
		Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
		const bar = document.createElement("div");
		bar.className = "sticky-cta show";
		bar.getBoundingClientRect = () => ({ height: 72 }) as DOMRect;
		document.body.append(bar);
		try {
			const { container } = render(
				<ContactDock label="Talk to us" items={[{ label: "Call", href: "tel:+1" }]} avoid={null} />,
			);
			const dock = container.querySelector(".contact-dock") as HTMLElement;
			await waitFor(() => expect(dock.style.bottom).toBe("88px"));
		} finally {
			bar.remove();
			Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
		}
	});
});

describe("the dock's watch on the page", () => {
	it("binds again only when the bar or the footer it finds changes, never for other elements", async () => {
		const footer = document.createElement("footer");
		let reads = 0;
		footer.getBoundingClientRect = () => {
			reads += 1;
			return { top: 2000 } as DOMRect;
		};
		document.body.append(footer);
		try {
			render(
				<ContactDock
					label="Talk to us"
					items={[{ label: "Call", href: "tel:+1" }]}
					avoid="footer"
				/>,
			);
			await waitFor(() => expect(reads).toBeGreaterThan(0));
			const settled = reads;
			// A carousel stepping, a message appearing: elements come and go.
			for (let i = 0; i < 5; i += 1) {
				const note = document.createElement("p");
				document.body.append(note);
				note.remove();
				await new Promise((resolve) => setTimeout(resolve, 20));
			}
			expect(reads).toBe(settled);

			// A route change swaps the footer: the dock finds the new one.
			const next = document.createElement("footer");
			let nextReads = 0;
			next.getBoundingClientRect = () => {
				nextReads += 1;
				return { top: 2000 } as DOMRect;
			};
			footer.replaceWith(next);
			await waitFor(() => expect(nextReads).toBeGreaterThan(0));
			next.remove();
		} finally {
			footer.remove();
		}
	});
});

describe("the sticky bar's room at the foot of the page", () => {
	const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
	beforeEach(() => {
		Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
			configurable: true,
			get(this: HTMLElement) {
				return this.classList.contains("sticky-cta") ? 74 : 0;
			},
		});
	});
	afterEach(() => {
		if (height) Object.defineProperty(HTMLElement.prototype, "offsetHeight", height);
		act(() => {
			Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
			window.dispatchEvent(new Event("scroll"));
		});
	});

	it("reserves the bar's measured height from the first measure, before it slides in, and keeps it as it comes and goes", () => {
		const space = vi.fn();
		render(<StickyCTABar primaryCTA={primaryCTA} threshold={100} onSpaceChange={space} />);
		// Still below the screen at the top, the bar's room is already reserved,
		// so a jump straight to the end lands clear of it.
		expect(space.mock.calls).toEqual([[74]]);
		act(() => {
			Object.defineProperty(window, "scrollY", { configurable: true, value: 300 });
			window.dispatchEvent(new Event("scroll"));
		});
		act(() => {
			Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
			window.dispatchEvent(new Event("scroll"));
		});
		// Sliding in and back out changes nothing at the page's end.
		expect(space.mock.calls).toEqual([[74]]);
	});

	it("reserves nothing where the stylesheet hides the bar, a desktop", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(0);
		const space = vi.fn();
		render(<StickyCTABar primaryCTA={primaryCTA} threshold={100} onSpaceChange={space} />);
		expect(space.mock.calls).toEqual([[0]]);
		height.mockRestore();
	});

	it("starts measuring for a listener supplied after the bar mounted", () => {
		const space = vi.fn();
		const { rerender } = render(<StickyCTABar primaryCTA={primaryCTA} fromTop />);
		expect(space).not.toHaveBeenCalled();
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={space} />);
		expect(space).toHaveBeenLastCalledWith(74);
		// A new function in its place is the same caller's: the height it was
		// told stands, so neither hears anything until the height changes.
		const next = vi.fn();
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={next} />);
		expect(space).toHaveBeenCalledOnce();
		expect(next).not.toHaveBeenCalled();
	});

	it("hands back its space with a final 0 when the listener is taken away", () => {
		const space = vi.fn();
		const { rerender } = render(
			<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={space} />,
		);
		expect(space).toHaveBeenLastCalledWith(74);
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop />);
		expect(space).toHaveBeenLastCalledWith(0);
	});

	it("hands back its space with a final 0 when it unmounts", () => {
		const space = vi.fn();
		const { unmount } = render(
			<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={space} />,
		);
		expect(space).toHaveBeenLastCalledWith(74);
		unmount();
		expect(space).toHaveBeenLastCalledWith(0);
	});

	it("sets the shell's space without rendering the shell again", () => {
		// Every commit under the shell after its first is a render the bar's
		// height caused, the only thing that changes here.
		const phases: string[] = [];
		const { container } = render(
			<Profiler id="shell" onRender={(_id, phase) => phases.push(phase)}>
				<SiteShell site={testSite} currentPath="/about">
					<p>Page</p>
				</SiteShell>
			</Profiler>,
		);
		const root = container.querySelector(".atelic-ui") as HTMLElement;
		// An interior page's bar shows from the top and reports its height after
		// mount; the shell writes it onto its root outside React's render.
		expect(root.style.getPropertyValue("--sticky-cta-space")).toBe("74px");
		expect(phases).toEqual(["mount"]);
	});

	it("pads the shell's closing bar by it, and by nothing with the bar off", () => {
		const { container, unmount } = render(
			<SiteShell site={testSite} currentPath="/about">
				<p>Page</p>
			</SiteShell>,
		);
		const root = container.querySelector(".atelic-ui") as HTMLElement;
		expect(root.style.getPropertyValue("--sticky-cta-space")).toBe("74px");
		unmount();
		const off = render(
			<SiteShell site={testSite} currentPath="/about" stickyCTA={false}>
				<p>Page</p>
			</SiteShell>,
		);
		const bare = off.container.querySelector(".atelic-ui") as HTMLElement;
		expect(bare.style.getPropertyValue("--sticky-cta-space")).toBe("");
		expect(sheet("chrome.css")).toMatch(
			/\.closing-bar \{[^}]*padding-bottom: calc\(18px \+ var\(--sticky-cta-space, 0px\)\);/,
		);
	});
});

describe("the primary's three jobs in the sheets", () => {
	const all = [
		"base.css",
		"chrome.css",
		"components.css",
		"primitives.css",
		"sections.css",
		"gate.css",
	]
		.map(sheet)
		.join("\n");

	it("never softens the words on a primary field, which a fill cut to pass leaves no room for", () => {
		expect(all).not.toMatch(/(?<![-\w])color: color-mix\(in srgb, var\(--on-primary\)/);
	});

	it("puts every primary field with words on the fill, and darkens the fill for hover", () => {
		const fill = "var(--primary-fill, var(--primary))";
		for (const selector of [
			".btn-primary",
			".cd-launch",
			".cd-head",
			".nav-mega-badge",
			".callout-panel",
		]) {
			const rule = all.match(new RegExp(`\\.atelic-ui \\${selector} \\{[^}]*\\}`))?.[0] ?? "";
			expect(rule, selector).toContain(`background: ${fill};`);
		}
		expect(all).toMatch(
			/\.btn-primary:hover \{[^}]*background: color-mix\(in srgb, var\(--primary-fill, var\(--primary\)\) 84%, var\(--shade\)\);/,
		);
	});

	it("sets the primary's words on the surface in the ink", () => {
		expect(all).toMatch(
			/\.atelic-ui \.eyebrow \{[^}]*color: var\(--primary-ink, var\(--primary\)\);/,
		);
		expect(all).toMatch(
			/\.on-primary \.btn-primary \{[^}]*color: var\(--primary-ink, var\(--primary\)\);/,
		);
	});

	it("gives the split hero's accent the field's own words", () => {
		expect(sheet("sections.css")).toMatch(
			/\.hero\.is-split h1 \.serif \{\s*color: var\(--on-primary\);/,
		);
	});

	it("shades a lightbox backdrop that inherits nothing, with no raw color in the reading sheet", () => {
		expect(sheet("primitives.css")).toMatch(
			/\.pb-lightbox::backdrop \{\s*background: color-mix\(in srgb, var\(--shade, var\(--backdrop-shade\)\) 72%, transparent\);/,
		);
		expect(sheet("defaults.css")).toMatch(/::backdrop \{\s*--backdrop-shade: #000;/);
	});
});

describe("a document's mark height", () => {
	it("is the token, set on the artifact shell, never the image's own height", () => {
		const artifact = sheet("artifact.css");
		expect(artifact).toMatch(
			/\.atelic-ui\[data-shell="artifact"\] \{\s*--brand-mark-height: 20px;/,
		);
		expect(artifact).not.toMatch(/\.nav-logo \.mark \{[^}]*height:/);
	});
});
