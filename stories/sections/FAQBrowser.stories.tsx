import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, type MockInstance, spyOn, waitFor, within } from "storybook/test";
import { FAQBrowser } from "../../src/sections";
import { faqCategories, unbroken } from "../fixtures/sections";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * The help center: a hero with live search, a sticky rail of categories
 * that follows the scroll, and each category's questions folding open, with
 * expand all, back to top, and a copyable link per question.
 */
const meta = {
	title: "Sections/FAQBrowser",
	component: FAQBrowser,
	args: {
		hero: {
			eyebrow: "Questions",
			title: "Ask the bakery",
			lead: "Ordering ahead, cakes, and wholesale, answered.",
		},
		categories: faqCategories,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof FAQBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

const search = (canvas: Canvas) => canvas.getByRole("searchbox", { name: "Search questions" });
const rail = (canvas: Canvas) =>
	within(canvas.getByRole("navigation", { name: "Question categories" }));
const question = (canvas: Canvas, name: string | RegExp) =>
	canvas
		.getAllByRole("button", { name })
		.find((button: HTMLElement) => !button.getAttribute("aria-label")) as HTMLElement;
const chevron = (canvas: Canvas, name: string | RegExp) =>
	within(question(canvas, name).parentElement as HTMLElement).getByRole("button", {
		name: /answer$/,
	});
const categoryHeadings = (canvas: Canvas) =>
	canvas.getAllByRole("heading", { level: 2 }).map((heading: HTMLElement) => heading.textContent);

/** Every category and question, all closed, the rail and the browse link in place. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Ask the bakery");
		await expect(categoryHeadings(canvas)).toEqual([
			"Ordering ahead",
			"Cakes to order",
			"Wholesale",
		]);
		await expect(
			rail(canvas)
				.getAllByRole("link")
				.map((link) => link.textContent),
		).toEqual(["Ordering", "Cakes", "Wholesale"]);
		await expect(canvas.getByRole("link", { name: /Browse all questions/ })).toHaveAttribute(
			"href",
			"#cat-ordering",
		);
		for (const button of canvas.getAllByRole("button", { expanded: false })) {
			await expect(button).toHaveAttribute("aria-expanded", "false");
		}
		await expect(canvas.getByRole("link", { name: /Order for Saturday/ })).toHaveAttribute(
			"href",
			"/order",
		);
	},
};

/**
 * A question opens by its own words or by its chevron, both saying so, and
 * closes the same two ways; a closed answer's link is out of reach.
 */
export const OpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const ask = question(canvas, "Do I pay when I order?");
		const answerLink = () => canvas.getByRole("link", { name: /See the pickup times/ });
		await step("closed, the answer's link refuses focus", async () => {
			answerLink().focus();
			await expect(answerLink()).not.toHaveFocus();
			await expect(chevron(canvas, "Do I pay when I order?")).toHaveAccessibleName("Expand answer");
		});
		await step("the question opens it, both controls expanded", async () => {
			await userEvent.click(ask);
			await expect(ask).toHaveAttribute("aria-expanded", "true");
			const fold = chevron(canvas, "Do I pay when I order?");
			await expect(fold).toHaveAttribute("aria-expanded", "true");
			await expect(fold).toHaveAccessibleName("Collapse answer");
			await expect(ask).toHaveFocus();
		});
		await step("Tab walks from the question past its two icons into the answer", async () => {
			await userEvent.tab();
			await expect(
				canvas.getAllByRole("button", { name: "Copy link to this question" })[1],
			).toHaveFocus();
			await userEvent.tab();
			await expect(chevron(canvas, "Do I pay when I order?")).toHaveFocus();
			await userEvent.tab();
			await expect(answerLink()).toHaveFocus();
		});
		await step("the chevron closes it", async () => {
			await userEvent.click(chevron(canvas, "Do I pay when I order?"));
			await expect(ask).toHaveAttribute("aria-expanded", "false");
			answerLink().focus();
			await expect(answerLink()).not.toHaveFocus();
		});
		await step("Enter on the question opens it, Space closes it", async () => {
			ask.focus();
			await userEvent.keyboard("{Enter}");
			await expect(ask).toHaveAttribute("aria-expanded", "true");
			await userEvent.keyboard(" ");
			await expect(ask).toHaveAttribute("aria-expanded", "false");
		});
	},
};

