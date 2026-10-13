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

	/*
	 * A closed body is clipped to nothing but stays in the HTML, so a link
	 * inside it was still reached by Tab. Inert takes it out of the tab order
	 * and the accessibility tree until the row opens.
	 */
	it("makes a closed body unfocusable, and an open one reachable", () => {
		const { container } = render(
			<ExpandList
				items={[{ title: "Parking", body: <a href="/directions">Directions to the lot</a> }]}
			/>,
		);
		const body = container.querySelector(".xl-body");
		expect(body).toHaveAttribute("inert");
		fireEvent.click(screen.getByRole("button", { name: /Parking/ }));
		expect(body).not.toHaveAttribute("inert");
		fireEvent.click(screen.getByRole("button", { name: /Parking/ }));
		expect(body).toHaveAttribute("inert");
	});
});
