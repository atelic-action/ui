import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, type TabsItem } from "../../src/components";

const tabs: TabsItem[] = [
	{
		id: "plan",
		label: "The Plan",
		content: (
			<p>
				Bake the rye on Mondays, and <a href="#finding-hours">settle the Sunday hours</a>.
			</p>
		),
	},
	{
		id: "read",
		label: "The Read",
		content: (
			<section id="finding-hours">
				<p>Three listings disagree about Sunday.</p>
			</section>
		),
	},
];

const selected = () => screen.getByRole("tab", { selected: true });

const scrollIntoView = Element.prototype.scrollIntoView;

afterEach(() => {
	window.history.replaceState(null, "", "/");
	Element.prototype.scrollIntoView = scrollIntoView;
});

describe("Tabs", () => {
	it("opens the first tab, names the list, and keeps every panel in the page", () => {
		render(<Tabs tabs={tabs} ariaLabel="Sections" />);
		expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
		expect(selected()).toHaveTextContent("The Plan");
		expect(selected()).toHaveAttribute("id", "plan-tab");
		expect(selected()).toHaveAttribute("aria-controls", "plan-panel");
		expect(document.getElementById("plan-panel")).toHaveAttribute("data-state", "active");
		const read = document.getElementById("read-panel");
		expect(read).toHaveAttribute("data-state", "inactive");
		expect(read).toHaveAttribute("aria-labelledby", "read-tab");
		expect(read).toHaveAttribute("hidden", "until-found");
		expect(read).toHaveAttribute("tabindex", "-1");
		expect(document.getElementById("plan-panel")).toHaveAttribute("tabindex", "0");
		expect(read).toContainElement(document.getElementById("finding-hours"));
	});

	it("switches on a click", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(<Tabs tabs={tabs} ariaLabel="Sections" onSelect={onSelect} />);
		await user.click(screen.getByRole("tab", { name: "The Read" }));
		expect(selected()).toHaveTextContent("The Read");
		expect(document.getElementById("read-panel")).toHaveAttribute("data-state", "active");
		expect(document.getElementById("read-panel")).not.toHaveAttribute("hidden");
		expect(document.getElementById("plan-panel")).toHaveAttribute("hidden", "until-found");
		expect(onSelect).toHaveBeenCalledWith("read");
	});

	it("moves the selection with the arrow keys", async () => {
		const user = userEvent.setup();
		render(<Tabs tabs={tabs} ariaLabel="Sections" />);
		await user.click(screen.getByRole("tab", { name: "The Plan" }));
		await user.keyboard("{ArrowRight}");
		expect(selected()).toHaveTextContent("The Read");
		expect(selected()).toHaveFocus();
		await user.keyboard("{ArrowRight}");
		expect(selected()).toHaveTextContent("The Plan");
	});

	it("opens the tab a hash names by its id, and lands on the tab row", () => {
		const scroll = vi.fn();
		Element.prototype.scrollIntoView = scroll;
		window.history.replaceState(null, "", "/#read");
		render(<Tabs tabs={tabs} ariaLabel="Sections" />);
		expect(selected()).toHaveTextContent("The Read");
		expect(scroll).toHaveBeenCalledTimes(1);
		expect(scroll.mock.contexts[0]).toBe(document.getElementById("read-tab"));
	});

	it("finds its own panels when a second list on the page shares the ids", () => {
		window.history.replaceState(null, "", "/#finding-hours");
		render(
			<>
				<Tabs tabs={tabs} ariaLabel="First" />
				<Tabs tabs={tabs} ariaLabel="Second" />
			</>,
		);
		for (const name of ["First", "Second"]) {
			const list = screen.getByRole("tablist", { name });
			const open = list.querySelector('[role="tab"][aria-selected="true"]');
			expect(open).toHaveTextContent("The Read");
		}
	});

	it("falls back to the first tab when the id it is given names none", () => {
		const { unmount } = render(<Tabs tabs={tabs} ariaLabel="Sections" defaultId="missing" />);
		expect(selected()).toHaveTextContent("The Plan");
		expect(document.getElementById("plan-panel")).not.toHaveAttribute("hidden");
		unmount();
		render(<Tabs tabs={tabs} ariaLabel="Sections" selectedId="missing" onSelect={() => {}} />);
		expect(selected()).toHaveTextContent("The Plan");
		expect(document.getElementById("plan-panel")).not.toHaveAttribute("hidden");
	});

	it("drops a landing the caller never honored once a new hash arrives", () => {
		const scroll = vi.fn();
		Element.prototype.scrollIntoView = scroll;
		const { rerender } = render(
			<>
				<p id="elsewhere">Outside the tabs.</p>
				<Tabs tabs={tabs} ariaLabel="Sections" selectedId="plan" onSelect={() => {}} />
			</>,
		);
		act(() => {
			window.history.replaceState(null, "", "/#finding-hours");
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		});
		act(() => {
			window.history.replaceState(null, "", "/#elsewhere");
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		});
		rerender(
			<>
				<p id="elsewhere">Outside the tabs.</p>
				<Tabs tabs={tabs} ariaLabel="Sections" selectedId="read" onSelect={() => {}} />
			</>,
		);
		expect(selected()).toHaveTextContent("The Read");
		expect(scroll).not.toHaveBeenCalled();
	});

	it("opens the panel holding the element a hash names on mount, and scrolls to it", () => {
		const scroll = vi.fn();
		Element.prototype.scrollIntoView = scroll;
		window.history.replaceState(null, "", "/#finding-hours");
		render(<Tabs tabs={tabs} ariaLabel="Sections" />);
		expect(selected()).toHaveTextContent("The Read");
		expect(scroll).toHaveBeenCalledTimes(1);
		expect(scroll.mock.contexts[0]).toBe(document.getElementById("finding-hours"));
	});

	it("follows a hash change, and ignores a hash that names nothing of its own", () => {
		render(
			<>
				<p id="elsewhere">Outside the tabs.</p>
				<Tabs tabs={tabs} ariaLabel="Sections" />
			</>,
		);
		act(() => {
			window.history.replaceState(null, "", "/#elsewhere");
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		});
		expect(selected()).toHaveTextContent("The Plan");
		act(() => {
			window.history.replaceState(null, "", "/#finding-hours");
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		});
		expect(selected()).toHaveTextContent("The Read");
	});

	it("opens the panel again on a click of a link to the hash already in the address bar", async () => {
		const user = userEvent.setup();
		window.history.replaceState(null, "", "/#finding-hours");
		render(<Tabs tabs={tabs} ariaLabel="Sections" />);
		await user.click(screen.getByRole("tab", { name: "The Plan" }));
		expect(selected()).toHaveTextContent("The Plan");
		await user.click(screen.getByRole("link", { name: "settle the Sunday hours" }));
		expect(selected()).toHaveTextContent("The Read");
	});

	it("opens the panel find in page revealed", () => {
		render(<Tabs tabs={tabs} ariaLabel="Sections" />);
		act(() => {
			document
				.getElementById("finding-hours")
				?.dispatchEvent(new Event("beforematch", { bubbles: true }));
		});
		expect(selected()).toHaveTextContent("The Read");
	});

	it("held by the caller, asks to change and shows what it is given", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(<Tabs tabs={tabs} ariaLabel="Sections" selectedId="plan" onSelect={onSelect} />);
		await user.click(screen.getByRole("tab", { name: "The Read" }));
		expect(onSelect).toHaveBeenCalledWith("read");
		expect(selected()).toHaveTextContent("The Plan");
	});

	it("prints each panel under its label as a heading", () => {
		render(<Tabs tabs={tabs} ariaLabel="Sections" headingLevel={3} defaultId="read" />);
		expect(selected()).toHaveTextContent("The Read");
		const plan = document.getElementById("plan-panel");
		expect(plan?.querySelector("h3.tabs-print-heading")).toHaveTextContent("The Plan");
	});
});
