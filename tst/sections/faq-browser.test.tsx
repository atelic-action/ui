import { fireEvent, render, screen } from "@testing-library/react";
import type { FAQCategory } from "../../src/sections/FAQBrowser";
import { FAQBrowser } from "../../src/sections/FAQBrowser";

// jsdom has no IntersectionObserver; the scroll spy just needs a stub.
beforeAll(() => {
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});

afterAll(() => {
	vi.unstubAllGlobals();
});

const categories: FAQCategory[] = [
	{
		id: "getting-started",
		title: "Getting Started",
		description: "What to expect before and during your first visit.",
		items: [
			{
				id: "referral",
				question: "Do I need a referral?",
				answer: <p>No, Colorado has direct access.</p>,
				answerText: "No, Colorado has direct access.",
			},
			{
				id: "wear",
				question: "What should I wear?",
				answer: <p>Comfortable athletic clothing.</p>,
				answerText: "Comfortable athletic clothing.",
			},
		],
	},
	{
		id: "cost",
		title: "Cost & Insurance",
		items: [
			{
				id: "insurance",
				question: "Do you take insurance?",
				answer: <p>We are cash-based and provide superbills.</p>,
				answerText: "We are cash-based and provide superbills.",
			},
		],
	},
];

function renderBrowser() {
	return render(<FAQBrowser hero={{ title: "FAQs" }} categories={categories} />);
}

describe("FAQBrowser", () => {
	it("stacks the category head as description first, then the utility controls", () => {
		renderBrowser();
		const head = document.querySelector("#cat-getting-started .faq-cat-head");
		expect(head).not.toBeNull();
		const children = Array.from(head?.children ?? []);
		expect(children[0]).toHaveClass("faq-cat-desc");
		expect(children[1]).toHaveClass("faq-utils");
	});

	it("omits the description node entirely for categories without one", () => {
		renderBrowser();
		const head = document.querySelector("#cat-cost .faq-cat-head");
		expect(head?.querySelector(".faq-cat-desc")).toBeNull();
		expect(head?.children).toHaveLength(1);
		expect(head?.children[0]).toHaveClass("faq-utils");
	});

	it("toggles a question open and closed", () => {
		renderBrowser();
		const question = screen.getByRole("button", { name: "Do I need a referral?" });
		expect(question).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(question);
		expect(question).toHaveAttribute("aria-expanded", "true");
		fireEvent.click(question);
		expect(question).toHaveAttribute("aria-expanded", "false");
	});

	it("expands and collapses every question in a category together", () => {
		renderBrowser();
		const expandAll = screen.getAllByRole("button", { name: "Expand all" })[0];
		expect(expandAll).toBeDefined();
		if (!expandAll) return;
		fireEvent.click(expandAll);
		expect(screen.getByRole("button", { name: "Do I need a referral?" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		expect(screen.getByRole("button", { name: "What should I wear?" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		const collapseAll = screen.getByRole("button", { name: "Collapse all" });
		fireEvent.click(collapseAll);
		expect(screen.getByRole("button", { name: "Do I need a referral?" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	});

	it("filters questions by search and hides categories with no matches", () => {
		renderBrowser();
		const input = screen.getByRole("searchbox", { name: "Search questions" });
		fireEvent.change(input, { target: { value: "insurance" } });
		expect(screen.getByRole("button", { name: "Do you take insurance?" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Do I need a referral?" })).not.toBeInTheDocument();
		expect(screen.queryByText("Getting Started", { selector: "h2" })).not.toBeInTheDocument();
	});

	it("shows the empty state when nothing matches", () => {
		renderBrowser();
		const input = screen.getByRole("searchbox", { name: "Search questions" });
		fireEvent.change(input, { target: { value: "zebra" } });
		expect(screen.getByText(/No questions match/)).toBeInTheDocument();
	});

	/*
	 * A closed answer is clipped to nothing but stays in the HTML, so its
	 * links were still reached by Tab. Inert takes the closed answer out of
	 * the tab order until it opens.
	 */
	it("makes a closed answer unfocusable, and an open one reachable", () => {
		render(
			<FAQBrowser
				hero={{ title: "FAQs" }}
				categories={[
					{
						id: "visit",
						title: "Visiting",
						items: [
							{
								id: "parking",
								question: "Where do I park?",
								answer: <p>Behind the building.</p>,
								answerText: "Behind the building.",
								cta: { label: "Directions", href: "/directions" },
							},
						],
					},
				]}
			/>,
		);
		const answer = document.querySelector("#parking .faq-row-a");
		expect(answer).toHaveAttribute("inert");
		fireEvent.click(screen.getByRole("button", { name: "Where do I park?" }));
		expect(answer).not.toHaveAttribute("inert");
	});

	it("points Browse all at the first category the page renders, which a search may change", () => {
		renderBrowser();
		const browseAll = () => document.querySelector(".faq-browse-all");
		expect(browseAll()).toHaveAttribute("href", "#cat-getting-started");
		const input = screen.getByRole("searchbox", { name: "Search questions" });
		fireEvent.change(input, { target: { value: "insurance" } });
		expect(browseAll()).toHaveAttribute("href", "#cat-cost");
		expect(document.getElementById("cat-cost")).not.toBeNull();
		fireEvent.change(input, { target: { value: "zebra" } });
		expect(browseAll()).toBeNull();
	});
});
