import { render, screen, within } from "@testing-library/react";
import { Report, type ReportProps } from "../../src/artifact/Report";

const lead = (figure: string) => ({ figure, sentence: `What ${figure} means.` });

const props: ReportProps = {
	title: "A Business in September",
	period: "September 2026",
	leads: {
		// Listed out of order on purpose: the page answers the questions in its own order.
		closed: lead("12 first visits"),
		cost: lead("$1,240"),
		fromWhere: lead("18 from the map"),
		cameIn: lead("31 leads"),
	},
	grades: [
		{
			tier: "Health",
			section: "Technical SEO",
			now: "a",
			lastMonth: "b",
			baseline: "d",
			moved: "The dead page is gone.",
		},
		{ tier: "Health", section: "Core Web Vitals", now: "c", moved: "First month read." },
	],
	close: {
		signOff: "Yours,",
		person: {
			photoSrc: "/images/profile.jpg",
			photoAlt: "A person",
			name: "A Person",
			role: "Founder",
			mailHref: "mailto:a@example.com",
			mailLabel: "a@example.com",
		},
	},
};

describe("Report", () => {
	it("opens on the title and the period", () => {
		render(<Report {...props} />);
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(props.title);
		expect(screen.getByText("September 2026")).toBeInTheDocument();
	});

	it("answers the four questions in order, each with its figure and one sentence", () => {
		const { container } = render(<Report {...props} />);
		const questions = Array.from(container.querySelectorAll(".rp-lead"), (section) => ({
			q: section.querySelector("h2")?.textContent,
			figure: section.querySelector(".rp-figure")?.textContent,
			sentence: section.querySelector("p")?.textContent,
		}));
		expect(questions).toEqual([
			{ q: "What Came In", figure: "31 leads", sentence: "What 31 leads means." },
			{ q: "From Where", figure: "18 from the map", sentence: "What 18 from the map means." },
			{ q: "What It Cost", figure: "$1,240", sentence: "What $1,240 means." },
			{ q: "What It Closed", figure: "12 first visits", sentence: "What 12 first visits means." },
		]);
	});

	it("tables each grade now, last month, and at baseline, with what moved", () => {
		render(<Report {...props} />);
		const table = screen.getByRole("table");
		const headers = within(table)
			.getAllByRole("columnheader")
			.map((th) => th.textContent);
		expect(headers).toEqual(["Tier", "Section", "Now", "Last Month", "Baseline", "What Moved"]);

		const [, moved, firstMonth] = within(table).getAllByRole("row");
		const letters = (row: HTMLElement) =>
			Array.from(row.querySelectorAll("td"), (td) => td.querySelector(".op-grade")?.textContent);
		expect(letters(moved)).toEqual([undefined, undefined, "A", "B", "D", undefined]);
		expect(moved).toHaveTextContent("The dead page is gone.");
		// The first month has nothing earlier to show, and says so by leaving it empty.
		expect(letters(firstMonth)).toEqual([
			undefined,
			undefined,
			"C",
			undefined,
			undefined,
			undefined,
		]);
	});

	it("names each tier once, on the first of its rows", () => {
		const { container } = render(<Report {...props} />);
		const tiers = Array.from(container.querySelectorAll(".rp-tier"), (td) => td.textContent);
		expect(tiers).toEqual(["Health", ""]);
	});

	it("closes on the shared sign off", () => {
		const { container } = render(<Report {...props} />);
		const close = container.querySelector(".rp-close");
		expect(close?.querySelector(".op-sign")).toHaveTextContent("Yours,");
		expect(close).toHaveTextContent("A Person");
	});
});
