import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Separator } from "../../../src/app/ui";

/** A hairline between blocks, across or down. Decorative by default, so a reader skips it. */
const meta = {
	title: "App/UI/Separator",
	component: Separator,
	parameters: { layout: "padded" },
	render: (args) => (
		<div className="max-w-sm">
			<p>Morning bake</p>
			<Separator {...args} className="my-3" />
			<p>Afternoon bake</p>
		</div>
	),
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Across, decorative: no role. */
export const Horizontal: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("separator")).toBeNull();
	},
};

/** A separator that means something is announced as one. */
export const Semantic: Story = {
	args: { decorative: false },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("separator")).toBeInTheDocument();
	},
};

/** Down, between two items on a line. */
export const Vertical: Story = {
	args: { orientation: "vertical", decorative: false },
	render: (args) => (
		<div className="flex h-6 items-center gap-3">
			<span>06:15</span>
			<Separator {...args} />
			<span>Larkspur Coffee Bar</span>
		</div>
	),
	play: async ({ canvas }) => {
		const line = canvas.getByRole("separator");
		await expect(line).toHaveAttribute("aria-orientation", "vertical");
		await expect(Math.round(line.getBoundingClientRect().width)).toBe(1);
	},
};
