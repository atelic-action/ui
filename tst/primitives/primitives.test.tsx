import { render, screen } from "@testing-library/react";
import { Button, Chip, Eyebrow, Lead, SectionHeading } from "../../src/primitives";

describe("Button, the arrow", () => {
	it("keeps the arrow out of the name a screen reader hears", () => {
		render(
			<Button href="/services" arrow>
				See services
			</Button>,
		);
		expect(screen.getByRole("link", { name: "See services" })).toBeInTheDocument();
	});
});

describe("Chip", () => {
	it("is a span by default and an anchor when given an href", () => {
		const { rerender } = render(<Chip>Denver</Chip>);
		expect(screen.getByText("Denver").tagName).toBe("SPAN");
		rerender(<Chip href="#areas">Denver</Chip>);
		expect(screen.getByRole("link", { name: "Denver" })).toHaveAttribute("href", "#areas");
	});

	it("takes a dot and the dark surface form", () => {
		const { container } = render(
			<Chip dot onDark>
				Licensed
			</Chip>,
		);
		expect(container.querySelector(".chip")).toHaveClass("on-dark");
		expect(container.querySelector(".chip .dot")).not.toBeNull();
	});
});

describe("Eyebrow and Lead", () => {
	it("composes the eyebrow's surface and alignment classes", () => {
		render(
			<Eyebrow onDark center>
				Services
			</Eyebrow>,
		);
		expect(screen.getByText("Services")).toHaveClass("eyebrow", "on-dark", "center");
	});

	it("renders the lead as a paragraph with any extra class", () => {
		render(<Lead className="wide">A short introduction.</Lead>);
		const lead = screen.getByText("A short introduction.");
		expect(lead.tagName).toBe("P");
		expect(lead).toHaveClass("lead", "wide");
	});
});

describe("SectionHeading", () => {
	it("opens a section with an eyebrow, a heading at the level asked, and a lead", () => {
		render(<SectionHeading eyebrow="Pricing" title="One number" lead="Flat and posted." as="h3" />);
		expect(screen.getByText("Pricing")).toHaveClass("eyebrow");
		expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("One number");
		expect(screen.getByText("Flat and posted.")).toHaveClass("lead", "section-head-lead");
	});

	it("defaults to an h2 and leaves the eyebrow and lead out when not given", () => {
		const { container } = render(<SectionHeading title="Just a title" />);
		expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
		expect(container.querySelector(".eyebrow")).toBeNull();
		expect(container.querySelector(".lead")).toBeNull();
	});
});
