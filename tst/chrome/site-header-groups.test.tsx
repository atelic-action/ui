import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SiteHeader } from "../../src/chrome";
import type { NavLink } from "../../src/types";
import { brand, primaryCTA } from "../fixtures";

/*
 * jsdom has no PointerEvent, so a fired pointer event carries no pointerType
 * and the header cannot tell a mouse from a finger. This stand in carries it.
 */
if (typeof window.PointerEvent === "undefined") {
	class PointerEventStandIn extends MouseEvent {
		pointerType: string;
		constructor(type: string, init: PointerEventInit = {}) {
			super(type, init);
			this.pointerType = init.pointerType ?? "";
		}
	}
	Object.defineProperty(window, "PointerEvent", { configurable: true, value: PointerEventStandIn });
}

const groups: NavLink[] = [
	{
		label: "Services",
		href: "/services",
		allLabel: "All services",
		columns: [
			{
				heading: "Repair",
				href: "/services/repair",
				links: [
					{ label: "Patch", href: "/services/patch", description: "Small fixes" },
					{ label: "Replace", href: "/services/replace" },
				],
			},
		],
		feature: {
			title: "A headline",
			text: "One line",
			cta: { label: "Get a quote", href: "/quote" },
		},
	},
	{
		label: "Areas",
		href: "/areas",
		columns: [{ heading: "North", links: [{ label: "Northtown", href: "/areas/northtown" }] }],
	},
	{ label: "About", href: "/about" },
];

function controlFor(name: string) {
	return screen.getByRole("button", { name });
}

function panelOf(control: HTMLElement): HTMLElement {
	const id = control.getAttribute("aria-controls");
	const panel = id ? document.getElementById(id) : null;
	if (!panel) throw new Error("the group control names no panel");
	return panel;
}

function hover(element: HTMLElement) {
	fireEvent.pointerOver(element, { pointerType: "mouse" });
	fireEvent.pointerEnter(element, { pointerType: "mouse" });
}

