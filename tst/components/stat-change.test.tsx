import { render, screen } from "@testing-library/react";
import { StatRow } from "../../src/components";

/*
 * The figure shape a case study record uses: the current reading big, a share's
 * denominator small after it, and the change small to the right with a
 * triangle for its direction. The earlier figure is not shown.
 */
describe("StatRow: outOf and change", () => {
	it("sets a share's denominator small after the figure", () => {
		const { container } = render(
			<StatRow stats={[{ value: "6", outOf: "7", label: "Grades at A or B" }]} />,
		);
		expect(container.querySelector(".stat-out-of")?.textContent).toBe("/7");
		expect(container.querySelector(".num")?.textContent).toBe("6/7");
	});

	it("sets the change beside the figure with a triangle that says which way", () => {
		const { container } = render(
			<StatRow
				stats={[{ value: "100", change: { direction: "up", text: "+26" }, label: "Lighthouse" }]}
			/>,
		);
		const change = container.querySelector(".stat-change");
		expect(change?.textContent).toBe("+26");
		expect(change).not.toHaveClass("is-down");
		expect(change).toHaveAttribute("data-tone", "good");
		expect(screen.getByRole("img", { name: "Up" })).toBeInTheDocument();
	});

	it("turns the triangle over for a fall and keeps the tone the caller gives", () => {
		const { container } = render(
			<StatRow
				stats={[
					{
						value: "0.9",
						unit: "s",
						change: { direction: "down", text: "3.8 s", tone: "good" },
						label: "Main content",
					},
				]}
			/>,
		);
		const change = container.querySelector(".stat-change");
		expect(change).toHaveClass("is-down");
		expect(screen.getByRole("img", { name: "Down" })).toBeInTheDocument();
	});
});
