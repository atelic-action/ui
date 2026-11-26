import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, type Day, DayStrip, SubEyebrow } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

const week: Day[] = [
	{ label: "Mon", entries: [{ name: "Rye" }, { name: "Country", strong: true }] },
	{ label: "Tue", entries: [{ name: "Buns" }] },
	{ label: "Wed", entries: [] },
	{ label: "Thu", entries: [{ name: "Knots", badge: "S" }] },
	{ label: "Fri", entries: [{ name: "Seeded", strong: true, badge: "W" }, { name: "Rye" }] },
	{ label: "Sat", entries: [{ name: "Buns" }, { name: "Knots" }, { name: "Country" }] },
	{ label: "Sun", entries: [] },
];

/**
 * Shows a week, day by day, across one row of an email. Monday to Sunday
 * across a card row, each day's entries top aligned under a heavy rule: plain,
 * strong, or with a badge.
 */
const meta = {
	title: "Email/DayStrip",
	component: DayStrip,
	decorators: [
		(Story) => (
			<Card>
				<SubEyebrow text="The week's bakes" />
				<Story />
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { days: week, last: true },
	globals: pin("desktop"),
} satisfies Meta<typeof DayStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Seven days on one line, each entry under its day. */
export const AWeek: Story = {
	play: async ({ canvas, canvasElement }) => {
		const tops = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) =>
			Math.round(canvas.getByText(d).getBoundingClientRect().top),
		);
		await expect(new Set(tops).size).toBe(1);
		const sat = canvas.getByText("Sat").getBoundingClientRect();
		const satCell = canvas.getByText(/BunsKnotsCountry/).getBoundingClientRect();
		await expect(Math.abs(satCell.left - sat.left)).toBeLessThan(2);
		await expect(canvas.getAllByText("Country")[0].tagName).toBe("B");
		await fitsTheColumn(canvasElement);
	},
};

/** An empty week still draws its seven days. */
export const Empty: Story = {
	args: { days: week.map((day) => ({ ...day, entries: [] })) },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Sun")).toBeVisible();
	},
};

/**
 * On a phone the seven days share about 45px each, so a word wider than that
 * ("sourdough" at 12px is about 55px) breaks inside its day rather than
 * holding the strip open.
 */
export const LongNamesPhone: Story = {
	args: {
		days: week.map((day) => ({
			...day,
			entries: day.entries.map((entry) => ({ ...entry, name: `${entry.name} sourdough` })),
		})),
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};

/** Short names, as a strip usually carries, fit a phone. */
export const ShortNamesPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
