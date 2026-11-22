import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Footer, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * One quiet line at the foot of the email: the run's facts. It is the faint
 * ink on the ground at 11px, the recorded failure, so every story is marked.
 */
const meta = {
	title: "Email/Footer",
	component: Footer,
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	decorators: [inColumn],
	args: { meta: "weekly-ops · ran 2026-11-16 05:02 · 41 orders read · 3.2s" },
	render: (args) => (
		<>
			<Card>
				<Row last>Thirteen orders out the door.</Row>
			</Card>
			<Footer {...args} />
		</>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Under the last card. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const foot = canvas.getByText(/weekly-ops/);
		await expect(foot.getBoundingClientRect().top).toBeGreaterThan(
			canvas.getByText("Thirteen orders out the door.").getBoundingClientRect().bottom,
		);
		await fitsTheColumn(canvasElement);
	},
};

/** A long line of facts wraps on a phone. */
export const LongPhone: Story = {
	args: {
		meta: "weekly-ops · ran 2026-11-16 05:02 Mountain · 41 orders read · 13 cafes · 2 trials · ledger 2026-W47-wholesale-accounts-export · 3.2s",
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
