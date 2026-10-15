import { render, screen, within } from "@testing-library/react";
import { Read, type ReadProps, type ReadSection, type ReadTier } from "../../src/artifact/Read";

const person = {
	photoSrc: "/images/profile.jpg",
	photoAlt: "A person",
	name: "A Person",
	role: "Founder",
	mailHref: "mailto:a@example.com",
	mailLabel: "a@example.com",
};

const crawl: ReadSection = {
	id: "technical-seo",
	name: "Technical SEO",
	question: "Can Google read the site?",
	grade: "b",
	gist: "Every page is reachable; the titles are the gap.",
	found: [
		"Every page answers and the address is secure.",
		[
			"Search shows ",
			{ text: "the same title", href: "https://example.com/titles" },
			" for all six.",
		],
	],
	examples: ["The menu page is titled Home.", "The order page is titled Home."],
	why: "The site was built from one page copied six times.",
	changes: ["Each page gets a title of its own."],
	sources: [
		{ label: "Search Console", href: "https://search.example.com" },
		{ label: "The site itself" },
	],
};

const speed: ReadSection = {
	id: "core-web-vitals",
	name: "Core Web Vitals",
	question: "Does it load fast on a phone?",
	grade: "c",
	gist: "A phone waits 4.6 seconds.",
	found: ["The first screen waits on a photo of the chalkboard."],
	why: "The menu is a picture.",
	changes: ["The menu is set as text."],
};

const map: ReadSection = {
	id: "local-seo",
	name: "Local SEO",
	question: "Does Google show the bakery on the map?",
	grade: "a",
	gist: "Third in the pack on Alder Street.",
	found: ["The listing shows in every market we searched."],
	shots: [
		{ src: "/images/north.png", alt: "The north market's search", caption: "North, third" },
		{
			src: "/images/south.png",
			alt: "The south market's search",
			href: "/images/south-full.png",
			caption: "South, fifth",
		},
	],
	why: "The reviews keep coming.",
	changes: ["Nothing yet; keep asking for reviews."],
};

const health: ReadTier = {
	id: "health",
	title: "Health",
	lead: "Can search reach the site?",
	sections: [crawl, speed],
};
const visibility: ReadTier = { id: "visibility", title: "Visibility", sections: [map] };

function read(overrides: Partial<ReadProps> = {}): ReadProps {
	return {
		title: "The Read: Health and Visibility",
		preparedFor: "An Owner",
		date: "2026-10-16",
		lede: [
			"A week of reading, nothing changed. ",
			{ text: "The baseline", href: "/writeup" },
			" is where the grades came from.",
		],
		gistTitle: "At a Glance",
		gradeKey: [
			{ grade: "a", label: "Working well" },
			{ grade: "d", label: "Broken" },
		],
		tiers: [health, visibility],
		plan: {
			id: "plan",
			steps: [
				{ title: "The hosting.", body: "Move to a faster server." },
				{
					title: "The titles.",
					body: ["One per page, ", { text: "as here", href: "#technical-seo" }, "."],
				},
				{ title: "The photos.", who: "Yours" },
			],
		},
		close: {
			line: "Conversion follows once the analytics access lands.",
			signOff: "Reliably Yours,",
			person,
		},
		...overrides,
	};
}

/** The gist table. */
function gist(): HTMLElement {
	return screen.getByRole("table");
}

/** The section card a question heads. */
function section(question: string): HTMLElement {
	return screen
		.getByRole("heading", { level: 3, name: question })
		.closest("section") as HTMLElement;
}

/** The beat a label heads, inside a section. */
function beat(within_: HTMLElement, label: string): HTMLElement {
	return within(within_).getByRole("heading", { level: 4, name: label })
		.parentElement as HTMLElement;
}

describe("Read, the head", () => {
	it("renders the title, the dateline, and the lede with its link", () => {
		render(<Read {...read()} />);
		expect(
			screen.getByRole("heading", { level: 1, name: "The Read: Health and Visibility" }),
		).toBeInTheDocument();
		expect(screen.getByText("An Owner").closest("p")).toHaveTextContent(
			"Prepared for An Owner · 2026-10-16",
		);
		const link = screen.getByRole("link", { name: "The baseline" });
		expect(link).toHaveAttribute("href", "/writeup");
		expect(link).not.toHaveAttribute("target");
		expect(link.closest("p")).toHaveTextContent(
			"A week of reading, nothing changed. The baseline is where the grades came from.",
		);
	});
});

