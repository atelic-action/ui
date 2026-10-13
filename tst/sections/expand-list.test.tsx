import { fireEvent, render, screen } from "@testing-library/react";
import { ExpandList } from "../../src/sections/ExpandList";

const items = [
	{ title: "Hot Packs", body: <p>Moist heat that primes the muscle.</p> },
	{ title: "Cupping", body: <p>Pulls the tissue apart to release knots.</p> },
];

describe("ExpandList", () => {
	it("renders a numbered mono index per row, zero-padded", () => {
		render(<ExpandList items={items} />);
		expect(screen.getByText("01")).toBeInTheDocument();
		expect(screen.getByText("02")).toBeInTheDocument();
	});

	it("keeps every body in the static HTML while visually collapsed", () => {
		render(<ExpandList items={items} />);
		// Collapsed rows hide via max-height, not unmounting — crawlers see the copy.
		expect(screen.getByText("Moist heat that primes the muscle.")).toBeInTheDocument();
		expect(screen.getByText("Pulls the tissue apart to release knots.")).toBeInTheDocument();
		for (const button of screen.getAllByRole("button")) {
			expect(button).toHaveAttribute("aria-expanded", "false");
		}
	});

	it("expands and collapses a row independently on toggle", () => {
		render(<ExpandList items={items} />);
		const [first, second] = screen.getAllByRole("button");
		fireEvent.click(first);
		expect(first).toHaveAttribute("aria-expanded", "true");
		expect(second).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(first);
		expect(first).toHaveAttribute("aria-expanded", "false");
	});
});