describe("SiteHeader nav groups", () => {
	it("renders a flat list exactly as plain links, with no group controls", () => {
		const { container } = render(
			<SiteHeader brand={brand} links={[{ label: "About", href: "/about" }]} />,
		);
		const nav = screen.getByRole("navigation", { name: "Primary" });
		expect(within(nav).getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
		expect(container.querySelector(".nav-group-btn")).toBeNull();
		expect(container.querySelector("header")).not.toHaveClass("is-wide");
	});

	it("renders a group as a closed control whose panel stays in the HTML, inert", () => {
		const { container } = render(<SiteHeader brand={brand} links={groups} />);
		const control = controlFor("Services");
		const panel = panelOf(control);
		expect(control).toHaveAttribute("aria-expanded", "false");
		expect(panel).toHaveAttribute("inert");
		expect(panel.querySelector('a[href="/services/patch"]')).toHaveTextContent("Small fixes");
		expect(panel.querySelector(".nav-feature")).toHaveTextContent("A headline");
		expect(container.querySelector("header")).toHaveClass("is-wide");
	});

	it("pins a group open on a click and closes it on a second", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const control = controlFor("Services");
		fireEvent.click(control);
		expect(control).toHaveAttribute("aria-expanded", "true");
		expect(panelOf(control)).not.toHaveAttribute("inert");
		fireEvent.click(control);
		expect(control).toHaveAttribute("aria-expanded", "false");
		expect(panelOf(control)).toHaveAttribute("inert");
	});

	it("opens one group at a time", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		fireEvent.click(controlFor("Services"));
		fireEvent.click(controlFor("Areas"));
		expect(controlFor("Services")).toHaveAttribute("aria-expanded", "false");
		expect(controlFor("Areas")).toHaveAttribute("aria-expanded", "true");
	});

	it("opens on a mouse hover and closes when the pointer leaves the header, unless pinned", () => {
		const { container } = render(<SiteHeader brand={brand} links={groups} />);
		const header = container.querySelector("header") as HTMLElement;
		const control = controlFor("Services");

		hover(control);
		expect(control).toHaveAttribute("aria-expanded", "true");
		fireEvent.pointerOut(header, { pointerType: "mouse" });
		fireEvent.pointerLeave(header, { pointerType: "mouse" });
		expect(control).toHaveAttribute("aria-expanded", "false");

		hover(control);
		// A click on a hovered group pins it, and leaving keeps it open.
		fireEvent.click(control);
		fireEvent.pointerOut(header, { pointerType: "mouse" });
		fireEvent.pointerLeave(header, { pointerType: "mouse" });
		expect(control).toHaveAttribute("aria-expanded", "true");
	});

	it("closes on Escape and hands focus back to the group's control", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const control = controlFor("Services");
		fireEvent.click(control);
		const link = within(panelOf(control)).getByRole("link", { name: /Patch/ });
		act(() => link.focus());
		fireEvent.keyDown(document, { key: "Escape" });
		expect(control).toHaveAttribute("aria-expanded", "false");
		expect(control).toHaveFocus();
	});

	it("closes on a click outside the header", () => {
		render(
			<>
				<SiteHeader brand={brand} links={groups} />
				<p>Page</p>
			</>,
		);
		const control = controlFor("Services");
		fireEvent.click(control);
		fireEvent.pointerDown(screen.getByText("Page"));
		expect(control).toHaveAttribute("aria-expanded", "false");
	});

	it("steps into a panel on the down arrow and walks it with up and down", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const control = controlFor("Services");
		act(() => control.focus());
		fireEvent.keyDown(control, { key: "ArrowDown" });
		expect(control).toHaveAttribute("aria-expanded", "true");
		const panel = panelOf(control);
		const first = within(panel).getByRole("link", { name: /All services/ });
		expect(first).toHaveFocus();
		fireEvent.keyDown(first, { key: "ArrowDown" });
		expect(within(panel).getByRole("link", { name: "Repair" })).toHaveFocus();
	});

	it("walks the bar's entries with left and right", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const services = controlFor("Services");
		act(() => services.focus());
		fireEvent.keyDown(services, { key: "ArrowRight" });
		expect(controlFor("Areas")).toHaveFocus();
		fireEvent.keyDown(controlFor("Areas"), { key: "ArrowRight" });
		const nav = screen.getByRole("navigation", { name: "Primary" });
		expect(within(nav).getByRole("link", { name: "About" })).toHaveFocus();
		fireEvent.keyDown(within(nav).getByRole("link", { name: "About" }), { key: "ArrowRight" });
		expect(services).toHaveFocus();
	});

	it("closes a group when focus leaves it", () => {
		render(<SiteHeader brand={brand} links={groups} />);
		const control = controlFor("Services");
		fireEvent.click(control);
		const about = within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", {
			name: "About",
		});
		fireEvent.blur(control, { relatedTarget: about });
		expect(control).toHaveAttribute("aria-expanded", "false");
	});

	it("marks the group holding the current page, and the page's link", () => {
		render(<SiteHeader brand={brand} links={groups} currentPath="/services/replace" />);
		const control = controlFor("Services");
		expect(control).toHaveClass("is-current");
		expect(within(panelOf(control)).getByRole("link", { name: "Replace" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		// Current or not, nothing opens by itself.
		expect(control).toHaveAttribute("aria-expanded", "false");
	});

	it("shows up to two numbers as tel links, named with their labels, and drops a third", () => {
		const { container } = render(
			<SiteHeader
				brand={brand}
				links={groups}
				primaryCTA={primaryCTA}
				phones={[
					{ e164: "+15555550100", display: "(555) 555-0100", label: "Main office" },
					{ e164: "+15555550101", display: "(555) 555-0101" },
					{ e164: "+15555550102", display: "(555) 555-0102" },
				]}
			/>,
		);
		const numbers = container.querySelectorAll(".nav-phone");
		expect(numbers).toHaveLength(2);
		expect(numbers[0]).toHaveAttribute("href", "tel:+15555550100");
		expect(numbers[0]).toHaveAccessibleName("Main office (555) 555-0100");
		expect(numbers[0]).not.toHaveAttribute("target");
		expect(container.querySelector(".nav-call")).toHaveAttribute("href", "tel:+15555550100");
		expect(container.querySelector('a[href="tel:+15555550102"]')).toBeNull();
	});
});
