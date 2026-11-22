import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Stat, StatsRow } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** The row of `Stat` cells inside a title card: big numbers over small faint captions. */
const meta = {
	title: "Email/StatsRow",
	component: StatsRow,
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
		children: (
			<>
				<Stat n={13} caption="orders out" />
				<Stat n={41} caption="trays" />
				<Stat n="06:15" caption="first drop" />
			</>
		),
	},
	globals: pin("desktop"),
} satisfies Meta<typeof StatsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three stats across one line. */
export const Three: Story = {
	play: async ({ canvas, canvasElement }) => {
		const tops = ["13", "41", "06:15"].map((n) =>
			Math.round(canvas.getByText(n).getBoundingClientRect().top),
		);
		await expect(new Set(tops).size).toBe(1);
		await fitsTheColumn(canvasElement);
	},
};

/** On a phone three still share the line. */
export const ThreePhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		const tops = ["13", "41", "06:15"].map((n) =>
			Math.round(canvas.getByText(n).getBoundingClientRect().top),
		);
		await expect(new Set(tops).size).toBe(1);
		await fitsTheColumn(canvasElement);
	},
};

/** Five long captions on a phone wrap under their numbers rather than widen the card. */
export const CrowdedPhone: Story = {
	args: {
		children: (
			<>
				<Stat n={13} caption="orders out the door" />
				<Stat n={41} caption="trays on the vans" />
				<Stat n="06:15" caption="first drop of the day" />
				<Stat n={2} caption="cafes still proofing" />
				<Stat n="1,284" caption="loaves this week" />
			</>
		),
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
