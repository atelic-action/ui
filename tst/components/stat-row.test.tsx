import { render, screen } from "@testing-library/react";
import { StatRow } from "../../src/components";

describe("StatRow", () => {
	it("renders each figure over what it counts and its period", () => {
		render(<StatRow stats={[{ value: "3,948", label: "Clicks", period: "2026 Q3" }]} />);
		expect(screen.getByText("3,948")).toBeInTheDocument();
		expect(screen.getByText("2026 Q3")).toBeInTheDocument();
	});

	it("draws an arrow before a figure that is itself a change, and says which way", () => {
		render(
			<StatRow stats={[{ value: "23%", trend: "down", label: "Year over year", tone: "bad" }]} />,
		);
		expect(screen.getByLabelText("Down")).toBeInTheDocument();
		expect(screen.getByText("23%").closest(".stat")).toHaveAttribute("data-tone", "bad");
	});

	it("lists each comparison as what the figure was, a direction, a change, and what it is against", () => {
		render(
			<StatRow
				stats={[
					{
						value: "$22,086",
						label: "Spent",
						deltas: [
							{
								direction: "down",
								change: "5%",
								basis: "YoY",
								basisTitle: "year over year",
								was: "$23,244",
							},
							{ direction: "up", change: "2%", basis: "QoQ", tone: "good" },
						],
					},
				]}
			/>,
		);
		expect(screen.getByText("$23,244")).toBeInTheDocument();
		expect(screen.getByText("YoY")).toHaveAttribute("title", "year over year");
		expect(screen.getByText("2%").closest(".stat-delta-change")).toHaveAttribute(
			"data-tone",
			"good",
		);
		expect(screen.getByLabelText("Up")).toBeInTheDocument();
	});

	it("puts the label under the comparisons, closing the stat", () => {
		const { container } = render(
			<StatRow
				stats={[
					{
						value: "241",
						label: "Conversions",
						deltas: [{ direction: "up", change: "51%", basis: "YoY", was: "160" }],
					},
				]}
			/>,
		);
		const order = [...(container.querySelector(".stat")?.children ?? [])].map((el) => el.className);
		expect(order).toEqual(["num", "stat-delta", "lbl"]);
	});
});

describe("StatRow, quiet", () => {
	it("is loud unless asked, and quiet when asked", () => {
		const { container, rerender } = render(<StatRow stats={[{ value: "12", label: "On hand" }]} />);
		expect(container.querySelector(".stat-row")).not.toHaveClass("is-quiet");
		rerender(<StatRow variant="quiet" stats={[{ value: "12", label: "On hand" }]} />);
		expect(container.querySelector(".stat-row")).toHaveClass("is-quiet");
	});

	it("sets a unit beside the figure, inside the figure's line", () => {
		render(<StatRow variant="quiet" stats={[{ value: "412.6", unit: "mi", label: "Distance" }]} />);
		const unit = screen.getByText("mi");
		expect(unit).toHaveClass("stat-unit");
		expect(unit.closest(".num")).toHaveTextContent("412.6mi");
	});

	it("draws no unit when none is given", () => {
		const { container } = render(<StatRow stats={[{ value: "12", label: "On hand" }]} />);
		expect(container.querySelector(".stat-unit")).toBeNull();
	});
});
