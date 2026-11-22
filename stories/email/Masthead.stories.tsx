import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Masthead, Row } from "../../src/email";
import { pin } from "../support/viewports";

/**
 * The email kit is inline styled tables with no sheet at all, so an `Email/`
 * story renders rows: the decorator supplies the email theme, a 680 column
 * table to hold them, and the email's ground (`.storybook/decorators.tsx`).
 */
const meta = {
	title: "Email/Masthead",
	component: Masthead,
	args: { title: "The week at the bakehouse" },
} satisfies Meta<typeof Masthead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("atelic")).toBeVisible();
		await expect(canvas.getByText("The week at the bakehouse")).toBeVisible();
	},
};

/** A quiet fact at the right end of the row rides the title's line while it fits. */
export const WithMeta: Story = {
	args: { meta: "2026-W47" },
	play: async ({ canvas }) => {
		const title = canvas.getByText("The week at the bakehouse").getBoundingClientRect();
		const fact = canvas.getByText("2026-W47").getBoundingClientRect();
		await expect(fact.left).toBeGreaterThan(title.right);
		await expect(Math.abs(fact.top - title.top)).toBeLessThan(12);
	},
};

/** On a phone the fact drops under the title, still right aligned, rather than squashing it. */
export const WithMetaPhone: Story = {
	args: { meta: "2026-W47", title: "The week at Kestrel Hollow Bakehouse" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const title = canvas.getByText("The week at Kestrel Hollow Bakehouse").getBoundingClientRect();
		const fact = canvas.getByText("2026-W47").getBoundingClientRect();
		await expect(fact.top).toBeGreaterThanOrEqual(title.bottom - 1);
	},
};

/** A client branded email names its own wordmark. */
export const ClientWordmark: Story = {
	args: { wordmark: "kestrel hollow" },
};

/** The masthead over a card, the way a runner's email opens. */
export const OverACard: Story = {
	render: (args) => (
		<>
			<Masthead {...args} />
			<Card>
				<Row last>Eleven cafes took the morning bake; two asked about Saturdays.</Row>
			</Card>
		</>
	),
	play: async ({ canvas }) => {
		const masthead = canvas.getByText("The week at the bakehouse").getBoundingClientRect();
		const card = canvas.getByText(/Eleven cafes took the morning bake/).getBoundingClientRect();
		await expect(card.top).toBeGreaterThan(masthead.bottom);
	},
};
