import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { Footer, type NavLink, SiteHeader, SiteMenu } from "../../src/chrome";
import { NotFound } from "../../src/components";
import { LinkColumns } from "../../src/sections";
import { brand } from "../fixtures";

/**
 * A one page site points every entry at an anchor on one page, many at the
 * same one. Keyed by href, React warned of duplicate keys and could drop or
 * reuse a row; keyed by place, every link renders and nothing warns.
 */
const HREF = "/#visit";

const nav: NavLink[] = [
	{ label: "Bread", href: HREF },
	{ label: "Pastry", href: HREF },
	{
		label: "Visit",
		href: HREF,
		columns: [
			{
				heading: "The shop",
				href: HREF,
				links: [
					{ label: "Hours", href: HREF, children: [{ label: "Holidays", href: HREF }] },
					{ label: "Parking", href: HREF },
				],
			},
			{
				kind: "rows",
				rows: [
					{ label: "Directions", icon: "map", href: HREF },
					{ label: "Call", icon: "phone", href: HREF },
				],
			},
			{
				kind: "cards",
				cards: [
					{ title: "The shop at dawn", href: HREF },
					{ title: "The counter", href: HREF },
				],
			},
		],
	},
	{
		label: "Wholesale",
		href: HREF,
		columns: [{ heading: "Cafes", links: [{ label: "Accounts", href: HREF }] }],
	},
];

/** Renders, and returns every key warning React logged meanwhile. */
function keyWarnings(element: ReactElement) {
	const errors = vi.spyOn(console, "error").mockImplementation(() => {});
	const view = render(element);
	const warnings = errors.mock.calls.filter((call) => call.join(" ").includes("same key"));
	errors.mockRestore();
	return { view, warnings };
}

describe("links that share an href", () => {
	it("SiteHeader and its panels render every entry and link, with no key warning", () => {
		const { warnings } = keyWarnings(<SiteHeader brand={brand} links={nav} />);
		expect(warnings).toEqual([]);
		const bar = within(screen.getByRole("navigation", { name: "Primary" }));
		expect(bar.getByRole("link", { name: "Bread" })).toBeInTheDocument();
		expect(bar.getByRole("link", { name: "Pastry" })).toBeInTheDocument();
		expect(bar.getAllByRole("button")).toHaveLength(2);
		for (const label of ["Hours", "Holidays", "Parking", "Accounts"]) {
			expect(document.body.textContent).toContain(label);
		}
	});

	it("SiteMenu renders every entry, group, and section link, with no key warning", () => {
		const { view, warnings } = keyWarnings(<SiteMenu open onClose={() => {}} links={nav} />);
		expect(warnings).toEqual([]);
		const dialog = view.container.querySelector("dialog") as HTMLElement;
		expect(dialog.querySelectorAll(".mm-link")).toHaveLength(4);
		expect(dialog.querySelectorAll(`a[href="${HREF}"]`).length).toBeGreaterThanOrEqual(11);
	});

	it("the footer, the not found page, and link columns keep two links to one page", () => {
		const twice = [
			{ label: "Visit", href: HREF },
			{ label: "Visit", href: HREF },
		];
		const footer = keyWarnings(
			<Footer brand={brand} columns={[{ heading: "Company", links: twice }]} />,
		);
		expect(footer.warnings).toEqual([]);
		expect(
			within(screen.getByRole("navigation", { name: "Company" })).getAllByRole("link"),
		).toHaveLength(2);
		footer.view.unmount();

		const notFound = keyWarnings(
			<NotFound
				title="Gone"
				links={twice}
				closing={{ title: "Back" }}
				primaryCTA={{ label: "Order", href: "/order" }}
			/>,
		);
		expect(notFound.warnings).toEqual([]);
		expect(screen.getAllByRole("link", { name: "Visit" })).toHaveLength(2);
		notFound.view.unmount();

		const columns = keyWarnings(
			<LinkColumns
				columns={[
					{ heading: "Here", links: twice },
					{ heading: "Here", links: twice },
				]}
			/>,
		);
		expect(columns.warnings).toEqual([]);
		expect(screen.getAllByRole("link", { name: "Visit" })).toHaveLength(4);
	});
});