/** Expand all opens a category's every question and becomes Collapse all; the others stay shut. */
export const ExpandAll: Story = {
	play: async ({ canvas, userEvent }) => {
		const [ordering] = canvas.getAllByRole("button", { name: "Expand all" });
		await userEvent.click(ordering);
		await expect(question(canvas, "When is the cutoff for a Saturday order?")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await expect(question(canvas, "Do I pay when I order?")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await expect(question(canvas, "How much notice does a cake need?")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		await expect(ordering).toHaveAccessibleName("Collapse all");
		await userEvent.click(ordering);
		await expect(question(canvas, "Do I pay when I order?")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		await expect(ordering).toHaveAccessibleName("Expand all");
	},
};

/** Opening every question by hand turns Expand all into Collapse all too. */
export const AllOpenByHand: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(question(canvas, "When is the cutoff for a Saturday order?"));
		await userEvent.click(question(canvas, "Do I pay when I order?"));
		await expect(canvas.getAllByRole("button", { name: "Collapse all" })).toHaveLength(1);
	},
};

/**
 * Search keeps the questions whose words or answers match, in any case, and
 * hides a category with none; the rail and the browse link follow. Clearing
 * brings everything back.
 */
export const Search: Story = {
	tags: ["known-issue"],
	play: async ({ canvas, userEvent, step }) => {
		await step("a word in a question and in an answer, either case", async () => {
			await userEvent.type(search(canvas), "CAKE");
			await expect(categoryHeadings(canvas)).toEqual(["Cakes to order"]);
			await expect(question(canvas, "How much notice does a cake need?")).toBeVisible();
			// Matched by its answer: "a trace free cake".
			await expect(question(canvas, "Can you bake without nuts?")).toBeVisible();
		});
		await step("the rail and the browse link follow the categories left", async () => {
			await expect(
				rail(canvas)
					.getAllByRole("link")
					.map((link) => link.textContent),
			).toEqual(["Cakes"]);
			await expect(canvas.getByRole("link", { name: /Browse all questions/ })).toHaveAttribute(
				"href",
				"#cat-cakes",
			);
		});
		await step("a question opened during a search stays open after it", async () => {
			await userEvent.click(question(canvas, "Can you bake without nuts?"));
		});
		await step("the clear button brings every category back", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Clear search" }));
			await expect(search(canvas)).toHaveValue("");
			await expect(categoryHeadings(canvas)).toHaveLength(3);
			await expect(question(canvas, "Can you bake without nuts?")).toHaveAttribute(
				"aria-expanded",
				"true",
			);
			await expect(canvas.queryByRole("button", { name: "Clear search" })).toBeNull();
		});
		// The clear button removes itself, and the focus it held goes with it,
		// to the top of the page, rather than back to the search it cleared.
		await step("focus returns to the search", async () => {
			await knownBug("faq-clear-drops-focus", async () => {
				await expect(search(canvas)).toHaveFocus();
			});
		});
	},
};

/** No match: a line saying so, with the word, and a way to ask instead. */
export const NoResults: Story = {
	args: { contactHref: "/visit#ask" },
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(search(canvas), "  gluten free  ");
		await expect(canvas.getByText(/No questions match "gluten free"/)).toBeVisible();
		await expect(canvas.getByRole("link", { name: "reach out directly" })).toHaveAttribute(
			"href",
			"/visit#ask",
		);
		await expect(canvas.queryByRole("heading", { level: 2 })).toBeNull();
		await expect(canvas.queryByRole("link", { name: /Browse all questions/ })).toBeNull();
		await expect(rail(canvas).queryAllByRole("link")).toHaveLength(0);
	},
};

/** Spaces alone are no search: everything stays. */
export const BlankSearch: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(search(canvas), "   ");
		await expect(categoryHeadings(canvas)).toHaveLength(3);
		await expect(canvas.queryByText(/No questions match/)).toBeNull();
	},
};

/**
 * The jump a browser makes for an in page link, made by hand: a fragment
 * navigation inside the test frame closes the test run's connection, so a
 * story's `#` link is held and its target scrolled into view the way the
 * browser does, its scroll margin honored (stories/findings/sections.md,
 * Checker Limits).
 */
function holdFragmentJumps() {
	const jump = (event: MouseEvent) => {
		const link = (event.target as Element | null)?.closest?.("a[href^='#']");
		if (!link) return;
		event.preventDefault();
		const target = document.getElementById((link.getAttribute("href") ?? "").slice(1));
		target?.scrollIntoView({ behavior: "instant", block: "start" });
	};
	document.addEventListener("click", jump);
	return () => document.removeEventListener("click", jump);
}

/**
 * A category tab jumps to its category, which lands in view below the
 * sticky rail, and the rail marks it.
 */