describe("Read, the gist table", () => {
	it("has the three columns, Section, Grade, and The Gist", () => {
		render(<Read {...read()} />);
		expect(
			within(gist())
				.getAllByRole("columnheader")
				.map((th) => th.textContent),
		).toEqual(["Section", "Grade", "The Gist"]);
	});

	it("lists every section under its tier, in order, drawn from the tiers", () => {
		render(<Read {...read()} />);
		const groups = within(gist()).getAllByRole("rowgroup").slice(1);
		expect(
			groups.map((g) =>
				within(g)
					.getAllByRole("rowheader")
					.map((h) => h.textContent),
			),
		).toEqual([
			["Health", "Technical SEO", "Core Web Vitals"],
			["Visibility", "Local SEO"],
		]);
	});

	it("links each section's name to its card, with its grade and its gist", () => {
		render(<Read {...read()} />);
		const link = within(gist()).getByRole("link", { name: "Technical SEO" });
		expect(link).toHaveAttribute("href", "#technical-seo");
		const row = link.closest("tr") as HTMLElement;
		expect(row).toHaveTextContent("Every page is reachable; the titles are the gap.");
		expect(row.querySelector(".op-grade")).toHaveAttribute("data-grade", "b");
		expect(document.getElementById("technical-seo")).toBe(section("Can Google read the site?"));
	});

	it("shows a quiet dash for a section not graded yet, named for a screen reader", () => {
		const ungraded = { ...speed, grade: undefined };
		render(<Read {...read({ tiers: [{ ...health, sections: [ungraded] }] })} />);
		const row = within(gist())
			.getByRole("link", { name: "Core Web Vitals" })
			.closest("tr") as HTMLElement;
		expect(row.querySelector(".op-grade")).toBeNull();
		expect(row.querySelector(".op-dash")).not.toBeNull();
		expect(within(row).getByText("Not graded yet")).toBeInTheDocument();
	});

	it("shows the grade key over the table, with its title", () => {
		render(<Read {...read()} />);
		expect(screen.getByRole("heading", { level: 2, name: "At a Glance" })).toBeInTheDocument();
		const key = screen.getByText("Working well").closest("ul") as HTMLElement;
		expect(within(key).getAllByRole("listitem")).toHaveLength(2);
	});
});

describe("Read, the tiers and sections", () => {
	it("renders each tier as a heading over its sections, in order", () => {
		render(<Read {...read()} />);
		const headings = screen
			.getAllByRole("heading")
			.filter((h) => h.tagName === "H2" || h.tagName === "H3")
			.map((h) => h.textContent);
		expect(headings).toEqual([
			"At a Glance",
			"Health",
			"Can Google read the site?",
			"Does it load fast on a phone?",
			"Visibility",
			"Does Google show the bakery on the map?",
			"The Plan",
		]);
		expect(screen.getByText("Can search reach the site?")).toBeInTheDocument();
	});

	it("heads a section with its question, its trade name over it, and its grade", () => {
		render(<Read {...read()} />);
		const card = section("Can Google read the site?");
		expect(within(card).getByText("Technical SEO")).toBeInTheDocument();
		expect(within(card).getByText("Grade B")).toBeInTheDocument();
		expect(card.querySelector(".op-topic-head .op-grade")).toHaveAttribute("data-grade", "b");
	});

	it("sets the three beats in order: what we found, why, what changes", () => {
		render(<Read {...read()} />);
		const card = section("Can Google read the site?");
		expect(
			within(card)
				.getAllByRole("heading", { level: 4 })
				.map((h) => h.textContent),
		).toEqual(["What We Found", "Why", "What Changes"]);
		const found = beat(card, "What We Found");
		expect(found).toHaveTextContent("Every page answers and the address is secure.");
		expect(
			within(found)
				.getAllByRole("listitem")
				.map((li) => li.textContent),
		).toEqual(["The menu page is titled Home.", "The order page is titled Home."]);
		expect(beat(card, "Why")).toHaveTextContent(
			"The site was built from one page copied six times.",
		);
		expect(beat(card, "What Changes")).toHaveTextContent("Each page gets a title of its own.");
	});

	it("sets the why apart from the other beats", () => {
		render(<Read {...read()} />);
		const card = section("Can Google read the site?");
		expect(beat(card, "Why")).toHaveClass("rd-why");
		expect(beat(card, "What We Found")).not.toHaveClass("rd-why");
	});

	it("opens a link in a beat in a new tab when it leaves the page", () => {
		render(<Read {...read()} />);
		const link = screen.getByRole("link", { name: "the same title" });
		expect(link).toHaveAttribute("href", "https://example.com/titles");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
		expect(link.closest("p")).toHaveTextContent("Search shows the same title for all six.");
	});

	it("leaves out the examples list when a section has none", () => {
		render(<Read {...read()} />);
		expect(within(section("Does it load fast on a phone?")).queryByRole("list")).toBeNull();
	});

	it("renders a section's proof pictures over their captions, in the found beat, and nowhere else", () => {
		render(<Read {...read()} />);
		const card = section("Does Google show the bakery on the map?");
		const figures = within(beat(card, "What We Found")).getAllByRole("figure");
		expect(figures.map((f) => f.textContent)).toEqual(["North, third", "South, fifth"]);
		expect(within(figures[0]).queryByRole("link")).toBeNull();
		expect(within(figures[1]).getByRole("link")).toHaveAttribute("href", "/images/south-full.png");
		expect(screen.getAllByRole("figure")).toHaveLength(2);
		expect(card.querySelector(".rd-shots")).toHaveAttribute("data-count", "2");
	});

	it("names the tools a section was read from, linked where they have an address", () => {
		render(<Read {...read()} />);
		const card = section("Can Google read the site?");
		const tool = within(card).getByRole("link", { name: "Search Console" });
		expect(tool).toHaveAttribute("href", "https://search.example.com");
		expect(tool).toHaveAttribute("target", "_blank");
		expect(within(card).getByText("The site itself").closest("a")).toBeNull();
		expect(within(card).getByText("Sources")).toBeInTheDocument();
	});

	it("grows by a tier with no change to its shape: a third tier joins the table and the body", () => {
		const conversion: ReadTier = {
			id: "conversion",
			title: "Conversion",
			sections: [
				{
					id: "cro",
					name: "CRO",
					question: "Does a visit become an order?",
					grade: "c",
					gist: "Three taps to order.",
					found: ["Ordering ahead takes three taps."],
					why: "The form asks for the time twice.",
					changes: ["One field for the time."],
				},
			],
		};
		render(<Read {...read({ tiers: [health, visibility, conversion] })} />);
		expect(within(gist()).getByRole("link", { name: "CRO" })).toHaveAttribute("href", "#cro");
		expect(screen.getByRole("heading", { level: 2, name: "Conversion" })).toBeInTheDocument();
		expect(section("Does a visit become an order?")).toHaveAttribute("id", "cro");
	});

	it("leaves out a tier with no sections, in the table and the body", () => {
		render(<Read {...read({ tiers: [health, { title: "Conversion", sections: [] }] })} />);
		expect(screen.queryByText("Conversion")).toBeNull();
	});
});

