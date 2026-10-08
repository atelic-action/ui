import { render, screen, within } from "@testing-library/react";
import {
	ratingCell,
	Writeup,
	type WriteupBlock,
	type WriteupGrade,
	type WriteupProps,
	type WriteupSummaryRow,
	type WriteupTopic,
	type WriteupTopicBlock,
} from "../../src/artifact/Writeup";

const person = {
	photoSrc: "/images/profile.jpg",
	photoAlt: "A person",
	name: "A Person",
	role: "Founder",
	mailHref: "mailto:a@example.com",
	mailLabel: "a@example.com",
};

function sheetWith(...blocks: WriteupBlock[]): WriteupProps {
	return {
		sender: { name: "sender" },
		recipient: { logoSrc: "/logo.svg", logoAlt: "Recipient" },
		preparedFor: "An Owner",
		date: "January 1, 2026",
		title: "A Look Online",
		sheets: [{ id: "sheet-1", blocks }],
		close: { signOff: "Yours,", person },
	};
}

const base: WriteupTopic = {
	kind: "topic",
	id: "topic",
	title: "Core Web Vitals",
	oneLiner: "Whether the site loads fast on a phone.",
	bullets: [{ lead: "A full sentence.", body: "Why it matters." }],
};

/** A topic carrying only the given blocks and no picture. */
function topicWith(...blocks: WriteupTopicBlock[]): WriteupTopic {
	return { kind: "topic", id: "topic", title: "Local SEO", oneLiner: "The map.", blocks };
}

/** The section element a topic or a part renders under its anchor. */
function section(container: HTMLElement, id: string): HTMLElement {
	const found = container.querySelector<HTMLElement>(`#${id}`);
	if (!found) throw new Error(`No element with id ${id}`);
	return found;
}

/** The overview row that names a section. */
function overviewRow(name: string): HTMLElement {
	return screen.getByText(name).closest("li") as HTMLElement;
}

describe("Writeup topic", () => {
	it("renders the brief as a placeholder while a screen is still owed", () => {
		const { container } = render(
			<Writeup {...sheetWith({ ...base, shotBrief: "Screenshot: the panel" })} />,
		);
		const brief = screen.getByText("Screenshot: the panel");
		expect(section(container, "topic")).toContainElement(brief);
		expect(brief.closest("figure")).not.toBeNull();
	});

	it("keeps a placeholder when a shot is simply missing, so a forgotten screen stays visible", () => {
		const { container } = render(<Writeup {...sheetWith(base)} />);
		expect(within(section(container, "topic")).getByText("Screenshot")).toBeInTheDocument();
	});

	it("renders no figure at all for a topic that carries no picture by design", () => {
		const { container } = render(<Writeup {...sheetWith({ ...base, noShot: true })} />);
		const topic = section(container, "topic");
		expect(within(topic).queryByRole("figure")).toBeNull();
		expect(within(topic).queryByText("Screenshot")).toBeNull();
		expect(screen.getByText("A full sentence.")).toBeInTheDocument();
	});

	it("links its title to where the term is defined, in a new tab", () => {
		render(<Writeup {...sheetWith({ ...base, href: "https://example.com/cwv", noShot: true })} />);
		const heading = screen.getByRole("heading", { level: 3, name: /Core Web Vitals/ });
		const link = within(heading).getByRole("link", { name: /Core Web Vitals/ });
		expect(link).toHaveAttribute("href", "https://example.com/cwv");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
	});

	it("renders a plain title when it has no definition to link", () => {
		render(<Writeup {...sheetWith({ ...base, noShot: true })} />);
		const heading = screen.getByRole("heading", { level: 3, name: "Core Web Vitals" });
		expect(within(heading).queryByRole("link")).toBeNull();
		expect(screen.getByText("Whether the site loads fast on a phone.")).toBeInTheDocument();
	});

	it("lists its sources, linking each one that has an address and leaving the rest plain", () => {
		const { container } = render(
			<Writeup
				{...sheetWith({
					...base,
					noShot: true,
					sourcesLabel: "Where this comes from",
					sources: [
						{ label: "Search Console", href: "https://search.google.com/search-console" },
						{ label: "A phone in hand" },
					],
				})}
			/>,
		);
		const topic = section(container, "topic");
		expect(within(topic).getByText("Where this comes from")).toBeInTheDocument();
		const link = within(topic).getByRole("link", { name: "Search Console" });
		expect(link).toHaveAttribute("href", "https://search.google.com/search-console");
		expect(link).toHaveAttribute("target", "_blank");
		expect(within(topic).getByText("A phone in hand")).toBeInTheDocument();
		expect(within(topic).queryByRole("link", { name: "A phone in hand" })).toBeNull();
	});

	it("labels its sources Sources when the content names no label", () => {
		render(
			<Writeup {...sheetWith({ ...base, noShot: true, sources: [{ label: "PageSpeed" }] })} />,
		);
		expect(screen.getByText("Sources")).toBeInTheDocument();
	});
});

