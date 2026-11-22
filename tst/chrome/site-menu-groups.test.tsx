import { fireEvent, render, screen, within } from "@testing-library/react";
import { SiteMenu } from "../../src/chrome";
import type { NavLink } from "../../src/types";

const links: NavLink[] = [
	{
		label: "Services",
		href: "/services",
		allLabel: "All services",
		columns: [
			{
				heading: "Repair",
				links: [
					{ label: "Patch", href: "/services/patch" },
					{ label: "Replace", href: "/services/replace" },
				],
			},
		],
	},
	{
		label: "Areas",
		href: "/areas",
		columns: [{ heading: "North", links: [{ label: "Northtown", href: "/areas/northtown" }] }],
	},
	{ label: "About", href: "/about" },
];

function panelOf(control: HTMLElement): HTMLElement {
	const panel = document.getElementById(control.getAttribute("aria-controls") ?? "");
	if (!panel) throw new Error("the group control names no panel");
	return panel;
}

describe("SiteMenu groups", () => {
	it("opens with every group closed, even the one holding the current page", () => {
		render(<SiteMenu open onClose={() => {}} links={links} currentPath="/services/replace" />);
		const services = screen.getByRole("button", { name: "Services" });
		const areas = screen.getByRole("button", { name: "Areas" });
		expect(services).toHaveAttribute("aria-expanded", "false");
		expect(areas).toHaveAttribute("aria-expanded", "false");
		expect(panelOf(services)).toHaveAttribute("inert");
		// The links ship in the HTML while closed, the current one marked.
		expect(within(panelOf(services)).getByRole("link", { name: "Replace" })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	it("opens one group at a time, and a second tap closes it", () => {
		render(<SiteMenu open onClose={() => {}} links={links} />);
		const services = screen.getByRole("button", { name: "Services" });
		const areas = screen.getByRole("button", { name: "Areas" });

		fireEvent.click(services);
		expect(services).toHaveAttribute("aria-expanded", "true");
		expect(panelOf(services)).not.toHaveAttribute("inert");
		expect(within(panelOf(services)).getByRole("link", { name: "All services" })).toHaveAttribute(
			"href",
			"/services",
		);

		fireEvent.click(areas);
		expect(services).toHaveAttribute("aria-expanded", "false");
		expect(areas).toHaveAttribute("aria-expanded", "true");

		fireEvent.click(areas);
		expect(areas).toHaveAttribute("aria-expanded", "false");
	});

	it("closes every group again when the menu reopens", () => {
		const { rerender } = render(<SiteMenu open onClose={() => {}} links={links} />);
		const services = screen.getByRole("button", { name: "Services" });
		fireEvent.click(services);
		expect(services).toHaveAttribute("aria-expanded", "true");

		rerender(<SiteMenu open={false} onClose={() => {}} links={links} />);
		rerender(<SiteMenu open onClose={() => {}} links={links} />);
		expect(services).toHaveAttribute("aria-expanded", "false");
	});

	it("keeps a plain entry a numbered link", () => {
		render(<SiteMenu open onClose={() => {}} links={links} />);
		const about = screen.getByRole("link", { name: /About/ });
		expect(about).toHaveClass("mm-link");
		expect(about.querySelector(".idx")).toHaveTextContent("03");
	});

	it("lists the header's numbers at the foot, each a tel link with its label", () => {
		const { container } = render(
			<SiteMenu
				open
				onClose={() => {}}
				links={links}
				phones={[
					{ e164: "+15555550100", display: "(555) 555-0100", label: "Main office" },
					{ e164: "+15555550101", display: "(555) 555-0101" },
				]}
			/>,
		);
		const tels = container.querySelectorAll(".mm-contact a[href^='tel:']");
		expect(tels).toHaveLength(2);
		expect(tels[0]).toHaveTextContent("MAIN OFFICE");
		expect(tels[1]).toHaveAttribute("href", "tel:+15555550101");
	});
});
