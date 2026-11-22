import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { PrimaryButton } from "../../src/primitives";
import { knownIssues } from "../support/known-issues";

/** A page's call to action: the large primary with the arrow, one fixed shape. */
const meta = {
	title: "Primitives/PrimaryButton",
	component: PrimaryButton,
	tags: ["known-issue"],
	parameters: { layout: "padded", ...knownIssues("white-on-primary") },
	args: { children: "Order ahead", href: "/order" },
} satisfies Meta<typeof PrimaryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Order ahead" });
		await expect(link).toHaveAttribute("href", "/order");
	},
};

/** On the primary field (a split hero, a callout band) it turns to the page surface. */
export const OnPrimaryField: Story = {
	decorators: [
		(Story) => (
			<div className="on-primary" style={{ background: "var(--primary)", padding: 24 }}>
				<Story />
			</div>
		),
	],
};

export const LongLabel: Story = {
	args: { children: "Order a cake for Saturday pickup at the counter" },
};
