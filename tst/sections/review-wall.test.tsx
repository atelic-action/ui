import { fireEvent, render, screen } from "@testing-library/react";
import { ReviewWall } from "../../src/sections/ReviewWall";

const longQuote =
	"I had an upper back and neck issue for almost two months and had tried " +
	"everything short of giving up on massage entirely, but after a single " +
	"hour on the table my neck works again and I have slept well every night " +
	"since, without any of the recurring pain that used to wake me.";

const items = [
	{ quote: "Best hour of my month, every month.", by: "Sam O.", rating: 5 },
	{ quote: longQuote, by: "Greg T." },
];

describe("ReviewWall", () => {
	it("ships every quote in full in the static HTML (clamp is CSS-only)", () => {
		render(<ReviewWall items={items} clampAt={120} />);
		expect(screen.getByText(`“${longQuote}”`)).toBeInTheDocument();
	});

	it("gives only over-budget quotes a Read more toggle", () => {
		render(<ReviewWall items={items} clampAt={120} />);
		const toggles = screen.getAllByRole("button");
		expect(toggles).toHaveLength(1);
		expect(toggles[0]).toHaveTextContent("Read more");
	});

	it("expands and re-clamps on toggle", () => {
		render(<ReviewWall items={items} clampAt={120} />);
		const toggle = screen.getByRole("button");
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(toggle).toHaveTextContent("Show less");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});

	it("renders stars only when the source gave a rating", () => {
		render(<ReviewWall items={items} clampAt={120} />);
		expect(screen.getAllByRole("img")).toHaveLength(1);
		expect(screen.getByRole("img")).toHaveAccessibleName("5 out of 5 stars");
	});

	it("renders no header and no controls in the bare form", () => {
		render(<ReviewWall items={items} clampAt={120} />);
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("renders the header block when a title is given", () => {
		render(<ReviewWall items={items} eyebrow="In their words" title="What clients say" />);
		expect(screen.getByRole("heading", { name: "What clients say" })).toBeInTheDocument();
		expect(screen.getByText("In their words")).toBeInTheDocument();
	});
});

const tagged = [
	{ quote: "Knee is back.", by: "Jordan M.", date: "2026-05-15", tags: ["Knee rehab"] },
	{
		quote: "Back pain gone.",
		by: "Priya S.",
		date: "2026-01-08",
		tags: ["Back pain"],
		sourceUrl: "https://example.com/review",
	},
];

describe("ReviewWall filters", () => {
	it("shows the tag filter and the sort only when the data carries tags and dates", () => {
		render(<ReviewWall items={tagged} allTagsLabel="All services" />);
		expect(screen.getByDisplayValue("All services")).toBeInTheDocument();
		expect(screen.getByDisplayValue("Newest")).toBeInTheDocument();
	});

	it("suppresses the controls when asked", () => {
		render(<ReviewWall items={tagged} filterable={false} sortable={false} />);
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("narrows the wall to the selected tag", () => {
		render(<ReviewWall items={tagged} />);
		fireEvent.change(screen.getByLabelText("Filter reviews by tag"), {
			target: { value: "Back pain" },
		});
		expect(screen.queryByText("“Knee is back.”")).not.toBeInTheDocument();
		expect(screen.getByText("“Back pain gone.”")).toBeInTheDocument();
	});

	it("sorts newest first by default and flips to oldest", () => {
		render(<ReviewWall items={tagged} />);
		const quotes = () =>
			screen.getAllByText(/“/).map((node) => node.textContent?.replace(/[“”]/g, ""));
		expect(quotes()[0]).toBe("Knee is back.");
		fireEvent.change(screen.getByLabelText("Sort reviews by date"), {
			target: { value: "oldest" },
		});
		expect(quotes()[0]).toBe("Back pain gone.");
	});

	it("links the date out to the review's source when one is given", () => {
		render(<ReviewWall items={tagged} />);
		const link = screen.getByRole("link", { name: /Priya S\./ });
		expect(link).toHaveAttribute("href", "https://example.com/review");
		expect(link).toHaveAttribute("target", "_blank");
		expect(screen.getByText("2026-05-15").tagName).toBe("SPAN");
	});
});