export const CategoryJump: Story = {
	beforeEach: holdFragmentJumps,
	play: async ({ canvas, userEvent, step }) => {
		const cakes = rail(canvas).getByRole("link", { name: "Cakes" });
		const resting = getComputedStyle(cakes).color;
		const heading = canvas.getByRole("heading", { level: 2, name: "Cakes to order" });
		await step("the tab points at its category", async () => {
			await expect(cakes).toHaveAttribute("href", "#cat-cakes");
		});
		await step("followed, the category comes into view and its tab is marked", async () => {
			await userEvent.click(cakes);
			await waitFor(() =>
				expect(heading.getBoundingClientRect().top).toBeLessThan(window.innerHeight / 2),
			);
			await waitFor(() => expect(getComputedStyle(cakes).color).not.toBe(resting));
		});
		await step("the heading lands below the sticky rail, not under it", async () => {
			const railBottom = canvas
				.getByRole("navigation", { name: "Question categories" })
				.getBoundingClientRect().bottom;
			await expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(railBottom);
		});
	},
};

/** Browse all jumps to the first category left. */
export const BrowseAll: Story = {
	beforeEach: holdFragmentJumps,
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("link", { name: /Browse all questions/ }));
		const heading = canvas.getByRole("heading", { level: 2, name: "Ordering ahead" });
		await waitFor(() =>
			expect(heading.getBoundingClientRect().top).toBeLessThan(window.innerHeight / 2),
		);
	},
};

let writeText: MockInstance<Clipboard["writeText"]>;

/**
 * A question's link icon copies the address of that question, says so for a
 * moment, and goes back.
 */
export const CopyLink: Story = {
	beforeEach: () => {
		writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
		return () => writeText.mockRestore();
	},
	play: async ({ canvas, userEvent }) => {
		const [copy] = canvas.getAllByRole("button", { name: "Copy link to this question" });
		await userEvent.click(copy);
		await expect(writeText).toHaveBeenCalledWith(
			`${window.location.origin}${window.location.pathname}#order-cutoff`,
		);
		await expect(copy).toHaveAccessibleName("Link copied");
		await waitFor(() => expect(copy).toHaveAccessibleName("Copy link to this question"), {
			timeout: 3000,
		});
	},
};

/** A question's address opens that question on arrival and brings it into view. */
export const DeepLink: Story = {
	beforeEach: () => {
		const before = window.location.href;
		window.history.replaceState(null, "", "#wholesale-minimum");
		return () => window.history.replaceState(null, "", before);
	},
	play: async ({ canvas }) => {
		const ask = question(canvas, "Is there a minimum standing order?");
		await waitFor(() => expect(ask).toHaveAttribute("aria-expanded", "true"));
		await waitFor(() => {
			const box = ask.getBoundingClientRect();
			expect(box.top).toBeGreaterThan(0);
			expect(box.bottom).toBeLessThan(window.innerHeight);
		});
		await expect(question(canvas, "Do I pay when I order?")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	},
};

/** Back to top asks the page to scroll smoothly to its top. */
export const BackToTop: Story = {
	play: async ({ canvas, userEvent }) => {
		const scrollTo = spyOn(window, "scrollTo");
		try {
			await userEvent.click(canvas.getAllByRole("button", { name: "Back to top ↑" })[2]);
			await expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
		} finally {
			scrollTo.mockRestore();
		}
	},
};

/** A page's own words for the search, the browse link, and none of the latter. */
export const OwnWords: Story = {
	args: { searchPlaceholder: "Try cakes, or pickup", browseAllLabel: "" },
	play: async ({ canvas }) => {
		await expect(search(canvas)).toHaveAttribute("placeholder", "Try cakes, or pickup");
		await expect(canvas.queryByRole("link", { name: /Browse all/ })).toBeNull();
	},
};

/** On a phone, the longest realistic question and many categories, inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	args: {
		categories: [
			...faqCategories,
			{
				id: "allergens",
				title: "Allergens and ingredients, for every loaf and cake",
				tabLabel: "Allergens and ingredients",
				items: [
					{
						id: "allergen-sheet",
						question:
							"Where can I find the full list of allergens and ingredients for every loaf, bun, and cake you bake?",
						answer: <p>On the counter, and on every price label.</p>,
						answerText: "On the counter, and on every price label.",
					},
				],
			},
		],
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** One unbroken word in a question, on a phone. */
export const UnbrokenWord: Story = {
	globals: pin("phone"),
	args: {
		categories: [
			{
				id: "guild",
				title: "The guild",
				items: [
					{
						id: "guild-prize",
						question: `What is the ${unbroken}?`,
						answer: <p>A prize.</p>,
						answerText: "A prize.",
					},
				],
			},
		],
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
