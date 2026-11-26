import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, LeadRow, List, ListRow, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * Sets a short list of lines inside an email's row or fold. A hairline list
 * inside a row or a fold, one `ListRow` per line, set at the size it is given.
 */
const meta = {
	title: "Email/List",
	component: List,
	decorators: [
		(Story) => (
			<Card>
				<Row last>
					What moved this week
					<Story />
				</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: {
		fontSize: "14px",
		children: (
			<>
				<ListRow>Larkspur added a Saturday tray.</ListRow>
				<ListRow>Fairhaven moved to Wednesday and Friday.</ListRow>
				<ListRow>Alder Street paused for the refit.</ListRow>
			</>
		),
	},
	globals: pin("desktop"),
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three lines, stacked on hairlines, at the size given. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const line = canvas.getByText("Larkspur added a Saturday tray.");
		await expect(getComputedStyle(line).fontSize).toBe("14px");
		await expect(getComputedStyle(line).borderTopWidth).toBe("1px");
		await fitsTheColumn(canvasElement);
	},
};

/** Smaller, as inside a fold. */
export const Small: Story = {
	args: { fontSize: "12px" },
	play: async ({ canvas }) => {
		await expect(
			getComputedStyle(canvas.getByText("Larkspur added a Saturday tray.")).fontSize,
		).toBe("12px");
	},
};

/** Lead rows: each line opens on a bolded word. */
export const LeadRows: Story = {
	args: {
		children: (
			<>
				<LeadRow lead="Larkspur" rest="added a Saturday tray." />
				<LeadRow lead="Fairhaven" rest="moved to Wednesday and Friday." />
			</>
		),
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Larkspur").tagName).toBe("B");
	},
};

/** On a phone long lines wrap inside the card. */
export const LongLinesPhone: Story = {
	args: {
		children: (
			<>
				<ListRow>
					The Alder Street Reading Room and Tea House at the Old Mill paused its standing order
					while the kitchen is refitted.
				</ListRow>
				<ListRow>
					Wicket Lane Deli asked for its trays before 06:00 from the first of the month.
				</ListRow>
			</>
		),
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
