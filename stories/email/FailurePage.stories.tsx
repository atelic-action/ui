import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { FailurePage } from "../../src/email";
import { longLogTail } from "../fixtures/email-app";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * The email a runner sends when it did not run: the masthead, then a card
 * with the reason on top and the log's tail beneath. With a `step` or a
 * `fix` the reason becomes a labelled block of what failed, why, and what
 * to do. The fix's label wears the accent's ink. Both pages' logs break a
 * long path inside the card.
 */
const meta = {
	title: "Email/FailurePage",
	component: FailurePage,
	decorators: [inColumn],
	args: {
		runnerTitle: "Weekly Ops",
		eyebrowText: "2026-W47",
		reason: "The wholesale ledger was not where the runner looks for it.",
		logTail: "2026-11-16 05:02:14 error: the ledger export is missing\n2026-11-16 05:02:14 exit 1",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof FailurePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The plain page: the headline names the runner, the reason, then the log. */
export const Plain: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByText("The weekly ops did not run.")).toBeVisible();
		const reason = canvas.getByText(/not where the runner looks/).getBoundingClientRect();
		await expect(canvas.getByText(/exit 1/).getBoundingClientRect().top).toBeGreaterThan(
			reason.bottom,
		);
		await expect(canvas.queryByText("What Failed")).toBeNull();
		await fitsTheColumn(canvasElement);
	},
};

/** With a step and a fix: labelled blocks for what failed, why, and what to do, then the log. */
export const Structured: Story = {
	args: {
		step: "Reading the wholesale ledger",
		fix: "Export the ledger again: bakehouse ledger export --week 2026-W47",
	},
	play: async ({ canvas, canvasElement }) => {
		const labels = ["What Failed", "Why", "What to Do", "Log"].map(
			(label) => canvas.getByText(label).getBoundingClientRect().top,
		);
		await expect([...labels].sort((a, b) => a - b)).toEqual(labels);
		await expect(canvas.getByText("Reading the wholesale ledger")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** A fix alone, with no step, still makes it structured; an empty reason drops its block. */
export const FixOnly: Story = {
	args: { fix: "Run it again after 06:00.", reason: " " },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("What to Do")).toBeVisible();
		await expect(canvas.queryByText("Why")).toBeNull();
		await expect(canvas.queryByText("What Failed")).toBeNull();
	},
};

/** A step with no log: no Log block. */
export const NoLog: Story = {
	args: { step: "Reading the wholesale ledger", logTail: "" },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText("Log")).toBeNull();
	},
};

/** Structured on a phone, a long path in the log and the fix wraps inside the card. */
export const StructuredLongPathPhone: Story = {
	args: {
		step: "Reading the wholesale ledger",
		fix: "Restore /srv/bakehouse/runners/weekly_ops/cache/ledger_2026W47_wholesale_accounts_export.json from last night's copy.",
		logTail: longLogTail,
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};

/**
 * The plain page on a phone with the same long path in its log, which breaks
 * inside the card as the structured page's does.
 */
export const PlainLongPathPhone: Story = {
	args: { logTail: longLogTail },
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
