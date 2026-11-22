import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, type within } from "storybook/test";
import { ExpandList } from "../../src/sections";
import { unbroken } from "../fixtures/sections";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A light accordion of numbered rows, each folding out its body.
 */
const meta = {
	title: "Sections/ExpandList",
	component: ExpandList,
	args: {
		items: [
			{
				title: "Boxes and bags",
				body: (
					<p>
						Every order leaves in a paper bag or a box; bring your own and we{" "}
						<a href="/visit#bring-a-bag">knock a quarter off</a>.
					</p>
				),
			},
			{ title: "Slicing", body: <p>Any loaf, thick or thin, on the counter's slicer.</p> },
			{ title: "Gift cards", body: <p>Any amount, at the counter or by phone.</p> },
		],
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<h2>At the counter</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ExpandList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Whether a reader can see the element: the page at its middle is the element itself. */
function seen(element: Element) {
	const box = element.getBoundingClientRect();
	const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
	return hit !== null && (hit === element || element.contains(hit));
}

const row = (canvas: ReturnType<typeof within>, name: RegExp) =>
	canvas.getByRole("button", { name });

/**
 * Closed, a row's body is out of sight and out of the tab order; a click
 * opens it, a second click closes it, and each row keeps its own state.
 */
export const OpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const boxes = row(canvas, /Boxes and bags/);
		const link = () => canvas.getByRole("link", { name: "knock a quarter off", hidden: true });
		await step("every row starts closed, its index before its title", async () => {
			for (const button of canvas.getAllByRole("button")) {
				await expect(button).toHaveAttribute("aria-expanded", "false");
			}
			await expect(boxes).toHaveTextContent(/^01\s*Boxes and bags/);
			// A closed body is inert: its link refuses focus even when asked for it.
			link().focus();
			await expect(link()).not.toHaveFocus();
			await expect(seen(link())).toBe(false);
		});
		await step("a click opens the row and its link joins the tab order", async () => {
			await userEvent.click(boxes);
			await expect(boxes).toHaveAttribute("aria-expanded", "true");
			await waitFor(() => expect(seen(link())).toBe(true));
			await userEvent.tab();
			await expect(link()).toHaveFocus();
		});
		await step("the other rows stay as they were", async () => {
			await expect(row(canvas, /Slicing/)).toHaveAttribute("aria-expanded", "false");
		});
		await step("a second click closes it, focus staying on the row", async () => {
			await userEvent.click(boxes);
			await expect(boxes).toHaveAttribute("aria-expanded", "false");
			await expect(boxes).toHaveFocus();
			link().focus();
			await expect(link()).not.toHaveFocus();
		});
	},
};

/**
 * The keyboard: Tab reaches the first row, Enter opens it, Tab walks into its
 * open body and on to the next row, and Space toggles that one.
 */
export const Keyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const boxes = row(canvas, /Boxes and bags/);
		const slicing = row(canvas, /Slicing/);
		await step("Tab lands on the first row and Enter opens it", async () => {
			await userEvent.tab();
			await expect(boxes).toHaveFocus();
			await userEvent.keyboard("{Enter}");
			await expect(boxes).toHaveAttribute("aria-expanded", "true");
		});
		await step("Tab walks through the open body to the next row", async () => {
			await userEvent.tab();
			await expect(canvas.getByRole("link", { name: "knock a quarter off" })).toHaveFocus();
			await userEvent.tab();
			await expect(slicing).toHaveFocus();
		});
		await step("Space opens the row, and again closes it", async () => {
			await userEvent.keyboard(" ");
			await expect(slicing).toHaveAttribute("aria-expanded", "true");
			await userEvent.keyboard(" ");
			await expect(slicing).toHaveAttribute("aria-expanded", "false");
		});
	},
};

/** Every body ships in the page while closed, for a crawler. */
export const BodiesInThePage: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/on the counter's slicer/)).toBeInTheDocument();
	},
};

/** An empty list draws nothing. */
export const Empty: Story = {
	args: { items: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/** Ten rows and more, the index two digits wide, the longest titles on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		items: Array.from({ length: 11 }, (_, i) => ({
			title: `Boxes, bags, and the paper wrap for the seeded rye on a Thursday, number ${i + 1}`,
			body: <p>Every order leaves in a paper bag or a box.</p>,
		})),
	},
	play: async ({ canvas, userEvent }) => {
		await expect(row(canvas, /^11/)).toBeVisible();
		await userEvent.click(row(canvas, /^01/));
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/**
 * One unbroken word in a row's title, on a phone. The title never breaks
 * inside a word, so the row, and the page, scroll sideways.
 */
export const UnbrokenWord: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: { items: [{ title: unbroken, body: <p>The guild's prize loaf.</p> }] },
	play: async () => {
		await knownBug("expand-long-word-overflow", async () => {
			await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		});
	},
};