describe("Writeup topic, a second screen", () => {
	const shot = {
		src: "/images/one.png",
		alt: "The first screen",
		href: "/images/one-full.png",
		caption: "The first claim",
	};
	const shot2 = { src: "/images/two.png", alt: "The second screen", caption: "The second claim" };

	it("stacks a second figure, with its own caption, under the first", () => {
		const { container } = render(<Writeup {...sheetWith({ ...base, shot, shot2 })} />);
		const figures = within(section(container, "topic")).getAllByRole("figure");
		expect(figures).toHaveLength(2);
		expect(figures.map((f) => f.querySelector("figcaption")?.textContent)).toEqual([
			"The first claim",
			"The second claim",
		]);
		// The first opens its full screenshot; the second has none, so it renders alone.
		expect(within(figures[0]).getByRole("link")).toHaveAttribute("href", "/images/one-full.png");
		expect(within(figures[1]).queryByRole("link")).toBeNull();
		expect(within(figures[1]).getByRole("img", { name: "The second screen" })).toBeInTheDocument();
	});

	it("renders one figure when there is no second screen, and none past a brief", () => {
		const one = render(<Writeup {...sheetWith({ ...base, shot })} />);
		expect(within(section(one.container, "topic")).getAllByRole("figure")).toHaveLength(1);
		one.unmount();
		const brief = render(
			<Writeup {...sheetWith({ ...base, shotBrief: "Screenshot: owed", shot2 })} />,
		);
		const figures = within(section(brief.container, "topic")).getAllByRole("figure");
		expect(figures).toHaveLength(1);
		expect(figures[0]).toHaveTextContent("Screenshot: owed");
	});
});

