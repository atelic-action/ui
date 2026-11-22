import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Badge, Card, Row } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/**
 * A single letter in a hairline box after the word it tags (S for social),
 * in the accent at 9px: 3.31:1 on the paper, which axe does not report
 * (stories/findings/email-app.md, Checker Limits). Its
 * letter is all a reader gets: nothing says what S stands for.
 */
const meta = {
	title: "Email/Badge",
	component: Badge,
	decorators: [inColumn],
	args: { letter: "S" },
	render: (args) => (
		<Card>
			<Row last>
				Cardamom knots
				<Badge {...args} />
			</Row>
		</Card>
	),
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** After the word it tags, on the same line. */
export const AfterAWord: Story = {
	play: async ({ canvas, canvasElement }) => {
		const badge = canvas.getByText("S");
		await expect(badge.parentElement).toHaveTextContent("Cardamom knotsS");
		const word = canvas.getByText(/Cardamom knots/).getBoundingClientRect();
		await expect(badge.getBoundingClientRect().top).toBeGreaterThanOrEqual(word.top);
		await expect(badge.getBoundingClientRect().bottom).toBeLessThanOrEqual(word.bottom);
		await fitsTheColumn(canvasElement);
	},
};

/** Another letter. */
export const Wholesale: Story = { args: { letter: "W" } };
