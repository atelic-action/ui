import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { Card, Item } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * The workhorse row: a title line (the name, and the one value that matters
 * in the accent), a subline of facts joined by middots, a sentence or two,
 * an optional fold, and an optional link. The accent value at 12px fails
 * contrast on the paper, so every story is marked.
 */
const meta = {
	title: "Email/Item",
	component: Item,
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	decorators: [
		(Story) => (
			<Card>
				<Story />
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: {
		name: "Larkspur Coffee Bar",
		right: "4 trays",
		subparts: ["Standing order", "Mon to Sat", "06:15 drop"],
		body: "Asked to add a second tray of morning buns on Saturdays from December.",
		last: true,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The title line, the subline, and the body. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const name = canvas.getByText("Larkspur Coffee Bar").getBoundingClientRect();
		const value = canvas.getByText("4 trays").getBoundingClientRect();
		await expect(value.left).toBeGreaterThanOrEqual(name.right);
		await expect(Math.abs(value.top - name.top)).toBeLessThan(8);
		await expect(canvas.getByText("Standing order · Mon to Sat · 06:15 drop")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** Every part: a fold that opens on a press, and a link. */
export const Everything: Story = {
	args: {
		foldLabel: "what they order",
		foldBody: "Two trays of morning buns, one country loaf tray, one rye.",
		linkText: "Open the account",
		url: "https://example.test/accounts/larkspur",
	},
	play: async ({ canvas, canvasElement, step }) => {
		await step("the link goes to the account", async () => {
			await expect(canvas.getByRole("link", { name: "Open the account →" })).toHaveAttribute(
				"href",
				"https://example.test/accounts/larkspur",
			);
		});
		await step("the fold opens on a press of its summary", async () => {
			const fold = canvas.getByText(/what they order/);
			await expect(canvas.getByText(/Two trays of morning buns/)).not.toBeVisible();
			await userEvent.click(fold);
			await expect(canvas.getByText(/Two trays of morning buns/)).toBeVisible();
		});
		await fitsTheColumn(canvasElement);
	},
};

/** Null and empty facts drop out of the subline. */
export const SparseFacts: Story = {
	args: { subparts: ["Trial", null, "", "Wed and Fri"], body: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Trial · Wed and Fri")).toBeVisible();
	},
};

/** No facts at all: an empty subline still renders under the title. */
export const NoFacts: Story = {
	args: { subparts: [], body: undefined },
};

/** Two items in one card: the first carries the hairline, the last closes clean. */
export const TwoInACard: Story = {
	render: (args) => (
		<>
			<Item {...args} last={false} />
			<Item
				{...args}
				name="Wicket Lane Deli"
				right="1 tray"
				subparts={["Standing order"]}
				body={undefined}
			/>
		</>
	),
	play: async ({ canvas }) => {
		const first = canvas.getByText("Larkspur Coffee Bar").getBoundingClientRect();
		const second = canvas.getByText("Wicket Lane Deli").getBoundingClientRect();
		await expect(second.top).toBeGreaterThanOrEqual(first.bottom);
	},
};

/** The longest realistic name on a phone wraps and keeps its value on the right. */
export const LongNamePhone: Story = {
	args: {
		name: "The Alder Street Reading Room and Tea House at the Old Mill",
		right: "paused 41d",
		subparts: ["Paused", "since 2026-10-02"],
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
