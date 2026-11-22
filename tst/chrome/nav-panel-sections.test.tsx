import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SiteHeader, SiteMenu, SiteShell } from "../../src/chrome";
import type { NavLink } from "../../src/types";
import { brand } from "../fixtures";
import { testSite } from "../sections/site-fixture";

/*
 * The panel's section kinds and the link shapes inside them: nested links,
 * badges, a linked column heading, the feature card's ticked points, and the
 * picture, icon row, and card sections, on the desktop panel and in the
 * phone's menu. The open, close, and keyboard behavior they ride on is in
 * site-header-groups.test.tsx.
 */

const groups: NavLink[] = [
	{
		label: "Bread",
		href: "/bread",
		columns: [
			{
				heading: "Loaves",
				href: "/bread/loaves",
				links: [
					{
						label: "Sourdough",
						href: "/bread/sourdough",
						children: [
							{ label: "Country", href: "/bread/country" },
							{ label: "Seeded", href: "/bread/seeded", badge: "New" },
						],
					},
					{ label: "Rye", href: "/bread/rye", badge: "Popular" },
				],
			},
		],
		feature: {
			eyebrow: "Order ahead",
			title: "Skip the line.",
			points: ["Pick a time", "Pay at the counter"],
			cta: { label: "Order", href: "/order" },
		},
	},
	{
		label: "Learn",
		href: "/learn",
		columns: [
			{
				kind: "picture",
				image: { src: "/images/oven.jpg" },
				caption: "Bread from the back of the shop.",
				href: "/story",
			},
			{
				kind: "rows",
				heading: "Explore",
				rows: [
					{
						label: "Order tool",
						description: "Pick a loaf and a time",
						icon: "calculator",
						href: "/order",
						highlight: true,
					},
					{
						label: "Allergens",
						description: "What is in what",
						icon: "shield",
						href: "/allergens",
					},
				],
			},
			{
				kind: "cards",
				heading: "Latest",
				cards: [
					{ kicker: "Latest post", title: "Why rye", meta: "4 min", href: "/blog/rye" },
					{
						kicker: "Latest bake",
						title: "Morning buns",
						image: { src: "/images/buns.jpg", alt: "" },
						href: "/buns",
					},
				],
			},
		],
	},
];

function panelOf(name: string): HTMLElement {
	const control = screen.getByRole("button", { name });
	const panel = document.getElementById(control.getAttribute("aria-controls") ?? "");
	if (!panel) throw new Error("the group control names no panel");
	return panel;
}

describe("the mega panel's link shapes", () => {
	it("draws a link's children indented under it, inside its own item", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const panel = panelOf("Bread");
		const parent = within(panel).getByRole("link", { name: "Sourdough" });
		const item = parent.closest("li") as HTMLElement;
		const children = item.querySelector(".nav-mega-children") as HTMLElement;
		expect(
			within(children)
				.getAllByRole("link")
				.map((link) => link.getAttribute("href")),
		).toEqual(["/bread/country", "/bread/seeded"]);
		expect(within(children).getByRole("link", { name: /Country/ })).toHaveClass("nav-mega-sub");
	});

	it("sets a badge after the label, read as part of the link's name", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const panel = panelOf("Bread");
		const rye = within(panel).getByRole("link", { name: "Rye Popular" });
		expect(rye.querySelector(".nav-mega-badge")).toHaveTextContent("Popular");
		expect(within(panel).getByRole("link", { name: "Seeded New" })).toBeInTheDocument();
	});

	it("makes a column heading a link when it has an href", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const head = within(panelOf("Bread")).getByRole("link", { name: "Loaves" });
		expect(head).toHaveClass("nav-mega-head");
		expect(head).toHaveAttribute("href", "/bread/loaves");
	});

	it("marks the group current when the page is a child link", () => {
		render(<SiteHeader brand={brand} links={groups} currentPath="/bread/seeded" />);
		expect(screen.getByRole("button", { name: "Bread" })).toHaveClass("is-current");
		expect(within(panelOf("Bread")).getByRole("link", { name: "Seeded New" })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	it("draws no link to the group's own page unless allLabel is given", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		expect(panelOf("Bread").querySelector(".nav-mega-all")).toBeNull();
	});
});

describe("the feature card", () => {
	it("ticks its points and puts its action on the Button primitive, closing the panel when followed", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		fireEvent.click(screen.getByRole("button", { name: "Bread" }));
		const card = panelOf("Bread").querySelector(".nav-feature") as HTMLElement;
		const points = within(card).getAllByRole("listitem");
		expect(points.map((point) => point.textContent)).toEqual(["Pick a time", "Pay at the counter"]);
		expect(card.querySelectorAll(".tick")).toHaveLength(2);

		const order = within(card).getByRole("link", { name: "Order" });
		expect(order).toHaveClass("btn", "btn-primary", "nav-feature-cta");
		fireEvent.click(order);
		expect(screen.getByRole("button", { name: "Bread" })).toHaveAttribute("aria-expanded", "false");
	});
});

