import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, List, ListRow, Row } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/** One line of a `List`, on a hairline above it. */
const meta = {
	title: "Email/ListRow",
	component: ListRow,
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
	args: { children: "Larkspur added a Saturday tray." },
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByText("Larkspur added a Saturday tray.")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** A line holding a link. */
export const WithALink: Story = {
	args: {
		children: (
			<>
				Fairhaven's trial ends Friday:{" "}
				<a href="https://example.test/accounts/fairhaven">the account</a>
			</>
		),
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "the account" })).toHaveAttribute(
			"href",
			"https://example.test/accounts/fairhaven",
		);
	},
};
