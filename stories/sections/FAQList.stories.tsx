import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { SectionHeading } from "../../src/primitives";
import { FAQList } from "../../src/sections";
import { faqCategories, unbroken } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const questions = faqCategories.flatMap((category) => category.items);

/**
 * Answers a page's common questions in a short list that folds open, with
 * no numbers, where `FAQBrowser` would be a whole help page. Each row is the
 * question, a link button that copies the question's address, and the
 * chevron; the answers stay in the page while closed, and a link to a
 * question's `#id` opens it.
 */
const meta = {
	title: "Sections/FAQList",
	component: FAQList,
	args: { items: questions },
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<SectionHeading eyebrow="Questions" title="Before you order" />
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof FAQList>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
const question = (canvas: Canvas, name: string) => canvas.getByRole("button", { name });
const row = (canvas: Canvas, name: string) => question(canvas, name).closest("[id]") as HTMLElement;
const answerOf = (canvas: Canvas, name: string) =>
	row(canvas, name).lastElementChild as HTMLElement;

/** Unnumbered questions, closed, each folding open from the question or the chevron. */
export const Default: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const name = "Do I pay when I order?";
		await step("no row is numbered", async () => {
			await expect(canvas.queryByText(/^0\d$/)).toBeNull();
		});
		await step("closed, the answer is in the page and out of reach", async () => {
			await expect(question(canvas, name)).toHaveAttribute("aria-expanded", "false");
			await expect(answerOf(canvas, name)).toHaveAttribute("inert");
		});
		await step("the question opens it, and the chevron says so", async () => {
			await userEvent.click(question(canvas, name));
			await expect(question(canvas, name)).toHaveAttribute("aria-expanded", "true");
			await expect(answerOf(canvas, name)).not.toHaveAttribute("inert");
			const chevron = within(row(canvas, name)).getByRole("button", { name: "Collapse answer" });
			await expect(chevron).toHaveAttribute("aria-expanded", "true");
		});
		await step("the chevron closes it again", async () => {
			await userEvent.click(
				within(row(canvas, name)).getByRole("button", { name: "Collapse answer" }),
			);
			await expect(question(canvas, name)).toHaveAttribute("aria-expanded", "false");
		});
	},
};

/** Each row's link button sits beside its chevron and copies the question's address. */
export const LinkButton: Story = {
	play: async ({ canvas, userEvent }) => {
		const name = "How much notice does a cake need?";
		const head = within(row(canvas, name));
		const link = head.getByRole("button", { name: "Copy link to this question" });
		const chevron = head.getByRole("button", { name: "Expand answer" });
		await expect(chevron.getBoundingClientRect().left).toBeGreaterThan(
			link.getBoundingClientRect().right,
		);
		await expect(row(canvas, name)).toHaveAttribute("id", "cake-notice");
		await userEvent.click(link);
		await expect(link).toHaveAccessibleName("Link copied");
		await waitFor(() => expect(link).toHaveAccessibleName("Copy link to this question"), {
			timeout: 3000,
		});
	},
};

/** The controls' names, set by the page. */
export const Labels: Story = {
	args: {
		linkLabel: "Copy this question's address",
		copiedLabel: "Address copied",
		expandLabel: "Open the answer",
		collapseLabel: "Close the answer",
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.getAllByRole("button", { name: "Copy this question's address" }),
		).toHaveLength(questions.length);
		await expect(canvas.getAllByRole("button", { name: "Open the answer" })).toHaveLength(
			questions.length,
		);
	},
};

/** Arriving at `#cake-notice` opens that question and scrolls it into view. */
export const ArrivingAtAQuestion: Story = {
	beforeEach: () => {
		const before = window.location.href;
		window.history.replaceState(null, "", "#cake-notice");
		return () => window.history.replaceState(null, "", before);
	},
	play: async ({ canvas }) => {
		const name = "How much notice does a cake need?";
		await waitFor(() => expect(question(canvas, name)).toHaveAttribute("aria-expanded", "true"));
		await waitFor(() => {
			const box = row(canvas, name).getBoundingClientRect();
			expect(box.top).toBeGreaterThanOrEqual(0);
			expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
		});
		await expect(question(canvas, "Do I pay when I order?")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	},
};

/** Following a link to a question's hash once the page is up opens that question too. */
export const FollowingALink: Story = {
	beforeEach: () => {
		const before = window.location.href;
		return () => window.history.replaceState(null, "", before);
	},
	play: async ({ canvas }) => {
		const name = "Can you bake without nuts?";
		await expect(question(canvas, name)).toHaveAttribute("aria-expanded", "false");
		window.history.replaceState(null, "", "#cake-allergens");
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		await waitFor(() => expect(question(canvas, name)).toHaveAttribute("aria-expanded", "true"));
	},
};

/** One question. */
export const OneQuestion: Story = {
	args: { items: questions.slice(0, 1) },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("button", { name: "Expand answer" })).toHaveLength(1);
	},
};

/** A phone keeps the link button and the chevron beside a question that wraps. */
export const Phone: Story = {
	globals: pin("phone"),
	args: {
		items: [
			{
				id: "long-question",
				question: `Can a ${unbroken} be ordered for a Saturday, and how early does it need to be asked for?`,
				answer: <p>Two days ahead, by noon.</p>,
			},
			...questions.slice(0, 2),
		],
	},
	play: async ({ canvas }) => {
		const head = within(
			row(
				canvas,
				`Can a ${unbroken} be ordered for a Saturday, and how early does it need to be asked for?`,
			),
		);
		const link = head.getByRole("button", { name: "Copy link to this question" });
		const chevron = head.getByRole("button", { name: "Expand answer" });
		await expect(Math.round(link.getBoundingClientRect().top)).toBe(
			Math.round(chevron.getBoundingClientRect().top),
		);
		await expectNoSidewaysScroll();
	},
};

/** Set straight after a heading, the list sits the block gap under it. */
export const UnderAHeading: Story = {
	play: async ({ canvas }) => {
		const heading = canvas.getByRole("heading", { level: 2 });
		const first = row(canvas, "When is the cutoff for a Saturday order?")
			.parentElement as HTMLElement;
		const gap = Number.parseFloat(getComputedStyle(first).getPropertyValue("--block-gap"));
		const between = first.getBoundingClientRect().top - heading.getBoundingClientRect().bottom;
		await expect(Math.round(between)).toBe(Math.round(gap));
	},
};
