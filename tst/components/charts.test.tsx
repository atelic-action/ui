import { render, screen } from "@testing-library/react";
import { ColumnChart, StackedBar, ThresholdScale } from "../../src/components";

describe("StackedBar", () => {
	it("draws a part for every figure above zero and keys every part", () => {
		const { container } = render(
			<StackedBar
				segments={[
					{ label: "on Google", value: 1158, tone: "good" },
					{ label: "thin pages", value: 130, tone: "warn" },
					{ label: "none", value: 0, tone: "muted" },
				]}
			/>,
		);
		expect(container.querySelectorAll(".stacked-bar-track span")).toHaveLength(2);
		expect(screen.getByText("1,158")).toBeInTheDocument();
		expect(screen.getByRole("img")).toHaveAccessibleName(
			"on Google: 1,158, thin pages: 130, none: 0",
		);
	});
});

describe("ColumnChart", () => {
	const groups = [
		{
			label: "2026 Q2",
			total: "4,864",
			bars: [
				{ label: "Apr", value: 1686 },
				{ label: "May", value: 1656 },
			],
		},
		{
			label: "2026 Q3",
			total: "3,948",
			tone: "info" as const,
			bars: [{ label: "Jul", value: 843, display: "0.8k" }],
		},
	];

	it("scales every bar to the tallest and labels each group with its total", () => {
		const { container } = render(<ColumnChart groups={groups} height={100} />);
		const bars = [...container.querySelectorAll<HTMLElement>(".column-chart-bar")];
		expect(bars.map((bar) => bar.style.height)).toEqual(["100px", "98px", "50px"]);
		expect(screen.getByText("3,948")).toBeInTheDocument();
		expect(screen.getByText("0.8k")).toBeInTheDocument();
	});

	it("gives a bar its group's tone unless it sets its own", () => {
		const { container } = render(<ColumnChart groups={groups} />);
		const cols = [...container.querySelectorAll(".column-chart-col")];
		expect(cols.map((col) => col.getAttribute("data-tone"))).toEqual(["muted", "muted", "info"]);
	});
});

describe("ThresholdScale", () => {
	it("sizes the zones to the scale and pins each reading where it falls", () => {
		const { container } = render(
			<ThresholdScale
				max={8}
				zones={[
					{ label: "Good", upTo: 2, tone: "good" },
					{ label: "Poor", tone: "bad" },
				]}
				readings={[{ label: "Phone", value: 6, display: "6 s", tone: "bad" }]}
			/>,
		);
		const zones = [...container.querySelectorAll<HTMLElement>(".threshold-scale-zone")];
		expect(zones.map((zone) => zone.style.width)).toEqual(["25%", "75%"]);
		expect(container.querySelector<HTMLElement>(".threshold-scale-pin")?.style.left).toBe("75%");
		expect(screen.getByRole("img")).toHaveAccessibleName("Phone: 6 s");
	});
});
