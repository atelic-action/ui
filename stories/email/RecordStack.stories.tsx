import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, RecordStack, Row } from "../../src/email";
import { wholesaleRecords } from "../fixtures/email-app";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * One record per row, stacked: the title with its pills, an optional
 * timeline, a mono meta line with an aside at its right, a note, and a
 * callout. No fixed columns, so a name of any length wraps on a phone. The
 * accent pill and callout eyebrow, and the warm aside, fail contrast as
 * words, so the stories that show them are marked.
 */
const meta = {
	title: "Email/RecordStack",
	component: RecordStack,
	decorators: [
		(Story) => (
			<Card>
				<Row last>
					<Story />
				</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { records: wholesaleRecords },
	globals: pin("desktop"),
} satisfies Meta<typeof RecordStack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three records with every part between them: pills, timelines, asides, a note, a callout. */
export const Accounts: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("link", { name: "Larkspur Coffee Bar" })).toHaveAttribute(
			"href",
			"https://example.test/accounts/larkspur",
		);
		const title = canvas.getByRole("link", { name: "Larkspur Coffee Bar" }).getBoundingClientRect();
		const pill = canvas.getByText("Active").getBoundingClientRect();
		await expect(Math.abs(pill.top - title.top)).toBeLessThan(10);
		await expect(pill.left).toBeGreaterThan(title.right);
		await expect(canvas.getByText("Standing order · Mon to Sat · 06:15 drop")).toBeVisible();
		// An empty meta part drops.
		await expect(canvas.getByText("Paused · since 2026-10-02")).toBeVisible();
		await expect(
			canvas.getByText("Send the spring price sheet before the trial ends."),
		).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** A record with nothing but its title and meta, as before the pills. */
export const Plain: Story = {
	args: { records: [{ title: "Wicket Lane Deli", meta: ["Standing order", "07:30 drop"] }] },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Wicket Lane Deli")).toBeVisible();
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

/** No records: an empty table. */
export const Empty: Story = { args: { records: [] } };

/** On a phone the longest name wraps beside its pills and nothing widens the card. */
export const AccountsPhone: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
