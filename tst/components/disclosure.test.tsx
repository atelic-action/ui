import { fireEvent, render, screen } from "@testing-library/react";
import { Disclosure } from "../../src/components";

describe("Disclosure", () => {
	it("names the toggle by its label alone, with the meta beside it and out of the name", () => {
		render(
			<Disclosure label="Produce" meta="10" open={false} onToggle={() => {}} headingLevel={2}>
				<p>Apples</p>
			</Disclosure>,
		);
		const toggle = screen.getByRole("button", { name: "Produce" });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(screen.getByRole("heading", { level: 2, name: "Produce" })).toBeInTheDocument();
		expect(screen.getByText("10")).toHaveClass("disclosure-meta");
	});

	it("renders no body while closed, and the body under the toggle's panel id while open", () => {
		const { rerender, container } = render(
			<Disclosure label="Produce" open={false} onToggle={() => {}}>
				<p>Apples</p>
			</Disclosure>,
		);
		expect(screen.queryByText("Apples")).not.toBeInTheDocument();
		expect(container.querySelector(".disclosure")).not.toHaveClass("is-open");

		rerender(
			<Disclosure label="Produce" open onToggle={() => {}}>
				<p>Apples</p>
			</Disclosure>,
		);
		const toggle = screen.getByRole("button", { name: "Produce" });
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		const panel = screen.getByText("Apples").closest(".disclosure-body");
		expect(panel).toHaveAttribute("id", toggle.getAttribute("aria-controls"));
		expect(container.querySelector(".disclosure")).toHaveClass("is-open");
	});

	it("asks the caller to toggle and holds no state of its own", () => {
		const onToggle = vi.fn();
		render(
			<Disclosure label="Produce" open={false} onToggle={onToggle}>
				<p>Apples</p>
			</Disclosure>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Produce" }));
		expect(onToggle).toHaveBeenCalledTimes(1);
		expect(screen.queryByText("Apples")).not.toBeInTheDocument();
	});

	it("takes a panel id, and is a plain block with no heading when no level is given", () => {
		const { container } = render(
			<Disclosure label="Produce" open onToggle={() => {}} panelId="aisle-produce">
				<p>Apples</p>
			</Disclosure>,
		);
		expect(screen.getByRole("button")).toHaveAttribute("aria-controls", "aisle-produce");
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		expect(container.querySelector("section")).toBeNull();
	});
});
