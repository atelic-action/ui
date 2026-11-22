import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SecondaryButton } from "../../src/primitives";

/** The large ghost beside a page's call to action, always second. */
const meta = {
	title: "Primitives/SecondaryButton",
	component: SecondaryButton,
	parameters: { layout: "padded" },
	args: { children: "See the menu", href: "/menu" },
} satisfies Meta<typeof SecondaryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "See the menu" })).toHaveAttribute(
			"href",
			"/menu",
		);
	},
};

/** On a dark band it takes `onDark`, the light words and ring. */
export const OnDark: Story = {
	args: { onDark: true },
	decorators: [
		(Story) => (
			<div style={{ background: "var(--surface-dark)", padding: 24 }}>
				<Story />
			</div>
		),
	],
};

export const LongLabel: Story = {
	args: { children: "Read about the wholesale program for cafes" },
};
