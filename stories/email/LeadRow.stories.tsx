import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, LeadRow, List, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** A list line that opens on a bolded lead in the ink, the rest dim. */
const meta = {
	title: "Email/LeadRow",
	component: LeadRow,
	decorators: [
		(Story) => (
			<Card>
				<Row last>
					<List fontSize="14px">
						<Story />
					</List>
				</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { lead: "Larkspur", rest: "added a Saturday tray of morning buns." },
	globals: pin("desktop"),
} satisfies Meta<typeof LeadRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The lead and the rest on one line, a space between them. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const lead = canvas.getByText("Larkspur");
		await expect(lead.parentElement).toHaveTextContent(
			"Larkspur added a Saturday tray of morning buns.",
		);
		await fitsTheColumn(canvasElement);
	},
};

/** A long lead and rest on a phone wrap together. */
export const LongPhone: Story = {
	args: {
		lead: "The Alder Street Reading Room",
		rest: "paused its standing order on 2026-10-02 while the kitchen is refitted, and asked to be called before it resumes.",
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
