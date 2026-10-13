import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type ComparisonRow, ComparisonTable } from "../../src/sections/ComparisonTable";

const rows: ComparisonRow[] = [
	{
		id: "moved",
		stage: "Found in search",
		before: { grade: "D", points: ["Was bad"] },
		after: { grade: "A", points: ["Is good"] },
	},
	{
		id: "held",
		stage: "Booking",
		before: { grade: "B", points: ["Was fine"] },
		after: { grade: "B", points: ["Still fine"] },
	},
	{
		id: "ungraded",
		stage: "Performance",
		before: { grade: "not measured", points: ["Nobody looked"] },
		after: { grade: "A", points: ["99 on desktop", "Measured at launch"] },
	},
];

describe("ComparisonTable", () => {
	it("renders a row per graded item with both sides", () => {
		render(<ComparisonTable rows={rows} />);
		expect(screen.getByText("Found in search")).toBeInTheDocument();
		expect(screen.getByText("Was bad")).toBeInTheDocument();
		expect(screen.getByText("Is good")).toBeInTheDocument();
	});

	/*
	 * The whole point of the last column: a reader scans it for color and
	 * finds every change without reading a word. A grade that held must not
	 * light up, or the signal is worthless.
	 */
	it("highlights an after grade only when it moved", () => {
		const { container } = render(<ComparisonTable rows={rows} />);
		const moved = container.querySelectorAll(".cmp-grade.is-moved");
		expect(moved).toHaveLength(2); // Found in search D to A, Performance to A
		for (const node of moved) {
			expect(node.textContent).toBe("A");
		}
	});

	/*
	 * A multi character grade is an ungraded state ("not measured"), and must
	 * never be styled as a letter it did not earn.
	 */
	it("renders a non letter grade as a note rather than a letter", () => {
		const { container } = render(<ComparisonTable rows={rows} />);
		const note = container.querySelector(".cmp-grade.is-note");
		expect(note?.textContent).toBe("not measured");
	});

	it("renders a single point as prose and several as a list", () => {
		const { container } = render(<ComparisonTable rows={rows} />);
		// Three of the six cells carry one point each; only the last has two.
		expect(container.querySelectorAll(".cmp-points ul")).toHaveLength(1);
		expect(container.querySelectorAll(".cmp-points li")).toHaveLength(2);
	});
});
