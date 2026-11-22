import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Runs } from "../../src/artifact";
import { inWrap } from "../primitives/support";

/**
 * A paragraph's runs alone, for a container that is not a paragraph: a list
 * item, a table cell. The same text, links, and queries as `Paragraph`.
 */
const meta = {
	title: "Artifact/Runs",
	component: Runs,
	decorators: [inWrap],
	args: {
		paragraph: [
			"Order by Friday noon, or ",
			{ text: "order ahead online", href: "https://order.example.com" },
			" for ",
			{ query: "saturday pickup" },
			".",
		],
	},
	render: (args) => (
		<ul>
			<li>
				<Runs {...args} />
			</li>
		</ul>
	),
} satisfies Meta<typeof Runs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inside a list item, with no paragraph of its own around the words. */
export const InAListItem: Story = {
	play: async ({ canvas, canvasElement }) => {
		const item = canvas.getByRole("listitem");
		await expect(item).toHaveTextContent(
			"Order by Friday noon, or order ahead online for “saturday pickup”.",
		);
		await expect(canvasElement.querySelector("p")).toBeNull();
		await expect(canvas.getByRole("link", { name: "order ahead online" })).toHaveAttribute(
			"target",
			"_blank",
		);
	},
};

/** A plain string is the words alone. */
export const PlainString: Story = {
	args: { paragraph: "Sourdough, rye, and the morning buns." },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("listitem")).toHaveTextContent(
			"Sourdough, rye, and the morning buns.",
		);
	},
};

/** In a table cell. */
export const InATableCell: Story = {
	render: (args) => (
		<table>
			<tbody>
				<tr>
					<th scope="row">Saturday</th>
					<td>
						<Runs {...args} />
					</td>
				</tr>
			</tbody>
		</table>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("cell")).toHaveTextContent(/order ahead online/);
	},
};
