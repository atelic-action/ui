import { render, screen, within } from "@testing-library/react";
import { ReportCard, type ReportCardGroup } from "../../src/components";

const groups: ReportCardGroup[] = [
	{
		title: "Health",
		rows: [
			{
				name: "Technical SEO",
				href: "#technical-seo",
				grade: "b",
				line: (
					<>
						Every page is in; <a href="#technical-seo">two copy each other</a>.
					</>
				),
			},
			{ name: "Core Web Vitals", href: "#core-web-vitals", line: "Not read yet." },
		],
	},
	{
		title: "Visibility",
		rows: [{ name: "Local SEO", grade: "a", before: "c", line: "First on the map." }],
	},
	{ title: "Nothing yet", rows: [] },
];

const row = (name: string) => screen.getByText(name).closest(".rc-row") as HTMLElement;

describe("ReportCard", () => {
	it("draws the title, the legend, and a row per name under its group", () => {
		const { container } = render(
			<ReportCard
				id="glance"
				title="At a Glance"
				legend={[{ grade: "a", label: "Clean" }]}
				groups={groups}
			/>,
		);
		expect(container.querySelector("#glance")).toHaveClass("report-card");
		expect(screen.getByRole("heading", { level: 2, name: "At a Glance" })).toBeInTheDocument();
		expect([...container.querySelectorAll(".rc-group")].map((g) => g.textContent)).toEqual([
			"Health",
			"Visibility",
		]);
		expect(screen.getAllByRole("heading")).toHaveLength(1);
		expect(screen.getByRole("region", { name: "At a Glance" })).toHaveClass("report-card");
		const legend = container.querySelector(".rc-legend") as HTMLElement;
		expect(within(legend).getByText("Clean")).toBeInTheDocument();
		expect(legend.querySelector(".op-grade")).toHaveAttribute("data-grade", "a");
		expect(within(row("Core Web Vitals")).getByText("Not read yet.")).toBeInTheDocument();
	});

	it("links a row with an href by its name, chevron at its end, and leaves a link in the line its own", () => {
		render(<ReportCard groups={groups} />);
		const linked = row("Technical SEO");
		expect(within(linked).getByRole("link", { name: "Technical SEO" })).toHaveAttribute(
			"href",
			"#technical-seo",
		);
		expect(linked.querySelector(".rc-go")).toHaveAttribute("aria-hidden", "true");
		expect(within(linked).getByRole("link", { name: "two copy each other" })).toHaveAttribute(
			"href",
			"#technical-seo",
		);
		const plain = row("Local SEO");
		expect(within(plain).queryByRole("link")).toBeNull();
		expect(plain.querySelector(".rc-go")).toBeNull();
	});

	it("reads the grade, the earlier grade, or not graded to a screen reader, and hides the chips", () => {
		render(<ReportCard groups={groups} />);
		const moved = row("Local SEO");
		expect(within(moved).getByText("Before: C.")).toBeInTheDocument();
		expect(within(moved).getByText("Grade A:")).toBeInTheDocument();
		expect(moved.querySelector(".rc-before .op-grade")).toHaveAttribute("data-grade", "c");
		expect(moved.querySelector(".rc-before .op-grade")?.parentElement).toHaveAttribute(
			"aria-hidden",
			"true",
		);
		const unread = row("Core Web Vitals");
		expect(within(unread).getByText("Not graded yet:")).toBeInTheDocument();
		expect(unread.querySelector(".rc-dash")).toHaveAttribute("aria-hidden", "true");
		expect(unread.querySelector(".op-grade")).toBeNull();
		expect(within(row("Technical SEO")).queryByText(/Before:/)).toBeNull();
	});

	it("takes its own words for the screen reader, and a name when it has no title", () => {
		const { container } = render(
			<ReportCard
				label="At a glance"
				labels={{ before: "June 2026", grade: "Now", notGraded: "Unread" }}
				groups={groups}
			/>,
		);
		expect(container.querySelector(".report-card")).toHaveAttribute("aria-label", "At a glance");
		expect(container.querySelector(".rc-head")).toBeNull();
		expect(within(row("Local SEO")).getByText("June 2026: C.")).toBeInTheDocument();
		expect(within(row("Local SEO")).getByText("Now A:")).toBeInTheDocument();
		expect(within(row("Core Web Vitals")).getByText("Unread:")).toBeInTheDocument();
	});

	it("sets the legend under the card when asked, leaving the head to the title", () => {
		const { container } = render(
			<ReportCard
				title="At a Glance"
				legend={[{ grade: "a", label: "Clean" }]}
				legendAt="foot"
				groups={groups}
			/>,
		);
		const head = container.querySelector(".rc-head") as HTMLElement;
		expect(head.querySelector(".rc-legend")).toBeNull();
		const foot = container.querySelector(".rc-legend-foot") as HTMLElement;
		expect(foot.previousElementSibling).toHaveClass("rc-card");
		expect(within(foot).getByText("Clean")).toBeInTheDocument();
	});

	it("keeps a default word when its override is left undefined", () => {
		render(<ReportCard labels={{ before: undefined, grade: "Now" }} groups={groups} />);
		expect(within(row("Local SEO")).getByText("Before: C.")).toBeInTheDocument();
		expect(within(row("Local SEO")).getByText("Now A:")).toBeInTheDocument();
	});
});