describe("Read, the plan and the close", () => {
	it("numbers the steps in order, each title in bold before its body", () => {
		render(<Read {...read()} />);
		const plan = screen
			.getByRole("heading", { level: 2, name: "The Plan" })
			.closest("section") as HTMLElement;
		expect(plan).toHaveAttribute("id", "plan");
		const list = within(plan).getByRole("list");
		expect(list.tagName).toBe("OL");
		const steps = within(list).getAllByRole("listitem");
		expect(steps.map((li) => li.textContent)).toEqual([
			"The hosting. Move to a faster server.",
			"The titles. One per page, as here.",
			"The photos. Yours",
		]);
		expect(within(steps[0]).getByText("The hosting.").tagName).toBe("B");
		expect(within(steps[1]).getByRole("link", { name: "as here" })).not.toHaveAttribute("target");
	});

	it("names whose step it is when it is the owner's", () => {
		render(<Read {...read()} />);
		expect(screen.getByText("Yours")).toHaveClass("rd-step-who");
	});

	it("takes the plan's own title, and renders no plan without steps", () => {
		const titled = render(
			<Read {...read({ plan: { title: "In Order", steps: [{ title: "One." }] } })} />,
		);
		expect(screen.getByRole("heading", { level: 2, name: "In Order" })).toBeInTheDocument();
		titled.unmount();
		const { container } = render(<Read {...read({ plan: { steps: [] } })} />);
		expect(container.querySelector(".rd-plan")).toBeNull();
	});

	it("closes on one line and the sign off", () => {
		render(<Read {...read()} />);
		const line = screen.getByText("Conversion follows once the analytics access lands.");
		const footer = screen.getByText("Reliably Yours,").closest("footer") as HTMLElement;
		expect(line.compareDocumentPosition(footer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
		expect(screen.getByRole("link", { name: "a@example.com" })).toHaveAttribute(
			"href",
			"mailto:a@example.com",
		);
	});

	it("closes on the line alone when there is no sign off", () => {
		const { container } = render(<Read {...read({ close: { line: "Back soon." } })} />);
		expect(screen.getByText("Back soon.")).toBeInTheDocument();
		expect(screen.queryByText("Reliably Yours,")).toBeNull();
		expect(container.querySelector(".op-close")).toBeNull();
	});
});

describe("Read, labels", () => {
	it("takes any of its fixed words as an override and keeps the rest", () => {
		render(<Read {...read({ labels: { gist: "In Short", why: "Because" } })} />);
		expect(
			within(gist())
				.getAllByRole("columnheader")
				.map((th) => th.textContent),
		).toEqual(["Section", "Grade", "In Short"]);
		const card = section("Can Google read the site?");
		expect(
			within(card)
				.getAllByRole("heading", { level: 4 })
				.map((h) => h.textContent),
		).toEqual(["What We Found", "Because", "What Changes"]);
	});
});