describe("Writeup rented line", () => {
	it("states paid's facts on one labeled line and never grades them", () => {
		const { container } = render(
			<Writeup
				{...sheetWith(
					{ ...base, id: "geo", title: "GEO", grade: "b", noShot: true },
					{ kind: "rented", text: "Ads run on three of your five money searches." },
				)}
			/>,
		);
		const line = screen.getByText("Ads run on three of your five money searches.")
			.parentElement as HTMLElement;
		expect(within(line).getByText("Rented")).toBeInTheDocument();
		expect(within(line).queryByText(/^[A-D]$/)).toBeNull();
		expect(section(container, "geo").compareDocumentPosition(line)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
	});
});

describe("Writeup overview", () => {
	const rows: WriteupSummaryRow[] = [
		{ tier: "Health", section: "Technical SEO", grade: "a", read: "Clean." },
		{ tier: "Health", section: "Core Web Vitals", grade: "c", read: "Slow on a phone." },
		{ tier: "Visibility", section: "Local SEO", grade: "b", read: "In one pack." },
	];

	it("shows every section with its grade and read, grouped under one label per tier", () => {
		render(<Writeup {...sheetWith({ kind: "summary", title: "At a Glance", rows })} />);
		expect(screen.getByRole("heading", { level: 2, name: "At a Glance" })).toBeInTheDocument();
		expect(screen.getAllByText("Health")).toHaveLength(1);
		expect(screen.getAllByText("Visibility")).toHaveLength(1);
		for (const row of rows) {
			const li = overviewRow(row.section);
			expect(within(li).getByText(row.read as string)).toBeInTheDocument();
			expect(within(li).getByText(row.grade.toUpperCase())).toBeInTheDocument();
		}
		// A first writeup carries no earlier letter.
		expect(screen.queryByText(/Before:/)).toBeNull();
	});

	it("names the letter in each row for a screen reader", () => {
		render(
			<Writeup
				{...sheetWith({
					kind: "summary",
					rows: [{ tier: "Visibility", section: "GEO", grade: "d", read: "Shut out." }],
				})}
			/>,
		);
		expect(within(overviewRow("GEO")).getByText("Grade D:")).toBeInTheDocument();
	});

	it("shows the earlier letter beside the current one, named Before for a screen reader", () => {
		render(
			<Writeup
				{...sheetWith({
					kind: "summary",
					rows: [{ ...rows[0], before: "c" }, rows[2]],
				})}
			/>,
		);
		const moved = overviewRow("Technical SEO");
		// The chips are hidden from a screen reader, which hears the label and the letter instead.
		expect(within(moved).getByText("Before: C.")).toBeInTheDocument();
		// The earlier letter comes first, then the current one.
		expect(
			within(moved)
				.getAllByText(/^[A-D]$/)
				.map((chip) => chip.textContent),
		).toEqual(["C", "A"]);
		const unmoved = overviewRow("Local SEO");
		expect(within(unmoved).queryByText(/Before:/)).toBeNull();
		expect(within(unmoved).getAllByText(/^[A-D]$/)).toHaveLength(1);
	});

	it("names the earlier letter by the label the content gives it", () => {
		render(
			<Writeup
				{...sheetWith({
					kind: "summary",
					beforeLabel: "June 2026",
					rows: [{ ...rows[0], before: "b" }],
				})}
			/>,
		);
		const row = overviewRow("Technical SEO");
		expect(within(row).getByText("June 2026: B.")).toBeInTheDocument();
		expect(within(row).queryByText(/Before:/)).toBeNull();
	});

	it("links a row to its section when it has an anchor, and leaves it plain when not", () => {
		render(
			<Writeup
				{...sheetWith({
					kind: "summary",
					rows: [{ ...rows[0], href: "#technical-seo" }, rows[2]],
				})}
			/>,
		);
		expect(screen.getByRole("link", { name: "Technical SEO" })).toHaveAttribute(
			"href",
			"#technical-seo",
		);
		expect(screen.getByText("Local SEO")).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Local SEO" })).toBeNull();
	});

	it("renders the legend, each letter beside what it means, only when given", () => {
		const without = render(<Writeup {...sheetWith({ kind: "summary", rows })} />);
		expect(without.queryByText("Working well")).toBeNull();
		without.unmount();
		render(
			<Writeup
				{...sheetWith({
					kind: "summary",
					rows,
					legend: [
						{ grade: "a", label: "Working well" },
						{ grade: "d", label: "Broken" },
					],
				})}
			/>,
		);
		const strong = screen.getByText("Working well").closest("li") as HTMLElement;
		expect(within(strong).getByText("A")).toBeInTheDocument();
		const broken = screen.getByText("Broken").closest("li") as HTMLElement;
		expect(within(broken).getByText("D")).toBeInTheDocument();
	});
});

const FOUR: WriteupGrade[] = ["a", "b", "c", "d"];

describe("Writeup grades", () => {
	it("prints all four letters, A to D, beside the section and in the overview", () => {
		const summary: WriteupBlock = {
			kind: "summary",
			rows: FOUR.map((grade) => ({
				tier: "Health",
				section: `Section ${grade}`,
				grade,
				read: `The read behind ${grade}.`,
			})),
		};
		const topics = FOUR.map((grade) => ({ ...base, id: `topic-${grade}`, grade, noShot: true }));
		const { container } = render(<Writeup {...sheetWith(summary, ...topics)} />);
		for (const grade of FOUR) {
			const letter = grade.toUpperCase();
			expect(screen.getAllByText(letter)).toHaveLength(2);
			expect(within(overviewRow(`Section ${grade}`)).getByText(letter)).toBeInTheDocument();
			expect(within(section(container, `topic-${grade}`)).getByText(letter)).toBeInTheDocument();
		}
	});
});

describe("Writeup markets table", () => {
	const markets: WriteupBlock = {
		kind: "markets",
		title: "Market by Market",
		lead: "Each market read on its own.",
		columns: ["Search", "Map", "AI"],
		rows: [
			{
				market: "Austin",
				place: "Cedar Park, TX",
				grades: ["a", "c", null],
				read: "First on the map in Cedar Park, nowhere in Austin proper.",
			},
			{ market: "Dallas", grades: ["b", "b", "d"], read: "Steady on search and the map." },
		],
	};

	function marketRow(name: string): HTMLElement {
		return screen.getByRole("rowheader", { name: new RegExp(name) }).closest("tr") as HTMLElement;
	}

	it("renders its title, lead, and a visible header row with one label per column", () => {
		render(<Writeup {...sheetWith(markets)} />);
		expect(screen.getByRole("heading", { name: "Market by Market" })).toBeInTheDocument();
		expect(screen.getByText("Each market read on its own.")).toBeInTheDocument();
		const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
		expect(headers).toEqual(["Market", "Search", "Map", "AI", "Read"]);
		for (const column of ["Search", "Map", "AI"]) {
			expect(screen.getByRole("columnheader", { name: column })).toBeVisible();
		}
	});

	it("renders a row's market, place, chips, and read", () => {
		render(<Writeup {...sheetWith(markets)} />);
		const row = marketRow("Austin");
		const header = within(row).getByRole("rowheader");
		expect(header).toHaveTextContent("Austin");
		expect(header).toHaveTextContent("Cedar Park, TX");
		expect(
			within(row)
				.getAllByText(/^[A-D]$/)
				.map((chip) => chip.textContent),
		).toEqual(["A", "C"]);
		expect(
			within(row).getByText("First on the map in Cedar Park, nowhere in Austin proper."),
		).toBeInTheDocument();
	});

	it("speaks each chip as its column and letter, and a null as not read with a dash", () => {
		render(<Writeup {...sheetWith(markets)} />);
		const row = marketRow("Austin");
		const [search, map, ai] = within(row).getAllByRole("cell");
		expect(within(search).getByText("Search, grade A")).toBeInTheDocument();
		expect(within(map).getByText("Map, grade C")).toBeInTheDocument();
		expect(within(ai).getByText("AI, not read")).toBeInTheDocument();
		expect(within(ai).queryByText(/^[A-D]$/)).toBeNull();
		// The chip and the dash are hidden from the screen reader, so the letter is heard once.
		expect(within(search).getByText("A").closest("[aria-hidden='true']")).not.toBeNull();
		expect(ai.querySelector(".op-dash")).toHaveAttribute("aria-hidden", "true");
	});

	it("draws one grade cell per column in every row", () => {
		render(<Writeup {...sheetWith(markets)} />);
		for (const name of ["Austin", "Dallas"]) {
			// Three grades plus the read.
			expect(within(marketRow(name)).getAllByRole("cell")).toHaveLength(4);
		}
		expect(within(marketRow("Dallas")).getAllByText(/^[A-D]$/)).toHaveLength(3);
		expect(screen.getByRole("rowheader", { name: "Dallas" })).toHaveTextContent(/^Dallas$/);
	});
});

describe("Writeup table block", () => {
	it("keeps a mark's text for a screen reader alone, unless it is shown", () => {
		render(
			<Writeup
				{...sheetWith(
					topicWith({
						kind: "table",
						columns: [{ label: "Page" }, { label: "Loads" }, { label: "Indexed" }],
						rows: [
							{
								cells: [
									"Home",
									{ mark: "good", text: "Loads" },
									{ mark: "good", text: "Indexed", show: true },
								],
							},
						],
					}),
				)}
			/>,
		);
		const row = screen.getByRole("rowheader", { name: "Home" }).closest("tr") as HTMLElement;
		const [loads, indexed] = within(row).getAllByRole("cell");
		expect(within(loads).getByText("Loads")).toHaveClass("op-sr-only");
		expect(within(indexed).getByText("Indexed")).not.toHaveClass("op-sr-only");
	});

	it("keeps a warning's and a bad mark's text for a screen reader alone, and draws a dash for none", () => {
		render(
			<Writeup
				{...sheetWith(
					topicWith({
						kind: "table",
						columns: [{ label: "Page" }, { label: "A" }, { label: "B" }, { label: "C" }],
						rows: [
							{
								cells: [
									"Contact",
									{ mark: "warn", text: "Slow" },
									{ mark: "bad", text: "Page Not Found" },
									{ mark: "none", text: "Not checked" },
								],
							},
						],
					}),
				)}
			/>,
		);
		const row = screen.getByRole("rowheader", { name: "Contact" }).closest("tr") as HTMLElement;
		const [warn, bad, none] = within(row).getAllByRole("cell");
		expect(within(warn).getByText("Slow")).toHaveClass("op-sr-only");
		expect(within(bad).getByText("Page Not Found")).toHaveClass("op-sr-only");
		expect(within(none).getByText("Not checked")).toHaveClass("op-sr-only");
		expect(none.querySelector(".op-dash")).toHaveAttribute("aria-hidden", "true");
	});

	it("opens in its sort, ranking marks good, warning, bad, none unless a mark carries its own", () => {
		render(
			<Writeup
				{...sheetWith(
					topicWith({
						kind: "table",
						title: "Your Pages",
						columns: [{ label: "Page" }, { label: "Loads", sortable: true }],
						rows: [
							{ cells: ["Bad", { mark: "bad", text: "Broken" }] },
							{ cells: ["None", { mark: "none", text: "Not read" }] },
							{ cells: ["Good", { mark: "good", text: "Loads" }] },
							{ cells: ["Warn", { mark: "warn", text: "Slow" }] },
							{ cells: ["Pinned", { mark: "none", text: "Not read", sort: 9 }] },
						],
						sort: { column: 1, direction: "desc" },
					}),
				)}
			/>,
		);
		expect(screen.getByRole("heading", { level: 4, name: "Your Pages" })).toBeInTheDocument();
		expect(screen.getAllByRole("rowheader").map((th) => th.textContent)).toEqual([
			"Pinned",
			"Good",
			"Warn",
			"Bad",
			"None",
		]);
		expect(screen.getByRole("columnheader", { name: /Loads/ })).toHaveAttribute(
			"aria-sort",
			"descending",
		);
	});

	it("shows a rating to one decimal and sorts by the figure", () => {
		render(
			<Writeup
				{...sheetWith(
					topicWith({
						kind: "table",
						columns: [{ label: "Profile" }, { label: "Rating", sortable: true }],
						rows: [
							{ cells: ["Second", ratingCell(4.84)] },
							{ cells: ["First", ratingCell(5)] },
							{ cells: ["Third", ratingCell(3.2, "bad")] },
						],
						sort: { column: 1, direction: "desc" },
					}),
				)}
			/>,
		);
		expect(screen.getAllByRole("rowheader").map((th) => th.textContent)).toEqual([
			"First",
			"Second",
			"Third",
		]);
		expect(screen.getByText("5.0")).toBeInTheDocument();
		expect(screen.getByText("4.8")).toBeInTheDocument();
		expect(screen.getByText("3.2")).toBeInTheDocument();
	});
});

describe("Writeup findings", () => {
	it("marks a win as working, everything else as needing work, and honors a tone", () => {
		render(
			<Writeup
				{...sheetWith(
					topicWith({
						kind: "findings",
						items: [
							{ lead: "Already earned.", win: true },
							{ lead: "Still owed.", body: "Why it matters." },
							{ lead: "Not read yet.", tone: "info" },
						],
					}),
				)}
			/>,
		);
		const callout = (lead: string) => screen.getByText(lead).closest(".callout") as HTMLElement;
		expect(within(callout("Already earned.")).getByLabelText("Working")).toBeInTheDocument();
		expect(within(callout("Still owed.")).getByLabelText("Needs work")).toBeInTheDocument();
		expect(within(callout("Still owed.")).getByText("Why it matters.")).toBeInTheDocument();
		expect(within(callout("Not read yet.")).getByLabelText("Note")).toBeInTheDocument();
	});

	it("sets a boxed finding apart and leaves the rest plain", () => {
		render(
			<Writeup
				{...sheetWith(
					topicWith({
						kind: "findings",
						items: [{ lead: "Missing entirely.", box: true }, { lead: "A plain point." }],
					}),
				)}
			/>,
		);
		expect(screen.getByText("Missing entirely.").closest(".callout")).toHaveClass("is-box");
		expect(screen.getByText("A plain point.").closest(".callout")).not.toHaveClass("is-box");
	});
});

describe("Writeup more block", () => {
	it("holds its label, its summary, and its inner blocks inside a closed disclosure", () => {
		const { container } = render(
			<Writeup
				{...sheetWith(
					topicWith({
						kind: "more",
						label: "Every Page",
						summary: "Twelve pages, two slow.",
						blocks: [
							{ kind: "findings", items: [{ lead: "The inner finding." }] },
							{
								kind: "checks",
								items: [{ label: "The inner check", pass: true }],
							},
						],
					}),
				)}
			/>,
		);
		const details = section(container, "topic").querySelector("details") as HTMLElement;
		expect(details).not.toBeNull();
		expect(details).not.toHaveAttribute("open");
		const summary = within(details).getByText("Every Page").closest("summary") as HTMLElement;
		expect(summary).toHaveTextContent("Twelve pages, two slow.");
		expect(within(details).getByText("The inner finding.")).toBeInTheDocument();
		expect(within(details).getByText("The inner check")).toBeInTheDocument();
	});
});