describe("the picture, icon row, and card sections", () => {
	it("draws a picture as one link named by its caption", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const picture = within(panelOf("Learn")).getByRole("link", {
			name: "Bread from the back of the shop.",
		});
		expect(picture).toHaveAttribute("href", "/story");
		expect(picture.querySelector("img")).toHaveAttribute("alt", "");
	});

	it("draws icon rows as links with their icon, one highlighted", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const panel = panelOf("Learn");
		const tool = within(panel).getByRole("link", { name: /Order tool/ });
		expect(tool).toHaveClass("nav-mega-row", "is-highlight");
		expect(tool.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
		expect(within(panel).getByRole("link", { name: /Allergens/ })).not.toHaveClass("is-highlight");
	});

	it("draws cards with their kicker, title, and meta, and a quiet tile where a card has no picture", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const panel = panelOf("Learn");
		const post = within(panel).getByRole("link", { name: /Why rye/ });
		expect(post).toHaveTextContent("Latest post");
		expect(post).toHaveTextContent("4 min");
		expect(post.querySelector("span.nav-mega-thumb")).toHaveAttribute("aria-hidden", "true");
		expect(
			within(panel)
				.getByRole("link", { name: /Morning buns/ })
				.querySelector("img"),
		).toHaveAttribute("src", "/images/buns.jpg");
	});

	it("walks every section's links with the arrow keys", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const control = screen.getByRole("button", { name: "Learn" });
		act(() => control.focus());
		fireEvent.keyDown(control, { key: "ArrowDown" });
		const panel = panelOf("Learn");
		const picture = within(panel).getByRole("link", { name: "Bread from the back of the shop." });
		expect(picture).toHaveFocus();
		fireEvent.keyDown(picture, { key: "ArrowDown" });
		expect(within(panel).getByRole("link", { name: /Order tool/ })).toHaveFocus();
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
		expect(picture).toHaveFocus();
	});
});

describe("the phone menu's sections", () => {
	function openGroup(name: string): HTMLElement {
		fireEvent.click(screen.getByRole("button", { name }));
		const control = screen.getByRole("button", { name });
		const panel = document.getElementById(control.getAttribute("aria-controls") ?? "");
		if (!panel) throw new Error("no panel");
		return panel;
	}

	it("indents children under their parent and keeps the badges", () => {
		render(<SiteMenu open onClose={() => {}} links={groups} />);
		const panel = openGroup("Bread");
		const country = within(panel).getByRole("link", { name: "Country" });
		expect(country).toHaveClass("mm-group-sub");
		expect(country.closest(".mm-group-item")).toBe(
			within(panel).getByRole("link", { name: "Sourdough" }).closest(".mm-group-item"),
		);
		expect(within(panel).getByRole("link", { name: "Rye Popular" })).toBeInTheDocument();
	});

	it("turns icon rows and cards into plain links and leaves the picture out", () => {
		render(<SiteMenu open onClose={() => {}} links={groups} />);
		const panel = openGroup("Learn");
		expect(
			within(panel)
				.getAllByRole("link")
				.map((link) => link.textContent),
		).toEqual(["Order tool", "Allergens", "Why rye", "Morning buns"]);
		expect(within(panel).getByText("Explore")).toHaveClass("mm-group-head");
		expect(panel.querySelector("img")).toBeNull();
	});
});

describe("SiteShell and the panel sections", () => {
	it("puts the base path on every link and picture a section holds", () => {
		render(
			<SiteShell
				site={{
					...testSite,
					nav: [
						{
							label: groups[1].label,
							to: groups[1].href,
							columns: groups[1].columns,
						},
						{ label: groups[0].label, to: groups[0].href, columns: groups[0].columns },
					],
				}}
				currentPath="/"
				basePath="/proto"
			>
				<p>Page</p>
			</SiteShell>,
		);
		const learn = panelOf("Learn");
		expect(
			within(learn).getByRole("link", { name: "Bread from the back of the shop." }),
		).toHaveAttribute("href", "/proto/story");
		expect(learn.querySelector(".is-picture img")).toHaveAttribute("src", "/proto/images/oven.jpg");
		expect(within(learn).getByRole("link", { name: /Allergens/ })).toHaveAttribute(
			"href",
			"/proto/allergens",
		);
		const buns = within(learn).getByRole("link", { name: /Morning buns/ });
		expect(buns).toHaveAttribute("href", "/proto/buns");
		expect(buns.querySelector("img")).toHaveAttribute("src", "/proto/images/buns.jpg");
		expect(within(panelOf("Bread")).getByRole("link", { name: "Country" })).toHaveAttribute(
			"href",
			"/proto/bread/country",
		);
	});
});
