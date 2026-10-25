import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable, Hint } from "../../src/components";

describe("Hint", () => {
	it("names its button, describes it with the bubble, and starts closed", () => {
		const { container } = render(
			<Hint label="About first paint">The first moment anything appears.</Hint>,
		);
		const button = screen.getByRole("button", { name: "About first paint" });
		const bubble = screen.getByRole("tooltip");
		expect(button).toHaveAttribute("aria-describedby", bubble.id);
		expect(button).toHaveAttribute("aria-expanded", "false");
		expect(container.querySelector(".hint")).not.toHaveAttribute("data-open");
	});

	it("opens on a click and stays open, then closes on Escape", () => {
		const { container } = render(
			<Hint label="About first paint">The first moment anything appears.</Hint>,
		);
		const root = container.querySelector(".hint") as HTMLElement;
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(root).toHaveAttribute("data-open");
		expect(button).toHaveAttribute("aria-expanded", "true");
		fireEvent.pointerOut(root, { pointerType: "mouse" });
		expect(root).toHaveAttribute("data-open");
		fireEvent.keyDown(document, { key: "Escape" });
		expect(root).not.toHaveAttribute("data-open");
	});

	it("opens on a mouse hover and closes when the mouse leaves, and a finger never hovers", () => {
		const { container } = render(
			<Hint label="About first paint">The first moment anything appears.</Hint>,
		);
		const root = container.querySelector(".hint") as HTMLElement;
		fireEvent.pointerOver(root, { pointerType: "mouse" });
		expect(root).toHaveAttribute("data-open");
		fireEvent.pointerOut(root, { pointerType: "mouse" });
		expect(root).not.toHaveAttribute("data-open");
		const touch = new Event("pointerover", { bubbles: true });
		Object.defineProperty(touch, "pointerType", { value: "touch" });
		root.dispatchEvent(touch);
		expect(root).not.toHaveAttribute("data-open");
	});

	it("closes on a tap elsewhere and a second click", () => {
		const { container } = render(
			<>
				<p>Elsewhere</p>
				<Hint label="About first paint">The first moment anything appears.</Hint>
			</>,
		);
		const root = container.querySelector(".hint") as HTMLElement;
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(root).toHaveAttribute("data-open");
		fireEvent.pointerDown(screen.getByText("Elsewhere"));
		expect(root).not.toHaveAttribute("data-open");
		fireEvent.click(button);
		fireEvent.click(button);
		expect(root).not.toHaveAttribute("data-open");
	});

	it("keeps a keyboard focused bubble open through a mouse leave, and closes it on blur", () => {
		const { container } = render(
			<Hint label="About first paint">The first moment anything appears.</Hint>,
		);
		const root = container.querySelector(".hint") as HTMLElement;
		const button = screen.getByRole("button");
		fireEvent.focus(button);
		expect(root).toHaveAttribute("data-open");
		fireEvent.pointerOut(root, { pointerType: "mouse" });
		expect(root).toHaveAttribute("data-open");
		fireEvent.blur(button);
		expect(root).not.toHaveAttribute("data-open");
	});

	it("lets a hover close again after a click has unpinned it, since a click's focus is not the keyboard's", () => {
		const { container } = render(
			<Hint label="About first paint">The first moment anything appears.</Hint>,
		);
		const root = container.querySelector(".hint") as HTMLElement;
		const button = screen.getByRole("button");
		fireEvent.pointerOver(root, { pointerType: "mouse" });
		fireEvent.pointerDown(button);
		fireEvent.focus(button);
		fireEvent.click(button);
		fireEvent.click(button);
		expect(root).not.toHaveAttribute("data-open");
		fireEvent.pointerOver(root, { pointerType: "mouse" });
		expect(root).toHaveAttribute("data-open");
		fireEvent.pointerOut(root, { pointerType: "mouse" });
		expect(root).not.toHaveAttribute("data-open");
	});

	it("stays pinned when focus moves into the bubble", () => {
		const { container } = render(
			<Hint label="About first paint">
				See <a href="https://example.com/">the line</a>.
			</Hint>,
		);
		const root = container.querySelector(".hint") as HTMLElement;
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(root).toHaveAttribute("data-open");
		fireEvent.blur(button, { relatedTarget: screen.getByRole("link") });
		expect(root).toHaveAttribute("data-open");
		fireEvent.blur(button, { relatedTarget: null });
		expect(root).not.toHaveAttribute("data-open");
	});

	it("records which side of its word the icon sits on", () => {
		const { container } = render(
			<Hint label="About layout shift" side="before">
				How much the page jumps.
			</Hint>,
		);
		expect(container.querySelector(".hint")).toHaveAttribute("data-side", "before");
	});

	it("sits after a table heading, and before one that is right aligned", () => {
		render(
			<DataTable
				columns={[
					{ label: "Page", hint: "Which page was read." },
					{ label: "First paint", align: "right", hint: "The first moment anything appears." },
				]}
				rows={[{ cells: ["Home", "2.3 s"] }]}
			/>,
		);
		const [page, paint] = screen.getAllByRole("columnheader");
		expect(screen.getByRole("button", { name: "About Page" })).toBeInTheDocument();
		expect(page?.firstChild?.textContent).toBe("Page");
		expect(paint?.querySelector(".hint")).toHaveAttribute("data-side", "before");
		expect(paint?.firstElementChild).toHaveClass("hint");
	});
});
