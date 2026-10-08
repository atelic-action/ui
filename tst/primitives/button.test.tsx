import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "../../src/primitives";

describe("Button", () => {
	it("renders an anchor when href is given", () => {
		render(<Button href="/services">See services</Button>);
		const link = screen.getByRole("link", { name: "See services" });
		expect(link).toHaveAttribute("href", "/services");
		expect(link).toHaveClass("btn", "btn-primary");
	});

	it("renders a real button and fires onClick when no href is given", () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Submit</Button>);
		const button = screen.getByRole("button", { name: "Submit" });
		expect(button).toHaveAttribute("type", "button");
		fireEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("composes variant, size, on-dark, and custom classes", () => {
		render(
			<Button variant="ghost" size="lg" onDark className="extra" href="/x">
				Ghost
			</Button>,
		);
		expect(screen.getByRole("link", { name: "Ghost" })).toHaveClass(
			"btn",
			"btn-ghost",
			"btn-lg",
			"on-dark",
			"extra",
		);
	});

	it("adds new-tab attributes only when newTab is set", () => {
		render(
			<>
				<Button href="https://example.com" newTab>
					External
				</Button>
				<Button href="/about">Internal</Button>
			</>,
		);
		const external = screen.getByRole("link", { name: "External" });
		expect(external).toHaveAttribute("target", "_blank");
		expect(external).toHaveAttribute("rel", "noopener");
		const internal = screen.getByRole("link", { name: "Internal" });
		expect(internal).not.toHaveAttribute("target");
		expect(internal).not.toHaveAttribute("rel");
	});

	it("never opens protocol links in a new tab, even when asked", () => {
		render(
			<>
				<Button href="mailto:owner@example.com" newTab>
					Email
				</Button>
				<Button href="tel:+13035551234" newTab>
					Call
				</Button>
			</>,
		);
		for (const name of ["Email", "Call"]) {
			const link = screen.getByRole("link", { name });
			expect(link).not.toHaveAttribute("target");
			expect(link).not.toHaveAttribute("rel");
		}
	});

	it("appends the arrow glyph when arrow is set", () => {
		render(
			<Button href="/book" arrow>
				Book
			</Button>,
		);
		const arrow = screen.getByRole("link", { name: /Book/ }).querySelector(".arrow");
		expect(arrow).not.toBeNull();
		expect(arrow).toHaveTextContent("→");
	});
});
